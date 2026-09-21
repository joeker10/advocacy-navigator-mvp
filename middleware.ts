import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://www.thespecialeducationnavigator.app',
  'https://thespecialeducationnavigator.app',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://192.168.');
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowed = isOriginAllowed(origin);

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-admin-passcode',
      'Access-Control-Max-Age': '86400',
    };

    if (isAllowed && origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
      headers['Access-Control-Allow-Origin'] = 'null';
    }

    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // Handle standard API responses by appending CORS headers
  const response = NextResponse.next();

  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-admin-passcode');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
