import type {
  TypographyStyle,
  TypographyForm,
  MaterialOption,
  DimensionOption,
  LightingOption,
  ShadowOption,
  AspectRatioOption,
  AiModelOption,
  MasterPrompt,
  AppSettings
} from '../types.js';

export const INITIAL_TYPOGRAPHY_STYLES: TypographyStyle[] = [
  {
    id: 'style-thuluth',
    name_fa: 'ثلث سنتی اصیل',
    category: 'traditional',
    description_fa: 'سبک ثلث باشکوه، شاهانه و متقارن کتیبه‌ای با صلابت و کشیدگی‌های دقیق',
    ai_description_en: 'Authentic Traditional Persian Thuluth calligraphy with monumental majestic proportions, sharp serifs, regal composition, strict classical stroke geometry',
    sort_order: 1,
    active: true
  },
  {
    id: 'style-nastaliq',
    name_fa: 'نستعلیق سنتی',
    category: 'traditional',
    description_fa: 'عروس خطوط اسلامی، ظریف، سیال و دارای ریتم و انحناهای نرم و چشم‌نواز',
    ai_description_en: 'Authentic Persian Nastaliq calligraphy, the bride of Islamic scripts, characterized by fluid diagonal rhythm, delicate tapering tails, harmonic curves, strict traditional balance',
    sort_order: 2,
    active: true
  },
  {
    id: 'style-shekasteh',
    name_fa: 'شکسته نستعلیق',
    category: 'traditional',
    description_fa: 'پویا، آزاد و شورانگیز، رها شده با پیچش‌های استادانه و ریتمیک',
    ai_description_en: 'Authentic Persian Shekasteh Nastaliq (broken cursive) calligraphy, dynamic, poetic, exuberant continuous flowing strokes, complex interlaced letters with high energy',
    sort_order: 3,
    active: true
  },
  {
    id: 'style-kufi-bannaee',
    name_fa: 'کوفی بنایی (معقلی)',
    category: 'traditional',
    description_fa: 'هندسی، شبکه‌ای و ساختاریافته مشابه کاشی‌کاری‌های کهن مساجد تاریخی',
    ai_description_en: 'Authentic Persian Square Kufic (Banna\'i/Moaqeli) geometric brickwork typography, precise grid-based rectilinear labyrinth calligraphy, architectural historical Persian pattern',
    sort_order: 4,
    active: true
  },
  {
    id: 'style-moalla',
    name_fa: 'معلی باشکوه',
    category: 'traditional',
    description_fa: 'بلند، حماسی و با کشیدگی‌های عمودی رفیع و نوک‌تیز',
    ai_description_en: 'Authentic Persian Moalla calligraphy, tall heroic vertical ascenders, sharp dramatic strokes, energetic high-contrast letters with soaring sacred presence',
    sort_order: 5,
    active: true
  },
  {
    id: 'style-safir',
    name_fa: 'سفیر نوآورانه',
    category: 'traditional',
    description_fa: 'تند و تیز با سرعت و برش‌های زاویه‌دار قلمی مدرن-سنتی',
    ai_description_en: 'Modern-traditional Persian Safir calligraphy script, sharp razor edges, rapid angular flourishes, clean crisp contemporary calligraphic energy',
    sort_order: 6,
    active: true
  },
  {
    id: 'style-kufi-eastern',
    name_fa: 'کوفی مشرقی تزئینی',
    category: 'traditional',
    description_fa: 'با دنباله‌های تزئینی برگ‌مانند و اسلیمی ظریف',
    ai_description_en: 'Authentic Eastern / Persian Floral Kufic calligraphy, ornate foliate flourishes, decorated terminal strokes, timeless mystical manuscript aesthetic',
    sort_order: 7,
    active: true
  },
  {
    id: 'style-modern-bold',
    name_fa: 'تایپوگرافی مدرن سالید',
    category: 'artistic',
    description_fa: 'ضخیم، گرافیکی، چشم‌گیر و مناسب پوسترهای معاصر',
    ai_description_en: 'Modern high-impact bold Persian display typography, heavy weighted solid graphic letters, clean ultra-crisp vector-like contours, contemporary poster style',
    sort_order: 8,
    active: true
  },
  {
    id: 'style-liquid',
    name_fa: 'سیال و ارگانیک (مایع)',
    category: 'artistic',
    description_fa: 'فرم‌های روان، قطره‌ای و کشسان با ریتم‌های منعطف مدرن',
    ai_description_en: 'Organic liquid fluid Persian typography, smooth dynamic droplet curves, morphing elastic letterforms, contemporary avant-garde aesthetic',
    sort_order: 9,
    active: true
  },
  {
    id: 'style-isometric',
    name_fa: 'سه‌بعدی ایزومتریک ساختاریافته',
    category: 'artistic',
    description_fa: 'حروف سه‌بعدی مدولار با زوایای معماری و پرسپکتیو دقیق',
    ai_description_en: 'Structured isometric 3D Persian typography, architectural cubic letter anatomy, precise perspective depth, futuristic clean geometry',
    sort_order: 10,
    active: true
  }
];

