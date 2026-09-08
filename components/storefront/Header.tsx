'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, ShoppingBag, User, Phone, MapPin, Truck, 
  Menu, X, ChevronDown, Sparkles, Heart,
  Bell, Package, Ticket, LogOut
} from 'lucide-react';
import { useCart } from './CartContext';
import { useAuth } from './UserContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { formatCurrency } from '@/lib/services/meterEngine';

interface CategoryItem {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: number;
  show_in_menu?: number;
  badge_text?: string;
}

export const Header: React.FC = () => {
  const router = useRouter();
  const { openCart, itemCount, totalMeters } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic categories-driven navigation
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: 'cat-viskon', name: 'Viskon Kumaşlar', slug: 'viskon-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-viskon-duz', name: 'Düz Renk Viskon Kumaşlar', slug: 'duz-renk-viskon-kumaslar', parent_id: 'cat-viskon', is_active: 1, show_in_menu: 1 },
    { id: 'cat-viskon-desenli', name: 'Desenli & Çiçekli Viskon', slug: 'desenli-cicekli-viskon', parent_id: 'cat-viskon', is_active: 1, show_in_menu: 1 },
    { id: 'cat-ayrobin', name: 'Ayrobin Kumaşlar', slug: 'ayrobin-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-ayrobin-yerli', name: 'Yerli Ayrobin Kumaşlar', slug: 'yerli-ayrobin-kumaslar', parent_id: 'cat-ayrobin', is_active: 1, show_in_menu: 1 },
    { id: 'cat-ayrobin-ithal', name: 'İthal Lüks Ayrobin', slug: 'ithal-luks-ayrobin', parent_id: 'cat-ayrobin', is_active: 1, show_in_menu: 1 },
    { id: 'cat-krep', name: 'Krep Kumaşlar', slug: 'krep-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-krep-medine', name: 'Medine İpeği Krep', slug: 'medine-ipegi-krep', parent_id: 'cat-krep', is_active: 1, show_in_menu: 1 },
    { id: 'cat-krep-kumlu', name: 'Kumlu Krep Kumaşlar', slug: 'kumlu-krep-kumaslar', parent_id: 'cat-krep', is_active: 1, show_in_menu: 1 },
    { id: 'cat-oduncu', name: 'Oduncu Kumaşlar', slug: 'oduncu-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-oduncu-ekose', name: 'Ekose Oduncu Kumaşlar', slug: 'ekose-oduncu-kumaslar', parent_id: 'cat-oduncu', is_active: 1, show_in_menu: 1 },
    { id: 'cat-keten', name: 'Keten Kumaşlar', slug: 'keten-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-tensel-modal', name: 'Tensel & Modal', slug: 'tensel-modal-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-muslin', name: 'Müslin Kumaşlar', slug: 'muslin-kumaslar', parent_id: null, is_active: 1, show_in_menu: 1 },
    { id: 'cat-firsat', name: 'Fırsat Ürünleri', slug: 'firsat-urunleri', parent_id: null, is_active: 1, show_in_menu: 1, badge_text: '% İndirim' }
  ]);

  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<string, boolean>>({});
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<{ free_shipping_threshold: number; announcement_text?: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Load dynamic categories & settings directly
  const loadDynamicData = () => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});

    fetch('/api/settings/shipping', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings) {
          setShippingSettings(data.settings);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDynamicData();
    window.addEventListener('focus', loadDynamicData);
    return () => window.removeEventListener('focus', loadDynamicData);
  }, []);

  const toggleMobileMenu = (id: string) => {
    setExpandedMobileMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Close search & user dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live AJAX Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      router.push(`/kategori/tum-kumaslar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Parent categories & child categories grouping
  const parentCategories = categories
    .filter((c) => !c.parent_id && (c.is_active === 1 || c.is_active === undefined) && (c.show_in_menu === 1 || c.show_in_menu === undefined))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const getSubcategories = (parentId: string) => {
    return categories
      .filter((c) => c.parent_id === parentId && (c.is_active === 1 || c.is_active === undefined) && (c.show_in_menu === 1 || c.show_in_menu === undefined))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 lg:border-b-0 shadow-xs w-full max-w-full">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-slate-800 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
            <Truck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>
              {shippingSettings?.free_shipping_threshold === 0
                ? 'Tüm Siparişlerde Ücretsiz Kargo'
                : `${(shippingSettings?.free_shipping_threshold ?? 1000).toLocaleString('tr-TR')} TL Üzeri Ücretsiz Kargo`}
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-400 font-medium">
            <a href="tel:05423939816" className="flex items-center gap-1 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>0 (542) 393 98 16</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <Link href="/siparis-takip" className="hover:text-white transition">
              Sipariş Takip
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo, Search, User, Cart) */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3.5 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 md:gap-8 w-full">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:text-blue-900 focus:outline-none flex-shrink-0 -ml-1"
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo */}
          <div className="flex-shrink min-w-0">
            <BrandLogo variant="dark" size="md" />
          </div>

          {/* Desktop Search Bar with Live Autocomplete */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Kumaş Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-xl pl-4 pr-10 py-2.5 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-900 transition"
                aria-label="Ara"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* AJAX Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold px-3">
                  <span>Önerilen Kumaşlar ({searchResults.length})</span>
                  <span className="text-blue-900">Enter&apos;a basarak tümünü görün</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/urun/${product.slug}`}
                      onClick={() => setShowSearchResults(false)}
                      className="p-3 hover:bg-slate-50 flex items-center gap-3 transition"
                    >
                      <img
                        src={product.main_image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {product.category_name} • SKU: {product.sku}
                        </div>
                        <div className="text-xs font-black text-blue-950 mt-0.5">
                          {formatCurrency(product.discount_price || product.base_price)} / m
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Header Action Buttons (Account & Cart) */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 ml-auto">
            {isAuthenticated && user ? (
              <div ref={userRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 text-slate-700 hover:text-blue-900 text-xs font-semibold p-1 sm:py-1.5 sm:px-2.5 rounded-lg sm:rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-xs flex-shrink-0">
                    {user.first_name?.[0] || 'M'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-slate-400">Merhaba,</span>
                    <span className="font-bold text-slate-900 max-w-[100px] truncate">{user.first_name}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-xs divide-y divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50/70">
                      <p className="font-black text-slate-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/hesabim"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Hesap Özeti</span>
                      </Link>

                      <Link
                        href="/hesabim/siparisler"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Siparişlerim</span>
                      </Link>

                      <Link
                        href="/hesabim/favoriler"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>Favorilerim</span>
                        </div>
                        {user.favorites_count > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full">
                            {user.favorites_count}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/hesabim/kuponlar"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <Ticket className="w-4 h-4 text-slate-400" />
                        <span>Kuponlarım</span>
                      </Link>

                      <Link
                        href="/hesabim/adresler"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Adreslerim</span>
                      </Link>

                      <Link
                        href="/hesabim/bildirimler"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-900 font-semibold"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Bildirimler</span>
                        </div>
                        {user.unread_notifications_count > 0 && (
                          <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full">
                            {user.unread_notifications_count}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-bold text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/giris"
                className="flex items-center gap-1.5 sm:gap-2 text-slate-700 hover:text-blue-900 text-xs font-semibold p-1.5 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-[10px] text-slate-400">Hesabım</span>
                  <span>Giriş Yap</span>
                </div>
              </Link>
            )}

            {/* Cart Drawer Trigger */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 sm:gap-2.5 bg-blue-900 hover:bg-blue-800 text-white p-2 sm:py-2 sm:px-4 rounded-lg sm:rounded-xl shadow-sm transition flex-shrink-0"
              aria-label="Sepetim"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-black text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] text-blue-200 font-medium">Sepetim</span>
                <span className="text-xs font-bold">{totalMeters > 0 ? `${totalMeters} m Kumaş` : '0,00 TL'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="mt-2 sm:mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Kumaş Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-3 pr-9 py-2 outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
              aria-label="Ara"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. DYNAMIC CATEGORIES NAVBAR (Mega Navigation like Yazar Perde) */}
      <nav className="bg-slate-900 text-white hidden lg:block border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center flex-wrap">
            {/* All Fabrics Link */}
            <Link
              href="/kategori/tum-kumaslar"
              className="py-3.5 px-4 hover:bg-slate-800 text-slate-200 hover:text-white transition flex items-center gap-1.5 border-r border-slate-800/80"
            >
              <span>Tüm Kumaşlar</span>
            </Link>

            {/* Dynamic Parent Categories */}
            {parentCategories.map((parent) => {
              const subcategories = getSubcategories(parent.id);
              const hasSubs = subcategories.length > 0;
              const isFirsat = parent.slug === 'firsat-urunleri' || parent.badge_text;

              return (
                <div key={parent.id} className="relative group">
                  <Link
                    href={`/kategori/${parent.slug}`}
                    className={`py-3.5 px-4 hover:bg-slate-800 transition flex items-center gap-1.5 ${
                      isFirsat
                        ? 'text-amber-400 hover:text-amber-300 font-bold'
                        : 'text-slate-200 hover:text-blue-300'
                    }`}
                  >
                    {isFirsat && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{parent.name}</span>

                    {parent.badge_text && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                        {parent.badge_text}
                      </span>
                    )}

                    {hasSubs && (
                      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
                    )}
                  </Link>

                  {/* Dropdown Mega Menu */}
                  {hasSubs && (
                    <div className="absolute left-0 top-full hidden group-hover:block z-50 min-w-[260px] bg-white text-slate-900 rounded-b-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
                      {/* Top "Tüm [Kategori]" link */}
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <Link
                          href={`/kategori/${parent.slug}`}
                          className="text-xs font-black text-blue-900 hover:underline flex items-center justify-between"
                        >
                          <span>Tüm {parent.name}</span>
                          <span className="text-blue-600 text-[11px] font-bold">Tümünü Gör →</span>
                        </Link>
                      </div>

                      {/* Sub-categories list */}
                      <div className="py-1.5 divide-y divide-slate-50">
                        {subcategories.map((child) => (
                          <Link
                            key={child.id}
                            href={`/kategori/${child.slug}`}
                            className="px-4 py-2 hover:bg-blue-50/70 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 hover:text-blue-950 transition"
                          >
                            <span>{child.name}</span>
                            {child.badge_text && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {child.badge_text}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 4. MOBILE NAVIGATION DRAWER (ACCORDION) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[110px] bg-slate-900/80 backdrop-blur-sm z-50">
          <div className="bg-white w-4/5 max-w-sm h-full p-4 overflow-y-auto space-y-4">
            <div className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center justify-between">
              <span>Kumaş Kategorileri</span>
              <span className="text-xs text-blue-900 font-semibold">{parentCategories.length} Çeşit</span>
            </div>

            <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
              <Link
                href="/kategori/tum-kumaslar"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-blue-900 font-bold hover:bg-slate-50 rounded-lg block border-b border-slate-100"
              >
                Tüm Kumaşlar →
              </Link>

              {parentCategories.map((parent) => {
                const subcategories = getSubcategories(parent.id);
                const hasSubs = subcategories.length > 0;
                const isExpanded = expandedMobileMenus[parent.id];
                const isFirsat = parent.slug === 'firsat-urunleri' || parent.badge_text;

                return (
                  <div key={parent.id} className="border-b border-slate-100 last:border-0 pb-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/kategori/${parent.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`p-2 flex items-center gap-2 flex-1 ${
                          isFirsat ? 'text-amber-600 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {isFirsat && <Sparkles className="w-4 h-4 text-amber-500" />}
                        <span>{parent.name}</span>
                        {parent.badge_text && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                            {parent.badge_text}
                          </span>
                        )}
                      </Link>

                      {hasSubs && (
                        <button
                          type="button"
                          onClick={() => toggleMobileMenu(parent.id)}
                          className="p-2 text-slate-500 hover:text-slate-900"
                          aria-label="Alt Kategoriler"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-items in Mobile Drawer */}
                    {hasSubs && isExpanded && (
                      <div className="pl-4 py-1 space-y-1 bg-slate-50 rounded-xl mb-1">
                        <Link
                          href={`/kategori/${parent.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-1.5 text-xs font-bold text-blue-900 block"
                        >
                          Tüm {parent.name} →
                        </Link>
                        {subcategories.map((child) => (
                          <Link
                            key={child.id}
                            href={`/kategori/${child.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center justify-between"
                          >
                            <span>{child.name}</span>
                            {child.badge_text && (
                              <span className="text-[9px] font-bold px-1 rounded bg-slate-200 text-slate-700">
                                {child.badge_text}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-3 space-y-2 border-t border-slate-100">
                <Link
                  href="/siparis-takip"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-emerald-700 block font-bold"
                >
                  📦 Sipariş & Kargo Takip
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};



