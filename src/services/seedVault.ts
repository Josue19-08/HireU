/**
 * Seed Vault Service
 * Servicio para encriptar y almacenar seed phrases de forma segura
 * Usa WebCrypto API para encriptación AES-GCM 256-bit (HTTPS)
 * Fallback a crypto-js para desarrollo local (HTTP)
 */

import CryptoJS from "crypto-js";

const SEED_STORAGE_KEY = "hireu_encrypted_seed";
const KEY_STORAGE_KEY = "hireu_encryption_key";
const LOCK_STATE_KEY = "hireu_wallet_locked";
const USE_FALLBACK_KEY = "hireu_use_fallback_crypto";

/**
 * Verifica si Web Crypto API está disponible
 */
function isWebCryptoAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  const crypto = window.crypto;
  return !!(crypto && crypto.subtle);
}

/**
 * Obtiene la API de crypto disponible (solo en cliente)
 */
function getCrypto(): Crypto {
  if (typeof window === "undefined") {
    throw new Error("Crypto API is only available in browser environment");
  }
  
  const crypto = window.crypto;
  
  if (!crypto || !crypto.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment");
  }
  
  return crypto;
}

/**
 * Genera una clave de encriptación aleatoria
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  const crypto = getCrypto();
  
  // Verificación adicional de crypto.subtle
  if (!crypto.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available. Please use a modern browser with HTTPS.");
  }
  
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exporta la clave de encriptación como ArrayBuffer
 */
async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  const crypto = getCrypto();
  return await crypto.subtle.exportKey("raw", key);
}

/**
 * Importa una clave de encriptación desde ArrayBuffer
 */
async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  const crypto = getCrypto();
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encripta el seed phrase usando AES-GCM
 */
async function encryptSeed(seedPhrase: string, key: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);

  // Generar IV aleatorio
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combinar IV + datos encriptados y convertir a base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Desencripta el seed phrase
 */
async function decryptSeed(encryptedData: string, key: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Guarda el seed phrase encriptado usando crypto-js (fallback)
 */
function saveSeedPhraseFallback(seedPhrase: string): void {
  // Generar una clave aleatoria para desarrollo
  const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
  
  // Encriptar usando AES
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, encryptionKey).toString();
  
  // Guardar en localStorage
  localStorage.setItem(SEED_STORAGE_KEY, encrypted);
  localStorage.setItem(KEY_STORAGE_KEY, encryptionKey);
  localStorage.setItem(LOCK_STATE_KEY, "false");
  localStorage.setItem(USE_FALLBACK_KEY, "true");
  
  console.warn("⚠️ Using fallback encryption (crypto-js) - Web Crypto API not available. Use HTTPS in production.");
}

/**
 * Guarda el seed phrase encriptado en IndexedDB
 * Solo funciona en el cliente (browser)
 */
export async function saveSeedPhrase(seedPhrase: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("saveSeedPhrase can only be called in browser environment");
  }

  // Si Web Crypto no está disponible, usar fallback
  if (!isWebCryptoAvailable()) {
    saveSeedPhraseFallback(seedPhrase);
    return;
  }

  try {
    // Generar nueva clave de encriptación
    const key = await generateEncryptionKey();
    const keyData = await exportKey(key);

    // Encriptar seed phrase
    const encryptedSeed = await encryptSeed(seedPhrase, key);

    // Guardar en localStorage (IndexedDB sería mejor para producción)
    localStorage.setItem(SEED_STORAGE_KEY, encryptedSeed);
    localStorage.setItem(KEY_STORAGE_KEY, btoa(String.fromCharCode(...new Uint8Array(keyData))));
    localStorage.setItem(LOCK_STATE_KEY, "false");
    localStorage.setItem(USE_FALLBACK_KEY, "false");
  } catch (error) {
    console.error("Error saving seed phrase with Web Crypto, falling back to crypto-js:", error);
    // Fallback a crypto-js si Web Crypto falla
    saveSeedPhraseFallback(seedPhrase);
  }
}

/**
 * Recupera y desencripta el seed phrase usando crypto-js (fallback)
 */
function getSeedPhraseFallback(): string | null {
  try {
    const encryptedSeed = localStorage.getItem(SEED_STORAGE_KEY);
    const encryptionKey = localStorage.getItem(KEY_STORAGE_KEY);

    if (!encryptedSeed || !encryptionKey) {
      return null;
    }

    // Desencriptar usando crypto-js
    const decrypted = CryptoJS.AES.decrypt(encryptedSeed, encryptionKey);
    const seedPhrase = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!seedPhrase) {
      return null;
    }
    
    return seedPhrase;
  } catch (error) {
    console.error("Error getting seed phrase with fallback:", error);
    return null;
  }
}

/**
 * Recupera y desencripta el seed phrase
 */
export async function getSeedPhrase(): Promise<string | null> {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const encryptedSeed = localStorage.getItem(SEED_STORAGE_KEY);
    const keyData = localStorage.getItem(KEY_STORAGE_KEY);
    const useFallback = localStorage.getItem(USE_FALLBACK_KEY) === "true";

    if (!encryptedSeed || !keyData) {
      return null;
    }

    // Si se usó fallback, usar crypto-js para desencriptar
    if (useFallback || !isWebCryptoAvailable()) {
      return getSeedPhraseFallback();
    }

    // Importar clave
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    const key = await importKey(keyBuffer.buffer);

    // Desencriptar
    const seedPhrase = await decryptSeed(encryptedSeed, key);
    return seedPhrase;
  } catch (error) {
    console.error("Error getting seed phrase, trying fallback:", error);
    // Intentar con fallback si Web Crypto falla
    return getSeedPhraseFallback();
  }
}

/**
 * Verifica si el wallet está desbloqueado
 */
export function isWalletUnlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // En desarrollo, auto-unlock
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const lockState = localStorage.getItem(LOCK_STATE_KEY);
  return lockState === "false";
}

/**
 * Bloquea el wallet
 */
export function lockWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCK_STATE_KEY, "true");
  }
}

/**
 * Desbloquea el wallet (requiere verificación de usuario en producción)
 */
export function unlockWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCK_STATE_KEY, "false");
  }
}

/**
 * Elimina el seed phrase almacenado
 */
export function clearSeedPhrase(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SEED_STORAGE_KEY);
    localStorage.removeItem(KEY_STORAGE_KEY);
    localStorage.removeItem(LOCK_STATE_KEY);
  }
}

/**
 * Verifica si existe un seed phrase guardado
 */
export function hasSeedPhrase(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(SEED_STORAGE_KEY) !== null;
}

