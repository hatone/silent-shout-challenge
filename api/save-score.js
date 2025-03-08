import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, score } = req.body;
    
    if (!userId || score === undefined) {
      return res.status(400).json({ error: 'userId and score are required' });
    }

    // スコアを小数点4桁まで保存
    const formattedScore = parseFloat(score.toFixed(4));
    
    // スコアをKVSに保存
    const timestamp = new Date().toISOString();
    const scoreId = `score:${timestamp}:${userId}`;
    await kv.set(scoreId, { userId, score: formattedScore, timestamp });
    
    // ランキング用のリストを更新
    const scoresList = await kv.get('scores') || [];
    scoresList.push({ userId, score: formattedScore, timestamp });
    
    // スコアの高い順にソート
    scoresList.sort((a, b) => b.score - a.score);
    
    // 上位100件のみ保持
    const top100 = scoresList.slice(0, 100);
    await kv.set('scores', top100);
    
    return res.status(200).json({ success: true, score: formattedScore });
  } catch (error) {
    console.error('Error saving score:', error);
    return res.status(500).json({ error: 'Failed to save score' });
  }
} 