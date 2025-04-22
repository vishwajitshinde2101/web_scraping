
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    await page.goto('https://freesearchigrservice.maharashtra.gov.in/', {
        waitUntil: 'domcontentloaded'
    });

    // Close popup
    await page.waitForSelector('.btnclose.btn.btn-danger');
    await page.click('.btnclose.btn.btn-danger');
    console.log('✅ Popup closed');

    // Click "Rest of Maharashtra"
    await page.waitForSelector('#btnOtherdistrictSearch');
    await page.evaluate(() => {
        const button = document.querySelector('#btnOtherdistrictSearch');
        const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        button.dispatchEvent(event);
    });
    console.log('✅ "Rest of Maharashtra" button clicked');

    await page.waitForSelector('#ddlFromYear1', { visible: true });
    await page.select('#ddlFromYear1', '2024');
    console.log('✅ Year 2024 selected from dropdown');

    await page.waitForSelector('#ddlDistrict1');
    await page.select('#ddlDistrict1', '1');
    console.log('✅ District "Pune" selected');

    await page.waitForTimeout(5000);

    await page.waitForSelector('#ddltahsil', { visible: true, timeout: 20000 });

    await page.click('#ddltahsil');
    console.log('✅ Tahsil dropdown clicked');

    await page.evaluate(() => {
        const dd = document.querySelector('#ddltahsil');
        if (dd && dd.options.length > 1) {
            dd.selectedIndex = 1;
            dd.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    console.log('✅ Second Tahsil selected');

    // Wait for data to load (this could be any element that signals content is updated)
    await page.waitForFunction(() => {
        const updatedElement = document.querySelector('#ddltahsil');
        return updatedElement && updatedElement.innerText !== '';
    }, { timeout: 10000 });
    console.log('✅ Data loaded after selecting Taluka');


    await page.waitForSelector('#txtAttributeValue1', { visible: true, timeout: 10000 });
    await page.type('#txtAttributeValue1', '1');
    console.log('✅ Value "1" pasted in #txtAttributeValue1');



    await page.waitForTimeout(5000);


    await browser.close();
})();


