const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const https = require('https');
const qrcode = require('qrcode-terminal');
const { config } = require('dotenv');

// Load environment variables
config();

const googleApiKey = process.env.GOOGLE_API_KEY
const searchEngineId = process.env.SEARCH_ENGINE_ID

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client"
    }),
});

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
            console.error('Error:', error.response ? error.response.data : error.message);
            return null;
        }
    }
}
  
let myNumber = '6289678858904' + '@c.us';

const responses = [
    'Halo Siapa Ya?',
    'Maaf, siapa ini?',
    'Hey! Saya tidak mengenal Anda.',
    'Siapa nih yang coba hubungi?',
    'Maaf, nomor Anda tidak terdaftar.'
];

const menuMessage = `
*MENU BOT:*
1. *send.nomor.pesan* - Kirim pesan ke nomor yang dituju. (Khusus Admin)
2. *.info* - Dapatkan informasi tentang bot ini.
3. *.ping* - Cek status bot.
4. *.time* - Dapatkan waktu saat ini.
5. *.joke* - Dapatkan lelucon acak.
6. *.quote* - Dapatkan kutipan inspiratif.
7. *.help* - Dapatkan bantuan tentang cara menggunakan bot ini.
8. *.ai* - Dapatkan jawaban berdasarkan prompt dari Fast Rest API.
9. *.img <query>* - Ambil gambar berdasarkan nama pencarian dari Google.
10. *.gpt <query>* - Hasilkan gambar berdasarkan deskripsi dari OpenAI.
`;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    if (msg.body) {
        const body = msg.body.toLowerCase();  // Convert message to lowercase to handle case-insensitive commands
        console.log('Command:', body);

        if (!body.startsWith('.menu') && !body.startsWith('.info') && !body.startsWith('.ping') &&
            !body.startsWith('.time') && !body.startsWith('.joke') && !body.startsWith('.quote') &&
            !body.startsWith('.help') && !body.startsWith('.img') && !body.startsWith('.gpt') &&
            !body.startsWith('.ai') && (msg.from !== myNumber && msg.author !== myNumber)) {
            return; // Do nothing for invalid messages
        }

        switch (true) {
            case body.startsWith('send') && (msg.from === myNumber || msg.author === myNumber):
                let split = msg.body.split('.');
                let number = split[1] + '@c.us';
                let message = split[2];
                msg.reply('Siap bos!');
                client.sendMessage(number, message);
                break;
            case body === '.menu':
                msg.reply(menuMessage);
                break;
            case body === '.info':
                msg.reply('Ini adalah bot WhatsApp yang dikembangkan untuk berbagai tugas otomatis.');
                break;
            case body === '.time':
                let currentTime = new Date().toLocaleTimeString();
                msg.reply(`Waktu saat ini: ${currentTime}`);
                break;
            case body === '.joke':
                let jokes = [
                    'Kenapa ayam tidak bisa bermain drum? Karena dia sudah punya drumstick!',
                    'Apa bedanya kamu sama bulan? Bulan di langit, kamu di hati.',
                    'Kenapa komputer tidak bisa menangkap burung? Karena tidak punya "tweet"!'
                ];
                let randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                msg.reply(randomJoke);
                break;
            case body === '.quote':
                let quotes = [
                    'Jangan berhenti ketika kamu lelah, berhentilah ketika kamu selesai.',
                    'Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.',
                    'Orang yang tidak pernah melakukan kesalahan tidak pernah mencoba sesuatu yang baru.'
                ];
                let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                msg.reply(randomQuote);
                break;
            case body === '.help':
                msg.reply('Ketik .menu untuk melihat daftar perintah yang tersedia.');
                break;
            case body === '.ping':
                msg.reply('Pong! Bot aktif.');
                break;
            case body.startsWith('.img'):
                const searchQuery = body.replace('.img', '').trim();
                if (searchQuery) {
                    const imageResult = await getGoogleImage(searchQuery);
                    if (imageResult) {
                        const { media, title, imageUrl } = imageResult;
                        try {
                            await client.sendMessage(msg.from, media, { caption: `Gambar untuk pencarian: *${title}*\nLink: ${imageUrl}` });
                        } catch (error) {
                            console.error('Error sending media:', error.message);
                            msg.reply('Maaf, terjadi kesalahan saat mengirim gambar.');
                        }
                    } else {
                        msg.reply('Maaf, tidak ada gambar yang ditemukan untuk query tersebut.');
                    }
                } else {
                    msg.reply('Ketikkan query setelah .img, misalnya: .img kucing.');
                }
                break;
                case body.startsWith('.gpt'):
                    // Extract the user's input after the ".gpt" command
                    const userInput = body.replace('.gpt', '').trim();
                    
                    if (!userInput) {
                        msg.reply('Ketikkan deskripsi setelah ".gpt", misalnya: ".gpt sunset".');
                        break;
                    }
                    
                    msg.reply('Sedang memproses...');
                    
                    try {
                        // Send GET request using axios to the provided URL with user input as the 'tag'
                        const response = await axios.get('https://fastrestapis.fasturl.cloud/media/single', {
                            params: {
                                site: 'real',
                                type: 'random',
                                tag: userInput,
                                filter: 'all'
                            },
                            responseType: 'arraybuffer',  // Ensure the response is treated as binary data
                            headers: {
                                'accept': 'image/png'
                            }
                        });
                
                        // Convert the image to a WhatsApp-compatible media object
                        const media = new MessageMedia('image/png', Buffer.from(response.data).toString('base64'));
                
                        // Send the image back to the user
                        await client.sendMessage(msg.from, media, { caption: `Gambar hasil dari request: "${userInput}".` });
                    } catch (error) {
                        console.error('Error fetching image:', error.message);
                        msg.reply('Terjadi kesalahan, gambar tidak dapat diambil. Coba lagi nanti.');
                    }
                    break;
                    case body.startsWith('.ai'):
                        const prompt = body.replace('.ai', '').trim();
                        
                        if (!prompt) {
                            msg.reply('Ketikkan prompt setelah ".ai", misalnya: ".ai Kamu tau Jokowi gak?"');
                            break;
                        }
                        
                        msg.reply('Sedang memproses...');
                        
                        try {
                            // Send GET request to Fast Rest API
                            const response = await axios.get('https://fastrestapis.fasturl.cloud/ai/gpt3', {
                                params: {
                                    prompt: prompt
                                },
                                headers: {
                                    'accept': 'application/json'
                                }
                            });
        
                            if (response.data.status === 200) {
                                const responseText = response.data.response;
                                await msg.reply(responseText);
                            } else {
                                msg.reply('Terjadi kesalahan: ' + response.data.content);
                            }
                        } catch (error) {
                            console.error('Error fetching AI response:', error.message);
                            msg.reply('Terjadi kesalahan saat mengambil jawaban AI. Coba lagi nanti.');
                        }
                        break;                
                    default:
                        if (msg.from !== myNumber && msg.author !== myNumber) {
                            let randomResponse = responses[Math.floor(Math.random() * responses.length)];
                            msg.reply(randomResponse);
                        } else {
                            msg.reply('Halo bro');
                        }
                }
            }
        });                

client.initialize();
