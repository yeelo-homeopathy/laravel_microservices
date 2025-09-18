-- Homeopathy ERP Database Schema
-- This script creates the comprehensive database structure for homeopathy business management

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS batch_movements CASCADE;
DROP TABLE IF EXISTS stock_aging CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS product_batches CASCADE;
DROP TABLE IF EXISTS homeopathy_products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS potencies CASCADE;
DROP TABLE IF EXISTS customer_types CASCADE;
DROP TABLE IF EXISTS price_tiers CASCADE;
DROP TABLE IF EXISTS gst_rates CASCADE;

-- Brands table for homeopathy companies
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Potencies table for homeopathy dilutions
CREATE TABLE potencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 6X, 12X, 30C, 200C, 1M, etc.
    scale VARCHAR(10) NOT NULL, -- X, C, M, LM
    dilution_factor INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer types for different business segments
CREATE TABLE customer_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- Retail, Wholesale, Doctor, Pharmacy, Clinic, Distributor
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    default_discount_percentage DECIMAL(5,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price tiers for dynamic pricing
CREATE TABLE price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type_id UUID REFERENCES customer_types(id),
    product_category VARCHAR(50),
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    markup_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GST rates configuration
CREATE TABLE gst_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_category VARCHAR(50) NOT NULL,
    hsn_code VARCHAR(20),
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    cess_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced products table for homeopathy
CREATE TABLE homeopathy_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_id UUID REFERENCES brands(id),
    potency_id UUID REFERENCES potencies(id),
    category_id UUID REFERENCES categories(id),
    form VARCHAR(50), -- Dilution, Globules, Tablets, Tincture, Ointment, etc.
    pack_size VARCHAR(50), -- 30ml, 100 globules, 25gm, etc.
    unit_of_measure VARCHAR(20), -- ml, gm, pieces, bottles
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    hsn_code VARCHAR(20),
    description TEXT,
    therapeutic_use TEXT,
    composition TEXT,
    dosage_instructions TEXT,
    contraindications TEXT,
    storage_conditions TEXT,
    manufacturer_name VARCHAR(100),
    manufacturer_license VARCHAR(50),
    is_prescription_required BOOLEAN DEFAULT false,
    is_schedule_drug BOOLEAN DEFAULT false,
    minimum_stock_level INTEGER DEFAULT 0,
    maximum_stock_level INTEGER DEFAULT 1000,
    reorder_point INTEGER DEFAULT 10,
    shelf_life_months INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    is_high_value BOOLEAN DEFAULT false, -- For items above certain value
    high_value_threshold DECIMAL(10,2) DEFAULT 1000,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product batches for batch-wise tracking
CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES homeopathy_products(id),
    batch_number VARCHAR(50) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2),
    mrp DECIMAL(10,2),
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_damaged INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    supplier_id UUID,
    purchase_order_id UUID,
    cost_per_unit DECIMAL(10,2),
    landed_cost DECIMAL(10,2), -- Including transportation, taxes, etc.
    storage_location VARCHAR(100),
    quality_status VARCHAR(20) DEFAULT 'approved', -- approved, rejected, quarantine
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, batch_number)
);

-- Suppliers management
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address JSONB,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    drug_license VARCHAR(50),
    credit_days INTEGER DEFAULT 30,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms TEXT,
    bank_details JSONB,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier-Product mapping for multiple suppliers per product
