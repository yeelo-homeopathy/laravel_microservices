-- Comprehensive E-commerce Platform Seed Data
-- This script populates all tables with realistic demo data for development and testing

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM inventory_movements;
DELETE FROM order_items;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM user_roles;
DELETE FROM addresses;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM profiles;
DELETE FROM roles;
DELETE FROM application_settings;
DELETE FROM activity_logs;
DELETE FROM event_store;
DELETE FROM event_snapshots;

-- Insert Application Settings
INSERT INTO application_settings (id, key, value, category, description, is_encrypted, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'KAFKA_BROKERS', 'localhost:9092', 'messaging', 'Kafka broker endpoints', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'KAFKA_CLIENT_ID', 'ecommerce-platform', 'messaging', 'Kafka client identifier', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'KAFKA_TOPIC_PREFIX', 'ecommerce', 'messaging', 'Kafka topic prefix', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'JWT_SECRET', 'your-super-secret-jwt-key-change-in-production', 'security', 'JWT signing secret', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'JWT_EXPIRES_IN', '24h', 'security', 'JWT token expiration time', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'PAYMENT_GATEWAY_STRIPE_KEY', 'sk_test_your_stripe_key', 'payment', 'Stripe secret key', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'PAYMENT_GATEWAY_PAYPAL_CLIENT_ID', 'your_paypal_client_id', 'payment', 'PayPal client ID', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'EMAIL_SMTP_HOST', 'smtp.gmail.com', 'email', 'SMTP server host', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'EMAIL_SMTP_PORT', '587', 'email', 'SMTP server port', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'STORE_NAME', 'TechMart Pro', 'general', 'Store display name', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'STORE_CURRENCY', 'USD', 'general', 'Default store currency', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'TAX_RATE', '0.08', 'general', 'Default tax rate', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'SHIPPING_RATE', '9.99', 'general', 'Default shipping rate', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'LOW_STOCK_THRESHOLD', '10', 'inventory', 'Low stock alert threshold', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'ORDER_AUTO_FULFILL', 'false', 'orders', 'Auto-fulfill orders', false, NOW(), NOW());

-- Insert Roles
INSERT INTO roles (id, name, display_name, description, permissions, is_system, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'super_admin', 'Super Administrator', 'Full system access', '["*"]', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'admin', 'Administrator', 'Administrative access', '["users.manage", "products.manage", "orders.manage", "analytics.view", "settings.manage"]', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'manager', 'Store Manager', 'Store management access', '["products.manage", "orders.manage", "inventory.manage", "analytics.view"]', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', 'staff', 'Staff Member', 'Basic staff access', '["orders.view", "products.view", "inventory.view"]', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'customer', 'Customer', 'Customer access', '["profile.manage", "orders.view"]', true, NOW(), NOW());

-- Insert User Profiles
INSERT INTO profiles (id, email, first_name, last_name, phone, avatar_url, role, status, preferences, last_login_at, email_verified_at, metadata, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'admin@techmart.com', 'John', 'Admin', '+1-555-0101', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'admin', 'active', '{"theme": "dark", "notifications": true, "language": "en"}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days', '{"department": "IT", "hire_date": "2023-01-15"}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440031', 'manager@techmart.com', 'Sarah', 'Johnson', '+1-555-0102', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'manager', 'active', '{"theme": "light", "notifications": true, "language": "en"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '25 days', '{"department": "Sales", "hire_date": "2023-02-20"}', NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655440032', 'staff@techmart.com', 'Mike', 'Wilson', '+1-555-0103', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'staff', 'active', '{"theme": "light", "notifications": false, "language": "en"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '20 days', '{"department": "Warehouse", "hire_date": "2023-03-10"}', NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655440033', 'customer1@example.com', 'Emily', 'Davis', '+1-555-0201', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'customer', 'active', '{"theme": "light", "notifications": true, "language": "en"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '15 days', '{"customer_since": "2023-04-01", "total_orders": 12}', NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655440034', 'customer2@example.com', 'David', 'Brown', '+1-555-0202', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'customer', 'active', '{"theme": "dark", "notifications": true, "language": "en"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '10 days', '{"customer_since": "2023-05-15", "total_orders": 8}', NOW() - INTERVAL '10 days', NOW()),
('550e8400-e29b-41d4-a716-446655440035', 'customer3@example.com', 'Lisa', 'Anderson', '+1-555-0203', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'customer', 'active', '{"theme": "light", "notifications": false, "language": "en"}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', '{"customer_since": "2023-06-20", "total_orders": 3}', NOW() - INTERVAL '5 days', NOW());

-- Insert User Roles
INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '30 days', NULL),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '25 days', NULL),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '20 days', NULL),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '15 days', NULL),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '10 days', NULL),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '5 days', NULL);

