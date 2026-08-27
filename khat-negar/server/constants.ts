/**
 * Master Prompts and Initial Seed Data for Persian Typography System
 */

export const INITIAL_MASTER_PROMPTS = [
  {
    id: 'mp-1',
    key: 'master-prompt-1',
    name_fa: 'پرامپت مادر ۱: استاندارد و دقت حداکثری',
    description_fa: 'تمرکز ویژه بر دقت کاراکترها و حروف، حفظ اصالت سبک خط و کیفیت فوق‌العاده بالا',
    sort_order: 1,
    active: true,
    version: 1,
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

Use appropriate calligraphic extensions, controlled spacing, natural letter arrangements, and suitable مفردات (individual calligraphic elements) when necessary to complete the selected composition.

Do not create meaningless letters or words merely to fill the shape.

The selected geometric form must never compromise the readability or identity of the requested text.

COLOR

Use the exact typography color:

"{{TITLE_COLOR_HEX}}"

This is the primary base color of the lettering.

Lighting, material, highlights, and shadows may create natural tonal variations, but they must not replace the selected base color.

BACKGROUND

Background setting:

"{{BACKGROUND_STATUS}}"

If a background is requested, use:

"{{BACKGROUND_COLOR_HEX}}"

Keep the background subordinate to the typography.

If no background is requested, do not introduce an unintended environment, scene, decorative background, texture, or object.

Use a transparent-background presentation whenever supported by the selected AI model.

MATERIAL, DIMENSION, LIGHTING AND SHADOWING

Material:
"{{MATERIAL}}"

Dimensionality:
"{{DIMENSION}}"

Lighting:
"{{LIGHTING}}"

Shadowing:
"{{SHADOWING}}"

Apply these settings without compromising the exact text or selected calligraphic style.

Shadowing should remain controlled and must not obscure important letterforms.

If shadowing is enabled, it is particularly suitable for formal and structurally strong calligraphic styles such as Thuluth, Kufi, and related styles, but it may still be applied to other styles when explicitly requested.

QUALITY

Generate the highest-quality output supported by the selected AI model.

Use maximum available detail, precision, clarity, clean edges, accurate rendering, refined composition, and professional-grade visual quality.

Never intentionally reduce quality.

FINAL PRIORITY ORDER

1. Exact text accuracy
2. Integrity of the selected calligraphic style
3. Requested composition/form
4. User-selected colors
5. Material and dimensionality
6. Lighting and shadowing
7. Overall visual refinement

The final artwork must be professional, coherent, highly detailed, and visually refined.`
  },
  {
    id: 'mp-2',
    key: 'master-prompt-2',
    name_fa: 'پرامپت مادر ۲: اصالت خط و هندسه خوشنویسی',
    description_fa: 'تاکید بر حفظ قواعد کلاسیک و گرامر بصری خوشنویسی سنتی و تناسبات دقیق مفردات',
    sort_order: 2,
    active: true,
    version: 1,
    template: `Create an exceptionally refined Persian typography artwork based on the exact user specifications.

USER SPECIFICATIONS

Text:
"{{TITLE}}"

Calligraphic style:
"{{CALLIGRAPHY_STYLE}}"

Composition:
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

Target AI:
"{{AI_MODEL}}"

PRIMARY OBJECTIVE: AUTHENTIC CALLIGRAPHY

The artwork must strongly preserve the identity and visual grammar of:

"{{CALLIGRAPHY_STYLE}}"

Treat the typography as carefully composed calligraphy rather than ordinary typed text.

Respect authentic letter proportions, stroke thickness, curves, connections, spacing, rhythm, vertical extensions, horizontal extensions, and overall calligraphic balance.

For traditional styles, such as Thuluth, Nastaliq, Shekasteh Nastaliq, Diwani, Kufi, Naskh, Ruq'ah, Muhaqqaq, and Rayhan, preserve the defining visual characteristics of the selected tradition.

EXACT TEXT

The exact text is:

«{{TITLE}}»

Do not alter the text.

Do not translate it.

Do not add or remove characters.

Do not invent letters to improve composition.

The artistic manipulation of letterforms is permitted only when it remains consistent with the selected calligraphic tradition and does not change the requested textual content.

FORM THROUGH CALLIGRAPHY

Requested composition:

"{{TYPOGRAPHY_FORM}}"

When a geometric form is selected, construct the form primarily through the arrangement and controlled extension of the actual calligraphic letterforms and appropriate مفردات.

The typography should feel as though the selected shape naturally emerges from the calligraphy.

Do not place a generic geometric frame behind the text unless the selected design specifically requires a separate frame.

Do not introduce meaningless writing.

VISUAL PARAMETERS

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

Every parameter must support the selected calligraphic style rather than overpower it.

SHADOWING

When enabled, apply refined and controlled shadowing to emphasize the structure and depth of the calligraphic strokes.

Shadowing is particularly suitable for formal and structurally strong styles such as Thuluth and Kufi.

Never allow shadows to cover, merge, or obscure important letters.

BACKGROUND

If background is disabled, produce a clean transparent-background result whenever the target model supports transparency.

Do not invent a scene or decorative environment.

QUALITY

Use the highest possible image quality supported by the target AI.

Prioritize precise letterforms, clean rendering, detailed edges, refined proportions, accurate materials, and professional composition.

The result should resemble carefully crafted professional Persian calligraphy.

FINAL PRIORITY

Calligraphic authenticity and exact text accuracy take priority over decorative effects.

Create an elegant, professional, highly refined Persian typography artwork.`
  },
  {
    id: 'mp-3',
    key: 'master-prompt-3',
    name_fa: 'پرامپت مادر ۳: شکل‌گیری فرم درون‌حروفی',
    description_fa: 'تشکیل فرم و سیلوییت کلی اثر صرفاً با چینش و کشیدگی‌های حروف و مفردات بدون کادر خارجی',
    sort_order: 3,
    active: true,
    version: 1,
    template: `Create a professional Persian typography artwork in which the requested composition is formed primarily through the typography itself.

USER SPECIFICATIONS

Text:
"{{TITLE}}"

Style:
"{{CALLIGRAPHY_STYLE}}"

Form:
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

AI model:
"{{AI_MODEL}}"

COMPOSITION OBJECTIVE

The selected form is:

"{{TYPOGRAPHY_FORM}}"

The composition must be created through the actual typography whenever possible.

For example, if a circular composition is selected, arrange and extend the calligraphic structure so that the typography itself establishes a circular visual silhouette.

Do not merely put the text inside a separate circle.

For square, rectangular, diamond, or similar forms, use the natural structure of the selected lettering, controlled extensions, spacing, and appropriate مفردات to establish the intended silhouette.

USE OF MUFRADAT

When additional visual structure is required to complete the selected form, use appropriate calligraphic مفردات and structural elements derived from the selected calligraphic tradition.

These elements may include controlled extensions, decorative calligraphic strokes, and structurally appropriate letterform components.

They must not introduce new words or unrelated textual content.

Never generate random pseudo-writing simply to fill empty space.

TEXT PRESERVATION

The exact text is:

«{{TITLE}}»

Preserve it exactly.

The selected composition must be achieved without changing the requested textual content.

Do not add, remove, duplicate, translate, or replace characters.

CALLIGRAPHIC STYLE

Use:

"{{CALLIGRAPHY_STYLE}}"

All compositional manipulation must remain visually compatible with this style.

The composition must not turn the selected calligraphy into an unrelated font or decorative lettering system.

VISUAL SETTINGS

Color:
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

BACKGROUND

If no background is requested, do not create an unintended environment or decorative scene.

Provide transparency when supported by the target model.

If a background is requested, use the exact specified background color and maintain strong contrast with the typography.

QUALITY

Generate the highest-quality output supported by the selected AI.

Prioritize precise composition, clean silhouettes, accurate letterforms, detailed rendering, and professional visual balance.

FINAL RESULT

The result must look like an intentionally designed typographic composition in which the requested geometric or freeform structure is produced by the calligraphy itself.

The typography remains the dominant subject at all times.`
  },
  {
    id: 'mp-4',
    key: 'master-prompt-4',
    name_fa: 'پرامپت مادر ۴: رویکرد هنری، خلاقانه و بافت‌محور',
    description_fa: 'مناسب برای جلوه‌های بصری خیره‌کننده، خلاقیت متریال و نورپردازی بدون تخریب متن',
    sort_order: 4,
    active: true,
    version: 1,
    template: `Create a highly artistic, imaginative, and professionally designed Persian typography artwork using the exact user specifications.

USER SPECIFICATIONS

Text:
"{{TITLE}}"

Typography style:
"{{CALLIGRAPHY_STYLE}}"

Composition:
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

Target AI:
"{{AI_MODEL}}"

ARTISTIC OBJECTIVE

Create a visually distinctive typography artwork rather than a generic text rendering.

Allow the selected artistic style, material, composition, lighting, and dimensional treatment to create a strong visual identity.

However, artistic creativity must never override the exact requested text.

TEXT

The exact text is:

«{{TITLE}}»

Preserve it exactly.

Do not translate, paraphrase, replace, remove, duplicate, or invent characters.

Do not introduce random pseudo-Arabic or pseudo-Persian writing.

STYLE

Use the requested style:

"{{CALLIGRAPHY_STYLE}}"

For fantasy and artistic styles, develop the requested visual characteristics through expressive curves, intentional letterform design, controlled proportions, artistic rhythm, and coherent visual language.

For traditional styles, maintain the defining characteristics of the selected calligraphic tradition.

FORM

Use:

"{{TYPOGRAPHY_FORM}}"

If the selected form is geometric, integrate the form directly into the typography.

Use controlled extensions, composition, and suitable مفردات to complete the silhouette when necessary.

Do not simply place the typography inside a generic geometric shape.

Do not invent additional textual content.

MATERIAL AND EFFECTS

Material:
"{{MATERIAL}}"

Dimension:
"{{DIMENSION}}"

Lighting:
"{{LIGHTING}}"

Shadowing:
"{{SHADOWING}}"

These effects should enhance the artistic character while preserving readability.

COLOR

Use:

"{{TITLE_COLOR_HEX}}"

as the primary typography color.

Respect the exact requested background color:

"{{BACKGROUND_COLOR_HEX}}"

when a background is enabled.

BACKGROUND

Respect:

"{{BACKGROUND_STATUS}}"

When no background is requested, avoid creating an unintended scene or decorative environment and use transparency where supported.

QUALITY

Generate the highest-quality output available from the selected AI model.

Use maximum visual refinement, detail, texture quality, clean edges, professional lighting, and sophisticated composition.

BALANCE

Creativity is encouraged, but it must remain controlled.

Do not add unrelated objects, characters, symbols, words, colors, or visual themes.

The typography must remain the central subject.

FINAL RESULT

Create a memorable, artistic, highly refined Persian typography artwork that combines the exact requested text with the selected style, form, color, material, lighting, and dimensional characteristics.`
  },
  {
    id: 'mp-5',
    key: 'master-prompt-5',
    name_fa: 'پرامپت مادر ۵: هارمونی و تعادل همه‌جانبه',
    description_fa: 'ایجاد تعادل جامع بین دقت متنی، اصالت خط، ترکیب‌بندی فرم و متریال برای خروجی لوکس',
    sort_order: 5,
    active: true,
    version: 1,
    template: `Create a professional Persian typography artwork that achieves a balanced combination of textual accuracy, calligraphic authenticity, composition, and visual quality.

USER SPECIFICATIONS

Text:
"{{TITLE}}"

Calligraphic style:
"{{CALLIGRAPHY_STYLE}}"

Composition:
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

AI model:
"{{AI_MODEL}}"

EXACT TEXT

Render exactly:

«{{TITLE}}»

Preserve the exact spelling, characters, words, and textual structure.

Do not translate, paraphrase, add, remove, duplicate, or invent characters.

Text accuracy is mandatory.

CALLIGRAPHY

Use:

"{{CALLIGRAPHY_STYLE}}"

Maintain the characteristic structure and visual language of the selected style.

The result must not look like generic Arabic or Latin typography.

COMPOSITION

Use:

"{{TYPOGRAPHY_FORM}}"

When the selected form is geometric, allow the typography itself to establish that form through appropriate arrangement, extensions, spacing, and suitable مفردات.

Do not merely place ordinary text inside a geometric frame.

Do not add meaningless writing to fill empty areas.

VISUAL SETTINGS

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

Apply all selected settings consistently.

SHADOWING

If enabled, use subtle and controlled shadowing that enhances depth without reducing readability.

Shadowing is especially appropriate for formal styles such as Thuluth, Kufi, and similar structurally strong calligraphic styles.

BACKGROUND

If background is disabled, do not introduce an unintended environment or decorative scene.

Use transparent output whenever supported.

If enabled, use the exact requested background color and maintain appropriate contrast.

PROFESSIONAL QUALITY

Generate the highest-quality output supported by the target AI model.

Use maximum available detail, precise edges, refined letterforms, accurate material rendering, controlled lighting, strong composition, and professional visual quality.

FINAL BALANCE

Prioritize the following equally:

1. Exact textual accuracy
2. Authenticity of the selected typography style
3. Correct composition
4. Correct colors
5. Material and dimensional treatment
6. Lighting and shadowing
7. Overall artistic quality

Do not allow any decorative or artistic effect to compromise the exact text.

The final result should look like a professionally designed Persian typography artwork rather than a generic AI-generated text image.`
  }
];

export const INITIAL_TYPOGRAPHY_STYLES = [
  // 9 Traditional Styles
  {
    id: 'style-thuluth',
    name_fa: 'ثلث',
    description_fa: 'سبک باشکوه، کشیده و رسمی با خطوط قدرتمند و تناسبات کتیبه‌ای',
    category: 'traditional' as const,
    sort_order: 1,
    active: true,
    ai_description_en: `Traditional Arabic/Persian calligraphic style characterized by large monumental letterforms, strong vertical strokes, broad sweeping curves, pronounced elongated horizontal and vertical extensions, elegant rhythmic spacing, balanced proportions, and a highly expressive ornamental structure. The composition should feel formal, monumental, elegant, and architecturally balanced. Preserve recognizable Thuluth letter construction, strong stroke contrast, controlled curves, vertical emphasis, and characteristic elongated forms.`
  },
  {
    id: 'style-nastaliq',
    name_fa: 'نستعلیق',
    description_fa: 'عروس خطوط اسلامی؛ سرشار از لطافت، تعلیق و شیب‌های موزون و چشم‌نواز',
    category: 'traditional' as const,
    sort_order: 2,
    active: true,
    ai_description_en: `A Persian calligraphic style characterized by flowing diagonal movement, elegant descending forms, suspended letter relationships, graceful curves, elongated strokes, varied vertical positioning, and a distinctive sense of rhythmic downward movement. The composition should feel fluid, poetic, elegant, and naturally connected. Avoid making it resemble generic Arabic typography.`
  },
  {
    id: 'style-shekasteh',
    name_fa: 'شکسته نستعلیق',
    description_fa: 'پویا، پرانرژی و رها با اتصالات سریع، پیوستگی‌های هنرمندانه و ریتم سیال',
    category: 'traditional' as const,
    sort_order: 3,
    active: true,
    ai_description_en: `A more fluid and expressive development of Nastaliq characterized by rapid connected movements, compressed and elongated forms, dynamic diagonals, expressive curves, overlapping relationships, and energetic calligraphic rhythm. Preserve readability while allowing a more spontaneous and artistic visual flow.`
  },
  {
    id: 'style-naskh',
    name_fa: 'نسخ',
    description_fa: 'خواناترین و منظم‌ترین سبک سنتی با تناسبات دقیق و هندسه منضبط',
    category: 'traditional' as const,
    sort_order: 4,
    active: true,
    ai_description_en: `A highly legible traditional calligraphic style characterized by balanced proportions, clear letterforms, controlled curves, moderate stroke contrast, compact spacing, and disciplined readability. The result should feel refined, orderly, classical, and highly readable rather than exaggerated or heavily ornamental.`
  },
  {
    id: 'style-kufi',
    name_fa: 'کوفی',
    description_fa: 'ساختارمند، زاویه‌دار و هندسی؛ ایده‌آل برای ترکیبات معمارانه و سه‌بعدی',
    category: 'traditional' as const,
    sort_order: 5,
    active: true,
    ai_description_en: `A geometric and structurally strong calligraphic style characterized by angular letterforms, straight lines, balanced proportions, geometric rhythm, strong horizontal and vertical structures, and architectural composition. The style is particularly suitable for geometric typography compositions and controlled dimensional effects. Do not turn it into generic modern geometric lettering.`
  },
  {
    id: 'style-diwani',
    name_fa: 'دیوانی',
    description_fa: 'تزئینی، منحنی و متراکم با پیچش‌های سلطنتی و قوس‌های مجلل',
    category: 'traditional' as const,
    sort_order: 6,
    active: true,
    ai_description_en: `An ornate Ottoman calligraphic tradition characterized by flowing curved forms, dense interconnections, graceful arcs, decorative rhythm, and elegant compact composition. The design may feel luxurious and ornamental while preserving the requested textual identity.`
  },
  {
    id: 'style-ruqah',
    name_fa: 'رقاع',
    description_fa: 'کوتاه، منسجم و سریع با سادگی پالوده و ساختار بدون اضافات',
    category: 'traditional' as const,
    sort_order: 7,
    active: true,
    ai_description_en: `A compact and practical Arabic calligraphic style characterized by simplified letterforms, short controlled strokes, compact proportions, restrained ornamentation, and efficient visual structure. The result should feel concise, disciplined, and elegant rather than monumental.`
  },
  {
    id: 'style-muhaqqaq',
    name_fa: 'محقق',
    description_fa: 'کلاسیک، کشیده و باوقار با حروف الف قامتی و کاسه‌های فراخ',
    category: 'traditional' as const,
    sort_order: 8,
    active: true,
    ai_description_en: `A classical formal calligraphic style characterized by tall elegant proportions, strong vertical elements, refined curves, balanced spacing, and carefully controlled stroke relationships. The result should feel formal, monumental, classical, and highly disciplined.`
  },
  {
    id: 'style-rayhan',
    name_fa: 'ریحان',
    description_fa: 'ظریف، شکیل و باریک با خطوطی سبک و لطیف‌تر از محقق',
    category: 'traditional' as const,
    sort_order: 9,
    active: true,
    ai_description_en: `A refined classical calligraphic style with elegant proportions, graceful curves, delicate structure, controlled spacing, and a sophisticated visual rhythm. Preserve its classical character and avoid generic Arabic-font appearance.`
  },

  // Fantasy / Artistic Styles
  {
    id: 'style-artistic-persian',
    name_fa: 'هنری مدرن فارسی (Artistic Persian)',
    description_fa: 'ترکیب خط ایرانی با رویکرد مینیمال و معاصر دیزاین گرافیک',
    category: 'artistic' as const,
    sort_order: 10,
    active: true,
    ai_description_en: `Contemporary modern Persian lettering blending traditional Persian calligraphic strokes with minimalist graphic design sensibilities, clean vector-like precision, dynamic contrast, and refined contemporary visual balance.`
  },
  {
    id: 'style-experimental',
    name_fa: 'خوشنویسی تجربی (Experimental Calligraphy)',
    description_fa: 'حرکات جسورانه قلم، بافت‌های پویا و ساختارشکنی هدفمند خط',
    category: 'artistic' as const,
    sort_order: 11,
    active: true,
    ai_description_en: `Avant-garde experimental Persian calligraphy featuring energetic expressive brush strokes, bold ink dispersion, intentional deconstruction of traditional rules while maintaining textual recognizability, and high artistic tension.`
  },
  {
    id: 'style-decorative',
    name_fa: 'تزئینی اسلیمی (Decorative Persian)',
    description_fa: 'آمیخته با موتیف‌ها، ختایی و نقوش تذهیب ایرانی در امتداد حروف',
    category: 'artistic' as const,
    sort_order: 12,
    active: true,
    ai_description_en: `Intricately decorated Persian typography where letter extensions organically weave with delicate Islimi arabesque spirals, floral motifs, and Persian illumination geometry without overwhelming the core text clarity.`
  },
  {
    id: 'style-fantasy',
    name_fa: 'فانتزی جادویی (Fantasy Calligraphic)',
    description_fa: 'فرم‌های سیال، درخشان و رویاگون با جریان ذرات و خطوط نوری',
    category: 'artistic' as const,
    sort_order: 13,
    active: true,
    ai_description_en: `Ethereal fantasy Persian typography with mystical glowing curves, organic fluid trails, delicate ribbon-like twists, and magical luminous energy accentuating the letterforms.`
  },
  {
    id: 'style-monumental',
    name_fa: 'کتیبه‌ای یادمانی (Monumental Artistic)',
    description_fa: 'حجیم، استوار و نمادین با بافت سنگ‌تراشی بناهای تاریخی باستان',
    category: 'artistic' as const,
    sort_order: 14,
    active: true,
    ai_description_en: `Monumental bas-relief architectural Persian lettering sculpted with heavy presence, chiseled stone edges, ancient Persian monumental scale, and dramatic volumetric depth.`
  },
  {
    id: 'style-organic',
    name_fa: 'ارگانیک طبیعی (Organic Lettering)',
    description_fa: 'الهام‌گرفته از شاخسار، پیچک‌ها و فرم‌های زنده طبیعت',
    category: 'artistic' as const,
    sort_order: 15,
    active: true,
    ai_description_en: `Organic nature-inspired Persian typography with letterforms resembling sculpted vines, smooth polished wood roots, and botanical curves growing harmoniously into the requested text.`
  },
  {
    id: 'style-abstract',
    name_fa: 'انتزاعی مفهومی (Abstract Calligraphic)',
    description_fa: 'تمرکز بر ریتم خالص خطوط، فرم و فضا در هماهنگی با متن',
    category: 'artistic' as const,
    sort_order: 16,
    active: true,
    ai_description_en: `Abstract conceptual Persian lettering emphasizing high-contrast spatial interplay, fluid ribbon geometries, geometric intersections, and sculptural balance while preserving exact text integrity.`
  }
];

export const INITIAL_TYPOGRAPHY_FORMS = [
  {
    id: 'form-free',
    name_fa: 'ترکیب آزاد و طبیعی',
    description_fa: 'ترکیب‌بندی طبیعی و آزاد خط بر اساس جریان ارگانیک کلمات',
    ai_instruction_en: `Freeform natural composition following the organic flow and traditional line rhythm of Persian calligraphy without bounding geometric constraints.`,
    sort_order: 1,
    active: true
  },
  {
    id: 'form-circle',
    name_fa: 'ترکیب دایره',
    description_fa: 'سیلوییت دایره‌ای که از طریق کشیدگی حروف و مفردات شکل می‌گیرد',
    ai_instruction_en: `Circular composition silhouette. CRITICAL: Construct the circular visual silhouette primarily through the arrangement, sweeping curved extensions, and authentic calligraphic مفردات of the actual Persian letters themselves. Do NOT place normal text inside a separate geometric boundary circle; the typography itself must organically form the circle silhouette while strictly preserving the exact text.`,
    sort_order: 2,
    active: true
  },
  {
    id: 'form-square',
    name_fa: 'ترکیب مربع',
    description_fa: 'ترکیب منسجم مربعی با بهره‌گیری از خطوط افقی، عمودی و کشیده‌ها',
    ai_instruction_en: `Square composition silhouette. CRITICAL: The square silhouette must be established naturally by the horizontal and vertical stroke structure, balanced margins, and controlled calligraphic extensions of the Persian letters without drawing an artificial outer box.`,
    sort_order: 3,
    active: true
  },
  {
    id: 'form-rectangle',
    name_fa: 'ترکیب مستطیل',
    description_fa: 'کادربندی افقی یا عمودی متوازن با تکیه بر کشیدگی‌های اصیل',
    ai_instruction_en: `Rectangular composition silhouette formed through authentic elongated horizontal calligraphic extensions (kashida) and vertical ascenders naturally outlining a rectangular boundary without an arbitrary frame.`,
    sort_order: 4,
    active: true
  },
  {
    id: 'form-geometric-simple',
    name_fa: 'فرم هندسی متقارن',
    description_fa: 'هندسه متقارن و منظم برآمده از تناسبات خوشنویسی',
    ai_instruction_en: `Disciplined geometric silhouette formed through symmetrical balance, clean angular axes, and structured calligraphic elements of the text itself.`,
    sort_order: 5,
    active: true
  }
];

export const INITIAL_MATERIALS = [
  {
    id: 'mat-none',
    name_fa: 'طبیعی و استاندارد',
    ai_description_en: 'Standard authentic Persian typography rendering with clean natural finish and no artificial simulated material overlay',
    sort_order: 1,
    active: true
  },
  {
    id: 'mat-ink',
    name_fa: 'مرکب سنتی خوشنویسی',
    ai_description_en: 'Rich Persian calligraphic ink (morakkab) with subtle natural sheen, velvety texture, and authentic edge bleeding on fine handmade paper',
    sort_order: 2,
    active: true
  },
  {
    id: 'mat-cardboard',
    name_fa: 'مقوا و کرافت بافت‌دار',
    ai_description_en: 'Textured fibrous cardboard paper with tactile matte surface, visible organic paper pulp fibers, and elegant tactile finish',
    sort_order: 2,
    active: true
  },
  {
    id: 'mat-paper',
    name_fa: 'کاغذ دست‌ساز آهرمهره',
    ai_description_en: 'Authentic handmade Persian calligraphic glazed Ahar-Mohreh paper with delicate parchment texture and smooth surface',
    sort_order: 3,
    active: true
  },
  {
    id: 'mat-metal',
    name_fa: 'فلز براق، طلا و برنج',
    ai_description_en: 'Polished metallic material with luxurious golden/brass reflections, subtle micro-scratches, and realistic anisotropic specular highlights',
    sort_order: 4,
    active: true
  },
  {
    id: 'mat-stone',
    name_fa: 'سنگ تراش‌خورده و مرمر',
    ai_description_en: 'Chiseled polished marble stone with fine mineral veining, micro-chips on sharp relief edges, and authentic rock density',
    sort_order: 5,
    active: true
  },
  {
    id: 'mat-wood',
    name_fa: 'چوب طبیعی منبت‌کاری',
    ai_description_en: 'Hand-carved premium walnut wood with fine organic grain patterns, satin varnish, and tactile fiber depth',
    sort_order: 6,
    active: true
  },
  {
    id: 'mat-glass',
    name_fa: 'شیشه و بلور کریستالی',
    ai_description_en: 'Refractive optical crystal glass with frosted beveled edges, internal caustics, and pristine transparency',
    sort_order: 7,
    active: true
  },
  {
    id: 'mat-clay',
    name_fa: 'سفال لعاب‌دار فیروزه‌ای',
    ai_description_en: 'Persian handcrafted ceramic clay with glossy turquoise/enameled glaze and authentic artisanal crazing craquelure',
    sort_order: 8,
    active: true
  },
  {
    id: 'mat-fabric',
    name_fa: 'پارچه مخمل و ابریشم زردوزی',
    ai_description_en: 'Embroidered royal velvet and silk fabric with woven gold threading (Zari) and soft micro-fiber sheen',
    sort_order: 9,
    active: true
  },
  {
    id: 'mat-painted',
    name_fa: 'رنگ روغن نقاشی‌خط',
    ai_description_en: 'Textured impasto oil paint naqashi-khat with visible palette knife strokes, thick paint body, and rich layering',
    sort_order: 10,
    active: true
  },
  {
    id: 'mat-digital',
    name_fa: 'وکتور دیجیتال خطی و دقیق',
    ai_description_en: 'Crisp vector graphic rendering with mathematically sharp edges, smooth gradients, and immaculate modern finish',
    sort_order: 11,
    active: true
  }
];

export const INITIAL_DIMENSIONS = [
  {
    id: 'dim-none',
    name_fa: 'طبیعی و بدون بعد',
    ai_description_en: 'Natural balanced 2D typographic plane with clean edges and standard line weight',
    sort_order: 1,
    active: true
  },
  {
    id: 'dim-flat',
    name_fa: 'تخت دو‌بعدی',
    ai_description_en: 'Pure flat 2D graphic design presentation with crisp outlines and zero bevel distortion',
    sort_order: 2,
    active: true
  },
  {
    id: 'dim-slight',
    name_fa: 'برجستگی ملایم',
    ai_description_en: 'Subtle micro-relief dimensionality giving gentle tactile volume without overpowering letter readability',
    sort_order: 3,
    active: true
  },
  {
    id: 'dim-embossed',
    name_fa: 'برجسته منبت‌کاری',
    ai_description_en: 'Refined embossed relief pressed delicately from the background with crisp beveled edges',
    sort_order: 3,
    active: true
  },
  {
    id: 'dim-raised',
    name_fa: 'برآمده حجیم',
    ai_description_en: 'Prominently raised volumetric lettering hovering with tactile depth and clear edge separation',
    sort_order: 4,
    active: true
  },
  {
    id: 'dim-3d-deep',
    name_fa: 'سه‌بعدی عمیق و مجسمه‌گون',
    ai_description_en: 'Full deep sculptural 3D dimensional extrusion with architectural presence and dramatic depth',
    sort_order: 5,
    active: true
  }
];

export const INITIAL_LIGHTINGS = [
  {
    id: 'light-none',
    name_fa: 'نور طبیعی و خنثی',
    ai_description_en: 'Neutral, clean, balanced daylight lighting with even distribution and natural clarity',
    sort_order: 1,
    active: true
  },
  {
    id: 'light-soft',
    name_fa: 'نرم و یکنواخت استودیویی',
    ai_description_en: 'Diffused soft studio lighting with gentle gradient falloff and zero harsh glare',
    sort_order: 2,
    active: true
  },
  {
    id: 'light-natural',
    name_fa: 'نور گرم خورشید و زاویه‌دار',
    ai_description_en: 'Warm natural golden-hour daylight cascading at an angle with realistic atmospheric warmth',
    sort_order: 2,
    active: true
  },
  {
    id: 'light-studio',
    name_fa: 'نورپردازی سه‌نقطه‌ای حرفه‌ای',
    ai_description_en: 'Three-point studio lighting with balanced key, fill, and crisp rim light highlighting stroke contours',
    sort_order: 3,
    active: true
  },
  {
    id: 'light-dramatic',
    name_fa: 'دراماتیک و پرکنتراست',
    ai_description_en: 'Dramatic high-contrast chiaroscuro lighting emphasizing form, volume, and artistic mood',
    sort_order: 4,
    active: true
  },
  {
    id: 'light-directional',
    name_fa: 'جهت‌دار زاویه‌ای مماس',
    ai_description_en: 'Low-angle raking directional light casting micro-shadows along the calligraphic stroke edges to emphasize texture',
    sort_order: 5,
    active: true
  },
  {
    id: 'light-cinematic',
    name_fa: 'سینمایی با هاله نوری',
    ai_description_en: 'Cinematic rim-lit atmosphere with subtle volumetric haze and pristine optical tone curve',
    sort_order: 6,
    active: true
  }
];

export const INITIAL_SHADOWS = [
  {
    id: 'shadow-none',
    name_fa: 'بدون سایه',
    ai_description_en: 'No drop shadow; clean isolated typography floating crisply',
    sort_order: 1,
    active: true
  },
  {
    id: 'shadow-soft',
    name_fa: 'سایه نرم و ملایم',
    ai_description_en: 'Soft diffused contact shadow that anchors the typography subtly without obscuring any letterforms',
    sort_order: 2,
    active: true
  },
  {
    id: 'shadow-controlled',
    name_fa: 'سایه کنترل‌شده و دقیق',
    ai_description_en: 'Controlled directional shadow providing structured depth while strictly ensuring zero shadow overlap over vital characters',
    sort_order: 3,
    active: true
  },
  {
    id: 'shadow-deep',
    name_fa: 'سایه عمیق و برجسته',
    ai_description_en: 'Deep rich cast shadow creating strong separation from the surface while preserving character legibility',
    sort_order: 4,
    active: true
  }
];

export const INITIAL_ASPECT_RATIOS = [
  { id: 'ar-1-1', name_fa: 'مربع (۱:۱)', value: '1:1', sort_order: 1, active: true },
  { id: 'ar-4-5', name_fa: 'عمودی اینستاگرام (۴:۵)', value: '4:5', sort_order: 2, active: true },
  { id: 'ar-3-4', name_fa: 'عمودی استاندارد (۳:۴)', value: '3:4', sort_order: 3, active: true },
  { id: 'ar-4-3', name_fa: 'افقی کلاسیک (۴:۳)', value: '4:3', sort_order: 4, active: true },
  { id: 'ar-16-9', name_fa: 'افقی عریض (۱۶:۹)', value: '16:9', sort_order: 5, active: true },
  { id: 'ar-9-16', name_fa: 'استوری و ریلز (۹:۱۶)', value: '9:16', sort_order: 6, active: true }
];

export const INITIAL_AI_MODELS = [
  {
    id: 'model-generic',
    name_fa: 'مدل عمومی هوش مصنوعی',
    model_key: 'generic-image-generator',
    ai_name_en: 'Generic Flagship Image Generator',
    description_fa: 'پرامپت استاندارد سازگار با تمام موتورهای تولید تصویر معتبر',
    sort_order: 1,
    active: true
  },
  {
    id: 'model-gemini',
    name_fa: 'جمینای ایمیج',
    model_key: 'gemini-image',
    ai_name_en: 'Google Gemini Image Model',
    description_fa: 'بهینه‌سازی شده اختصاصی برای مدل‌های تصویرساز گوگل جمینای و درک عمیق زبان طبیعی',
    sort_order: 2,
    active: true
  },
  {
    id: 'model-midjourney',
    name_fa: 'میدجورنی',
    model_key: 'midjourney',
    ai_name_en: 'Midjourney v6.1 / v7 Calligraphic Mode',
    description_fa: 'فرمت‌بندی دقیق پارامترها و کلمات کلیدی موثر در میدجورنی',
    sort_order: 3,
    active: true
  },
  {
    id: 'model-flux',
    name_fa: 'فلاکس',
    model_key: 'flux-1',
    ai_name_en: 'FLUX.1 Pro Typography Engine',
    description_fa: 'تنظیمات با دقت رندر متن در مدل‌های نسل جدید فلاکس',
    sort_order: 4,
    active: true
  },
  {
    id: 'model-dalle3',
    name_fa: 'دال-ای ۳',
    model_key: 'dall-e-3',
    ai_name_en: 'OpenAI DALL-E 3 Text Rendering Engine',
    description_fa: 'ساختار توصیفی دقیق برای ممانعت از ایجاد پس‌زمینه‌ها یا کاراکترهای تصادفی در DALL-E',
    sort_order: 5,
    active: true
  }
];

export const DEFAULT_APP_SETTINGS = {
  // General & Branding
  site_title: 'سامانه مهندسی پرامپت تایپوگرافی فارسی',
  site_title_fa: 'خط نگار',
  site_badge_fa: 'تایپوگرافی هوشمند',
  site_subtitle_fa: 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی',
  header_generator_btn_fa: 'تولید پرامپت',
  header_admin_btn_fa: 'پنل مدیریت',
  custom_logo_url: '',

  // Feedback & Suggestions Section
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

  // Login / Auth Screen & Modal
  login_badge_fa: 'تایپوگرافی هوشمند',
  login_title_fa: 'خط نگار',
  login_subtitle_fa: 'سامانه تخصصی مهندسی پرامپت خط، خوشنویسی و تایپوگرافی فارسی',
  login_username_label_fa: 'نام کاربری',
  login_username_placeholder_fa: 'نام کاربری شما',
  login_password_label_fa: 'رمز عبور',
  login_password_placeholder_fa: 'رمز عبور شما',
  login_button_fa: 'ورود به سامانه',
  login_notice_fa: 'ایجاد و فعال‌سازی حساب‌های کاربری صرفاً توسط مدیریت سامانه انجام می‌پذیرد.',

  // Welcome Celebration Card
  welcome_badge_fa: 'ورود با موفقیت انجام شد',
  welcome_title_fa: 'خوش آمدید، {username}',
  welcome_subtitle_admin_fa: 'دسترسی: مدیریت ارشد سامانه',
  welcome_subtitle_user_fa: 'دسترسی: کاربری سامانه مهندسی پرامپت',
  welcome_loading_text_fa: 'در حال آماده‌سازی و انتقال به محیط کاربری...',

  // Generator View
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

  // Footer
  footer_title_fa: 'سامانه تخصصی مهندسی پرامپت تایپوگرافی فارسی',
  footer_subtitle_fa: 'تولید هوشمند دستورات خوشنویسی اصیل سنتی و مدرن با حفظ ۱۰۰٪ دقت کاراکترها',

  // Defaults
  default_style_id: 'style-thuluth',
  default_form_id: 'form-free',
  default_material_id: 'mat-none',
  default_dimension_id: 'dim-none',
  default_lighting_id: 'light-none',
  default_shadow_id: 'shadow-none',
  default_aspect_ratio_id: 'ar-1-1',
  default_ai_model_id: 'model-generic',

  // System & Security
  allow_prompt_cycling: true,
  rate_limit_per_minute: 20,
  suspicious_ip_threshold: 3,
  failed_login_threshold: 5
};
