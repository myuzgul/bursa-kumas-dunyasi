import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { logAuditAction } from '@/lib/services/auditLogger';
import { normalizeCartRule, getPromoStatus } from '@/lib/services/promotions';
import { sanitizeCartRuleInput } from '@/lib/services/promotionAdmin';

export const dynamic = 'force-dynamic';

function withStatus(r: any) {
  const n = normalizeCartRule(r);
  return { ...n, status: getPromoStatus(n), last_used_at: r.last_used_at || null };
}

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  const db = dbRepo.read();
  const rules = (db.cart_discount_rules || []).map(withStatus);
  return NextResponse.json({ rules }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    if (!db.cart_discount_rules) db.cart_discount_rules = [];

    let source = body;
    if (body.action === 'duplicate') {
      const orig = db.cart_discount_rules.find((r: any) => r.id === body.id);
      if (!orig) return NextResponse.json({ message: 'Kampanya bulunamadı.' }, { status: 404 });
      source = { ...normalizeCartRule(orig), title: `${orig.title} (Kopya)`, is_active: 0 };
    }

    const { rule, errors } = sanitizeCartRuleInput(source);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });

    const nowIso = new Date().toISOString();
    rule.id = `cdr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    rule.used_count = 0;
    rule.total_discount_given = 0;
    rule.created_at = nowIso;
    rule.updated_at = nowIso;
    db.cart_discount_rules.unshift(rule);
    dbRepo.write(db);

    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'CART_DISCOUNT_CREATE',
      details: `Sepette indirim kampanyası oluşturuldu: ${rule.title}`,
    });
    return NextResponse.json({ success: true, rule: withStatus(rule) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kampanya kaydedilemedi.' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const idx = (db.cart_discount_rules || []).findIndex((r: any) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ message: 'Kampanya bulunamadı.' }, { status: 404 });

    const existing = db.cart_discount_rules[idx];
    const { rule, errors } = sanitizeCartRuleInput(body, existing);
    if (errors.length) return NextResponse.json({ message: errors.join(' ') }, { status: 400 });
    rule.id = existing.id;
    db.cart_discount_rules[idx] = { ...rule, last_used_at: existing.last_used_at || null };
    dbRepo.write(db);

    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'CART_DISCOUNT_UPDATE',
      details: `Sepette indirim kampanyası güncellendi: ${rule.title}`,
    });
    return NextResponse.json({ success: true, rule: withStatus(db.cart_discount_rules[idx]) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kampanya güncellenemedi.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const rule = (db.cart_discount_rules || []).find((r: any) => r.id === body.id);
    if (!rule) return NextResponse.json({ message: 'Kampanya bulunamadı.' }, { status: 404 });
    if (body.is_active !== undefined) rule.is_active = body.is_active ? 1 : 0;
    rule.updated_at = new Date().toISOString();
    dbRepo.write(db);
    logAuditAction({
      adminEmail: guard.admin?.email || 'admin',
      adminId: guard.admin?.id,
      action: 'CART_DISCOUNT_TOGGLE',
      details: `Sepette indirim "${rule.title}" ${rule.is_active ? 'aktif' : 'pasif'} yapıldı.`,
    });
    return NextResponse.json({ success: true, rule: withStatus(rule) });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'İşlem yapılamadı.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.response) return guard.response;
  const id = new URL(req.url).searchParams.get('id');
  const db = dbRepo.read();
  const rule = (db.cart_discount_rules || []).find((r: any) => r.id === id);
  if (!rule) return NextResponse.json({ message: 'Kampanya bulunamadı.' }, { status: 404 });
  db.cart_discount_rules = db.cart_discount_rules.filter((r: any) => r.id !== id);
  dbRepo.write(db);
  logAuditAction({
    adminEmail: guard.admin?.email || 'admin',
    adminId: guard.admin?.id,
    action: 'CART_DISCOUNT_DELETE',
    details: `Sepette indirim kampanyası silindi: ${rule.title}`,
  });
  return NextResponse.json({ success: true });
}
