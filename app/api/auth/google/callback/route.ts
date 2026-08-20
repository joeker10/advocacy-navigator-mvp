import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signing you in...</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #0f172a;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .container {
          text-align: center;
          padding: 2.5rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          max-width: 90%;
          width: 360px;
        }
        .spinner {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: spin 2s infinite linear;
          display: inline-block;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 0.5rem 0; font-size: 1.3rem; }
        p { margin: 0; font-size: 0.9rem; opacity: 0.7; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner">⏳</div>
        <h2 id="status-title">Signing You In</h2>
        <p id="status-desc">Connecting your Google Account with SpEd Navigator...</p>
      </div>

      <script>
        async function completeAuth() {
          const title = document.getElementById('status-title');
          const desc = document.getElementById('status-desc');

          try {
            // Check hash parameters for Implicit Token Flow
            const hash = window.location.hash ? window.location.hash.substring(1) : '';
            const hashParams = new URLSearchParams(hash);
            let accessToken = hashParams.get('access_token');
            let idToken = hashParams.get('id_token');

            // Also check URL search query parameters
            if (!accessToken && !idToken) {
              const searchParams = new URLSearchParams(window.location.search);
              accessToken = searchParams.get('access_token');
              idToken = searchParams.get('id_token');
            }

            // If we have an access token, fetch the Google user profile
            let userEmail = '';
            if (accessToken) {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + accessToken);
              const profile = await res.json();
              if (profile && profile.email) {
                userEmail = profile.email;
              }
            }

            if (!userEmail && idToken) {
              try {
                const base64Url = idToken.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded && decoded.email) {
                  userEmail = decoded.email;
                }
              } catch (e) {
                console.error("Failed to decode idToken:", e);
              }
            }

            if (!userEmail) {
              title.innerText = "Notice";
              desc.innerText = "No credentials received. Redirecting to home...";
              setTimeout(() => { window.location.href = '/'; }, 1500);
              return;
            }

            // Call our server API to register/login the user
            title.innerText = "Verified!";
            desc.innerText = "Welcome back " + userEmail + ". Preparing your dashboard...";

            const authRes = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: 'mock_token_' + userEmail })
            });

            const authData = await authRes.json();
            if (authData.success && authData.token) {
              localStorage.setItem('spednav_auth_token', authData.token);

              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_TOKEN', token: authData.token }, '*');
                setTimeout(() => window.close(), 800);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 800);
              }
            } else {
              title.innerText = "Authentication Error";
              desc.innerText = authData.error || "Failed to establish session.";
              setTimeout(() => { window.location.href = '/'; }, 2000);
            }
          } catch (err) {
            console.error("Auth completion failed:", err);
            title.innerText = "Sign-In Error";
            desc.innerText = err.message || "An unexpected error occurred.";
            setTimeout(() => { window.location.href = '/'; }, 2000);
          }
        }

        completeAuth();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
