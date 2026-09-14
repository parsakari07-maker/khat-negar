-- Supabase PostgreSQL Schema for Persian Typography AI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT NOT NULL,
    device_info TEXT,
    success BOOLEAN NOT NULL,
    fail_reason TEXT,
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
    name VARCHAR(100),
    email VARCHAR(255),
    type VARCHAR(30) NOT NULL CHECK (type IN ('report', 'suggestion')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(status);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status ON feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON master_prompts(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_typography_styles_active ON typography_styles(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_generation_logs_daily ON generation_logs(user_id, is_generate_again, timestamp);

-- ========================================================
-- 9. USER SUBSCRIPTION SYSTEM & LIMITS (Safe Migration)
-- ========================================================
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) NOT NULL DEFAULT 'free';
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_activated_by VARCHAR(100) DEFAULT NULL;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'unlimited',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    activated_by VARCHAR(100) NOT NULL DEFAULT 'admin',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_status, is_unlimited);

