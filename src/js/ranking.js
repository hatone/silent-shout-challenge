// ランキング管理を担当するモジュール
export class RankingManager {
    constructor(rankingListElement) {
        this.rankingListElement = rankingListElement;
        this.storageKey = 'audioLevelScores';
    }

    getScores() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    saveScore(userId, scoreA, scoreB, scoreDiff) {
        const scores = this.getScores();
        scores.push({ 
            userId, 
            scoreA, 
            scoreB, 
            scoreDiff,
            timestamp: new Date().toISOString()
        });
        
        // 差分の大きい順にソート
        scores.sort((a, b) => b.scoreDiff - a.scoreDiff);
        
        // 上位100件のみ保持
        const top100 = scores.slice(0, 100);
        
        localStorage.setItem(this.storageKey, JSON.stringify(top100));
        this.updateRanking();
    }

    updateRanking() {
        const scores = this.getScores();
        
        // すでにソートされている可能性があるが、念のため再ソート
        scores.sort((a, b) => b.scoreDiff - a.scoreDiff);
        const top100 = scores.slice(0, 100);

        this.rankingListElement.innerHTML = top100.map((entry, index) => 
            `<li class="ranking__item">
                <span class="ranking__user-id">${entry.userId}</span>
                <span class="ranking__score">
                    外部: ${parseFloat(entry.scoreA).toFixed(4)} dB / 
                    mutalk2: ${parseFloat(entry.scoreB).toFixed(4)} dB / 
                    差分: ${parseFloat(entry.scoreDiff).toFixed(4)} dB
                </span>
            </li>`
        ).join('');
    }

    clearRanking() {
        localStorage.removeItem(this.storageKey);
        this.updateRanking();
    }
} 