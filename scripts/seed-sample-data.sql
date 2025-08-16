-- =============================================================================
-- E-COMMERCE MICROSERVICES PLATFORM - SAMPLE DATA
-- =============================================================================
-- This file contains sample data for testing and development
-- =============================================================================

\c ecommerce_core;

-- Insert sample users
INSERT INTO users (id, email, first_name, last_name, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@ecommerce.local', 'Admin', 'User', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'manager@ecommerce.local', 'Manager', 'User', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'customer@ecommerce.local', 'Customer', 'User', 'active');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'admin@ecommerce.local' AND r.name = 'super_admin';

INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'manager@ecommerce.local' AND r.name = 'manager';

INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'customer@ecommerce.local' AND r.name = 'customer';

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'manager' AND p.name IN ('products.view', 'products.create', 'products.edit', 'orders.view', 'orders.edit', 'inventory.view', 'inventory.manage', 'analytics.view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'customer' AND p.name IN ('orders.view');

-- Insert sample addresses
INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line_1, city, state, postal_code, country, is_default) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'shipping', 'Customer', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', true),
('550e8400-e29b-41d4-a716-446655440003', 'billing', 'Customer', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', true);

\c ecommerce_inventory;

-- Insert sample products
INSERT INTO products (id, sku, name, description, status) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'LAPTOP-001', 'Gaming Laptop', 'High-performance gaming laptop', 'active'),
('650e8400-e29b-41d4-a716-446655440002', 'PHONE-001', 'Smartphone', 'Latest smartphone model', 'active'),
('650e8400-e29b-41d4-a716-446655440003', 'HEADPHONES-001', 'Wireless Headphones', 'Premium wireless headphones', 'active');

-- Insert sample inventory levels
INSERT INTO inventory_levels (product_id, location_id, quantity_available, reorder_point) VALUES
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 50, 10),
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 100, 20),
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 75, 15);

\c ecommerce_orders;

-- Insert sample orders
INSERT INTO orders (id, order_number, user_id, status, subtotal_cents, tax_cents, shipping_cents, total_cents) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'ORD-2024-001', '550e8400-e29b-41d4-a716-446655440003', 'completed', 99999, 8000, 1000, 108999),
('850e8400-e29b-41d4-a716-446655440002', 'ORD-2024-002', '550e8400-e29b-41d4-a716-446655440003', 'processing', 79999, 6400, 1000, 87399);

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price_cents, total_price_cents) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Gaming Laptop', 'LAPTOP-001', 1, 99999, 99999),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Smartphone', 'PHONE-001', 1, 79999, 79999);

\c ecommerce_payments;

-- Insert sample payments
INSERT INTO payments (order_id, payment_method, gateway, status, amount_cents, net_amount_cents) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'credit_card', 'stripe', 'completed', 108999, 105869),
('850e8400-e29b-41d4-a716-446655440002', 'credit_card', 'stripe', 'completed', 87399, 84978);

SELECT 'Sample data inserted successfully!' as status;
