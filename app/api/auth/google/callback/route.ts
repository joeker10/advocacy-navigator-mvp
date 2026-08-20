import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return new NextResponse(`<html><body><script>alert("Google Sign-In was cancelled or failed: ${error}"); window.location.href="/";</script></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!code) {
      // In implicit flow or direct token return
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head><title>Authenticating...</title></head>
        <body>
          <script>
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const idToken = params.get('id_token');
            if (accessToken || idToken) {
              window.opener ? window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', accessToken, idToken }, '*') : null;
              window.location.href = '/';
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '584515942995-o6cjeqcm3k14jgr3jrkrmro0ash879qs.apps.googleusercontent.com',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${new URL(req.url).origin}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    let email = '';

    if (tokenData.access_token) {
      const userRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenData.access_token}`);
      const userData = await userRes.json();
      email = (userData.email || '').toLowerCase().trim();
    }

    if (!email) {
      return new NextResponse(`<html><body><script>alert("Failed to retrieve Google profile."); window.location.href="/";</script></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Upsert user
    const isOwner = email.toLowerCase() === 'joeker10@gmail.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'GOOGLE_AUTH_PLACEHOLDER',
          subscriptionStatus: isOwner ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
          subscriptionTier: isOwner ? 'UNLIMITED' : 'FREE',
          profileLimit: isOwner ? 9999 : 1,
          emailVerified: true
        }
      });
    } else {
      const updates: any = { emailVerified: true };
      if (isOwner) {
        updates.subscriptionStatus = 'SUBSCRIBED';
        updates.subscriptionTier = 'UNLIMITED';
        updates.profileLimit = 9999;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus
    });

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Signing in...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
        <div style="text-align: center;">
          <h2>Signing you in...</h2>
          <p>Redirecting back to SpEd Navigator...</p>
        </div>
        <script>
          localStorage.setItem('spednav_auth_token', ${JSON.stringify(token)});
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_TOKEN', token: ${JSON.stringify(token)} }, '*');
            setTimeout(() => window.close(), 500);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return new NextResponse(`<html><body><script>alert("Authentication error: ${err.message}"); window.location.href="/";</script></body></html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
