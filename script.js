const startButton = document.getElementById('start');
const countdownElement = document.getElementById('countdown');
const timerElement = document.getElementById('timer');
const userIdInput = document.getElementById('userId');
const micStatusElement = document.getElementById('micStatus');
const rankingListElement = document.getElementById('rankingList');
const popupElement = document.getElementById('popup');
const startMeasurementButton = document.getElementById('startButton');
const closePopupButton = document.getElementById('closePopup');

// マイクA（外部音）関連の要素
const levelElementA = document.getElementById('levelA');
const dbValueElementA = document.getElementById('dbValueA');
const highScoreElementA = document.getElementById('highScoreA');
const micSelectA = document.getElementById('micA');

// マイクB（mutalk2）関連の要素
const levelElementB = document.getElementById('levelB');
const dbValueElementB = document.getElementById('dbValueB');
const highScoreElementB = document.getElementById('highScoreB');
const micSelectB = document.getElementById('micB');

// 差分関連の要素
const levelElementDiff = document.getElementById('levelDiff');
const dbValueElementDiff = document.getElementById('dbValueDiff');
const highScoreElementDiff = document.getElementById('highScoreDiff');

let highScoreA = 0;
let highScoreB = 0;
let highScoreDiff = 0;
let timeLeft = 5;
let measurementActive = false;
let audioContext;
let analyserA;
let analyserB;
let dataArrayA;
let dataArrayB;
let availableDevices = [];

// ページ読み込み時にランキングを更新
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ページが読み込まれました');
    await updateRanking();
    
    // 要素が正しく取得できているか確認
    console.log('startMeasurementButton:', startMeasurementButton);
    console.log('popupElement:', popupElement);
    console.log('micSelectA:', micSelectA);
    console.log('micSelectB:', micSelectB);
    
    // リセットボタンのイベントリスナーを設定
    const resetButton = document.getElementById('resetRanking');
    if (resetButton) {
        resetButton.addEventListener('click', resetRanking);
    }
});

