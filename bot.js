const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
  console.log('\n📱 ESCANEIE ESTE QR CODE COM WHATSAPP:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
  console.log('⏳ Aguardando 15 segundos antes de enviar...\n');
  
  setTimeout(() => {
    agendarMensagem();
  }, 15000);
});

client.on('disconnected', (reason) => {
  console.log('❌ Desconectado:', reason);
});

client.initialize();

async function agendarMensagem() {
  try {
    const numero = '554891629532@c.us'; // SEU NÚMERO
    const mensagem = 'Olá! Essa é uma mensagem agendada! 🎉';
    
    console.log('📱 Enviando para: 5548991629532');
    
    const resposta = await client.sendMessage(numero, mensagem);
    console.log('✅ Mensagem enviada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao enviar:', error.message);
  }
}