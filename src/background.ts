// Background Service Worker
console.log('NTOU 場地借用小幫手 - 背景服務已啟動');

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

interface AutomationState {
    isRunning: boolean;
    config: AutomationConfig | null;
    currentDate: Date | null;
    endDate: Date | null;
    processedDays: number;
    totalDays: number;
    tabId: number | null;
    status: string; // idle, navigating, filling, submitting
    currentText: string;
}

let automationState: AutomationState = {
    isRunning: false,
    config: null,
    currentDate: null,
    endDate: null,
    processedDays: 0,
    totalDays: 0,
    tabId: null,
    status: 'idle',
    currentText: ''
};

// 監聽來自 content script 或 popup 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log('收到訊息:', message);

    if (message.action === 'startAutomation') {
        const tabId = message.tabId || (sender.tab ? sender.tab.id : null);
        if (!tabId) {
            sendResponse({ success: false, error: '無法取得 Tab ID' });
            return;
        }
        startAutomation(message.config, tabId);
        sendResponse({ success: true });
    } 
    else if (message.action === 'stopAutomation') {
        stopAutomation();
        sendResponse({ success: true });
    }
    else if (message.action === 'getJob') {
        // Content script 詢問是否有工作
        if (automationState.isRunning && sender.tab && sender.tab.id === automationState.tabId) {
            handleJobRequest(sender.url || '').then(response => {
                sendResponse(response);
            });
            return true; // 異步回應
        } else {
            sendResponse({ action: 'idle' });
        }
    }
    else if (message.action === 'formSubmitted') {
        // Content script 通知表單已提交
        if (automationState.isRunning && automationState.currentDate) {
            console.log('表單提交確認，準備處理下一天');
            // 標記這一天完成，推進日期
            automationState.processedDays++;
            automationState.currentDate.setDate(automationState.currentDate.getDate() + 1);
            
            // 廣播進度
            broadcastStatus();
        }
        sendResponse({ received: true });
    }
    else if (message.action === 'getStatus') {
        // Popup 查詢狀態
        sendResponse({
            isRunning: automationState.isRunning,
            processedDays: automationState.processedDays,
            totalDays: automationState.totalDays,
            currentText: automationState.currentText || '準備中...'
        });
    }
    else if (message.action === 'logError') {
        console.error('Content Script Error:', message.error);
        stopAutomation(message.error);
    }

    return true;
});

function startAutomation(config: AutomationConfig, tabId: number) {
    console.log('開始自動化:', config);
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    automationState = {
        isRunning: true,
        config: config,
        currentDate: start,
        endDate: end,
        processedDays: 0,
        totalDays: totalDays,
        tabId: tabId,
        status: 'navigating',
        currentText: '初始化...'
    };
    
    // 主動導航即使當前頁面已經是相關頁面，確保狀態重置
    // 或者利用 Content Script 的 reload
    chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => {
        // 如果連不上，可能需要 reload
        chrome.tabs.reload(tabId);
    });
}

function stopAutomation(error: string | null = null) {
    console.log('停止自動化', error);
    automationState.isRunning = false;
    broadcastStatus(error);
}

function broadcastStatus(error: string | null = null) {
    chrome.runtime.sendMessage({
        action: 'updateProgress',
        processed: automationState.processedDays,
        total: automationState.totalDays,
        text: automationState.currentText,
        error: error,
        done: !automationState.isRunning
    }).catch(() => {});
}

async function handleJobRequest(url: string) {
    if (!automationState.isRunning || !automationState.currentDate || !automationState.endDate) return { action: 'idle' };

    // 檢查是否完成
    if (automationState.currentDate > automationState.endDate) {
        stopAutomation();
        return { action: 'finish', message: '所有日期處理完成' };
    }
    
    // 更新狀態文字
    const formattedDate = automationState.currentDate.toISOString().split('T')[0];
    automationState.currentText = `正在處理: ${formattedDate} (${automationState.processedDays + 1}/${automationState.totalDays})`;
    broadcastStatus();

    // 簡單判斷：如果在借用頁面
    if (url.includes('wk=add')) { 
        return {
            action: 'fillForm',
            config: automationState.config,
            targetDate: formattedDate,
            dayNumber: automationState.processedDays + 1
        };
    } else {
        // 如果不在借用頁面，導航過去
        // 注意：這裡返回 navigate 指令給 Content Script，由 Content Script 執行 window.location.href
        // 這樣做比 background 執行 chrome.tabs.update 更平滑一點，且能保證 content script 準備好了
        return { 
            action: 'navigate', 
            url: 'https://sclub.ntou.edu.tw/?p=vb_ap&wk=add' 
        };
    }
}