export const INITIAL_TYPOGRAPHY_FORMS: TypographyForm[] = [
  {
    id: 'form-free',
    name_fa: 'ترکیب‌بندی آزاد خطی',
    description_fa: 'آرایش استاندارد کلمات روی خط کرسی بدون محدودیت در شکل بیرونی',
    ai_instruction_en: 'Composed in an elegant free-flowing balanced linear arrangement along natural baseline rhythm',
    sort_order: 1,
    active: true
  },
  {
    id: 'form-circle',
    name_fa: 'دایره / شمسه مدور',
    description_fa: 'حروف و کلمات خوشنویسی در یک ترکیب‌بندی منظم و متوازن دایره‌ای قرار می‌گیرند',
    ai_instruction_en: 'Composed entirely inside a perfect harmonic circular medallion (Shamsa) silhouette, letters curving naturally to sculpt the round perimeter',
    sort_order: 2,
    active: true
  },
  {
    id: 'form-square',
    name_fa: 'مربع و بلوک هندسی',
    description_fa: 'آرایش متراکم و ساختاریافته در یک قالب چهارگوش منظم',
    ai_instruction_en: 'Composed into a dense, balanced, monolithic square block composition with aligned borders',
    sort_order: 3,
    active: true
  },
  {
    id: 'form-tear',
    name_fa: 'بته‌جقه / قطره اسلیمی',
    description_fa: 'انحنای خوشنویسی در قالب فرم اصیل بته‌جقه یا قطره سنتی ایرانی',
    ai_instruction_en: 'Composed inside an authentic Persian Paisley (Boteh Jegheh) / teardrop paisley silhouette with graceful tapering apex',
    sort_order: 4,
    active: true
  },
  {
    id: 'form-shield',
    name_fa: 'کتیبه قوسی / محرابی',
    description_fa: 'فرم کتیبه‌های تاریخی با قوس‌های محرابی و متقارن',
    ai_instruction_en: 'Composed within a classical Persian vaulted arch / Mihrab architectural tablet silhouette',
    sort_order: 5,
    active: true
  }
];

export const INITIAL_MATERIALS: MaterialOption[] = [
  {
    id: 'mat-none',
    name_fa: 'مرکب خالص و چاپ دیجیتال',
    ai_description_en: 'Rendered in pure crisp vector-quality high-pigment calligraphy ink',
    sort_order: 1,
    active: true
  },
  {
    id: 'mat-gold',
    name_fa: 'طلاکاری و تذهیب فلزی براق',
    ai_description_en: 'Crafted from lustrous polished 24k gold leaf with delicate metallic gilded highlights, reflective specular sheen, Persian illumination texture',
    sort_order: 2,
    active: true
  },
  {
    id: 'mat-ceramic',
    name_fa: 'کاشی لعاب‌دار فیروزه‌ای و لاجوردی',
    ai_description_en: 'Crafted as traditional Persian glazed turquoise and cobalt blue ceramic tile mosaic, glossy vitreous glaze surface, authentic fine craquelure veins',
    sort_order: 3,
    active: true
  },
  {
    id: 'mat-wood',
    name_fa: 'منبت و چوب‌تراش گردو',
    ai_description_en: 'Hand-carved premium Persian walnut wood with rich natural grain, subtle beveled relief depths, warm satin varnish',
    sort_order: 4,
    active: true
  },
  {
    id: 'mat-stone',
    name_fa: 'سنگ‌تراشی مرمر سفید',
    ai_description_en: 'Chiseled into pristine white Carrara marble with translucent mineral depth and sharp sculpted relief edges',
    sort_order: 5,
    active: true
  },
  {
    id: 'mat-neon',
    name_fa: 'نئون درخشان و شیشه گازی',
    ai_description_en: 'Glowing glass neon tubing emitting vibrant volumetric light blooms and atmospheric luminous glow',
    sort_order: 6,
    active: true
  },
  {
    id: 'mat-chrome',
    name_fa: 'فلز کروم مایع آینه‌ای',
    ai_description_en: 'Reflective liquid chrome metal with mirror-smooth reflections, high-gloss specular curves, modern luxury finish',
    sort_order: 7,
    active: true
  }
];