async function updateRanking() {
    try {
        // ローカルストレージからデータを取得
        const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
        
        // 差分の大きい順にソート
        scores.sort((a, b) => b.scoreDiff - a.scoreDiff);
        
        // 上位100件を表示
        const top100 = scores.slice(0, 100);

        // ランキングが空の場合のメッセージ
        if (top100.length === 0) {
            rankingListElement.innerHTML = '<li><span class="user-id">まだデータがありません</span></li>';
            return;
        }

        rankingListElement.innerHTML = top100.map((entry, index) => 
            `<li>
                <span class="user-id">${entry.userId}</span>
                <span class="score">${entry.scoreDiff.toFixed(2)} dB</span>
                <span class="score-details" style="display: none">
                    外部: ${entry.scoreA.toFixed(2)} dB / 
                    mutalk2: ${entry.scoreB.toFixed(2)} dB
                </span>
            </li>`
        ).join('');

        // 詳細を表示するための処理を追加
        const listItems = rankingListElement.querySelectorAll('li');
        listItems.forEach(item => {
            item.addEventListener('click', () => {
                const details = item.querySelector('.score-details');
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                } else {
                    details.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error('Error updating ranking:', error);
        rankingListElement.innerHTML = '<li>ランキングの読み込みに失敗しました</li>';
    }
}

// 測定開始ボタンがクリックされたときの処理
startMeasurementButton.addEventListener('click', () => {
    console.log('測定開始ボタンがクリックされました');
    popupElement.style.display = 'block';
    
    // マイク選択メニューが表示されたことを確認
    console.log('ポップアップを表示しました');
    console.log('micSelection表示状態:', document.getElementById('micSelection').style.display);
    
    enumerateDevices();
});

// 閉じるボタンがクリックされたときの処理
closePopupButton.addEventListener('click', () => {
    console.log('閉じるボタンがクリックされました');
    popupElement.style.display = 'none';
});

// 利用可能なオーディオデバイスを列挙
async function enumerateDevices() {
    console.log('enumerateDevices関数が呼び出されました');
    
    try {
        console.log('マイクへのアクセス許可を要求します...');
        micStatusElement.textContent = 'マイクへのアクセス許可を要求しています...';
        
        // 一度マイクへのアクセス許可を得る
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('マイクへのアクセスが許可されました');
        stream.getTracks().forEach(track => track.stop()); // 一時的なストリームを停止
        
        // 利用可能なデバイスを取得
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('取得したデバイス一覧:', devices);
        
        availableDevices = devices.filter(device => device.kind === 'audioinput');
        console.log('オーディオ入力デバイス:', availableDevices);
        
        if (availableDevices.length === 0) {
            throw new Error('利用可能なマイクが見つかりませんでした');
        }
        
        // デバイスリストをクリア
        micSelectA.innerHTML = '';
        micSelectB.innerHTML = '';
        
        // デバイスリストを表示
        availableDevices.forEach((device, index) => {
            const optionA = document.createElement('option');
            optionA.value = device.deviceId;
            optionA.text = device.label || `マイク ${index + 1}`;
            micSelectA.appendChild(optionA);
            
            const optionB = document.createElement('option');
            optionB.value = device.deviceId;
            optionB.text = device.label || `マイク ${index + 1}`;
            micSelectB.appendChild(optionB);
        });
        
        // デフォルトで異なるマイクを選択（可能であれば）
        if (availableDevices.length >= 2) {
            micSelectA.selectedIndex = 0;
            micSelectB.selectedIndex = 1;
            console.log('2つのマイクが選択されました');
        } else {
            console.log('警告: 検出されたマイクは1つのみです');
            alert('警告: 2つのマイクが必要ですが、1つしか検出されませんでした。別のマイクを接続してください。');
        }
        
        micStatusElement.textContent = 'マイクを選択してください';
        startButton.disabled = false;
    } catch (error) {
        console.error('Mic Access Error:', error);
        micStatusElement.textContent = 'マイクアクセスが拒否されました';
        alert('マイクへのアクセスを許可してください。エラー: ' + error.message);
    }
}

startButton.addEventListener('click', async () => {
    if (!userIdInput.value) {
        alert('IDを入力してください');
        return;
    }
    
    if (micSelectA.value === micSelectB.value) {
        alert('異なるマイクを選択してください');
        return;
    }
    
    startButton.disabled = true;
    userIdInput.disabled = true;
    micSelectA.disabled = true;
    micSelectB.disabled = true;
    
    // 選択されたマイクを初期化
    await initializeMicrophones();
    await countdown();
    startMeasurement();
});

async function initializeMicrophones() {
    try {
        // オーディオコンテキストを作成
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // マイクAのストリームを取得
        const streamA = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: micSelectA.value }
            },
            video: false
        });
        
        // マイクBのストリームを取得
        const streamB = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: micSelectB.value }
            },
            video: false
        });
        
        // マイクAのアナライザーを設定
        const sourceA = audioContext.createMediaStreamSource(streamA);
        analyserA = audioContext.createAnalyser();
        analyserA.fftSize = 256;
        sourceA.connect(analyserA);
        dataArrayA = new Uint8Array(analyserA.frequencyBinCount);
        
        // マイクBのアナライザーを設定
        const sourceB = audioContext.createMediaStreamSource(streamB);
        analyserB = audioContext.createAnalyser();
        analyserB.fftSize = 256;
        sourceB.connect(analyserB);
        dataArrayB = new Uint8Array(analyserB.frequencyBinCount);
        
        micStatusElement.textContent = 'マイク準備完了';
    } catch (error) {
        console.error('Mic Initialization Error:', error);
        micStatusElement.textContent = 'マイクの初期化に失敗しました';
        alert('マイクの初期化に失敗しました。ページを再読み込みしてください。');
        
        // 入力フィールドを再度有効化
        startButton.disabled = false;
        userIdInput.disabled = false;
        micSelectA.disabled = false;
        micSelectB.disabled = false;
    }
}

