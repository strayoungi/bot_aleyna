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
function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

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

  console.log("masuk")

  try {
    const rawBody = await getRawBody(req)
    const update = JSON.parse(rawBody.toString())

    if (!update.message) {
      return res.status(200).send("OK")
    }

    const chatId = update.message.chat.id
    const text = update.message.text || ""
    const username = update.message.from.first_name || "Unknown"


    // ===== /start =====
    if (text === "/start") {

      //await supabase.from("users").upsert({
      //  telegram_id: chatId,
      //  username: username || null
      //})

      //await bot.sendMessage(chatId, "Kamu sudah terdaftar ✅")
      await bot.sendMessage(chatId, `Hallo ${username}! Ada yang bisa dibantu?`, {
        reply_markup: {
          keyboard: [
            ["📂 Kategori", "💰 Pencarian"],
            ["📞 Profil Kamu"]
          ],
          resize_keyboard: true
        }

      })
    }

    if (text === "/pricelist") {
      await bot.sendMessage(chatId, "```\nini pricelistnya\n```", {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Option 1", callback_data: "opt1" },
              { text: "Option 2", callback_data: "opt2" }
            ],
            [
              { text: "Option 3", callback_data: "opt3" }
            ]
          ]
        }
      })
    }

    if (text === "/categories" || text === "📂 Kategori") {
      const { data, error } = await supabase
        .from("store_categories")
        .select(`
          id,
          name,
          product_prices (
            duration,
            price
          )
        `)

      if (error) {
        return await bot.sendMessage(chatId, "Gagal ambil data ❌")
      }

      let message = "```\n📂 Daftar Kategori:\n\n"

      data.forEach((cat) => {
        message += `- ${cat.name}\n`

        if (cat.prices.length > 0) {
          cat.prices.forEach((p) => {
            message += `  ${p.duration} : ${p.price}\n`
          })
        } else {
          message += `  (belum ada harga)\n`
        }

        message += "\n"
      })

      message += "```"

      await bot.sendMessage(chatId, message, {
        parse_mode: "MarkdownV2"
      })
    }

    if (text === "/search" || text === "💰 Pencarian") {
      await bot.sendMessage(chatId, "Fitur pencarian masih dalam pengembangan 🔧")
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

    if (update.message?.text?.startsWith("/remind")) {
      const chatId = update.message.chat.id
      const parts = update.message.text.split(" ")

      if (parts.length < 4) {
        return bot.sendMessage(
          chatId,
          "Format salah ❌\nGunakan:\n/remind YYYY-MM-DD HH:mm Pesan"
        )
      }

      const dateTimeStr = parts[1] + " " + parts[2]
      const message = parts.slice(3).join(" ")

      // 🔥 KONVERSI WIB → UTC
      const remindAt = new Date(dateTimeStr + " GMT+0700").toISOString()

      // Ambil user
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", chatId)
        .single()

      if (!user) {
        return bot.sendMessage(chatId, "User tidak ditemukan ❌")
      }

      await supabase.from("reminders").insert({
        user_id: user.id,
        message,
        remind_at: remindAt,
        sent: false
      })

      await bot.sendMessage(
        chatId,
        `Reminder disimpan ✅\n⏰ ${parts[1]} ${parts[2]} WIB`
      )
    }


    return res.status(200).send("OK")

  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(500).send("Error")
  }
}
