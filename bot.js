// ! console fixes
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

// ! requirements
const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const ytdl = require("ytdl-core");  
const ytsr = require('ytsr');

// ! other
const TOKEN = '5168643575:AAEOJSu5V6dqUeh3dM1waGscnL-DNWpteCA'
const bot = new TelegramBot(TOKEN, {polling: true})
let i = 0



// ! main
bot.setMyCommands([
    {command: '/start', description: 'Start'},
    {command: '/search', description: 'Search'},
])

bot.on('message', async msg => {
    const text = msg.text
    const chatID = msg.chat.id
    const firstName = msg.from.first_name

    if (text === '/dieee')
        process.exit()

    if (text === '/start') return await start(chatID, firstName)

    if (text === '/search') return await search(chatID)

    if (text.includes('https://')) {
        i++
        return await download(text, `fromLink${i}`, chatID)
    }
})



// ! start
const start = async (chatID, firstName) => {
    await bot.sendMessage(chatID, `v0.0.8`)
    await bot.sendMessage(chatID, `Hello, ${firstName}`)
    await bot.sendMessage(chatID, 'You can download music here')
    return bot.sendMessage(chatID, 'Type /search to start')
}



// ! search
const search = async (chatID) => {
    await bot.sendMessage(chatID, 'Send me the title of the song')
    let text
    bot.on('message', async msg => text = msg.text)
    console.log(text)

    // await bot.sendMessage(chatID, 'Searching...')
    // return searchSong(chatID, text)
}



// ! download
const download = async (url, fileName, chatID) => {
    if (!ytdl.validateURL(url)) return bot.sendMessage(chatID, 'Invalid URL')

    bot.sendMessage(chatID, 'Downloading...')
    const writeableStream = fs.createWriteStream(`${fileName}.mp3`);
    writeableStream.on('finish', () => {
        bot.sendAudio(chatID, `${fileName}.mp3`)
        .then(() => {
            fs.unlink(`${fileName}.mp3`, err => {
                if (err) throw err
            })
        })
    })

    ytdl(url, {
        format: "mp3",
    }).pipe(writeableStream)
}



// ! search
const searchSong = async (chatID, search) => {
    bot.sendMessage(chatID, 'Searching...')

    const results = await ytsr(search, {
        limit: 5
    })

    const resultsArr = []
    results.items.map((item, index) => resultsArr.push([{text: `${item.title} • ${item.duration || 'Live'}`, callback_data: index}]))

    if (resultsArr.length == 0) return bot.sendMessage(chatID, 'Nothing found')

    const keyboard = {
        reply_markup: JSON.stringify({
            inline_keyboard: resultsArr
        })
    }

    await bot.sendMessage(chatID, 'Choose the song', keyboard)

    bot.on('callback_query', async callbackQuery => {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        const opts = {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
        }

        if (results.items[action].isLive) return bot.editMessageText('I can`t download live stream', opts)

        let title = results.items[action].title
        let duration = results.items[action].duration
        let url = results.items[action].url
        let h = 0
        let m = 0

        if (duration.length < 6)
            m = parseInt(duration.split(":")[0])
        else {
            h = parseInt(duration.split(":")[0])
            m = parseInt(duration.split(":")[1])
        }

        if (h > 0 && m > 10) return bot.editMessageText('Song is too long', opts)

        bot.editMessageText(`${title} • ${duration}`, opts)
        return download(url, title, chatID)
    })
}