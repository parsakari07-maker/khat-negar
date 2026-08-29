import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { MasterPromptEngine } from './server/promptEngine.js';
import {
  attachClientInfo,
  authenticateSession,
  requireAuth,
  requireAdmin,
  rateLimit,
  verifyPassword,
  normalizePersianDigits,
  cleanInvisibleChars,
  type AuthenticatedRequest
} from './server/auth.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(attachClientInfo);
  app.use(authenticateSession);

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Diagnostic Endpoint (Zero secrets or raw passwords displayed)
  const handleDebugAuth = (req: express.Request, res: express.Response) => {
    const rawUsername = (req.body?.username || req.query?.username || 'parsa') as string;
    const rawPassword = (req.body?.password || req.query?.password || '') as string;
    const cleanUser = normalizePersianDigits(rawUsername.trim()).toLowerCase();

    const storedUser = db.getUserByUsername(cleanUser);
    let hashFormat = 'none';
    let hasHash = false;
    let bcryptExact = false;
    let bcryptNorm = false;

    if (storedUser && storedUser.password_hash) {
      hasHash = true;
      if (storedUser.password_hash.startsWith('$2a$') || storedUser.password_hash.startsWith('$2b$')) {
        hashFormat = `bcrypt (${storedUser.password_hash.slice(0, 4)}... length=${storedUser.password_hash.length})`;
      } else {
        hashFormat = `plain / other (length=${storedUser.password_hash.length})`;
      }

      if (rawPassword) {
        try {
          bcryptExact = bcrypt.compareSync(rawPassword, storedUser.password_hash);
        } catch {}
        try {
          bcryptNorm = verifyPassword(rawPassword, storedUser.password_hash);
        } catch {}
      }
    }

    return res.json({
      success: true,
      diagnostic: {
        runtime: 'Node.js Express Server',
        receivedUsername: rawUsername || null,
        receivedPasswordLength: rawPassword ? rawPassword.length : null,
        hasPersianArabicDigits: rawPassword ? /[۰-۹٠-٩]/.test(rawPassword) : false,
        hasEnglishDigits: rawPassword ? /[0-9]/.test(rawPassword) : false,
        hasInvisibleChars: rawPassword ? /[\u200B\u200C\u200D\uFEFF\u00A0\r\n]/.test(rawPassword) : false,
        normalizationChangesPassword: rawPassword ? (normalizePersianDigits(cleanInvisibleChars(rawPassword).trim()) !== rawPassword) : false,
        userFoundInDb: !!storedUser,
        hasPasswordHash: hasHash,
        hashFormat,
        bcryptExactMatch: rawPassword ? bcryptExact : null,
        bcryptNormalizedMatch: rawPassword ? bcryptNorm : null,
        adminLoginReady: true
      }
    });
  };

  app.get('/api/debug-auth', handleDebugAuth);
  app.post('/api/debug-auth', handleDebugAuth);
  app.get('/api/auth/debug', handleDebugAuth);
  app.post('/api/auth/debug', handleDebugAuth);

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Login
  app.post(
    '/api/auth/login',
    rateLimit(10, 5 * 60 * 1000, 'login'),
    (req: AuthenticatedRequest, res) => {
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({
            success: false,
            error: 'نام کاربری و رمز عبور الزامی است.'
          });
        }

        const cleanUser = normalizePersianDigits(String(username).trim()).toLowerCase();
        const rawPassword = String(password);

        let storedUser = db.getUserByUsername(cleanUser);

        if (!storedUser) {
          db.recordLoginLog({
            userId: 'unknown',
            username: cleanUser,
            ip: req.clientIp || '127.0.0.1',
            userAgent: req.clientUserAgent || '',
            deviceInfo: req.deviceInfo || '',
            status: 'failed',
            reason: 'نام کاربری در سامانه یافت نشد'
          });
          return res.status(401).json({
            success: false,
            error: 'نام کاربری یا رمز عبور اشتباه است.'
          });
        }

        const isMatch = verifyPassword(rawPassword, storedUser.password_hash);
        if (!isMatch) {
          db.recordLoginLog({
            userId: storedUser.id,
            username: storedUser.username,
            ip: req.clientIp || '127.0.0.1',
            userAgent: req.clientUserAgent || '',
            deviceInfo: req.deviceInfo || '',
            status: 'failed',
            reason: 'رمز عبور نادرست'
          });
          return res.status(401).json({
            success: false,
            error: 'نام کاربری یا رمز عبور اشتباه است.'
          });
        }

        if (!storedUser.is_active) {
          db.recordLoginLog({
            userId: storedUser.id,
            username: storedUser.username,
            ip: req.clientIp || '127.0.0.1',
            userAgent: req.clientUserAgent || '',
            deviceInfo: req.deviceInfo || '',
            status: 'failed',
            reason: 'حساب کاربری مسدود / غیرفعال است'
          });
          return res.status(403).json({
            success: false,
            error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.'
          });
        }

        // Successful Login
        const log = db.recordLoginLog({
          userId: storedUser.id,
          username: storedUser.username,
          ip: req.clientIp || '127.0.0.1',
          userAgent: req.clientUserAgent || '',
          deviceInfo: req.deviceInfo || '',
          status: 'success'
        });

        const token = db.createSession(
          storedUser.id,
          req.clientIp || '127.0.0.1',
          req.clientUserAgent || ''
        );

        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year persistent session
        });

        const user = db.getUserById(storedUser.id);
        return res.json({
          success: true,
          token,
          user,
          message: 'با موفقیت وارد شدید.'
        });
      } catch (err: any) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: 'خطای سرور در فرآیند ورود.' });
      }
    }
  );

  // Logout
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      db.deleteSession(token);
    }
    res.clearCookie('auth_token');
    return res.json({ success: true, message: 'با موفقیت خارج شدید.' });
  });

  // Get Session User
  app.get('/api/auth/session', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.json({ success: true, user: null });
    }
    return res.json({ success: true, user: req.user });
  });

  // ==========================================
  // TYPOGRAPHY CONFIGURATION (PUBLIC / AUTH)
  // ==========================================

  app.get('/api/typography/options', (req, res) => {
    try {
      const styles = db.getTypographyStyles(true);
      const forms = db.getTypographyForms(true);
      const materials = db.getMaterials(true);
      const dimensions = db.getDimensions(true);
      const lightings = db.getLightings(true);
      const shadows = db.getShadows(true);
      const aspectRatios = db.getAspectRatios(true);
      const aiModels = db.getAiModels(true);
      const settings = db.getAppSettings();

      return res.json({
        success: true,
        styles,
        forms,
        materials,
        dimensions,
        lightings,
        shadows,
        aspectRatios,
        aiModels,
        settings
      });
    } catch (err: any) {
      console.error('Error fetching typography options:', err);
      return res.status(500).json({ success: false, error: 'خطا در بارگذاری گزینه‌های تایپوگرافی.' });
    }
  });

  // ==========================================
  // PROMPT GENERATION ENGINE ROUTES
  // ==========================================

  // Generate Initial Prompt (Uses Master Prompt #1 or first active)
  app.post(
    '/api/prompts/generate',
    requireAuth,
    rateLimit(30, 60 * 1000, 'gen'),
    (req: AuthenticatedRequest, res) => {
      try {
        const config = req.body;
        const result = MasterPromptEngine.generate(config, {
          isGenerateAgain: false
        });

        // Record telemetry
        db.recordGenerationLog({
          userId: req.user!.id,
          username: req.user!.username,
          masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa,
          aiModelId: config.aiModelId,
          styleId: config.calligraphyStyleId,
          formId: config.typographyFormId,
          isGenerateAgain: false
        });

        return res.json({
          success: true,
          prompt: result.prompt,
          masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa,
          masterPromptIndex: result.masterPromptIndex,
          totalActiveMasterPrompts: result.totalActive,
          message: 'پرامپت با موفقیت تولید شد.'
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: err.message || 'در تولید پرامپت خطایی رخ داد.'
        });
      }
    }
  );

  // Generate Again (Cycles to next active Master Prompt: #2, #3, #4, #5)
  app.post(
    '/api/prompts/generate-again',
    requireAuth,
    rateLimit(30, 60 * 1000, 'gen_again'),
    (req: AuthenticatedRequest, res) => {
      try {
        const { config, currentMasterPromptIndex } = req.body;
        if (!config) {
          return res.status(400).json({ success: false, error: 'تنظیمات ارسال نشده است.' });
        }

        const result = MasterPromptEngine.generate(config, {
          currentMasterPromptIndex: typeof currentMasterPromptIndex === 'number' ? currentMasterPromptIndex : 0,
          isGenerateAgain: true
        });

        // Record telemetry
        db.recordGenerationLog({
          userId: req.user!.id,
          username: req.user!.username,
          masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa,
          aiModelId: config.aiModelId,
          styleId: config.calligraphyStyleId,
          formId: config.typographyFormId,
          isGenerateAgain: true
        });

        return res.json({
          success: true,
          prompt: result.prompt,
          masterPromptId: result.masterPrompt.id,
          masterPromptName: result.masterPrompt.name_fa,
          masterPromptIndex: result.masterPromptIndex,
          totalActiveMasterPrompts: result.totalActive,
          cycleCompleted: result.cycleCompleted,
          message: `پرامپت با استفاده از ${result.masterPrompt.name_fa} بازتولید شد.`
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: err.message || 'در تولید دوباره پرامپت خطایی رخ داد.'
        });
      }
    }
  );

  // Copy Event Telemetry
  app.post('/api/prompts/copy-event', requireAuth, (req: AuthenticatedRequest, res) => {
    return res.json({ success: true });
  });

  // ==========================================
  // ADMIN PANEL ROUTES (requireAdmin)
  // ==========================================

  // Dashboard Stats
  app.get('/api/admin/dashboard', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const stats = db.getDashboardStats();
      const generationStats = db.getGenerationStats();
      return res.json({
        success: true,
        stats: {
          ...stats,
          ...generationStats
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت آمار داشبورد.' });
    }
  });

  // Users CRUD
  app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const search = req.query.search as string;
      const users = db.listUsers(search);
      return res.json({ success: true, users });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت لیست کاربران.' });
    }
  });

  app.post('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { username, password, role } = req.body;
      const newUser = db.createUser(username, password, role || 'user');

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ایجاد کاربر جدید',
        details: `کاربر «${newUser.username}» با نقش «${newUser.role === 'admin' ? 'مدیر' : 'کاربر عادی'}» ایجاد شد.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        user: newUser,
        message: `حساب کاربری «${newUser.username}» با موفقیت ایجاد شد.`
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ایجاد کاربر.' });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { username, is_active, role, is_suspicious } = req.body;
      const updated = db.updateUser(id, { username, is_active, role, is_suspicious });

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش مشخصات کاربر',
        details: `کاربر «${updated.username}» ویرایش شد (وضعیت: ${updated.is_active ? 'فعال' : 'غیرفعال'}).`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        user: updated,
        message: 'اطلاعات کاربر به‌روزرسانی شد.'
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در به‌روزرسانی کاربر.' });
    }
  });

  app.post('/api/admin/users/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const targetUser = db.getUserById(id);
      if (!targetUser) return res.status(404).json({ success: false, error: 'کاربر یافت نشد.' });

      db.resetPassword(id, newPassword);

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'تغییر رمز عبور کاربر',
        details: `رمز عبور کاربر «${targetUser.username}» توسط مدیر بازنشانی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        message: `رمز عبور کاربر «${targetUser.username}» با موفقیت بازنشانی شد.`
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در تغییر رمز عبور.' });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const targetUser = db.getUserById(id);
      if (!targetUser) return res.status(404).json({ success: false, error: 'کاربر یافت نشد.' });

      db.deleteUser(id);

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف حساب کاربری',
        details: `حساب کاربری «${targetUser.username}» به طور کامل حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در حذف کاربر.' });
    }
  });

  app.get('/api/admin/users/:id/history', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const history = db.getUserLoginHistory(id);
      return res.json({ success: true, history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت تاریخچه کاربر.' });
    }
  });

  // Login Logs
  app.get('/api/admin/login-logs', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const username = req.query.username as string;
      const status = req.query.status as 'success' | 'failed' | undefined;
      const onlySuspicious = req.query.suspicious === 'true';

      const result = db.getLoginLogs({
        page,
        limit,
        username,
        status,
        onlySuspicious
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت گزارش ورودها.' });
    }
  });

  // Security Events
  app.get('/api/admin/security-events', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const status = req.query.status as 'pending' | 'reviewed' | 'ignored' | undefined;
      const events = db.getSecurityEvents(status);
      return res.json({ success: true, events });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت رویدادهای امنیتی.' });
    }
  });

  app.patch('/api/admin/security-events/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = db.updateSecurityEventStatus(id, status);

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'بررسی رویداد امنیتی',
        details: `وضعیت رویداد امنیتی ${id} به «${status === 'reviewed' ? 'بررسی شد' : 'نادیده گرفته شد'}» تغییر یافت.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({ success: true, event: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ثبت رویداد امنیتی.' });
    }
  });

  // Master Prompts Management
  app.get('/api/admin/master-prompts', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const prompts = db.getMasterPrompts();
      return res.json({ success: true, prompts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت پرامپت‌های مادر.' });
    }
  });

  app.patch('/api/admin/master-prompts/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name_fa, description_fa, template, active, sort_order } = req.body;

      if (template) {
        const validation = MasterPromptEngine.validateTemplate(template);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'متن پرامپت معتبر نیست.',
            warnings: validation.warnings
          });
        }
      }

      const updated = db.updateMasterPrompt(
        id,
        { name_fa, description_fa, template, active, sort_order },
        req.user!.username
      );

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش پرامپت مادر',
        details: `پرامپت مادر «${updated.name_fa}» ویرایش شد (نسخه جدید: ${updated.version}).`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        prompt: updated,
        message: `پرامپت مادر «${updated.name_fa}» با موفقیت ذخیره شد.`
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش پرامپت مادر.' });
    }
  });

  app.post('/api/admin/master-prompts/reorder', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ success: false, error: 'ترتیب شناسه‌ها الزامی است.' });
      }

      const prompts = db.reorderMasterPrompts(orderedIds);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'تغییر ترتیب پرامپت‌های مادر',
        details: 'ترتیب اولویت اجرای پرامپت‌های مادر بازآرایی شد.',
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({ success: true, prompts, message: 'ترتیب پرامپت‌ها ذخیره شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در تغییر ترتیب.' });
    }
  });

  app.get('/api/admin/master-prompts/:id/versions', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const versions = db.getMasterPromptVersions(id);
      return res.json({ success: true, versions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت تاریخچه نسخه‌ها.' });
    }
  });

  app.post('/api/admin/master-prompts/:id/restore', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { version } = req.body;
      const restored = db.restoreMasterPromptVersion(id, version, req.user!.username);

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'بازیابی نسخه پرامپت مادر',
        details: `پرامپت مادر «${restored.name_fa}» به نسخه ${version} بازیابی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        prompt: restored,
        message: `پرامپت مادر با موفقیت به نسخه ${version} بازیابی گردید.`
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در بازیابی نسخه.' });
    }
  });

  app.post('/api/admin/master-prompts/validate', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { template } = req.body;
      const validation = MasterPromptEngine.validateTemplate(template);
      return res.json({ success: true, validation });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: 'خطا در اعتبارسنجی قالب.' });
    }
  });

  app.post('/api/admin/master-prompts/test-render', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { template, sampleConfig } = req.body;
      const testConfig = sampleConfig || {
        title: 'ایران من',
        calligraphyStyleId: 'style-thuluth',
        typographyFormId: 'form-circle',
        titleColorHex: '#F55951',
        backgroundStatus: 'has_background',
        backgroundColorHex: '#F1E8E6',
        materialId: 'mat-cardboard',
        dimensionId: 'dim-slight',
        lightingId: 'light-soft',
        shadowingId: 'shadow-controlled',
        aspectRatioId: 'ar-1-1',
        aiModelId: 'model-generic'
      };

      const variableMap = MasterPromptEngine.buildVariableMap(testConfig);
      const rendered = MasterPromptEngine.renderTemplate(template, variableMap);

      return res.json({ success: true, rendered });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در تست رندر پرامپت.' });
    }
  });

  // Typography Styles Management
  app.get('/api/admin/styles', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const styles = db.getTypographyStyles(false);
      return res.json({ success: true, styles });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت لیست سبک‌ها.' });
    }
  });

  app.post('/api/admin/styles', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const style = db.createTypographyStyle(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن سبک خوشنویسی',
        details: `سبک جدید «${style.name_fa}» به سامانه اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      return res.json({ success: true, style, message: 'سبک جدید ذخیره شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ثبت سبک.' });
    }
  });

  app.patch('/api/admin/styles/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updated = db.updateTypographyStyle(id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش سبک خوشنویسی',
        details: `سبک «${updated.name_fa}» ویرایش شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      return res.json({ success: true, style: updated, message: 'سبک به‌روزرسانی شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش سبک.' });
    }
  });

  app.delete('/api/admin/styles/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const target = db.getTypographyStyleById(id);
      db.deleteTypographyStyle(id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف سبک خوشنویسی',
        details: `سبک «${target?.name_fa || id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      return res.json({ success: true, message: 'سبک با موفقیت حذف گردید.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در حذف سبک.' });
    }
  });

  // Materials & AI Models & Configuration Options Management
  // Materials
  app.get('/api/admin/materials', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, materials: db.getMaterials(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت لیست متریال‌ها.' });
    }
  });

  app.post('/api/admin/materials', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const mat = db.createMaterial(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن متریال',
        details: `متریال جدید «${mat.name_fa}» با توصیف انگلیسی پرامپت اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, material: mat, message: 'متریال جدید با موفقیت ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت متریال.' });
    }
  });

  app.patch('/api/admin/materials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const mat = db.updateMaterial(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش متریال',
        details: `متریال «${mat.name_fa}» و متن انگلیسی پرامپت آن به‌روزرسانی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, material: mat, message: 'تغییرات متریال ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش متریال.' });
    }
  });

  app.delete('/api/admin/materials/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const mat = db.getMaterialById(req.params.id);
      db.deleteMaterial(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف متریال',
        details: `متریال «${mat?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'متریال با موفقیت حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف متریال.' });
    }
  });

  // AI Models
  app.get('/api/admin/ai-models', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, aiModels: db.getAiModels(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت مدل‌های هوش مصنوعی.' });
    }
  });

  app.post('/api/admin/ai-models', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const model = db.createAiModel(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن مدل هوش مصنوعی',
        details: `مدل هوش مصنوعی جدید «${model.name_fa}» (${model.ai_name_en}) اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, aiModel: model, message: 'مدل هوش مصنوعی با موفقیت ثبت شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت مدل.' });
    }
  });

  app.patch('/api/admin/ai-models/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const model = db.updateAiModel(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش مدل هوش مصنوعی',
        details: `مدل هوش مصنوعی «${model.name_fa}» و دستور انگلیسی پرامپت آن به‌روزرسانی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, aiModel: model, message: 'تغییرات مدل ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش مدل.' });
    }
  });

  app.delete('/api/admin/ai-models/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const model = db.getAiModelById(req.params.id);
      db.deleteAiModel(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف مدل هوش مصنوعی',
        details: `مدل «${model?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'مدل هوش مصنوعی حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف مدل.' });
    }
  });

  // Typography Forms
  app.get('/api/admin/forms', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, forms: db.getTypographyForms(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت فرم‌های ترکیب‌بندی.' });
    }
  });

  app.post('/api/admin/forms', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const form = db.createTypographyForm(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن فرم ترکیب‌بندی',
        details: `فرم ترکیب‌بندی «${form.name_fa}» اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, form, message: 'فرم جدید ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت فرم.' });
    }
  });

  app.patch('/api/admin/forms/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const form = db.updateTypographyForm(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش فرم ترکیب‌بندی',
        details: `فرم «${form.name_fa}» و دستور انگلیسی پرامپت آن به‌روزرسانی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, form, message: 'فرم به‌روزرسانی شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش فرم.' });
    }
  });

  app.delete('/api/admin/forms/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const form = db.getTypographyFormById(req.params.id);
      db.deleteTypographyForm(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف فرم ترکیب‌بندی',
        details: `فرم «${form?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'فرم حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف فرم.' });
    }
  });

  // Dimensions
  app.get('/api/admin/dimensions', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, dimensions: db.getDimensions(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت گزینه‌های بعد.' });
    }
  });

  app.post('/api/admin/dimensions', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const dim = db.createDimension(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن گزینه بعد و برجستگی',
        details: `گزینه بعد «${dim.name_fa}» اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, dimension: dim, message: 'گزینه جدید بعد ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت گزینه بعد.' });
    }
  });

  app.patch('/api/admin/dimensions/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const dim = db.updateDimension(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش گزینه بعد و برجستگی',
        details: `گزینه بعد «${dim.name_fa}» و توصیف انگلیسی آن ویرایش شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, dimension: dim, message: 'گزینه بعد به‌روزرسانی شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش گزینه بعد.' });
    }
  });

  app.delete('/api/admin/dimensions/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const dim = db.getDimensionById(req.params.id);
      db.deleteDimension(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف گزینه بعد',
        details: `گزینه بعد «${dim?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'گزینه بعد حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف گزینه بعد.' });
    }
  });

  // Lightings
  app.get('/api/admin/lightings', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, lightings: db.getLightings(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت گزینه‌های نورپردازی.' });
    }
  });

  app.post('/api/admin/lightings', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const light = db.createLighting(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن گزینه نورپردازی',
        details: `گزینه نورپردازی «${light.name_fa}» اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, lighting: light, message: 'گزینه نورپردازی ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت گزینه نور.' });
    }
  });

  app.patch('/api/admin/lightings/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const light = db.updateLighting(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش گزینه نورپردازی',
        details: `گزینه نورپردازی «${light.name_fa}» و توصیف انگلیسی آن به‌روزرسانی شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, lighting: light, message: 'گزینه نورپردازی به‌روزرسانی شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش گزینه نور.' });
    }
  });

  app.delete('/api/admin/lightings/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const light = db.getLightingById(req.params.id);
      db.deleteLighting(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف گزینه نورپردازی',
        details: `گزینه نور «${light?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'گزینه نورپردازی حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف گزینه نور.' });
    }
  });

  // Shadows
  app.get('/api/admin/shadows', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, shadows: db.getShadows(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت گزینه‌های سایه‌زنی.' });
    }
  });

  app.post('/api/admin/shadows', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const shadow = db.createShadow(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن گزینه سایه‌زنی',
        details: `گزینه سایه «${shadow.name_fa}» اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, shadow, message: 'گزینه سایه‌زنی ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت گزینه سایه.' });
    }
  });

  app.patch('/api/admin/shadows/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const shadow = db.updateShadow(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش گزینه سایه‌زنی',
        details: `گزینه سایه «${shadow.name_fa}» و توصیف انگلیسی آن ویرایش شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, shadow, message: 'گزینه سایه‌زنی به‌روزرسانی شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش گزینه سایه.' });
    }
  });

  app.delete('/api/admin/shadows/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const shadow = db.getShadowById(req.params.id);
      db.deleteShadow(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف گزینه سایه‌زنی',
        details: `گزینه سایه «${shadow?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'گزینه سایه‌زنی حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف گزینه سایه.' });
    }
  });

  // Aspect Ratios
  app.get('/api/admin/aspect-ratios', requireAdmin, (req, res) => {
    try {
      res.json({ success: true, aspectRatios: db.getAspectRatios(false) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'خطا در دریافت نسبت‌های ابعاد.' });
    }
  });

  app.post('/api/admin/aspect-ratios', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const ratio = db.createAspectRatio(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'افزودن نسبت ابعاد تصویر',
        details: `نسبت ابعاد «${ratio.name_fa}» (${ratio.value}) اضافه شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, aspectRatio: ratio, message: 'نسبت ابعاد ذخیره شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ثبت نسبت ابعاد.' });
    }
  });

  app.patch('/api/admin/aspect-ratios/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const ratio = db.updateAspectRatio(req.params.id, req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش نسبت ابعاد تصویر',
        details: `نسبت ابعاد «${ratio.name_fa}» ویرایش شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, aspectRatio: ratio, message: 'نسبت ابعاد به‌روزرسانی شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در ویرایش نسبت ابعاد.' });
    }
  });

  app.delete('/api/admin/aspect-ratios/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const ratio = db.getAspectRatioById(req.params.id);
      db.deleteAspectRatio(req.params.id);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف نسبت ابعاد تصویر',
        details: `نسبت ابعاد «${ratio?.name_fa || req.params.id}» حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });
      res.json({ success: true, message: 'نسبت ابعاد حذف شد.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'خطا در حذف نسبت ابعاد.' });
    }
  });

  // Audit Logs & Settings
  app.get('/api/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = db.getAuditLogs(page, limit);
    return res.json({ success: true, ...result });
  });

  app.get('/api/public/settings', (req, res) => {
    try {
      const settings = db.getAppSettings();
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت تنظیمات عمومی.' });
    }
  });

  app.get('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res) => {
    const settings = db.getAppSettings();
    return res.json({ success: true, settings });
  });

  const handleUpdateSettings = (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const updated = db.updateAppSettings(req.body);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'ویرایش تنظیمات و سرخط‌های سامانه',
        details: 'تنظیمات عمومی، سرخط‌ها، عناوین صفحه ورود، کارت خوش‌آمدگویی و مولد پرامپت به‌روزرسانی شدند.',
        ip: req.clientIp || '127.0.0.1'
      });
      return res.json({ success: true, settings: updated, message: 'تنظیمات با موفقیت ذخیره شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در ذخیره تنظیمات.' });
    }
  };

  app.post('/api/admin/settings', requireAdmin, handleUpdateSettings);
  app.patch('/api/admin/settings', requireAdmin, handleUpdateSettings);

  // ==========================================
  // FEEDBACK & SUGGESTIONS ROUTES
  // ==========================================

  // Public Submit Feedback & Report (with rate limit and character limit protection)
  app.post(
    '/api/feedback/submit',
    rateLimit(8, 5 * 60 * 1000, 'feedback'),
    (req: AuthenticatedRequest, res) => {
      try {
        const { type, title, description } = req.body;

        if (!title || !title.trim()) {
          return res.status(400).json({
            success: false,
            error: 'عنوان گزارش یا پیشنهاد الزامی است.'
          });
        }

        if (!description || !description.trim()) {
          return res.status(400).json({
            success: false,
            error: 'توضیحات تکمیلی الزامی است.'
          });
        }

        if (title.trim().length > 150) {
          return res.status(400).json({
            success: false,
            error: 'عنوان نباید بیش از ۱۵۰ کاراکتر باشد.'
          });
        }

        if (description.trim().length > 2000) {
          return res.status(400).json({
            success: false,
            error: 'توضیحات نباید بیش از ۲۰۰۰ کاراکتر باشد.'
          });
        }

        const validTypes = ['report', 'suggestion'];
        const sanitizedType = validTypes.includes(type) ? type : 'suggestion';

        const record = db.createFeedbackReport({
          userId: req.user?.id,
          username: req.user?.username,
          type: sanitizedType,
          title: title.trim(),
          description: description.trim(),
          ip: req.clientIp || '127.0.0.1'
        });

        return res.json({
          success: true,
          feedback: record,
          message: 'پیام شما با موفقیت ثبت شد و توسط مدیران سامانه بررسی خواهد شد.'
        });
      } catch (err: any) {
        console.error('Feedback submit error:', err);
        return res.status(500).json({
          success: false,
          error: 'خطا در ثبت پیام. لطفاً دوباره تلاش کنید.'
        });
      }
    }
  );

  // Admin Feedback Management
  app.get('/api/admin/feedback', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const type = req.query.type as any;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const feedbacks = db.getFeedbackReports({ type, status, search });
      return res.json({ success: true, feedbacks });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در دریافت لیست گزارش‌ها و پیشنهادات.' });
    }
  });

  app.patch('/api/admin/feedback/:id/status', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['unread', 'read', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, error: 'وضعیت نامعتبر است.' });
      }

      const updated = db.updateFeedbackStatus(id, status);
      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'تغییر وضعیت پیام کاربر',
        details: `وضعیت گزارش/پیشنهاد «${updated.title}» به ${status} تغییر یافت.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({ success: true, feedback: updated, message: 'وضعیت پیام با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در تغییر وضعیت.' });
    }
  });

  app.delete('/api/admin/feedback/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteFeedbackReport(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'پیام یافت نشد.' });
      }

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'حذف گزارش / پیشنهاد کاربر',
        details: `پیام با شناسه ${id} حذف شد.`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({ success: true, message: 'پیام با موفقیت حذف گردید.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message || 'خطا در حذف پیام.' });
    }
  });

  // Individual Deletion Endpoints for Logs and Security Events
  app.delete('/api/admin/login-logs/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteLoginLog(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'لاگ ورود یافت نشد.' });
      }
      return res.json({ success: true, message: 'لاگ ورود با موفقیت حذف گردید.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'خطا در حذف لاگ.' });
    }
  });

  app.delete('/api/admin/audit-logs/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteAuditLog(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'لاگ بازرسی یافت نشد.' });
      }
      return res.json({ success: true, message: 'لاگ بازرسی با موفقیت حذف گردید.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'خطا در حذف لاگ.' });
    }
  });

  app.delete('/api/admin/security-events/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteSecurityEvent(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'رویداد امنیتی یافت نشد.' });
      }
      return res.json({ success: true, message: 'رویداد امنیتی با موفقیت حذف گردید.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'خطا در حذف رویداد.' });
    }
  });

  // Universal Database Maintenance & Data Retention Cleanup Endpoint
  app.post('/api/admin/maintenance/cleanup', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const { target, olderThanDays, statusFilter } = req.body;
      const validTargets = ['all', 'login_logs', 'audit_logs', 'security_events', 'generation_logs', 'feedback_reports'];
      if (!target || !validTargets.includes(target)) {
        return res.status(400).json({ success: false, error: 'بخش هدف برای پاکسازی نامعتبر است.' });
      }

      const days = Number(olderThanDays);
      if (isNaN(days) || days < 0) {
        return res.status(400).json({ success: false, error: 'محدوده زمانی نامعتبر است.' });
      }

      const result = db.cleanupDatabase({
        target,
        olderThanDays: days,
        statusFilter
      });

      db.recordAuditLog({
        adminId: req.user!.id,
        adminUsername: req.user!.username,
        action: 'پاکسازی داده‌های قدیمی دیتابیس',
        details: `پاکسازی ${target} برای رکوردهای قدیمی‌تر از ${days === 0 ? 'همه زمان‌ها' : days + ' روز'}. مجموع رکوردهای حذف‌شده: ${result.totalDeleted}`,
        ip: req.clientIp || '127.0.0.1'
      });

      return res.json({
        success: true,
        message: `عملیات پاکسازی با موفقیت انجام شد (${result.totalDeleted} رکورد پاکسازی گردید).`,
        result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'خطا در عملیات پاکسازی دیتابیس.' });
    }
  });

  // Export Supabase PostgreSQL Migration & Seed SQL
  app.get('/api/admin/export-sql', requireAdmin, (req: AuthenticatedRequest, res) => {
    try {
      const sql = db.exportSupabaseSQL();
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="supabase_schema_and_seed.sql"');
      return res.send(sql);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'خطا در خروجی فایل SQL.' });
    }
  });

  // ==========================================
  // VITE & STATIC FILES SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Persian Typography Prompt Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
