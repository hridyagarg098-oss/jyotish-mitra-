import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Always redirect to the production domain — prevents localhost redirects
  // when Supabase confirmation emails are clicked from mobile/email clients.
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      return NextResponse.redirect(`${siteUrl}/dashboard/${data.user.id}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth?error=callback_failed`);
}
