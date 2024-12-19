// rentSpaceAutomation.js
const puppeteer = require('puppeteer');

async function rentSpaceAutomation(startDay, endDay) {
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for CAPTCHA input
        defaultViewport: { width: 1366, height: 768 }
    });
    
    try {
        const page = await browser.newPage();

        // Navigate to NTOU club system login page
        console.log('Opening login page...');
        await page.goto('https://sclub.ntou.edu.tw/login.php', {
            waitUntil: 'networkidle0'
        });

        // Select student login
        console.log('Selecting student login...');
        await page.waitForSelector('input[name="lc"][value="2"]');
        await page.click('input[name="lc"][value="2"]');

        // Fill in credentials but wait for manual CAPTCHA input
        await page.type('input[name="account"]', process.env.ACCOUNT);
        await page.type('input[name="passwd"]', process.env.PASSWORD);

        // Wait for login form submission (after manual CAPTCHA input)
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            // Wait for user to input CAPTCHA and submit form
            new Promise(resolve => {
                const checkLoginButton = setInterval(async () => {
                    const url = page.url();
                    if (!url.includes('login.php')) {
                        clearInterval(checkLoginButton);
                        resolve();
                    }
                }, 1000);
            })
        ]);

        // Process each day in the date range
        const currentDate = new Date(startDay);
        const endDate = new Date(endDay);
        
        while (currentDate <= endDate) {
            console.log(`Processing date: ${currentDate.toISOString().split('T')[0]}`);
            
            // Navigate to space rental page
            await page.goto('https://sclub.ntou.edu.tw/?p=vb_ap&wk=add', {
                waitUntil: 'networkidle0'
            });

            await page.select('select[name="place"]', '活動中心採光中庭-前段(含鏡子)')

            // Fill form
            const formattedDate = currentDate.toISOString().split('T')[0];
            
            await page.type('input[name="aName"]', '熱舞社練習');
            await page.type('input[name="gPhone"]', process.env.PHONE);
            await page.type('input[name="gEmail"]', process.env.EMAIL);

            // Set date
            await page.evaluate((date) => {
                document.querySelector('input[name="sDay"]').value = date;
            }, formattedDate);

            await page.evaluate((date) => {
                document.querySelector('input[name="eDay"]').value = date;
            }, formattedDate);



            // Select time slots (5PM-8PM)
            const timeSlots = ['timep5', 'timep6', 'timep7'];
            for (const slot of timeSlots) {
                await page.waitForSelector(`#${slot}`);
                const isChecked = await page.$eval(`#${slot}`, checkbox => checkbox.checked);
            }

            // Submit form
            await Promise.all([
                page.click('input[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('All bookings completed successfully');
        
    } catch (error) {
        console.error('Automation error:', error);
        throw error;
    }
    // Don't close the browser - let user see the final page
}

module.exports = rentSpaceAutomation;