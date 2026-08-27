import { db } from './db.js';
import type { MasterPrompt, TypographyUserConfig } from '../src/types.js';

export interface PromptEngineResult {
  prompt: string;
  masterPrompt: MasterPrompt;
  masterPromptIndex: number;
  totalActive: number;
  cycleCompleted?: boolean;
}

export class MasterPromptEngine {
  /**
   * Validate user input parameters
   */
  static validateUserInput(config: TypographyUserConfig): { isValid: boolean; error?: string } {
    if (!config.title || typeof config.title !== 'string' || !config.title.trim()) {
      return { isValid: false, error: 'عنوان و متن تایپوگرافی الزامی است.' };
    }

    if (!config.titleColorHex || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(config.titleColorHex)) {
      return { isValid: false, error: 'کد رنگ تایپوگرافی نامعتبر است (باید فرمت HEX معتبر باشد).' };
    }

    if (config.backgroundStatus === 'has_background') {
      if (!config.backgroundColorHex || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(config.backgroundColorHex)) {
        return { isValid: false, error: 'کد رنگ پس‌زمینه نامعتبر است (باید فرمت HEX معتبر باشد).' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate master prompt template syntax and variables
   */
  static validateTemplate(template: string): { isValid: boolean; missingVariables: string[]; warnings: string[] } {
    const requiredVars = [
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

    const missingVariables: string[] = [];
    const warnings: string[] = [];

    if (!template || !template.trim()) {
      return { isValid: false, missingVariables: requiredVars, warnings: ['متن قالب پرامپت نمی‌تواند خالی باشد.'] };
    }

    for (const variable of requiredVars) {
      if (!template.includes(variable)) {
        missingVariables.push(variable);
        warnings.push(`متغیر ضروری ${variable} در متن پرامپت یافت نشد.`);
      }
    }

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      warnings
    };
  }

  /**
   * Build the variable replacement map from user configuration and database entities
   */
  static buildVariableMap(config: TypographyUserConfig): Record<string, string> {
    // 1. Title: Preserve exact user text without modification
    const title = config.title;

    // 2. Calligraphy Style: Inject detailed AI description (not just Persian name!)
    const style = db.getTypographyStyleById(config.calligraphyStyleId) || db.getTypographyStyles(true)[0];
    const styleAiDesc = style
      ? `${style.name_fa} (${style.category === 'traditional' ? 'Traditional Persian Calligraphy' : 'Artistic Persian Typography'}): ${style.ai_description_en}`
      : 'Authentic high-contrast Persian Calligraphic Typography with balanced stroke rhythm and classical letter proportions';

    // 3. Typography Form: Composition instruction
    const form = db.getTypographyFormById(config.typographyFormId) || db.getTypographyForms(true)[0];
    const formAiInstruction = form
      ? `${form.name_fa}: ${form.ai_instruction_en}`
      : 'Natural organic Persian typography composition';

    // 4. Title Color HEX: Exact HEX
    const titleColorHex = config.titleColorHex.toUpperCase();

    // 5 & 6. Background Status & Color
    let backgroundStatus = 'No background / Isolated graphic typography presentation';
    let backgroundColorHex = 'Transparent background (if supported by target AI model) / Clean isolated canvas with zero accidental background environment';

    if (config.backgroundStatus === 'has_background') {
      backgroundStatus = 'Enabled solid custom colored background canvas';
      backgroundColorHex = config.backgroundColorHex.toUpperCase();
    }

    // 7. Material
    const material = db.getMaterialById(config.materialId) || db.getMaterials(true)[0];
    const materialDesc = material ? `${material.name_fa} - ${material.ai_description_en}` : 'Traditional rich calligraphic ink';

    // 8. Dimensionality
    const dimension = db.getDimensionById(config.dimensionId) || db.getDimensions(true)[0];
    const dimensionDesc = dimension ? `${dimension.name_fa} - ${dimension.ai_description_en}` : 'Flat 2D graphic typography';

    // 9. Lighting
    const lighting = db.getLightingById(config.lightingId) || db.getLightings(true)[0];
    const lightingDesc = lighting ? `${lighting.name_fa} - ${lighting.ai_description_en}` : 'Soft even studio ambient lighting';

    // 10. Shadowing
    const shadow = db.getShadowById(config.shadowingId) || db.getShadows(true)[0];
    const shadowDesc = shadow ? `${shadow.name_fa} - ${shadow.ai_description_en}` : 'No shadow';

    // 11. Aspect Ratio
    const aspectRatio = db.getAspectRatioById(config.aspectRatioId) || db.getAspectRatios(true)[0];
    const aspectRatioValue = aspectRatio ? aspectRatio.value : '1:1';

    // 12. Target AI Model
    const aiModel = db.getAiModelById(config.aiModelId) || db.getAiModels(true)[0];
    const aiModelName = aiModel ? aiModel.ai_name_en : 'Generic Flagship Image Generator';

    return {
      '{{TITLE}}': title,
      '{{CALLIGRAPHY_STYLE}}': styleAiDesc,
      '{{TYPOGRAPHY_FORM}}': formAiInstruction,
      '{{TITLE_COLOR_HEX}}': titleColorHex,
      '{{BACKGROUND_STATUS}}': backgroundStatus,
      '{{BACKGROUND_COLOR_HEX}}': backgroundColorHex,
      '{{MATERIAL}}': materialDesc,
      '{{DIMENSION}}': dimensionDesc,
      '{{LIGHTING}}': lightingDesc,
      '{{SHADOWING}}': shadowDesc,
      '{{ASPECT_RATIO}}': aspectRatioValue,
      '{{AI_MODEL}}': aiModelName
    };
  }

  /**
   * Render template with variable substitutions
   */
  static renderTemplate(template: string, variableMap: Record<string, string>): string {
    let rendered = template;
    for (const [placeholder, value] of Object.entries(variableMap)) {
      // Replace all occurrences of the placeholder
      rendered = rendered.split(placeholder).join(value);
    }
    return rendered;
  }

  /**
   * Generate Prompt for standard generation or Generate Again
   */
  static generate(
    config: TypographyUserConfig,
    options: {
      currentMasterPromptIndex?: number;
      isGenerateAgain?: boolean;
    } = {}
  ): PromptEngineResult {
    // 1. Validate Input
    const validation = this.validateUserInput(config);
    if (!validation.isValid) {
      throw new Error(validation.error || 'ورودی‌ها نامعتبر هستند.');
    }

    // 2. Load active master prompts
    const activePrompts = db.getActiveMasterPrompts();
    if (activePrompts.length === 0) {
      throw new Error('در حال حاضر هیچ پرامپت مادری برای تولید فعال نیست.');
    }

    const settings = db.getAppSettings();
    let nextIndex = 0;
    let cycleCompleted = false;

    if (options.isGenerateAgain && options.currentMasterPromptIndex !== undefined) {
      nextIndex = options.currentMasterPromptIndex + 1;
      if (nextIndex >= activePrompts.length) {
        if (settings.allow_prompt_cycling) {
          nextIndex = 0;
          cycleCompleted = true;
        } else {
          nextIndex = activePrompts.length - 1;
          cycleCompleted = true;
        }
      }
    } else {
      nextIndex = 0;
    }

    const selectedMasterPrompt = activePrompts[nextIndex];
    const variableMap = this.buildVariableMap(config);
    const renderedPrompt = this.renderTemplate(selectedMasterPrompt.template, variableMap);

    return {
      prompt: renderedPrompt,
      masterPrompt: selectedMasterPrompt,
      masterPromptIndex: nextIndex,
      totalActive: activePrompts.length,
      cycleCompleted
    };
  }
}
