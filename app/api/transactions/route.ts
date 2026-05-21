import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    const userRes = await client.query('SELECT branch_id FROM users WHERE id = $1', [userId])
    const branchId = userRes.rows[0]?.branch_id

    const res = await client.query(
      `SELECT * FROM get_transactions($1, $2, 50, 0)
       WHERE type = COALESCE($3, type)
       ORDER BY created_at DESC`,
      [branchId, userId, type]
    )
    return Response.json(res.rows)
  } finally {
    client.release()
  }
}
