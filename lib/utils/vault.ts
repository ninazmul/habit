import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM

function getMasterKey(): Buffer {
  const secret = process.env.VAULT_SECRET_KEY || process.env.VAULT_ENCRYPTION_KEY || "habit-vault-secure-local-fallback-key";
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export function encryptSecret(plainText: string): EncryptedResult {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 */
export function decryptSecret(
  encryptedData: string,
  ivHex: string,
  authTagHex: string
): string {
  try {
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Vault decryption failed:", err);
    throw new Error("Failed to decrypt secret. Possible key mismatch or data corruption.");
  }
}

/**
 * Strong password / token generator helper.
 */
export function generateStrongPassword(options?: {
  length?: number;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}): string {
  const {
    length = 20,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options || {};

  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  let chars = lowercase;
  if (includeUppercase) chars += uppercase;
  if (includeNumbers) chars += numbers;
  if (includeSymbols) chars += symbols;

  let password = "";
  const randomValues = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }

  return password;
}
