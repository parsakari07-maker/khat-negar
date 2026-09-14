/**
 * Application Types for Persian Typography Prompt Generator
 */

export type UserRole = 'admin' | 'user';

export type SubscriptionStatus = 'free' | 'active' | 'expired';

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
  // Eitaa Mini App (Barnamak) SSO integration
  auth_provider?: 'local' | 'eitaa';
  eitaa_id?: string;
  first_name?: string;
  last_name?: string;
  created_device_fingerprint?: string;
  // Subscription and Daily Usage State
  subscription_status?: SubscriptionStatus;
  subscription_activated_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_activated_by?: string | null;
  subscription_notes?: string;
  is_unlimited?: boolean;
  daily_primary_used?: number;
  daily_primary_limit?: number;
  daily_primary_remaining?: number;
  can_generate_primary?: boolean;
  today_primary_count?: number;
  today_generate_again_count?: number;
  subscription?: UserSubscription;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: 'active' | 'expired' | 'cancelled';
  activated_at: string;
  expires_at?: string | null;
  activated_by: string;
  notes?: string;
  created_at: string;
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

  // Subscription, Daily Limit & Eitaa Integration
  eitaa_channel_url?: string;
  eitaa_channel_name_fa?: string;
  subscription_plans_title_fa?: string;
  daily_limit_message_fa?: string;
  daily_limit_badge_unlimited_fa?: string;
  daily_limit_badge_free_fa?: string;
  daily_limit_free_subtext_fa?: string;
  daily_limit_exceeded_title_fa?: string;
  daily_limit_exceeded_desc_fa?: string;
  daily_limit_upgrade_prompt_fa?: string;
  daily_limit_eitaa_btn_text_fa?: string;
  daily_free_limit?: number;

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
  device_fingerprint?: string;
  eitaa_id?: string;
  ip_address?: string;
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

// ==========================================
// EITAA MINI APP (BARNAMAK) TYPES & SDK DECLARATIONS
// ==========================================

export interface EitaaUser {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface EitaaInitDataUnsafe {
  query_id?: string;
  user?: EitaaUser;
  auth_date?: number | string;
  hash?: string;
  start_param?: string;
}

export interface EitaaThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
  bottom_bar_bg_color?: string;
  [key: string]: string | undefined;
}

export interface EitaaBackButton {
  isVisible?: boolean;
  show?: () => void;
  hide?: () => void;
  onClick?: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
}

export interface EitaaBottomButton {
  text?: string;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
  isActive?: boolean;
  isProgressVisible?: boolean;
  setText?: (text: string) => void;
  show?: () => void;
  hide?: () => void;
  enable?: () => void;
  disable?: () => void;
  showProgress?: (leaveActive?: boolean) => void;
  hideProgress?: () => void;
  onClick?: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
  setParams?: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => void;
}

export interface EitaaSettingsButton {
  isVisible?: boolean;
  show?: () => void;
  hide?: () => void;
  onClick?: (callback: () => void) => void;
  offClick?: (callback: () => void) => void;
}

export interface EitaaWebApp {
  initData?: string;
  initDataUnsafe?: EitaaInitDataUnsafe;
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  themeParams?: EitaaThemeParams;
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  onEvent?: (eventType: string, handler: (...args: any[]) => void) => void;
  offEvent?: (eventType: string, handler: (...args: any[]) => void) => void;
  showAlert?: (message: string, callback?: () => void) => void;
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup?: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }>;
  }, callback?: (buttonId: string) => void) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: EitaaBackButton;
  BottomButton?: EitaaBottomButton;
  SettingsButton?: EitaaSettingsButton;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  openEitaaLink?: (url: string) => void;
  sendData?: (data: string) => void;
}

declare global {
  interface Window {
    Eitaa?: {
      WebApp: EitaaWebApp;
    };
  }
}

