import { Pool } from 'pg'
import { headers } from 'next/headers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req: Request) {
  const body = await req.json()
  const userId = headers().get('x-user-id')
  const client = await pool.connect()

  try {
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId])

    const res = await client.query(
      `SELECT process_exchange($1::uuid, $2::tx_type, $3, $4, $5, $6, $7, $8)`,
      [body.uuid, body.type, parseInt(userId), body.account_id, body.currency,
       body.amount, body.rate, body.branch_id]
    )

    const result = res.rows[0].process_exchange
    if (result.startsWith('OK:')) {
      return Response.json({ success: true, tx_number: result.split(':')[1] })
    }
    return Response.json({ success: false, error: result }, { status: 400 })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  } finally {
    client.release()
  }
}