-- Insert Categories
INSERT INTO categories (id, name, slug, description, parent_id, image_url, is_active, sort_order, metadata, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'Electronics', 'electronics', 'Electronic devices and accessories', NULL, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', true, 1, '{"seo_title": "Electronics - Latest Gadgets", "seo_description": "Discover the latest electronic devices"}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440051', 'Smartphones', 'smartphones', 'Mobile phones and accessories', '550e8400-e29b-41d4-a716-446655440050', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', true, 1, '{"seo_title": "Smartphones - Latest Models", "seo_description": "Latest smartphone models and accessories"}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440052', 'Laptops', 'laptops', 'Laptops and computer accessories', '550e8400-e29b-41d4-a716-446655440050', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', true, 2, '{"seo_title": "Laptops - High Performance", "seo_description": "High-performance laptops for work and gaming"}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440053', 'Headphones', 'headphones', 'Audio devices and headphones', '550e8400-e29b-41d4-a716-446655440050', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', true, 3, '{"seo_title": "Headphones - Premium Audio", "seo_description": "Premium headphones and audio equipment"}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440054', 'Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', true, 2, '{"seo_title": "Home & Garden - Quality Products", "seo_description": "Quality home and garden products"}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440055', 'Clothing', 'clothing', 'Fashion and apparel', NULL, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', true, 3, '{"seo_title": "Clothing - Fashion Trends", "seo_description": "Latest fashion trends and clothing"}', NOW(), NOW());

-- Insert Products
INSERT INTO products (id, name, slug, description, short_description, sku, price, compare_price, cost_price, brand, status, category_id, inventory_quantity, track_inventory, low_stock_threshold, weight, dimensions, requires_shipping, is_digital, tax_class, seo_title, seo_description, tags, attributes, variants, images, created_by, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440060', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'The most advanced iPhone ever with titanium design, A17 Pro chip, and professional camera system. Features include 6.7-inch Super Retina XDR display, advanced computational photography, and all-day battery life.', 'Latest iPhone with titanium design and A17 Pro chip', 'IPH-15-PM-001', 1199.00, 1299.00, 899.00, 'Apple', 'active', '550e8400-e29b-41d4-a716-446655440051', 50, true, 10, 0.221, '{"length": 6.29, "width": 3.02, "height": 0.32, "unit": "inches"}', true, false, 'standard', 'iPhone 15 Pro Max - Premium Smartphone', 'Get the latest iPhone 15 Pro Max with advanced features', '["smartphone", "apple", "premium", "5g"]', '{"color": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"], "storage": ["256GB", "512GB", "1TB"], "warranty": "1 year"}', '[{"name": "256GB Natural Titanium", "sku": "IPH-15-PM-256-NT", "price": 1199.00, "inventory": 15}, {"name": "512GB Blue Titanium", "sku": "IPH-15-PM-512-BT", "price": 1399.00, "inventory": 20}, {"name": "1TB White Titanium", "sku": "IPH-15-PM-1TB-WT", "price": 1599.00, "inventory": 15}]', '[{"url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800", "alt": "iPhone 15 Pro Max front view", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "alt": "iPhone 15 Pro Max back view", "is_primary": false}]', '550e8400-e29b-41d4-a716-446655440030', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440061', 'MacBook Pro 16-inch M3', 'macbook-pro-16-m3', 'Supercharged by M3 Pro and M3 Max chips, the MacBook Pro delivers exceptional performance for demanding workflows. Features stunning Liquid Retina XDR display, advanced camera and audio, and all-day battery life.', 'Professional laptop with M3 chip and 16-inch display', 'MBP-16-M3-001', 2499.00, 2699.00, 1899.00, 'Apple', 'active', '550e8400-e29b-41d4-a716-446655440052', 25, true, 5, 2.15, '{"length": 14.01, "width": 9.77, "height": 0.66, "unit": "inches"}', true, false, 'standard', 'MacBook Pro 16-inch M3 - Professional Laptop', 'Professional MacBook Pro with M3 chip for demanding workflows', '["laptop", "apple", "professional", "m3"]', '{"processor": ["M3 Pro", "M3 Max"], "memory": ["18GB", "36GB"], "storage": ["512GB", "1TB", "2TB"], "color": ["Space Black", "Silver"]}', '[{"name": "M3 Pro 18GB 512GB Space Black", "sku": "MBP-16-M3P-18-512-SB", "price": 2499.00, "inventory": 12}, {"name": "M3 Max 36GB 1TB Silver", "sku": "MBP-16-M3M-36-1TB-SL", "price": 3499.00, "inventory": 8}, {"name": "M3 Pro 18GB 1TB Space Black", "sku": "MBP-16-M3P-18-1TB-SB", "price": 2899.00, "inventory": 5}]', '[{"url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800", "alt": "MacBook Pro 16-inch front view", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", "alt": "MacBook Pro 16-inch side view", "is_primary": false}]', '550e8400-e29b-41d4-a716-446655440030', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440062', 'Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5', 'Industry-leading noise canceling headphones with exceptional sound quality. Features 30-hour battery life, quick charge, multipoint connection, and speak-to-chat technology.', 'Premium noise-canceling wireless headphones', 'SNY-WH1000XM5-001', 399.99, 449.99, 299.99, 'Sony', 'active', '550e8400-e29b-41d4-a716-446655440053', 75, true, 15, 0.55, '{"length": 10.2, "width": 8.7, "height": 3.2, "unit": "inches"}', true, false, 'standard', 'Sony WH-1000XM5 - Premium Noise Canceling Headphones', 'Experience superior sound with Sony WH-1000XM5 noise canceling headphones', '["headphones", "sony", "wireless", "noise-canceling"]', '{"color": ["Black", "Silver"], "connectivity": ["Bluetooth 5.2", "3.5mm"], "features": ["Active Noise Canceling", "Quick Charge", "Multipoint"]}', '[{"name": "Black", "sku": "SNY-WH1000XM5-BLK", "price": 399.99, "inventory": 40}, {"name": "Silver", "sku": "SNY-WH1000XM5-SLV", "price": 399.99, "inventory": 35}]', '[{"url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", "alt": "Sony WH-1000XM5 headphones", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800", "alt": "Sony headphones side view", "is_primary": false}]', '550e8400-e29b-41d4-a716-446655440031', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440063', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'The ultimate Galaxy experience with built-in S Pen, advanced AI features, and professional-grade camera system. Features 6.8-inch Dynamic AMOLED display and all-day intelligent battery.', 'Premium Android smartphone with S Pen', 'SAM-GS24U-001', 1299.99, 1399.99, 999.99, 'Samsung', 'active', '550e8400-e29b-41d4-a716-446655440051', 40, true, 8, 0.233, '{"length": 6.40, "width": 3.11, "height": 0.34, "unit": "inches"}', true, false, 'standard', 'Samsung Galaxy S24 Ultra - Premium Android Phone', 'Experience the ultimate Galaxy with S24 Ultra and built-in S Pen', '["smartphone", "samsung", "android", "s-pen"]', '{"color": ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"], "storage": ["256GB", "512GB", "1TB"], "features": ["S Pen", "AI Features", "200MP Camera"]}', '[{"name": "256GB Titanium Black", "sku": "SAM-GS24U-256-TB", "price": 1299.99, "inventory": 15}, {"name": "512GB Titanium Gray", "sku": "SAM-GS24U-512-TG", "price": 1419.99, "inventory": 12}, {"name": "1TB Titanium Violet", "sku": "SAM-GS24U-1TB-TV", "price": 1659.99, "inventory": 13}]', '[{"url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800", "alt": "Samsung Galaxy S24 Ultra", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", "alt": "Galaxy S24 Ultra with S Pen", "is_primary": false}]', '550e8400-e29b-41d4-a716-446655440031', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440064', 'Dell XPS 13 Plus', 'dell-xps-13-plus', 'Ultra-thin and light laptop with stunning InfinityEdge display and premium materials. Perfect for professionals who need power and portability in a sleek design.', 'Premium ultrabook with InfinityEdge display', 'DELL-XPS13P-001', 1299.99, 1499.99, 999.99, 'Dell', 'active', '550e8400-e29b-41d4-a716-446655440052', 30, true, 5, 1.24, '{"length": 11.63, "width": 7.84, "height": 0.60, "unit": "inches"}', true, false, 'standard', 'Dell XPS 13 Plus - Premium Ultrabook', 'Experience premium performance with Dell XPS 13 Plus ultrabook', '["laptop", "dell", "ultrabook", "premium"]', '{"processor": ["Intel i5", "Intel i7"], "memory": ["16GB", "32GB"], "storage": ["512GB", "1TB"], "color": ["Platinum Silver", "Graphite"]}', '[{"name": "i5 16GB 512GB Platinum", "sku": "DELL-XPS13P-I5-16-512-PT", "price": 1299.99, "inventory": 15}, {"name": "i7 32GB 1TB Graphite", "sku": "DELL-XPS13P-I7-32-1TB-GR", "price": 1899.99, "inventory": 10}, {"name": "i7 16GB 512GB Platinum", "sku": "DELL-XPS13P-I7-16-512-PT", "price": 1599.99, "inventory": 5}]', '[{"url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800", "alt": "Dell XPS 13 Plus laptop", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", "alt": "Dell XPS 13 Plus side view", "is_primary": false}]', '550e8400-e29b-41d4-a716-446655440031', NOW(), NOW());

