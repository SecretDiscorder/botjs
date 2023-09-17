const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  MessageType, 
  MessageOptions, MessageMedia,
  Mimetype
} = require('@whiskeysockets/baileys');
const math = require('mathjs');
const ytdl = require('ytdl-core');
const fs = require('fs');
const config = require('./config.json');
// Fungsi untuk menghubungkan bot ke WhatsApp
async function connectToWhatsApp() {
  try {
    // Mengambil status otentikasi dari file
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    // Menyimpan status otentikasi yang diperbarui
    sock.ev.on('creds.update', saveCreds);

    // Meng-handle perubahan status koneksi
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
        // Reconnect jika belum logout
        if (shouldReconnect) {
          await connectToWhatsApp(); // Perhatikan penggunaan 'await'
        }
      } else if (connection === 'open') {
        console.log('Opened connection');
      }
    });

    // Meng-handle pesan yang diterima
    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0]; // Ekstrak objek pesan pertama
      console.log(JSON.stringify(msg, undefined, 2));
      const args = msg.message.conversation.split(' ');
      const cmd = args[0]; // Mengambil perintah pertama dari pesan

      // Fungsi untuk membalas pesan
      async function reply(text) {
        const quotedMessage = {
          key: {
            remoteJid: msg.key.remoteJid,
            fromMe: false,
            id: Math.floor(Math.random() * 1000000).toString(),
          },
          message: {
            conversation: text,
          },
        };

        await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: quotedMessage });
      }

      async function detailYouTube(url) {
        await sock.sendMessage(msg.key.remoteJid, {text:'[⏳] Loading..'});
        try {
          let info = await ytdl.getInfo(url);
          let data = {
            channel: {
              name: info.videoDetails.author.name,
              user: info.videoDetails.author.user,
              channelUrl: info.videoDetails.author.channel_url,
              userUrl: info.videoDetails.author.user_url,
              verified: info.videoDetails.author.verified,
              subscriber: info.videoDetails.author.subscriber_count,
            },
            video: {
              title: info.videoDetails.title,
              description: info.videoDetails.description,
              lengthSeconds: info.videoDetails.lengthSeconds,
              videoUrl: info.videoDetails.video_url,
              publishDate: info.videoDetails.publishDate,
              viewCount: info.videoDetails.viewCount,
            },
          };
          await sock.sendMessage(msg.key.remoteJid, `*CHANNEL DETAILS*\n• Name : ${data.channel.name}\n• User : ${data.channel.user}\n• Verified : ${data.channel.verified}\n• Channel : ${data.channel.channelUrl}\n• Subscriber : ${data.channel.subscriber}`);
          await sock.sendMessage(msg.key.remoteJid, `*VIDEO DETAILS*\n• Title : ${data.video.title}\n• Seconds : ${data.video.lengthSeconds}\n• VideoURL : ${data.video.videoUrl}\n• Publish : ${data.video.publishDate}\n• Viewers : ${data.video.viewCount}`)
          await sock.sendMessage(msg.key.remoteJid, '*[✅]* Successfully!');
        } catch (err) {
          console.log(err);
          await sock.sendMessage(msg.key.remoteJid, '*[❎]* Failed!');
        }
      }

      async function downloadYouTube(url, format, filter) {
        await sock.sendMessage(msg.key.remoteJid, {text: '[⏳] Loading..'});
        let timeStart = Date.now();
        try {
          let info = await ytdl.getInfo(url);
          let data = {
            channel: {
              name: info.videoDetails.author.name,
              user: info.videoDetails.author.user,
              channelUrl: info.videoDetails.author.channel_url,
              userUrl: info.videoDetails.author.user_url,
              verified: info.videoDetails.author.verified,
              subscriber: info.videoDetails.author.subscriber_count,
            },
            video: {
              title: info.videoDetails.title,
              description: info.videoDetails.description,
              lengthSeconds: info.videoDetails.lengthSeconds,
              videoUrl: info.videoDetails.video_url,
              publishDate: info.videoDetails.publishDate,
              viewCount: info.videoDetails.viewCount,
            },
          };
          ytdl(url, {
            filter: filter,
            format: format,
            quality: 'highest'
          }).pipe(fs.createWriteStream(`./download.${format}`)).on('finish', async () => {
            let timestamp = Date.now() - timeStart;                
			const media = {"filename": `download.${format}`};

                
            media.filename = `${config.filename.mp3}.${format}`;
            await sock.sendMessage(msg.key.remoteJid, { audio: {url: 'download.mp3'}, mimetype: 'audio/mp4' });
            await sock.sendMessage(msg.key.remoteJid, { text: `• Title : ${data.video.title}\n• Channel : ${data.channel.user}\n• View Count : ${data.video.viewCount}\n• TimeStamp : ${timestamp}`});
            await sock.sendMessage(msg.key.remoteJid, { text: '*[✅]* Successfully!'});
          });
        } catch (err) {
          console.log(err);
          await sock.sendMessage(msg.key.remoteJid, '*[❎]* Failed!');
        }
      }

      // Memproses perintah yang diterima
      switch (cmd) {
        case '!menu':
          reply('*MENU BOT WA. !calculate !pangkat !sqrt !sin !cos !tan !geometri !aritmatika* penggunaan= !calculate 10%2 ');
          break;

        case '!calculate':
          const expression = args.slice(1).join(' ');
          const result = math.evaluate(expression);
          reply(`Hasil: ${result}`);
          break;

        case '!aritmatika':
          if (args.length !== 4) {
            reply('Format yang benar: !aritmatika [a] [n] [d]');
            return;
          }
          const a = parseFloat(args[1]);
          const n = parseFloat(args[2]);
          const d = parseFloat(args[3]);
          const nthTerm = a + (n - 1) * d;
          reply(`Suku ke-${n} dari barisan aritmatika dengan a=${a} dan d=${d} adalah ${nthTerm}`);
          break;

        case '!sin':
          if (args.length !== 2) {
            reply('Format yang benar: !sin [sudut]');
            return;
          }
          const sudutSin = parseFloat(args[1]);
          try {
            const resultSin = math.sin(sudutSin);
            reply(`sin(${sudutSin} radian): ${resultSin}`);
          } catch (error) {
            reply('Terjadi kesalahan dalam perhitungan sin.');
          }
          break;

        case '!cos':
          if (args.length !== 2) {
            reply('Format yang benar: !cos [sudut]');
            return;
          }
          const sudutCos = parseFloat(args[1]);
          try {
            const resultCos = math.cos(sudutCos);
            reply(`cos(${sudutCos} radian): ${resultCos}`);
          } catch (error) {
            reply('Terjadi kesalahan dalam perhitungan cos.');
          }
          break;

        case '!tan':
          if (args.length !== 2) {
            reply('Format yang benar: !tan [sudut]');
            return;
          }
          const sudutTan = parseFloat(args[1]);
          try {
            const resultTan = math.tan(sudutTan);
            reply(`tan(${sudutTan} radian): ${resultTan}`);
          } catch (error) {
            reply('Terjadi kesalahan dalam perhitungan tan.');
          }
          break;

        case '!pangkat':
          if (args.length !== 3) {
            reply('Format yang benar: !pangkat [basis] [eksponen]');
            return;
          }
          const basis = parseFloat(args[1]);
          const eksponen = parseFloat(args[2]);
          try {
            const resultPow = math.pow(basis, eksponen);
            reply(`Hasil pangkat dari ${basis}^${eksponen}: ${resultPow}`);
          } catch (error) {
            reply('Terjadi kesalahan dalam perhitungan pangkat.');
          }
          break;

        case '!sqrt':
          if (args.length !== 2) {
            reply('Format yang benar: !sqrt [angka]');
            return;
          }
          const angkaSqrt = parseFloat(args[1]);
          if (!isNaN(angkaSqrt)) {
            const resultSqrt = math.sqrt(angkaSqrt);
            reply(`Akar kuadrat dari ${angkaSqrt}: ${resultSqrt}`);
          } else {
            reply('Masukkan angka yang valid.');
          }
          break;

        case '!youtube':
          if (args.length !== 2) {
            reply('Format yang benar: !youtube [URL]');
            return;
          }
          const url = args[1];
          await detailYouTube(url);
          break;

        case '!download':
          if (args.length !== 4) {
            reply('Format yang benar: !download [URL] [format] [filter]');
            return;
          }
          const downloadUrl = args[1];
          const format = args[2];
          const filter = args[3];
          await downloadYouTube(downloadUrl, format, filter);
          break;

        default:
          break;
      }
    });
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Menjalankan fungsi connectToWhatsApp() saat skrip dimulai
connectToWhatsApp();
