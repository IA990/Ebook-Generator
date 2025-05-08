// Basic XSS sanitization using DOMPurify (if available) or fallback
export function sanitizeInput(input) {
  if (window.DOMPurify) {
    return DOMPurify.sanitize(input);
  }
  // Basic fallback: escape <, >, &, ", '
  return input.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '<';
      case '>': return '>';
      case '"': return '"';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

// AES-GCM encryption and decryption using Web Crypto API
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ivLength = 12; // 96 bits

export async function generateKey(password) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ebook-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data, password) {
  const key = await generateKey(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(ivLength));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  const buffer = new Uint8Array(encrypted);
  const combined = new Uint8Array(ivLength + buffer.length);
  combined.set(iv);
  combined.set(buffer, ivLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedData, password) {
  const key = await generateKey(password);
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, ivLength);
  const data = combined.slice(ivLength);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}