-- Insert Addresses
INSERT INTO addresses (id, user_id, type, first_name, last_name, company, address_line_1, address_line_2, city, state, postal_code, country, phone, is_default, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440033', 'billing', 'Emily', 'Davis', NULL, '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'US', '+1-555-0201', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440033', 'shipping', 'Emily', 'Davis', NULL, '456 Oak Avenue', NULL, 'Brooklyn', 'NY', '11201', 'US', '+1-555-0201', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440034', 'billing', 'David', 'Brown', 'Tech Solutions Inc', '789 Business Blvd', 'Suite 200', 'San Francisco', 'CA', '94105', 'US', '+1-555-0202', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440035', 'billing', 'Lisa', 'Anderson', NULL, '321 Pine Street', NULL, 'Seattle', 'WA', '98101', 'US', '+1-555-0203', true, NOW(), NOW());

-- Insert Orders
INSERT INTO orders (id, order_number, user_id, customer_email, customer_phone, status, payment_status, fulfillment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, billing_address, shipping_address, notes, internal_notes, tags, metadata, created_at, updated_at, processed_at, shipped_at, delivered_at) VALUES
('550e8400-e29b-41d4-a716-446655440080', 'ORD-2024-001', '550e8400-e29b-41d4-a716-446655440033', 'customer1@example.com', '+1-555-0201', 'completed', 'paid', 'delivered', 1199.00, 95.92, 9.99, 0.00, 1304.91, '{"first_name": "Emily", "last_name": "Davis", "address_line_1": "123 Main Street", "address_line_2": "Apt 4B", "city": "New York", "state": "NY", "postal_code": "10001", "country": "US", "phone": "+1-555-0201"}', '{"first_name": "Emily", "last_name": "Davis", "address_line_1": "456 Oak Avenue", "city": "Brooklyn", "state": "NY", "postal_code": "11201", "country": "US", "phone": "+1-555-0201"}', 'Please handle with care', 'Customer is VIP', '["vip", "electronics"]', '{"source": "website", "utm_campaign": "summer_sale", "referrer": "google"}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

('550e8400-e29b-41d4-a716-446655440081', 'ORD-2024-002', '550e8400-e29b-41d4-a716-446655440034', 'customer2@example.com', '+1-555-0202', 'processing', 'paid', 'pending', 2499.00, 199.92, 0.00, 100.00, 2598.92, '{"first_name": "David", "last_name": "Brown", "company": "Tech Solutions Inc", "address_line_1": "789 Business Blvd", "address_line_2": "Suite 200", "city": "San Francisco", "state": "CA", "postal_code": "94105", "country": "US", "phone": "+1-555-0202"}', '{"first_name": "David", "last_name": "Brown", "company": "Tech Solutions Inc", "address_line_1": "789 Business Blvd", "address_line_2": "Suite 200", "city": "San Francisco", "state": "CA", "postal_code": "94105", "country": "US", "phone": "+1-555-0202"}', 'Business purchase - invoice required', 'Applied corporate discount', '["business", "bulk"]', '{"source": "website", "discount_code": "CORP100", "purchase_order": "PO-2024-456"}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL, NULL),

('550e8400-e29b-41d4-a716-446655440082', 'ORD-2024-003', '550e8400-e29b-41d4-a716-446655440035', 'customer3@example.com', '+1-555-0203', 'pending', 'pending', 'pending', 399.99, 32.00, 9.99, 20.00, 421.98, '{"first_name": "Lisa", "last_name": "Anderson", "address_line_1": "321 Pine Street", "city": "Seattle", "state": "WA", "postal_code": "98101", "country": "US", "phone": "+1-555-0203"}', '{"first_name": "Lisa", "last_name": "Anderson", "address_line_1": "321 Pine Street", "city": "Seattle", "state": "WA", "postal_code": "98101", "country": "US", "phone": "+1-555-0203"}', NULL, 'First-time customer', '["new_customer"]', '{"source": "website", "discount_code": "WELCOME20"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL, NULL);

-- Insert Order Items
INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price, product_snapshot, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440060', NULL, 1, 1199.00, 1199.00, '{"name": "iPhone 15 Pro Max", "sku": "IPH-15-PM-256-NT", "variant": "256GB Natural Titanium", "brand": "Apple", "image": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"}', NOW() - INTERVAL '7 days'),

('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440061', NULL, 1, 2499.00, 2499.00, '{"name": "MacBook Pro 16-inch M3", "sku": "MBP-16-M3P-18-512-SB", "variant": "M3 Pro 18GB 512GB Space Black", "brand": "Apple", "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"}', NOW() - INTERVAL '3 days'),

('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440062', NULL, 1, 399.99, 399.99, '{"name": "Sony WH-1000XM5 Headphones", "sku": "SNY-WH1000XM5-BLK", "variant": "Black", "brand": "Sony", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}', NOW() - INTERVAL '1 day');

-- Insert Payments
INSERT INTO payments (id, order_id, amount, currency, status, payment_method, payment_gateway, gateway_transaction_id, gateway_response, processed_at, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440080', 1304.91, 'USD', 'completed', 'credit_card', 'stripe', 'pi_3OExample123456789', '{"id": "pi_3OExample123456789", "status": "succeeded", "payment_method": {"card": {"brand": "visa", "last4": "4242"}}}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440081', 2598.92, 'USD', 'completed', 'credit_card', 'stripe', 'pi_3OExample987654321', '{"id": "pi_3OExample987654321", "status": "succeeded", "payment_method": {"card": {"brand": "mastercard", "last4": "5555"}}}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440082', 421.98, 'USD', 'pending', 'credit_card', 'stripe', 'pi_3OExample456789123', '{"id": "pi_3OExample456789123", "status": "requires_confirmation"}', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert Inventory Movements
INSERT INTO inventory_movements (id, product_id, movement_type, quantity, reason, reference_type, reference_id, cost_per_unit, created_by, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440060', 'in', 100, 'Initial stock', 'purchase_order', '550e8400-e29b-41d4-a716-446655440060', 899.00, '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440060', 'out', 1, 'Sale', 'order', '550e8400-e29b-41d4-a716-446655440080', 899.00, '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440061', 'in', 50, 'Initial stock', 'purchase_order', '550e8400-e29b-41d4-a716-446655440061', 1899.00, '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440113', '550e8400-e29b-41d4-a716-446655440061', 'out', 1, 'Sale', 'order', '550e8400-e29b-41d4-a716-446655440081', 1899.00, '550e8400-e29b-41d4-a716-446655440030', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440114', '550e8400-e29b-41d4-a716-446655440062', 'in', 100, 'Initial stock', 'purchase_order', '550e8400-e29b-41d4-a716-446655440062', 299.99, '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440115', '550e8400-e29b-41d4-a716-446655440063', 'in', 75, 'Initial stock', 'purchase_order', '550e8400-e29b-41d4-a716-446655440063', 999.99, '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440116', '550e8400-e29b-41d4-a716-446655440064', 'in', 50, 'Initial stock', 'purchase_order', '550e8400-e29b-41d4-a716-446655440064', 999.99, '550e8400-e29b-41d4-a716-446655440031', NOW() - INTERVAL '10 days');

-- Insert Activity Logs
INSERT INTO activity_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440120', '550e8400-e29b-41d4-a716-446655440030', 'create', 'product', '550e8400-e29b-41d4-a716-446655440060', NULL, '{"name": "iPhone 15 Pro Max", "status": "active", "price": 1199.00}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440121', '550e8400-e29b-41d4-a716-446655440033', 'create', 'order', '550e8400-e29b-41d4-a716-446655440080', NULL, '{"order_number": "ORD-2024-001", "status": "pending", "total_amount": 1304.91}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440122', '550e8400-e29b-41d4-a716-446655440030', 'update', 'order', '550e8400-e29b-41d4-a716-446655440080', '{"status": "pending"}', '{"status": "completed"}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440123', '550e8400-e29b-41d4-a716-446655440031', 'create', 'product', '550e8400-e29b-41d4-a716-446655440062', NULL, '{"name": "Sony WH-1000XM5 Headphones", "status": "active", "price": 399.99}', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64)', NOW() - INTERVAL '20 days');

-- Insert Event Store entries
INSERT INTO event_store (id, aggregate_id, aggregate_type, event_type, event_data, event_metadata, version, occurred_at, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440130', '550e8400-e29b-41d4-a716-446655440080', 'Order', 'OrderCreated', '{"order_number": "ORD-2024-001", "customer_id": "550e8400-e29b-41d4-a716-446655440033", "total_amount": 1304.91, "items": [{"product_id": "550e8400-e29b-41d4-a716-446655440060", "quantity": 1, "price": 1199.00}]}', '{"user_id": "550e8400-e29b-41d4-a716-446655440033", "ip_address": "192.168.1.101", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}', 1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440131', '550e8400-e29b-41d4-a716-446655440080', 'Order', 'OrderPaid', '{"payment_id": "550e8400-e29b-41d4-a716-446655440100", "amount": 1304.91, "payment_method": "credit_card"}', '{"user_id": "550e8400-e29b-41d4-a716-446655440033", "gateway": "stripe"}', 2, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440132', '550e8400-e29b-41d4-a716-446655440080', 'Order', 'OrderShipped', '{"tracking_number": "1Z999AA1234567890", "carrier": "UPS", "shipped_at": "2024-01-15T10:30:00Z"}', '{"user_id": "550e8400-e29b-41d4-a716-446655440030", "warehouse": "NYC-01"}', 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440133', '550e8400-e29b-41d4-a716-446655440080', 'Order', 'OrderDelivered', '{"delivered_at": "2024-01-17T14:45:00Z", "signature": "E. Davis"}', '{"carrier": "UPS", "delivery_confirmation": true}', 4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Insert Event Snapshots
INSERT INTO event_snapshots (id, aggregate_id, aggregate_type, version, snapshot_data, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440140', '550e8400-e29b-41d4-a716-446655440080', 'Order', 4, '{"id": "550e8400-e29b-41d4-a716-446655440080", "order_number": "ORD-2024-001", "status": "completed", "payment_status": "paid", "fulfillment_status": "delivered", "total_amount": 1304.91, "customer": {"id": "550e8400-e29b-41d4-a716-446655440033", "email": "customer1@example.com"}, "items": [{"product_id": "550e8400-e29b-41d4-a716-446655440060", "name": "iPhone 15 Pro Max", "quantity": 1, "price": 1199.00}], "shipping": {"tracking_number": "1Z999AA1234567890", "carrier": "UPS", "delivered_at": "2024-01-17T14:45:00Z"}}', NOW() - INTERVAL '3 days');

-- Update sequences and refresh materialized views if any
SELECT setval(pg_get_serial_sequence('profiles', 'id'), (SELECT MAX(id) FROM profiles));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_brand_status ON products(brand, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type, version);

-- Analyze tables for query optimization
ANALYZE profiles;
ANALYZE products;
ANALYZE categories;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
ANALYZE inventory_movements;
ANALYZE activity_logs;
ANALYZE event_store;

COMMIT;
