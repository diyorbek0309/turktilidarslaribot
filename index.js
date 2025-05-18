const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const postgres = require("./modules/postgres");

const bot = new TelegramBot(TOKEN, { polling: true });
const botUsername = "turktilidarslari_bot";
const channelUsername = "dasturchining_tundaligi";
const privateChannelLink = "https://t.me/yopiq_kanal_linki";

async function main() {
  const db = await postgres();

  bot.onText(/^\/start(?:\s(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name || "";
    const referredBy = match[1] ? parseInt(match[1]) : null;

    try {
      const member = await bot.getChatMember(`@${channelUsername}`, chatId);
      const status = member.status;

      if (status === "left" || status === "kicked") {
        return bot.sendMessage(chatId, `❗️ Botdan foydalanish uchun avval @${channelUsername} kanaliga obuna bo‘ling`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔗 Kanalga obuna bo‘lish",
                  url: `https://t.me/${channelUsername}`,
                },
              ],
              [
                {
                  text: "✅ Obuna bo‘ldim",
                  callback_data: "check_subscription",
                },
              ],
            ],
          },
        });
      }
    } catch (e) {
      console.error("getChatMember xatolik:", e.message);
      return bot.sendMessage(chatId, "❗️ Obuna holatini tekshirishda xatolik yuz berdi.");
    }

    let user = await db.users.findByPk(chatId);
    if (!user) {
      await db.users.create({
        chat_id: chatId,
        username,
        referred_by: referredBy && referredBy !== chatId ? referredBy : null,
        referral_count: 0,
        is_channel_sent: false,
      });

      if (referredBy && referredBy !== chatId) {
        const refUser = await db.users.findByPk(referredBy);
        if (refUser) {
          refUser.referral_count += 1;
          await refUser.save();

          if (refUser.referral_count >= 10 && !refUser.is_channel_sent) {
            await bot.sendMessage(referredBy, `🎉 Siz 10 ta do‘stingizni taklif qildingiz. Mana yopiq kanalga havola:\n\n${privateChannelLink}`);
            refUser.is_channel_sent = true;
            await refUser.save();
          }
        }
      }
    }

    return bot.sendMessage(chatId, `Assalomu aleykum! Turk tilidan videodarslar yopiq kanaliga qo‘shilish uchun botni 10 nafar do‘stingizga taklif qiling.
\n❗️ Diqqat: do‘stlaringiz, siz yuborgan taklif havolasi orqali kirsa, ular hisobga olinadi.
\nTaklif havolangiz quyida:`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📨 Taklif uchun post",
              callback_data: "get_ref_post",
            },
          ],
        ],
      },
    });
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.from.id;
    const username = query.from.username || query.from.first_name || "";

    if (query.data === "check_subscription") {
      try {
        const member = await bot.getChatMember(`@${channelUsername}`, chatId);
        const status = member.status;

        if (status === "left" || status === "kicked") {
          return bot.answerCallbackQuery(query.id, {
            text: "❗️ Obuna hali aniqlanmadi. Avval kanalga a'zo bo‘ling.",
            show_alert: true,
          });
        }

        let user = await db.users.findByPk(chatId);
        if (!user) {
          await db.users.create({
            chat_id: chatId,
            username,
            referred_by: null,
            referral_count: 0,
            is_channel_sent: false,
          });
        }

        await bot.sendMessage(chatId, `✅ Obuna tasdiqlandi!

Assalomu aleykum! Turk tilidan videodarslar yopiq kanaliga qo‘shilish uchun botni 10 nafar do‘stingizga taklif qiling.
\n❗️ Diqqat: do‘stlaringiz, siz yuborgan taklif havolasi orqali kirsagina, ular hisobga olinadi.
\nTaklif havolangiz quyida:`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📨 Taklif uchun post",
                  callback_data: "get_ref_post",
                },
              ],
            ],
          },
        });

        await bot.answerCallbackQuery(query.id);
      } catch (e) {
        console.error("Callbackda xatolik:", e.message);
        await bot.answerCallbackQuery(query.id, {
          text: "Xatolik yuz berdi. Qaytadan urinib ko‘ring.",
          show_alert: true,
        });
      }
    }

    if (query.data === "get_ref_post") {
      const referalLink = `https://t.me/${botUsername}?start=${chatId}`;

      const text = `Assalomu alaykum! Men Turk tilidan bepul video darslar kanalini topdim.

Yopiq kanalga faqat taklif asosida kirish mumkin. Bot orqali siz ham darslarga qo‘shilishingiz mumkin.

🎯 Darslarga kirish uchun botga start bosing:
${referalLink}`;

      await bot.sendMessage(chatId, text);
      await bot.answerCallbackQuery(query.id);
    }
  });
}

main();
