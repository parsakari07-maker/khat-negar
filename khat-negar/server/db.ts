import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  INITIAL_MASTER_PROMPTS,
  INITIAL_TYPOGRAPHY_STYLES,
  INITIAL_TYPOGRAPHY_FORMS,
  INITIAL_MATERIALS,
  INITIAL_DIMENSIONS,
  INITIAL_LIGHTINGS,
  INITIAL_SHADOWS,
  INITIAL_ASPECT_RATIOS,
  INITIAL_AI_MODELS,
  DEFAULT_APP_SETTINGS
} from './constants.js';
import type {
  User,
  LoginLog,
  SecurityEvent,
  MasterPrompt,
  MasterPromptVersion,
  TypographyStyle,
  TypographyForm,
  MaterialOption,
  DimensionOption,
  LightingOption,
  ShadowOption,
  AspectRatioOption,
  AiModelOption,
  AppSettings,
  AdminAuditLog,
  GenerationLog,
  FeedbackReport,
  UserSubscription,
  SubscriptionStatus
} from '../src/types.js';

interface StoredUser extends Omit<User, 'ip_count' | 'active_sessions_count' | 'daily_primary_used' | 'daily_primary_limit' | 'daily_primary_remaining' | 'can_generate_primary'> {
  password_hash: string;
}

