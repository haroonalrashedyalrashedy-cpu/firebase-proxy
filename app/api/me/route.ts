import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const userId = headers().get('x-user-id')
  if (!userId) return Response.json(null, { status: 401 })

  const client = await pool.connect()
  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    const res = await client.query(
      'SELECT id, name, role, branch_id FROM users WHERE id = $1',
      [userId]
    )
    return Response.json(res.rows[0])
  } finally {
    client.release()
  }
}
