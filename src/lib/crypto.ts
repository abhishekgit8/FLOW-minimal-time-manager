const ALGO = 'AES-GCM'
const KEY_ENV = 'TOKEN_ENCRYPTION_KEY'

async function getKey(): Promise<CryptoKey | null> {
  const raw = process.env[KEY_ENV]
  if (!raw) return null
  const keyBytes = new TextEncoder().encode(raw.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGO }, false, ['encrypt', 'decrypt'])
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey()
  if (!key) return plaintext
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptToken(token: string): Promise<string> {
  const key = await getKey()
  if (!key) return token
  try {
    const combined = new Uint8Array(atob(token).split('').map(c => c.charCodeAt(0)))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch {
    return token
  }
}
