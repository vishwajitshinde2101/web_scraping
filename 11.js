const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

// Disable SSL verification temporarily
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Captcha URL and Parameters
const CAPTCHA_URL = 'https://freesearchigrservice.maharashtra.gov.in/Handler.ashx?txt=8c779b';

// Image download path
const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha.jpg');

// Step 1: Setup headers and cookies (same as curl)
const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,mr;q=0.7',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': '__CSRFCOOKIE=; ASMSAUTH=; ASP.NET_SessionId=App6-69~hexsbfaq54ja3prnxmwz4x32',
};

async function downloadCaptcha() {
    try {
        // Make the GET request with headers and cookies
        const response = await axios.get(CAPTCHA_URL, { headers, responseType: 'arraybuffer' });

        // Save the image to a file
        fs.writeFileSync(CAPTCHA_IMAGE_PATH, response.data);
        console.log('✅ Captcha image downloaded successfully.');

        // After downloading, process the image using Tesseract.js
        recognizeCaptchaText();
    } catch (err) {
        console.error('❌ Error downloading captcha:', err.message);
    }
}

async function recognizeCaptchaText() {
    try {
        // Use Tesseract.js to recognize text from the downloaded image
        const { data: { text } } = await Tesseract.recognize(
            CAPTCHA_IMAGE_PATH,       // Path to the captcha image
            'eng',                    // Language (you can add 'mar' for Marathi if needed)
            {
                logger: (m) => console.log(m),  // Optional: Logs progress of OCR
            }
        );
        console.log('✅ Captcha text:', text);  // Output the extracted text
    } catch (err) {
        console.error('❌ Error extracting captcha text:', err.message);
    }
}

downloadCaptcha();



// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');
//
// // Disable SSL verification temporarily
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//
// // Captcha URL and Parameters
// const CAPTCHA_URL = 'https://freesearchigrservice.maharashtra.gov.in/Handler.ashx?txt=8c779b';
//
// // Image download path
// const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha.jpg');
//
// // Step 1: Setup headers and cookies (same as curl)
// const headers = {
//     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//     'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,mr;q=0.7',
//     'Cache-Control': 'max-age=0',
//     'Connection': 'keep-alive',
//     'Sec-Fetch-Dest': 'document',
//     'Sec-Fetch-Mode': 'navigate',
//     'Sec-Fetch-Site': 'none',
//     'Sec-Fetch-User': '?1',
//     'Upgrade-Insecure-Requests': '1',
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
//     'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
//     'sec-ch-ua-mobile': '?0',
//     'sec-ch-ua-platform': '"macOS"',
//     'Cookie': '__CSRFCOOKIE=; ASMSAUTH=; ASP.NET_SessionId=App6-69~hexsbfaq54ja3prnxmwz4x32',
// };
//
// async function downloadCaptcha() {
//     try {
//         // Make the GET request with headers and cookies
//         const response = await axios.get(CAPTCHA_URL, { headers, responseType: 'arraybuffer' });
//
//         // Save the image to a file
//         fs.writeFileSync(CAPTCHA_IMAGE_PATH, response.data);
//         console.log('✅ Captcha image downloaded successfully.');
//     } catch (err) {
//         console.error('❌ Error downloading captcha:', err.message);
//     }
// }
//
// downloadCaptcha();




// const fs = require('fs');
// const axios = require('axios');
// const https = require('https');
// const sharp = require('sharp');
// const Tesseract = require('tesseract.js');
//
// const httpsAgent = new https.Agent({ rejectUnauthorized: false });
//
// async function downloadAndReadCaptcha() {
//     const url = 'https://freesearchigrservice.maharashtra.gov.in/Handler.ashx?txt=d0bc626';
//
//     try {
//         const response = await axios.get(url, {
//             responseType: 'arraybuffer',
//             httpsAgent,
//         });
//
//         fs.writeFileSync('captcha.jpg', response.data);
//         console.log('Captcha image saved.');
//
//         // Pre-process the image
//         await sharp('captcha.jpg')
//             .grayscale()
//             .normalize()              // enhance contrast
//             .threshold(140)           // make text more bold
//             .sharpen()                // reduce blur
//             .toFile('processed.jpg');
//
//         console.log('Image preprocessed.');
//
//         const result = await Tesseract.recognize('processed.jpg', 'eng', {
//             tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
//         });
//
//         console.log('Captcha Text:', result.data.text.trim());
//     } catch (error) {
//         console.error('Error:', error.message);
//     }
// }
//
// downloadAndReadCaptcha();
