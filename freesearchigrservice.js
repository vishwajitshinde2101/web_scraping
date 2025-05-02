const Tesseract = require('tesseract.js');
const puppeteer = require('puppeteer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql2/promise');
const captchaSelector = '#imgCaptcha_new';
const CAPTCHA_IMAGE_PATH = path.join(__dirname, 'captcha_from_ui.jpg');


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

    await page.click('#txtImg1', { clickCount: 3 });
    await page.type('#txtImg1', trimmedCaptcha);
}



async function runAutomation() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });



    const page = await browser.newPage();

    if (page.length > 0) {
        try {
            await pages[0].close(); // now close the original about:blank tab
            console.log('✅ Default about:blank tab closed');
        } catch (err) {
            console.log('⚠️ Could not close initial tab:', err.message);
        }
    }

    await page.goto('https://freesearchigrservice.maharashtra.gov.in/', {waitUntil: 'domcontentloaded'});

    await page.waitForSelector('.btnclose.btn.btn-danger');
    await page.click('.btnclose.btn.btn-danger');
    console.log('✅ Popup closed');

    const plots = await getPlots();
    // const plotNumbers = plots.map(item => item.plot_number);

    // console.log(plotNumbers);
    // for (const plot of plotNumbers) {
    //     console.log(`Processing Plot: ${plot} in ${plot}, ${plot}, ${plot}`);

    // await page.waitForTimeout(1000);
    await page.waitForSelector('#btnOtherdistrictSearch');
    await page.evaluate(() => {
        const btn = document.querySelector('#btnOtherdistrictSearch');
        btn.click();
    });
    console.log('✅ Clicked "Rest of Maharashtra"');

    // await page.waitForTimeout(1000);
    await page.waitForSelector('#ddlFromYear1');
    await page.select('#ddlFromYear1', '2024');
    console.log('✅ Year selected');

    // await page.waitForTimeout(5000);
    await page.waitForSelector('#ddlDistrict1');
    await page.select('#ddlDistrict1', '1');
    console.log('✅ District selected');

    await page.waitForTimeout(3000);

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

    await page.waitForTimeout(2000);

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

    await page.waitForTimeout(2000);


    await page.waitForSelector('#txtAttributeValue1');
    await page.type('#txtAttributeValue1', '1');
    console.log('✅ Value entered');
    await page.waitForTimeout(2000);

    await handleCaptcha(page);

    // await page.waitForTimeout(2000);
    await page.click('#btnSearch_RestMaha');
    console.log('✅ Search button clicked');

    await page.waitForTimeout(2000);

    await handleCaptcha(page);

    // await page.waitForTimeout(2000);
    await page.click('#btnSearch_RestMaha');
    console.log('✅ Retried Search button clicked');
    // await browser.close();


// Monitor API response
    let checkedApiResponse = false;

    // 🔁 Close the "about:blank" tab before checking the API response
    const allPages = await browser.pages();
    for (const pg of allPages) {
        const url = pg.url();
        if (url === 'about:blank') {
            await pg.close();
            console.log('❌ Closed about:blank tab');
        }
    }



    page.on('response', async (response) => {
        if (checkedApiResponse) return;


        const url = response.url();
        const status = response.status();

        if (url.includes('https://freesearchigrservice.maharashtra.gov.in/') && status === 200) {
            console.log('✅ API call successful with status 200');

            try {
                const responseBody = await response.text();
                // console.log("responseBody ::" + responseBody);
                if (responseBody.includes('RegistrationGrid')) {
                    console.log('✅ RegistrationGrid FOUND in API response');

                    await page.waitForSelector('#RegistrationGrid input[value="IndexII"]');

                    const buttons = await page.$$('#RegistrationGrid input[value="IndexII"]');
                    console.log("buttons ::  "+ buttons)

                    const buttonCount = await page.$$eval('#RegistrationGrid input[value="IndexII"]', buttons => buttons.length);
                    console.log("Total buttons: ", buttonCount);

                    for (let i = 0; i < buttonCount; i++) {
                        const [originalPage] = await browser.pages();

                        // refetch fresh button
                        const buttons = await page.$$('#RegistrationGrid input[value="IndexII"]');
                        const btn = buttons[i];

                        const parentTd = await btn.evaluateHandle(node => node.closest('td'));
                        const parentTr = await parentTd.evaluateHandle(td => td.closest('tr'));

                        const allTds = await parentTr.$$eval('td', tds => tds.map(td => td.innerHTML));
                        const lastTdIndex = allTds.length - 1;

                        const lastTdBtn = await parentTr.$$('td');
                        const finalBtn = await lastTdBtn[lastTdIndex].$('input');

                        if (finalBtn) {
                            const newPagePromise = new Promise(resolve =>
                                browser.once('targetcreated', async target => {
                                    const newPage = await target.page();
                                    await newPage.bringToFront();
                                    resolve(newPage);
                                })
                            );

                            await finalBtn.click();
                            console.log(`✅ "IndexII" button clicked (${i + 1}/${buttonCount})`);

                            const newPage = await newPagePromise;
                            await newPage.waitForTimeout(3000); // adjust as needed
                            console.log('🆕 New tab opened');

                            // SAVE AS PDF
                            const fileName = `IndexII_${i + 1}.pdf`; // you can customize the name
                            const filePath = path.join(__dirname, 'pdfs', fileName);

                             // create pdf folder if not exist
                            if (!fs.existsSync(path.join(__dirname, 'pdfs'))) {
                                fs.mkdirSync(path.join(__dirname, 'pdfs'));
                            }

                            await newPage.pdf({
                                path: filePath,
                                format: 'A4',
                                printBackground: true
                            });
                            console.log(`📄 Saved PDF: ${filePath}`);

                            await newPage.close();
                            console.log('❌ New tab closed');

                            await originalPage.bringToFront();
                        } else {
                            console.log('❌ Last <td> does not have a button');
                        }
                    }
                } else {
                    console.log('❌ RegistrationGrid NOT found in API response');
                }
            } catch (err) {
                console.error('❌ Error reading response:', err.message);
            }

            checkedApiResponse = true;
        }
    });

    await page.waitForTimeout(3000);

    if (!checkedApiResponse) {
        console.log('⚠️ API response not OK, retrying captcha and search...');
        await handleCaptcha(page); // Retry
        await page.waitForTimeout(2000);
        await page.click('#btnSearch_RestMaha');
        console.log('✅ Retried Search button clicked');
    }
}

runAutomation();
