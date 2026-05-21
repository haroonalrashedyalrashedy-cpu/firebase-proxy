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
      `SELECT process_withdrawal($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [body.uuid, body.account_id, body.currency, body.amount, parseInt(userId),
       body.branch_id, body.receiver_name, body.note, body.approval_by]
    )

    const result = res.rows[0].process_withdrawal
    if (result === 'PENDING_APPROVAL') {
      return Response.json({ success: 'PENDING_APPROVAL' })
    }
    return Response.json({ success: result === 'OK' })
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 400 })
  } finally {
    client.release()
  }
}
