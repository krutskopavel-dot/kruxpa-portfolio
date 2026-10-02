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
  form { display: flex; gap: 8px; }
  /* A plain text field: outline only (a filled background reads as a button), eye toggle inside */
  .field { position: relative; flex: 1; min-width: 0; }
  input {
    width: 100%; height: 52px; padding: 0 52px 0 16px;
    border: 1px solid #cdd2d6; border-radius: 8px; background: transparent;
    font: inherit; font-size: 16px; color: #171717; text-align: left;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  input::placeholder { color: #8a949d; }
  input:hover { border-color: #9aa3ab; }
  input:focus { outline: none; border-color: #171717; box-shadow: 0 0 0 3px rgba(23,23,23,.08); }
  .error-state input { border-color: #c0392b; }
  .reveal {
    position: absolute; top: 4px; right: 4px; display: grid; place-items: center;
    width: 44px; height: 44px; padding: 0; border: 0; border-radius: 6px;
    background: none; color: #58646f; cursor: pointer;
  }
  .reveal:hover { color: #171717; background: rgba(0,0,0,.04); }
  .reveal .off, .reveal[aria-pressed='true'] .on { display: none; }
  .reveal[aria-pressed='true'] .off { display: block; }
  button:focus-visible, a:focus-visible { outline: 2px solid #0c3fee; outline-offset: 2px; }
  button[type='submit'] {
    height: 52px; padding: 0 24px; border: 0; border-radius: 8px; background: #171717; color: #fafafa;
    font: 500 14px/20px 'ABC Areal', sans-serif; cursor: pointer;
  }
  button[type='submit']:hover { background: #2a2a2a; }
  .error { color: #c0392b; font-size: 14px; line-height: 20px; }
  a { color: #58646f; font-size: 14px; line-height: 20px; }
</style>
</head>
<body>
<main>
  <span class="eyebrow">Case study 01 — DISio · NDA</span>
  <h1>This case study is password protected</h1>
  <p>The project is under NDA. Enter the password you received, or ask me for one.</p>
  <form method="post"${wrong ? ' class="error-state"' : ''}>
    <div class="field">
      <input id="password" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required autofocus${wrong ? ' aria-invalid="true"' : ''}>
      <button class="reveal" type="button" aria-label="Show password" aria-pressed="false" aria-controls="password">
        <svg class="on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg class="off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>
      </button>
    </div>
    <button type="submit">Open case</button>
  </form>
  ${wrong ? '<p class="error" role="alert">Wrong password, try again.</p>' : ''}
  <a href="/">← Back to the homepage</a>
</main>
<script>
  const input = document.getElementById('password');
  const reveal = document.querySelector('.reveal');
  reveal.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    reveal.setAttribute('aria-pressed', String(show));
    reveal.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    input.focus();
  });
</script>
</body>
</html>`;
