const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const Utils = require("./utils");
const { Sequelize } = require("sequelize");
const postgres = require("./modules/postgres");

const bot = new TelegramBot(TOKEN, { polling: true });
const adminIds = [175604385, 6819336169];
const botUsername = "turktilidarslari_bot";
const requiredChannels = ["davlatmurodova_turktili"]
const defaultKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: "📊 Mening ballarim" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

async function isUserSubscribedToAllChannels(userId) {
  for (const channel of requiredChannels) {
    try {
      const res = await bot.getChatMember(`@${channel}`, userId);
      if (["left", "kicked"].includes(res.status)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

  async function promptToJoinChannels(chatId) {
    const buttons = requiredChannels.map((username) => [
      {
        text: `🔗 ${username.toUpperCase()}`,
        url: `https://t.me/${username}`,
      },
    ]);

    buttons.push([
      {
        text: "✅ Obuna bo‘ldim",
        callback_data: "check_subscription",
      },
    ]);

    return bot.sendMessage(chatId, `❗️ Botdan foydalanish uchun quyidagi kanallarga obuna bo‘ling:`, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

async function main() {
  const db = await postgres();
  const requiredReferralsSetting = await db.settings.findOne({
    where: { key: "required_referrals" },
  });
  const privateChannelSetting = await db.settings.findOne({
    where: { key: "private_channel_link" },
  });
  const privateChannelLink = privateChannelSetting
      ? privateChannelSetting.value
      : "https://t.me/+aqTgVtE0vThiMjUy";
  const requiredReferrals = requiredReferralsSetting
      ? parseInt(requiredReferralsSetting.value)
      : 10;

  bot.onText(/^\/start(?:\s(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name || "";
    const referredBy = match[1] ? parseInt(match[1]) : null;

    const isSubscribed = await isUserSubscribedToAllChannels(chatId);
    if (!isSubscribed) return promptToJoinChannels(chatId);

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

          if (refUser.referral_count >= requiredReferrals && !refUser.is_channel_sent) {
            await bot.sendMessage(referredBy, `🎉 Siz ${requiredReferrals} ta do‘stingizni taklif qildingiz. Mana yopiq kanalga havola:\n\n${privateChannelLink}`);
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
      const isSubscribed = await isUserSubscribedToAllChannels(chatId);

      if (!isSubscribed) {
        return bot.answerCallbackQuery(query.id, {
          text: "❗️ Obuna hali aniqlanmadi. Avval kanallarga a'zo bo‘ling.",
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

      return bot.answerCallbackQuery(query.id);
    }

    if (query.data === "get_ref_post") {
      const referalLink = `https://t.me/${botUsername}?start=${chatId}`;

      const text = `Assalomu alaykum! Men Turk tilidan bepul video darslar kanalini topdim.

Yopiq kanalga faqat taklif asosida kirish mumkin. Bot orqali siz ham darslarga qo‘shilishingiz mumkin.

🎯 Darslarga kirish uchun botga start bosing:
${referalLink}`;

      await bot.sendMessage(chatId, text, {
        ...defaultKeyboard
      });
      await bot.answerCallbackQuery(query.id);
    }
  });
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const db = await postgres();

  if (msg.text === "📊 Mening ballarim") {
    const user = await db.users.findByPk(chatId);

    if (!user) {
      return bot.sendMessage(chatId, "Siz ro‘yxatdan o‘tmagansiz.");
    }

    return bot.sendMessage(chatId, `📊 Siz ${user.referral_count} ta do‘stingizni taklif qilgansiz.`);
  }
});


bot.onText(/^\/set_public_channel (.+)$/, async (msg, match) => {
  const db = await postgres();
  if (!adminIds.includes(msg.from.id)) return;

  const url = match[1];
  await db.settings.upsert({ key: "public_channel_url", value: url });
  await bot.sendMessage(msg.chat.id, `✅ Ochiq kanal linki yangilandi.`);
});

bot.onText(/^\/set_private_channel (.+)$/, async (msg, match) => {
  const db = await postgres();
  if (!adminIds.includes(msg.from.id)) return;

  const url = match[1];
  await db.settings.upsert({ key: "private_channel_url", value: url });
  await bot.sendMessage(msg.chat.id, `✅ Yopiq kanal linki yangilandi.`);
});

bot.onText(/^\/set_referrals (\d+)$/, async (msg, match) => {
  const db = await postgres();
  if (!adminIds.includes(msg.from.id)) return;

  const count = parseInt(match[1]);
  await db.settings.upsert({ key: "required_referrals", value: count.toString() });
  await bot.sendMessage(msg.chat.id, `✅ Taklif qilinishi kerak bo'lgan yangi obunachilar soni: ${count} ga o‘rnatildi.`);
});

bot.onText(/^\/my_stats$/, async (msg) => {
  const db = await postgres();
  const chatId = msg.chat.id;
  const user = await db.users.findByPk(chatId);

  if (!user) {
    return bot.sendMessage(chatId, "Siz ro'yxatdan o'tmagansiz.");
  }

  await bot.sendMessage(
      chatId,
      `Siz hozirgacha ${user.referral_count} ta foydalanuvchini taklif qilgansiz.`
  );
});

bot.onText(/^\/all_stats$/, async (msg) => {
  const db = await postgres();
  if (!adminIds.includes(msg.from.id)) return;

  const totalSent = await db.users.count({
    where: { is_channel_sent: true },
  });

  const totalReferrals = await db.users.sum("referral_count");

  const users = await db.users.findAll({
    attributes: ["chat_id", "username", "referral_count"],
    where: { referral_count: { [Sequelize.Op.gt]: 0 } },
    order: [["referral_count", "DESC"]],
  });

  let table = users
      .map((user, index) => `${index + 1}. ${Utils.escapeMarkdown(user.username)} — ${user.referral_count} ta`)
      .join("\n");

  const text =
      `📊 Statistika:\n\n` +
      `🔒 Yopiq kanal linki yuborilgan foydalanuvchilar: ${totalSent} ta\n` +
      `👥 Umumiy referral soni: ${totalReferrals || 0} ta\n\n` +
      `🏆 Referral jadvali:\n` +
      `${table || "Hozircha hech kimda referral yo‘q"}`;

  await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
});

bot.onText(/\/about/, async (message) => {
  await bot.sendMessage(
      message.chat.id,
      `Turk tili videodarslari kanaliga qo'shilish uchun bot.\nDasturchi: @dasturchining_tundaligi`
  );
});

main();
