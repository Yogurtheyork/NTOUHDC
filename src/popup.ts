// 載入儲存的設定
document.addEventListener('DOMContentLoaded', async () => {
    const saved = await chrome.storage.local.get(['phone', 'email', 'venue', 'clubName', 'responsiblePerson']);
    
    if (saved.phone) (document.getElementById('phone') as HTMLInputElement).value = saved.phone;
    if (saved.email) (document.getElementById('email') as HTMLInputElement).value = saved.email;
    // activityName 不自動載入，保持空白
    if (saved.venue) (document.getElementById('venue') as HTMLSelectElement).value = saved.venue;
    if (saved.clubName) (document.getElementById('clubName') as HTMLInputElement).value = saved.clubName;
    if (saved.responsiblePerson) (document.getElementById('responsiblePerson') as HTMLInputElement).value = saved.responsiblePerson;
    
    // 設定預設日期為今天
    const today = new Date().toISOString().split('T')[0];
    (document.getElementById('startDate') as HTMLInputElement).value = today;
    (document.getElementById('endDate') as HTMLInputElement).value = today;

    // 檢查目前是否有正在執行的任務
    checkRunningStatus();
});

function checkRunningStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        // 檢查 response 是否存在，避免 undefined 錯誤
        if (chrome.runtime.lastError) {
            // 背景服務可能還沒準備好，或者 popup 被獨立打開
            return;
        }
        
        if (response && response.isRunning) {
            updateUIState(true);
            updateProgress(response.processedDays, response.totalDays, response.currentText);
        } else {
            updateUIState(false);
        }
    });
}

// 開始按鈕事件
document.getElementById('startBtn')?.addEventListener('click', async () => {
    const startDate = (document.getElementById('startDate') as HTMLInputElement).value;
    const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
    const clubName = (document.getElementById('clubName') as HTMLInputElement).value;
    const responsiblePerson = (document.getElementById('responsiblePerson') as HTMLInputElement).value;
    const venue = (document.getElementById('venue') as HTMLSelectElement).value;
    const activityName = (document.getElementById('activityName') as HTMLInputElement).value;
    const phone = (document.getElementById('phone') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    
    // 取得選中的時段
    const timeSlots = Array.from(document.querySelectorAll('.time-slot:checked'))
        .map(cb => (cb as HTMLInputElement).value);
    
    // 驗證
    if (!startDate || !endDate) {
        showStatus('請選擇日期範圍', 'error');
        return;
    }
    
    if (!phone || !email || !activityName || !clubName || !responsiblePerson) {
        showStatus('請填寫所有必填欄位', 'error');
        return;
    }
    
    if (timeSlots.length === 0) {
        showStatus('請至少選擇一個時段', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showStatus('開始日期不能晚於結束日期', 'error');
        return;
    }
    
    // 儲存設定
    await chrome.storage.local.set({ phone, email, activityName, venue, clubName, responsiblePerson });
    
    // 準備配置
    const config = {
        startDate,
        endDate,
        clubName,
        responsiblePerson,
        venue,
        activityName,
        phone,
        email,
        timeSlots
    };
    
    // 取得當前活動的分頁
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 檢查是否在正確的網站
    if (!tab || !tab.url || !tab.url.includes('sclub.ntou.edu.tw')) {
        showStatus('請先開啟海洋大學社團系統網頁', 'error');
        return;
    }
    
    updateUIState(true);
    showStatus('開始自動化借用...', 'info');
    updateProgress(0, 1, '準備中...'); 
    
    try {
        // 發送訊息給 Background script 開始任務
        chrome.runtime.sendMessage({
            action: 'startAutomation',
            config: config,
            tabId: tab.id
        }, (response) => {
             if (chrome.runtime.lastError) {
                 showStatus('無法連接到後台服務: ' + chrome.runtime.lastError.message, 'error');
                 updateUIState(false);
             } else if (!response || !response.success) {
                 const errorMsg = response ? response.error : '未知錯誤';
                 showStatus('啟動失敗: ' + errorMsg, 'error');
                 updateUIState(false);
             }
        });
        
    } catch (error: any) {
        showStatus(`執行失敗：${error.message}`, 'error');
        updateUIState(false);
    }
});

// 監聽來自 background 的進度更新
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProgress') {
        if (message.error) {
            showStatus(`錯誤：${message.error}`, 'error');
            updateUIState(false);
            return;
        }

        updateProgress(message.processed, message.total, message.text);
        
        if (message.done) {
            showStatus('任務完成', 'success');
            updateUIState(false);
        }
    }
    // 加入 return true 以防未來需要異步回應，雖這裡不需要
});

function updateUIState(isRunning: boolean) {
    const btn = document.getElementById('startBtn') as HTMLButtonElement;
    if (isRunning) {
        btn.disabled = true;
        btn.textContent = '處理中...';
    } else {
        btn.disabled = false;
        btn.textContent = '開始自動借用';
    }
}

function showStatus(message: string, type: string) {
    const status = document.getElementById('status') as HTMLElement;
    status.textContent = message;
    status.className = `status show ${type}`;
    
    // 不要自動隱藏 error，方便查看
    if (type === 'success') {
        setTimeout(() => {
            status.classList.remove('show');
        }, 5000);
    }
}

function updateProgress(processed: number, total: number, text: string) {
    const percent = total > 0 ? Math.floor((processed / total) * 100) : 0;
    
    const progressContainer = document.getElementById('progress') as HTMLElement;
    const progressBar = document.getElementById('progressBar') as HTMLElement;
    const progressText = document.getElementById('progressText') as HTMLElement;
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = text || '';
}

function hideProgress() {
    const progressContainer = document.getElementById('progress');
    if (progressContainer) progressContainer.style.display = 'none';
}
