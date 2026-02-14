const TelegramBot = require("node-telegram-bot-api")
const getRawBody = require("raw-body")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 🔎 Cek apakah token terbaca saat cold start
console.log("TOKEN:", process.env.TELEGRAM_BOT_TOKEN)

module.exports = async (req, res) => {
  console.log("METHOD:", req.method)

  if (req.method !== "POST") {
    return res.status(200).send("Bot is running")
  }

  try {
    const rawBody = await getRawBody(req)
    const update = JSON.parse(rawBody.toString())

    // 🔎 Lihat update yang masuk dari Telegram
    console.log("UPDATE:", JSON.stringify(update, null, 2))

    if (update.message?.text === "/start") {
        const chat = update.message.chat

        await supabase.from("users").upsert({
            telegram_id: chat.id,
            username: chat.username || null,
        })

        await bot.sendMessage(
            chat.id,
            "Kamu sudah terdaftar di sistem 🚀"
        )
    }

    return res.status(200).send("OK")
  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(500).send("Error")
  }
}
