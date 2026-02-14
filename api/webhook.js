const TelegramBot = require("node-telegram-bot-api")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, "Halo dari Vercel 🚀")
})

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running")
  }

  try {
    const update = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body

    await bot.processUpdate(update)

    return res.status(200).send("OK")
  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(500).send("Error")
  }
}
