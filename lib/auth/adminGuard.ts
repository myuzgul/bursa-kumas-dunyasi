import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from './index';

/**
 * Yönetici oturumu kontrolü. Oturum yoksa 401 yanıtı döner.
 * Kullanım: const guard = await requireAdmin(req); if (guard.response) return guard.response;
 */
export async function requireAdmin(req: Request): Promise<{ admin: any; response: NextResponse | null }> {
  const auth = await getAuthenticatedUser(req).catch(() => null);
  if (!auth || auth.role !== 'admin') {
    return {
      admin: null,
      response: NextResponse.json(
        { message: 'Bu işlem için yönetici girişi gereklidir. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      ),
    };
  }
  return { admin: auth.user, response: null };
}
