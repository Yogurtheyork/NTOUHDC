import 'dotenv/config';
import puppeteer from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

const chromePath = process.env.CHROME_PATH || '/opt/render/.cache/puppeteer/chrome/linux-1095492/chrome-linux/chrome';

async function rentSpaceAutomation(startDay, endDay) {
    let options = {
        headless: true,
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: chromePath
    };

    try {
        const browser = await puppeteer.launch(options);
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

export default rentSpaceAutomation;