const fs = require('fs');
const axios = require('axios');
const https = require('https');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function downloadAndReadCaptcha() {
    const url = 'https://freesearchigrservice.maharashtra.gov.in/Handler.ashx?txt=d0bc626';

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent,
        });

        fs.writeFileSync('captcha.jpg', response.data);
        console.log('Captcha image saved.');

        // Preprocess: Convert to grayscale to improve OCR
        await sharp('captcha.jpg')
            .grayscale()
            .threshold(150)
            .toFile('processed.jpg');

        console.log('Image preprocessed.');

        const result = await Tesseract.recognize('processed.jpg', 'eng');
        console.log('Captcha Text:', result.data.text.trim());
    } catch (error) {
        console.error('Error:', error.message);
    }
}

downloadAndReadCaptcha();
