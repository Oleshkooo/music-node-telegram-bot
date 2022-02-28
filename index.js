process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api')

const TOKEN = '5241007872:AAE18Gu9ClsaRGwZu5Hc4P4MZCfe1Z2t6xY'
const bot = new TelegramBot(TOKEN, {polling: true})



const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Start'},
        {command: '/help', description: 'Help'},
    ])
    
    bot.on('message', async msg => {
        const text = msg.text
        const chatID = msg.chat.id
    
        if (text === '/start') {
            await bot.sendMessage(chatID, `Hello, ${msg.from.first_name}`)
            return bot.sendMessage(chatID, 'I was waiting for you!')
        }

        if (text === '/help') {
            await bot.sendMessage(chatID, 'Help')
            return bot.sendMessage(chatID, 'Help 2')
        }

        if (text === '/ss') {
            bot.stopPolling()
        }

        return bot.sendMessage(chatID, 'I don`t understand you...')
    })
}
start()