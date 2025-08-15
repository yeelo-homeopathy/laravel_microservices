-- Orders Service Database Schema
-- PostgreSQL schema for order management and fulfillment

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create database if it doesn't exist (run this separately)
-- CREATE DATABASE ecom_orders;

-- Connect to the orders database
\c ecom_orders;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order Identification
    order_number VARCHAR(100) UNIQUE NOT NULL,
    external_order_id VARCHAR(255), -- For external integrations
    
    -- Customer Information
    customer_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Order Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered', 
        'cancelled', 'refunded', 'returned', 'failed'
    )),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
        'unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered'
    )),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'authorized', 'paid', 'partially_paid', 'refunded', 'partially_refunded', 'failed'
    )),
    
    -- Financial Information
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    shipping_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Shipping Information
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Addresses (JSON format for flexibility)
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Order Source
    source VARCHAR(50) DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'api', 'admin', 'marketplace')),
    channel VARCHAR(50) DEFAULT 'online',
    
    -- Discounts and Promotions
    coupon_code VARCHAR(100),
    discount_codes JSONB DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for orders table
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);
CREATE INDEX idx_orders_source ON orders(source);

-- =============================================================================
-- ORDER ITEMS TABLE
-- =============================================================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Product Information
    product_id VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255),
    sku VARCHAR(100) NOT NULL,
    
    -- Item Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    -- Quantities
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    quantity_shipped INTEGER DEFAULT 0 CHECK (quantity_shipped >= 0),
    quantity_delivered INTEGER DEFAULT 0 CHECK (quantity_delivered >= 0),
    quantity_returned INTEGER DEFAULT 0 CHECK (quantity_returned >= 0),
    quantity_refunded INTEGER DEFAULT 0 CHECK (quantity_refunded >= 0),
    
    -- Pricing
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Tax Information
    tax_rate DECIMAL(5, 4) DEFAULT 0.0000,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Fulfillment Information
    warehouse_id VARCHAR(255),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
        'unfulfilled', 'allocated', 'picked', 'packed', 'shipped', 'delivered', 'returned'
    )),
    
    -- Seller Information (for marketplace)
    seller_id VARCHAR(255),
    seller_name VARCHAR(255),
    
    -- Product Attributes at time of order
    product_attributes JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (quantity_shipped <= quantity),
    CHECK (quantity_delivered <= quantity_shipped),
    CHECK (quantity_returned <= quantity_delivered),
    CHECK (quantity_refunded <= quantity)
);

-- Indexes for order_items table
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX idx_order_items_fulfillment_status ON order_items(fulfillment_status);

-- =============================================================================
-- ORDER STATUS HISTORY TABLE
-- =============================================================================

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Status Change Information
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('order', 'fulfillment', 'payment')),
    
    -- Change Details
    reason VARCHAR(255),
    notes TEXT,
    
    -- User Information
    changed_by VARCHAR(255),
    changed_by_type VARCHAR(50) DEFAULT 'system' CHECK (changed_by_type IN ('system', 'user', 'admin', 'api')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for order_status_history table
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_status_type ON order_status_history(status_type);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at);

-- =============================================================================
-- ORDER FULFILLMENTS TABLE
-- =============================================================================

CREATE TABLE order_fulfillments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Fulfillment Information
    fulfillment_number VARCHAR(100) UNIQUE NOT NULL,
    warehouse_id VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'allocated', 'picked', 'packed', 'shipped', 'delivered', 'cancelled'
    )),
    
    -- Shipping Information
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    tracking_url VARCHAR(500),
    shipping_cost DECIMAL(10, 2),
    
    -- Timing
    estimated_ship_date DATE,
    actual_ship_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- User Information
    picked_by VARCHAR(255),
    packed_by VARCHAR(255),
    shipped_by VARCHAR(255),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for order_fulfillments table
CREATE INDEX idx_order_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX idx_order_fulfillments_fulfillment_number ON order_fulfillments(fulfillment_number);
CREATE INDEX idx_order_fulfillments_warehouse_id ON order_fulfillments(warehouse_id);
CREATE INDEX idx_order_fulfillments_status ON order_fulfillments(status);
CREATE INDEX idx_order_fulfillments_tracking_number ON order_fulfillments(tracking_number);

-- =============================================================================
-- ORDER FULFILLMENT ITEMS TABLE
-- =============================================================================

