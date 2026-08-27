import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Feather,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Sparkles,
  Info,
  Layers,
  Power
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { TypographyStyle } from '../../types.js';

export function AdminStyles() {
  const [styles, setStyles] = useState<TypographyStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'traditional' | 'artistic'>('traditional');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState<TypographyStyle | null>(null);
  const [deleteTargetStyle, setDeleteTargetStyle] = useState<TypographyStyle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [nameFa, setNameFa] = useState('');
  const [descFa, setDescFa] = useState('');
  const [descEn, setDescEn] = useState('');
  const [category, setCategory] = useState<'traditional' | 'artistic'>('traditional');
  const [active, setActive] = useState(true);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiFetch<{ success: boolean; styles?: TypographyStyle[] }>('/api/admin/styles');
      if (ok && data.success) {
        setStyles(data.styles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingStyle(null);
    setNameFa('');
    setDescFa('');
    setDescEn('');
    setCategory(tab);
    setActive(true);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleOpenEdit = (style: TypographyStyle) => {
    setEditingStyle(style);
    setNameFa(style.name_fa);
    setDescFa(style.description_fa);
    setDescEn(style.ai_description_en);
    setCategory(style.category);
    setActive(style.active);
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleToggleActive = async (style: TypographyStyle) => {
    try {
      const updatedActive = !style.active;
      const { ok, data } = await apiFetch(`/api/admin/styles/${style.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: updatedActive })
      });
      if (ok && data.success) {
        triggerSuccessToast(`وضعیت سبک «${style.name_fa}» به ${updatedActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
        fetchStyles();
      } else {
        setErrorMessage(data.error || 'خطا در تغییر وضعیت سبک.');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa.trim() || !descFa.trim() || !descEn.trim()) {
      setErrorMessage('لطفاً تمامی فیلدهای الزامی را تکمیل نمایید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const url = editingStyle ? `/api/admin/styles/${editingStyle.id}` : '/api/admin/styles';
      const method = editingStyle ? 'PATCH' : 'POST';

      const { ok, data } = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name_fa: nameFa.trim(),
          description_fa: descFa.trim(),
          ai_description_en: descEn.trim(),
          category,
          active
        })
      });
      if (ok && data.success) {
        setShowModal(false);
        triggerSuccessToast(data.message || (editingStyle ? 'سبک با موفقیت ویرایش شد.' : 'سبک جدید با موفقیت افزوده شد.'));
        fetchStyles();
      } else {
        setErrorMessage(data.error || 'خطا در ثبت سبک');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetStyle) return;
    setIsDeleting(true);
    setErrorMessage(null);
    const targetId = deleteTargetStyle.id;
    const deletedName = deleteTargetStyle.name_fa;

    try {
      const { ok, data } = await apiFetch(`/api/admin/styles/${targetId}`, {
        method: 'DELETE'
      });
      if (ok && data.success) {
        setStyles(prev => prev.filter(s => s.id !== targetId));
        setDeleteTargetStyle(null);
        triggerSuccessToast(`سبک «${deletedName}» با موفقیت حذف گردید.`);
        fetchStyles();
      } else {
        setErrorMessage(data.error || 'خطا در حذف سبک');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStyles = styles.filter(s => s.category === tab);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-600 dark:text-red-400 hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Feather className="w-5 h-5 text-[#F55951]" />
            <span>مدیریت سبک‌های خوشنویسی و تایپوگرافی</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            کنترل، افزودن، ویرایش، حذف و تنظیم توصیف انگلیسی هوش مصنوعی برای سبک‌های خوشنویسی
          </p>
        </div>

        <button
          type="button"
          id="btn-add-style"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-md shadow-[#F55951]/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن سبک جدید</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] max-w-sm">
        <button
          type="button"
          id="tab-traditional"
          onClick={() => setTab('traditional')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            tab === 'traditional'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          رسمی و سنتی ({styles.filter(s => s.category === 'traditional').length})
        </button>
        <button
          type="button"
          id="tab-artistic"
          onClick={() => setTab('artistic')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            tab === 'artistic'
              ? 'bg-[#F55951] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          فانتزی و هنری ({styles.filter(s => s.category === 'artistic').length})
        </button>
      </div>

      {/* Grid of Styles */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[var(--text-muted)] animate-pulse">
          در حال بارگذاری سبک‌ها...
        </div>
      ) : filteredStyles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
          هیچ سبکی در این دسته‌بندی یافت نشد. می‌توانید با دکمه «افزودن سبک جدید» سبک مورد نظر را اضافه کنید.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStyles.map(s => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={s.id}
              className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between hover:border-[#F55951]/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{s.name_fa}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                      s.active
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                    }`}
                    title="کلیک جهت تغییر وضعیت فعال/غیرفعال"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>{s.active ? 'فعال' : 'غیرفعال'}</span>
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{s.description_fa}</p>

                <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-muted)] line-clamp-3 dir-ltr select-all">
                  {s.ai_description_en}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-mono">{s.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id={`btn-edit-style-${s.id}`}
                    onClick={() => handleOpenEdit(s)}
                    className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500 hover:bg-amber-500/10 text-amber-500 transition cursor-pointer"
                    title="ویرایش مشخصات سبک"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    id={`btn-delete-style-${s.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetStyle(s);
                    }}
                    className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-red-500 hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                    title="حذف این سبک"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <AnimatePresence>
        {deleteTargetStyle && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => !isDeleting && setDeleteTargetStyle(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-center text-[var(--text-primary)] mb-2">
                تأیید حذف سبک خوشنویسی
              </h3>

              <p className="text-xs text-center text-[var(--text-secondary)] leading-relaxed mb-4">
                آیا از حذف سبک خوشنویسی <strong className="text-[var(--text-primary)]">«{deleteTargetStyle.name_fa}»</strong> اطمینان دارید؟
                این عمل غیرقابل بازگشت است.
              </p>

              <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] mb-5">
                <div className="font-bold text-[var(--text-primary)] mb-1">مشخصات سبک:</div>
                <div className="text-[11px]">{deleteTargetStyle.description_fa}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-cancel-delete-style"
                  onClick={() => setDeleteTargetStyle(null)}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-style"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'در حال حذف...' : 'بله، حذف شود'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add/Edit Style */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#F55951]" />
                <span>{editingStyle ? `ویرایش سبک: ${editingStyle.name_fa}` : 'افزودن سبک خوشنویسی جدید'}</span>
              </h3>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نام فارسی:</label>
                    <input
                      type="text"
                      value={nameFa}
                      onChange={e => setNameFa(e.target.value)}
                      placeholder="مثال: ثلث جلی"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">دسته‌بندی:</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as 'traditional' | 'artistic')}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      <option value="traditional">رسمی و سنتی</option>
                      <option value="artistic">فانتزی و هنری</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">توضیح فارسی برای کاربر:</label>
                  <input
                    type="text"
                    value={descFa}
                    onChange={e => setDescFa(e.target.value)}
                    placeholder="توضیح کوتاه درباره ویژگی‌های بصری خط..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    دستور و توصیف تخصصی انگلیسی برای هوش مصنوعی:
                  </label>
                  <textarea
                    rows={4}
                    value={descEn}
                    onChange={e => setDescEn(e.target.value)}
                    placeholder="Authentic Persian calligraphy style specifications..."
                    className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-mono text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden dir-ltr"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="style-active-chk"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="rounded text-[#F55951] focus:ring-[#F55951] cursor-pointer"
                  />
                  <label htmlFor="style-active-chk" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                    فعال بودن سبک در بخش انتخاب کاربر
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold shadow-md shadow-[#F55951]/20 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? <span className="animate-spin text-xs">⏳</span> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSubmitting ? 'در حال ثبت...' : 'ذخیره سبک'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
