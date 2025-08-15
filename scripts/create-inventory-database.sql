-- Inventory Service Database Schema
-- PostgreSQL schema for inventory and warehouse management

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create database if it doesn't exist (run this separately)
-- CREATE DATABASE ecom_inventory;

-- Connect to the inventory database
\c ecom_inventory;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- WAREHOUSES TABLE
-- =============================================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Location Information
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    
    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact Information
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Warehouse Properties
    warehouse_type VARCHAR(50) DEFAULT 'standard' CHECK (warehouse_type IN ('standard', 'cold_storage', 'hazmat', 'returns')),
    storage_capacity INTEGER,
    current_utilization DECIMAL(5, 2) DEFAULT 0.00,
    
    -- Operational Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_fulfillment_center BOOLEAN DEFAULT TRUE,
    is_returns_center BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    
    -- Operating Hours (JSON format)
    operating_hours JSONB DEFAULT '{}',
    
    -- Shipping Zones
    shipping_zones JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for warehouses table
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_warehouse_type ON warehouses(warehouse_type);
CREATE INDEX idx_warehouses_location ON warehouses(country, state, city);

-- =============================================================================
-- INVENTORY ITEMS TABLE
-- =============================================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Product Information
    sku VARCHAR(100) NOT NULL,
    product_id VARCHAR(255), -- Reference to catalog service
    variant_id VARCHAR(255), -- Reference to product variant
    
    -- Item Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    
    -- Physical Properties
    weight DECIMAL(10, 3), -- in kg
    length DECIMAL(10, 2), -- in cm
    width DECIMAL(10, 2),  -- in cm
    height DECIMAL(10, 2), -- in cm
    volume DECIMAL(10, 3), -- in cubic cm
    
    -- Storage Requirements
    storage_type VARCHAR(50) DEFAULT 'standard' CHECK (storage_type IN ('standard', 'refrigerated', 'frozen', 'hazmat')),
    storage_conditions JSONB DEFAULT '{}',
    
    -- Tracking Information
    lot_tracking BOOLEAN DEFAULT FALSE,
    serial_tracking BOOLEAN DEFAULT FALSE,
    expiry_tracking BOOLEAN DEFAULT FALSE,
    
    -- Cost Information
    unit_cost DECIMAL(10, 2),
    average_cost DECIMAL(10, 2),
    last_cost DECIMAL(10, 2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_sellable BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for inventory_items table
CREATE UNIQUE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_brand ON inventory_items(brand);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);

-- =============================================================================
-- STOCK LEVELS TABLE
-- =============================================================================

CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- Stock Quantities
    on_hand INTEGER DEFAULT 0 CHECK (on_hand >= 0),
    available INTEGER DEFAULT 0 CHECK (available >= 0),
    reserved INTEGER DEFAULT 0 CHECK (reserved >= 0),
    allocated INTEGER DEFAULT 0 CHECK (allocated >= 0),
    in_transit INTEGER DEFAULT 0 CHECK (in_transit >= 0),
    damaged INTEGER DEFAULT 0 CHECK (damaged >= 0),
    
    -- Reorder Information
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    
    -- Location Information
    bin_location VARCHAR(100),
    zone VARCHAR(50),
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    
    -- Last Movement
    last_movement_at TIMESTAMP,
    last_count_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(warehouse_id, inventory_item_id),
    CHECK (available <= on_hand),
    CHECK (reserved >= 0),
    CHECK (allocated >= 0)
);

-- Indexes for stock_levels table
CREATE INDEX idx_stock_levels_warehouse_id ON stock_levels(warehouse_id);
CREATE INDEX idx_stock_levels_inventory_item_id ON stock_levels(inventory_item_id);
CREATE INDEX idx_stock_levels_on_hand ON stock_levels(on_hand);
CREATE INDEX idx_stock_levels_available ON stock_levels(available);
CREATE INDEX idx_stock_levels_reorder_point ON stock_levels(reorder_point);

-- =============================================================================
-- STOCK MOVEMENTS TABLE
-- =============================================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    -- Movement Information
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'inbound', 'outbound', 'transfer', 'adjustment', 'return', 'damage', 'loss', 'found'
    )),
    movement_reason VARCHAR(100),
    
    -- Quantities
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Before and After Quantities
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    -- Reference Information
    reference_type VARCHAR(50), -- order, transfer, adjustment, etc.
    reference_id VARCHAR(255),
    reference_number VARCHAR(100),
    
    -- Batch/Lot Information
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiry_date DATE,
    
    -- Location Information
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    
    -- User Information
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    
    -- Notes and Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for stock_movements table
CREATE INDEX idx_stock_movements_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_inventory_item_id ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_movement_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_batch_number ON stock_movements(batch_number);
CREATE INDEX idx_stock_movements_lot_number ON stock_movements(lot_number);

-- =============================================================================
-- STOCK RESERVATIONS TABLE
-- =============================================================================

CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    -- Reservation Information
    reservation_type VARCHAR(50) NOT NULL CHECK (reservation_type IN ('order', 'transfer', 'manual')),
    reference_id VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    
    -- Quantities
    quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
    quantity_fulfilled INTEGER DEFAULT 0 CHECK (quantity_fulfilled >= 0),
    quantity_remaining INTEGER GENERATED ALWAYS AS (quantity_reserved - quantity_fulfilled) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
    
    -- Timing
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    fulfilled_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- User Information
    reserved_by VARCHAR(255),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (quantity_fulfilled <= quantity_reserved)
);

-- Indexes for stock_reservations table
CREATE INDEX idx_stock_reservations_warehouse_id ON stock_reservations(warehouse_id);
CREATE INDEX idx_stock_reservations_inventory_item_id ON stock_reservations(inventory_item_id);
CREATE INDEX idx_stock_reservations_reference ON stock_reservations(reference_type, reference_id);
CREATE INDEX idx_stock_reservations_status ON stock_reservations(status);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at);

-- =============================================================================
-- STOCK TRANSFERS TABLE
-- =============================================================================

CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transfer Information
    transfer_number VARCHAR(100) UNIQUE NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'in_transit', 'received', 'cancelled'
    )),
    
    -- Timing
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    shipped_at TIMESTAMP,
    received_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- User Information
    requested_by VARCHAR(255),
    approved_by VARCHAR(255),
    shipped_by VARCHAR(255),
    received_by VARCHAR(255),
    
    -- Shipping Information
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_cost DECIMAL(10, 2),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (from_warehouse_id != to_warehouse_id)
);

-- Indexes for stock_transfers table
CREATE INDEX idx_stock_transfers_transfer_number ON stock_transfers(transfer_number);
CREATE INDEX idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_requested_at ON stock_transfers(requested_at);

-- =============================================================================
-- STOCK TRANSFER ITEMS TABLE
-- =============================================================================

CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    -- Quantities
    quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
    quantity_shipped INTEGER DEFAULT 0 CHECK (quantity_shipped >= 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_damaged INTEGER DEFAULT 0 CHECK (quantity_damaged >= 0),
    
    -- Cost Information
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Batch/Lot Information
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (quantity_shipped <= quantity_requested),
    CHECK (quantity_received <= quantity_shipped),
    CHECK (quantity_damaged <= quantity_received)
);

-- Indexes for stock_transfer_items table
CREATE INDEX idx_stock_transfer_items_transfer_id ON stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_inventory_item_id ON stock_transfer_items(inventory_item_id);

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
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON stock_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_reservations_updated_at BEFORE UPDATE ON stock_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_transfer_items_updated_at BEFORE UPDATE ON stock_transfer_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update stock levels after movement
CREATE OR REPLACE FUNCTION update_stock_levels_after_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stock levels based on movement
    UPDATE stock_levels 
    SET 
        on_hand = CASE 
            WHEN NEW.movement_type IN ('inbound', 'return', 'found', 'adjustment') THEN on_hand + NEW.quantity
            WHEN NEW.movement_type IN ('outbound', 'damage', 'loss') THEN on_hand - NEW.quantity
            ELSE on_hand
        END,
        available = CASE 
            WHEN NEW.movement_type IN ('inbound', 'return', 'found', 'adjustment') THEN available + NEW.quantity
            WHEN NEW.movement_type IN ('outbound', 'damage', 'loss') THEN available - NEW.quantity
            ELSE available
        END,
        last_movement_at = NEW.movement_date
    WHERE warehouse_id = NEW.warehouse_id AND inventory_item_id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock levels after movement
CREATE TRIGGER update_stock_after_movement 
    AFTER INSERT ON stock_movements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_stock_levels_after_movement();

-- Function to clean expired reservations
CREATE OR REPLACE FUNCTION clean_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired reservations
    UPDATE stock_reservations 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Release reserved stock for expired reservations
    UPDATE stock_levels 
    SET reserved = reserved - sr.quantity_remaining
    FROM stock_reservations sr
    WHERE stock_levels.warehouse_id = sr.warehouse_id
    AND stock_levels.inventory_item_id = sr.inventory_item_id
    AND sr.status = 'expired'
    AND sr.updated_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default warehouse
INSERT INTO warehouses (
    name, 
    code, 
    description,
    address_line_1,
    city,
    state,
    country,
    postal_code,
    contact_person,
    contact_email,
    warehouse_type,
    storage_capacity
) VALUES (
    'Main Warehouse',
    'WH001',
    'Primary fulfillment center',
    '123 Warehouse Street',
    'Commerce City',
    'Colorado',
    'United States',
    '80022',
    'Warehouse Manager',
    'warehouse@ecommerce.local',
    'standard',
    10000
);

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Analyze tables for query optimization
ANALYZE warehouses;
ANALYZE inventory_items;
ANALYZE stock_levels;
ANALYZE stock_movements;
ANALYZE stock_reservations;
ANALYZE stock_transfers;
ANALYZE stock_transfer_items;

COMMIT;
