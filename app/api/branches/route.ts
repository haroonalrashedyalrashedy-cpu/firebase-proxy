import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const userId = headers().get('x-user-id')
  const client = await pool.connect()
  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    const res = await client.query(
      "SELECT id, name FROM branches WHERE status = 'نشط' ORDER BY name"
    )
    return Response.json(res.rows)
  } finally {
    client.release()
  }
}