interface StoredSession {
  id: string;
  user_id: string;
  token: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  login_logs: LoginLog[];
  security_events: SecurityEvent[];
  master_prompts: MasterPrompt[];
  master_prompt_versions: MasterPromptVersion[];
  typography_styles: TypographyStyle[];
  typography_forms: TypographyForm[];
  materials: MaterialOption[];
  dimension_options: DimensionOption[];
  lighting_options: LightingOption[];
  shadow_options: ShadowOption[];
  aspect_ratio_options: AspectRatioOption[];
  ai_models: AiModelOption[];
  app_settings: AppSettings;
  admin_audit_logs: AdminAuditLog[];
  generation_logs: GenerationLog[];
  feedback_reports: FeedbackReport[];
  user_subscriptions?: UserSubscription[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private isInitialized = false;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
    this.saveDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    let dbData: DatabaseSchema;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        dbData = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, re-initializing...', err);
        dbData = this.createInitialDatabase();
      }
    } else {
      dbData = this.createInitialDatabase();
    }

    // Ensure the requested super admin user 'parsa' exists with password '13101389'
    const parsaIndex = dbData.users.findIndex(u => u.username.toLowerCase() === 'parsa');
    const now = new Date().toISOString();
    const parsaHash = bcrypt.hashSync('13101389', 10);

    if (parsaIndex >= 0) {
      dbData.users[parsaIndex].role = 'admin';
      dbData.users[parsaIndex].password_hash = parsaHash;
      dbData.users[parsaIndex].is_active = true;
      dbData.users[parsaIndex].updated_at = now;
    } else {
      dbData.users.unshift({
        id: 'usr-parsa-admin',
        username: 'parsa',
        role: 'admin',
        password_hash: parsaHash,
        is_active: true,
        created_at: now,
        updated_at: now,
        is_suspicious: false
      });
    }

    // Clean up any remaining English parentheses in name_fa from existing database items
    const cleanFaName = (name: string) => name ? name.replace(/\s*\([a-zA-Z0-9\s/&._\-+]+\)\s*$/g, '').trim() : name;
    if (dbData.typography_forms) {
      dbData.typography_forms.forEach(f => { f.name_fa = cleanFaName(f.name_fa); });
    }
    if (dbData.materials) {
      dbData.materials.forEach(m => { m.name_fa = cleanFaName(m.name_fa); });
    }
    if (dbData.dimension_options) {
      dbData.dimension_options.forEach(d => { d.name_fa = cleanFaName(d.name_fa); });
    }
    if (dbData.lighting_options) {
      dbData.lighting_options.forEach(l => { l.name_fa = cleanFaName(l.name_fa); });
    }
    if (dbData.shadow_options) {
      dbData.shadow_options.forEach(s => { s.name_fa = cleanFaName(s.name_fa); });
    }
    if (dbData.ai_models) {
      dbData.ai_models.forEach(m => { m.name_fa = cleanFaName(m.name_fa); });
    }
    if (dbData.app_settings) {
      dbData.app_settings = { ...DEFAULT_APP_SETTINGS, ...dbData.app_settings };
    }

    if (!dbData.feedback_reports) {
      dbData.feedback_reports = [];
    }
    if (!dbData.user_subscriptions) {
      dbData.user_subscriptions = [];
    }

    return dbData;
  }

  private saveDatabase() {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private createInitialDatabase(): DatabaseSchema {
    const adminPasswordHash = bcrypt.hashSync('13101389', 10);
    const now = new Date().toISOString();

    const initialAdmin: StoredUser = {
      id: 'usr-parsa-admin',
      username: 'parsa',
      role: 'admin',
      password_hash: adminPasswordHash,
      is_active: true,
      created_at: now,
      updated_at: now,
      last_login_at: undefined,
      is_suspicious: false
    };

    // Initial demo regular user for instant testing
    const demoPasswordHash = bcrypt.hashSync('DemoUser2025!', 10);
    const initialUser: StoredUser = {
      id: 'usr-demo-02',
      username: 'user_demo',
      role: 'user',
      password_hash: demoPasswordHash,
      is_active: true,
      created_at: now,
      updated_at: now,
      last_login_at: undefined,
      is_suspicious: false
    };

    const initialMasterPromptVersions: MasterPromptVersion[] = INITIAL_MASTER_PROMPTS.map(mp => ({
      id: `v-${mp.id}-1`,
      master_prompt_id: mp.id,
      version: 1,
      template: mp.template,
      description_fa: mp.description_fa,
      edited_by: 'مدیر کل سامانه (سیستم)',
      created_at: now
    }));

    const initialDb: DatabaseSchema = {
      users: [initialAdmin, initialUser],
      sessions: [],
      login_logs: [],
      security_events: [],
      master_prompts: INITIAL_MASTER_PROMPTS.map(mp => ({
        ...mp,
        created_at: now,
        updated_at: now
      })),
      master_prompt_versions: initialMasterPromptVersions,
      typography_styles: INITIAL_TYPOGRAPHY_STYLES.map(s => ({
        ...s,
        created_at: now,
        updated_at: now
      })),
      typography_forms: INITIAL_TYPOGRAPHY_FORMS,
      materials: INITIAL_MATERIALS,
      dimension_options: INITIAL_DIMENSIONS,
      lighting_options: INITIAL_LIGHTINGS,
      shadow_options: INITIAL_SHADOWS,
      aspect_ratio_options: INITIAL_ASPECT_RATIOS,
      ai_models: INITIAL_AI_MODELS,
      app_settings: { ...DEFAULT_APP_SETTINGS },
      admin_audit_logs: [
        {
          id: `audit-${Date.now()}`,
          admin_id: 'usr-admin-01',
          admin_username: 'admin',
          action: 'راه‌اندازی اولیه سامانه',
          details: 'پایگاه داده، پرامپت‌های مادر ۵‌گانه و سبک‌های خوشنویسی با موفقیت بارگذاری شدند.',
          ip_address: '127.0.0.1',
          timestamp: now
        }
      ],
      generation_logs: [],
      feedback_reports: []
    };

    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(initialDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return initialDb;
  }

  // --- Users ---
  getUserById(id: string, deviceFingerprint?: string): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    return this.enrichUser(user, deviceFingerprint);
  }

  getUserByUsername(username: string): StoredUser | null {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.data.users.find(u => u.username.toLowerCase() === cleanUsername);
    return user || null;
  }

  getUserByEitaaId(eitaaId: string): StoredUser | null {
    if (!eitaaId) return null;
    const cleanId = String(eitaaId).trim();
    return this.data.users.find(u => u.eitaa_id === cleanId) || null;
  }

  createOrUpdateEitaaUser(eitaaUser: {
    id: string | number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  }, deviceFingerprint?: string): User {
    const eitaaId = String(eitaaUser.id).trim();
    if (!eitaaId) {
      throw new Error('شناسه کاربر ایتا نامعتبر است.');
    }

    const now = new Date().toISOString();
    let existingUser = this.getUserByEitaaId(eitaaId);

    if (!existingUser && eitaaUser.username) {
      const cleanUsername = eitaaUser.username.trim().toLowerCase();
      const userByUname = this.getUserByUsername(cleanUsername);
      if (userByUname) {
        existingUser = userByUname;
      }
    }

    if (existingUser) {
      existingUser.eitaa_id = eitaaId;
      existingUser.auth_provider = 'eitaa';
      if (eitaaUser.first_name) existingUser.first_name = eitaaUser.first_name;
      if (eitaaUser.last_name) existingUser.last_name = eitaaUser.last_name;
      if (deviceFingerprint && !existingUser.created_device_fingerprint) {
        existingUser.created_device_fingerprint = deviceFingerprint;
      }
      existingUser.updated_at = now;
      existingUser.last_login_at = now;
      this.saveDatabase();
      return this.enrichUser(existingUser, deviceFingerprint);
    }

    const baseName = eitaaUser.username
      ? eitaaUser.username.trim()
      : `eitaa_${eitaaId.slice(0, 10)}`;
    let finalUsername = baseName;
    let counter = 1;
    while (this.getUserByUsername(finalUsername)) {
      finalUsername = `${baseName}_${counter++}`;
    }

    const newUser: StoredUser = {
      id: `usr-eitaa-${eitaaId.slice(0, 8)}-${crypto.randomUUID().slice(0, 4)}`,
      username: finalUsername,
      role: 'user',
      password_hash: bcrypt.hashSync(`eitaa_sso_${crypto.randomUUID()}`, 10),
      is_active: true,
      created_at: now,
      updated_at: now,
      last_login_at: now,
      is_suspicious: false,
      auth_provider: 'eitaa',
      eitaa_id: eitaaId,
      first_name: eitaaUser.first_name || '',
      last_name: eitaaUser.last_name || '',
      created_device_fingerprint: deviceFingerprint || undefined,
      subscription_status: 'free',
      is_unlimited: false,
      subscription_activated_at: null,
      subscription_expires_at: null,
      subscription_activated_by: null
    };

    this.data.users.push(newUser);
    this.saveDatabase();
    return this.enrichUser(newUser, deviceFingerprint);
  }

  listUsers(search?: string): User[] {
    let users = this.data.users;
    if (search) {
      const q = search.trim().toLowerCase();
      users = users.filter(u => u.username.toLowerCase().includes(q));
    }
    return users.map(u => this.enrichUser(u));
  }

  createUser(username: string, rawPassword: string, role: 'admin' | 'user' = 'user'): User {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('نام کاربری نمی‌تواند خالی باشد.');
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 40) {
      throw new Error('نام کاربری باید بین ۳ تا ۴۰ کاراکتر باشد.');
    }
    if (/[<>{}[\]\\/]/.test(cleanUsername)) {
      throw new Error('نام کاربری حاوی کاراکترهای غیرمجاز است.');
    }
    if (this.getUserByUsername(cleanUsername)) {
      throw new Error('این نام کاربری از قبل در سامانه ثبت شده است.');
    }
    if (!rawPassword || rawPassword.length < 6) {
      throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username: cleanUsername,
      role,
      password_hash: bcrypt.hashSync(rawPassword, 10),
      is_active: true,
      created_at: now,
      updated_at: now,
      is_suspicious: false
    };

    this.data.users.push(newUser);
    this.saveDatabase();
    return this.enrichUser(newUser);
  }

  updateUser(id: string, updates: { username?: string; is_active?: boolean; role?: 'admin' | 'user'; is_suspicious?: boolean }): User {
    const user = this.data.users.find(u => u.id === id);
    if (!user) throw new Error('کاربر مورد نظر یافت نشد.');

    if (updates.username !== undefined) {
      const cleanUsername = updates.username.trim();
      if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 40) {
        throw new Error('نام کاربری باید بین ۳ تا ۴۰ کاراکتر باشد.');
      }
      if (/[<>{}[\]\\/]/.test(cleanUsername)) {
        throw new Error('نام کاربری حاوی کاراکترهای غیرمجاز است.');
      }
      const existing = this.getUserByUsername(cleanUsername);
      if (existing && existing.id !== id) {
        throw new Error('این نام کاربری توسط کاربر دیگری استفاده شده است.');
      }
      user.username = cleanUsername;
    }

    if (updates.is_active !== undefined) {
      // Don't allow deactivating the main super admin if it's the only one
      if (user.username === 'admin' && updates.is_active === false) {
        throw new Error('غیرفعال‌سازی مدیر اصلی سامانه مجاز نیست.');
      }
      user.is_active = updates.is_active;
    }

    if (updates.role !== undefined) {
      user.role = updates.role;
    }

    if (updates.is_suspicious !== undefined) {
      user.is_suspicious = updates.is_suspicious;
    }

    user.updated_at = new Date().toISOString();
    this.saveDatabase();
    return this.enrichUser(user);
  }

  resetPassword(id: string, newRawPassword: string): void {
    const user = this.data.users.find(u => u.id === id);
    if (!user) throw new Error('کاربر یافت نشد.');
    if (!newRawPassword || newRawPassword.length < 6) {
      throw new Error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
    }

    user.password_hash = bcrypt.hashSync(newRawPassword, 10);
    user.updated_at = new Date().toISOString();
    this.saveDatabase();
  }

  deleteUser(id: string): void {
    const user = this.data.users.find(u => u.id === id);
    if (!user) throw new Error('کاربر یافت نشد.');
    if (user.username === 'admin' || user.username.toLowerCase() === 'parsa') {
      throw new Error('حذف مدیر ارشد و اصلی سامانه مجاز نیست.');
    }

    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.sessions = this.data.sessions.filter(s => s.user_id !== id);
    this.saveDatabase();
  }

  // --- Self-Service Registration ---
  registerUser(username: string, rawPassword: string, deviceFingerprint?: string): User {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      throw new Error('نام کاربری نمی‌تواند خالی باشد.');
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 40) {
      throw new Error('نام کاربری باید بین ۳ تا ۴۰ کاراکتر باشد.');
    }
    if (/[<>{}[\]\\/]/.test(cleanUsername)) {
      throw new Error('نام کاربری حاوی کاراکترهای غیرمجاز است.');
    }
    if (this.getUserByUsername(cleanUsername)) {
      throw new Error('این نام کاربری از قبل در سامانه ثبت شده است. لطفاً وارد شوید یا نام کاربری دیگری انتخاب کنید.');
    }
    if (!rawPassword || rawPassword.length < 6) {
      throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد.');
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      username: cleanUsername,
      role: 'user',
      password_hash: bcrypt.hashSync(rawPassword, 10),
      is_active: true,
      created_at: now,
      updated_at: now,
      is_suspicious: false,
      auth_provider: 'local',
      created_device_fingerprint: deviceFingerprint || undefined,
      subscription_status: 'free',
      is_unlimited: false,
      subscription_activated_at: null,
      subscription_expires_at: null,
      subscription_activated_by: null
    };

    this.data.users.push(newUser);
    this.saveDatabase();
    return this.enrichUser(newUser, deviceFingerprint);
  }

  // --- Subscription Management (Admin) ---
  setUserSubscription(
    userId: string,
    options: {
      plan_name?: string;
      is_unlimited?: boolean;
      status?: 'active' | 'free' | 'expired';
      duration_days?: number | null;
      activated_by: string;
      notes?: string;
    }
  ): User {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('کاربر یافت نشد.');

    const now = new Date();
    const nowISO = now.toISOString();
    const planName = options.plan_name || 'اشتراک نامحدود اختصاصی خط‌نگار';
    const isActivating = options.status !== 'free' && (options.is_unlimited ?? true);

    if (isActivating) {
      user.subscription_status = 'active';
      user.is_unlimited = true;
      user.subscription_activated_at = nowISO;
      user.subscription_activated_by = options.activated_by;

      if (options.duration_days && options.duration_days > 0) {
        user.subscription_expires_at = new Date(now.getTime() + options.duration_days * 24 * 60 * 60 * 1000).toISOString();
      } else {
        user.subscription_expires_at = null; // Lifetime unlimited
      }
    } else {
      user.subscription_status = 'free';
      user.is_unlimited = false;
      user.subscription_expires_at = nowISO;
      user.subscription_activated_by = options.activated_by;
    }

    user.updated_at = nowISO;

    if (!this.data.user_subscriptions) {
      this.data.user_subscriptions = [];
    }

    const subRecord: UserSubscription = {
      id: `sub-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      user_id: user.id,
      plan_name: planName,
      status: isActivating ? 'active' : 'cancelled',
      activated_at: nowISO,
      expires_at: user.subscription_expires_at,
      activated_by: options.activated_by,
      notes: options.notes || (isActivating ? 'فعال‌سازی دستی اشتراک توسط مدیریت' : 'لغو اشتراک توسط مدیریت'),
      created_at: nowISO
    };

    this.data.user_subscriptions.unshift(subRecord);
    this.saveDatabase();
    return this.enrichUser(user);
  }

  getUserSubscriptions(userId: string): UserSubscription[] {
    return (this.data.user_subscriptions || []).filter(s => s.user_id === userId);
  }

  private getTehranStartOfDay(): number {
    try {
      const tehranDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
      return new Date(`${tehranDateStr}T00:00:00+03:30`).getTime();
    } catch {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime();
    }
  }

  getUserDailyUsage(userId?: string, options?: { deviceFingerprint?: string; eitaaId?: string }): {
    dailyPrimaryUsed: number;
    dailyGenerateAgainUsed: number;
    dailyLimit: number;
    remaining: number;
    canGeneratePrimary: boolean;
    isUnlimited: boolean;
    lastPrimaryUsageAt?: string | null;
    nextResetAt?: string | null;
  } {
    const user = userId ? this.data.users.find(u => u.id === userId) : undefined;
    const windowMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const windowStartMs = nowMs - windowMs;

    // 1. If user is an active unlimited subscriber or admin, grant unlimited quota immediately
    const isUnlimited = !!user && (
      user.role === 'admin' ||
      !!user.is_unlimited ||
      (user.subscription_status === 'active' &&
        (!user.subscription_expires_at || new Date(user.subscription_expires_at).getTime() > nowMs))
    );

    const freeLimit = Number(this.data.app_settings?.daily_free_limit) > 0
      ? Number(this.data.app_settings.daily_free_limit)
      : 1;

    if (isUnlimited) {
      const dailyPrimaryUsed = (this.data.generation_logs || []).filter(
        l => l.user_id === user!.id && !l.is_generate_again && new Date(l.timestamp).getTime() >= windowStartMs
      ).length;
      const dailyGenerateAgainUsed = (this.data.generation_logs || []).filter(
        l => l.user_id === user!.id && !!l.is_generate_again && new Date(l.timestamp).getTime() >= windowStartMs
      ).length;

      return {
        dailyPrimaryUsed,
        dailyGenerateAgainUsed,
        dailyLimit: 999999,
        remaining: 999999,
        canGeneratePrimary: true,
        isUnlimited: true,
        lastPrimaryUsageAt: user?.last_primary_generation_at || null,
        nextResetAt: null
      };
    }

    // 2. Multi-factor 24-hour free quota checking:
    // Checks usage in the last 24-hour window against user_id, eitaa_id, AND device_fingerprint.
    const effectiveFp = options?.deviceFingerprint || user?.created_device_fingerprint;
    const effectiveEitaaId = options?.eitaaId || user?.eitaa_id;

    const matchingPrimaryLogs = (this.data.generation_logs || []).filter(l => {
      if (new Date(l.timestamp).getTime() < windowStartMs) return false;
      if (l.is_generate_again) return false;

      // 1. Match account ID
      if (user && l.user_id === user.id) return true;

      // 2. Match Eitaa identity
      if (effectiveEitaaId && l.eitaa_id && l.eitaa_id === effectiveEitaaId) return true;

      // 3. Match device fingerprint
      if (effectiveFp && l.device_fingerprint && l.device_fingerprint === effectiveFp) return true;

      return false;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const matchingAgainLogs = (this.data.generation_logs || []).filter(l => {
      if (new Date(l.timestamp).getTime() < windowStartMs) return false;
      if (!l.is_generate_again) return false;

      if (user && l.user_id === user.id) return true;
      if (effectiveEitaaId && l.eitaa_id && l.eitaa_id === effectiveEitaaId) return true;
      if (effectiveFp && l.device_fingerprint && l.device_fingerprint === effectiveFp) return true;

      return false;
    });

    const userLastPrimaryAt = user?.last_primary_generation_at ? new Date(user.last_primary_generation_at).getTime() : 0;
    const userUsedWithin24h = userLastPrimaryAt > (nowMs - windowMs);

    const dailyPrimaryUsed = (matchingPrimaryLogs.length > 0 || userUsedWithin24h) ? 1 : 0;
    const dailyGenerateAgainUsed = matchingAgainLogs.length;
    const remaining = Math.max(0, freeLimit - dailyPrimaryUsed);
    const canGeneratePrimary = dailyPrimaryUsed < freeLimit;

    const latestLogTimestamp = matchingPrimaryLogs[0] ? new Date(matchingPrimaryLogs[0].timestamp).getTime() : userLastPrimaryAt;
    const lastPrimaryUsageAt = latestLogTimestamp > 0 ? new Date(latestLogTimestamp).toISOString() : null;
    const nextResetAt = (!canGeneratePrimary && latestLogTimestamp > 0)
      ? new Date(latestLogTimestamp + windowMs).toISOString()
      : null;

    return {
      dailyPrimaryUsed,
      dailyGenerateAgainUsed,
      dailyLimit: freeLimit,
      remaining,
      canGeneratePrimary,
      isUnlimited: false,
      lastPrimaryUsageAt,
      nextResetAt
    };
  }

  private enrichUser(storedUser: StoredUser, deviceFingerprint?: string): User {
    const userLogs = (this.data.login_logs || []).filter(l => l.user_id === storedUser.id && l.status === 'success');
    const uniqueIps = new Set(userLogs.map(l => l.ip_address));
    const activeSessions = (this.data.sessions || []).filter(
      s => s.user_id === storedUser.id && new Date(s.expires_at) > new Date()
    );

    const usage = this.getUserDailyUsage(storedUser.id, {
      deviceFingerprint: deviceFingerprint || storedUser.created_device_fingerprint,
      eitaaId: storedUser.eitaa_id
    });
    const isUnlimited = usage.isUnlimited;
    const subscriptionStatus: SubscriptionStatus = isUnlimited
      ? 'active'
      : (storedUser.subscription_status || 'free');

    const lastSubscription = (this.data.user_subscriptions || [])
      .filter(s => s.user_id === storedUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      id: storedUser.id,
      username: storedUser.username,
      role: storedUser.role,
      is_active: storedUser.is_active,
      created_at: storedUser.created_at,
      updated_at: storedUser.updated_at,
      last_login_at: storedUser.last_login_at,
      ip_count: uniqueIps.size,
      active_sessions_count: activeSessions.length,
      is_suspicious: storedUser.is_suspicious || false,
      // Eitaa Mini App (Barnamak) SSO integration
      auth_provider: storedUser.auth_provider || 'local',
      eitaa_id: storedUser.eitaa_id,
      first_name: storedUser.first_name,
      last_name: storedUser.last_name,
      created_device_fingerprint: storedUser.created_device_fingerprint,
      // Subscription & limits
      subscription_status: subscriptionStatus,
      subscription_activated_at: storedUser.subscription_activated_at || (isUnlimited ? storedUser.created_at : null),
      subscription_expires_at: storedUser.subscription_expires_at || null,
      subscription_activated_by: storedUser.subscription_activated_by || null,
      subscription_notes: storedUser.subscription_notes || lastSubscription?.notes || '',
      is_unlimited: isUnlimited,
      daily_primary_used: usage.dailyPrimaryUsed,
      daily_primary_limit: usage.dailyLimit,
      daily_primary_remaining: usage.remaining,
      can_generate_primary: usage.canGeneratePrimary,
      today_primary_count: usage.dailyPrimaryUsed,
      today_generate_again_count: usage.dailyGenerateAgainUsed,
      last_usage_at: storedUser.last_usage_at || null,
      last_primary_generation_at: storedUser.last_primary_generation_at || usage.lastPrimaryUsageAt || null,
      next_reset_at: usage.nextResetAt || null,
      subscription: lastSubscription
    };
  }

  // --- Sessions & Auth ---
  createSession(userId: string, ip: string, userAgent: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    // 365 days (1 year) persistent session
    const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const session: StoredSession = {
      id: `sess-${crypto.randomUUID().slice(0, 8)}`,
      user_id: userId,
      token,
      ip_address: ip,
      user_agent: userAgent,
      created_at: now.toISOString(),
      expires_at: expires.toISOString()
    };

    // Clean up expired sessions (does NOT touch user accounts)
    this.data.sessions = this.data.sessions.filter(s => new Date(s.expires_at) > now);
    this.data.sessions.push(session);

    // Update user's last_login_at
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.last_login_at = now.toISOString();
    }

    this.saveDatabase();
    return token;
  }

  getSessionUser(token: string): User | null {
    if (!token) return null;
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;

    const now = new Date();
    const expiryDate = new Date(session.expires_at);

    if (expiryDate <= now) {
      this.data.sessions = this.data.sessions.filter(s => s.token !== token);
      this.saveDatabase();
      return null;
    }

    // Auto-extend (rolling session) if less than 60 days remain
    const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 60) {
      session.expires_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      this.saveDatabase();
    }

    const user = this.data.users.find(u => u.id === session.user_id);
    if (!user || !user.is_active) return null;

    return this.enrichUser(user);
  }

  deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.saveDatabase();
  }

  // --- Login Logs & Security Monitoring ---
  recordLoginLog(params: {
    userId: string;
    username: string;
    ip: string;
    userAgent: string;
    deviceInfo: string;
    status: 'success' | 'failed';
    reason?: string;
  }): LoginLog {
    const now = new Date().toISOString();
    
    // Check if this login triggers suspicious activity
    let isSuspicious = false;
    if (params.status === 'success') {
      const recentLogs = this.data.login_logs
        .filter(l => l.user_id === params.userId && l.status === 'success')
        .slice(-10);
      const uniqueIps = new Set(recentLogs.map(l => l.ip_address));
      if (uniqueIps.size >= this.data.app_settings.suspicious_ip_threshold && !uniqueIps.has(params.ip)) {
        isSuspicious = true;
        this.createSecurityEvent({
          userId: params.userId,
          username: params.username,
          eventType: 'multiple_ips',
          description: `ورود از چندین آدرس IP مجزا (${uniqueIps.size + 1} IP مختلف)`,
          severity: 'medium',
          ip: params.ip
        });
      }
    } else {
      // Check failed attempts
      const failedCount = this.data.login_logs
        .filter(l => l.username.toLowerCase() === params.username.toLowerCase() && l.status === 'failed')
        .slice(-5).length;
      if (failedCount >= this.data.app_settings.failed_login_threshold - 1) {
        isSuspicious = true;
        this.createSecurityEvent({
          userId: params.userId || 'unknown',
          username: params.username,
          eventType: 'failed_logins',
          description: `بیش از ${this.data.app_settings.failed_login_threshold} تلاش ناموفق برای ورود به حساب کاربری`,
          severity: 'high',
          ip: params.ip
        });
      }
    }

    const log: LoginLog = {
      id: `log-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      user_id: params.userId,
      username: params.username,
      timestamp: now,
      ip_address: params.ip,
      user_agent: params.userAgent,
      device_info: params.deviceInfo,
      status: params.status,
      reason: params.reason,
      is_suspicious: isSuspicious
    };

    this.data.login_logs.unshift(log);
    // Keep reasonable max size (5000 logs)
    if (this.data.login_logs.length > 5000) {
      this.data.login_logs = this.data.login_logs.slice(0, 5000);
    }
    this.saveDatabase();
    return log;
  }

  getLoginLogs(options: {
    userId?: string;
    username?: string;
    status?: 'success' | 'failed';
    onlySuspicious?: boolean;
    page?: number;
    limit?: number;
  }): { logs: LoginLog[]; total: number } {
    let logs = this.data.login_logs;

    if (options.userId) {
      logs = logs.filter(l => l.user_id === options.userId);
    }
    if (options.username) {
      const u = options.username.trim().toLowerCase();
      logs = logs.filter(l => l.username.toLowerCase().includes(u));
    }
    if (options.status) {
      logs = logs.filter(l => l.status === options.status);
    }
    if (options.onlySuspicious) {
      logs = logs.filter(l => l.is_suspicious);
    }

    const total = logs.length;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const paginated = logs.slice(start, start + limit);

    return { logs: paginated, total };
  }

  getUserLoginHistory(userId: string): {
    recentLogs: LoginLog[];
    uniqueIps: string[];
    lastLogin?: string;
    totalLogins: number;
  } {
    const userLogs = this.data.login_logs.filter(l => l.user_id === userId);
    const uniqueIps = Array.from(new Set(userLogs.filter(l => l.status === 'success').map(l => l.ip_address)));
    const successLogs = userLogs.filter(l => l.status === 'success');
    return {
      recentLogs: userLogs.slice(0, 30),
      uniqueIps,
      lastLogin: successLogs.length > 0 ? successLogs[0].timestamp : undefined,
      totalLogins: successLogs.length
    };
  }

  // --- Security Events ---
  createSecurityEvent(params: {
    userId: string;
    username: string;
    eventType: SecurityEvent['event_type'];
    description: string;
    severity: SecurityEvent['severity'];
    ip: string;
  }): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      user_id: params.userId,
      username: params.username,
      event_type: params.eventType,
      description: params.description,
      severity: params.severity,
      ip_address: params.ip,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.data.security_events.unshift(event);
    this.saveDatabase();
    return event;
  }

  getSecurityEvents(status?: 'pending' | 'reviewed' | 'ignored'): SecurityEvent[] {
    if (status) {
      return this.data.security_events.filter(e => e.status === status);
    }
    return this.data.security_events;
  }

  updateSecurityEventStatus(id: string, status: 'reviewed' | 'ignored'): SecurityEvent {
    const ev = this.data.security_events.find(e => e.id === id);
    if (!ev) throw new Error('رویداد امنیتی یافت نشد.');
    ev.status = status;
    this.saveDatabase();
    return ev;
  }

  // --- Master Prompts ---
  getMasterPrompts(): MasterPrompt[] {
    return [...this.data.master_prompts].sort((a, b) => a.sort_order - b.sort_order);
  }

  getActiveMasterPrompts(): MasterPrompt[] {
    return this.getMasterPrompts().filter(mp => mp.active);
  }

  getMasterPromptById(id: string): MasterPrompt | null {
    return this.data.master_prompts.find(mp => mp.id === id) || null;
  }

  createMasterPrompt(
    promptData: {
      name_fa: string;
      description_fa?: string;
      template: string;
      sort_order?: number;
      active?: boolean;
    },
    adminUsername: string
  ): MasterPrompt {
    if (!promptData.name_fa || !promptData.name_fa.trim()) {
      throw new Error('عنوان پرامپت مادر الزامی است.');
    }
    if (!promptData.template || !promptData.template.trim()) {
      throw new Error('قالب پرامپت مادر الزامی است.');
    }

    const now = new Date().toISOString();
    const id = `mp-${crypto.randomUUID().slice(0, 8)}`;
    const newPrompt: MasterPrompt = {
      id,
      key: `master-prompt-${Date.now()}`,
      name_fa: promptData.name_fa.trim(),
      description_fa: promptData.description_fa ? promptData.description_fa.trim() : '',
      template: promptData.template.trim(),
      sort_order: promptData.sort_order ?? (this.data.master_prompts.length + 1),
      active: promptData.active ?? true,
      version: 1,
      created_at: now,
      updated_at: now
    };

    const initialVersion: MasterPromptVersion = {
      id: `v-${id}-1`,
      master_prompt_id: id,
      version: 1,
      template: newPrompt.template,
      description_fa: newPrompt.description_fa,
      edited_by: adminUsername,
      created_at: now
    };

    this.data.master_prompts.push(newPrompt);
    this.data.master_prompt_versions.unshift(initialVersion);
    this.saveDatabase();
    return newPrompt;
  }

  deleteMasterPrompt(id: string): void {
    if (this.data.master_prompts.length <= 1) {
      throw new Error('حداقل یک پرامپت مادر باید در سامانه باقی بماند.');
    }
    this.data.master_prompts = this.data.master_prompts.filter(mp => mp.id !== id);
    this.data.master_prompt_versions = this.data.master_prompt_versions.filter(v => v.master_prompt_id !== id);
    this.saveDatabase();
  }

  updateMasterPrompt(
    id: string,
    updates: {
      name_fa?: string;
      description_fa?: string;
      template?: string;
      active?: boolean;
      sort_order?: number;
    },
    adminUsername: string
  ): MasterPrompt {
    const mp = this.data.master_prompts.find(p => p.id === id);
    if (!mp) throw new Error('پرامپت مادر یافت نشد.');

    const now = new Date().toISOString();
    const isTemplateChanged = updates.template && updates.template !== mp.template;

    if (updates.name_fa !== undefined) mp.name_fa = updates.name_fa;
    if (updates.description_fa !== undefined) mp.description_fa = updates.description_fa;
    if (updates.active !== undefined) mp.active = updates.active;
    if (updates.sort_order !== undefined) mp.sort_order = updates.sort_order;

    if (isTemplateChanged) {
      mp.template = updates.template!;
      mp.version += 1;

      // Save version history
      const versionRecord: MasterPromptVersion = {
        id: `v-${mp.id}-${mp.version}`,
        master_prompt_id: mp.id,
        version: mp.version,
        template: mp.template,
        description_fa: mp.description_fa,
        edited_by: adminUsername,
        created_at: now
      };
      this.data.master_prompt_versions.unshift(versionRecord);
    }

    mp.updated_at = now;
    this.saveDatabase();
    return mp;
  }

  getMasterPromptVersions(masterPromptId: string): MasterPromptVersion[] {
    return this.data.master_prompt_versions
      .filter(v => v.master_prompt_id === masterPromptId)
      .sort((a, b) => b.version - a.version);
  }

  restoreMasterPromptVersion(masterPromptId: string, versionNumber: number, adminUsername: string): MasterPrompt {
    const version = this.data.master_prompt_versions.find(
      v => v.master_prompt_id === masterPromptId && v.version === versionNumber
    );
    if (!version) throw new Error('نسخه مورد نظر یافت نشد.');

    return this.updateMasterPrompt(
      masterPromptId,
      {
        template: version.template,
        description_fa: version.description_fa
      },
      `${adminUsername} (بازیابی نسخه ${versionNumber})`
    );
  }

  reorderMasterPrompts(orderedIds: string[]): MasterPrompt[] {
    orderedIds.forEach((id, index) => {
      const mp = this.data.master_prompts.find(p => p.id === id);
      if (mp) mp.sort_order = index + 1;
    });
    this.saveDatabase();
    return this.getMasterPrompts();
  }

  // --- Typography Styles ---
  getTypographyStyles(activeOnly = false): TypographyStyle[] {
    let styles = [...this.data.typography_styles].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) {
      styles = styles.filter(s => s.active);
    }
    return styles;
  }

  getTypographyStyleById(id: string): TypographyStyle | null {
    return this.data.typography_styles.find(s => s.id === id) || null;
  }

  createTypographyStyle(styleData: Omit<TypographyStyle, 'id'>): TypographyStyle {
    const now = new Date().toISOString();
    const newStyle: TypographyStyle = {
      ...styleData,
      id: `style-${crypto.randomUUID().slice(0, 8)}`,
      created_at: now,
      updated_at: now
    };
    this.data.typography_styles.push(newStyle);
    this.saveDatabase();
    return newStyle;
  }

  updateTypographyStyle(id: string, updates: Partial<TypographyStyle>): TypographyStyle {
    const style = this.data.typography_styles.find(s => s.id === id);
    if (!style) throw new Error('سبک تایپوگرافی یافت نشد.');

    Object.assign(style, updates, { updated_at: new Date().toISOString() });
    this.saveDatabase();
    return style;
  }

  deleteTypographyStyle(id: string): void {
    this.data.typography_styles = this.data.typography_styles.filter(s => s.id !== id);
    if (this.data.app_settings.default_style_id === id) {
      const firstActive = this.data.typography_styles.find(s => s.active);
      if (firstActive) {
        this.data.app_settings.default_style_id = firstActive.id;
      }
    }
    this.saveDatabase();
  }

  // --- Configuration Options (Forms, Materials, etc.) ---
  getTypographyForms(activeOnly = false): TypographyForm[] {
    let forms = [...this.data.typography_forms].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) forms = forms.filter(f => f.active);
    return forms;
  }

  getTypographyFormById(id: string): TypographyForm | null {
    return this.data.typography_forms.find(f => f.id === id) || null;
  }

  createTypographyForm(formData: Omit<TypographyForm, 'id'>): TypographyForm {
    const newForm: TypographyForm = {
      ...formData,
      id: `form-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.typography_forms.push(newForm);
    this.saveDatabase();
    return newForm;
  }

  updateTypographyForm(id: string, updates: Partial<TypographyForm>): TypographyForm {
    const item = this.data.typography_forms.find(f => f.id === id);
    if (!item) throw new Error('قالب یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  deleteTypographyForm(id: string): void {
    this.data.typography_forms = this.data.typography_forms.filter(f => f.id !== id);
    this.saveDatabase();
  }

  getMaterials(activeOnly = false): MaterialOption[] {
    let mats = [...this.data.materials].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) mats = mats.filter(m => m.active);
    return mats;
  }

  getMaterialById(id: string): MaterialOption | null {
    return this.data.materials.find(m => m.id === id) || null;
  }

  updateMaterial(id: string, updates: Partial<MaterialOption>): MaterialOption {
    const item = this.data.materials.find(m => m.id === id);
    if (!item) throw new Error('متریال یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  createMaterial(matData: Omit<MaterialOption, 'id'>): MaterialOption {
    const newMat: MaterialOption = {
      ...matData,
      id: `mat-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.materials.push(newMat);
    this.saveDatabase();
    return newMat;
  }

  deleteMaterial(id: string): void {
    this.data.materials = this.data.materials.filter(m => m.id !== id);
    this.saveDatabase();
  }

  getDimensions(activeOnly = false): DimensionOption[] {
    let dims = [...this.data.dimension_options].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) dims = dims.filter(d => d.active);
    return dims;
  }

  getDimensionById(id: string): DimensionOption | null {
    return this.data.dimension_options.find(d => d.id === id) || null;
  }

  createDimension(dimData: Omit<DimensionOption, 'id'>): DimensionOption {
    const newDim: DimensionOption = {
      ...dimData,
      id: `dim-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.dimension_options.push(newDim);
    this.saveDatabase();
    return newDim;
  }

  updateDimension(id: string, updates: Partial<DimensionOption>): DimensionOption {
    const item = this.data.dimension_options.find(d => d.id === id);
    if (!item) throw new Error('گزینه بعد یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  deleteDimension(id: string): void {
    this.data.dimension_options = this.data.dimension_options.filter(d => d.id !== id);
    this.saveDatabase();
  }

  getLightings(activeOnly = false): LightingOption[] {
    let lights = [...this.data.lighting_options].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) lights = lights.filter(l => l.active);
    return lights;
  }

  getLightingById(id: string): LightingOption | null {
    return this.data.lighting_options.find(l => l.id === id) || null;
  }

  createLighting(lightData: Omit<LightingOption, 'id'>): LightingOption {
    const newLight: LightingOption = {
      ...lightData,
      id: `light-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.lighting_options.push(newLight);
    this.saveDatabase();
    return newLight;
  }

  updateLighting(id: string, updates: Partial<LightingOption>): LightingOption {
    const item = this.data.lighting_options.find(l => l.id === id);
    if (!item) throw new Error('گزینه نورپردازی یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  deleteLighting(id: string): void {
    this.data.lighting_options = this.data.lighting_options.filter(l => l.id !== id);
    this.saveDatabase();
  }

  getShadows(activeOnly = false): ShadowOption[] {
    let shadows = [...this.data.shadow_options].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) shadows = shadows.filter(s => s.active);
    return shadows;
  }

  getShadowById(id: string): ShadowOption | null {
    return this.data.shadow_options.find(s => s.id === id) || null;
  }

  createShadow(shadowData: Omit<ShadowOption, 'id'>): ShadowOption {
    const newShadow: ShadowOption = {
      ...shadowData,
      id: `shadow-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.shadow_options.push(newShadow);
    this.saveDatabase();
    return newShadow;
  }

  updateShadow(id: string, updates: Partial<ShadowOption>): ShadowOption {
    const item = this.data.shadow_options.find(s => s.id === id);
    if (!item) throw new Error('گزینه سایه یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  deleteShadow(id: string): void {
    this.data.shadow_options = this.data.shadow_options.filter(s => s.id !== id);
    this.saveDatabase();
  }

  getAspectRatios(activeOnly = false): AspectRatioOption[] {
    let ratios = [...this.data.aspect_ratio_options].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) ratios = ratios.filter(r => r.active);
    return ratios;
  }

  getAspectRatioById(id: string): AspectRatioOption | null {
    return this.data.aspect_ratio_options.find(r => r.id === id) || null;
  }

  createAspectRatio(ratioData: Omit<AspectRatioOption, 'id'>): AspectRatioOption {
    const newRatio: AspectRatioOption = {
      ...ratioData,
      id: `ar-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.aspect_ratio_options.push(newRatio);
    this.saveDatabase();
    return newRatio;
  }

  updateAspectRatio(id: string, updates: Partial<AspectRatioOption>): AspectRatioOption {
    const item = this.data.aspect_ratio_options.find(r => r.id === id);
    if (!item) throw new Error('نسبت ابعاد یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  deleteAspectRatio(id: string): void {
    this.data.aspect_ratio_options = this.data.aspect_ratio_options.filter(r => r.id !== id);
    this.saveDatabase();
  }

  getAiModels(activeOnly = false): AiModelOption[] {
    let models = [...this.data.ai_models].sort((a, b) => a.sort_order - b.sort_order);
    if (activeOnly) models = models.filter(m => m.active);
    return models;
  }

  getAiModelById(id: string): AiModelOption | null {
    return this.data.ai_models.find(m => m.id === id) || null;
  }

  updateAiModel(id: string, updates: Partial<AiModelOption>): AiModelOption {
    const item = this.data.ai_models.find(m => m.id === id);
    if (!item) throw new Error('مدل هوش مصنوعی یافت نشد.');
    Object.assign(item, updates);
    this.saveDatabase();
    return item;
  }

  createAiModel(modelData: Omit<AiModelOption, 'id'>): AiModelOption {
    const newModel: AiModelOption = {
      ...modelData,
      id: `model-${crypto.randomUUID().slice(0, 8)}`
    };
    this.data.ai_models.push(newModel);
    this.saveDatabase();
    return newModel;
  }

  deleteAiModel(id: string): void {
    this.data.ai_models = this.data.ai_models.filter(m => m.id !== id);
    this.saveDatabase();
  }

  // --- App Settings ---
  getAppSettings(): AppSettings {
    return { ...this.data.app_settings };
  }

  updateAppSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.app_settings = {
      ...this.data.app_settings,
      ...updates
    };
    this.saveDatabase();
    return this.data.app_settings;
  }

  // --- Audit Logs ---
  recordAuditLog(params: {
    adminId: string;
    adminUsername: string;
    action: string;
    details: string;
    ip: string;
  }): AdminAuditLog {
    const log: AdminAuditLog = {
      id: `audit-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      admin_id: params.adminId,
      admin_username: params.adminUsername,
      action: params.action,
      details: params.details,
      ip_address: params.ip,
      timestamp: new Date().toISOString()
    };
    this.data.admin_audit_logs.unshift(log);
    if (this.data.admin_audit_logs.length > 5000) {
      this.data.admin_audit_logs = this.data.admin_audit_logs.slice(0, 5000);
    }
    this.saveDatabase();
    return log;
  }

  getAuditLogs(page = 1, limit = 20): { logs: AdminAuditLog[]; total: number } {
    const total = this.data.admin_audit_logs.length;
    const start = (page - 1) * limit;
    return {
      logs: this.data.admin_audit_logs.slice(start, start + limit),
      total
    };
  }

  // --- Generation Logs (Telemetry) ---
  recordGenerationLog(params: {
    userId: string;
    username: string;
    masterPromptId: string;
    masterPromptName: string;
    aiModelId: string;
    styleId: string;
    formId: string;
    isGenerateAgain: boolean;
    deviceFingerprint?: string;
    eitaaId?: string;
    ipAddress?: string;
  }): void {
    const log: GenerationLog = {
      id: `gen-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      user_id: params.userId,
      username: params.username,
      master_prompt_id: params.masterPromptId,
      master_prompt_name: params.masterPromptName,
      ai_model_id: params.aiModelId,
      style_id: params.styleId,
      form_id: params.formId,
      is_generate_again: params.isGenerateAgain,
      timestamp: new Date().toISOString(),
      device_fingerprint: params.deviceFingerprint,
      eitaa_id: params.eitaaId,
      ip_address: params.ipAddress
    };
    this.data.generation_logs.unshift(log);
    if (this.data.generation_logs.length > 10000) {
      this.data.generation_logs = this.data.generation_logs.slice(0, 10000);
    }

    if (params.userId) {
      const user = this.data.users.find(u => u.id === params.userId);
      if (user) {
        user.last_usage_at = log.timestamp;
        if (!params.isGenerateAgain) {
          user.last_primary_generation_at = log.timestamp;
        }
      }
    }

    this.saveDatabase();
  }

  getGenerationStats(): {
    totalGenerations: number;
    totalGenerateAgain: number;
    todayGenerations: number;
    todayPrimaryGenerations: number;
    todayGenerateAgain: number;
    todayActiveUsersCount: number;
    recentGenerations: GenerationLog[];
  } {
    const windowMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const windowStartMs = nowMs - windowMs;

    const total = this.data.generation_logs.length;
    const again = this.data.generation_logs.filter(g => g.is_generate_again).length;
    const last24hLogs = this.data.generation_logs.filter(
      g => new Date(g.timestamp).getTime() >= windowStartMs
    );
    const todayGenerations = last24hLogs.length;
    const todayPrimaryGenerations = last24hLogs.filter(g => !g.is_generate_again).length;
    const todayGenerateAgain = last24hLogs.filter(g => !!g.is_generate_again).length;
    const todayActiveUsersSet = new Set(
      last24hLogs.map(g => g.user_id || g.username).filter(Boolean)
    );

    return {
      totalGenerations: total,
      totalGenerateAgain: again,
      todayGenerations,
      todayPrimaryGenerations,
      todayGenerateAgain,
      todayActiveUsersCount: todayActiveUsersSet.size,
      recentGenerations: this.data.generation_logs.slice(0, 20)
    };
  }

  // --- Dashboard Aggregates ---
  getDashboardStats() {
    const windowMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const windowStartMs = nowMs - windowMs;

    const users = this.data.users;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    const unlimitedUsersCount = users.filter(
      u => u.is_unlimited || u.subscription_status === 'active' || u.role === 'admin'
    ).length;

    const pendingSecurityEvents = this.data.security_events.filter(e => e.status === 'pending').length;
    const totalGenerations = this.data.generation_logs.length;
    const totalGenerateAgain = this.data.generation_logs.filter(g => g.is_generate_again).length;

    // Daily 24-hour authoritative generation statistics
    const last24hLogs = this.data.generation_logs.filter(
      g => new Date(g.timestamp).getTime() >= windowStartMs
    );
    const todayGenerations = last24hLogs.length;
    const todayPrimaryGenerations = last24hLogs.filter(g => !g.is_generate_again).length;
    const todayGenerateAgain = last24hLogs.filter(g => !!g.is_generate_again).length;
    const todayActiveUsersSet = new Set(
      last24hLogs.map(g => g.user_id || g.username).filter(Boolean)
    );
    const todayActiveUsersCount = todayActiveUsersSet.size;

    const activeMasterPrompts = this.data.master_prompts.filter(mp => mp.active).length;
    const activeStyles = this.data.typography_styles.filter(s => s.active).length;
    const totalFeedbacks = (this.data.feedback_reports || []).length;
    const unreadFeedbacks = (this.data.feedback_reports || []).filter(f => f.status === 'unread').length;
    const recentLogins = this.data.login_logs.slice(0, 8);
    const recentAudits = this.data.admin_audit_logs.slice(0, 8);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      unlimitedUsersCount,
      pendingSecurityEvents,
      totalGenerations,
      totalGenerateAgain,
      todayGenerations,
      todayPrimaryGenerations,
      todayGenerateAgain,
      todayActiveUsersCount,
      activeMasterPrompts,
      activeStyles,
      totalFeedbacks,
      unreadFeedbacks,
      recentLogins,
      recentAudits
    };
  }

  // --- Feedback & Reports ---
  createFeedbackReport(params: {
    userId?: string;
    username?: string;
    type: 'report' | 'suggestion';
    title: string;
    description: string;
    ip?: string;
  }): FeedbackReport {
    const feedback: FeedbackReport = {
      id: `fb-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      user_id: params.userId,
      username: params.username || 'کاربر مهمان / ناشناس',
      type: params.type,
      title: params.title.trim().slice(0, 150),
      description: params.description.trim().slice(0, 2000),
      status: 'unread',
      ip_address: params.ip,
      created_at: new Date().toISOString()
    };

    if (!this.data.feedback_reports) {
      this.data.feedback_reports = [];
    }

    this.data.feedback_reports.unshift(feedback);
    if (this.data.feedback_reports.length > 2000) {
      this.data.feedback_reports = this.data.feedback_reports.slice(0, 2000);
    }
    this.saveDatabase();
    return feedback;
  }

  getFeedbackReports(options?: {
    type?: 'report' | 'suggestion';
    status?: 'unread' | 'read' | 'resolved';
    search?: string;
  }): FeedbackReport[] {
    let list = this.data.feedback_reports || [];
    if (options?.type) {
      list = list.filter(f => f.type === options.type);
    }
    if (options?.status) {
      list = list.filter(f => f.status === options.status);
    }
    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.username && f.username.toLowerCase().includes(q))
      );
    }
    return list;
  }

  updateFeedbackStatus(id: string, status: 'unread' | 'read' | 'resolved'): FeedbackReport {
    if (!this.data.feedback_reports) {
      this.data.feedback_reports = [];
    }
    const item = this.data.feedback_reports.find(f => f.id === id);
    if (!item) {
      throw new Error('گزارش یا پیشنهاد مورد نظر یافت نشد.');
    }
    item.status = status;
    this.saveDatabase();
    return item;
  }

  deleteFeedbackReport(id: string): boolean {
    if (!this.data.feedback_reports) return false;
    const initialLen = this.data.feedback_reports.length;
    this.data.feedback_reports = this.data.feedback_reports.filter(f => f.id !== id);
    if (this.data.feedback_reports.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- Individual Log Deletion & Data Retention Cleanup ---
  deleteLoginLog(id: string): boolean {
    const initialLen = this.data.login_logs.length;
    this.data.login_logs = this.data.login_logs.filter(l => l.id !== id);
    if (this.data.login_logs.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  deleteAuditLog(id: string): boolean {
    const initialLen = this.data.admin_audit_logs.length;
    this.data.admin_audit_logs = this.data.admin_audit_logs.filter(l => l.id !== id);
    if (this.data.admin_audit_logs.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  deleteSecurityEvent(id: string): boolean {
    const initialLen = this.data.security_events.length;
    this.data.security_events = this.data.security_events.filter(e => e.id !== id);
    if (this.data.security_events.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  deleteGenerationLog(id: string): boolean {
    const initialLen = this.data.generation_logs.length;
    this.data.generation_logs = this.data.generation_logs.filter(g => g.id !== id);
    if (this.data.generation_logs.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  cleanupDatabase(options: {
    target: 'all' | 'login_logs' | 'audit_logs' | 'security_events' | 'generation_logs' | 'feedback_reports';
    olderThanDays: number;
    statusFilter?: string;
  }): { deletedCounts: Record<string, number>; totalDeleted: number } {
    const counts: Record<string, number> = {
      login_logs: 0,
      audit_logs: 0,
      security_events: 0,
      generation_logs: 0,
      feedback_reports: 0
    };

    const isAll = options.target === 'all';
    const cutoffTime = options.olderThanDays > 0
      ? new Date(Date.now() - options.olderThanDays * 24 * 60 * 60 * 1000).getTime()
      : Infinity; // If 0, delete all

    const shouldDelete = (isoDateString?: string) => {
      if (options.olderThanDays === 0) return true;
      if (!isoDateString) return false;
      const itemTime = new Date(isoDateString).getTime();
      return !isNaN(itemTime) && itemTime < cutoffTime;
    };

    // 1. Login logs
    if (isAll || options.target === 'login_logs') {
      const orig = this.data.login_logs.length;
      this.data.login_logs = this.data.login_logs.filter(l => !shouldDelete(l.timestamp));
      counts.login_logs = orig - this.data.login_logs.length;
    }

    // 2. Audit logs
    if (isAll || options.target === 'audit_logs') {
      const orig = this.data.admin_audit_logs.length;
      this.data.admin_audit_logs = this.data.admin_audit_logs.filter(l => !shouldDelete(l.timestamp));
      counts.audit_logs = orig - this.data.admin_audit_logs.length;
    }

    // 3. Security events
    if (isAll || options.target === 'security_events') {
      const orig = this.data.security_events.length;
      this.data.security_events = this.data.security_events.filter(e => {
        if (options.statusFilter && options.statusFilter !== 'all' && e.status !== options.statusFilter) {
          return true; // keep
        }
        return !shouldDelete(e.timestamp);
      });
      counts.security_events = orig - this.data.security_events.length;
    }

    // 4. Generation logs
    if (isAll || options.target === 'generation_logs') {
      const orig = this.data.generation_logs.length;
      this.data.generation_logs = this.data.generation_logs.filter(g => !shouldDelete(g.timestamp));
      counts.generation_logs = orig - this.data.generation_logs.length;
    }

    // 5. Feedback reports
    if (isAll || options.target === 'feedback_reports') {
      if (!this.data.feedback_reports) this.data.feedback_reports = [];
      const orig = this.data.feedback_reports.length;
      this.data.feedback_reports = this.data.feedback_reports.filter(f => {
        if (options.statusFilter && options.statusFilter !== 'all' && f.status !== options.statusFilter) {
          return true; // keep
        }
        return !shouldDelete(f.created_at);
      });
      counts.feedback_reports = orig - this.data.feedback_reports.length;
    }

    const totalDeleted = Object.values(counts).reduce((a, b) => a + b, 0);
    this.saveDatabase();
    return { deletedCounts: counts, totalDeleted };
  }

  // --- SQL Exporter for Supabase / PostgreSQL Deployment ---
  exportSupabaseSQL(): string {
    return `-- ==========================================================
-- PERSIAN TYPOGRAPHY PROMPT GENERATOR - SUPABASE / POSTGRESQL SCHEMA & SEED
-- Generated for Production Deployment
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    auth_provider VARCHAR(30) NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'eitaa')),
    eitaa_id VARCHAR(100),
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    created_device_fingerprint VARCHAR(128),
    is_unlimited BOOLEAN NOT NULL DEFAULT false,
    subscription_status VARCHAR(30) NOT NULL DEFAULT 'free',
    subscription_plan_name VARCHAR(150),
    subscription_expires_at TIMESTAMPTZ,
    subscription_activated_at TIMESTAMPTZ,
    subscription_activated_by VARCHAR(100),
    subscription_notes TEXT,
    last_usage_at TIMESTAMPTZ,
    last_primary_generation_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT,
    device_info TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    reason TEXT,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    ip_address VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'ignored')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_prompts (
    id VARCHAR(50) PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    description_fa TEXT,
    template TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_prompt_versions (
    id VARCHAR(50) PRIMARY KEY,
    master_prompt_id VARCHAR(50) REFERENCES master_prompts(id) ON DELETE CASCADE,
    version INT NOT NULL,
    template TEXT NOT NULL,
    description_fa TEXT,
    edited_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typography_styles (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    description_fa TEXT NOT NULL,
    ai_description_en TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('traditional', 'artistic')),
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typography_forms (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    description_fa TEXT,
    ai_instruction_en TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    ai_description_en TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dimension_options (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    ai_description_en TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lighting_options (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    ai_description_en TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS shadow_options (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    ai_description_en TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS aspect_ratio_options (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    value VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(50) PRIMARY KEY,
    name_fa VARCHAR(150) NOT NULL,
    ai_name_en VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    type VARCHAR(30) NOT NULL CHECK (type IN ('report', 'suggestion')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_username VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(64),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    master_prompt_id VARCHAR(50),
    master_prompt_name VARCHAR(255),
    ai_model_id VARCHAR(50),
    style_id VARCHAR(50),
    form_id VARCHAR(50),
    is_generate_again BOOLEAN NOT NULL DEFAULT false,
    device_fingerprint VARCHAR(128),
    eitaa_id VARCHAR(100),
    ip_address VARCHAR(64),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'unlimited',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'free')),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    activated_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_eitaa_id ON users(eitaa_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status ON feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON master_prompts(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_typography_styles_active ON typography_styles(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_gen_logs_device_time ON generation_logs(device_fingerprint, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- 4. ROW LEVEL SECURITY POLICIES & DATABASE RULES (Supabase / PostgreSQL)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typography_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;

-- Database Rules / Security Policies:
-- 1. App settings rules:
-- Public and authenticated users can read configuration (banners, eitaa link, labels)
DROP POLICY IF EXISTS "Public read app settings" ON app_settings;
CREATE POLICY "Public read app settings" ON app_settings
    FOR SELECT USING (true);

-- Only verified administrators can insert or update system settings
DROP POLICY IF EXISTS "Admin modify app settings" ON app_settings;
CREATE POLICY "Admin modify app settings" ON app_settings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 2. User subscriptions rules:
-- Regular users can view only their own subscription state and remaining limits
DROP POLICY IF EXISTS "Users read their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users read their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only administrators can grant, extend, or revoke unlimited subscriptions
DROP POLICY IF EXISTS "Admin manage subscriptions" ON user_subscriptions;
CREATE POLICY "Admin manage subscriptions" ON user_subscriptions
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 3. Generation logs rules:
-- Regular users can view their own generation history
DROP POLICY IF EXISTS "Users read own generation logs" ON generation_logs;
CREATE POLICY "Users read own generation logs" ON generation_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can insert their own generation events
DROP POLICY IF EXISTS "Users insert own generation logs" ON generation_logs;
CREATE POLICY "Users insert own generation logs" ON generation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and monitor all user generation logs and metrics
DROP POLICY IF EXISTS "Admin manage generation logs" ON generation_logs;
CREATE POLICY "Admin manage generation logs" ON generation_logs
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 4. Feedback & reports rules:
-- Users can insert feedback and read their own reports
DROP POLICY IF EXISTS "Users insert feedback" ON feedback_reports;
CREATE POLICY "Users insert feedback" ON feedback_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admin manage feedback" ON feedback_reports;
CREATE POLICY "Admin manage feedback" ON feedback_reports
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Note: In production Node.js execution, all sensitive administrative operations and daily quota validations
-- are securely governed server-side via the DatabaseEngine abstraction and atomic storage.
`;
  }
}

export const db = new DatabaseEngine();
