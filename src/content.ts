// Content Script
// console.log('NTOU 場地借用小幫手已載入');

interface AutomationConfig {
    startDate: string;
    endDate: string;
    clubName: string;
    responsiblePerson: string;
    venue: string;
    activityName: string;
    phone: string;
    email: string;
    timeSlots: string[];
}

// 頁面載入後，向 Background 詢問下一步
checkJob();

function checkJob() {
    chrome.runtime.sendMessage({ action: 'getJob' }, (response) => {
        if (chrome.runtime.lastError) {
            // Background 可能沒反應 (例如不是由插件啟動的頁面)
            return;
        }

        if (!response) return;

        console.log('收到指令:', response.action);

        if (response.action === 'navigate') {
            window.location.href = response.url;
        } 
        else if (response.action === 'fillForm') {
            processBooking(response.config, response.targetDate, response.dayNumber);
        }
        else if (response.action === 'finish') {
            alert(response.message || '自動借用完成！');
        }
    });
}

// 監聽來自 popup 的直接啟動 (通常只在第一次)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
        checkJob(); // 重新檢查
    }
});

async function processBooking(config: AutomationConfig, targetDate: string, dayNumber: number) {
    try {
        await fillForm(targetDate, config, dayNumber);
        
        // 提交表單
        chrome.runtime.sendMessage({ action: 'formSubmitted' }, () => {
            submitForm();
        });
        
    } catch (error: any) {
        console.error('填寫錯誤:', error);
        chrome.runtime.sendMessage({ action: 'logError', error: error.message });
    }
}

async function fillForm(date: string, config: AutomationConfig, dayNumber = 1) {
    const { clubName, responsiblePerson, venue, activityName, phone, email, timeSlots } = config;
    
    // 在活動名稱後加上序號
    const numberedActivityName = `${activityName}${dayNumber}`;

    // 等待表單元素載入
    await waitForElement('select[name="place"]', 5000);
    await sleep(500); // 額外等待確保所有元素都載入

    // 1. 選擇場地
    const placeSelect = document.querySelector('select[name="place"]') as HTMLSelectElement | null;
    if (!placeSelect) {
        console.error('無法找到場地選單，可能選擇器不正確');
        throw new Error('找不到場地選單');
    }
    
    let venueFound = false;
    for (let i = 0; i < placeSelect.options.length; i++) {
        const option = placeSelect.options[i];
        if (option.text.includes(venue)) {
            placeSelect.value = option.value;
            venueFound = true;
            break;
        }
    }
    if (!venueFound) throw new Error(`找不到場地: ${venue}`);
    placeSelect.dispatchEvent(new Event('change'));

    // 2. 填寫日期
    // 根據 puppeteer 腳本，有 sDay 和 eDay
    const sDay = document.querySelector('input[name="sDay"]') as HTMLInputElement | null;
    const eDay = document.querySelector('input[name="eDay"]') as HTMLInputElement | null;
    
    if (sDay) sDay.value = date;
    if (eDay) eDay.value = date;

    // 3. 填寫其他欄位
    setInput('input[name="aName"]', numberedActivityName); // 活動名稱（帶序號）
    setInput('input[name="gPhone"]', phone);       // 電話
    setInput('input[name="gEmail"]', email);       // Email
    
    // 如果有其他欄位在 popup 中定義但在 puppeteer 中沒用到，嘗試通用 name
    // responsiblePerson -> 可能對應 input[name="man"] (根據經驗) 或不需要
    if (responsiblePerson) setInput('input[name="man"]', responsiblePerson);
    
    // clubName -> 通常登入後自動帶入，或 input[name="unit"]? 不確定，先略過或嘗試
    // setInput('input[name="unit"]', clubName);

    // 4. 時段處理 - 根據 puppeteer，ID 直接是 timep5 等
    if (timeSlots && timeSlots.length > 0) {
        // 先清空所有選中的 (optional)
        document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id^="time"]').forEach(cb => cb.checked = false);
        
        timeSlots.forEach(slot => {
            const cb = document.getElementById(slot) as HTMLInputElement | null; // 直接用 ID
            if (cb) cb.checked = true;
            // 嘗試 name 選擇器作為備用 if value matches
            else {
                const cbValue = document.querySelector(`input[type="checkbox"][value="${slot}"]`) as HTMLInputElement | null;
                if (cbValue) cbValue.checked = true;
            }
        });
    }
}

function setInput(selector: string, value: string) {
    const el = document.querySelector(selector) as HTMLInputElement | null;
    if (el) {
        el.value = value;
        el.dispatchEvent(new Event('change'));
        el.dispatchEvent(new Event('input'));
    }
}

function submitForm() {
    const submitBtn = document.querySelector('input[type="submit"]') as HTMLElement | null || document.querySelector('button[type="submit"]') as HTMLElement | null;
    if (submitBtn) {
        submitBtn.click();
    } else {
        throw new Error('找不到送出按鈕');
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 等待元素出現的輔助函數
function waitForElement(selector: string, timeout = 5000): Promise<Element> {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`等待元素 ${selector} 超時`));
        }, timeout);
    });
}
