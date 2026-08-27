import React, { useEffect, useState } from 'react';
import {
  Box,
  Cpu,
  Compass,
  Layers,
  Sun,
  Sliders,
  Ratio,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  Info,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { apiFetch } from '../../utils/api.js';
import type {
  TypographyForm,
  MaterialOption,
  DimensionOption,
  LightingOption,
  ShadowOption,
  AspectRatioOption,
  AiModelOption
} from '../../types.js';

type OptionCategory = 'materials' | 'models' | 'forms' | 'dimensions' | 'lightings' | 'shadows' | 'aspect_ratios';

export function AdminMaterialsModels() {
  const [subTab, setSubTab] = useState<OptionCategory>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data lists
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [forms, setForms] = useState<TypographyForm[]>([]);
  const [dimensions, setDimensions] = useState<DimensionOption[]>([]);
  const [lightings, setLightings] = useState<LightingOption[]>([]);
  const [shadows, setShadows] = useState<ShadowOption[]>([]);
  const [aspectRatios, setAspectRatios] = useState<AspectRatioOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name_fa: string; category: OptionCategory } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [formNameFa, setFormNameFa] = useState('');
  const [formDescFa, setFormDescFa] = useState('');
  const [formEnglishText, setFormEnglishText] = useState('');
  const [formModelKey, setFormModelKey] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [formActive, setFormActive] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [
        resMaterials,
        resModels,
        resForms,
        resDimensions,
        resLightings,
        resShadows,
        resAspectRatios
      ] = await Promise.all([
        apiFetch('/api/admin/materials'),
        apiFetch('/api/admin/ai-models'),
        apiFetch('/api/admin/forms'),
        apiFetch('/api/admin/dimensions'),
        apiFetch('/api/admin/lightings'),
        apiFetch('/api/admin/shadows'),
        apiFetch('/api/admin/aspect-ratios')
      ]);

      if (resMaterials.ok && resMaterials.data.success) setMaterials(resMaterials.data.materials || []);
      if (resModels.ok && resModels.data.success) setModels(resModels.data.aiModels || []);
      if (resForms.ok && resForms.data.success) setForms(resForms.data.forms || []);
      if (resDimensions.ok && resDimensions.data.success) setDimensions(resDimensions.data.dimensions || []);
      if (resLightings.ok && resLightings.data.success) setLightings(resLightings.data.lightings || []);
      if (resShadows.ok && resShadows.data.success) setShadows(resShadows.data.shadows || []);
      if (resAspectRatios.ok && resAspectRatios.data.success) setAspectRatios(resAspectRatios.data.aspectRatios || []);
    } catch (err) {
      console.error('Error fetching admin options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNameFa('');
    setFormDescFa('');
    setFormEnglishText('');
    setFormModelKey('');
    setFormValue('');
    setFormSortOrder(getCurrentListLength() + 1);
    setFormActive(true);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormNameFa(item.name_fa || '');
    setFormDescFa(item.description_fa || '');
    setFormEnglishText(
      item.ai_description_en || item.ai_instruction_en || item.ai_name_en || ''
    );
    setFormModelKey(item.model_key || '');
    setFormValue(item.value || '');
    setFormSortOrder(item.sort_order ?? 1);
    setFormActive(item.active ?? true);
    setShowModal(true);
  };

  const getCurrentListLength = () => {
    switch (subTab) {
      case 'materials': return materials.length;
      case 'models': return models.length;
      case 'forms': return forms.length;
      case 'dimensions': return dimensions.length;
      case 'lightings': return lightings.length;
      case 'shadows': return shadows.length;
      case 'aspect_ratios': return aspectRatios.length;
      default: return 0;
    }
  };

  const getEndpoint = (category: OptionCategory) => {
    switch (category) {
      case 'materials': return '/api/admin/materials';
      case 'models': return '/api/admin/ai-models';
      case 'forms': return '/api/admin/forms';
      case 'dimensions': return '/api/admin/dimensions';
      case 'lightings': return '/api/admin/lightings';
      case 'shadows': return '/api/admin/shadows';
      case 'aspect_ratios': return '/api/admin/aspect-ratios';
    }
  };

  // Quick Toggle Active Status
  const handleToggleActive = async (item: any) => {
    const endpoint = getEndpoint(subTab);
    const updatedActive = !item.active;
    try {
      const { ok, data } = await apiFetch(`${endpoint}/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: updatedActive })
      });
      if (ok && data.success) {
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Item (Create or Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameFa.trim()) {
      alert('لطفاً عنوان فارسی را وارد کنید.');
      return;
    }

    setSubmitting(true);
    const endpoint = getEndpoint(subTab);
    const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
    const method = editingItem ? 'PATCH' : 'POST';

    // Build payload according to category schema
    let payload: any = {
      name_fa: formNameFa.trim(),
      sort_order: Number(formSortOrder) || 1,
      active: formActive
    };

    if (subTab === 'materials' || subTab === 'dimensions' || subTab === 'lightings' || subTab === 'shadows') {
      payload.ai_description_en = formEnglishText.trim();
    } else if (subTab === 'forms') {
      payload.description_fa = formDescFa.trim();
      payload.ai_instruction_en = formEnglishText.trim();
    } else if (subTab === 'models') {
      payload.model_key = formModelKey.trim() || formNameFa.toLowerCase().replace(/\s+/g, '-');
      payload.ai_name_en = formEnglishText.trim();
      payload.description_fa = formDescFa.trim();
    } else if (subTab === 'aspect_ratios') {
      payload.value = formValue.trim() || '1:1';
    }

    try {
      const { ok, data } = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (ok && data.success) {
        setShowModal(false);
        fetchAll();
      } else {
        alert(data.error || 'خطا در ذخیره سازی اطلاعات');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('خطا در ارتباط با سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    const endpoint = getEndpoint(deleteConfirmItem.category);
    try {
      const { ok, data } = await apiFetch(`${endpoint}/${deleteConfirmItem.id}`, {
        method: 'DELETE'
      });
      if (ok && data.success) {
        setDeleteConfirmItem(null);
        fetchAll();
      } else {
        alert(data.error || 'خطا در حذف آیتم');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('خطا در حذف آیتم.');
    }
  };

  // Filter items by search query
  const filterItems = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      const name = (item.name_fa || '').toLowerCase();
      const descFa = (item.description_fa || '').toLowerCase();
      const descEn = (
        item.ai_description_en ||
        item.ai_instruction_en ||
        item.ai_name_en ||
        item.value ||
        ''
      ).toLowerCase();
      const key = (item.model_key || '').toLowerCase();
      return name.includes(q) || descFa.includes(q) || descEn.includes(q) || key.includes(q);
    });
  };

  const getSubTabTitle = () => {
    switch (subTab) {
      case 'materials': return 'متریال‌ها و بافت‌ها';
      case 'models': return 'موتورها و مدل‌های هوش مصنوعی';
      case 'forms': return 'فرم‌ها و ترکیب‌بندی‌ها';
      case 'dimensions': return 'میزان بُعد و برجستگی';
      case 'lightings': return 'نورپردازی و اتمسفر';
      case 'shadows': return 'سایه‌زنی و کنتراست';
      case 'aspect_ratios': return 'نسبت‌های ابعاد تصویر';
    }
  };

  const getSubTabAddLabel = () => {
    switch (subTab) {
      case 'materials': return 'افزودن متریال جدید';
      case 'models': return 'افزودن مدل هوش مصنوعی';
      case 'forms': return 'افزودن فرم ترکیب‌بندی';
      case 'dimensions': return 'افزودن گزینه بعد';
      case 'lightings': return 'افزودن گزینه نورپردازی';
      case 'shadows': return 'افزودن گزینه سایه‌زنی';
      case 'aspect_ratios': return 'افزودن نسبت ابعاد';
    }
  };

  const getEnglishFieldLabel = () => {
    switch (subTab) {
      case 'materials':
        return 'متن و توصیف دقیق انگلیسی متریال (قرارگیری در پرامپت مادر)';
      case 'models':
        return 'دستور و نام انگلیسی مدل هوش مصنوعی در پرامپت';
      case 'forms':
        return 'دستورالعمل انگلیسی ساختار هندسی و ترکیب‌بندی در پرامپت';
      case 'dimensions':
        return 'متن و توصیف انگلیسی میزان برجستگی و بعد در پرامپت';
      case 'lightings':
        return 'متن و توصیف انگلیسی نورپردازی در پرامپت';
      case 'shadows':
        return 'متن و توصیف انگلیسی سایه‌زنی در پرامپت';
      case 'aspect_ratios':
        return 'مقدار نسبت تصویر (مثال: 16:9)';
    }
  };

  const getEnglishFieldPlaceholder = () => {
    switch (subTab) {
      case 'materials':
        return 'e.g. Polished metallic material with luxurious golden reflections and realistic specular highlights...';
      case 'models':
        return 'e.g. Midjourney v6.1 / v7 Calligraphic Mode with exact letter construction parameters...';
      case 'forms':
        return 'e.g. Circular composition silhouette. Construct the circular silhouette through authentic calligraphic letters...';
      case 'dimensions':
        return 'e.g. Full deep sculptural 3D dimensional extrusion with architectural presence...';
      case 'lightings':
        return 'e.g. Dramatic high-contrast chiaroscuro lighting emphasizing form and volume...';
      case 'shadows':
        return 'e.g. Soft diffused contact shadow anchoring the typography cleanly without obscuring letterforms...';
      case 'aspect_ratios':
        return 'e.g. 16:9';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Box className="w-5 h-5 text-[#F55951]" />
            <span>مدیریت گزینه‌ها، متریال‌ها و مدل‌های هوش مصنوعی</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            ویرایش کامل، افزودن، حذف و شخصی‌سازی متون انگلیسی که مستقیماً داخل متغیرهای پرامپت مادر قرار می‌گیرند.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F55951] text-white text-xs font-bold shadow-md shadow-[#F55951]/20 hover:opacity-90 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{getSubTabAddLabel()}</span>
        </button>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
        {[
          { id: 'materials', label: 'متریال و بافت', count: materials.length, icon: <Box className="w-3.5 h-3.5" /> },
          { id: 'models', label: 'مدل‌های هوش مصنوعی', count: models.length, icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'forms', label: 'فرم‌های ترکیب‌بندی', count: forms.length, icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'dimensions', label: 'میزان بُعد و برجستگی', count: dimensions.length, icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'lightings', label: 'نورپردازی', count: lightings.length, icon: <Sun className="w-3.5 h-3.5" /> },
          { id: 'shadows', label: 'سایه‌زنی', count: shadows.length, icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'aspect_ratios', label: 'نسبت ابعاد', count: aspectRatios.length, icon: <Ratio className="w-3.5 h-3.5" /> }
        ].map(item => {
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSubTab(item.id as OptionCategory);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F55951] text-white shadow-xs scale-102'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={`جستجو در بین ${getSubTabTitle()}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Info className="w-3.5 h-3.5 text-[#F55951]" />
          <span>تغییر متن انگلیسی هر آیتم بلافاصله در تمام پرامپت‌های تولیدی اعمال می‌شود.</span>
        </div>
      </div>

      {/* Cards List Display */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)]">در حال بارگذاری گزینه‌ها...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            let currentList: any[] = [];
            switch (subTab) {
              case 'materials': currentList = materials; break;
              case 'models': currentList = models; break;
              case 'forms': currentList = forms; break;
              case 'dimensions': currentList = dimensions; break;
              case 'lightings': currentList = lightings; break;
              case 'shadows': currentList = shadows; break;
              case 'aspect_ratios': currentList = aspectRatios; break;
            }
            const filtered = filterItems(currentList);

            if (filtered.length === 0) {
              return (
                <div className="col-span-full p-12 text-center rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                  هیچ موردی مطابق با جستجوی شما یافت نشد.
                </div>
              );
            }

            return filtered.map((item, idx) => {
              const englishText =
                item.ai_description_en ||
                item.ai_instruction_en ||
                item.ai_name_en ||
                item.value ||
                '';

              return (
                <div
                  key={item.id || idx}
                  className={`p-4.5 rounded-3xl bg-[var(--bg-card)] border transition-all flex flex-col justify-between space-y-3.5 ${
                    item.active
                      ? 'border-[var(--border-color)] hover:border-[#F55951]/40'
                      : 'border-dashed border-[var(--border-color)] opacity-60 bg-[var(--bg-surface)]'
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[var(--text-primary)]">
                          {item.name_fa}
                        </span>
                        {item.sort_order !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] font-mono">
                            #{item.sort_order}
                          </span>
                        )}
                      </div>
                      {item.description_fa && (
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                          {item.description_fa}
                        </p>
                      )}
                      {item.model_key && (
                        <span className="inline-block text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-color)] dir-ltr">
                          key: {item.model_key}
                        </span>
                      )}
                    </div>

                    {/* Quick Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      title={item.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                      className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                        item.active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-zinc-400 hover:bg-zinc-500/10'
                      }`}
                    >
                      {item.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* English Prompt Preview Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)]">
                      <span>متن انگلیسی ارسالی به هوش مصنوعی:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(englishText, item.id)}
                        className="flex items-center gap-1 text-[10px] text-[#F55951] hover:underline cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>کپی متن</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] dir-ltr font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed max-h-28 overflow-y-auto select-all">
                      {englishText || '<بدون متن انگلیسی>'}
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]/60">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {englishText.length} کاراکتر
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-primary)] hover:border-[#F55951] hover:text-[#F55951] transition cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem({ id: item.id, name_fa: item.name_fa, category: subTab })}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="حذف این آیتم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F55951]/10 border border-[#F55951]/20 flex items-center justify-center text-[#F55951]">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">
                    {editingItem ? `ویرایش ${editingItem.name_fa}` : getSubTabAddLabel()}
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {getSubTabTitle()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name FA */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  عنوان فارسی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سنگ مرمر تراش‌خورده / Midjourney v6"
                  value={formNameFa}
                  onChange={e => setFormNameFa(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
                />
              </div>

              {/* Extra Description FA for Forms/Models */}
              {(subTab === 'forms' || subTab === 'models') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    توضیحات راهنمای فارسی (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="توضیح کوتاه درباره نحوه عملکرد این گزینه برای کاربر"
                    value={formDescFa}
                    onChange={e => setFormDescFa(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
                  />
                </div>
              )}

              {/* Model Key (Only for AI Models) */}
              {subTab === 'models' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    کلید فنی مدل (Model Key - انگلیسی)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. midjourney-v6, dall-e-3, flux-1"
                    value={formModelKey}
                    onChange={e => setFormModelKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] dir-ltr focus:outline-none focus:border-[#F55951]"
                  />
                </div>
              )}

              {/* Aspect Ratio Value (Only for Aspect Ratios) */}
              {subTab === 'aspect_ratios' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    مقدار نسبت ابعاد (Value) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1:1 یا 16:9 یا 9:16"
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] dir-ltr focus:outline-none focus:border-[#F55951]"
                  />
                </div>
              ) : (
                /* English Prompt Text Field - The Core Feature Requested */
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>{getEnglishFieldLabel()}</span>
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {formEnglishText.length} کاراکتر
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    required={subTab !== 'aspect_ratios'}
                    placeholder={getEnglishFieldPlaceholder()}
                    value={formEnglishText}
                    onChange={e => setFormEnglishText(e.target.value)}
                    className="w-full p-3 text-xs font-mono rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] dir-ltr focus:outline-none focus:border-[#F55951] leading-relaxed"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    💡 این عبارت دقیقاً بدون دستکاری در تگ مربوطه در پرامپت مادر به زبان انگلیسی درج می‌گردد.
                  </p>
                </div>
              )}

              {/* Sort Order & Active Switch */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    ترتیب نمایش (اولویت عددی)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formSortOrder}
                    onChange={e => setFormSortOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#F55951]"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={e => setFormActive(e.target.checked)}
                      className="rounded text-[#F55951] focus:ring-[#F55951] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      وضعیت: {formActive ? 'فعال و در دسترس' : 'غیرفعال'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#F55951] text-white text-xs font-bold shadow-md shadow-[#F55951]/20 hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'در حال ذخیره...' : editingItem ? 'ذخیره تغییرات' : 'افزودن آیتم جدید'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[var(--text-primary)]">حذف قطعی گزینه</h4>
                <p className="text-xs text-[var(--text-muted)]">این عملیات قابل بازگشت نخواهد بود.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)]">
              آیا از حذف آیتم <strong className="text-[var(--text-primary)]">«{deleteConfirmItem.name_fa}»</strong> اطمینان دارید؟
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition cursor-pointer shadow-md shadow-rose-500/20"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
