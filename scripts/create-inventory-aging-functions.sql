-- Advanced inventory aging functions and procedures

-- Function to calculate comprehensive stock aging analysis
CREATE OR REPLACE FUNCTION calculate_stock_aging()
RETURNS VOID AS $$
BEGIN
    -- Delete existing analysis for today
    DELETE FROM stock_aging WHERE analysis_date = CURRENT_DATE;
    
    -- Insert fresh stock aging analysis
    INSERT INTO stock_aging (
        product_id, 
        batch_id, 
        quantity, 
        days_in_stock, 
        aging_category,
        value_at_cost, 
        value_at_selling_price, 
        calculated_holding_cost,
        is_dead_stock,
        last_sale_date,
        analysis_date
    )
    SELECT 
        pb.product_id,
        pb.id as batch_id,
        pb.quantity_available as quantity,
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
        -- Calculate holding cost: (quantity * purchase_price * holding_rate * days) / 30
        (pb.quantity_available * pb.purchase_price * 8.0 / 100 / 30 * 
         (CURRENT_DATE - pb.created_at::date)) as calculated_holding_cost,
        -- Mark as dead stock if no sales in 180+ days and older than 180 days
        CASE 
            WHEN CURRENT_DATE - pb.created_at::date > 180 
                 AND NOT EXISTS (
                     SELECT 1 FROM order_items oi 
                     WHERE oi.batch_id = pb.id 
                     AND oi.created_at > CURRENT_DATE - INTERVAL '180 days'
                 ) THEN true
            ELSE false
        END as is_dead_stock,
        -- Get last sale date
        (SELECT MAX(oi.created_at) 
         FROM order_items oi 
         WHERE oi.batch_id = pb.id) as last_sale_date,
        CURRENT_DATE as analysis_date
    FROM product_batches pb
    WHERE pb.quantity_available > 0 
      AND pb.is_active = true;
      
    -- Update products with high-value flag based on current stock value
    UPDATE homeopathy_products 
    SET is_high_value = CASE 
        WHEN (
            SELECT SUM(pb.quantity_available * pb.purchase_price) 
            FROM product_batches pb 
            WHERE pb.product_id = homeopathy_products.id 
              AND pb.quantity_available > 0
        ) >= high_value_threshold THEN true
        ELSE false
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory turnover report
CREATE OR REPLACE FUNCTION get_inventory_turnover_report()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    brand_name TEXT,
    total_stock_value DECIMAL,
    total_sold_value DECIMAL,
    turnover_ratio DECIMAL,
    turnover_category TEXT,
    avg_days_in_stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hp.id as product_id,
        hp.name as product_name,
        b.name as brand_name,
        COALESCE(SUM(pb.quantity_available * pb.purchase_price), 0) as total_stock_value,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_sold_value,
        CASE 
            WHEN COALESCE(SUM(pb.quantity_available * pb.purchase_price), 0) > 0 
            THEN COALESCE(SUM(oi.quantity * oi.unit_price), 0) / SUM(pb.quantity_available * pb.purchase_price)
            ELSE 0
        END as turnover_ratio,
        CASE 
            WHEN COALESCE(SUM(oi.quantity * oi.unit_price), 0) / NULLIF(SUM(pb.quantity_available * pb.purchase_price), 0) >= 4 THEN 'Fast Moving'
            WHEN COALESCE(SUM(oi.quantity * oi.unit_price), 0) / NULLIF(SUM(pb.quantity_available * pb.purchase_price), 0) >= 2 THEN 'Medium Moving'
            WHEN COALESCE(SUM(oi.quantity * oi.unit_price), 0) / NULLIF(SUM(pb.quantity_available * pb.purchase_price), 0) >= 0.5 THEN 'Slow Moving'
            ELSE 'Dead Stock'
        END as turnover_category,
        COALESCE(AVG(CURRENT_DATE - pb.created_at::date)::INTEGER, 0) as avg_days_in_stock
    FROM homeopathy_products hp
    LEFT JOIN brands b ON hp.brand_id = b.id
    LEFT JOIN product_batches pb ON hp.id = pb.product_id AND pb.quantity_available > 0
    LEFT JOIN order_items oi ON pb.id = oi.batch_id 
        AND oi.created_at >= CURRENT_DATE - INTERVAL '365 days'
    WHERE hp.is_active = true
    GROUP BY hp.id, hp.name, b.name
    ORDER BY turnover_ratio DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get ABC analysis (Pareto analysis) of inventory
