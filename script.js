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

function updateRanking() {
    const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
    scores.sort((a, b) => b.score - a.score);
    const top5 = scores.slice(0, 100);

    rankingListElement.innerHTML = top5.map(entry => 
        `<li><span class="user-id">${entry.userId}</span><span class="score">${entry.score} dB</span></li>`
    ).join('');
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
        alert('Please input your Twitch ID');
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
        const volume = Math.round(average);
        const percentage = Math.min(100, volume);

        levelElement.style.width = percentage + '%';
        dbValueElement.textContent = `${volume} dB`;

        if (volume < 30) {
            levelElement.style.backgroundColor = '#4CAF50';
        } else if (volume < 60) {
            levelElement.style.backgroundColor = '#FFC107';
        } else {
            levelElement.style.backgroundColor = '#F44336';
        }

        if (volume > highScore) {
            highScore = volume;
            highScoreElement.textContent = `Max: ${highScore} dB`;
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
            alert(`${userIdInput.value}'s highest record: ${highScore} dB`);
            
            // Save result
            const scores = JSON.parse(localStorage.getItem('audioLevelScores')) || [];
            scores.push({ userId: userIdInput.value, score: highScore });
            localStorage.setItem('audioLevelScores', JSON.stringify(scores));
            
            updateRanking();
        }
    }, 1000);
}

// Initialize ranking on page load
updateRanking();
