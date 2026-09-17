import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import officialLogoImg from '../assets/images/khatnegar_official_logo_1787668816488.jpg';
import { apiFetch } from '../utils/api.js';
import type { AppSettings } from '../types.js';

export const DEFAULT_CLIENT_SETTINGS: AppSettings = {
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

  // Subscription, Daily Limit & Eitaa Integration
  eitaa_channel_url: 'https://eitaa.com/khatnegarTypographicCraft',
  eitaa_channel_name_fa: 'کانال رسمی خط‌نگار در ایتا',
  subscription_plans_title_fa: 'طرح‌های اشتراک نامحدود خط‌نگار',
  daily_limit_message_fa: 'سقف تولید روزانه حساب‌های رایگان ۱ پرامپت اصلی در هر روز است.',
  daily_limit_badge_unlimited_fa: 'وضعیت حساب: اشتراک نامحدود فعال ✨',
  daily_limit_badge_free_fa: 'سهمیه رایگان امروز: {remaining} از {limit} پرامپت اصلی باقی‌مانده',
  daily_limit_free_subtext_fa: 'امکان «تولید دوباره» پرامپت‌های قبلی کاملاً نامحدود و رایگان است ✨',
  daily_limit_exceeded_title_fa: 'سقف ۱ پرامپت رایگان امروز شما استفاده شده است',
  daily_limit_exceeded_desc_fa: '💡 نکته مهم: امکان «تولید دوباره» برای پرامپت‌های قبلی شما همچنان کاملاً نامحدود و رایگان است!',
  daily_limit_upgrade_prompt_fa: 'برای ارتقا به اشتراک نامحدود و حذف سقف روزانه، به کانال ایتا مراجعه فرمایید:',
  daily_limit_eitaa_btn_text_fa: 'کانال ایتا خط‌نگار',
  daily_free_limit: 1,

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
  suspicious_ip_threshold: 2,
  failed_login_threshold: 5
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  logoUrl: string;
  isCustom: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  setCustomLogo: (newLogo: string) => Promise<boolean>;
  resetLogo: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem('app_system_settings');
      if (cached) {
        return { ...DEFAULT_CLIENT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {}
    return DEFAULT_CLIENT_SETTINGS;
  });

  const [customLogo, setCustomLogoState] = useState<string | null>(() => {
    return localStorage.getItem('app_custom_logo') || null;
  });

  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const { ok, data } = await apiFetch<{
        success: boolean;
        settings?: AppSettings;
      }>('/api/public/settings');

      if (ok && data.success && data.settings) {
        const merged = { ...DEFAULT_CLIENT_SETTINGS, ...data.settings };
        setSettings(merged);
        localStorage.setItem('app_system_settings', JSON.stringify(merged));
        if (merged.custom_logo_url) {
          setCustomLogoState(merged.custom_logo_url);
          localStorage.setItem('app_custom_logo', merged.custom_logo_url);
        } else if (data.settings.custom_logo_url === '') {
          setCustomLogoState(null);
          localStorage.removeItem('app_custom_logo');
        }
      }
    } catch (err) {
      // Keep cached
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const updatedMerged = { ...settings, ...newSettings };
      setSettings(updatedMerged);
      localStorage.setItem('app_system_settings', JSON.stringify(updatedMerged));

      if (newSettings.custom_logo_url !== undefined) {
        if (newSettings.custom_logo_url) {
          setCustomLogoState(newSettings.custom_logo_url);
          localStorage.setItem('app_custom_logo', newSettings.custom_logo_url);
        } else {
          setCustomLogoState(null);
          localStorage.removeItem('app_custom_logo');
        }
      }

      const { ok, data } = await apiFetch<{ success: boolean; settings?: AppSettings }>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(updatedMerged)
      });

      if (ok && data.success && data.settings) {
        const serverMerged = { ...DEFAULT_CLIENT_SETTINGS, ...data.settings };
        setSettings(serverMerged);
        localStorage.setItem('app_system_settings', JSON.stringify(serverMerged));
        window.dispatchEvent(new CustomEvent('app_settings_changed', { detail: serverMerged }));
        return true;
      }
      window.dispatchEvent(new CustomEvent('app_settings_changed', { detail: updatedMerged }));
      return ok;
    } catch (err) {
      console.error('Error saving settings:', err);
      return false;
    }
  };

  const setCustomLogo = async (newLogo: string): Promise<boolean> => {
    return await updateSettings({ custom_logo_url: newLogo });
  };

  const resetLogo = async (): Promise<boolean> => {
    return await updateSettings({ custom_logo_url: '' });
  };

  const activeLogoUrl = customLogo || settings.custom_logo_url || officialLogoImg;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        logoUrl: activeLogoUrl,
        isCustom: !!(customLogo || settings.custom_logo_url),
        updateSettings,
        setCustomLogo,
        resetLogo,
        refreshSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
