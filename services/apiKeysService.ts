import CryptoJS from 'crypto-js';

export async function fetchUserApiKeys(): Promise<Record<string, string>> {
  const dynamicDomain = window.location.origin;
  const apiEndpoint = `${dynamicDomain}/social-media/file_manager/getSystemConfig`;
  const SECRET_PASS = "VruRPDG*rDpV7FMNUg)G%2zMFBdUHbNQ";

  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

    const { payload, iv: encodedIv } = await response.json();

    // 1. Replicate the PHP key derivation (SHA256 of the password)
    const key = CryptoJS.SHA256(SECRET_PASS);
    const iv = CryptoJS.enc.Base64.parse(encodedIv);

    // 2. Decrypt
    const decrypted = CryptoJS.AES.decrypt(payload, key, {
      iv: iv,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });

    // 3. Convert to UTF-8
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new Error("Decryption resulted in empty string (Likely wrong key/IV)");
    }

    return JSON.parse(decryptedText);

  } catch (error) {
    console.error('Error fetching/decrypting user API keys:', error);
    return {};
  }
}