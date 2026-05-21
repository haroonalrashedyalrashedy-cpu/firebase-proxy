export const dynamic = 'force-dynamic'
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const client = await pool.connect()
  try {
    const res = await client.query(
      "SELECT id, username, name FROM users WHERE status = 'نشط' ORDER BY name"
    )
    return Response.json(res.rows)
  } finally {
    client.release()
  }
}
