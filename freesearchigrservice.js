const Tesseract = require('tesseract.js');
const puppeteer = require('puppeteer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql2/promise');
const captchaSelector = '#imgCaptcha_new';
const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha_from_ui.jpg');

// const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha.jpg');

async function getPlots() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'root@123',
        database: 'bhoomi21'
    });

    const [rows] = await connection.execute('SELECT plot_number FROM plot');
    console.log(rows);
    await connection.end();
}


async function handleCaptcha(page) {
    await page.waitForSelector(captchaSelector);
    const captchaElement = await page.$(captchaSelector);
    await captchaElement.screenshot({ path: CAPTCHA_IMAGE_PATH });
    console.log('✅ Captcha screenshot taken from UI');

    const { data: { text: captchaCode } } = await Tesseract.recognize(
        CAPTCHA_IMAGE_PATH,
        'eng',
        { logger: m => console.log(m) }
    );
    const trimmedCaptcha = captchaCode.trim();
    console.log('📌 Recognized Captcha:', trimmedCaptcha);

    await page.click('#txtImg1', { clickCount: 3 }); // clear if already anything there
    await page.type('#txtImg1', trimmedCaptcha);
}



async function runAutomation() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    await page.goto('https://freesearchigrservice.maharashtra.gov.in/', {waitUntil: 'domcontentloaded'});

    await page.waitForSelector('.btnclose.btn.btn-danger');
    await page.click('.btnclose.btn.btn-danger');
    console.log('✅ Popup closed');

    const plots = await getPlots();
    // const plotNumbers = plots.map(item => item.plot_number);

    // console.log(plotNumbers);
    // for (const plot of plotNumbers) {
    //     console.log(`Processing Plot: ${plot} in ${plot}, ${plot}, ${plot}`);

    await page.waitForTimeout(2000);
    await page.waitForSelector('#btnOtherdistrictSearch');
    await page.evaluate(() => {
        const btn = document.querySelector('#btnOtherdistrictSearch');
        btn.click();
    });
    console.log('✅ Clicked "Rest of Maharashtra"');

    await page.waitForTimeout(2000);
    await page.waitForSelector('#ddlFromYear1');
    await page.select('#ddlFromYear1', '2024');
    console.log('✅ Year selected');

    // await page.waitForTimeout(5000);
    await page.waitForSelector('#ddlDistrict1');
    await page.select('#ddlDistrict1', '1');
    console.log('✅ District selected');

    await page.waitForTimeout(5000);

    await page.waitForSelector('#ddltahsil');
    await page.click('#ddltahsil');
    await page.evaluate(() => {
        const tahsil = document.querySelector('#ddltahsil');
        if (tahsil && tahsil.options.length > 1) {
            tahsil.selectedIndex = 10;
            tahsil.dispatchEvent(new Event('change', {bubbles: true}));
        }
    });
    console.log('✅ Tahsil selected');

    await page.waitForTimeout(5000);

    // await page.waitForTimeout(3000);

    await page.waitForSelector('#ddlvillage');
    await page.click('#ddlvillage');
    await page.evaluate(() => {
        const villageDropdown = document.querySelector('#ddlvillage');
        if (villageDropdown && villageDropdown.options.length > 1) {
            villageDropdown.selectedIndex = 1;
            villageDropdown.dispatchEvent(new Event('change', {bubbles: true}));
        }
    });
    console.log('✅ Village selected');

    await page.waitForTimeout(3000);


    await page.waitForSelector('#txtAttributeValue1');
    await page.type('#txtAttributeValue1', '1');
    console.log('✅ Value entered');
    await page.waitForTimeout(2000);

    await handleCaptcha(page); // 🔁 First attempt

    await page.waitForTimeout(2000);
    await page.click('#btnSearch_RestMaha');
    console.log('✅ Search button clicked');

    await page.waitForTimeout(3000);

// 🔁 Retry logic: second captcha try
    await handleCaptcha(page); // 🔁 Second attempt

    await page.waitForTimeout(2000);
    await page.click('#btnSearch_RestMaha');
    console.log('✅ Retried Search button clicked');
    // await browser.close();
}

runAutomation();
