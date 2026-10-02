// Vercel Routing Middleware: password gate for NDA case studies.
// Runs on Vercel before the static page is served, so the protected HTML never reaches a visitor
// without the password. The password lives in the project's environment variables
// (DISIO_PASSWORD), never in the repo. A correct password sets an HttpOnly cookie for 30 days.
// Not active in `astro dev` — only on Vercel deployments.
import { next } from '@vercel/functions';

export const config = { matcher: ['/work/disio', '/work/disio/:path*'] };

const COOKIE = 'nda_disio';
const MAX_AGE = 60 * 60 * 24 * 30;

declare const process: { env: Record<string, string | undefined> };

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// The cookie holds a hash of the password, not the password; changing the password logs everyone out.
const tokenFor = (password: string) => sha256(`kruxpa-nda:disio:${password}`);

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
}

export default async function middleware(request: Request) {
  const password = process.env.DISIO_PASSWORD;
  // Fail closed: without a configured password nobody gets in.
  const token = password ? await tokenFor(password) : undefined;

  if (token && readCookie(request, COOKIE) === token) return next();

  if (request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const attempt = String(form?.get('password') ?? '');
    if (token && attempt && (await tokenFor(attempt)) === token) {
      const url = new URL(request.url);
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname,
          'set-cookie': `${COOKIE}=${token}; Path=/work/disio; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'cache-control': 'no-store',
        },
      });
    }
    return gate(true);
  }

  return gate(false);
}

function gate(wrong: boolean): Response {
  return new Response(page(wrong), {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

// Standalone page in the site's look: page background, ABC Areal, mono label, ink button.
const page = (wrong: boolean) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>DISio — Protected case study · Pavel Krutsko</title>
<link rel="icon" href="/favicon.png" type="image/png">
<style>
  @font-face { font-family: 'ABC Areal'; src: url('/fonts/ABCAreal-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'ABC Areal'; src: url('/fonts/ABCAreal-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'ABC Areal Mono'; src: url('/fonts/ABCArealMono-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
    background: #f5f5f5; color: #1d252c;
    font: 400 16px/24px 'ABC Areal', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 24px; text-align: center; }
  .eyebrow { font: 500 12px/16px 'ABC Areal Mono', ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; color: #5f6b76; }
  h1 { margin: 0; font-weight: 500; font-size: 32px; line-height: 38px; letter-spacing: -.02em; }
  p { margin: 0; color: #58646f; }
  form { display: flex; gap: 8px; padding: 8px; border-radius: 12px; background: rgba(0,0,0,.05); }
  input {
    flex: 1; min-width: 0; height: 52px; padding: 0 16px; border: 0; border-radius: 8px;
    background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.1);
    font: inherit; font-size: 16px; color: #171717;
  }
  input:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid #0c3fee; outline-offset: 2px; }
  button {
    height: 52px; padding: 0 24px; border: 0; border-radius: 8px; background: #171717; color: #fafafa;
    font: 500 14px/20px 'ABC Areal', sans-serif; cursor: pointer;
  }
  button:hover { background: #2a2a2a; }
  .error { color: #c0392b; font-size: 14px; line-height: 20px; }
  a { color: #58646f; font-size: 14px; line-height: 20px; }
</style>
</head>
<body>
<main>
  <span class="eyebrow">Case study 01 — DISio · NDA</span>
  <h1>This case study is password protected</h1>
  <p>The project is under NDA. Enter the password you received, or ask me for one.</p>
  <form method="post">
    <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required autofocus>
    <button type="submit">Open case</button>
  </form>
  ${wrong ? '<p class="error" role="alert">Wrong password, try again.</p>' : ''}
  <a href="/">← Back to the homepage</a>
</main>
</body>
</html>`;
