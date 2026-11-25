// Web Push sem bibliotecas externas (RFC 8291 + RFC 8188 + VAPID RFC 8292), usando só WebCrypto.
const te = new TextEncoder();

export const b64u = {
  enc(buf) {
    const a = new Uint8Array(buf); let s = '';
    for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    let s = String(str).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const b = atob(s); const out = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }
};
const concat = (...arrs) => { const n = arrs.reduce((t, a) => t + a.length, 0); const o = new Uint8Array(n); let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; } return o; };

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8));
}

// chave pública "crua" (65 bytes) + privada (32 bytes) -> JWK
function jwk(pubRaw, privRaw) {
  const j = { kty: 'EC', crv: 'P-256', x: b64u.enc(pubRaw.slice(1, 33)), y: b64u.enc(pubRaw.slice(33, 65)), ext: true };
  if (privRaw) j.d = b64u.enc(privRaw);
  return j;
}

// Criptografa a mensagem para uma inscrição (aes128gcm). "fixo" só é usado em testes.
export async function criptografar(payload, uaPublicB64, authB64, fixo = null) {
  const uaPub = b64u.dec(uaPublicB64), auth = b64u.dec(authB64);
  let asPriv, asPub;
  if (fixo) {
    asPub = b64u.dec(fixo.asPublic);
    asPriv = await crypto.subtle.importKey('jwk', jwk(asPub, b64u.dec(fixo.asPrivate)), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
  const keyInfo = concat(te.encode('WebPush: info\0'), uaPub, asPub);
  const ikm = await hkdf(auth, ecdh, keyInfo, 32);
  const salt = fixo ? b64u.dec(fixo.salt) : crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const plain = concat(typeof payload === 'string' ? te.encode(payload) : payload, new Uint8Array([2]));
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain));
  const rs = 4096;
  const header = concat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255, asPub.length]), asPub);
  return concat(header, cipher);
}

// Cabeçalho de autorização VAPID
export async function vapidAuth(endpoint, pubB64, privB64, sub) {
  const pub = b64u.dec(pubB64), priv = b64u.dec(privB64);
  const key = await crypto.subtle.importKey('jwk', jwk(pub, priv), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const aud = new URL(endpoint).origin;
  const head = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u.enc(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body)));
  return `vapid t=${head}.${body}.${b64u.enc(sig)}, k=${pubB64}`;
}

// Envia uma notificação. Retorna o status HTTP (201 = ok; 404/410 = inscrição expirada).
export async function enviarPush(insc, mensagem, vapid) {
  const corpo = await criptografar(JSON.stringify(mensagem), insc.p256dh, insc.auth);
  const r = await fetch(insc.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'TTL': '86400', 'Urgency': 'normal',
      'Authorization': await vapidAuth(insc.endpoint, vapid.publica, vapid.privada, vapid.sub)
    },
    body: corpo
  });
  return r.status;
}
