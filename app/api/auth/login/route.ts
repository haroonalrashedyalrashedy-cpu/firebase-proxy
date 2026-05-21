import { Pool } from 'pg'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: Request) {
  const { username, password } = await req.json()
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
  const client = await pool.connect()

  try {
    const res = await client.query('SELECT login($1, $2, $3)', [username, password, ip])
    const userId = res.rows[0].login

    const userRes = await client.query(
      'SELECT id, name, role, branch_id FROM users WHERE id = $1',
      [userId]
    )

    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '8h' })
    cookies().set('token', token, { httpOnly: true, secure: true, path: '/' })

    return Response.json({ success: true, user: userRes.rows[0] })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 401 })
  } finally {
    client.release()
  }
}
