"use client"

// Cryptography Utilities for E2EE using Web Crypto API

// --- Constants ---
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // Standard for AES-GCM
const KEY_Length = 256;
const ALGO_RSA = "RSA-OAEP";
const ALGO_AES = "AES-GCM";
const ALGO_KDF = "PBKDF2";
const HASH = "SHA-256";
const ITERATIONS = 100000; // Secure iteration count

// --- Types ---
export type KeyPair = {
    publicKey: string; // Base64
    privateKey: string; // Base64 (exported, unencrypted)
}

// --- Helpers ---

// Convert BufferSource to Base64 String
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    let binary = '';
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Convert Base64 String to Uint8Array
export function base64ToArrayBuffer(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

// Generate Random Salt
export function generateSalt(): string {
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    return arrayBufferToBase64(salt);
}

// --- Key Generation ---

export async function generateKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: ALGO_RSA,
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: HASH
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey) as ArrayBuffer;
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey) as ArrayBuffer;

    return {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        privateKey: arrayBufferToBase64(privateKeyBuffer)
    };
}

// --- Key Management (PIN / Recovery) ---

// Derive a Key from a User PIN (or Password)
export async function deriveKeyFromText(text: string, saltBase64: string): Promise<CryptoKey> {
    const textBuffer = new TextEncoder().encode(text);
    const saltBuffer = base64ToArrayBuffer(saltBase64);

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        textBuffer as BufferSource,
        { name: ALGO_KDF },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: ALGO_KDF,
            salt: saltBuffer as BufferSource,
            iterations: ITERATIONS,
            hash: HASH
        },
        keyMaterial,
        { name: ALGO_AES, length: KEY_Length },
        false,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
}

// Import a Private Key from Base64 String
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    const binaryDer = base64ToArrayBuffer(privateKeyBase64);
    return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer as BufferSource,
        {
            name: ALGO_RSA,
            hash: HASH,
        },
        true,
        ["decrypt"]
    );
}

// Import a Public Key from Base64 String
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const binaryDer = base64ToArrayBuffer(publicKeyBase64);
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer as BufferSource,
        {
            name: ALGO_RSA,
            hash: HASH,
        },
        true,
        ["encrypt"]
    );
}


// Encrypt (Wrap) Private Key using derived PIN Key
export async function encryptPrivateKey(privateKeyBase64: string, wrappingKey: CryptoKey): Promise<string> {
    const privateKey = await importPrivateKey(privateKeyBase64);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const wrappedKey = await window.crypto.subtle.wrapKey(
        "pkcs8",
        privateKey,
        wrappingKey,
        {
            name: ALGO_AES,
            iv: iv as BufferSource
        }
    );

    // Combine IV and Ciphertext
    const combined = new Uint8Array(iv.length + wrappedKey.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(wrappedKey), iv.length);

    return arrayBufferToBase64(combined);
}

// Decrypt (Unwrap) Private Key using derived PIN Key
export async function decryptPrivateKey(encryptedPrivateKeyBase64: string, unwrappingKey: CryptoKey): Promise<string> {
    const combined = base64ToArrayBuffer(encryptedPrivateKeyBase64);
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    try {
        const unwrappedKey = await window.crypto.subtle.unwrapKey(
            "pkcs8",
            ciphertext as BufferSource,
            unwrappingKey,
            {
                name: ALGO_AES,
                iv: iv as BufferSource
            },
            {
                name: ALGO_RSA,
                hash: HASH
            },
            true,
            ["decrypt"]
        );

        const exported = await window.crypto.subtle.exportKey("pkcs8", unwrappedKey);
        return arrayBufferToBase64(exported as ArrayBuffer);
    } catch (e) {
        throw new Error("Incorrect PIN or corrupted key. " + e);
    }
}


// --- Message Encryption ---

// 1. Generate a random symmetric key for the message
export async function generateMessageKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: ALGO_AES,
            length: KEY_Length
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// 2. Encrypt the message content with the symmetric key
export async function encryptMessageContent(content: string, messageKey: CryptoKey): Promise<string> {
    const encoded = new TextEncoder().encode(content);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: ALGO_AES,
            iv: iv as BufferSource
        },
        messageKey,
        encoded as BufferSource
    );

    // Combine IV and Ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return arrayBufferToBase64(combined);
}

// 3. Encrypt the symmetric key for a recipient (using their RSA Public Key)
export async function encryptMessageKeyForRecipient(messageKey: CryptoKey, recipientPublicKeyBase64: string): Promise<string> {
    const publicKey = await importPublicKey(recipientPublicKeyBase64);

    // Export message key to raw bytes
    const rawKey = await window.crypto.subtle.exportKey("raw", messageKey);

    const encryptedKey = await window.crypto.subtle.encrypt(
        {
            name: ALGO_RSA
        },
        publicKey,
        rawKey as BufferSource
    );

    return arrayBufferToBase64(encryptedKey as ArrayBuffer);
}

// --- Message Decryption ---

// 1. Decrypt the symmetric key using own Private Key
export async function decryptMessageKey(encryptedKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKeyBase64);

    const rawKey = await window.crypto.subtle.decrypt(
        {
            name: ALGO_RSA
        },
        privateKey,
        encryptedKeyBuffer as BufferSource
    );

    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        {
            name: ALGO_AES,
            length: KEY_Length
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// 2. Decrypt the content using the symmetric key
export async function decryptMessageContent(encryptedContentBase64: string, messageKey: CryptoKey): Promise<string> {
    const combined = base64ToArrayBuffer(encryptedContentBase64);
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: ALGO_AES,
            iv: iv as BufferSource
        },
        messageKey,
        ciphertext as BufferSource
    );

    return new TextDecoder().decode(decrypted);
}

// --- Recovery Key Helpers ---
export function generateRecoveryKey(): string {
    // Generate 32 random bytes and convert to hex
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
