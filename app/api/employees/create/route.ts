import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: Request) {
  const body = await req.json()
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    await client.query('SELECT check_permission($1, $2)', ['إدارة الموظفين', 'create'])

    await client.query(
      `INSERT INTO users(name, username, password_hash, role, branch_id, created_by, status)
       VALUES($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6, 'نشط')`,
      [body.name, body.username, body.password, body.role, body.branch_id, userId]
    )
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  } finally {
    client.release()
  }
}
