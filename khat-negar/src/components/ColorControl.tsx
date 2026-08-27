import React, { useState } from 'react';
import { Pipette, Check, Palette } from 'lucide-react';

interface ColorControlProps {
  id?: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  { hex: '#F55951', name: 'قرمز اکریلیک سامانه' },
  { hex: '#361D32', name: 'ارغوانی تیره سنتی' },
  { hex: '#543C52', name: 'بنفش مایل به دودی' },
  { hex: '#1B263B', name: 'سرمه‌ای لاجوردی' },
  { hex: '#0D1B2A', name: 'مرکب مشکی زاغ' },
  { hex: '#D4AF37', name: 'طلایی متالیک خوشنویسی' },
  { hex: '#2A9D8F', name: 'فیروزه‌ای اصیل ایرانی' },
  { hex: '#E76F51', name: 'شنگرفی پرطراوت' },
  { hex: '#F1E8E6', name: 'کاغذ کرم آهرمهره' },
  { hex: '#FFFFFF', name: 'سفید خالص وکتور' }
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function ColorControl({ id, label, value, onChange, disabled }: ColorControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputHex, setInputHex] = useState(value);

  const rgb = hexToRgb(value || '#F55951');

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setInputHex(val);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
      onChange(val.toUpperCase());
    }
  };

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        // @ts-ignore
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex.toUpperCase());
          setInputHex(result.sRGBHex.toUpperCase());
        }
      } catch (e) {
        // User cancelled eyedropper
      }
    }
  };

  const hasEyedropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <div className="relative" id={id || 'color-control-wrapper'}>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border transition-all text-sm ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
            : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[#F55951] cursor-pointer shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-6 h-6 rounded-lg border border-black/10 shadow-xs shrink-0"
            style={{ backgroundColor: value || '#F55951' }}
          />
          <span className="font-mono text-xs font-semibold tracking-wider dir-ltr text-[var(--text-primary)]">
            {value}
          </span>
        </div>
        <Palette className="w-4 h-4 text-[var(--text-muted)]" />
      </button>

      {/* Picker Popover Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 w-72 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-primary)]">انتخاب رنگ حرفه‌ای</span>
              {hasEyedropper && (
                <button
                  type="button"
                  onClick={handleEyedropper}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#F55951] transition"
                  title="قطره‌چکان استخراج رنگ از صفحه"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>قطره‌چکان</span>
                </button>
              )}
            </div>

            {/* Native Color Wheel Input */}
            <div className="mb-3">
              <input
                type="color"
                value={value.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#F55951'}
                onChange={e => {
                  onChange(e.target.value.toUpperCase());
                  setInputHex(e.target.value.toUpperCase());
                }}
                className="w-full h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0 block"
              />
            </div>

            {/* HEX Input */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[11px] text-[var(--text-muted)] mb-1 block">کد رنگ (HEX):</label>
                <input
                  type="text"
                  value={inputHex}
                  onChange={handleHexChange}
                  maxLength={7}
                  placeholder="#F55951"
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] dir-ltr uppercase focus:border-[#F55951] focus:outline-hidden"
                />
              </div>
              <div className="w-10 h-10 rounded-xl border border-black/10 shadow-xs self-end mb-0.5 shrink-0" style={{ backgroundColor: value }} />
            </div>

            {/* RGB Breakdown */}
            <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-[var(--bg-card)] mb-3 text-center text-[10px] font-mono text-[var(--text-secondary)]">
              <div><span className="text-[var(--text-muted)]">R: </span>{rgb.r}</div>
              <div><span className="text-[var(--text-muted)]">G: </span>{rgb.g}</div>
              <div><span className="text-[var(--text-muted)]">B: </span>{rgb.b}</div>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-2">رنگ‌های استاندارد:</span>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      onChange(c.hex);
                      setInputHex(c.hex);
                    }}
                    className="w-9 h-9 rounded-lg border border-black/10 shadow-2xs relative flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c.hex }}
                  >
                    {value.toUpperCase() === c.hex.toUpperCase() && (
                      <Check className={`w-4 h-4 ${['#FFFFFF', '#F1E8E6', '#D4AF37'].includes(c.hex) ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-1.5 text-xs font-semibold text-white bg-[#F55951] hover:bg-[#E04840] rounded-xl transition cursor-pointer"
            >
              تایید و بستن
            </button>
          </div>
        </>
      )}
    </div>
  );
}
