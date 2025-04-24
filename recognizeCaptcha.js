const Tesseract = require('tesseract.js');
const path = require('path');

const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha.jpg');

async function recognizeCaptchaText() {
    try {

        const { data: { text } } = await Tesseract.recognize(
            CAPTCHA_IMAGE_PATH,
            'eng',
            {
                logger: (m) => console.log(m),
            }
        );
        console.log("Text ::" + text)
        return text;
    } catch (err) {
        console.error('❌ Error extracting captcha text:', err.message);
    }
}

module.exports = recognizeCaptchaText;
recognizeCaptchaText();