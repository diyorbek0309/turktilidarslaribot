const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");
const ExtraControllers = require("./controllers/ExtraControllers");
const postgres = require("./modules/postgres");

const bot = new TelegramBot(TOKEN, { polling: true });

async function main() {
  const psql = await postgres();

  await bot.onText(/^\/start$/, (message) => {
    console.log(bot, message);
    bot.sendMessage(
      message.chat.id,
      `Assalomu aleykum. Anonim savol-javoblar botiga xush kelibsiz!
Sizning manzil: t.me/AnonimSavolJavobBot?start=${message.chat.id}
      \nUshbu havolani do'stlaringiz, obunachilaringiz bilan ulashing va ulardan anonim savollar va javoblar oling!
      `
    );
  });

  await bot.onText(/\/start (.+)/, (message, match) => {
    const startId = match[1];
    bot.sendMessage(message.chat.id, `Savolingizni yozing:`);
    bot.once("message", async (msg) => {
      await bot.sendMessage(
        175604385,
        `${
          message.chat.username
            ? "@" + message.chat.username
            : message.chat.first_name
        } foydalanuvchi (${
          msg.chat.username ? "@" + msg.chat.username : msg.chat.first_name
        }) savol yubordi:\n${msg.text}`
      );
      await bot
        .sendMessage(
          startId,
          `Sizga foydalanuvchi (${
            msg.chat.username ? "@" + msg.chat.username : msg.chat.first_name
          }) savol yubordi:\n${msg.text}`
        )
        .then(() => {
          bot.sendMessage(message.chat.id, `Savolingiz jo'natildi. Raxmat!`);
        });
    });
  });

  await bot.onText(/\/help/, (message) => {
    bot.sendMessage(
      message.chat.id,
      `Botdan foydalanish uchun buyruqlar:\n\n/startSvoyak - oʻyinni boshlash buyruqi. Ushbu buyruqni bergan foydalanuvchi oʻyin boshlovchisi hisoblanadi va ochko berish imkoniyatiga ega boʻladi. Ochkolar xabarga javob sifatida berilishi kerak.\n\n/changeCreator - boshlovchini oʻzgartirish buyruqi. Ushbu buyruqdan amaldagi boshlovchi yoki guruh adminlari foydalanishi mumkin. Buyruq xabarga javob sifatida berilishi kerak.\n\n/removeMe - tablodan oʻz ismingizni oʻchirish uchun ishlatishingiz mumkin.\n\n/endSvoyak - oʻyinni yakunlash va natijalarni e'lon qilish buyruqi. Ushbu buyruqdan amaldagi boshlovchi yoki guruh adminlari foydalanishi mumkin.`
    );
  });

  await bot.onText(/\/about/, (message) => {
    bot.sendMessage(
      message.chat.id,
      `Shaxsiy oʻyin jarayonida ochkolarni hisoblab boruvchi bot.\nDasturchi: @dasturchining_tundaligi`
    );
  });
}

main();
