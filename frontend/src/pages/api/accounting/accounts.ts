import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization || req.cookies['seka_access_token'] || '';
    const api = process.env.NEXT_PUBLIC_API_URL;
    const resp = await fetch(`${api}/api/v1/accounting-advanced/accounts`, {
      headers: {
        Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}`,
      },
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'proxy error' });
  }
}
