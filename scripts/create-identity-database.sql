-- Identity Service Database Schema
-- PostgreSQL schema for user authentication and authorization

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create database if it doesn't exist (run this separately)
-- CREATE DATABASE ecom_identity;

-- Connect to the identity database
\c ecom_identity;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    
    -- Account Status
    status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'locked')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,
    
    -- Authentication Provider
    provider VARCHAR(50) DEFAULT 'local' CHECK (provider IN ('local', 'google', 'facebook', 'apple')),
    provider_id VARCHAR(255),
    
    -- Profile Information
    avatar VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10),
    timezone VARCHAR(100),
    locale VARCHAR(10),
    
    -- Preferences and Metadata
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Security and Tracking
    last_login_at TIMESTAMP,
    last_login_ip INET,
    last_login_user_agent TEXT,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    
    -- Tokens
    email_verification_token VARCHAR(255),
    email_verification_token_expires_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_token_expires_at TIMESTAMP,
    refresh_token TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);

-- =============================================================================
-- ROLES TABLE
-- =============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    -- Role Properties
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),
    icon VARCHAR(50),
    
    -- Hierarchy
    parent_id UUID REFERENCES roles(id),
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for roles table
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_system ON roles(is_system);
CREATE INDEX idx_roles_is_active ON roles(is_active);
CREATE INDEX idx_roles_parent_id ON roles(parent_id);

-- =============================================================================
-- PERMISSIONS TABLE
-- =============================================================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    
    -- Permission Structure
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    scope VARCHAR(50),
    
    -- Permission Properties
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for permissions table
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_is_system ON permissions(is_system);
CREATE INDEX idx_permissions_category ON permissions(category);

-- =============================================================================
-- JUNCTION TABLES
-- =============================================================================

-- User Roles Junction Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- =============================================================================
-- USER SESSIONS TABLE
-- =============================================================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Information
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    
    -- Location and Browser
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    
    -- Session Status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_sessions table
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =============================================================================
-- USER LOGIN ATTEMPTS TABLE
-- =============================================================================

CREATE TABLE user_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Attempt Information
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    
    -- Attempt Result
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(255),
    
    -- Timestamps
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_login_attempts table
CREATE INDEX idx_user_login_attempts_user_id ON user_login_attempts(user_id);
CREATE INDEX idx_user_login_attempts_email ON user_login_attempts(email);
CREATE INDEX idx_user_login_attempts_ip_address ON user_login_attempts(ip_address);
CREATE INDEX idx_user_login_attempts_attempted_at ON user_login_attempts(attempted_at);
CREATE INDEX idx_user_login_attempts_success ON user_login_attempts(success);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor Information
    user_id UUID REFERENCES users(id),
    actor_type VARCHAR(50) DEFAULT 'user',
    actor_id VARCHAR(255),
    
    -- Action Information
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old login attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_login_attempts WHERE attempted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default permissions
INSERT INTO permissions (name, display_name, description, resource, action, category, is_system) VALUES
-- User Management
('users.create', 'Create Users', 'Create new user accounts', 'users', 'create', 'User Management', TRUE),
('users.read', 'View Users', 'View user information', 'users', 'read', 'User Management', TRUE),
('users.update', 'Update Users', 'Update user information', 'users', 'update', 'User Management', TRUE),
('users.delete', 'Delete Users', 'Delete user accounts', 'users', 'delete', 'User Management', TRUE),

-- Role Management
('roles.create', 'Create Roles', 'Create new roles', 'roles', 'create', 'Role Management', TRUE),
('roles.read', 'View Roles', 'View role information', 'roles', 'read', 'Role Management', TRUE),
('roles.update', 'Update Roles', 'Update role information', 'roles', 'update', 'Role Management', TRUE),
('roles.delete', 'Delete Roles', 'Delete roles', 'roles', 'delete', 'Role Management', TRUE),

-- Permission Management
('permissions.read', 'View Permissions', 'View permission information', 'permissions', 'read', 'Permission Management', TRUE),
('permissions.assign', 'Assign Permissions', 'Assign permissions to roles', 'permissions', 'assign', 'Permission Management', TRUE),

-- System Administration
('system.settings', 'System Settings', 'Manage system settings', 'system', 'settings', 'System', TRUE),
('system.logs', 'View System Logs', 'View system and audit logs', 'system', 'logs', 'System', TRUE),
('system.maintenance', 'System Maintenance', 'Perform system maintenance tasks', 'system', 'maintenance', 'System', TRUE);

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system, is_default) VALUES
('super-admin', 'Super Administrator', 'Full system access with all permissions', TRUE, FALSE),
('admin', 'Administrator', 'Administrative access to most system features', TRUE, FALSE),
('user', 'User', 'Standard user with basic permissions', TRUE, TRUE),
('guest', 'Guest', 'Limited access for unauthenticated users', TRUE, FALSE);

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super-admin';

-- Admin gets most permissions except system maintenance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name NOT IN ('system.maintenance');

-- User gets basic read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.action = 'read';

-- Create default super admin user
INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    password, 
    status, 
    email_verified, 
    email_verified_at
) VALUES (
    'Super', 
    'Admin', 
    'admin@ecommerce.local', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password: 'password'
    'active', 
    TRUE, 
    CURRENT_TIMESTAMP
);

-- Assign super-admin role to default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@ecommerce.local' AND r.name = 'super-admin';

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE roles;
ANALYZE permissions;
ANALYZE user_roles;
ANALYZE role_permissions;
ANALYZE user_sessions;
ANALYZE user_login_attempts;
ANALYZE audit_logs;

COMMIT;
