const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());
app.use(cors()); // Разрешает фронтенду общаться с сервером

// Токен вашего бота @LuckyStarBoxBot
const BOT_TOKEN = '8605181175:AAG1tIXdvUAlyD922God9NPnANCWWOtrXaQ'; 
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Бот LuckyStar ! успешно подключен.');

// Функция проверки безопасности Telegram (защита от накрутки призов хакерами)
function verifyTelegramData(initData) {
    if (!initData) return null;
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    const dataCheckString = Array.from(params.entries())
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('\n');
        
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash === hash) {
        return JSON.parse(params.get('user'));
    }
    return null;
}

// 🤖 НАСТРОЙКА ДЕЙСТВИЙ БОТА В ЧАТЕ
// Когда игрок заходит в @LuckyStarBoxBot и пишет /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Игрок';

    bot.sendMessage(chatId, `Привет, ${firstName}! Добро пожаловать в LuckyStar ! 🔮\n\nКрути бокс в стиле Seapunk / Vaporwave, собирай редкие NFT и выигрывай ценные призы! 🌊`, {
        reply_markup: {
            inline_keyboard: [[
                // Кнопка для быстрого запуска игры прямо внутри Telegram на iOS
                { text: "Открыть LuckyStar 🕹️", web_app: { url: "https://github.io" } }
            ]]
        }
    });
});

// 🌐 НАСТРОЙКА ОБЩЕНИЯ С ИГРОЙ (API)
// Эта ручка срабатывает, когда в игре нажимают кнопку "КРУТИТЬ"
app.post('/api/spin', (req, res) => {
    const tgUser = verifyTelegramData(req.body.initData);
    if (!tgUser) return res.status(403).json({ error: 'Доступ заблокирован: неверная сессия!' });

    const userId = tgUser.id;
    
    // Игровой пул призов
    const prizes = ['NFT Будда Подарок 🧘‍♂️', 'Аниме Локация 📺', 'Перламутровый Тэг 💎'];
    const finalPrize = prizes[Math.floor(Math.random() * prizes.length)];

    // Бот мгновенно шлет в личку игроку сообщение о выигрыше
    bot.sendMessage(userId, `🎉 *Выигрыш в LuckyStar !*\n\nПоздравляем! Барабан остановился и вы выиграли:\n👉 *${finalPrize}*`, { parse_mode: 'Markdown' })
    .catch(err => console.log('Не удалось отправить сообщение пользователю:', err.message));

    // Возвращаем результат обратно в анимацию игры
    res.json({ success: true, prize: finalPrize });
});

// Порт для запуска сервера в облаке
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер LuckyStar запущен на порту ${PORT}`));