export const INITIAL_DIMENSIONS: DimensionOption[] = [
  {
    id: 'dim-none',
    name_fa: 'دو بعدی تخت (Flat 2D Graphic)',
    ai_description_en: 'Pure 2D flat graphic design with sharp vector-crisp contours',
    sort_order: 1,
    active: true
  },
  {
    id: 'dim-subtle-3d',
    name_fa: 'برجستگی ملایم (Subtle Emboss / Relief)',
    ai_description_en: 'Subtle sculpted bas-relief embossing with tactile raised edges',
    sort_order: 2,
    active: true
  },
  {
    id: 'dim-full-3d',
    name_fa: 'حجمی سه‌بعدی کامل (Volumetric 3D Object)',
    ai_description_en: 'Full volumetric 3D dimensional typography with physically rendered depth, beveled bevels, and tangible mass',
    sort_order: 3,
    active: true
  },
  {
    id: 'dim-monumental',
    name_fa: 'حجیم یادمانی و معماری (Monumental Scale)',
    ai_description_en: 'Grand monumental architectural scale with immense physical presence and structural solidity',
    sort_order: 4,
    active: true
  }
];

export const INITIAL_LIGHTINGS: LightingOption[] = [
  {
    id: 'light-none',
    name_fa: 'نورپردازی طبیعی و یکنواخت استودیویی',
    ai_description_en: 'Balanced soft diffused studio lighting with uniform illumination and no harsh glare',
    sort_order: 1,
    active: true
  },
  {
    id: 'light-dramatic',
    name_fa: 'نورپردازی دراماتیک و متضاد (Chiaroscuro)',
    ai_description_en: 'High-contrast cinematic chiaroscuro lighting, strong directional key light sculpting form against rich shadows',
    sort_order: 2,
    active: true
  },
  {
    id: 'light-golden-hour',
    name_fa: 'نور گرم ساعت طلایی (Golden Hour)',
    ai_description_en: 'Warm low-angle sunset golden hour illumination casting rich amber and bronze tonal radiance',
    sort_order: 3,
    active: true
  },
  {
    id: 'light-rim',
    name_fa: 'نور لبه‌ای و ضد نور (Rim / Backlit Glow)',
    ai_description_en: 'Dramatic rim backlight defining the silhouette with radiant illuminated letter contours',
    sort_order: 4,
    active: true
  }
];

export const INITIAL_SHADOWS: ShadowOption[] = [
  {
    id: 'shadow-none',
    name_fa: 'بدون سایه (کاملاً ایزوله و تخت)',
    ai_description_en: 'Zero shadow, clean edge separation from backdrop',
    sort_order: 1,
    active: true
  },
  {
    id: 'shadow-soft',
    name_fa: 'سایه نرم و ملو استودیویی (Soft Ambient Drop)',
    ai_description_en: 'Gentle diffuse ambient occlusion soft contact drop shadow grounding the lettering smoothly',
    sort_order: 2,
    active: true
  },
  {
    id: 'shadow-long',
    name_fa: 'سایه کشیده و خطی دراماتیک (Long Cast Shadow)',
    ai_description_en: 'Dramatic elongated cast shadow trailing across the surface at a deliberate artistic angle',
    sort_order: 3,
    active: true
  }
];

export const INITIAL_ASPECT_RATIOS: AspectRatioOption[] = [
  { id: 'ar-1-1', name_fa: 'مربع (۱:۱)', value: '1:1', sort_order: 1, active: true },
  { id: 'ar-4-5', name_fa: 'عمودی پرتره (۴:۵)', value: '4:5', sort_order: 2, active: true },
  { id: 'ar-9-16', name_fa: 'استوری / موبایل (۹:۱۶)', value: '9:16', sort_order: 3, active: true },
  { id: 'ar-16-9', name_fa: 'افقی عریض (۱۶:۹)', value: '16:9', sort_order: 4, active: true },
  { id: 'ar-3-2', name_fa: 'افقی استاندارد (۳:۲)', value: '3:2', sort_order: 5, active: true }
];

