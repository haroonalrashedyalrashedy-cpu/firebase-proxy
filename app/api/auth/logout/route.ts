import { Pool } from 'pg'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST() {
  const userId = headers().get('x-user-id')
  const client = await pool.connect()
  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])
    await client.query('SELECT logout()')
    cookies().delete('token')
    return Response.json({ success: true })
  } finally {
    client.release()
  }
}