CREATE OR REPLACE FUNCTION get_abc_analysis()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    brand_name TEXT,
    annual_sales_value DECIMAL,
    cumulative_percentage DECIMAL,
    abc_category CHAR(1)
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            hp.id as product_id,
            hp.name as product_name,
            b.name as brand_name,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0) as annual_sales_value
        FROM homeopathy_products hp
        LEFT JOIN brands b ON hp.brand_id = b.id
        LEFT JOIN product_batches pb ON hp.id = pb.product_id
        LEFT JOIN order_items oi ON pb.id = oi.batch_id 
            AND oi.created_at >= CURRENT_DATE - INTERVAL '365 days'
        WHERE hp.is_active = true
        GROUP BY hp.id, hp.name, b.name
    ),
    ranked_sales AS (
        SELECT *,
            SUM(annual_sales_value) OVER () as total_sales,
            SUM(annual_sales_value) OVER (ORDER BY annual_sales_value DESC) as cumulative_sales
        FROM sales_data
        WHERE annual_sales_value > 0
        ORDER BY annual_sales_value DESC
    )
    SELECT 
        rs.product_id,
        rs.product_name,
        rs.brand_name,
        rs.annual_sales_value,
        (rs.cumulative_sales / rs.total_sales * 100) as cumulative_percentage,
        CASE 
            WHEN (rs.cumulative_sales / rs.total_sales * 100) <= 80 THEN 'A'
            WHEN (rs.cumulative_sales / rs.total_sales * 100) <= 95 THEN 'B'
            ELSE 'C'
        END as abc_category
    FROM ranked_sales;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate optimal reorder points based on sales velocity
CREATE OR REPLACE FUNCTION calculate_optimal_reorder_points()
RETURNS VOID AS $$
BEGIN
    UPDATE homeopathy_products 
    SET reorder_point = GREATEST(
        -- Calculate based on average daily sales * lead time + safety stock
        COALESCE((
            SELECT CEIL(
                (SUM(oi.quantity) / 365.0) * 30 + -- 30 days lead time
                (SUM(oi.quantity) / 365.0) * 7    -- 7 days safety stock
            )
            FROM order_items oi
            JOIN product_batches pb ON oi.batch_id = pb.id
            WHERE pb.product_id = homeopathy_products.id
              AND oi.created_at >= CURRENT_DATE - INTERVAL '365 days'
        ), minimum_stock_level),
        minimum_stock_level
    )
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_aging_analysis_date ON stock_aging(analysis_date);
CREATE INDEX IF NOT EXISTS idx_stock_aging_days_in_stock ON stock_aging(days_in_stock);
CREATE INDEX IF NOT EXISTS idx_stock_aging_is_dead_stock ON stock_aging(is_dead_stock);
CREATE INDEX IF NOT EXISTS idx_stock_aging_value_at_cost ON stock_aging(value_at_cost);
CREATE INDEX IF NOT EXISTS idx_order_items_batch_id_created_at ON order_items(batch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_product_batches_created_at ON product_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_product_batches_quantity_available ON product_batches(quantity_available);

COMMENT ON FUNCTION calculate_stock_aging() IS 'Calculates comprehensive stock aging analysis with holding costs and dead stock identification';
COMMENT ON FUNCTION get_inventory_turnover_report() IS 'Generates inventory turnover analysis to identify fast/slow moving products';
COMMENT ON FUNCTION get_abc_analysis() IS 'Performs ABC analysis (Pareto) to categorize products by sales value contribution';
COMMENT ON FUNCTION calculate_optimal_reorder_points() IS 'Calculates optimal reorder points based on historical sales velocity and lead times';
