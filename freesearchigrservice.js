const puppeteer = require('puppeteer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql2/promise');
const recognizeCaptchaText = require('./recognizeCaptcha');

const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha.jpg');

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


async function downloadCaptcha() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const CAPTCHA_URL = 'https://freesearchigrservice.maharashtra.gov.in/Handler.ashx?txt=8c779b';
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
        'Cookie': 'ASP.NET_SessionId=App5-44~dfo0uh30lajxc5ts2lbvfk2x',
    };

    try {
        const response = await axios.get(CAPTCHA_URL, {headers, responseType: 'arraybuffer'});
        fs.writeFileSync(CAPTCHA_IMAGE_PATH, response.data);
        console.log('✅ Captcha image downloaded');
    } catch (err) {
        console.error('❌ Failed to download captcha:', err.message);
    }
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

    // await page.waitForTimeout(5000);


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

    // await page.waitForTimeout(5000);


    await page.waitForSelector('#txtAttributeValue1');
    await page.type('#txtAttributeValue1', '1');
    console.log('✅ Value entered');

    // await page.waitForTimeout(5000);
    await downloadCaptcha();
    const captchaCode = await recognizeCaptchaText(CAPTCHA_IMAGE_PATH);
    console.log('📌 Recognized Captcha:', captchaCode);

    await page.waitForSelector('#txtImg1');
    await page.type('#txtImg1', captchaCode);
    console.log('✅ Captcha entered');

    await page.waitForSelector('#btnOtherdistrictSearch');
    await page.evaluate(() => {
        const btn = document.querySelector('#btnOtherdistrictSearch');
        btn.click();
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('#btnSearch_RestMaha');
    await page.click('#btnSearch_RestMaha');
    console.log('✅ Search button clicked');
    // await browser.close();
}

runAutomation();