export const INITIAL_AI_MODELS: AiModelOption[] = [
  {
    id: 'model-generic',
    name_fa: 'استاندارد عمومی (Midjourney, DALL-E, Ideogram, Flux)',
    model_key: 'generic',
    ai_name_en: 'Universal High-End Image Generation AI (Midjourney v6.1, Flux.1 Pro, Ideogram v2, DALL-E 3)',
    description_fa: 'سازگار با همه مدل‌های معتبر تصویرسازی هوش مصنوعی با بالاترین دقت ترجمه بصری',
    sort_order: 1,
    active: true
  },
  {
    id: 'model-midjourney',
    name_fa: 'میدجرنی (Midjourney v6.1)',
    model_key: 'midjourney',
    ai_name_en: 'Midjourney v6.1 with specialized photorealistic and artistic rendering parameters',
    description_fa: 'بهینه‌سازی شده برای سبک‌های نوری و متریال‌های غنی میدجرنی',
    sort_order: 2,
    active: true
  },
  {
    id: 'model-flux',
    name_fa: 'فلاکس (Flux.1 Pro / Schnell)',
    model_key: 'flux',
    ai_name_en: 'Flux.1 Pro ultra-detailed typography generation engine with high character fidelity',
    description_fa: 'بهینه‌سازی شده برای املای دقیق حروف و متریال‌های مدرن',
    sort_order: 3,
    active: true
  },
  {
    id: 'model-ideogram',
    name_fa: 'آیدیوگرام ۲ (Ideogram v2)',
    model_key: 'ideogram',
    ai_name_en: 'Ideogram v2 typography specialist model with text precision focus',
    description_fa: 'دقت بی‌نظیر در درج متن و چیدمان‌های گرافیکی پوستر',
    sort_order: 4,
    active: true
  }
];

