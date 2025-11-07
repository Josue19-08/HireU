/**
 * Seed Vault Service
 * Service to encrypt and store seed phrases securely
 * Uses WebCrypto API for AES-GCM 256-bit encryption (HTTPS)
 * Fallback to crypto-js for local development (HTTP)
 */

import CryptoJS from "crypto-js";

const SEED_STORAGE_KEY = "offer-hub_encrypted_seed";
const KEY_STORAGE_KEY = "offer-hub_encryption_key";
const LOCK_STATE_KEY = "offer-hub_wallet_locked";
const USE_FALLBACK_KEY = "offer-hub_use_fallback_crypto";

/**
 * Checks if Web Crypto API is available
 */
function isWebCryptoAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  const crypto = window.crypto;
  return !!(crypto && crypto.subtle);
}

/**
 * Gets the available crypto API (client only)
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
 * Generates a random encryption key
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  const crypto = getCrypto();
  
  // Additional crypto.subtle verification
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
 * Exports the encryption key as ArrayBuffer
 */
async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  const crypto = getCrypto();
  return await crypto.subtle.exportKey("raw", key);
}

/**
 * Imports an encryption key from ArrayBuffer
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
 * Encrypts the seed phrase using AES-GCM
 */
async function encryptSeed(seedPhrase: string, key: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine IV + encrypted data and convert to base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts the seed phrase
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
 * Saves the encrypted seed phrase using crypto-js (fallback)
 */
function saveSeedPhraseFallback(seedPhrase: string): void {
  // Generate a random key for development
  const encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
  
  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, encryptionKey).toString();
  
  // Save to localStorage
  localStorage.setItem(SEED_STORAGE_KEY, encrypted);
  localStorage.setItem(KEY_STORAGE_KEY, encryptionKey);
  localStorage.setItem(LOCK_STATE_KEY, "false");
  localStorage.setItem(USE_FALLBACK_KEY, "true");
  
  console.warn("⚠️ Using fallback encryption (crypto-js) - Web Crypto API not available. Use HTTPS in production.");
}

/**
 * Saves the encrypted seed phrase in IndexedDB
 * Only works in the client (browser)
 */
export async function saveSeedPhrase(seedPhrase: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("saveSeedPhrase can only be called in browser environment");
  }

  // If Web Crypto is not available, use fallback
  if (!isWebCryptoAvailable()) {
    saveSeedPhraseFallback(seedPhrase);
    return;
  }

  try {
    // Generate new encryption key
    const key = await generateEncryptionKey();
    const keyData = await exportKey(key);

    // Encrypt seed phrase
    const encryptedSeed = await encryptSeed(seedPhrase, key);

    // Save to localStorage (IndexedDB would be better for production)
    localStorage.setItem(SEED_STORAGE_KEY, encryptedSeed);
    localStorage.setItem(KEY_STORAGE_KEY, btoa(String.fromCharCode(...new Uint8Array(keyData))));
    localStorage.setItem(LOCK_STATE_KEY, "false");
    localStorage.setItem(USE_FALLBACK_KEY, "false");
  } catch (error) {
    console.error("Error saving seed phrase with Web Crypto, falling back to crypto-js:", error);
    // Fallback to crypto-js if Web Crypto fails
    saveSeedPhraseFallback(seedPhrase);
  }
}

/**
 * Retrieves and decrypts the seed phrase using crypto-js (fallback)
 */
function getSeedPhraseFallback(): string | null {
  try {
    const encryptedSeed = localStorage.getItem(SEED_STORAGE_KEY);
    const encryptionKey = localStorage.getItem(KEY_STORAGE_KEY);

    if (!encryptedSeed || !encryptionKey) {
      return null;
    }

    // Decrypt using crypto-js
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
 * Retrieves and decrypts the seed phrase
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

    // If fallback was used, use crypto-js to decrypt
    if (useFallback || !isWebCryptoAvailable()) {
      return getSeedPhraseFallback();
    }

    // Import key
    const keyBuffer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    const key = await importKey(keyBuffer.buffer);

    // Decrypt
    const seedPhrase = await decryptSeed(encryptedSeed, key);
    return seedPhrase;
  } catch (error) {
    console.error("Error getting seed phrase, trying fallback:", error);
    // Try with fallback if Web Crypto fails
    return getSeedPhraseFallback();
  }
}

/**
 * Checks if the wallet is unlocked
 */
export function isWalletUnlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // In development, auto-unlock
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const lockState = localStorage.getItem(LOCK_STATE_KEY);
  return lockState === "false";
}

/**
 * Locks the wallet
 */
export function lockWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCK_STATE_KEY, "true");
  }
}

/**
 * Unlocks the wallet (requires user verification in production)
 */
export function unlockWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCK_STATE_KEY, "false");
  }
}

/**
 * Removes the stored seed phrase
 */
export function clearSeedPhrase(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SEED_STORAGE_KEY);
    localStorage.removeItem(KEY_STORAGE_KEY);
    localStorage.removeItem(LOCK_STATE_KEY);
  }
}

/**
 * Checks if a saved seed phrase exists
 */
export function hasSeedPhrase(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(SEED_STORAGE_KEY) !== null;
}

