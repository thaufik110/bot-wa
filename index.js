const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const https = require('https');
const qrcode = require('qrcode-terminal');
const { config } = require('dotenv');

config();

const googleApiKey = process.env.GOOGLE_API_KEY;
const searchEngineId = process.env.SEARCH_ENGINE_ID;

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client"
    }),
});

const adminbot = "E X O R C I S T";
const waadmin = "6283165619029";
const botName = "EchoMate";
const contactNumber = "089678858904";

async function getGoogleImage(query, retries = 3) {
    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: googleApiKey,
                cx: searchEngineId,
                q: query,
                searchType: 'image',
                num: 10
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            const randomIndex = Math.floor(Math.random() * response.data.items.length);
            const selectedImage = response.data.items[randomIndex];
            const imageUrl = selectedImage.link;
            const title = selectedImage.title;

            const agent = new https.Agent({
                rejectUnauthorized: false,
            });

            const media = await MessageMedia.fromUrl(imageUrl, {
                unsafeMime: true,
                httpsAgent: agent
            });

            return { media, title, imageUrl };
        } else {
            return null;
        }
    } catch (error) {
        if (retries > 0) {
            console.error(`Retrying... (${3 - retries + 1})`);
            return getGoogleImage(query, retries - 1);
        } else {
            console.error('❌ Error:', error.response ? error.response.data : error.message);
            return null;
        }
    }
}

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot is ready!');
});

