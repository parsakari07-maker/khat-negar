import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Type,
  Layers,
  Sun,
  Box,
  Ratio,
  Cpu,
  Feather,
  Info,
  Circle,
  Square,
  RectangleHorizontal,
  Compass,
  CheckCircle2,
  Flame,
  Palette,
  Crown,
  AlertTriangle,
  Zap,
  ExternalLink
} from 'lucide-react';
import { ColorControl } from './ColorControl.js';
import { GenerationAnimation } from './GenerationAnimation.js';
import { PromptResultCard } from './PromptResultCard.js';
import { AspectRatioIcon } from './AspectRatioIcon.js';
import { apiFetch } from '../utils/api.js';
import { useSettings } from '../context/SettingsContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  INITIAL_TYPOGRAPHY_STYLES,
  INITIAL_TYPOGRAPHY_FORMS,
  INITIAL_MATERIALS,
  INITIAL_DIMENSIONS,
  INITIAL_LIGHTINGS,
  INITIAL_SHADOWS,
  INITIAL_ASPECT_RATIOS,
  INITIAL_AI_MODELS
} from '../constants/initialData.js';
import type {
  TypographyStyle,
  TypographyForm,
  MaterialOption,
  DimensionOption,
  LightingOption,
  ShadowOption,
  AspectRatioOption,
  AiModelOption,
  TypographyUserConfig,
  GeneratePromptResponse
} from '../types.js';

interface GeneratorViewProps {
  onOpenLogin: () => void;
  isLoggedIn: boolean;
}

