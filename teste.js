const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

const PIX_CONFIG = {
  contato: '554884757229@c.us',
  chave_pix: '45800339813',
  valor_parcela: 587.48,
  parcelas_total: 18,
  data_inicio: new Date('2026-06-20')
};

client.on('qr', (qr) => {
  console.log('\n📱 ESCANEIE ESTE QR CODE:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ WhatsApp pronto!\n');
  enviar_todas_mensagens();
});

client.initialize();

function calcular_parcelas_faltantes() {
  const hoje = new Date();
  const data_inicio = PIX_CONFIG.data_inicio;
  
  const meses_passados = (hoje.getFullYear() - data_inicio.getFullYear()) * 12 + 
                         (hoje.getMonth() - data_inicio.getMonth());
  
  const parcelas_pagas = Math.max(0, meses_passados);
  const parcelas_faltantes = PIX_CONFIG.parcelas_total - parcelas_pagas;
  
  return {
    pagas: parcelas_pagas,
    faltantes: Math.max(0, parcelas_faltantes),
    proxima: parcelas_pagas + 1
  };
}

function obter_numero_ordinal(numero) {
  if (numero === 1) return '1ª';
  if (numero === 2) return '2ª';
  if (numero === 3) return '3ª';
  if (numero === 21) return '21ª';
  if (numero === 22) return '22ª';
  if (numero === 23) return '23ª';
  return numero + 'ª';
}

function gerar_mensagem(dia) {
  const parcelas = calcular_parcelas_faltantes();
  const valor_restante = (parcelas.faltantes * PIX_CONFIG.valor_parcela).toFixed(2);
  const numero_ordinal = obter_numero_ordinal(parcelas.proxima);
  
  if (dia === 20 || dia === 25) {
    return `💳 *Tá chegando!* 📅\n\n` +
           `E aí! Tudo certo? Só um lembrete: tá chegando o vencimento da ${numero_ordinal} parcela do acordo.\n\n` +
           `Se quiser já ir se adiantando, segue os dados:\n\n` +
           `🔑 PIX: ${PIX_CONFIG.chave_pix}\n` +
           `💰 Valor: R$ ${PIX_CONFIG.valor_parcela.toFixed(2)}\n\n` +
           `Parcela: ${numero_ordinal} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${parcelas.faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Sem pressa, mas fica na mente aí! 😉`;
  } 
  else if (dia === 29) {
    return `⚠️ *É amanhã mesmo!* 🚨\n\n` +
           `E aí, beleza? Só um toque: amanhã é o último dia pra pagar a ${numero_ordinal} parcela.\n\n` +
           `Se não conseguir hoje, não deixa pra depois!\n\n` +
           `🔑 PIX: ${PIX_CONFIG.chave_pix}\n` +
           `💰 Valor: R$ ${PIX_CONFIG.valor_parcela.toFixed(2)}\n\n` +
           `Parcela: ${numero_ordinal} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${parcelas.faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Tá certo? Avisa se tiver alguma dúvida! 🙏`;
  }
  else if (dia === 30) {
    return `🔴 *HOJE É O ÚLTIMO DIA!* ⏰\n\n` +
           `Ó, é hoje mesmo! Último dia pra pagar a ${numero_ordinal} parcela.\n\n` +
           `Faz o PIX agora e fica tranquilo:\n\n` +
           `🔑 PIX: ${PIX_CONFIG.chave_pix}\n` +
           `💰 Valor: R$ ${PIX_CONFIG.valor_parcela.toFixed(2)}\n\n` +
           `Parcela: ${numero_ordinal} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${parcelas.faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Me avisa quando conseguir fazer, blz? Valeu! 💪`;
  }
}

async function enviar_todas_mensagens() {
  const dias = [20, 25, 29, 30];
  
  for (const dia of dias) {
    try {
      console.log(`📤 Enviando dia ${dia}...`);
      await client.sendMessage(PIX_CONFIG.contato, gerar_mensagem(dia));
      console.log(`✅ Dia ${dia} enviada!\n`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`❌ Erro dia ${dia}:`, e.message);
    }
  }
  
  console.log('🎉 Pronto! Verifique seu WhatsApp!\n');
}