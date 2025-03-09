// UI操作を担当するモジュール
export class UIController {
    constructor() {
        // UI要素
        this.startButton = document.getElementById('start');
        this.countdownElement = document.getElementById('countdown');
        this.timerElement = document.getElementById('timer');
        this.userIdInput = document.getElementById('userId');
        this.micStatusElement = document.getElementById('micStatus');
        this.popupElement = document.getElementById('popup');
        this.startMeasurementButton = document.getElementById('startButton');
        this.closePopupButton = document.getElementById('closePopup');
        
        // マイク選択要素
        this.micSelectA = document.getElementById('micA');
        this.micSelectB = document.getElementById('micB');
        
        // マイクA（外部音）関連の要素
        this.levelElementA = document.getElementById('levelA');
        this.dbValueElementA = document.getElementById('dbValueA');
        this.highScoreElementA = document.getElementById('highScoreA');
        
        // マイクB（mutalk2）関連の要素
        this.levelElementB = document.getElementById('levelB');
        this.dbValueElementB = document.getElementById('dbValueB');
        this.highScoreElementB = document.getElementById('highScoreB');
        
        // 差分関連の要素
        this.levelElementDiff = document.getElementById('levelDiff');
        this.dbValueElementDiff = document.getElementById('dbValueDiff');
        this.highScoreElementDiff = document.getElementById('highScoreDiff');
        
        // 状態
        this.highScoreA = 0;
        this.highScoreB = 0;
        this.highScoreDiff = 0;
        this.timeLeft = 5;
        this.measurementActive = false;
        this.timerInterval = null;
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.startMeasurementButton.addEventListener('click', () => {
            this.showPopup();
            this.onMicInitRequest();
        });
        
        this.closePopupButton.addEventListener('click', () => {
            this.hidePopup();
            this.onPopupClose();
        });
        
        this.startButton.addEventListener('click', () => {
            if (!this.userIdInput.value) {
                alert('ユーザー名を入力してください');
                return;
            }
            
            if (this.micSelectA.value === this.micSelectB.value) {
                alert('異なるマイクを選択してください');
                return;
            }
            
            this.startButton.disabled = true;
            this.userIdInput.disabled = true;
            this.micSelectA.disabled = true;
            this.micSelectB.disabled = true;
            
            this.onStartMeasurement();
        });
    }
    
    showPopup() {
        this.popupElement.classList.add('active');
    }
    
    hidePopup() {
        this.popupElement.classList.remove('active');
    }
    
    // マイクデバイスの選択肢を表示
    populateMicDevices(devices) {
        // デバイスリストをクリア
        this.micSelectA.innerHTML = '';
        this.micSelectB.innerHTML = '';
        
        // デバイスリストを表示
        devices.forEach((device, index) => {
            const optionA = document.createElement('option');
            optionA.value = device.deviceId;
            optionA.text = device.label || `マイク ${index + 1}`;
            this.micSelectA.appendChild(optionA);
            
            const optionB = document.createElement('option');
            optionB.value = device.deviceId;
            optionB.text = device.label || `マイク ${index + 1}`;
            this.micSelectB.appendChild(optionB);
        });
        
        // デフォルトで異なるマイクを選択（可能であれば）
        if (devices.length >= 2) {
            this.micSelectA.selectedIndex = 0;
            this.micSelectB.selectedIndex = 1;
        }
    }
    
    getSelectedDevices() {
        return {
            deviceIdA: this.micSelectA.value,
            deviceIdB: this.micSelectB.value
        };
    }
    
    updateMicStatus(isReady) {
        this.micStatusElement.textContent = isReady ? 'マイク準備完了' : 'マイクへのアクセスが拒否されました';
        this.startButton.disabled = !isReady;
        
        if (isReady) {
            this.micStatusElement.classList.add('ready');
        } else {
            this.micStatusElement.classList.remove('ready');
        }
    }
    
    async performCountdown() {
        for (let i = 3; i > 0; i--) {
            this.countdownElement.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.countdownElement.textContent = 'スタート!';
    }
    
    startTimer(onTimerEnd) {
        this.measurementActive = true;
        this.timeLeft = 5;
        this.highScoreA = 0;
        this.highScoreB = 0;
        this.highScoreDiff = 0;
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = `残り時間: ${this.timeLeft} 秒`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.measurementActive = false;
                this.startButton.disabled = false;
                this.userIdInput.disabled = false;
                this.micSelectA.disabled = false;
                this.micSelectB.disabled = false;
                this.countdownElement.textContent = '終了!';
                
                if (onTimerEnd) {
                    onTimerEnd(
                        this.userIdInput.value, 
                        this.highScoreA, 
                        this.highScoreB, 
                        this.highScoreDiff
                    );
                }
            }
        }, 1000);
    }
    
    updateVolumeDisplay(volumeA, volumeB, volumeDiff) {
        if (!this.measurementActive) return;
        
        // マイクAの表示を更新
        const percentageA = Math.min(100, volumeA);
        this.levelElementA.style.width = percentageA + '%';
        this.dbValueElementA.textContent = `${volumeA.toFixed(4)} dB`;
        
        // マイクBの表示を更新
        const percentageB = Math.min(100, volumeB);
        this.levelElementB.style.width = percentageB + '%';
        this.dbValueElementB.textContent = `${volumeB.toFixed(4)} dB`;
        
        // 差分の表示を更新
        const percentageDiff = Math.min(100, Math.abs(volumeDiff) * 2);
        this.levelElementDiff.style.width = percentageDiff + '%';
        this.dbValueElementDiff.textContent = `${volumeDiff.toFixed(4)} dB`;
        
        // 最大値を更新
        if (volumeA > this.highScoreA) {
            this.highScoreA = volumeA;
            this.highScoreElementA.textContent = `Max: ${this.highScoreA.toFixed(4)} dB`;
        }
        
        if (volumeB > this.highScoreB) {
            this.highScoreB = volumeB;
            this.highScoreElementB.textContent = `Max: ${this.highScoreB.toFixed(4)} dB`;
        }
        
        if (volumeDiff > this.highScoreDiff) {
            this.highScoreDiff = volumeDiff;
            this.highScoreElementDiff.textContent = `Max: ${this.highScoreDiff.toFixed(4)} dB`;
        }
    }
    
    // コールバック設定メソッド
    setMicInitRequestCallback(callback) {
        this.onMicInitRequest = callback;
    }
    
    setPopupCloseCallback(callback) {
        this.onPopupClose = callback;
    }
    
    setStartMeasurementCallback(callback) {
        this.onStartMeasurement = callback;
    }
    
    getUserId() {
        return this.userIdInput.value;
    }
    
    isActive() {
        return this.measurementActive;
    }
    
    reset() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.measurementActive = false;
        this.startButton.disabled = false;
        this.userIdInput.disabled = false;
        this.micSelectA.disabled = false;
        this.micSelectB.disabled = false;
    }
} 