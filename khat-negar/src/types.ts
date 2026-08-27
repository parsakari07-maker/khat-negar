/**
 * Application Types for Persian Typography Prompt Generator
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  ip_count: number;
  active_sessions_count: number;
  is_suspicious?: boolean;
}

export interface LoginLog {
  id: string;
  user_id: string;
  username: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  device_info: string;
  status: 'success' | 'failed';
  reason?: string;
  is_suspicious: boolean;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  username: string;
  event_type: 'multiple_ips' | 'failed_logins' | 'unusual_time' | 'high_volume' | 'concurrent_sessions';
  description: string;
  severity: 'low' | 'medium' | 'high';
  ip_address: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'ignored';
}

export interface MasterPrompt {
  id: string;
  key: string;
  name_fa: string;
  description_fa: string;
  template: string;
  active: boolean;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MasterPromptVersion {
  id: string;
  master_prompt_id: string;
  version: number;
  template: string;
  description_fa: string;
  edited_by: string;
  created_at: string;
}

export interface TypographyStyle {
  id: string;
  name_fa: string;
  description_fa: string;
  ai_description_en: string;
  category: 'traditional' | 'artistic';
  icon?: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TypographyForm {
  id: string;
  name_fa: string;
  description_fa: string;
  ai_instruction_en: string;
  active: boolean;
  sort_order: number;
}

export interface MaterialOption {
  id: string;
  name_fa: string;
  ai_description_en: string;
  active: boolean;
  sort_order: number;
}

export interface DimensionOption {
  id: string;
  name_fa: string;
  ai_description_en: string;
  active: boolean;
  sort_order: number;
}

export interface LightingOption {
  id: string;
  name_fa: string;
  ai_description_en: string;
  active: boolean;
  sort_order: number;
}

export interface ShadowOption {
  id: string;
  name_fa: string;
  ai_description_en: string;
  active: boolean;
  sort_order: number;
}

export interface AspectRatioOption {
  id: string;
  name_fa: string;
  value: string;
  active: boolean;
  sort_order: number;
}

export interface AiModelOption {
  id: string;
  name_fa: string;
  model_key: string;
  ai_name_en: string;
  description_fa: string;
  active: boolean;
  sort_order: number;
}

export interface FeedbackReport {
  id: string;
  user_id?: string;
  username?: string;
  type: 'report' | 'suggestion';
  title: string;
  description: string;
  status: 'unread' | 'read' | 'resolved';
  ip_address?: string;
  created_at: string;
}

export interface AppSettings {
  // General & Branding
  site_title?: string;
  site_title_fa?: string;
  site_badge_fa?: string;
  site_subtitle_fa?: string;
  header_generator_btn_fa?: string;
  header_admin_btn_fa?: string;
  custom_logo_url?: string;

  // Feedback & Suggestions Section
  feedback_badge_fa?: string;
  feedback_title_fa?: string;
  feedback_subtitle_fa?: string;
  feedback_type_label_fa?: string;
  feedback_input_title_label_fa?: string;
  feedback_input_title_placeholder_fa?: string;
  feedback_input_desc_label_fa?: string;
  feedback_input_desc_placeholder_fa?: string;
  feedback_submit_btn_fa?: string;
  feedback_success_msg_fa?: string;

  // Login / Auth Screen & Modal
  login_badge_fa?: string;
  login_title_fa?: string;
  login_subtitle_fa?: string;
  login_username_label_fa?: string;
  login_username_placeholder_fa?: string;
  login_password_label_fa?: string;
  login_password_placeholder_fa?: string;
  login_button_fa?: string;
  login_notice_fa?: string;

  // Welcome Celebration Card
  welcome_badge_fa?: string;
  welcome_title_fa?: string;
  welcome_subtitle_admin_fa?: string;
  welcome_subtitle_user_fa?: string;
  welcome_loading_text_fa?: string;

  // Generator View
  generator_top_badge_fa?: string;
  generator_heading_fa?: string;
  generator_subtitle_fa?: string;
  generator_sample_btn_fa?: string;
  generator_input_label_fa?: string;
  generator_input_placeholder_fa?: string;
  generator_submit_btn_fa?: string;
  generator_again_btn_fa?: string;
  generator_result_title_fa?: string;
  generator_result_subtitle_fa?: string;

  // Footer
  footer_title_fa?: string;
  footer_subtitle_fa?: string;

  // Defaults
  default_style_id: string;
  default_form_id: string;
  default_material_id: string;
  default_dimension_id: string;
  default_lighting_id: string;
  default_shadow_id: string;
  default_aspect_ratio_id: string;
  default_ai_model_id: string;

  // System & Security
  allow_prompt_cycling?: boolean;
  rate_limit_per_minute?: number;
  suspicious_ip_threshold?: number;
  failed_login_threshold?: number;
}

export type SystemSettings = AppSettings;
export type AuditLog = AdminAuditLog;

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface GenerationLog {
  id: string;
  user_id: string;
  username: string;
  master_prompt_id: string;
  master_prompt_name: string;
  ai_model_id: string;
  style_id: string;
  form_id: string;
  is_generate_again: boolean;
  timestamp: string;
}

export interface TypographyUserConfig {
  title: string;
  calligraphyStyleId: string;
  typographyFormId: string;
  titleColorHex: string;
  backgroundStatus: 'has_background' | 'no_background';
  backgroundColorHex: string;
  materialId: string;
  dimensionId: string;
  lightingId: string;
  shadowingId: string;
  aspectRatioId: string;
  aiModelId: string;
}

export interface GeneratePromptResponse {
  success: boolean;
  prompt: string;
  masterPromptId: string;
  masterPromptName: string;
  masterPromptIndex: number;
  totalActiveMasterPrompts: number;
  cycleCompleted?: boolean;
  message?: string;
}
