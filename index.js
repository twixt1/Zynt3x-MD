const { Client, Reaction, MessageMedia , LocalAuth , MessageTypes , RemoteAuth} = require('tecsom-whatsapp-web.js')
const qrcode = require("qrcode-terminal")
const axios = require("axios")
const unit = 'Metric'
const getFBInfo = require("@xaviabot/fb-downloader")
const fs = require('fs')
const { Google, Musixmatch } = require("@flytri/lyrics-finder")
const {google} = require('yuomi')
const truecallerjs = require("truecallerjs")
const mime = require('mime-types')
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const ytdl = require('ytdl-core');

require('dotenv').config()

const prefix = process.env.PREFIX
const stickerAuthor = process.env.STICKER_AUTHOR
const mongodbUrl = process.env.MONGODB_URI
const aliveImage = process.env.ALIVE_IMAGE

mongoose.connect(`${mongodbUrl}/message`, {
  socketTimeoutMS: 360000,
  connectTimeoutMS: 360000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  writeConcern: {w: 'majority'}
}).then(() => {
  console.log('MongoDB Connected Succesfully!')
  const store = new MongoStore({ mongoose: mongoose });
  const client = new Client({
      authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000
      }), puppeteer: {
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox' , 
        '--disable-gpu-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
      }
  })



  client.on("qr", (qr) => {
    qrcode.generate(qr,{ small: true });
  })
  
  
  client.on("ready", async () => {
    console.log("Successfully Scanned!")
  
    const mainNumber = process.env.OWNER_NUMBER
  
    const chatId = mainNumber.substring(1) + "@c.us"; 
  
    const textmessage = `_*Bot Is Working Now!*_\n\n*Working On _${mainNumber}_*\n\n*Thanks For Using _Zyntex_*`
  
    const media = await MessageMedia.fromUrl('https://i.imgur.com/dMtipdL.jpeg')
  
    client.sendMessage(chatId, media, {caption: textmessage });
    
    console.log(`BOT STARTED!   Prefix = '${prefix}'`)
  
  });

  client.on('auth_failure', async () =>{
    console.log('Authentication Failed!')
  })

  client.on("message" , async(message) => {
    if(message.body == '.alive'){

      const response = await fetch('https://api.quotable.io/random')
      const quote = await response.json()
        
      const qc = quote.content
      const qa = quote.author

      const chat = await message.getChat()
      const media = await MessageMedia.fromUrl(aliveImage)
      const msg = process.env.ALIVE_MESSAGE
      const aliveMsg = msg + '\n\n' + '```' + qc + '-' + qa + '```'
      chat.sendMessage(media , {caption: aliveMsg })
      

    }
  })
  
  const apiKey = process.env.WEATHER_API_KEY;
  const apiUrl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&q=';
  
  client.on("message", async (message) => {
  
      if (message.body.startsWith('.weather')) {
    
        const query = message.body.slice(8).trim();
    
        const weatherUrl = apiUrl + query + "&appid=" + apiKey;
    
    
        const response = await fetch(weatherUrl);
        const data = await response.json();
  
  
         const chat = await message.getChat();
  
         if(!query) {
          message.react('❗')
          message.reply('```Need Query!\n\nex: .weather   <Location Name>```')
          }else{
            if (response.status == 404) {
              chat.sendStateTyping()
              message.react('❌')
              message.reply(
              "```Location Not Found!\n\n•Check spelling\n•Make sure there is such a place```");
            }else{
              chat.sendStateTyping()
              message.react('🌦️') 
              const media = await MessageMedia.fromUrl(process.env.OWNER_IMAGE_URL)
  
              chat.sendMessage(media, {caption:
  `*Weather Info of*_*${data.name}*_
  *-------------------*
  
  
  ‣ *Location:* ${data.name}
  
  ‣ *Temperature:* ${data.main.temp} °C
  
  ‣ *Humidity:* ${data.main.humidity} %
  
  ‣ *Wind Speed:* ${data.wind.speed} km/h
  
  ‣ *Latitude:* ${data.coord.lat}
  
  ‣ *Longitude:* ${data.coord.lon}
  
  ‣ *Pressure:* ${data.main.pressure} hPa
  
  ‣ *Min-Temp:* ${data.main.temp_min} °C
  
  ‣ *Max-Temp:* ${data.main.temp_max} °C
  
  ‣ *Unit:* ${unit}`})
  
            }
          }
  
        }
      }
    )
  
    client.on('message' , async(message) => {
      if(message.body.startsWith(".lyrics")){
        const lyricQuery = message.body.slice(8).trim();
  
  
        if(!lyricQuery){
          message.reply('```Please provide a song name!\n\nex: .lyrics faded```');
        }else{
  
          Musixmatch(lyricQuery).then((response)=>{
      
  
            if(response.lyrics.length == 0){
              try{
                Google(lyricQuery).then((res)=>{
                  message.reply(res.lyrics)
                })
              }catch(err){
                message.reply(err)
              }
            }else{
              try{
                message.reply(response.lyrics)
              }catch(err){
                message.reply(err)
              }
            }
          })
        }
      }
    })
  
    client.on('message', async(message) => {
      if(message.body.startsWith('.fb')){
  
        const fbUrl = message.body.slice(3).trim()
        if(!fbUrl) {
          message.reply('*Need Facebook Video URLv*')
        }else{
          await message.reply('_*Please Wait! We are processing your video. This may take few seconds....*_')
          async function printFBInfo() {
          try {
              const result = await getFBInfo(
                fbUrl
              );
              const fbVidThumb = result.thumbnail
  
              const HDfbDlRes = result.hd
  
              const SDfbDlRes = result.sd
  
              const fbVidTitle = result.title
  
              const fbVidUrl = result.fbUrl
  
              const fbMedia = await MessageMedia.fromUrl(fbVidThumb);
  
              const fbChat = await message.getChat();
  
              fbChat.sendMessage(fbMedia, {caption: `--- _*Facebook Video Downloader*_ ---\n\n\n*Title:* ${fbVidTitle}\n\n*Url*: ${fbUrl}\n\n--- *_Click the link to download_*  ---\n\n_(Recommended Browser: Chrome\nLinks Are *100%* Safe.)_\n\n*SD Quality: ${SDfbDlRes}*\n\n*HD Quality: ${HDfbDlRes}*`})
            
          } catch (err) {
              message.reply('*An error occured!*\n' + `_*${err}*_`);
          }
      }
      
      printFBInfo();
      }}
    })
  
  
    client.on('message', async(message) =>{
      if(message.body.startsWith('.google')){
        const googleQuery = message.body.slice('8').trim()
        if(!googleQuery){
          await message.reply('```Need Query!\n\nex: .google <query>```')
        }else{
          try{
  
            google(googleQuery).then(yume => {
              const result0Titl = yume[0].title
              const result0Desc = yume[0].description
              const result0Link = yume[0].link
              
              const result1Titl = yume[1].title
              const result1Desc = yume[1].description
              const result1Link = yume[1].link
          
              const result2Titl = yume[2].title
              const result2Desc = yume[2].description
              const result2Link = yume[2].link
          
              const result3Titl = yume[3].title
              const result3Desc = yume[3].description
              const result3Link = yume[3].link
          
              const result4Titl = yume[4].title
              const result4Desc = yume[4].description
              const result4Link = yume[4].link
  
  
              message.reply(
  `*Search Results For _${googleQuery}_*
  ____________________
  
  
  *1)* *${result0Titl}*
  
  _${result0Desc}_
  
  ${result0Link}
  
  
  *2)* *${result1Titl}*
  
  _${result1Desc}_
  
  ${result1Link}
  
  
  *3)* *${result2Titl}*
  
  _${result2Desc}_
  
  ${result2Link}
  
  
  *4)* *${result3Titl}*
  
  _${result3Desc}_
  
  ${result3Link}
  
  
  *5)* *${result4Titl}*
  
  _${result4Desc}_
  
  ${result4Link}`)
            })
            
          }catch(err){
            message.reply('*An Error Occured!*\n' + `_*${err}*_`)
          }
        }
      }
        
    })
  
  
  
    client.on('message', async(message) =>{
      if(message.body.startsWith('.tc')){
        const tcQueryCountry = message.body.slice(4,6).trim()
        const tcQueryNumber = message.body.slice(7).trim()
  
  
        if(!tcQueryCountry || !tcQueryNumber){
          message.reply('*An error occured!*')
        }else{
          const search_data = {
            number: tcQueryNumber,
            countryCode: tcQueryCountry,
            installationId: process.env.TRUECALLER_INSTALLATION_ID,
          };
          
          truecallerjs.search(search_data).then((res) => {
  
            try {
  
            const contactName = res.json().data[0].name
            const carrierName = res.json().data[0].phones[0].carrier
            const numberType = res.json().data[0].phones[0].numberType
            const type = res.json().data[0].phones[0].type
            const access = res.json().data[0].access
            const city = res.getAddresses(JSON)[0].city
            const countryCode = res.getAddresses(JSON)[0].countryCode
            const timeZone = res.getAddresses(JSON)[0].timeZone
            const countryName = res.getCountryDetails(JSON).name
            const native = res.getCountryDetails(JSON).native
            const continent = res.getCountryDetails(JSON).continent
            const currency = res.getCountryDetails(JSON).currency
            const langs = res.getCountryDetails(JSON).languages
            const countryCapital = res.getCountryDetails(JSON).capital
  
  
            message.reply(
  `_*Number Information*_
  ________________
              
              
  *Name*: ${contactName}
              
  *Carrier Name*: ${carrierName}
              
  *Access*: ${access}
              
  *Type*: ${type}
              
  *Number Type*: ${numberType}
              
  *Continent*: ${continent}
              
  *Country*: ${countryName}
              
  *Native*: ${native}
              
  *Country Code*: ${countryCode}
              
  *Country Languages*: ${langs}
              
  *Country Currency*: ${currency}
              
  *State*: ${city}
              
  *Time Zone*: ${timeZone}
              
  *Country Capital*: ${countryCapital}`)
  
  
  
            }
            catch(err){
              message.reply('*An Error Occured!*\n' + `_*${err}*_`)
            }
            
  
            
  
            
          })
        }
        }
      }
    )
  
    client.on('message', async(message) =>{
      if(message.body == prefix + 'quote'){
          async function randomQuote() {
              const response = await fetch('https://api.quotable.io/random')
              const quote = await response.json()
              
              const qc = quote.content
              const qa = quote.author
      
              message.reply(`*${qc}*\n\n- _*${qa}*_`)
          }
          randomQuote()
      }
  })
  
   client.on('message' , async(message) => {
    if(message.body == prefix + 'technews'){
      async function randomTechNews() {
  
        try{
          const newsArray = await axios.get("https://fantox001-scrappy-api.vercel.app/technews/random")
          const randomNews = newsArray.data;
    
          const news = randomNews.news
          const thumb = randomNews.thumbnail
  
          const chat = await message.getChat();
  
          const media = await MessageMedia.fromUrl(thumb)
  
          chat.sendMessage(media, {caption: `*${news}*`})
  
        }catch(err){
          message.reply('*An Error Occured!*\n' + `_*${err}*_`)
        }
      }
      
      randomTechNews();
    }
   })
  
   client.on('message', async(message) => {
    if(message.hasMedia && message.body == prefix + 'sticker'){
      message.downloadMedia().then(media => {
        if(media){
          const mediaPath = './downloads'
          if(!fs.existsSync(mediaPath)){
            fs.mkdirSync(mediaPath)
          }
          const extension = mime.extension(media.mimetype)
          const fileName = new Date().getTime()
          const fileFullName = mediaPath + fileName + '.' + extension
          try{
            fs.writeFileSync(fileFullName, media.data,{encoding: 'base64'})
            MessageMedia.fromFilePath(filePath = fileFullName)
            client.sendMessage(message.from,new MessageMedia(media.mimetype,media.data,fileName), {sendMediaAsSticker:true , stickerAuthor: stickerAuthor})
            fs.unlinkSync(fileFullName)
          }catch(err){
            message.reply('Failed To Convert!' + err)
          }
        }
      })
    }
   })
  
   client.on('message', async(message) => {
    if(message.hasMedia && message.body == prefix + 'doc'){
      message.downloadMedia().then(media => {
        if(media){
          const mediaPath = './downloads'
          if(!fs.existsSync(mediaPath)){
            fs.mkdirSync(mediaPath)
          }
          const extension = mime.extension(media.mimetype)
          const fileName = new Date().getTime()
          const fileFullName = mediaPath + fileName + '.' + extension
          try{
            fs.writeFileSync(fileFullName, media.data,{encoding: 'base64'})
            MessageMedia.fromFilePath(filePath = fileFullName)
            client.sendMessage(message.from,new MessageMedia(media.mimetype,media.data,fileName), {caption: 'Zynt3x!',sendMediaAsDocument:true})
            fs.unlinkSync(fileFullName)
          }catch(err){
            message.reply('Failed To Convert!' + err)
          }
        }
      })
    }
   })

   client.on('message', async (message) => {
    if (message.body.startsWith('.ytv')){

      const url = message.body.slice(4).trim()

      if(!url){
        message.reply('_*Give me a Youtube Url*_\n\n```ex:' + prefix + 'ytv YouTube Video Url```')
      }

      try{

        ytdl.getInfo(url).then((res) => {
          const videoTitle = res.videoDetails.title
        
          message.reply('_*Downloading...*_\n' + '_' + videoTitle + '_')
        
          const videoStream = ytdl(url, { quality: '18' })
          const videoFileName = 'Zynt3x.mp4'
          videoStream.pipe(fs.createWriteStream(videoFileName))
          
          videoStream.on('finish', () => {
        
            async function yt(){
        
              const chat = await message.getChat()
              const media = await MessageMedia.fromFilePath(videoFileName) 
        
              chat.sendMessage(media , {caption: videoTitle})
        
              fs.unlinkSync(videoFileName)
        
            }yt()
        
          })
        })

      }catch(err){
        message.reply('*An Error Occured!*\n' + `_*${err}*_`)
      }
    }
    })
    client.initialize()
})