CREATE TABLE supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id),
    product_id UUID REFERENCES homeopathy_products(id),
    supplier_sku VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    minimum_order_quantity INTEGER DEFAULT 1,
    last_purchase_price DECIMAL(10,2),
    last_purchase_date DATE,
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, confirmed, partial, completed, cancelled
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    freight_charges DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_terms TEXT,
    delivery_address JSONB,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    product_id UUID REFERENCES homeopathy_products(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    batch_number VARCHAR(50),
    expiry_date DATE,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock aging analysis
CREATE TABLE stock_aging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES homeopathy_products(id),
    batch_id UUID REFERENCES product_batches(id),
    quantity INTEGER NOT NULL,
    days_in_stock INTEGER NOT NULL,
    aging_category VARCHAR(20), -- 0-30, 31-60, 61-90, 91-180, 180+
    value_at_cost DECIMAL(12,2),
    value_at_selling_price DECIMAL(12,2),
    holding_cost_percentage DECIMAL(5,2) DEFAULT 8.0, -- Monthly holding cost %
    calculated_holding_cost DECIMAL(10,2),
    is_dead_stock BOOLEAN DEFAULT false,
    last_sale_date DATE,
    analysis_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch movements for detailed tracking
CREATE TABLE batch_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES product_batches(id),
    movement_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT, DAMAGE, RETURN
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20), -- PURCHASE, SALE, ADJUSTMENT, DAMAGE, RETURN
    reference_id UUID,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2),
    reason TEXT,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing profiles table for customer types
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_type_id UUID REFERENCES customer_types(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drug_license VARCHAR(50);

-- Update existing orders table for ERP features
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'retail';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_person_id UUID REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'percentage';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS round_off DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0;

-- Update existing order_items table for batch tracking
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES product_batches(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Insert default data
INSERT INTO brands (name, code, description) VALUES
('SBL Pvt Ltd', 'SBL', 'Leading homeopathic medicine manufacturer'),
('Allen Homeo & Herbals', 'ALLEN', 'Trusted homeopathic brand'),
('Dr. Reckeweg & Co', 'RECKEWEG', 'German homeopathic medicines'),
('Boericke & Tafel', 'BT', 'Premium homeopathic products'),
('Hahnemann Labs', 'HAHN', 'Classical homeopathic medicines');

INSERT INTO potencies (name, scale, dilution_factor, sort_order) VALUES
('Mother Tincture', 'Q', 1, 1),
('3X', 'X', 3, 2),
('6X', 'X', 6, 3),
('12X', 'X', 12, 4),
('30C', 'C', 30, 5),
('200C', 'C', 200, 6),
('1M', 'M', 1000, 7),
('10M', 'M', 10000, 8),
('50M', 'M', 50000, 9),
('CM', 'CM', 100000, 10);

INSERT INTO customer_types (name, code, description, default_discount_percentage, credit_days) VALUES
('Retail Customer', 'RETAIL', 'Individual customers', 0, 0),
('Wholesale Customer', 'WHOLESALE', 'Bulk buyers', 15, 30),
('Doctor/Practitioner', 'DOCTOR', 'Homeopathic doctors', 20, 15),
('Pharmacy', 'PHARMACY', 'Retail pharmacies', 12, 30),
('Clinic', 'CLINIC', 'Homeopathic clinics', 18, 15),
('Distributor', 'DISTRIBUTOR', 'Regional distributors', 25, 45),
('Sub-Dealer', 'SUBDEALER', 'Sub-dealers', 10, 30);

INSERT INTO gst_rates (product_category, hsn_code, cgst_rate, sgst_rate, igst_rate) VALUES
('Homeopathic Medicines', '30049099', 6, 6, 12),
('Homeopathic Tinctures', '30049011', 6, 6, 12),
('Homeopathic Globules', '30049019', 6, 6, 12),
('Homeopathic Tablets', '30049021', 6, 6, 12),
('Homeopathic Ointments', '30049031', 9, 9, 18);

-- Create indexes for performance
CREATE INDEX idx_homeopathy_products_brand_id ON homeopathy_products(brand_id);
CREATE INDEX idx_homeopathy_products_potency_id ON homeopathy_products(potency_id);
CREATE INDEX idx_homeopathy_products_sku ON homeopathy_products(sku);
CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX idx_product_batches_batch_number ON product_batches(batch_number);
CREATE INDEX idx_stock_aging_product_id ON stock_aging(product_id);
CREATE INDEX idx_stock_aging_days_in_stock ON stock_aging(days_in_stock);
CREATE INDEX idx_batch_movements_batch_id ON batch_movements(batch_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product_id ON supplier_products(product_id);

-- Create functions for automated calculations
CREATE OR REPLACE FUNCTION update_batch_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update available quantity when movements occur
    UPDATE product_batches 
    SET quantity_available = quantity_received - 
        COALESCE((SELECT SUM(quantity) FROM batch_movements 
                  WHERE batch_id = NEW.batch_id AND movement_type = 'OUT'), 0) -
        COALESCE((SELECT SUM(quantity) FROM batch_movements 
                  WHERE batch_id = NEW.batch_id AND movement_type = 'DAMAGE'), 0) +
        COALESCE((SELECT SUM(quantity) FROM batch_movements 
                  WHERE batch_id = NEW.batch_id AND movement_type = 'RETURN'), 0),
        updated_at = NOW()
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_quantity
    AFTER INSERT ON batch_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_quantity();

-- Function to calculate stock aging
CREATE OR REPLACE FUNCTION calculate_stock_aging()
RETURNS VOID AS $$
BEGIN
    DELETE FROM stock_aging WHERE analysis_date < CURRENT_DATE;
    
    INSERT INTO stock_aging (
        product_id, batch_id, quantity, days_in_stock, aging_category,
        value_at_cost, value_at_selling_price, calculated_holding_cost
    )
    SELECT 
        pb.product_id,
        pb.id as batch_id,
        pb.quantity_available,
        CURRENT_DATE - pb.created_at::date as days_in_stock,
        CASE 
            WHEN CURRENT_DATE - pb.created_at::date <= 30 THEN '0-30'
            WHEN CURRENT_DATE - pb.created_at::date <= 60 THEN '31-60'
            WHEN CURRENT_DATE - pb.created_at::date <= 90 THEN '61-90'
            WHEN CURRENT_DATE - pb.created_at::date <= 180 THEN '91-180'
            ELSE '180+'
        END as aging_category,
        pb.quantity_available * pb.purchase_price as value_at_cost,
        pb.quantity_available * pb.selling_price as value_at_selling_price,
        (pb.quantity_available * pb.purchase_price * 8.0 / 100 / 30 * 
         (CURRENT_DATE - pb.created_at::date)) as calculated_holding_cost
    FROM product_batches pb
    WHERE pb.quantity_available > 0 AND pb.is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE homeopathy_products IS 'Enhanced products table for homeopathy business with brand, potency, and regulatory compliance';
COMMENT ON TABLE product_batches IS 'Batch-wise inventory tracking with expiry dates and cost variations';
COMMENT ON TABLE stock_aging IS 'Stock aging analysis for identifying slow-moving and dead stock';
COMMENT ON TABLE suppliers IS 'Supplier management with credit terms and performance tracking';
COMMENT ON TABLE purchase_orders IS 'Purchase order management with approval workflow';
