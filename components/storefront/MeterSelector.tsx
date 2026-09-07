'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

interface MeterSelectorProps {
  meter: number;
  unitPrice: number;
  minMeter?: number;
  stepMeter?: number;
  maxMeter?: number;
  stockMeter?: number | null;
  isTracked?: boolean;
  onChange: (meter: number) => void;
}

export const MeterSelector: React.FC<MeterSelectorProps> = ({
  meter,
  unitPrice,
  minMeter = 1.0,
  stepMeter = 0.5,
  maxMeter = 100.0,
  stockMeter = null,
  isTracked = false,
  onChange,
}) => {
  const isOutOfStock = isTracked && (stockMeter === null || stockMeter === undefined || stockMeter <= 0);
  const effectiveMax = isTracked && stockMeter !== null && stockMeter !== undefined
    ? Math.min(maxMeter, stockMeter)
    : maxMeter;

  const handleDecrease = () => {
    if (isOutOfStock) return;
    const next = Math.max(minMeter, Number((meter - stepMeter).toFixed(2)));
    onChange(next);
  };

  const handleIncrease = () => {
    if (isOutOfStock) return;
    const next = Math.min(effectiveMax, Number((meter + stepMeter).toFixed(2)));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOutOfStock) return;
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const clamped = Math.max(minMeter, Math.min(effectiveMax, val));
      onChange(clamped);
    }
  };

  const totalPrice = Number((meter * unitPrice).toFixed(2));

  return (
    <div className={`border rounded-xl p-4 transition ${
      isOutOfStock ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <span>Kumaş Metrajı Seçimi</span>
          <span className="text-xs font-normal text-slate-500">
            ({stepMeter}m adımlarla)
          </span>
        </label>
        {isOutOfStock ? (
          <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
            Tükendi / Stokta Yok
          </span>
        ) : isTracked && stockMeter !== null ? (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Kalan Stok: {stockMeter} Metre
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Stokta Var
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Quantity Controls */}
        <div className="inline-flex items-center bg-white border border-slate-300 rounded-lg shadow-sm">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={meter <= minMeter}
            className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 hover:bg-slate-100 transition rounded-l-lg"
            aria-label="Metreyi azalt"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="relative px-2">
            <input
              type="number"
              step={stepMeter}
              min={minMeter}
              max={effectiveMax}
              value={meter}
              onChange={handleInputChange}
              className="w-16 text-center font-bold text-slate-900 bg-transparent focus:outline-none text-base"
            />
            <span className="text-xs text-slate-500 font-medium">metre</span>
          </div>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={meter >= effectiveMax}
            className="p-2.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 hover:bg-slate-100 transition rounded-r-lg"
            aria-label="Metreyi artır"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Calculation */}
        <div className="flex-1 flex items-center justify-between sm:justify-end gap-3 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
          <div className="text-xs text-slate-500">
            {meter} m × {formatCurrency(unitPrice)}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Hesaplanan Tutar</div>
            <div className="text-lg font-extrabold text-blue-900">
              {formatCurrency(totalPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick meter selection shortcuts */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
        <span className="text-xs text-slate-500">Hızlı Seçim:</span>
        {[1, 2, 3, 5, 10].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`text-xs px-2.5 py-1 rounded-md font-medium border transition ${
              meter === m
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {m} m
          </button>
        ))}
      </div>
    </div>
  );
};
