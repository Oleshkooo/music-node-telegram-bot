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



// ! start
const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Start'},
        // {command: '/help', description: 'Help'},
    ])
    
    bot.on('message', async msg => {
        const text = msg.text
        const chatID = msg.chat.id
    
        if (text === '/start') {
            await bot.sendMessage(chatID, `Hello, ${msg.from.first_name}`)
            await bot.sendMessage(chatID, 'You can download music here')
            return bot.sendMessage(chatID, 'Just send me the song name')
        }
    
        if (text === '/dieee')
            process.exit()
    
        if (text.includes('https://')) {
            i++
            return await download(text, `fromLink${i}`, chatID)
        }
    
        return (async () => {
            await search(text, chatID)
            text = ''
        })
    })
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
const search = async (search, chatID) => {
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

    bot.sendMessage(chatID, 'Choose the song', keyboard)

    bot.on('callback_query', (callbackQuery) => {
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
        let h, m, s

        if (duration.length < 6) {
            h = 0
            m = parseInt(duration.split(":")[0])
            s = parseInt(duration.split(":")[1])
        }
        else {
            h = parseInt(duration.split(":")[0])
            m = parseInt(duration.split(":")[1])
            s = parseInt(duration.split(":")[2])
        }

        if (h > 0 && m > 10) return bot.editMessageText('Song is too long', opts)

        bot.editMessageText(`${title} • ${duration}`, opts)
        download(url, title, chatID)
    })
}

start()