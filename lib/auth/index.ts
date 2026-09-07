import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { readDb, writeDb } from '@/lib/db/repo';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bursa-kumas-dunyasi-super-secure-production-secret-2026-key'
);

const PASSWORD_SALT = 'bursa_kumas_salt_2026';

// 1. Password Hashing (PBKDF2 SHA-512)
export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  // Check PBKDF2 hash
  const pbkdf2Hash = hashPassword(password);
  if (pbkdf2Hash === storedHash) return true;

  // Fallback for HMAC SHA-256 legacy or plain test seeds
  const legacyHmac = crypto.createHmac('sha256', PASSWORD_SALT).update(password).digest('hex');
  if (legacyHmac === storedHash) return true;

  // Fallback for demo seed plain passwords
  if (password === storedHash) return true;

  return false;
}

// 2. Token Hashing (SHA-256 for verification & reset tokens)
export function generateSecureToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// 3. User Session JWT
export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  sessionId?: string;
  permissions?: string[];
}

export async function signToken(payload: UserSessionPayload, expiresIn: string = '30d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

// 4. Rate Limiting (In-Memory Sliding Window)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.expiresAt < now) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

// 5. Get Authenticated User from Request (Cookie or Authorization header)
export async function getAuthenticatedUser(req: Request): Promise<{ user: any; session: any; role: 'customer' | 'admin' } | null> {
  try {
    let token: string | null = null;

    // Check cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/bkd_token=([^;]+)/);
    if (match && match[1]) {
      token = match[1];
    }

    // Check Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    const db = readDb();

    // Check Admin
    if (payload.role === 'admin') {
      const admin = (db.admin_users || []).find((a: any) => a.id === payload.userId);
      if (admin && admin.is_active !== 0) {
        return { user: admin, session: null, role: 'admin' };
      }
    }

    // Check Customer User
    const user = (db.users || []).find((u: any) => u.id === payload.userId);
    if (!user) return null;

    if (user.account_status === 'blocked' || user.account_status === 'deleted') {
      return null;
    }

    // Check Session validity if sessionId present
    let session = null;
    if (payload.sessionId && db.user_sessions) {
      session = db.user_sessions.find((s: any) => s.id === payload.sessionId && s.is_active === 1);
      if (session) {
        // Update last_active_at
        session.last_active_at = new Date().toISOString();
        writeDb(db);
      }
    }

    return { user, session, role: 'customer' };
  } catch (e) {
    return null;
  }
}

// 6. Security & Audit Logger
export function logSecurityEvent(userId: string | null, action: string, ip: string, userAgent: string, status: 'success' | 'failed' | 'blocked' = 'success', metadata: any = {}) {
  try {
    const db = readDb();
    if (!db.security_logs) db.security_logs = [];

    db.security_logs.unshift({
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      action,
      ip_address: ip,
      user_agent: userAgent,
      status,
      metadata,
      created_at: new Date().toISOString(),
    });

    // Keep last 1000 logs
    if (db.security_logs.length > 1000) {
      db.security_logs = db.security_logs.slice(0, 1000);
    }

    writeDb(db);
  } catch (e) {
    // Ignore logging failures
  }
}