export const INITIAL_MASTER_PROMPTS: MasterPrompt[] = [
  {
    id: 'mp-1',
    key: 'master-prompt-1',
    name_fa: 'پرامپت مادر ۱: استاندارد و دقت حداکثری',
    description_fa: 'تمرکز ویژه بر دقت کاراکترها و حروف، حفظ اصالت سبک خط و کیفیت فوق‌العاده بالا',
    sort_order: 1,
    active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    template: `Create a professional, high-quality Persian typography artwork using the exact user-provided text and specifications.

USER SPECIFICATIONS

Exact text:
"{{TITLE}}"

Calligraphic / typography style:
"{{CALLIGRAPHY_STYLE}}"

Composition form:
"{{TYPOGRAPHY_FORM}}"

Typography color:
"{{TITLE_COLOR_HEX}}"

Background:
"{{BACKGROUND_STATUS}}"

Background color:
"{{BACKGROUND_COLOR_HEX}}"

Material:
"{{MATERIAL}}"

Dimensionality:
"{{DIMENSION}}"

Lighting:
"{{LIGHTING}}"

Shadowing:
"{{SHADOWING}}"

Aspect ratio:
"{{ASPECT_RATIO}}"

Target AI model:
"{{AI_MODEL}}"

PRIMARY OBJECTIVE: TEXT ACCURACY

The exact requested text is:

«{{TITLE}}»

This exact text is the primary and most important content of the artwork.
Preserve every character, word, spacing relationship, and spelling exactly as provided.
Do not translate, paraphrase, replace, remove, duplicate, invent, or add any characters or words.
Do not substitute Persian characters with Latin characters or unrelated Arabic characters.
The final typography must remain clearly recognizable as the exact requested text.

CALLIGRAPHIC ACCURACY

Use the requested calligraphic or artistic typography style:
"{{CALLIGRAPHY_STYLE}}"

Respect the characteristic proportions, strokes, curves, connections, rhythm, extensions, and visual language of the selected style.
Do not replace the selected style with a generic Arabic font or unrelated lettering style.

COMPOSITION FORM

Use:
"{{TYPOGRAPHY_FORM}}"

If the selected form is geometric, the typography itself should participate in creating that form.
Do not simply place ordinary text inside a separate geometric frame.
Use appropriate calligraphic extensions, controlled spacing, natural letter arrangements, and suitable calligraphic elements when necessary to complete the selected composition.
The selected geometric form must never compromise the readability or identity of the requested text.

COLOR & MATERIAL

Typography color: {{TITLE_COLOR_HEX}}
Background: {{BACKGROUND_STATUS}}
Material rendering: {{MATERIAL}}
Dimension & Depth: {{DIMENSION}}
Lighting & Highlights: {{LIGHTING}}
Shadow & Occlusion: {{SHADOWING}}

FINAL RENDER QUALITY

Ultra high resolution, 8k render, masterwork quality, clean balanced negative space, professional commercial exhibition polish.`
  }
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  site_title: 'سامانه مهندسی پرامپت تایپوگرافی فارسی',
  site_title_fa: 'خط نگار',
  site_badge_fa: 'تایپوگرافی هوشمند',
  site_subtitle_fa: 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی',
  header_generator_btn_fa: 'تولید پرامپت',
  header_admin_btn_fa: 'پنل مدیریت',
  custom_logo_url: '',
  feedback_badge_fa: 'صدای شما، پیشرفت ما',
  feedback_title_fa: 'اعلام گزارش و پیشنهادات',
  feedback_subtitle_fa: 'دیدگاه‌ها، پیشنهادات بهبود، یا گزارش خطاهای احتمالی خود را برای ارتقای سامانه با ما در میان بگذارید.',
  feedback_type_label_fa: 'نوع پیام',
  feedback_input_title_label_fa: 'عنوان گزارش یا پیشنهاد',
  feedback_input_title_placeholder_fa: 'مثال: پیشنهاد افزودن فرم هندسی شمسه، گزارش عدم تطابق رنگ و...',
  feedback_input_desc_label_fa: 'توضیحات تکمیلی',
  feedback_input_desc_placeholder_fa: 'نکات و توضیحات مورد نظر خود را با جزئیات بنویسید...',
  feedback_submit_btn_fa: 'ارسال گزارش یا پیشنهاد',
  feedback_success_msg_fa: 'پیام شما با موفقیت ثبت شد و توسط مدیران سامانه بررسی خواهد شد. سپاس از همراهی شما!',
  login_badge_fa: 'تایپوگرافی هوشمند',
  login_title_fa: 'خط نگار',
  login_subtitle_fa: 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی',
  login_username_label_fa: 'نام کاربری',
  login_username_placeholder_fa: 'نام کاربری شما',
  login_password_label_fa: 'رمز عبور',
  login_password_placeholder_fa: 'رمز عبور شما',
  login_button_fa: 'ورود به سامانه',
  login_notice_fa: 'ایجاد و فعال‌سازی حساب‌های کاربری صرفاً توسط مدیریت سامانه انجام می‌پذیرد.',
  welcome_badge_fa: 'ورود با موفقیت انجام شد',
  welcome_title_fa: 'خوش آمدید، {username}',
  welcome_subtitle_admin_fa: 'دسترسی: مدیریت ارشد سامانه',
  welcome_subtitle_user_fa: 'دسترسی: کاربری سامانه مهندسی پرامپت',
  welcome_loading_text_fa: 'در حال آماده‌سازی و انتقال به محیط کاربری...',
  generator_top_badge_fa: 'مهندسی هوشمند پرامپت‌های خوشنویسی و تایپوگرافی اصیل',
  generator_heading_fa: 'مولد تخصصی پرامپت تایپوگرافی',
  generator_subtitle_fa: 'مشخصات هنری مدنظر خود را مشخص کنید؛ سامانه دقیق‌ترین پرامپت انگلیسی را با حفظ ۱۰۰٪ املای کلمات تولید می‌کند.',
  generator_sample_btn_fa: 'بارگذاری نمونه آزمایشی (ایران من)',
  generator_input_label_fa: 'عنوان و متن دقیق تایپوگرافی',
  generator_input_placeholder_fa: 'متن یا عبارت خوشنویسی خود را بنویسید (مثال: ایران من، عشق، مولانا، یا علی)...',
  generator_submit_btn_fa: 'تولید پرامپت تخصصی تایپوگرافی',
  generator_again_btn_fa: 'تولید دوباره (پرامپت بعدی)',
  generator_result_title_fa: 'پرامپت نهایی تولید شده (انگلیسی)',
  generator_result_subtitle_fa: 'این پرامپت آماده استفاده در ابزارهای هوش مصنوعی تصویرساز است.',
  footer_title_fa: 'سامانه تخصصی مهندسی پرامپت تایپوگرافی فارسی',
  footer_subtitle_fa: 'تولید هوشمند دستورات خوشنویسی اصیل سنتی و مدرن با حفظ ۱۰۰٪ دقت کاراکترها',
  default_style_id: 'style-thuluth',
  default_form_id: 'form-free',
  default_material_id: 'mat-none',
  default_dimension_id: 'dim-none',
  default_lighting_id: 'light-none',
  default_shadow_id: 'shadow-none',
  default_aspect_ratio_id: 'ar-1-1',
  default_ai_model_id: 'model-generic',
  allow_prompt_cycling: true,
  rate_limit_per_minute: 20,
  suspicious_ip_threshold: 3,
  failed_login_threshold: 5
};
