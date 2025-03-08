// モジュールのインポート
import { AudioProcessor } from './audio.js';
import { RankingManager } from './ranking.js';
import { UIController } from './ui-controller.js';

// アプリケーションのメインクラス
class SilentShoutApp {
    constructor() {
        // コンポーネントの初期化
        this.uiController = new UIController();
        this.rankingManager = new RankingManager(document.getElementById('rankingList'));
        this.audioProcessor = new AudioProcessor();
        
        // アニメーションフレームID
        this.animationFrameId = null;
        
        // コールバックの設定
        this.setupCallbacks();
        
        // ランキングの初期表示
        this.rankingManager.updateRanking();
    }
    
    setupCallbacks() {
        // UIコントローラーのコールバック設定
        this.uiController.setMicInitRequestCallback(() => this.initializeMicrophone());
        this.uiController.setPopupCloseCallback(() => this.stopAudioProcessing());
        this.uiController.setStartMeasurementCallback(() => this.startMeasurement());
    }
    
    async initializeMicrophone() {
        const isInitialized = await this.audioProcessor.initialize();
        this.uiController.updateMicStatus(isInitialized);
        
        if (!isInitialized) {
            alert('マイクへのアクセスを許可してください。');
        }
    }
    
    stopAudioProcessing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.audioProcessor.close();
    }
    
    async startMeasurement() {
        await this.uiController.performCountdown();
        
        // タイマー開始
        this.uiController.startTimer((userId, highScore) => {
            alert(`${userId}さんの最高記録: ${highScore} dB`);
            this.rankingManager.saveScore(userId, highScore);
            this.stopAudioProcessing();
        });
        
        // 音量測定の開始
        this.updateMeter();
    }
    
    updateMeter() {
        if (!this.uiController.isActive()) return;
        
        const volume = this.audioProcessor.getVolume();
        this.uiController.updateVolumeDisplay(volume);
        
        this.animationFrameId = requestAnimationFrame(() => this.updateMeter());
    }
}

// DOMが読み込まれたらアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new SilentShoutApp();
});
