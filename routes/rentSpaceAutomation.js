require('dotenv').config();
const puppeteer = require('puppeteer');

async function rentSpaceAutomation(startDay, endDay) {
    const option={
        headless: false,
        defaultViewport: { width: 1366, height: 768 },
        puppeteer.executablePath:
            process.env.NODE_ENV === 'production'
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
    }

    try {
        const browser = await puppeteer.launch(option);
        const page = await browser.newPage();

        // Navigate to NTOU club system login page
        console.log('Opening login page...');
        await page.goto('https://sclub.ntou.edu.tw/login.php', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Select student login
        console.log('Selecting student login...');
        await page.waitForSelector('input[name="lc"][value="2"]', { timeout: 30000 });
        await page.click('input[name="lc"][value="2"]'); 

        // Login
        await page.type('input[name="account"]', process.env.ACCOUNT);
        await page.type('input[name="passwd"]', process.env.PASSWORD);

        // Wait for navigation after login
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            new Promise(resolve => {
                const checkLoginButton = setInterval(async () => {
                    const url = page.url();
                    if (!url.includes('login.php')) {
                        clearInterval(checkLoginButton);
                        resolve();
                    }
                }, 100);
            })
        ]);

        // ...existing code...

        await browser.close();
    } catch (error) {
        console.error("Automation task failed:", error);
    }
}

module.exports = rentSpaceAutomation;