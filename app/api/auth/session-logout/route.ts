
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Create the response object first
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // CRITICAL FIX: Set the cookie on the response object, not with the imported function.
    // This is the correct pattern for modern Next.js versions.
    response.cookies.set('session', '', { expires: new Date(0), path: '/' });

    return response;

  } catch (error: any) {
    console.error('[POST /api/auth/session-logout] Error:', error);
    return NextResponse.json({ error: `Failed to log out: ${error.message}` }, { status: 500 });
  }
}
