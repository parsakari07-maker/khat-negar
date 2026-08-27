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
  FeedbackReport
} from '../src/types.js';

interface StoredUser extends Omit<User, 'ip_count' | 'active_sessions_count'> {
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
  getUserById(id: string): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    return this.enrichUser(user);
  }

  getUserByUsername(username: string): StoredUser | null {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.data.users.find(u => u.username.toLowerCase() === cleanUsername);
    return user || null;
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

  private enrichUser(storedUser: StoredUser): User {
    const userLogs = this.data.login_logs.filter(l => l.user_id === storedUser.id && l.status === 'success');
    const uniqueIps = new Set(userLogs.map(l => l.ip_address));
    const activeSessions = this.data.sessions.filter(
      s => s.user_id === storedUser.id && new Date(s.expires_at) > new Date()
    );

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
      is_suspicious: storedUser.is_suspicious || false
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
      timestamp: new Date().toISOString()
    };
    this.data.generation_logs.unshift(log);
    if (this.data.generation_logs.length > 10000) {
      this.data.generation_logs = this.data.generation_logs.slice(0, 10000);
    }
    this.saveDatabase();
  }

  getGenerationStats(): {
    totalGenerations: number;
    totalGenerateAgain: number;
    recentGenerations: GenerationLog[];
  } {
    const total = this.data.generation_logs.length;
    const again = this.data.generation_logs.filter(g => g.is_generate_again).length;
    return {
      totalGenerations: total,
      totalGenerateAgain: again,
      recentGenerations: this.data.generation_logs.slice(0, 20)
    };
  }

  // --- Dashboard Aggregates ---
  getDashboardStats() {
    const users = this.data.users;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    const pendingSecurityEvents = this.data.security_events.filter(e => e.status === 'pending').length;
    const totalGenerations = this.data.generation_logs.length;
    const totalGenerateAgain = this.data.generation_logs.filter(g => g.is_generate_again).length;
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
      pendingSecurityEvents,
      totalGenerations,
      totalGenerateAgain,
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
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status ON feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON master_prompts(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_typography_styles_active ON typography_styles(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_id, timestamp);

-- 4. ROW LEVEL SECURITY POLICIES (Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typography_styles ENABLE ROW LEVEL SECURITY;

-- Note: All privileged operations route via server-side service role.
`;
  }
}

export const db = new DatabaseEngine();
