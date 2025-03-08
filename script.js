const startButton = document.getElementById('start');
const levelElement = document.getElementById('level');
const dbValueElement = document.getElementById('dbValue');
const countdownElement = document.getElementById('countdown');
const timerElement = document.getElementById('timer');
const highScoreElement = document.getElementById('highScore');
const userIdInput = document.getElementById('userId');
const micStatusElement = document.getElementById('micStatus');
const rankingListElement = document.getElementById('rankingList');
const popupElement = document.getElementById('popup');
const startMeasurementButton = document.getElementById('startButton');
const closePopupButton = document.getElementById('closePopup');

let highScore = 0;
let timeLeft = 5;
let measurementActive = false;
let audioContext;
let analyser;
let dataArray;

// ページ読み込み時にランキングを更新
document.addEventListener('DOMContentLoaded', async () => {
    await updateRanking();
});

async function updateRanking() {
    try {
        const response = await fetch('/api/get-ranking');
        if (!response.ok) {
            throw new Error('Failed to fetch ranking');
        }
        
        const data = await response.json();
        const scores = data.scores || [];
        
        rankingListElement.innerHTML = scores.map((entry, index) => 
            `<li><span class="user-id">${entry.userId}</span><span class="score">${entry.score.toFixed(4)} dB</span></li>`
        ).join('');
    } catch (error) {
        console.error('Error updating ranking:', error);
        // フォールバックとしてローカルストレージのデータを使用
        const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
        scores.sort((a, b) => b.score - a.score);
        const top100 = scores.slice(0, 100);

        rankingListElement.innerHTML = top100.map(entry => 
            `<li><span class="user-id">${entry.userId}</span><span class="score">${parseFloat(entry.score).toFixed(4)} dB</span></li>`
        ).join('');
    }
}

startMeasurementButton.addEventListener('click', () => {
    popupElement.style.display = 'block';
    initializeMicrophone();
});

closePopupButton.addEventListener('click', () => {
    popupElement.style.display = 'none';
});

async function initializeMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStatusElement.textContent = 'Mic ready';
        startButton.disabled = false;

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (error) {
        console.error('Mic Access Error:', error);
        micStatusElement.textContent = 'Mic access denied';
        alert('Please allow microphone access.');
    }
}

startButton.addEventListener('click', async () => {
    if (!userIdInput.value) {
        alert('Please input your ID');
        return;
    }

    startButton.disabled = true;
    userIdInput.disabled = true;
    await countdown();
    startMeasurement();
});

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
    highScore = 0;

    function updateMeter() {
        if (!measurementActive) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / analyser.frequencyBinCount;
        
        // 小数点4桁まで計算
        const volume = parseFloat(average.toFixed(4));
        const percentage = Math.min(100, volume);

        levelElement.style.width = percentage + '%';
        dbValueElement.textContent = `${volume.toFixed(4)} dB`;

        if (volume < 30) {
            levelElement.style.backgroundColor = '#4CAF50';
        } else if (volume < 60) {
            levelElement.style.backgroundColor = '#FFC107';
        } else {
            levelElement.style.backgroundColor = '#F44336';
        }

        if (volume > highScore) {
            highScore = volume;
            highScoreElement.textContent = `Max: ${highScore.toFixed(4)} dB`;
        }

        requestAnimationFrame(updateMeter);
    }

    updateMeter();

    const timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Remaining time: ${timeLeft} sec`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            measurementActive = false;
            startButton.disabled = false;
            userIdInput.disabled = false;
            countdownElement.textContent = 'Finished!';
            alert(`${userIdInput.value}'s highest record: ${highScore.toFixed(4)} dB`);
            
            // ローカルストレージにも保存（フォールバック用）
            const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
            scores.push({ userId: userIdInput.value, score: highScore });
            localStorage.setItem('audioLevelScores', JSON.stringify(scores));
            
            // Vercel KVSに保存
            saveScoreToKVS(userIdInput.value, highScore);
        }
    }, 1000);
}

async function saveScoreToKVS(userId, score) {
    try {
        const response = await fetch('/api/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, score }),
        });

        if (!response.ok) {
            throw new Error('Failed to save score');
        }

        await updateRanking();
    } catch (error) {
        console.error('Error saving score to KVS:', error);
        // エラーが発生した場合でもUIを更新
        updateRanking();
    }
}
