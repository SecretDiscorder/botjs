const {
  MessageType, 
  MessageOptions, MessageMedia,
  Mimetype,
	makeWASocket,
	useMultiFileAuthState,
	DisconnectReason
                         
} = require('@whiskeysockets/baileys');
const math = require('mathjs');
const ytdl = require('ytdl-core');
const fs = require('fs');
const config = require('./config.json');
var quranAyats = require('@kmaslesa/quran-ayats');

// Fungsi untuk menghubungkan bot ke WhatsApp
async function connectToWhatsApp() {
	try {
		// Mengambil status otentikasi dari file
		const {
			state,
			saveCreds
		} = await useMultiFileAuthState("auth_info_baileys");
		const sock = makeWASocket({
			auth: state,
			printQRInTerminal: true,
		});

		// Menyimpan status otentikasi yang diperbarui
		sock.ev.on('creds.update', saveCreds);

		// Meng-handle perubahan status koneksi
		sock.ev.on('connection.update', async (update) => {
			const {
				connection,
				lastDisconnect
			} = update;
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
		sock.ev.on('messages.upsert', async ({
				messages
			}) => {
				const msg = messages[0]; // Ekstrak objek pesan pertama
				console.log(JSON.stringify(msg, undefined, 2));
				const args = msg.message.conversation.split(' ');
				const cmd = args[0]; // Mengambil perintah pertama dari pesan
				const cmdRegex = /^!quran\s*(\d+)\s*(\d+)?\s*(juz\s*(\d+))?$/i;
				const match = msg.message.conversation.match(cmdRegex);
                                const allAyats = quranAyats.getAllAyats();              
fs.writeFileSync('ayat.json', JSON.stringify(allAyats));
			
 	// Fungsi sendQuranVerse diperbaiki
				async function sendQuranVerse(ayahNumber, surahNumber) {
					try {
                               
						// Mendapatkan ayat Al-Quran berdasarkan nomor surah dan a
const ayatData = JSON.parse(fs.readFileSync('ayat.json', 'utf8'));

        // Temukan ayat berdasarkan ayahNumber dan surahNumber.
        const ayah = ayatData.find(ayah => ayah.ayaNumber === ayahNumber && ayah.sura === surahNumber);

        if (ayah) {
            const response = `Surah ${surahNumber}, Ayah ${ayahNumber}: ${ayah.aya}`;
            await sock.sendMessage(msg.key.remoteJid, {
                text: response
            });
        } else {
            // Teks yang akan dikirim jika ayat tidak ditemukan.
            const notFoundResponse = "Ayat tidak ditemukan dalam database.";
            await sock.sendMessage(msg.key.remoteJid, {
                text: notFoundResponse
            });
                }					} catch (error) {
     						console.error(error);
						await sock.sendMessage(msg.key.remoteJid, {
							text: `Terjadi kesalahan: ${error.message}`
						});
					}
				}

				switch (cmd) {
					case '!quran':
						if (args.length === 3) {
							const surahNumber = parseInt(args[1]);
							const ayahNumber = parseInt(args[2]);
							if (!isNaN(surahNumber) && !isNaN(ayahNumber)) {
								await sendQuranVerse(ayahNumber, surahNumber);
							} else {
								await sock.sendMessage(msg.key.remoteJid, {
									text: 'Nomor surah dan ayat harus berupa angka.'
								});
							}
						} else {
							await sock.sendMessage(msg.key.remoteJid, {
								text: 'Format yang benar: !quran [Nomor Surah] [Nomor Ayat]'
							});
						}
					case '!menu':
						sock.sendMessage(msg.key.remoteJid, {text: '*MENU BOT WA. !calculate !pangkat !sqrt !sin !cos !tan !geometri !aritmatika* penggunaan= !calculate 10%2 '});
                                                break;
                                                                     
					case '!calculate':
						const expression = args.slice(1).join(' ');
						const result = math.evaluate(expression);
						sock.sendMessage(msg.key.remoteJid, {text :`Hasil: ${result}`});
						break;
           
					case '!aritmatika':
						if (args.length !== 4) {
							sock.sendMessage(msg.key.remoteJid,  {
								text:'Format yang benar: !aritmatika [a] [n] [d]'});
							return;
						}
						const a = parseFloat(args[1]);
						const n = parseFloat(args[2]);
						const d = parseFloat(args[3]);
						const nthTerm = a + (n - 1) * d;
						sock.sendMessage(msg.key.remoteJid, {text :`Suku ke-${n} dari barisan aritmatika dengan a=${a} dan d=${d} adalah ${nthTerm}`});
						break;

					case '!sin':
						if (args.length !== 2) {
							sock.sendMessage(msg.key.remoteJid, {
								text:'Format yang benar: !sin [sudut]'});
							return;
						}
						const sudutSin = parseFloat(args[1]);
						try {
							const resultSin = math.sin(sudutSin);
							sock.sendMessage(msg.key.remoteJid, {text: `sin(${sudutSin} radian): ${resultSin}`});
						} catch (error) {
							sock.sendMessage(msg.key.remoteJid, {text: 'Terjadi kesalahan dalam perhitungan sin.'});
						}
						break;

					case '!cos':
						if (args.length !== 2) {
							sock.sendMessage(msg.key.remoteJid, {text: 'Format yang benar: !cos [sudut]'});
							return;
						}
						const sudutCos = parseFloat(args[1]);
						try {
							const resultCos = math.cos(sudutCos);
							sock.sendMessage(msg.key.remoteJid, {text : `cos(${sudutCos} radian): ${resultCos}`});
						} catch (error) {
							sock.sendMessage(msg.key.remoteJid, {text: 'Terjadi kesalahan dalam perhitungan cos.'});
						}
						break;

					case '!tan':
						if (args.length !== 2) {
							sock.sendMessage(msg.key.remoteJid, {text: 'Format yang benar: !tan [sudut]'});
							return;
						}
						const sudutTan = parseFloat(args[1]);
						try {
							const resultTan = math.tan(sudutTan);
							sock.sendMessage(msg.key.remoteJid, {text : `tan(${sudutTan} radian): ${resultTan}`});
						} catch (error) {
							sock.sendMessage(msg.key.remoteJid, {text : 'Terjadi kesalahan dalam perhitungan tan.'});
						}
						break;

					case '!pangkat':
						if (args.length !== 3) {
							sock.sendMessage(msg.key.remoteJid, {text : 'Format yang benar: !pangkat [basis] [eksponen]'});
							return;
						}
						const basis = parseFloat(args[1]);
						const eksponen = parseFloat(args[2]);
						try {
							const resultPow = math.pow(basis, eksponen);
							sock.sendMessage(msg.key.remoteJid, {text : `Hasil pangkat dari ${basis}^${eksponen}: ${resultPow}`});
						} catch (error) {
							sock.sendMessage(msg.key.remoteJid, {text :'Terjadi kesalahan dalam perhitungan pangkat.'});
						}
						break;

					case '!sqrt':
						if (args.length !== 2) {
							sock.sendMessage(msg.key.remoteJid, { text :'Format yang benar: !sqrt [angka]'});
							return;
						}
						const angkaSqrt = parseFloat(args[1]);
						if (!isNaN(angkaSqrt)) {
							const resultSqrt = math.sqrt(angkaSqrt);
							sock.sendMessage(msg.key.remoteJid, {text :`Akar kuadrat dari ${angkaSqrt}: ${resultSqrt}`});
						} else {
							sock.sendMessage(msg.key.remoteJid, {text :'Masukkan angka yang valid.'});
						}
						break;

					case '!youtube':
						if (args.length !== 2) {
							sock.sendMessage(msg.key.remoteJid, { text :'Format yang benar: !youtube [URL]'});
							return;
						}
						const url = args[1];
						await detailYouTube(url);
						break;

					case '!download':
						if (args.length !== 4) {
							sock.sendMessage(msg.key.remoteJid, {text :'Format yang benar: !download [URL] [format] [filter]'});
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
                 
		})                         
    } catch (error) {
	console.error('Terjadi kesalahan:', error);
 	}
}
                          
connectToWhatsApp();