client.on('message', async msg => {
    const body = msg.body.trim().toLowerCase();
    const contact = await msg.getContact();
    const senderName = contact.pushname || contact.notifyName || contact.number;

    console.log(`Received message: ${body} from ${senderName}`); // Log message and sender

    if (!body.startsWith('.') && !body.startsWith('send')) {
        return;
    }

    switch (true) {
        case body.startsWith('send') && (msg.from === myNumber || msg.author === myNumber):
            const split = body.split('.');
            const number = split[1] + '@c.us';
            const message = split[2];
            msg.reply('Siap bos!');
            client.sendMessage(number, message);
            break;
        case body === '.menu':
            console.log(`Sending menu to ${senderName}`); // Log menu sending

            const personalizedMenuMessage = `
📞 *Hai, ${senderName}!*  
   └─ _Berikut adalah menu dari bot ini:_

╔═══❖•ೋ° *BOT MENU* °ೋ•❖═══╗

🔹 *1. send.nomor.pesan*  
   └─ _Kirim pesan ke nomor yang dituju (Admin Only)_

🔹 *2. .info*  
   └─ _Informasi tentang bot ini_

🔹 *3. .ping*  
   └─ _Cek status bot_

🔹 *4. .time*  
   └─ _Lihat waktu saat ini_

🔹 *5. .joke*  
   └─ _Dapatkan lelucon acak_

🔹 *6. .quote*  
   └─ _Kutipan inspiratif_

🔹 *7. .ai*  
   └─ _Jawaban dari AI_

🔹 *8. .img <query>*  
   └─ _Cari gambar di Google_

🔹 *9. .gpt <query>*  
   └─ _Gambar dari OpenAI_

🔹 *10. .help*  
   └─ _Bantuan penggunaan bot_

═══════════════════════════
✨ *Explore the features by typing the commands!* ✨
`;

            msg.reply(personalizedMenuMessage);
            break;
            case body === '.info':
                const waLink = `https://wa.me/${waadmin}`;
                msg.reply(`${botName} - Informasi Bot\n\nHai ${senderName}, berikut adalah informasi tentang bot ini.\n\nDeskripsi: ${botName} adalah bot WhatsApp yang dibuat untuk memudahkan berbagai tugas.\nVersi: 1.0\nPengembang: ${adminbot}\nKontak: Hubungi Admin: ${waLink}`);
                break;            
        case body === '.help':
            msg.reply('🔍 Ketik .menu untuk melihat daftar perintah yang tersedia.');
            break;
        case body === '.ping':
            msg.reply('✅ Pong! Bot aktif.');
            break;
        case body === '.time':
            const currentTime = new Date().toLocaleTimeString();
            msg.reply(`🕒 Waktu saat ini: ${currentTime}`);
            break;
        case body === '.joke':
            const jokes = [
                'Kenapa ayam tidak bisa bermain drum? Karena dia sudah punya drumstick!',
                'Apa bedanya kamu sama bulan? Bulan di langit, kamu di hati.',
                'Kenapa komputer tidak bisa menangkap burung? Karena tidak punya "tweet"!'
            ];
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            msg.reply(randomJoke);
            break;
        case body === '.quote':
            const quotes = [
                'Jangan berhenti ketika kamu lelah, berhentilah ketika kamu selesai.',
                'Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.',
                'Orang yang tidak pernah melakukan kesalahan tidak pernah mencoba sesuatu yang baru.'
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            msg.reply(randomQuote);
            break;
        case body.startsWith('.img'):
            const searchQuery = body.replace('.img', '').trim();
            if (searchQuery) {
                await client.sendMessage(msg.from, '⏳ Sedang memproses...');
                const imageResult = await getGoogleImage(searchQuery);
                if (imageResult) {
                    const { media, title, imageUrl } = imageResult;
                    try {
                        await client.sendMessage(msg.from, media, { caption: `Gambar untuk pencarian: *${title}*\nLink: ${imageUrl}` });
                    } catch (error) {
                        console.error('❌ Error sending media:', error.message);
                        msg.reply('❌ Maaf, terjadi kesalahan saat mengirim gambar.');
                    }
                } else {
                    msg.reply('⚠ Maaf, tidak ada gambar yang ditemukan untuk query tersebut.');
                }
            } else {
                msg.reply('⚠ Ketikkan query setelah .img, misalnya: .img kucing.');
            }
            break;
        case body.startsWith('.gpt'):
            const userInput = body.replace('.gpt', '').trim();
            if (!userInput) {
                msg.reply('⚠ Ketikkan deskripsi setelah ".gpt", misalnya: ".gpt sunset".');
                break;
            }
            await client.sendMessage(msg.from, '⏳ Sedang memproses...');
            try {
                const response = await axios.get('https://fastrestapis.fasturl.cloud/media/single', {
                    params: {
                        site: 'real',
                        type: 'random',
                        tag: userInput,
                        filter: 'all'
                    },
                    responseType: 'arraybuffer',
                    headers: {
                        'accept': 'image/png'
                    }
                });
                const media = new MessageMedia('image/png', Buffer.from(response.data).toString('base64'));
                await client.sendMessage(msg.from, media, { caption: `Gambar hasil dari request: "${userInput}".` });
            } catch (error) {
                console.error('❌ Error fetching image:', error.message);
                msg.reply('❌ Terjadi kesalahan, gambar tidak dapat diambil. Coba lagi nanti.');
            }
            break;
        case body.startsWith('.ai'):
            const prompt = body.replace('.ai', '').trim();
            if (!prompt) {
                msg.reply('⚠ Ketikkan prompt setelah ".ai", misalnya: ".ai Kamu tau Jokowi gak?"');
                break;
            }
            await client.sendMessage(msg.from, '⏳ Sedang memproses...');
            try {
                const response = await axios.get('https://fastrestapis.fasturl.cloud/ai/gpt3', {
                    params: { prompt: prompt },
                    headers: { 'accept': 'application/json' }
                });
                if (response.data.status === 200) {
                    const responseText = response.data.response;
                    await msg.reply(responseText);
                } else {
                    msg.reply('⚠ Terjadi kesalahan: ' + response.data.content);
                }
            } catch (error) {
                console.error('❌ Error fetching AI response:', error.message);
                msg.reply('❌ Terjadi kesalahan saat mengambil jawaban AI. Coba lagi nanti.');
            }
            break;
    }
});

client.initialize();
