const TelegramBot = require("node-telegram-bot-api")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Halo dari Vercel 🚀")
})

module.exports = async (req, res) => {
  if (req.method === "POST") {
    try {
      await bot.processUpdate(req.body)
      res.status(200).send("OK")
    } catch (error) {
      console.error("Error:", error)
      res.status(500).send("Error")
    }
  } else {
    res.status(200).send("Bot is running")
  }
}
