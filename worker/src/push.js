// Minimaler Web-Push (VAPID + aes128gcm) für Cloudflare Workers — nur WebCrypto, keine Node-Deps.
// RFC 8291 (aes128gcm) + RFC 8292 (VAPID)

const enc = new TextEncoder();

export function b64urlEnc(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
export function b64urlDec(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const raw = atob(str);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
function concat(...arrs) {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

// HKDF-SHA256 — wir brauchen Ausgabelängen ≤ 32 Byte → ein HMAC-Block reicht
async function hkdf(salt, ikm, info, length) {
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const t1Input = concat(info, new Uint8Array([1]));
  const t1 = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, t1Input));
  return t1.slice(0, length);
}

export async function importVapidSigningKey(privB64url, pubB64url) {
  const d = b64urlDec(privB64url);            // 32 Bytes private scalar
  const pub = b64urlDec(pubB64url);           // 65 Bytes uncompressed point: 0x04 || X(32) || Y(32)
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error("VAPID_PUBLIC ist kein 65-Byte uncompressed P-256 Punkt");
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  const jwk = { kty: "EC", crv: "P-256", d: b64urlEnc(d), x: b64urlEnc(x), y: b64urlEnc(y), ext: true };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function signVapidJWT(audience, subject, vapidPrivKey) {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject };
  const signingInput = b64urlEnc(enc.encode(JSON.stringify(header))) + "." + b64urlEnc(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, vapidPrivKey, enc.encode(signingInput));
  return signingInput + "." + b64urlEnc(sig);
}

async function encryptAes128gcm(payloadBytes, p256dhB64, authB64) {
  const recipientPubRaw = b64urlDec(p256dhB64);   // 65 Bytes uncompressed
  const auth = b64urlDec(authB64);                // 16 Bytes

  // Ephemeren EC-Key generieren
  const ephKey = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", ephKey.publicKey)); // 65 Bytes

  // Recipient-Public importieren
  const recipientPub = await crypto.subtle.importKey("raw", recipientPubRaw, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // ECDH-Shared-Secret
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: recipientPub }, ephKey.privateKey, 256));

  // RFC 8291 §3.3 — IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0"||ua_public||as_public, len=32)
  const keyInfo = concat(enc.encode("WebPush: info\0"), recipientPubRaw, ephPubRaw);
  const ikm = await hkdf(auth, ecdhSecret, keyInfo, 32);

  // Salt zufällig
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK und Nonce
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  // aes128gcm Padding: payload || 0x02 (Letzte-Record-Marker)
  const padded = concat(payloadBytes, new Uint8Array([0x02]));
  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded));

  // Header: salt(16) || rs(4, big-endian) || idlen(1) || keyid(idlen)
  const rs = 4096;
  const rsBytes = new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255]);
  const idlen = new Uint8Array([ephPubRaw.byteLength]);
  return concat(salt, rsBytes, idlen, ephPubRaw, ciphertext);
}

export async function sendPush(subscription, payload, env) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    const e = new Error("Subscription unvollständig"); e.statusCode = 400; throw e;
  }
  const endpoint = subscription.endpoint;
  const audience = new URL(endpoint).origin;
  const subject = env.VAPID_SUBJECT || "mailto:noreply@example.com";

  const vapidKey = await importVapidSigningKey(env.VAPID_PRIVATE, env.VAPID_PUBLIC);
  const jwt = await signVapidJWT(audience, subject, vapidKey);

  const payloadBytes = typeof payload === "string" ? enc.encode(payload) : new Uint8Array(payload);
  const body = await encryptAes128gcm(payloadBytes, subscription.keys.p256dh, subscription.keys.auth);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "3600"
    },
    body
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const err = new Error(`Push HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    err.statusCode = res.status;
    err.body = errBody;
    throw err;
  }
  return res;
}
