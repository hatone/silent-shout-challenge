// UI操作を担当するモジュール
export class UIController {
    constructor() {
        // UI要素
        this.startButton = document.getElementById('start');
        this.levelElement = document.getElementById('level');
        this.dbValueElement = document.getElementById('dbValue');
        this.countdownElement = document.getElementById('countdown');
        this.timerElement = document.getElementById('timer');
        this.highScoreElement = document.getElementById('highScore');
        this.userIdInput = document.getElementById('userId');
        this.micStatusElement = document.getElementById('micStatus');
        this.popupElement = document.getElementById('popup');
        this.startMeasurementButton = document.getElementById('startButton');
        this.closePopupButton = document.getElementById('closePopup');
        
        // 状態
        this.highScore = 0;
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
            
            this.startButton.disabled = true;
            this.userIdInput.disabled = true;
            this.onStartMeasurement();
        });
    }
    
    showPopup() {
        this.popupElement.classList.add('active');
    }
    
    hidePopup() {
        this.popupElement.classList.remove('active');
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
        this.highScore = 0;
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = `残り時間: ${this.timeLeft} 秒`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.measurementActive = false;
                this.startButton.disabled = false;
                this.userIdInput.disabled = false;
                this.countdownElement.textContent = '終了!';
                
                if (onTimerEnd) {
                    onTimerEnd(this.userIdInput.value, this.highScore);
                }
            }
        }, 1000);
    }
    
    updateVolumeDisplay(volume) {
        if (!this.measurementActive) return;
        
        const percentage = Math.min(100, volume);
        this.levelElement.style.width = percentage + '%';
        this.dbValueElement.textContent = `${volume} dB`;
        
        if (volume < 30) {
            this.levelElement.style.backgroundColor = '#FF6B00';
        } else if (volume < 60) {
            this.levelElement.style.backgroundColor = '#FFC107';
        } else {
            this.levelElement.style.backgroundColor = '#F44336';
        }
        
        if (volume > this.highScore) {
            this.highScore = volume;
            this.highScoreElement.textContent = `最大: ${this.highScore} dB`;
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
    }
} 