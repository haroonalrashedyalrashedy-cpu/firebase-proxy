import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const currency = searchParams.get('currency')
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    const res = await client.query(
      `SELECT buy_min, buy_max, sell_min, sell_max
       FROM price_rules
       WHERE currency = $1
       ORDER BY updated_at DESC LIMIT 1`,
      [currency]
    )
    return Response.json(res.rows[0] || null)
  } finally {
    client.release()
  }
}
