// ! console fixes
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

// ! requirements
const { Telegraf, Markup, Composer, Scenes, session } = require('telegraf')
const fs = require('fs')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')

const TOKEN = '5168643575:AAEOJSu5V6dqUeh3dM1waGscnL-DNWpteCA'
const bot = new Telegraf(TOKEN)



// / === === === === ===



// / === start
bot.start(async msg => {
    await msg.reply(`Hello, ${msg.message.from.first_name}`, Markup
        .keyboard([
            ['Search']
        ])
        .resize()
    )
    await msg.reply('You can download music here')
    await msg.reply('Push the button to start')
    // await msg.reply('Type /search to start')
})





// / === search
// * 1
const search_1 = new Composer()
search_1.on('text', async msg => {
    await msg.reply('Send me the title of the song')
    return msg.wizard.next()
})

// * 2
let results
const search_2 = new Composer()
search_2.on('text', async msg => {
    let songTitle = msg.message.text
    
    // end if clicked search
    if (songTitle == 'Search') {
        msg.scene.leave()
        return msg.scene.enter('searchScene')
    }

    msg.reply('Searching...')

    results = await ytsr(songTitle, {
        limit: 5
    })

    // end if nothing found
    if (results.items.length < 1) {
        await msg.reply('Nothing found')
        return msg.scene.leave()
    }

    const resultsArr = []
    results.items.map((item, index) => resultsArr.push(
        [Markup.button.callback(`${item.title} • ${item.duration || 'Live'}`, index)]
    ))

    msg.reply('Choose the song from the list', Markup.inlineKeyboard(resultsArr).oneTime())
    return msg.wizard.next()
})

// * 3
const search_3 = new Composer()
// check
const check = async (msg, action) => {
    await msg.deleteMessage()

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

    if (h > 0 && m > 10) {
        await msg.reply('This song is too long')
        return msg.scene.leave()
    }
    
    await msg.reply(`${title} • ${duration}`)

    await download(msg, url, title)

    return msg.scene.leave()
}
// download & send
const download = async (msg, url, fileNameInv) => {
    let fileName = fileNameInv.replace(/[&\/\\#,+()$~%.'"`:*?|!@<>{}]/g, '').replace(/\s+/g, ' ')

    if (!ytdl.validateURL(url)) {
        msg.reply('Error')
        msg.reply('Try again later')
        return msg.scene.leave()
    }

    msg.reply('Downloading...')
    const writeableStream = fs.createWriteStream(`${fileName}.mp3`);
    writeableStream.on('finish', () => {
        msg.replyWithAudio({source: `${fileName}.mp3`})
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
search_3.action('0', async msg => check(msg, '0'))
search_3.action('1', async msg => check(msg, '1'))
search_3.action('2', async msg => check(msg, '2'))
search_3.action('3', async msg => check(msg, '3'))
search_3.action('4', async msg => check(msg, '4'))


const searchScene = new Scenes.WizardScene('searchScene', search_1, search_2, search_3)
const stage = new Scenes.Stage([searchScene])
bot.use(session())
bot.use(stage.middleware())


bot.hears('Search', msg => msg.scene.enter('searchScene'))



// / === === === === ===



bot.launch()
console.log('[BOT] Bot launched\n')
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))