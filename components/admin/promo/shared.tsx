'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Check, Layers, Package, Users, Calendar } from 'lucide-react';

// ---------------------------------------------------------------------------
// Tipler & yardımcılar
// ---------------------------------------------------------------------------

export interface CatalogCategory {
  id: string;
  name: string;
  parent_id: string | null;
  is_active?: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  base_price: number;
  is_active: number;
}

export interface TargetingValue {
  applies_to: 'all' | 'categories' | 'products';
  category_ids: string[];
  product_ids: string[];
  exclude_product_ids: string[];
  exclude_sale_items: number;
}

export interface CustomerValue {
  customer_scope: 'all' | 'members' | 'first_order' | 'specific';
  allowed_emails: string;
}

/** ISO → "YYYY-MM-DDTHH:mm" (tarayıcı yerel saati, datetime-local girişi için) */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local değeri → ISO (yerel saat diliminden) */
export function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function useAdminCatalog() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/promotions/catalog', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          // Ana kategorilerin altına alt kategorileri sırala
          const cats: CatalogCategory[] = d.categories || [];
          const parents = cats.filter((c) => !c.parent_id);
          const ordered: CatalogCategory[] = [];
          for (const p of parents) {
            ordered.push(p);
            ordered.push(...cats.filter((c) => c.parent_id === p.id));
          }
          const rest = cats.filter((c) => !ordered.includes(c));
          setCategories([...ordered, ...rest]);
          setProducts(d.products || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { categories, products, loaded };
}

// ---------------------------------------------------------------------------
// Durum rozeti
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Yayında', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  scheduled: { label: 'Planlandı', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Süresi Doldu', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  exhausted: { label: 'Limit Doldu', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  inactive: { label: 'Pasif', cls: 'bg-red-50 text-red-600 border-red-200' },
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.inactive;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Form parçaları
// ---------------------------------------------------------------------------

export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label className="block text-xs font-bold text-slate-800 mb-1">
    {children}
    {hint && <span className="block text-[10px] font-normal text-slate-500 mt-0.5">{hint}</span>}
  </label>
);

