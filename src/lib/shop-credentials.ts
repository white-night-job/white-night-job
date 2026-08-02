import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const ENC_PREFIX = "wnj1.";
const LOGIN_ID_PREFIX = "SHOP-";
const LOGIN_ID_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_LOWER = "abcdefghijkmnpqrstuvwxyz";
const PASSWORD_DIGIT = "23456789";
const PASSWORD_ALL = `${PASSWORD_UPPER}${PASSWORD_LOWER}${PASSWORD_DIGIT}`;
const DEFAULT_PASSWORD_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.SHOP_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, "hex");
    }
    const asBuf = Buffer.from(raw, "base64");
    if (asBuf.length === 32) return asBuf;
    throw new Error(
      "SHOP_CREDENTIALS_ENCRYPTION_KEY は32バイトのhex(64文字)またはbase64である必要があります。",
    );
  }

  // ローカル互換: ADMIN_SESSION_SECRET から決定的に派生（本番は専用キー推奨）
  const seed =
    process.env.ADMIN_SESSION_SECRET?.trim() || "shop-credentials-dev-secret";
  return createHash("sha256").update(`shop-credentials:${seed}`).digest();
}

function toBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

export function isEncryptedShopPassword(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

/** AES-256-GCM で暗号化する。DBにはこの文字列のみ保存する。 */
export function encryptShopPassword(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${toBase64Url(iv)}.${toBase64Url(
    Buffer.concat([encrypted, tag]),
  )}`;
}

/** 管理者表示・ログイン照合用に平文へ戻す。レガシー平文もそのまま返す。 */
export function decryptShopPassword(stored: string): string {
  const value = stored.trim();
  if (!value) return "";
  if (!isEncryptedShopPassword(value)) {
    return value;
  }

  const parts = value.slice(ENC_PREFIX.length).split(".");
  if (parts.length !== 2) {
    throw new Error("店舗パスワードの暗号化形式が不正です。");
  }

  const iv = fromBase64Url(parts[0]);
  const payload = fromBase64Url(parts[1]);
  if (iv.length !== 12 || payload.length <= 16) {
    throw new Error("店舗パスワードの暗号化データが不正です。");
  }

  const ciphertext = payload.subarray(0, payload.length - 16);
  const tag = payload.subarray(payload.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

export function safeDecryptShopPassword(stored: string | null | undefined): string {
  if (!stored?.trim()) return "";
  try {
    return decryptShopPassword(stored);
  } catch {
    return "";
  }
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    // 長さ漏洩を抑えるためダミー比較
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function shopPasswordsMatch(
  storedPassword: string | null | undefined,
  inputPassword: string,
): boolean {
  if (!storedPassword || !inputPassword) return false;
  try {
    const plain = decryptShopPassword(storedPassword);
    return timingSafeStringEqual(plain, inputPassword);
  } catch {
    return false;
  }
}

function randomChar(chars: string): string {
  const index = randomBytes(1)[0] % chars.length;
  return chars[index];
}

export function generateShopLoginId(): string {
  let body = "";
  for (let i = 0; i < 6; i += 1) {
    body += randomChar(LOGIN_ID_CHARS);
  }
  return `${LOGIN_ID_PREFIX}${body}`;
}

export function generateShopLoginPassword(
  length = DEFAULT_PASSWORD_LENGTH,
): string {
  const size = Math.max(length, 16);
  const chars = [
    randomChar(PASSWORD_UPPER),
    randomChar(PASSWORD_LOWER),
    randomChar(PASSWORD_DIGIT),
  ];
  while (chars.length < size) {
    chars.push(randomChar(PASSWORD_ALL));
  }
  // Fisher–Yates
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function allocateUniqueShopLoginId(
  supabase: SupabaseClient,
  maxAttempts = 24,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const loginId = generateShopLoginId();
    const { data, error } = await supabase
      .from("jobs")
      .select("id")
      .eq("shop_login_id", loginId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return loginId;
  }
  throw new Error("店舗ログインIDの生成に失敗しました。再試行してください。");
}

export async function createEncryptedShopCredentials(
  supabase: SupabaseClient,
): Promise<{
  shopLoginId: string;
  shopLoginPasswordPlain: string;
  shop_login_id: string;
  shop_login_password: string;
}> {
  const shopLoginId = await allocateUniqueShopLoginId(supabase);
  const shopLoginPasswordPlain = generateShopLoginPassword();
  return {
    shopLoginId,
    shopLoginPasswordPlain,
    shop_login_id: shopLoginId,
    shop_login_password: encryptShopPassword(shopLoginPasswordPlain),
  };
}

export function encryptPasswordForStorage(plaintext: string): string {
  return encryptShopPassword(plaintext);
}

/** 管理者閲覧時: レガシー平文を同じ値のまま AES 暗号文へ移行する */
export async function migratePlaintextShopPasswordIfNeeded(
  supabase: SupabaseClient,
  jobId: string,
  storedPassword: string | null | undefined,
): Promise<void> {
  const stored = storedPassword?.trim();
  if (!stored || isEncryptedShopPassword(stored)) return;

  const { error } = await supabase
    .from("jobs")
    .update({ shop_login_password: encryptShopPassword(stored) })
    .eq("id", jobId);
  if (error) {
    console.error("[shop-credentials] plaintext migrate failed", {
      jobId,
      message: error.message,
    });
  }
}

export async function migratePlaintextShopPasswordsInRows(
  supabase: SupabaseClient,
  rows: Array<{ id?: string | null; shop_login_password?: string | null }>,
): Promise<void> {
  const targets = rows.filter(
    (row) =>
      row.id &&
      row.shop_login_password?.trim() &&
      !isEncryptedShopPassword(row.shop_login_password),
  );
  if (targets.length === 0) return;

  await Promise.all(
    targets.map((row) =>
      migratePlaintextShopPasswordIfNeeded(
        supabase,
        String(row.id),
        row.shop_login_password,
      ),
    ),
  );
}

