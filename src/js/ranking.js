// ランキング管理を担当するモジュール
export class RankingManager {
    constructor(rankingListElement) {
        this.rankingListElement = rankingListElement;
        this.storageKey = 'audioLevelScores';
    }

    getScores() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    saveScore(userId, score) {
        const scores = this.getScores();
        scores.push({ userId, score });
        localStorage.setItem(this.storageKey, JSON.stringify(scores));
        this.updateRanking();
    }

    updateRanking() {
        const scores = this.getScores();
        scores.sort((a, b) => b.score - a.score);
        const top100 = scores.slice(0, 100);

        this.rankingListElement.innerHTML = top100.map((entry, index) => 
            `<li class="ranking__item">
                <span class="ranking__user-id">${entry.userId}</span>
                <span class="ranking__score">${entry.score} dB</span>
            </li>`
        ).join('');
    }

    clearRanking() {
        localStorage.removeItem(this.storageKey);
        this.updateRanking();
    }
} 