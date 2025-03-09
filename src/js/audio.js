// オーディオ処理を担当するモジュール
export class AudioProcessor {
    constructor() {
        this.audioContextA = null;
        this.audioContextB = null;
        this.analyserA = null;
        this.analyserB = null;
        this.dataArrayA = null;
        this.dataArrayB = null;
        this.streamA = null;
        this.streamB = null;
        this.availableDevices = [];
        this.selectedDeviceA = null;
        this.selectedDeviceB = null;
    }

    async enumerateDevices() {
        try {
            // 一度マイクへのアクセス許可を得る
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            tempStream.getTracks().forEach(track => track.stop()); // 一時的なストリームを停止
            
            // 利用可能なデバイスを取得
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'audioinput');
            
            return this.availableDevices;
        } catch (error) {
            console.error('デバイス列挙エラー:', error);
            return [];
        }
    }
    
    setDevices(deviceIdA, deviceIdB) {
        this.selectedDeviceA = deviceIdA;
        this.selectedDeviceB = deviceIdB;
    }

    async initialize() {
        if (!this.selectedDeviceA || !this.selectedDeviceB) {
            return false;
        }
        
        try {
            // マイクAのストリームを取得
            this.streamA = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: this.selectedDeviceA }
                },
                video: false
            });
            
            // マイクBのストリームを取得
            this.streamB = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: this.selectedDeviceB }
                },
                video: false
            });
            
            // マイクAのオーディオコンテキストとアナライザーを初期化
            this.audioContextA = new (window.AudioContext || window.webkitAudioContext)();
            const sourceA = this.audioContextA.createMediaStreamSource(this.streamA);
            this.analyserA = this.audioContextA.createAnalyser();
            this.analyserA.fftSize = 256;
            sourceA.connect(this.analyserA);
            this.dataArrayA = new Uint8Array(this.analyserA.frequencyBinCount);
            
            // マイクBのオーディオコンテキストとアナライザーを初期化
            this.audioContextB = new (window.AudioContext || window.webkitAudioContext)();
            const sourceB = this.audioContextB.createMediaStreamSource(this.streamB);
            this.analyserB = this.audioContextB.createAnalyser();
            this.analyserB.fftSize = 256;
            sourceB.connect(this.analyserB);
            this.dataArrayB = new Uint8Array(this.analyserB.frequencyBinCount);
            
            return true;
        } catch (error) {
            console.error('マイク初期化エラー:', error);
            return false;
        }
    }

    getVolumeA() {
        if (!this.analyserA || !this.dataArrayA) return 0;
        
        this.analyserA.getByteFrequencyData(this.dataArrayA);
        const average = this.dataArrayA.reduce((acc, val) => acc + val, 0) / this.analyserA.frequencyBinCount;
        return parseFloat(average.toFixed(4));
    }
    
    getVolumeB() {
        if (!this.analyserB || !this.dataArrayB) return 0;
        
        this.analyserB.getByteFrequencyData(this.dataArrayB);
        const average = this.dataArrayB.reduce((acc, val) => acc + val, 0) / this.analyserB.frequencyBinCount;
        return parseFloat(average.toFixed(4));
    }
    
    getVolumeDiff() {
        const volumeA = this.getVolumeA();
        const volumeB = this.getVolumeB();
        return parseFloat((volumeA - volumeB).toFixed(4));
    }

    close() {
        if (this.streamA) {
            this.streamA.getTracks().forEach(track => track.stop());
        }
        if (this.streamB) {
            this.streamB.getTracks().forEach(track => track.stop());
        }
        if (this.audioContextA) {
            this.audioContextA.close();
        }
        if (this.audioContextB) {
            this.audioContextB.close();
        }
    }
} 