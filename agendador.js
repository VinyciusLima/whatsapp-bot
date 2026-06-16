const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client();

// Dados do PIX
const PIX_CONFIG = {
  contato: '5548998243251@c.us', // 48 9982-4325
  chave_pix: '45800339813',
  valor_total: 587.48,
  parcelas_total: 18,
  valor_parcela: (587.48 / 18).toFixed(2),
  data_inicio: new Date('2025-01-20') // Data do primeiro pagamento
};

client.on('qr', (qr) => {
  console.log('\n📱 ESCANEIE ESTE QR CODE:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
  console.log('📅 Agendando mensagens de PIX...\n');
  
  agendar_dias_20_25_29_30();
});

client.on('disconnected', (reason) => {
  console.log('❌ Desconectado:', reason);
});

client.initialize();

// Função que calcula quantas parcelas faltam
function calcular_parcelas_faltantes() {
  const hoje = new Date();
  const data_inicio = new Date(PIX_CONFIG.data_inicio);
  
  // Calcula quantos meses passaram desde a data inicial
  const meses_passados = (hoje.getFullYear() - data_inicio.getFullYear()) * 12 + 
                         (hoje.getMonth() - data_inicio.getMonth());
  
  // Parcelas pagas (no mínimo 0)
  const parcelas_pagas = Math.max(0, meses_passados);
  
  // Parcelas faltantes
  const parcelas_faltantes = PIX_CONFIG.parcelas_total - parcelas_pagas;
  
  return {
    pagas: parcelas_pagas,
    faltantes: Math.max(0, parcelas_faltantes)
  };
}

// Função para gerar a mensagem
function gerar_mensagem(dia_do_mes) {
  const parcelas = calcular_parcelas_faltantes();
  
  // Mensagens diferentes conforme o dia
  let mensagem = '';
  
  if (dia_do_mes === 20 || dia_do_mes === 25) {
    mensagem = `💳 *LEMBRETE DE PAGAMENTO PIX*\n\n`;
    mensagem += `Olá! Tudo bem?\n\n`;
    mensagem += `📌 *Dados do PIX:*\n`;
    mensagem += `Chave: ${PIX_CONFIG.chave_pix}\n`;
    mensagem += `Valor: R$ ${PIX_CONFIG.valor_parcela}\n`;
    mensagem += `Parcela: ${PIX_CONFIG.parcelas_total - parcelas.faltantes + 1}/${PIX_CONFIG.parcelas_total}\n\n`;
    mensagem += `⏰ Faltam ainda: *${parcelas.faltantes} parcelas*\n`;
    mensagem += `📊 Valor total: R$ ${PIX_CONFIG.valor_total}`;
  } 
  else if (dia_do_mes === 29) {
    mensagem = `⚠️ *ATENÇÃO: ÚLTIMO DIA DO MÊS!*\n\n`;
    mensagem += `Olá! Esse é o último aviso do mês!\n\n`;
    mensagem += `📌 *Chave PIX:* ${PIX_CONFIG.chave_pix}\n`;
    mensagem += `💰 *Valor:* R$ ${PIX_CONFIG.valor_parcela}\n\n`;
    mensagem += `🔴 Faltam: *${parcelas.faltantes} parcelas*\n`;
    mensagem += `📅 Próximo lembrete: Dia 20 do próximo mês`;
  }
  else if (dia_do_mes === 30) {
    mensagem = `📌 *RESUMO MENSAL*\n\n`;
    mensagem += `Status: ${parcelas.faltantes > 0 ? '⏳ *Pendente*' : '✅ *Pago*'}\n\n`;
    mensagem += `Chave PIX: ${PIX_CONFIG.chave_pix}\n`;
    mensagem += `Valor parcela: R$ ${PIX_CONFIG.valor_parcela}\n\n`;
    mensagem += `📊 *Progresso:*\n`;
    mensagem += `✅ Pagas: ${PIX_CONFIG.parcelas_total - parcelas.faltantes}\n`;
    mensagem += `⏳ Faltam: ${parcelas.faltantes} parcelas\n\n`;
    mensagem += `💵 Valor total restante: R$ ${(parcelas.faltantes * parseFloat(PIX_CONFIG.valor_parcela)).toFixed(2)}`;
  }
  
  return mensagem;
}

// Função para enviar a mensagem
async function enviar_mensagem(dia) {
  try {
    const mensagem = gerar_mensagem(dia);
    console.log(`📤 Enviando mensagem do dia ${dia}...`);
    
    await client.sendMessage(PIX_CONFIG.contato, mensagem);
    console.log(`✅ Mensagem do dia ${dia} enviada com sucesso!\n`);
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem do dia ${dia}:`, error.message);
  }
}

// Agendar para os dias 20, 25, 29 e 30
function agendar_dias_20_25_29_30() {
  console.log('⏰ Agendamentos:');
  
  // Dia 20 às 09:00
  cron.schedule('0 18 20 * *', () => {
    console.log('🔔 Acionado: Dia 20 às 18:00');
    enviar_mensagem(20);
  });
  console.log('  ✓ Dia 20 às 18:00');
  
  // Dia 25 às 09:00
  cron.schedule('0 18 25 * *', () => {
    console.log('🔔 Acionado: Dia 25 às 18:00');
    enviar_mensagem(25);
  });
  console.log('  ✓ Dia 25 às 09:00');
  
  // Dia 29 às 18:00
  cron.schedule('0 18 29 * *', () => {
    console.log('🔔 Acionado: Dia 29 às 18:00');
    enviar_mensagem(29);
  });
  console.log('  ✓ Dia 29 às 18:00');
  
  // Dia 30 às 19:00
  cron.schedule('0 18 30 * *', () => {
    console.log('🔔 Acionado: Dia 30 às 19:00');
    enviar_mensagem(30);
  });
  console.log('  ✓ Dia 30 às 19:00\n');
  
  console.log('🟢 Sistema aguardando agendamentos...');
}