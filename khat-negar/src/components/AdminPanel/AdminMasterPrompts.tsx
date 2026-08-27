import React, { useEffect, useState } from 'react';
import {
  Layers,
  Edit,
  CheckCircle2,
  XCircle,
  History,
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  Check,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type { MasterPrompt, MasterPromptVersion } from '../../types.js';

const REQUIRED_VARIABLES = [
  '{{TITLE}}',
  '{{CALLIGRAPHY_STYLE}}',
  '{{TYPOGRAPHY_FORM}}',
  '{{TITLE_COLOR_HEX}}',
  '{{BACKGROUND_STATUS}}',
  '{{BACKGROUND_COLOR_HEX}}',
  '{{MATERIAL}}',
  '{{DIMENSION}}',
  '{{LIGHTING}}',
  '{{SHADOWING}}',
  '{{ASPECT_RATIO}}',
  '{{AI_MODEL}}'
];

export function AdminMasterPrompts() {
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<MasterPrompt | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNameFa, setEditNameFa] = useState('');
  const [editDescFa, setEditDescFa] = useState('');
  const [editTemplate, setEditTemplate] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Version history modal state
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versions, setVersions] = useState<MasterPromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Test render sandbox state
  const [testRenderResult, setTestRenderResult] = useState<string | null>(null);
  const [testRenderLoading, setTestRenderLoading] = useState(false);

  // Feedback messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const { ok, data } = await apiFetch('/api/admin/master-prompts');
      if (ok && data.success) {
        setPrompts(data.prompts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenEdit = (prompt: MasterPrompt) => {
    setSelectedPrompt(prompt);
    setEditNameFa(prompt.name_fa);
    setEditDescFa(prompt.description_fa || '');
    setEditTemplate(prompt.template);
    setEditActive(prompt.active);
    setTestRenderResult(null);
    setErrorMessage(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrompt) return;
    setErrorMessage(null);

    // Validate variables
    const missing = REQUIRED_VARIABLES.filter(v => !editTemplate.includes(v));
    if (missing.length > 0) {
      setErrorMessage(`خطا: متغیرهای ضروری زیر در متن پرامپت وجود ندارند:\n${missing.join(' , ')}`);
      return;
    }

    try {
      const { ok, data } = await apiFetch(`/api/admin/master-prompts/${selectedPrompt.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name_fa: editNameFa,
          description_fa: editDescFa,
          template: editTemplate,
          active: editActive
        })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || 'پرامپت با موفقیت ذخیره شد.');
        setShowEditModal(false);
        fetchPrompts();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'خطا در ویرایش پرامپت.');
      }
    } catch (err) {
      setErrorMessage('خطای ارتباط با سرور.');
    }
  };

  const handleToggleActive = async (prompt: MasterPrompt) => {
    try {
      const { ok, data } = await apiFetch(`/api/admin/master-prompts/${prompt.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !prompt.active })
      });
      if (ok && data.success) {
        fetchPrompts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= prompts.length) return;

    const newPrompts = [...prompts];
    const temp = newPrompts[index];
    newPrompts[index] = newPrompts[targetIndex];
    newPrompts[targetIndex] = temp;

    const orderedIds = newPrompts.map(p => p.id);
    try {
      const { ok, data } = await apiFetch('/api/admin/master-prompts/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedIds })
      });
      if (ok && data.success) {
        setPrompts(data.prompts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenVersions = async (prompt: MasterPrompt) => {
    setSelectedPrompt(prompt);
    setShowVersionsModal(true);
    setVersionsLoading(true);
    try {
      const { ok, data } = await apiFetch(`/api/admin/master-prompts/${prompt.id}/versions`);
      if (ok && data.success) {
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!selectedPrompt) return;
    if (!confirm(`آیا از بازیابی پرامپت مادر به نسخه ${versionNumber} اطمینان دارید؟`)) return;

    try {
      const { ok, data } = await apiFetch(`/api/admin/master-prompts/${selectedPrompt.id}/restore`, {
        method: 'POST',
        body: JSON.stringify({ version: versionNumber })
      });
      if (ok && data.success) {
        setSuccessMessage(data.message || 'نسخه بازیابی گردید.');
        setShowVersionsModal(false);
        fetchPrompts();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      alert('خطا در بازیابی نسخه.');
    }
  };

  const handleTestRender = async () => {
    setTestRenderLoading(true);
    try {
      const { ok, data } = await apiFetch('/api/admin/master-prompts/test-render', {
        method: 'POST',
        body: JSON.stringify({ template: editTemplate })
      });
      if (ok && data.success) {
        setTestRenderResult(data.rendered);
      } else {
        setErrorMessage(data.error || 'خطا در تست رندر.');
      }
    } catch (err) {
      setErrorMessage('خطای سرور در تست رندر.');
    } finally {
      setTestRenderLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    setEditTemplate(prev => prev + `\n${variable}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#F55951]" />
            <span>مدیریت پرامپت‌های مادر (Master Prompts Engine)</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            کنترل پرامپت‌های مادر ۵‌گانه، ویرایش متن، اعتبارسنجی متغیرها و تاریخچه نسخه‌ها
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Master Prompts List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
            در حال بارگذاری پرامپت‌های مادر...
          </div>
        ) : (
          prompts.map((p, idx) => (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border transition-all ${
                p.active
                  ? 'bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border-color)] opacity-60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-[#F55951]/10 text-[#F55951] font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{p.name_fa}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[var(--text-muted)]">
                        نسخه {p.version}
                      </span>
                      {p.active ? (
                        <span className="text-[10px] text-emerald-600 font-bold">فعال در زنجیره</span>
                      ) : (
                        <span className="text-[10px] text-red-500 font-bold">غیرفعال</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{p.description_fa}</p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[#F55951] disabled:opacity-30 cursor-pointer"
                    title="انتقال به بالا (اولویت زودتر)"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === prompts.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[#F55951] disabled:opacity-30 cursor-pointer"
                    title="انتقال به پایین (اولویت بعدی)"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      p.active
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : 'bg-red-500/10 border-red-500/30 text-red-600'
                    }`}
                  >
                    {p.active ? 'فعال' : 'غیرفعال'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenVersions(p)}
                    className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-indigo-500 text-indigo-500 cursor-pointer"
                    title="تاریخچه نسخه‌ها و بازیابی"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>ویرایش الگو</span>
                  </button>
                </div>
              </div>

              {/* Template Snippet Preview */}
              <div className="mt-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-muted)] line-clamp-2 dir-ltr">
                {p.template.slice(0, 180)}...
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================
          MODAL: EDIT MASTER PROMPT & LIVE TEST
      ========================================== */}
      {showEditModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-4xl p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              ویرایش قالب پرامپت مادر: {selectedPrompt.name_fa}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              ویرایش متن پرامپت، متغیرها و تست پیش‌نمایش خروجی هوش مصنوعی
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold whitespace-pre-line flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نام فارسی:</label>
                  <input
                    type="text"
                    value={editNameFa}
                    onChange={e => setEditNameFa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">توضیح کوتاه:</label>
                  <input
                    type="text"
                    value={editDescFa}
                    onChange={e => setEditDescFa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Supported Variables Insertion Toolbar */}
              <div>
                <span className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                  متغیرهای سیستمی مجاز (کلیک جهت درج در انتهای پرامپت):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REQUIRED_VARIABLES.map(v => {
                    const isPresent = editTemplate.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse'
                        }`}
                        title={isPresent ? 'متغیر در متن موجود است' : 'متغیر در متن مفقود است! کلیک برای درج'}
                      >
                        <span>{v}</span>
                        {isPresent ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Editor Box */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  متن اصلی پرامپت انگلیسی (Template Body):
                </label>
                <textarea
                  rows={14}
                  value={editTemplate}
                  onChange={e => setEditTemplate(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-mono leading-relaxed text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden dir-ltr whitespace-pre-wrap"
                  required
                />
              </div>

              {/* Sandbox Test Render Section */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                    <span>محیط تست و رندر آزمایشی پرامپت (Sandbox Preview)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleTestRender}
                    disabled={testRenderLoading}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{testRenderLoading ? 'در حال رندر...' : 'اجرای تست با داده نمونه'}</span>
                  </button>
                </div>

                {testRenderResult && (
                  <div className="mt-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px] leading-relaxed text-[var(--text-primary)] dir-ltr max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {testRenderResult}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F55951] hover:bg-[#E04840] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ذخیره پرامپت مادر و ایجاد نسخه جدید</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: VERSION HISTORY & RESTORE
      ========================================== */}
      {showVersionsModal && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowVersionsModal(false)}
              className="absolute top-5 left-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              تاریخچه نسخه‌های پرامپت: {selectedPrompt.name_fa}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              مشاهده ویرایش‌های قبلی و امکان بازیابی فوری
            </p>

            {versionsLoading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">در حال بارگذاری نسخه‌ها...</div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">نسخه قبلی یافت نشد.</div>
            ) : (
              <div className="space-y-3">
                {versions.map(v => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#F55951]/10 text-[#F55951] font-bold">
                          نسخه {v.version}
                        </span>
                        <span className="text-[var(--text-muted)]">توسط: {v.edited_by}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(v.created_at).toLocaleString('fa-IR')}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)]">{v.description_fa}</p>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] font-mono text-[10px] line-clamp-2 dir-ltr">
                      {v.template.slice(0, 150)}...
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.version)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>بازیابی این نسخه</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
