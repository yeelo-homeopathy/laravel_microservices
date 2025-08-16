-- =============================================================================
-- E-COMMERCE MICROSERVICES PLATFORM - COMPLETE DATABASE DUMP
-- =============================================================================
-- This file contains the complete database schema for all microservices
-- Run this script to set up all databases and tables with sample data
-- =============================================================================

-- Create databases for each microservice
CREATE DATABASE IF NOT EXISTS ecommerce_core;
CREATE DATABASE IF NOT EXISTS ecommerce_identity;
CREATE DATABASE IF NOT EXISTS ecommerce_inventory;
CREATE DATABASE IF NOT EXISTS ecommerce_orders;
CREATE DATABASE IF NOT EXISTS ecommerce_payments;

-- =============================================================================
-- CORE DATABASE (Laravel API Gateway)
-- =============================================================================
\c ecommerce_core;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150),
    description TEXT,
    module VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- User roles junction table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- User addresses table
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping' CHECK (type IN ('billing', 'shipping')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(150),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL,
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event store for event sourcing
CREATE TABLE event_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    version INTEGER NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (aggregate_id, version),
    INDEX (aggregate_type),
    INDEX (event_type),
    INDEX (occurred_at)
);

-- Event snapshots for performance
CREATE TABLE event_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    snapshot_data JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aggregate_id, aggregate_type)
);

-- Application settings table
CREATE TABLE application_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log for audit trails
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_name VARCHAR(100),
    description TEXT NOT NULL,
    subject_type VARCHAR(100),
    subject_id UUID,
    causer_type VARCHAR(100),
    causer_id UUID,
    properties JSONB DEFAULT '{}',
    batch_uuid UUID,
    event VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (subject_type, subject_id),
    INDEX (causer_type, causer_id),
    INDEX (log_name),
    INDEX (created_at)
);

-- =============================================================================
-- IDENTITY DATABASE
-- =============================================================================
\c ecommerce_identity;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for identity service
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    last_login_at TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (session_token),
    INDEX (expires_at)
);

-- User login attempts table
CREATE TABLE user_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (email),
    INDEX (ip_address),
    INDEX (attempted_at)
);

-- =============================================================================
-- ORDERS DATABASE
-- =============================================================================
\c ecommerce_orders;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    billing_address JSONB,
    shipping_address JSONB,
    notes TEXT,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    INDEX (status),
    INDEX (order_number),
    INDEX (created_at)
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_variant_id UUID,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    product_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_id),
    INDEX (product_id)
);

-- Order status history table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    notes TEXT,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_id),
    INDEX (changed_at)
);

-- =============================================================================
-- PAYMENTS DATABASE
-- =============================================================================
\c ecommerce_payments;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
    currency VARCHAR(3) DEFAULT 'USD',
    amount_cents INTEGER NOT NULL,
    fee_cents INTEGER DEFAULT 0,
    net_amount_cents INTEGER NOT NULL,
    gateway_response JSONB,
    failure_reason TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (order_id),
    INDEX (gateway_transaction_id),
    INDEX (status),
    INDEX (created_at)
);

-- Payment refunds table
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    refund_amount_cents INTEGER NOT NULL,
    reason TEXT,
    gateway_refund_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    gateway_response JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (payment_id),
    INDEX (status)
);

-- =============================================================================
-- INVENTORY DATABASE
-- =============================================================================
\c ecommerce_inventory;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table (basic product info for inventory)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    track_inventory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (sku),
    INDEX (status)
);

-- Product variants table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    attributes JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (product_id),
    INDEX (sku)
);

-- Inventory levels table
CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_incoming INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, variant_id, location_id),
    INDEX (location_id),
    INDEX (quantity_available)
);

-- Inventory movements table
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (product_id, variant_id),
    INDEX (location_id),
    INDEX (movement_type),
    INDEX (created_at)
);

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert sample roles
\c ecommerce_core;

INSERT INTO roles (name, display_name, description) VALUES
('super_admin', 'Super Administrator', 'Full system access'),
('admin', 'Administrator', 'Administrative access'),
('manager', 'Manager', 'Management access'),
('staff', 'Staff Member', 'Staff access'),
('customer', 'Customer', 'Customer access');

-- Insert sample permissions
INSERT INTO permissions (name, display_name, module) VALUES
('users.view', 'View Users', 'users'),
('users.create', 'Create Users', 'users'),
('users.edit', 'Edit Users', 'users'),
('users.delete', 'Delete Users', 'users'),
('products.view', 'View Products', 'products'),
('products.create', 'Create Products', 'products'),
('products.edit', 'Edit Products', 'products'),
('products.delete', 'Delete Products', 'products'),
('orders.view', 'View Orders', 'orders'),
('orders.create', 'Create Orders', 'orders'),
('orders.edit', 'Edit Orders', 'orders'),
('orders.delete', 'Delete Orders', 'orders'),
('payments.view', 'View Payments', 'payments'),
('payments.process', 'Process Payments', 'payments'),
('inventory.view', 'View Inventory', 'inventory'),
('inventory.manage', 'Manage Inventory', 'inventory'),
('analytics.view', 'View Analytics', 'analytics'),
('settings.manage', 'Manage Settings', 'settings');

-- Insert sample application settings
INSERT INTO application_settings (key, value, type, description, is_public) VALUES
('site_name', 'E-commerce Platform', 'string', 'Site name', true),
('site_description', 'Advanced e-commerce platform with microservices', 'string', 'Site description', true),
('default_currency', 'USD', 'string', 'Default currency', true),
('tax_rate', '0.08', 'string', 'Default tax rate', false),
('shipping_rate', '10.00', 'string', 'Default shipping rate', false),
('enable_inventory_tracking', 'true', 'boolean', 'Enable inventory tracking', false),
('low_stock_threshold', '10', 'integer', 'Low stock alert threshold', false),
('order_number_prefix', 'ORD-', 'string', 'Order number prefix', false);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_settings_updated_at BEFORE UPDATE ON application_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Success message
SELECT 'Database setup completed successfully!' as status;
