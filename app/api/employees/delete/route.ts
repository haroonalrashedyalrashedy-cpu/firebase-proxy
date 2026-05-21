import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: Request) {
  const { id } = await req.json()
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    await client.query('SELECT check_permission($1, $2)', ['إدارة الموظفين', 'delete'])

    await client.query("UPDATE users SET status = 'محذوف' WHERE id = $1", [id])
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  } finally {
    client.release()
  }
}
