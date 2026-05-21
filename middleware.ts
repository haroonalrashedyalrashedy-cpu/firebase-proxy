import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  if (token && req.nextUrl.pathname.startsWith('/api/')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
      req.headers.set('x-user-id', decoded.userId.toString())
    } catch {}
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}