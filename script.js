// Store if each log is known or unknown. Index 0 corresponds to log1, etc.
// Initially all logs are set to "known".
const logStatus = ["known", "unknown", "known", "unknown", "known", "known"];

// Pre-defined log values to display
const logData = {
    log1: "[2026-08-28 10:15:30] INFO: User login successful for account ID 4059",
    log2: "[2026-08-28 10:16:12] ERROR: Database connection timeout in module DB-CONN",
    log3: "[2026-08-28 10:17:45] WARN: High memory usage detected on node worker-03",
    log4: "[2026-08-28 10:18:22] DEBUG: Extracting payload metrics from batch request",
    log5: "[2026-08-28 10:19:05] INFO: Batch processing completed in 4.2 seconds",
    log6: "[2026-08-28 10:20:10] FATAL: Unexpected termination in data normalization pipeline"
};

// Function to populate the HTML input fields with the log data
function populateLogs() {
    for (let i = 1; i <= 6; i++) {
        const inputField = document.getElementById(`log${i}`);
        if (inputField && logData[`log${i}`]) {
            inputField.value = logData[`log${i}`];
        }
        
        const statusBadge = document.getElementById(`status${i}`);
        if (statusBadge) {
            const status = logStatus[i - 1];
            statusBadge.innerText = status;
            statusBadge.className = `status-badge badge-${status}`;
        }
    }
}

// Helper function to create a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to reset colors
function resetColors() {
    const nodes = ['ingestion', 'raw-log', 'drain-algo', 'extracted', 'ml-model', 'store-pattern', 'processing', 'normalization', 'final-format', 'data-lake', 'analysis', 'final-message-box'];
    nodes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active', 'error');
    });
    const decisionContainer = document.getElementById('decision');
    if (decisionContainer) decisionContainer.classList.remove('active', 'error');
    const bodyEl = document.getElementById('final-format-body');
    if (bodyEl) bodyEl.innerText = '';
    const extractedEl = document.getElementById('extracted-body');
    if (extractedEl) extractedEl.innerText = '';
    const msgEl = document.getElementById('final-message-body');
    if (msgEl) {
        msgEl.innerText = '';
        msgEl.style.color = '';
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    populateLogs();

    const runBtn = document.getElementById('run-btn');
    if (!runBtn) return;

    runBtn.addEventListener('click', async () => {
        const selectLogInput = document.getElementById('select-log');
        const logNumber = selectLogInput ? parseInt(selectLogInput.value) : null;
        
        if (!logNumber || logNumber < 1 || logNumber > 6) {
            alert('Please select a valid log number (1-6).');
            return;
        }

        const idx = logNumber - 1;
        if (logStatus[idx] === "known") {
            resetColors();
            
            // 1. Ingestion layer green
            document.getElementById('ingestion').classList.add('active');
            
            // 2. Raw log storage green (after 2s)
            await sleep(2500);
            document.getElementById('raw-log').classList.add('active');
            
            // 3. Pattern known green (after 2s)
            await sleep(2500);
            document.getElementById('decision').classList.add('active');
            
            // 4. Processing green (after 2s)
            await sleep(2500);
            document.getElementById('processing').classList.add('active');
            
            // 5. Normalization green (after 2s)
            await sleep(2500);
            document.getElementById('normalization').classList.add('active');
            
            // 6. Final format shows JSON (after 2s)
            await sleep(2500);
            document.getElementById('final-format').classList.add('active');
            
            const rawLog = logData[`log${logNumber}`];
            const timestampMatch = rawLog.match(/\[(.*?)\]/);
            const timestamp = timestampMatch ? timestampMatch[1] : '';
            const remaining = rawLog.replace(`[${timestamp}] `, '');
            const level = remaining.split(':')[0];
            const message = remaining.substring(level.length + 2);
            
            const logObj = {
                id: logNumber,
                timestamp: timestamp,
                level: level,
                message: message
            };
            
            document.getElementById('final-format-body').innerText = JSON.stringify(logObj, null, 2);
            
            // 6. Data Lake green
            await sleep(2500);
            document.getElementById('data-lake').classList.add('active');
            
            // 7. Analysis green
            await sleep(2500);
            document.getElementById('analysis').classList.add('active');
            
            // 8. Final Message Box (does not turn green, just shows message)
            await sleep(2500);
            const msgBody = document.getElementById('final-message-body');
            msgBody.innerText = message;
            const isNegative = ['ERROR', 'WARN', 'FATAL'].includes(level.trim());
            msgBody.style.color = isNegative ? '#ef4444' : '#10b981';
        } else {
            resetColors();
            
            // 1. Ingestion layer green
            document.getElementById('ingestion').classList.add('active');
            
            // 2. Raw log storage green
            await sleep(2500);
            document.getElementById('raw-log').classList.add('active');
            
            // 3. Pattern known red
            await sleep(2500);
            document.getElementById('decision').classList.add('error');
            
            // 4. Drain algorithm green
            await sleep(2500);
            document.getElementById('drain-algo').classList.add('active');
            
            // 5. Extracted fields green
            await sleep(2500);
            document.getElementById('extracted').classList.add('active');
            
            const rawLogStr = logData[`log${logNumber}`];
            const tsMatch = rawLogStr.match(/\[(.*?)\]/);
            const ts = tsMatch ? tsMatch[1] : '';
            const remain = rawLogStr.replace(`[${ts}] `, '');
            const lvl = remain.split(':')[0];
            const msg = remain.substring(lvl.length + 2);
            
            document.getElementById('extracted-body').innerText = `v1: ${ts}\nv2: ${lvl}\nv3: ${msg}`;
            
            // 6. ML model green
            await sleep(2500);
            document.getElementById('ml-model').classList.add('active');
            
            // 7. Store pattern green
            await sleep(2500);
            document.getElementById('store-pattern').classList.add('active');
            
            // 8. Processing green
            await sleep(2500);
            document.getElementById('processing').classList.add('active');
            
            // 9. Normalization green
            await sleep(2500);
            document.getElementById('normalization').classList.add('active');
            
            // 10. Final format JSON
            await sleep(2500);
            document.getElementById('final-format').classList.add('active');
            
            const rawLog = logData[`log${logNumber}`];
            const timestampMatch = rawLog.match(/\[(.*?)\]/);
            const timestamp = timestampMatch ? timestampMatch[1] : '';
            const remaining = rawLog.replace(`[${timestamp}] `, '');
            const level = remaining.split(':')[0];
            const message = remaining.substring(level.length + 2);
            
            const logObj = {
                id: logNumber,
                timestamp: timestamp,
                level: level,
                message: message
            };
            document.getElementById('final-format-body').innerText = JSON.stringify(logObj, null, 2);
            
            // 11. Data Lake green
            await sleep(2500);
            document.getElementById('data-lake').classList.add('active');
            
            // 12. Analysis green
            await sleep(2500);
            document.getElementById('analysis').classList.add('active');
            
            // 13. Final Message Box (does not turn green, just shows message)
            await sleep(2500);
            const msgBody = document.getElementById('final-message-body');
            msgBody.innerText = message;
            const isNegative = ['ERROR', 'WARN', 'FATAL'].includes(level.trim());
            msgBody.style.color = isNegative ? '#ef4444' : '#10b981';
        }
    });
});
