const TelegramBot = require("node-telegram-bot-api")
const { createClient } = require("@supabase/supabase-js")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async (req, res) => {

  // 🔐 AUTH CHECK
  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send("Unauthorized")
  }

  try {
    const now = new Date().toISOString()

    const { data: reminders, error } = await supabase
      .from("reminders")
      .select(`
        id,
        message,
        users ( telegram_id )
      `)
      .eq("sent", false)
      .lte("remind_at", now)
      .limit(50) // 🔥 batasi per run

    if (error) throw error
    if (!reminders || reminders.length === 0) {
      return res.status(200).json({ message: "No reminders" })
    }

    for (const reminder of reminders) {

      const chatId = reminder.users?.telegram_id
      if (!chatId) continue

      try {
        await bot.sendMessage(chatId, reminder.message)
      } catch (err) {
        console.error("Telegram error:", err.message)
      }

      await supabase
        .from("reminders")
        .update({ sent: true })
        .eq("id", reminder.id)
    }

    return res.status(200).json({
      success: true,
      processed: reminders.length
    })

  } catch (err) {
    console.error("CRON ERROR:", err)
    return res.status(500).send("Server Error")
  }
}