CREATE TABLE order_fulfillment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    fulfillment_id UUID NOT NULL REFERENCES order_fulfillments(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    
    -- Quantities
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    -- Batch/Lot Information
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    serial_numbers JSONB DEFAULT '[]',
    expiry_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for order_fulfillment_items table
CREATE INDEX idx_order_fulfillment_items_fulfillment_id ON order_fulfillment_items(fulfillment_id);
CREATE INDEX idx_order_fulfillment_items_order_item_id ON order_fulfillment_items(order_item_id);

-- =============================================================================
-- ORDER RETURNS TABLE
-- =============================================================================

CREATE TABLE order_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- Return Information
    return_number VARCHAR(100) UNIQUE NOT NULL,
    return_type VARCHAR(50) DEFAULT 'customer' CHECK (return_type IN ('customer', 'merchant', 'damaged', 'defective')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
        'requested', 'approved', 'rejected', 'in_transit', 'received', 'processed', 'refunded'
    )),
    
    -- Return Details
    reason VARCHAR(255),
    description TEXT,
    return_method VARCHAR(100),
    
    -- Financial Information
    refund_amount DECIMAL(12, 2) DEFAULT 0.00,
    restocking_fee DECIMAL(10, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Shipping Information
    return_carrier VARCHAR(100),
    return_tracking_number VARCHAR(100),
    return_label_url VARCHAR(500),
    
    -- Timing
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    shipped_at TIMESTAMP,
    received_at TIMESTAMP,
    processed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    -- User Information
    requested_by VARCHAR(255),
    approved_by VARCHAR(255),
    processed_by VARCHAR(255),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for order_returns table
CREATE INDEX idx_order_returns_order_id ON order_returns(order_id);
CREATE INDEX idx_order_returns_return_number ON order_returns(return_number);
CREATE INDEX idx_order_returns_status ON order_returns(status);
CREATE INDEX idx_order_returns_return_type ON order_returns(return_type);
CREATE INDEX idx_order_returns_requested_at ON order_returns(requested_at);

-- =============================================================================
-- ORDER RETURN ITEMS TABLE
-- =============================================================================

CREATE TABLE order_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    return_id UUID NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    
    -- Return Quantities
    quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_refunded INTEGER DEFAULT 0 CHECK (quantity_refunded >= 0),
    
    -- Return Condition
    condition VARCHAR(50) DEFAULT 'unknown' CHECK (condition IN (
        'new', 'like_new', 'good', 'fair', 'poor', 'damaged', 'defective', 'unknown'
    )),
    
    -- Financial Information
    unit_refund_amount DECIMAL(10, 2),
    total_refund_amount DECIMAL(12, 2),
    
    -- Return Reason
    reason VARCHAR(255),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (quantity_received <= quantity_requested),
    CHECK (quantity_refunded <= quantity_received)
);

-- Indexes for order_return_items table
CREATE INDEX idx_order_return_items_return_id ON order_return_items(return_id);
CREATE INDEX idx_order_return_items_order_item_id ON order_return_items(order_item_id);

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
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_fulfillments_updated_at BEFORE UPDATE ON order_fulfillments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_returns_updated_at BEFORE UPDATE ON order_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_return_items_updated_at BEFORE UPDATE ON order_return_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    order_num := 'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get count of orders today
    SELECT COUNT(*) + 1 INTO counter
    FROM orders 
    WHERE order_number LIKE order_num || '%';
    
    -- Append counter with zero padding
    order_num := order_num || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET 
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM order_items 
            WHERE order_id = NEW.order_id
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_amount, 0) - COALESCE(discount_amount, 0)
            FROM order_items 
            WHERE order_id = NEW.order_id
        )
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order totals when items change
CREATE TRIGGER update_order_totals_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- Order summary view with calculated fields
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_id,
    o.customer_email,
    o.status,
    o.fulfillment_status,
    o.payment_status,
    o.total_amount,
    o.currency,
    o.placed_at,
    o.source,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity,
    CASE 
        WHEN o.status = 'delivered' THEN o.delivered_at - o.placed_at
        ELSE NULL 
    END as fulfillment_time
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Daily order metrics view
CREATE VIEW daily_order_metrics AS
SELECT 
    DATE(placed_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders
GROUP BY DATE(placed_at)
ORDER BY order_date DESC;

-- =============================================================================
-- SAMPLE DATA (Optional - for development)
-- =============================================================================

-- Insert sample order statuses for reference
INSERT INTO order_status_history (order_id, from_status, to_status, status_type, reason, changed_by_type) VALUES
    (uuid_generate_v4(), NULL, 'pending', 'order', 'Order created', 'system');

-- =============================================================================
-- PERMISSIONS AND SECURITY
-- =============================================================================

-- Create roles for different access levels
CREATE ROLE orders_read_only;
CREATE ROLE orders_full_access;
CREATE ROLE orders_admin;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO orders_read_only;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO orders_full_access;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orders_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orders_admin;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO orders_full_access;

-- Row Level Security (RLS) examples
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own orders
-- CREATE POLICY user_orders ON orders FOR ALL TO orders_read_only USING (customer_id = current_setting('app.current_user_id'));

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Partial indexes for common queries
CREATE INDEX idx_orders_active_status ON orders(status) WHERE status IN ('pending', 'confirmed', 'processing');
CREATE INDEX idx_orders_recent ON orders(placed_at) WHERE placed_at >= CURRENT_DATE - INTERVAL '30 days';
CREATE INDEX idx_order_items_unfulfilled ON order_items(fulfillment_status) WHERE fulfillment_status = 'unfulfilled';

-- Composite indexes for complex queries
CREATE INDEX idx_orders_customer_status_date ON orders(customer_id, status, placed_at);
CREATE INDEX idx_order_items_product_status ON order_items(product_id, fulfillment_status);

-- =============================================================================
-- MAINTENANCE PROCEDURES
-- =============================================================================

-- Procedure to archive old orders (older than 2 years)
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Create archive table if it doesn't exist
    CREATE TABLE IF NOT EXISTS orders_archive (LIKE orders INCLUDING ALL);
    
    -- Move old orders to archive
    WITH archived_orders AS (
        DELETE FROM orders 
        WHERE placed_at < CURRENT_DATE - INTERVAL '2 years'
        AND status IN ('delivered', 'cancelled', 'refunded')
        RETURNING *
    )
    INSERT INTO orders_archive SELECT * FROM archived_orders;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Orders database schema created successfully!';
    RAISE NOTICE 'Tables created: orders, order_items, order_status_history, order_fulfillments, order_fulfillment_items, order_returns, order_return_items';
    RAISE NOTICE 'Views created: order_summary, daily_order_metrics';
    RAISE NOTICE 'Functions created: update_updated_at_column, generate_order_number, update_order_totals, archive_old_orders';
    RAISE NOTICE 'Security: Row Level Security enabled, roles created';
    RAISE NOTICE 'Performance: Optimized indexes created';
END $$;
