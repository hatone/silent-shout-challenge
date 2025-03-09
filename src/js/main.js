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
        this.uiController.setMicInitRequestCallback(() => this.initializeMicrophones());
        this.uiController.setPopupCloseCallback(() => this.stopAudioProcessing());
        this.uiController.setStartMeasurementCallback(() => this.startMeasurement());
    }
    
    async initializeMicrophones() {
        try {
            // 利用可能なデバイスを列挙
            const devices = await this.audioProcessor.enumerateDevices();
            
            if (devices.length === 0) {
                alert('マイクが見つかりませんでした。マイクを接続してください。');
                this.uiController.updateMicStatus(false);
                return;
            }
            
            // UIにデバイスリストを表示
            this.uiController.populateMicDevices(devices);
            
            // マイクの準備完了
            this.uiController.updateMicStatus(true);
        } catch (error) {
            console.error('マイク初期化エラー:', error);
            alert('マイクへのアクセスを許可してください。');
            this.uiController.updateMicStatus(false);
        }
    }
    
    async initializeSelectedMicrophones() {
        // UIから選択されたデバイスIDを取得
        const { deviceIdA, deviceIdB } = this.uiController.getSelectedDevices();
        
        // デバイスIDを設定
        this.audioProcessor.setDevices(deviceIdA, deviceIdB);
        
        // マイクを初期化
        const isInitialized = await this.audioProcessor.initialize();
        
        if (!isInitialized) {
            alert('マイクの初期化に失敗しました。ページを再読み込みして再試行してください。');
            return false;
        }
        
        return true;
    }
    
    stopAudioProcessing() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.audioProcessor.close();
    }
    
    async startMeasurement() {
        // 選択されたマイクを初期化
        const isInitialized = await this.initializeSelectedMicrophones();
        if (!isInitialized) return;
        
        // カウントダウン
        await this.uiController.performCountdown();
        
        // タイマー開始
        this.uiController.startTimer((userId, highScoreA, highScoreB, highScoreDiff) => {
            alert(`${userId}さんの記録:\n外部音: ${highScoreA.toFixed(4)} dB\nmutalk2: ${highScoreB.toFixed(4)} dB\n差分: ${highScoreDiff.toFixed(4)} dB`);
            this.rankingManager.saveScore(userId, highScoreA, highScoreB, highScoreDiff);
            this.stopAudioProcessing();
        });
        
        // 音量測定の開始
        this.updateMeter();
    }
    
    updateMeter() {
        if (!this.uiController.isActive()) return;
        
        const volumeA = this.audioProcessor.getVolumeA();
        const volumeB = this.audioProcessor.getVolumeB();
        const volumeDiff = this.audioProcessor.getVolumeDiff();
        
        this.uiController.updateVolumeDisplay(volumeA, volumeB, volumeDiff);
        
        this.animationFrameId = requestAnimationFrame(() => this.updateMeter());
    }
}

// DOMが読み込まれたらアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new SilentShoutApp();
});
