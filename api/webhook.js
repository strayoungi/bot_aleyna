const TelegramBot = require("node-telegram-bot-api")
const getRawBody = require("raw-body")
const { createClient } = require("@supabase/supabase-js")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_ID = 8504439872 // ganti dengan telegram ID kamu


// =========================
// HELPER FUNCTIONS
// =========================

async function broadcast(message) {
  const { data: users, error } = await supabase
    .from("users")
    .select("telegram_id")

  if (error) throw error

  for (const user of users) {
    try {
      await bot.sendMessage(user.telegram_id, message)
    } catch (err) {
      console.error("Failed send to", user.telegram_id)
    }
  }
}


// =========================
// MAIN HANDLER
// =========================

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running")
  }

  try {
    const rawBody = await getRawBody(req)
    const update = JSON.parse(rawBody.toString())

    if (!update.message) {
      return res.status(200).send("OK")
    }

    const chatId = update.message.chat.id
    const text = update.message.text || ""


    // ===== /start =====
    if (text === "/start") {

      await supabase.from("users").upsert({
        telegram_id: chatId,
        username: update.message.chat.username || null
      })

      await bot.sendMessage(chatId, "Kamu sudah terdaftar ✅")
    }


    // ===== /broadcast =====
    if (text.startsWith("/broadcast")) {

      if (chatId !== ADMIN_ID) {
        return res.status(200).send("OK")
      }

      const message = text.replace("/broadcast ", "")
      await broadcast(message)

      await bot.sendMessage(chatId, "Broadcast selesai 🚀")
    }


    return res.status(200).send("OK")

  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(500).send("Error")
  }
}
