// ! console fixes
process.env.NTBA_FIX_319 = 1
process.env.NTBA_FIX_350 = 1

// ! requirements
const { Telegraf, Markup, Composer, Scenes, session } = require('telegraf')
const fs = require('fs')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')

const TOKEN = '5168643575:AAEOJSu5V6dqUeh3dM1waGscnL-DNWpteCA'
const bot = new Telegraf(TOKEN)

const btn_1_word = '🔍 Search'



// / === === === === ===



// / === start
bot.start(async tg => {
    await tg.reply(`👋🏼 Hello, ${tg.message.from.first_name}`, Markup
        .keyboard([
            [btn_1_word]
        ])
        .resize()
    )
    await tg.reply('🎵 You can listen to music or download it here')
    await tg.reply('🔴 Push the button to start')
})





// / === search
// * 1
const search_1 = new Composer()
search_1.on('text', async tg => {
    await tg.reply('🎵 Send me the title of the song')
    return tg.wizard.next()
})

// * 2
let results
const search_2 = new Composer()
search_2.on('text', async tg => {
    let songTitle = tg.message.text

    // end if clicked search || cancel
    if (songTitle == btn_1_word || songTitle == '/search') {
        tg.scene.leave()
        return tg.scene.enter('searchScene')
    }
    if (songTitle == '/cancel') return tg.scene.leave()

    tg.reply('🔍 Searching...')

    results = await ytsr(songTitle, {
        limit: 5
    })

    // end if nothing found
    if (results.items.length < 1) {
        await tg.reply('Nothing found')
        return tg.scene.leave()
    }

    const resultsArr = []
    results.items.map((item, index) => resultsArr.push(
        [Markup.button.callback(`${item.title} • ${item.duration || 'Live'}`, index)]
    ))

    tg.reply('🎶 Choose the song from the list', Markup.inlineKeyboard(resultsArr).oneTime())
    return tg.wizard.next()
})

// * 3
const search_3 = new Composer()
// check
const check = async (tg, action) => {
    await tg.deleteMessage()

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

    // if song is too long
    if (h > 0 && m > 10) {
        await tg.reply('This song is too long')
        return tg.scene.leave()
    }

    await tg.reply(`🎧 ${title} • ${duration}`)

    await download(tg, url, title)

    return tg.scene.leave()
}
// download & send
const download = async (tg, url, fileNameInv) => {
    let fileName = fileNameInv.replace(/[&\/\\#,+()$~%.'"`:*?|!@<>{}]/g, '').replace(/\s+/g, ' ')

    if (!ytdl.validateURL(url)) {
        tg.reply('😟 Error')
        tg.reply('⏱ Try again later')
        return tg.scene.leave()
    }

    tg.reply('⬇️ Downloading...')
    const writeableStream = fs.createWriteStream(`${fileName}.mp3`);
    writeableStream.on('finish', () => {
        tg.replyWithAudio({source: `${fileName}.mp3`})
        .then(() => {
            fs.unlink(`${fileName}.mp3`, err => {
                if (err) console.error(err)
            })
        })
    })

    ytdl(url, {
        format: "mp3",
    }).pipe(writeableStream)
}
search_3.action('0', async tg => check(tg, '0'))
search_3.action('1', async tg => check(tg, '1'))
search_3.action('2', async tg => check(tg, '2'))
search_3.action('3', async tg => check(tg, '3'))
search_3.action('4', async tg => check(tg, '4'))


const searchScene = new Scenes.WizardScene('searchScene', search_1, search_2, search_3)
const stage = new Scenes.Stage([searchScene])
bot.use(session())
bot.use(stage.middleware())


bot.hears(btn_1_word, tg => tg.scene.enter('searchScene'))
bot.command('search', tg => tg.scene.enter('searchScene'))



// / === === === === ===



bot.launch()
console.log('[BOT] Bot launched\n')
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))