async function countdown() {
    for (let i = 3; i > 0; i--) {
        countdownElement.textContent = i;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    countdownElement.textContent = 'START!';
}

function startMeasurement() {
    measurementActive = true;
    timeLeft = 5;
    highScoreA = 0;
    highScoreB = 0;
    highScoreDiff = 0;

    function updateMeters() {
        if (!measurementActive) return;

        // マイクAの音量を取得
        analyserA.getByteFrequencyData(dataArrayA);
        const averageA = dataArrayA.reduce((acc, val) => acc + val, 0) / analyserA.frequencyBinCount;
        const volumeA = parseFloat(averageA.toFixed(4));
        const percentageA = Math.min(100, volumeA);

        // マイクBの音量を取得
        analyserB.getByteFrequencyData(dataArrayB);
        const averageB = dataArrayB.reduce((acc, val) => acc + val, 0) / analyserB.frequencyBinCount;
        const volumeB = parseFloat(averageB.toFixed(4));
        const percentageB = Math.min(100, volumeB);
        
        // 差分を計算（A-B）
        const volumeDiff = parseFloat((volumeA - volumeB).toFixed(4));
        const percentageDiff = Math.min(100, Math.abs(volumeDiff) * 2); // 差分を視覚化するために調整
        
        // マイクAのメーターを更新
        levelElementA.style.width = percentageA + '%';
        dbValueElementA.textContent = `${volumeA.toFixed(4)} dB`;
        
        // マイクBのメーターを更新
        levelElementB.style.width = percentageB + '%';
        dbValueElementB.textContent = `${volumeB.toFixed(4)} dB`;
        
        // 差分のメーターを更新
        levelElementDiff.style.width = percentageDiff + '%';
        dbValueElementDiff.textContent = `${volumeDiff.toFixed(4)} dB`;
        
        // 最大値を更新
        if (volumeA > highScoreA) {
            highScoreA = volumeA;
            highScoreElementA.textContent = `Max: ${highScoreA.toFixed(4)} dB`;
        }
        
        if (volumeB > highScoreB) {
            highScoreB = volumeB;
            highScoreElementB.textContent = `Max: ${highScoreB.toFixed(4)} dB`;
        }
        
        // 差分の最大値を更新（絶対値ではなく、A-Bの値そのもの）
        if (volumeDiff > highScoreDiff) {
            highScoreDiff = volumeDiff;
            highScoreElementDiff.textContent = `Max: ${highScoreDiff.toFixed(4)} dB`;
        }

        requestAnimationFrame(updateMeters);
    }

    updateMeters();

    const timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `残り時間: ${timeLeft} 秒`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            measurementActive = false;
            startButton.disabled = false;
            userIdInput.disabled = false;
            micSelectA.disabled = false;
            micSelectB.disabled = false;
            countdownElement.textContent = '測定完了!';
            
            // 結果を表示
            alert(`${userIdInput.value}の記録:\n外部音: ${highScoreA.toFixed(4)} dB\nmutalk2: ${highScoreB.toFixed(4)} dB\n差分: ${highScoreDiff.toFixed(4)} dB`);
            
            // ローカルストレージに保存
            saveScore(userIdInput.value, highScoreA, highScoreB, highScoreDiff);
        }
    }, 1000);
}

function saveScore(userId, scoreA, scoreB, scoreDiff) {
    try {
        // ユーザーIDが空の場合は「匿名」として扱う
        if (!userId.trim()) {
            userId = '匿名ユーザー_' + Math.floor(Math.random() * 1000);
        }
        
        // ローカルストレージからデータを取得
        const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
        
        // 同じユーザーIDが既に存在するか確認
        const existingUserIndex = scores.findIndex(entry => entry.userId === userId);
        
        // 現在の日時を取得
        const timestamp = new Date().toISOString();
        const formattedDate = new Date().toLocaleDateString('ja-JP');
        
        if (existingUserIndex !== -1) {
            // 既存のエントリーがある場合、スコアを比較して高い方を保持
            const existingScore = scores[existingUserIndex];
            if (scoreDiff > existingScore.scoreDiff) {
                // 新しいスコアが高い場合は更新
                scores[existingUserIndex] = {
                    userId,
                    scoreA,
                    scoreB,
                    scoreDiff,
                    timestamp,
                    formattedDate
                };
            }
        } else {
            // 新しいエントリーを追加
            scores.push({
                userId,
                scoreA,
                scoreB,
                scoreDiff,
                timestamp,
                formattedDate
            });
        }
        
        // 差分の大きい順にソート
        scores.sort((a, b) => b.scoreDiff - a.scoreDiff);
        
        // 上位100件のみ保持
        const top100 = scores.slice(0, 100);
        
        // ローカルストレージに保存
        localStorage.setItem('audioLevelScores', JSON.stringify(top100));
        
        // ランキングを更新
        updateRanking();
    } catch (error) {
        console.error('Error saving score:', error);
        alert('スコアの保存に失敗しました。');
    }
}

// ランキングをリセットする関数
function resetRanking() {
    if (confirm('本当にランキングデータをリセットしますか？この操作は元に戻せません。')) {
        localStorage.removeItem('audioLevelScores');
        updateRanking();
        alert('ランキングデータをリセットしました。');
    }
}

// デバッグ用：コンソールからresetRanking()を呼び出せるようにする
window.resetRanking = resetRanking;
