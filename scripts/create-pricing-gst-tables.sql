-- Create pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    product_category VARCHAR(100),
    brand_id UUID REFERENCES brands(id),
    min_quantity INTEGER NOT NULL DEFAULT 1,
    max_quantity INTEGER,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer type pricing table
CREATE TABLE IF NOT EXISTS customer_type_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_type VARCHAR(50) NOT NULL UNIQUE,
    base_discount DECIMAL(5,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create volume discounts table
CREATE TABLE IF NOT EXISTS volume_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_type VARCHAR(50) NOT NULL,
    min_quantity INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer special rates table
CREATE TABLE IF NOT EXISTS customer_special_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    customer_type VARCHAR(50),
    product_id UUID REFERENCES products(id),
    special_price DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GST rates table
CREATE TABLE IF NOT EXISTS gst_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add GST rate to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 12.00;

-- Insert default customer type pricing
INSERT INTO customer_type_pricing (customer_type, base_discount, credit_days, credit_limit) VALUES
('retail', 0, 0, 0),
('wholesale', 15, 30, 100000),
('doctor', 20, 45, 50000),
('pharmacy', 18, 30, 75000),
('clinic', 22, 60, 150000),
('distributor', 25, 30, 500000)
ON CONFLICT (customer_type) DO NOTHING;

-- Insert default GST rates
INSERT INTO gst_rates (category, rate, description) VALUES
('Homeopathy Medicines', 12.00, 'Standard rate for homeopathic medicines'),
('Books & Literature', 5.00, 'Reduced rate for educational materials'),
('Consultation Services', 18.00, 'Standard rate for professional services'),
('Medical Equipment', 12.00, 'Standard rate for medical devices'),
('Nutritional Supplements', 18.00, 'Standard rate for supplements')
ON CONFLICT DO NOTHING;

-- Insert sample volume discounts
INSERT INTO volume_discounts (customer_type, min_quantity, discount_percentage) VALUES
('wholesale', 50, 5),
('wholesale', 100, 8),
('wholesale', 500, 12),
('doctor', 25, 3),
('doctor', 100, 7),
('pharmacy', 30, 4),
('pharmacy', 150, 9),
('distributor', 100, 10),
('distributor', 500, 15),
('distributor', 1000, 20);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_customer_type ON pricing_rules(customer_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_volume_discounts_customer_type ON volume_discounts(customer_type);
CREATE INDEX IF NOT EXISTS idx_special_rates_customer ON customer_special_rates(customer_id);
CREATE INDEX IF NOT EXISTS idx_special_rates_product ON customer_special_rates(product_id);

-- Create function to calculate dynamic pricing
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
    p_product_id UUID,
    p_customer_type VARCHAR,
    p_quantity INTEGER,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE(
    base_price DECIMAL,
    discounted_price DECIMAL,
    discount_amount DECIMAL,
    gst_rate DECIMAL,
    gst_amount DECIMAL,
    total_price DECIMAL
) AS $$
DECLARE
    v_base_price DECIMAL;
    v_gst_rate DECIMAL;
    v_special_price DECIMAL;
    v_discount_amount DECIMAL := 0;
    v_final_price DECIMAL;
BEGIN
    -- Get base product price and GST rate
    SELECT mrp, COALESCE(gst_rate, 12.00)
    INTO v_base_price, v_gst_rate
    FROM products
    WHERE id = p_product_id;
    
    IF v_base_price IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Check for customer-specific special rates
    IF p_customer_id IS NOT NULL THEN
        SELECT special_price
        INTO v_special_price
        FROM customer_special_rates
        WHERE customer_id = p_customer_id
        AND product_id = p_product_id
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE);
    END IF;
    
    IF v_special_price IS NOT NULL THEN
        v_final_price := v_special_price;
        v_discount_amount := v_base_price - v_special_price;
    ELSE
        -- Apply pricing rules
        SELECT 
            CASE 
                WHEN discount_type = 'percentage' THEN v_base_price * (discount_value / 100)
                ELSE discount_value
            END
        INTO v_discount_amount
        FROM pricing_rules
        WHERE customer_type = p_customer_type
        AND is_active = true
        AND min_quantity <= p_quantity
        AND (max_quantity IS NULL OR max_quantity >= p_quantity)
        AND valid_from <= CURRENT_DATE
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
        ORDER BY discount_value DESC
        LIMIT 1;
        
        v_discount_amount := COALESCE(v_discount_amount, 0);
        v_final_price := v_base_price - v_discount_amount;
    END IF;
    
    -- Calculate GST
    RETURN QUERY SELECT
        v_base_price,
        v_final_price,
        v_discount_amount,
        v_gst_rate,
        (v_final_price * v_gst_rate / 100),
        (v_final_price + (v_final_price * v_gst_rate / 100));
END;
$$ LANGUAGE plpgsql;