export function GeneratorView({ onOpenLogin, isLoggedIn }: GeneratorViewProps) {
  const { settings } = useSettings();

  // Generator Dynamic Texts
  const generatorBadge = settings.generator_badge_fa || 'مهندسی هوشمند پرامپت‌های خوشنویسی و تایپوگرافی اصیل';
  const generatorTitle = settings.generator_title_fa || 'مولد تخصصی پرامپت تایپوگرافی';
  const generatorSubtitle = settings.generator_subtitle_fa || 'مشخصات هنری مدنظر خود را مشخص کنید؛ سامانه دقیق‌ترین پرامپت انگلیسی را با حفظ ۱۰۰٪ املای کلمات تولید می‌کند.';
  const generatorSampleBtn = settings.generator_sample_btn_fa || 'بارگذاری نمونه آزمایشی (ایران من)';
  const generatorSubmitBtn = settings.generator_submit_btn_fa || 'تولید پرامپت تخصصی تایپوگرافی';
  const generatorSubmitLoading = settings.generator_submit_loading_fa || 'در حال پردازش و نگارش پرامپت...';

  // Subscription, Daily Limit & Eitaa Integration Dynamic Texts
  const badgeUnlimitedText = settings.daily_limit_badge_unlimited_fa || 'وضعیت حساب: اشتراک نامحدود فعال ✨';
  const badgeFreeTemplate = settings.daily_limit_badge_free_fa || 'سهمیه رایگان امروز: {remaining} از {limit} پرامپت اصلی باقی‌مانده';
  const freeSubtext = settings.daily_limit_free_subtext_fa || 'امکان «تولید دوباره» پرامپت‌های قبلی کاملاً نامحدود و رایگان است ✨';
  const limitExceededTitle = settings.daily_limit_exceeded_title_fa || 'سقف ۱ پرامپت رایگان امروز شما استفاده شده است';
  const limitExceededDesc = settings.daily_limit_exceeded_desc_fa || '💡 نکته مهم: امکان «تولید دوباره» برای پرامپت‌های قبلی شما همچنان کاملاً نامحدود و رایگان است!';
  const upgradePromptText = settings.daily_limit_upgrade_prompt_fa || 'برای ارتقا به اشتراک نامحدود و حذف سقف روزانه، به کانال ایتا مراجعه فرمایید:';
  const eitaaBtnText = settings.daily_limit_eitaa_btn_text_fa || 'کانال ایتا خط‌نگار';
  const eitaaUrl = settings.eitaa_channel_url || 'https://eitaa.com/khatnegarTypographicCraft';

  const formatFreeBadge = (remaining: number, limit: number) => {
    return badgeFreeTemplate
      .replace('{remaining}', remaining.toString())
      .replace('{limit}', limit.toString());
  };

  // Options loaded from server with robust initial defaults
  const [styles, setStyles] = useState<TypographyStyle[]>(INITIAL_TYPOGRAPHY_STYLES);
  const [forms, setForms] = useState<TypographyForm[]>(INITIAL_TYPOGRAPHY_FORMS);
  const [materials, setMaterials] = useState<MaterialOption[]>(INITIAL_MATERIALS);
  const [dimensions, setDimensions] = useState<DimensionOption[]>(INITIAL_DIMENSIONS);
  const [lightings, setLightings] = useState<LightingOption[]>(INITIAL_LIGHTINGS);
  const [shadows, setShadows] = useState<ShadowOption[]>(INITIAL_SHADOWS);
  const [aspectRatios, setAspectRatios] = useState<AspectRatioOption[]>(INITIAL_ASPECT_RATIOS);
  const [aiModels, setAiModels] = useState<AiModelOption[]>(INITIAL_AI_MODELS);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Active Style Category tab
  const [styleTab, setStyleTab] = useState<'traditional' | 'artistic'>('traditional');

  // Professional settings collapsible state
  const [showProSettings, setShowProSettings] = useState(false);

  // User form configuration
  const [config, setConfig] = useState<TypographyUserConfig>({
    title: '',
    calligraphyStyleId: 'style-thuluth',
    typographyFormId: 'form-circle',
    titleColorHex: '#F55951',
    backgroundStatus: 'has_background',
    backgroundColorHex: '#F1E8E6',
    materialId: 'mat-none',
    dimensionId: 'dim-none',
    lightingId: 'light-none',
    shadowingId: 'shadow-none',
    aspectRatioId: 'ar-1-1',
    aiModelId: 'model-generic'
  });

  // Generation execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAgain, setIsGeneratingAgain] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationIsAgain, setAnimationIsAgain] = useState(false);
  const [generationResult, setGenerationResult] = useState<GeneratePromptResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load server options
  useEffect(() => {
    async function loadOptions() {
      try {
        const { ok, data } = await apiFetch<{
          success: boolean;
          styles?: TypographyStyle[];
          forms?: TypographyForm[];
          materials?: MaterialOption[];
          dimensions?: DimensionOption[];
          lightings?: LightingOption[];
          shadows?: ShadowOption[];
          aspectRatios?: AspectRatioOption[];
          aiModels?: AiModelOption[];
          settings?: any;
        }>('/api/typography/options');

        if (ok && data.success) {
          if (Array.isArray(data.styles) && data.styles.length > 0) {
            setStyles(data.styles);
          }
          if (Array.isArray(data.forms) && data.forms.length > 0) {
            setForms(data.forms);
          }
          if (Array.isArray(data.materials) && data.materials.length > 0) {
            setMaterials(data.materials);
          }
          if (Array.isArray(data.dimensions) && data.dimensions.length > 0) {
            setDimensions(data.dimensions);
          }
          if (Array.isArray(data.lightings) && data.lightings.length > 0) {
            setLightings(data.lightings);
          }
          if (Array.isArray(data.shadows) && data.shadows.length > 0) {
            setShadows(data.shadows);
          }
          if (Array.isArray(data.aspectRatios) && data.aspectRatios.length > 0) {
            setAspectRatios(data.aspectRatios);
          }
          if (Array.isArray(data.aiModels) && data.aiModels.length > 0) {
            setAiModels(data.aiModels);
          }

          if (data.settings) {
            setConfig(prev => ({
              ...prev,
              calligraphyStyleId: prev.calligraphyStyleId || data.settings.default_style_id,
              typographyFormId: prev.typographyFormId || data.settings.default_form_id,
              materialId: prev.materialId || data.settings.default_material_id,
              dimensionId: prev.dimensionId || data.settings.default_dimension_id,
              lightingId: prev.lightingId || data.settings.default_lighting_id,
              shadowingId: prev.shadowingId || data.settings.default_shadow_id,
              aspectRatioId: prev.aspectRatioId || data.settings.default_aspect_ratio_id,
              aiModelId: prev.aiModelId || data.settings.default_ai_model_id
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load options', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const { user, refreshUser } = useAuth();
  const isQuotaDepleted = !!user && !user.is_unlimited && user.daily_primary_remaining === 0;

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }

    if (!config.title.trim()) {
      setErrorMessage('لطفاً متن یا عبارت خوشنویسی خود را وارد نمایید.');
      return;
    }

    // Client-side quick check for daily limit
    if (user && !user.is_unlimited && user.daily_primary_remaining === 0) {
      setErrorMessage(limitExceededTitle);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setAnimationIsAgain(false);
    setShowAnimation(true);

    try {
      const { ok, data } = await apiFetch<GeneratePromptResponse>('/api/prompts/generate', {
        method: 'POST',
        body: JSON.stringify(config)
      });

      if (!ok || !data.success) {
        setErrorMessage(data.error || 'خطا در تولید پرامپت.');
        setShowAnimation(false);
        setIsGenerating(false);
        if ((data as any)?.code === 'DAILY_LIMIT_REACHED') {
          await refreshUser();
        }
        return;
      }

      setGenerationResult(data);
      // Synchronize latest credit and usage count
      await refreshUser();
    } catch (err: any) {
      setErrorMessage('خطای ارتباط با سرور.');
      setShowAnimation(false);
      setIsGenerating(false);
    }
  };

  const handleGenerateAgain = async () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }

    setErrorMessage(null);
    setIsGeneratingAgain(true);
    setAnimationIsAgain(true);
    setShowAnimation(true);

    try {
      const { ok, data } = await apiFetch<GeneratePromptResponse>('/api/prompts/generate-again', {
        method: 'POST',
        body: JSON.stringify({
          config,
          currentMasterPromptIndex: generationResult ? generationResult.masterPromptIndex : 0
        })
      });

      if (!ok || !data.success) {
        setErrorMessage(data.error || 'خطا در تولید مجدد پرامپت.');
        setShowAnimation(false);
        setIsGeneratingAgain(false);
        return;
      }

      setGenerationResult(data);
    } catch (err: any) {
      setErrorMessage('خطای ارتباط با سرور.');
      setShowAnimation(false);
      setIsGeneratingAgain(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setIsGenerating(false);
    setIsGeneratingAgain(false);
  };

  // Quick Preset Sample Case
  const applyStandardTestCase = () => {
    setConfig({
      title: 'ایران من',
      calligraphyStyleId: 'style-thuluth',
      typographyFormId: 'form-circle',
      titleColorHex: '#F55951',
      backgroundStatus: 'has_background',
      backgroundColorHex: '#F1E8E6',
      materialId: 'mat-none',
      dimensionId: 'dim-none',
      lightingId: 'light-none',
      shadowingId: 'shadow-none',
      aspectRatioId: 'ar-1-1',
      aiModelId: 'model-generic'
    });
    setErrorMessage(null);
  };

  const filteredStyles = styles.filter(s => s.category === styleTab);

  const getFormIcon = (formId: string) => {
    switch (formId) {
      case 'form-circle':
        return <Circle className="w-5 h-5 text-[#F55951]" />;
      case 'form-square':
        return <Square className="w-5 h-5 text-[#F55951]" />;
      case 'form-rectangle':
        return <RectangleHorizontal className="w-5 h-5 text-[#F55951]" />;
      case 'form-geometric-simple':
        return <Compass className="w-5 h-5 text-[#F55951]" />;
      default:
        return <Feather className="w-5 h-5 text-[#F55951]" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-10 relative">
      {/* Background Animated Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            opacity: [0.08, 0.16, 0.08]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#F55951] rounded-full blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 40, 0],
            y: [0, 40, -20, 0],
            opacity: [0.06, 0.14, 0.06]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/5 w-[450px] h-[450px] bg-[#543C52] rounded-full blur-[150px]"
        />
      </div>

      {/* Header Banner Section */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        {generatorBadge && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F55951]/10 border border-[#F55951]/20 text-[#F55951] text-xs font-bold mb-3 shadow-xs"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{generatorBadge}</span>
          </motion.div>
        )}
        <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {generatorTitle}
        </h1>
        {generatorSubtitle && (
          <p className="mt-2 text-sm md:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {generatorSubtitle}
          </p>
        )}

        {/* Quick Sample Button */}
        {generatorSampleBtn && (
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={applyStandardTestCase}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#F55951] hover:border-[#F55951] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="تکمیل خودکار با نمونه پیش‌فرض (ایران من - ثلث - دایره)"
            >
              <Flame className="w-3.5 h-3.5 text-[#F55951]" />
              <span>{generatorSampleBtn}</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Main Generator Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-xl p-5 md:p-8 space-y-8 backdrop-blur-sm"
      >
        {/* =========================================
            SECTION 1: EXACT TEXT (TITLE)
        ========================================== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="typography-title-input" className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Type className="w-4 h-4 text-[#F55951]" />
              <span>عنوان و متن دقیق تایپوگرافی</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">عیناً و بدون تغییر در پرامپت قرار می‌گیرد</span>
          </div>

          <div className="relative group">
            <input
              id="typography-title-input"
              type="text"
              value={config.title}
              onChange={e => setConfig({ ...config, title: e.target.value })}
              placeholder="متن یا عبارت خوشنویسی خود را بنویسید (مثال: ایران من، عشق، مولانا، یا علی)..."
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold text-sm sm:text-base focus:border-[#F55951] focus:outline-hidden transition shadow-2xs group-hover:border-[#F55951]/40"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 text-[#F55951] shrink-0" />
            <span>متن واردشده به هیچ عنوان بازنویسی، ترجمه یا اصلاح املایی نمی‌شود.</span>
          </p>
        </div>

        {/* =========================================
            SECTION 2: CALLIGRAPHY STYLE SELECTOR
        ========================================== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#F55951]" />
              <span>سبک خط و خوشنویسی</span>
              <span className="text-red-500">*</span>
            </label>

            {/* Category Tabs: Traditional vs Artistic with Animated Active Indicator */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] relative">
              <button
                type="button"
                onClick={() => setStyleTab('traditional')}
                className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  styleTab === 'traditional'
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {styleTab === 'traditional' && (
                  <motion.div
                    layoutId="active-style-tab-indicator"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    className="absolute inset-0 bg-[#F55951] rounded-lg shadow-xs z-[-1]"
                  />
                )}
                رسمی و سنتی (۹ سبک)
              </button>
              <button
                type="button"
                onClick={() => setStyleTab('artistic')}
                className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  styleTab === 'artistic'
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {styleTab === 'artistic' && (
                  <motion.div
                    layoutId="active-style-tab-indicator"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    className="absolute inset-0 bg-[#F55951] rounded-lg shadow-xs z-[-1]"
                  />
                )}
                فانتزی و هنری (۷ سبک)
              </button>
            </div>
          </div>

          {/* Style Cards Grid with Smooth Motion Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={styleTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              {filteredStyles.map(style => {
                const isSelected = config.calligraphyStyleId === style.id;
                return (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={() => setConfig({ ...config, calligraphyStyleId: style.id })}
                    className={`btn-interactive p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-[#F55951]/10 border-2 border-[#F55951] shadow-md'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#F55951]/60 hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 w-full">
                      <span className={`text-sm font-bold ${isSelected ? 'text-[#F55951]' : 'text-[var(--text-primary)]'}`}>
                        {style.name_fa}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#F55951]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[var(--border-color)]" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                      {style.description_fa}
                    </p>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* =========================================
            SECTION 3: COMPOSITION FORM
        ========================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F55951]" />
              <span>فرم ترکیب‌بندی تایپوگرافی</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">ایجاد فرم با ساختار حروف و مفردات</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {forms.map(form => {
              const isSelected = config.typographyFormId === form.id;
              return (
                <motion.button
                  key={form.id}
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setConfig({ ...config, typographyFormId: form.id })}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-[#F55951]/10 border-2 border-[#F55951] shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#F55951]/60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center shadow-2xs">
                    {getFormIcon(form.id)}
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#F55951]' : 'text-[var(--text-primary)]'}`}>
                    {form.name_fa}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {config.typographyFormId !== 'form-free' && (
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#F55951] shrink-0" />
              <span>
                فرم هندسی انتخابی توسط کشیدگی‌های اصیل خط و مفردات ایجاد می‌شود (نه صرفاً کادر دور متن).
              </span>
            </div>
          )}
        </div>

        {/* =========================================
            SECTION 4: COLOR SYSTEM & BACKGROUND
        ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-color)]">
          {/* Typography Color Picker */}
          <div>
            <ColorControl
              id="title-color-picker"
              label="رنگ اصلی حروف و تایپوگرافی:"
              value={config.titleColorHex}
              onChange={hex => setConfig({ ...config, titleColorHex: hex })}
            />
          </div>

          {/* Background Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              وضعیت پس‌زمینه تصویر:
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setConfig({ ...config, backgroundStatus: 'has_background' })}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  config.backgroundStatus === 'has_background'
                    ? 'bg-[#F55951] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                دارای پس‌زمینه
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, backgroundStatus: 'no_background' })}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  config.backgroundStatus === 'no_background'
                    ? 'bg-[#F55951] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                بدون پس‌زمینه
              </button>
            </div>
          </div>

          {/* Background Color Picker */}
          <div>
            <ColorControl
              id="bg-color-picker"
              label="رنگ پس‌زمینه تصویر:"
              value={config.backgroundColorHex}
              onChange={hex => setConfig({ ...config, backgroundColorHex: hex })}
              disabled={config.backgroundStatus === 'no_background'}
            />
          </div>
        </div>

        {/* =========================================
            SECTION 5: PROFESSIONAL SETTINGS (COLLAPSIBLE)
        ========================================== */}
        <div className="pt-2 border-t border-[var(--border-color)]">
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            type="button"
            onClick={() => setShowProSettings(!showProSettings)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#F55951]/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F55951]/10 text-[#F55951] flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[var(--text-primary)] block">تنظیمات حرفه‌ای هنری و بصری</span>
                <span className="text-[11px] text-[var(--text-muted)]">متریال، برجستگی، نورپردازی، سایه‌زنی، کادر و مدل هوش مصنوعی</span>
              </div>
            </div>
            {showProSettings ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
          </motion.button>

          <AnimatePresence>
            {showProSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 overflow-hidden"
              >
                {/* Material & Dimension */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>جنس و متریال حروف:</span>
                    </label>
                    <select
                      value={config.materialId}
                      onChange={e => setConfig({ ...config, materialId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name_fa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>میزان برجستگی و بعد خط:</span>
                    </label>
                    <select
                      value={config.dimensionId}
                      onChange={e => setConfig({ ...config, dimensionId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      {dimensions.map(d => (
                        <option key={d.id} value={d.id}>{d.name_fa}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lighting & Shadowing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>زاویه و نوع نورپردازی:</span>
                    </label>
                    <select
                      value={config.lightingId}
                      onChange={e => setConfig({ ...config, lightingId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      {lightings.map(l => (
                        <option key={l.id} value={l.id}>{l.name_fa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>حالت و عمق سایه‌زنی:</span>
                    </label>
                    <select
                      value={config.shadowingId}
                      onChange={e => setConfig({ ...config, shadowingId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      {shadows.map(s => (
                        <option key={s.id} value={s.id}>{s.name_fa}</option>
                      ))}
                    </select>
                    <span className="block mt-1 text-[10px] text-[var(--text-muted)]">
                      سایه‌زنی برای سبک‌های رسمی مانند ثلث و کوفی جلوه خاصی ایجاد می‌کند.
                    </span>
                  </div>
                </div>

                {/* Aspect Ratio & AI Model */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Ratio className="w-3.5 h-3.5 text-[#F55951]" />
                        <span>نسبت ابعاد تصویر:</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#F55951] bg-[#F55951]/10 px-2 py-0.5 rounded-md border border-[#F55951]/20">
                        {aspectRatios.find(ar => ar.id === config.aspectRatioId)?.value || '۱:۱'}
                      </span>
                    </label>

                    {/* Visual Aspect Ratio Grid with Illustrative Shape Icons */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {aspectRatios.map(ar => {
                        const isSelected = config.aspectRatioId === ar.id;
                        return (
                          <button
                            key={ar.id}
                            type="button"
                            onClick={() => setConfig({ ...config, aspectRatioId: ar.id })}
                            className={`group flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#F55951]/10 border-[#F55951] text-[var(--text-primary)] shadow-xs ring-1 ring-[#F55951]/40'
                                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#F55951]/40 hover:bg-[var(--bg-subtle)]/30'
                            }`}
                          >
                            <AspectRatioIcon ratio={ar.value} active={isSelected} />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold block truncate text-[var(--text-primary)]">
                                {ar.name_fa}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-medium block">
                                نسبت {ar.value}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#F55951]" />
                      <span>مدل هدف هوش مصنوعی:</span>
                    </label>
                    <select
                      value={config.aiModelId}
                      onChange={e => setConfig({ ...config, aiModelId: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] focus:border-[#F55951] focus:outline-hidden cursor-pointer"
                    >
                      {aiModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name_fa}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2"
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* =========================================
            USER QUOTA & SUBSCRIPTION STATUS (ORIGINAL LOCATION - COMPACT & ELEGANT)
        ========================================== */}
        {user && (
          <div className="w-full">
            {user.is_unlimited ? (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{badgeUnlimitedText}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 font-medium">
                  بدون سقف روزانه ✨
                </span>
              </div>
            ) : user.daily_primary_remaining === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-[var(--text-secondary)] space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{limitExceededTitle}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 font-mono">
                    {`۰ از ${user.daily_primary_limit || 1}`}
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/15">
                  <span>{limitExceededDesc}</span>
                  <a
                    href={eitaaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span>{eitaaBtnText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#F55951] shrink-0" />
                  <span className="font-medium">
                    {formatFreeBadge(user.daily_primary_remaining, user.daily_primary_limit || 1)}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {freeSubtext}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PRIMARY GENERATE BUTTON */}
        <div className="space-y-3 pt-2">
          <motion.button
            whileHover={{ scale: isQuotaDepleted ? 1 : 1.015, boxShadow: isQuotaDepleted ? 'none' : '0 20px 25px -5px rgba(245, 89, 81, 0.3)' }}
            whileTap={{ scale: isQuotaDepleted ? 1 : 0.985 }}
            type="button"
            disabled={isGenerating || isGeneratingAgain || isQuotaDepleted}
            onClick={handleGenerate}
            className={`w-full relative group overflow-hidden py-4 px-6 rounded-2xl font-black text-base md:text-lg transition-all flex items-center justify-center gap-3 ${
              isQuotaDepleted
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-2 border-amber-500/30 cursor-not-allowed shadow-xs'
                : isGenerating || isGeneratingAgain
                ? 'bg-gradient-to-r from-[#F55951] via-[#FA7268] to-[#E04840] text-white opacity-80 cursor-not-allowed shadow-lg'
                : 'bg-gradient-to-r from-[#F55951] via-[#FA7268] to-[#E04840] text-white shadow-lg shadow-[#F55951]/25 hover:shadow-xl cursor-pointer'
            }`}
          >
            {/* Subtle animated shimmer line on button */}
            {!isQuotaDepleted && (
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            )}

            {isQuotaDepleted ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <Sparkles className={`w-5 h-5 text-white transition-transform ${isGenerating ? 'animate-spin' : 'group-hover:rotate-12'}`} />
            )}
            <span className="tracking-tight text-center">
              {isQuotaDepleted
                ? `${limitExceededTitle} (تولید دوباره مجاز است)`
                : isGenerating
                ? generatorSubmitLoading
                : generatorSubmitBtn}
            </span>
          </motion.button>

          {isQuotaDepleted && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-[var(--text-secondary)]">
              <span>{upgradePromptText}</span>
              <a
                href={eitaaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition cursor-pointer"
              >
                <span>{eitaaBtnText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Dynamic Generation Animation */}
      <AnimatePresence>
        {showAnimation && (
          <GenerationAnimation
            isGenerateAgain={animationIsAgain}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* Generated Result Card */}
      {!showAnimation && generationResult && (
        <PromptResultCard
          prompt={generationResult.prompt}
          onGenerateAgain={handleGenerateAgain}
          isGeneratingAgain={isGeneratingAgain}
        />
      )}
    </div>
  );
}
