import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: Request) {
  const { id, reason } = await req.json()
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    await client.query('SELECT check_permission($1, $2)', ['إدارة الموظفين', 'edit'])

    await client.query(
      `UPDATE users SET status = CASE WHEN status='نشط' THEN 'موقوف' ELSE 'نشط' END WHERE id = $1`,
      [id]
    )

    if (reason) {
      await client.query(
        "INSERT INTO audit_log(user_id, action, table_name, record_id, new_data) VALUES($1, 'DEACTIVATE', 'users', $2, $3)",
        [userId, id, JSON.stringify({ reason })]
      )
    }

    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  } finally {
    client.release()
  }
}