export const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800';

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({
  checked,
  onChange,
  label,
  hint,
}) => (
  <label className="flex items-start gap-2.5 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 relative w-9 h-5 rounded-full transition flex-shrink-0 ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
    <span className="text-xs">
      <span className="font-bold text-slate-800">{label}</span>
      {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
    </span>
  </label>
);

export const DateRangeFields: React.FC<{
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}> = ({ start, end, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
      <Calendar className="w-3.5 h-3.5 text-blue-900" />
      Geçerlilik Tarihleri
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <FieldLabel hint="Boş bırakılırsa hemen başlar">Başlangıç</FieldLabel>
        <input type="datetime-local" value={start} onChange={(e) => onChange(e.target.value, end)} className={inputCls} />
      </div>
      <div>
        <FieldLabel hint="Boş bırakılırsa süresiz devam eder">Bitiş</FieldLabel>
        <input type="datetime-local" value={end} onChange={(e) => onChange(start, e.target.value)} className={inputCls} />
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {[
        { label: 'Bugün sonuna kadar', days: 0 },
        { label: '3 gün', days: 3 },
        { label: '1 hafta', days: 7 },
        { label: '1 ay', days: 30 },
      ].map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => {
            const s = new Date();
            const e = new Date();
            if (p.days === 0) {
              e.setHours(23, 59, 0, 0);
            } else {
              e.setDate(e.getDate() + p.days);
              e.setHours(23, 59, 0, 0);
            }
            onChange(isoToLocalInput(s.toISOString()), isoToLocalInput(e.toISOString()));
          }}
          className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange('', '')}
        className="px-2 py-1 text-[10px] font-semibold rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-500"
      >
        Tarihleri temizle
      </button>
    </div>
  </div>
);

function ChipMultiSelect<T extends { id: string; name: string }>(props: {
  items: T[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  renderMeta?: (item: T) => React.ReactNode;
  indent?: (item: T) => boolean;
  emptyText: string;
}) {
  const { items, selected, onChange, placeholder, renderMeta, indent, emptyText } = props;
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('tr-TR');
    const list = s
      ? items.filter((i) => i.name.toLocaleLowerCase('tr-TR').includes(s) || ((i as any).sku || '').toLowerCase().includes(s))
      : items;
    return list.slice(0, 200);
  }, [items, q]);
  const selectedItems = selected.map((id) => items.find((i) => i.id === id)).filter(Boolean) as T[];

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          {selectedItems.map((it) => (
            <span
              key={it.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-800"
            >
              {it.name}
              <button type="button" onClick={() => toggle(it.id)} className="text-slate-400 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div className="relative border-b border-slate-100 p-2 bg-slate-50/50">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        </div>
        <div className="max-h-52 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">{emptyText}</div>
          ) : (
            filtered.map((it) => {
              const isSel = selected.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition ${
                    indent && indent(it) ? 'pl-6' : ''
                  } ${isSel ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSel && <Check className="w-3 h-3" />}
                    </span>
                    <span className="truncate">{indent && indent(it) ? `↳ ${it.name}` : it.name}</span>
                  </span>
                  {renderMeta && <span className="flex-shrink-0">{renderMeta(it)}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export const TargetingFields: React.FC<{
  value: TargetingValue;
  onChange: (v: TargetingValue) => void;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}> = ({ value, onChange, categories, products }) => {
  const set = (patch: Partial<TargetingValue>) => onChange({ ...value, ...patch });
  const tabs: { key: TargetingValue['applies_to']; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tüm Ürünler', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'categories', label: 'Seçili Kategoriler', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'products', label: 'Seçili Ürünler', icon: <Package className="w-3.5 h-3.5" /> },
  ];
  const productMeta = (p: CatalogProduct) => (
    <span className="text-[10px] text-slate-400 font-mono">
      {p.sku} {p.is_active !== 1 && <span className="text-red-500 font-sans">(pasif)</span>}
    </span>
  );

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>İndirim Hangi Ürünlerde Geçerli?</FieldLabel>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => set({ applies_to: t.key })}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition ${
                value.applies_to === t.key ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {value.applies_to === 'categories' && (
        <div>
          <FieldLabel hint="Ana kategori seçildiğinde alt kategorilerindeki ürünler de dahil olur.">Kategoriler</FieldLabel>
          <ChipMultiSelect
            items={categories}
            selected={value.category_ids}
            onChange={(ids) => set({ category_ids: ids })}
            placeholder="Kategori ara..."
            indent={(c) => !!c.parent_id}
            emptyText="Kategori bulunamadı."
          />
        </div>
      )}

      {value.applies_to === 'products' && (
        <div>
          <FieldLabel>Ürünler</FieldLabel>
          <ChipMultiSelect
            items={products}
            selected={value.product_ids}
            onChange={(ids) => set({ product_ids: ids })}
            placeholder="Ürün adı veya stok kodu ara..."
            renderMeta={productMeta}
            emptyText="Ürün bulunamadı."
          />
        </div>
      )}

      {value.applies_to !== 'products' && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] font-bold text-slate-600 hover:text-slate-900">
            Hariç tutulacak ürünler ({value.exclude_product_ids.length})
          </summary>
          <div className="pt-2">
            <ChipMultiSelect
              items={products}
              selected={value.exclude_product_ids}
              onChange={(ids) => set({ exclude_product_ids: ids })}
              placeholder="Hariç tutulacak ürünü ara..."
              renderMeta={productMeta}
              emptyText="Ürün bulunamadı."
            />
          </div>
        </details>
      )}

      <Toggle
        checked={!!value.exclude_sale_items}
        onChange={(v) => set({ exclude_sale_items: v ? 1 : 0 })}
        label="Zaten indirimde olan ürünleri hariç tut"
        hint="Üzeri çizili fiyatla satılan ürünlere ikinci kez indirim uygulanmaz."
      />
    </div>
  );
};

export const CustomerFields: React.FC<{ value: CustomerValue; onChange: (v: CustomerValue) => void; noun: string }> = ({
  value,
  onChange,
  noun,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
      <Users className="w-3.5 h-3.5 text-blue-900" />
      Kimler Kullanabilir?
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {[
        { key: 'all', label: 'Herkes' },
        { key: 'members', label: 'Sadece Üyeler' },
        { key: 'first_order', label: 'İlk Siparişte' },
        { key: 'specific', label: 'Belirli Müşteriler' },
      ].map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange({ ...value, customer_scope: o.key as CustomerValue['customer_scope'] })}
          className={`py-2 rounded-lg text-[11px] font-bold border transition ${
            value.customer_scope === o.key
              ? 'bg-blue-900 text-white border-blue-900'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
    {value.customer_scope === 'first_order' && (
      <p className="text-[10px] text-slate-500">
        Bu {noun}, e-posta veya telefon numarasıyla daha önce sipariş vermemiş müşterilere uygulanır.
      </p>
    )}
    {value.customer_scope === 'members' && (
      <p className="text-[10px] text-slate-500">Müşteri giriş yapmış olmalıdır.</p>
    )}
    {value.customer_scope === 'specific' && (
      <div>
        <FieldLabel hint="Her satıra bir e-posta veya virgülle ayırarak yazın.">Müşteri E-posta Adresleri</FieldLabel>
        <textarea
          rows={3}
          value={value.allowed_emails}
          onChange={(e) => onChange({ ...value, allowed_emails: e.target.value })}
          placeholder={'ornek@mail.com\nmusteri2@mail.com'}
          className={`${inputCls} font-mono`}
        />
      </div>
    )}
  </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({
  title,
  children,
  icon,
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
    <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
      {icon}
      {title}
    </div>
    {children}
  </div>
);
