import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // KVSからランキングデータを取得
    const scores = await kv.get('scores') || [];
    
    // 上位100件を返す
    return res.status(200).json({ scores: scores.slice(0, 100) });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return res.status(500).json({ error: 'Failed to fetch ranking' });
  }
} 