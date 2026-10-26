// Cloudflare Pages middleware: puts the whole site (pages and images) behind a
// username + password. Set both in Cloudflare → your Pages project → Settings →
// Variables and Secrets:
//   SITE_USER      the username visitors type (e.g. "guest")
//   SITE_PASSWORD  the password (add it as a Secret so it stays hidden)

const REALM = 'Alice Brocca Portfolio';

// Compare without exiting early, so response timing doesn't hint at the password.
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] || 0) ^ (y[i] || 0);
  }
  return diff === 0;
}

function askForPassword() {
  return new Response('Password required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequest({ request, env, next }) {
  const user = env.SITE_USER;
  const pass = env.SITE_PASSWORD;

  // Fail closed: if the password isn't set up yet, show nothing.
  if (!user || !pass) {
    return new Response('This site is not configured yet.', { status: 503 });
  }

  const header = request.headers.get('Authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return askForPassword();

  let decoded;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)));
  } catch {
    return askForPassword();
  }

  const sep = decoded.indexOf(':');
  const givenUser = decoded.slice(0, sep);
  const givenPass = decoded.slice(sep + 1);

  // Check both, always, so a wrong username takes as long as a wrong password.
  const ok = safeEqual(givenUser, user) & safeEqual(givenPass, pass);
  if (sep < 0 || !ok) return askForPassword();

  const response = await next();
  // Keep protected pages out of shared caches.
  const out = new Response(response.body, response);
  out.headers.set('Cache-Control', 'private, no-store');
  return out;
}
