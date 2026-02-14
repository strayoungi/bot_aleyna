const TelegramBot = require("node-telegram-bot-api")
const { createClient } = require("@supabase/supabase-js")

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async (req, res) => {
  const now = new Date().toISOString()

  const { data: reminders } = await supabase
    .from("reminders")
    .select(`
      id,
      message,
      users ( telegram_id )
    `)
    .eq("sent", false)
    .lte("remind_at", now)

  for (const reminder of reminders) {
    await bot.sendMessage(
      reminder.users.telegram_id,
      reminder.message
    )

    await supabase
      .from("reminders")
      .update({ sent: true })
      .eq("id", reminder.id)
  }

  res.status(200).json({ success: true })
}
