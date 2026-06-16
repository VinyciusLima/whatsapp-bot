const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client({
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

const PIX_CONFIG = {
  contato: '554899824325@c.us',
  chave_pix: '45800339813',
  valor_parcela: 587.48,
  parcelas_total: 19,
  data_inicio: new Date('2026-05-30') // primeira parcela
};

client.on('qr', (qr) => {
  console.log('\n📱 ESCANEIE ESTE QR CODE:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ WhatsApp pronto! Agendamentos ativos.\n');
  agendar_mensagens();
});

client.initialize();

// ─── Cálculo de parcelas ────────────────────────────────────────────────────

function calcular_parcelas() {
  const hoje = new Date();
  const inicio = PIX_CONFIG.data_inicio;

  // Quantos meses completos se passaram desde o início
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12
            + (hoje.getMonth() - inicio.getMonth());

  // Se ainda não chegou no dia de vencimento deste mês, não conta o mês atual
  if (hoje.getDate() < 30) meses = Math.max(0, meses - 1);
  else meses = Math.max(0, meses);

  const pagas = Math.min(meses, PIX_CONFIG.parcelas_total);
  const faltantes = PIX_CONFIG.parcelas_total - pagas;
  const proxima = pagas + 1;

  return { pagas, faltantes, proxima };
}

function ordinal(n) {
  return n + 'ª';
}

// ─── Geração de mensagens ───────────────────────────────────────────────────

function gerar_mensagem(dia) {
  const { faltantes, proxima } = calcular_parcelas();
  const valor_restante = (faltantes * PIX_CONFIG.valor_parcela).toFixed(2);
  const ord = ordinal(proxima);
  const valor = PIX_CONFIG.valor_parcela.toFixed(2);
  const pix = PIX_CONFIG.chave_pix;

  if (dia === 20 || dia === 25) {
    return `💳 *Tá chegando!* 📅\n\n` +
           `E aí! Tudo certo? Só um lembrete: tá chegando o vencimento da ${ord} parcela do acordo.\n\n` +
           `Se quiser já ir se adiantando, segue os dados:\n\n` +
           `🔑 PIX: ${pix}\n` +
           `💰 Valor: R$ ${valor}\n\n` +
           `Parcela: ${ord} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Sem pressa, mas fica na mente aí! 😉`;
  }
  if (dia === 29) {
    return `⚠️ *É amanhã mesmo!* 🚨\n\n` +
           `E aí, beleza? Só um toque: amanhã é o último dia pra pagar a ${ord} parcela.\n\n` +
           `Se não conseguir hoje, não deixa pra depois!\n\n` +
           `🔑 PIX: ${pix}\n` +
           `💰 Valor: R$ ${valor}\n\n` +
           `Parcela: ${ord} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Tá certo? Avisa se tiver alguma dúvida! 🙏`;
  }
  if (dia === 30) {
    return `🔴 *HOJE É O ÚLTIMO DIA!* ⏰\n\n` +
           `Ó, é hoje mesmo! Último dia pra pagar a ${ord} parcela.\n\n` +
           `Faz o PIX agora e fica tranquilo:\n\n` +
           `🔑 PIX: ${pix}\n` +
           `💰 Valor: R$ ${valor}\n\n` +
           `Parcela: ${ord} de ${PIX_CONFIG.parcelas_total}\n` +
           `Faltam: ${faltantes} parcelas\n` +
           `Total restante: R$ ${valor_restante}\n\n` +
           `Me avisa quando conseguir fazer, blz? Valeu! 💪`;
  }
}

// ─── Agendamentos cron ──────────────────────────────────────────────────────
// Formato: segundo minuto hora dia mês dia-semana
// Timezone America/Sao_Paulo para bater certo

function agendar_mensagens() {
  const hora = '09:00'; // horário de envio — ajuste se quiser
  const [h, m] = hora.split(':');

  const agendamentos = [
    { dia: 20, descricao: 'Lembrete inicial' },
    { dia: 25, descricao: 'Segundo lembrete' },
    { dia: 29, descricao: 'Véspera' },
    { dia: 30, descricao: 'Último dia' },
  ];

  for (const { dia, descricao } of agendamentos) {
    // Cron: minuto hora dia * * (todo mês, naquele dia)
    const expr = `${m} ${h} ${dia} * *`;

    cron.schedule(expr, async () => {
      console.log(`\n📤 [Dia ${dia}] ${descricao} — enviando...`);
      try {
        await client.sendMessage(PIX_CONFIG.contato, gerar_mensagem(dia));
        console.log(`✅ [Dia ${dia}] Mensagem enviada!`);
      } catch (e) {
        console.error(`❌ [Dia ${dia}] Erro:`, e.message);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`📅 Agendado: dia ${dia} de cada mês às ${hora} — ${descricao}`);
  }
}