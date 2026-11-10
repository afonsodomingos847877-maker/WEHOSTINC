import { NextResponse } from 'next/server';
import { clearSessionCookie, clearWebmailSessionCookie } from '@/lib/serverAuth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  clearWebmailSessionCookie(response);
  response.cookies.delete('wehost_reauth_token');
  return response;
}

