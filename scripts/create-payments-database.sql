-- Payments Service Database Schema
-- PostgreSQL schema for payment processing and financial transactions

-- =============================================================================
-- DATABASE SETUP
-- =============================================================================

-- Create database if it doesn't exist (run this separately)
-- CREATE DATABASE ecom_payments;

-- Connect to the payments database
\c ecom_payments;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PAYMENT METHODS TABLE
-- =============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer Information
    customer_id VARCHAR(255) NOT NULL,
    
    -- Payment Method Details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'credit_card', 'debit_card', 'bank_account', 'digital_wallet', 
        'buy_now_pay_later', 'cryptocurrency', 'gift_card', 'store_credit'
    )),
    provider VARCHAR(100) NOT NULL, -- stripe, paypal, square, etc.
    
    -- Card Information (encrypted/tokenized)
    card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
    card_last_four VARCHAR(4),
    card_exp_month INTEGER CHECK (card_exp_month BETWEEN 1 AND 12),
    card_exp_year INTEGER,
    card_fingerprint VARCHAR(255), -- Unique identifier for the card
    
    -- Bank Account Information (encrypted/tokenized)
    bank_name VARCHAR(255),
    account_type VARCHAR(50), -- checking, savings
    account_last_four VARCHAR(4),
    routing_number_last_four VARCHAR(4),
    
    -- Digital Wallet Information
    wallet_type VARCHAR(50), -- apple_pay, google_pay, paypal, etc.
    wallet_email VARCHAR(255),
    
    -- Tokenization
    provider_token VARCHAR(500) NOT NULL, -- Token from payment provider
    provider_customer_id VARCHAR(255), -- Customer ID at provider
    
    -- Status and Verification
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'failed_verification')),
    
    -- Billing Address
    billing_address JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Indexes for payment_methods table
CREATE INDEX idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(customer_id, is_default) WHERE is_default = TRUE;

-- =============================================================================
-- PAYMENT TRANSACTIONS TABLE
-- =============================================================================

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction Identification
    transaction_number VARCHAR(100) UNIQUE NOT NULL,
    external_transaction_id VARCHAR(255), -- Provider transaction ID
    
    -- Order Information
    order_id VARCHAR(255) NOT NULL,
    order_number VARCHAR(100),
    
    -- Customer Information
    customer_id VARCHAR(255) NOT NULL,
    
    -- Payment Method
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_method_type VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(100) NOT NULL,
    
    -- Transaction Type
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'payment', 'refund', 'partial_refund', 'chargeback', 'chargeback_reversal',
        'authorization', 'capture', 'void', 'adjustment'
    )),
    
    -- Transaction Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'succeeded', 'failed', 'cancelled', 
        'requires_action', 'requires_confirmation', 'disputed'
    )),
    
    -- Financial Information
    currency VARCHAR(3) DEFAULT 'USD',
    amount DECIMAL(12, 2) NOT NULL,
    fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    
    -- Authorization Information
    authorization_code VARCHAR(100),
    authorization_expires_at TIMESTAMP,
    
    -- Processing Information
    processor_response_code VARCHAR(50),
    processor_response_message TEXT,
    processor_reference_number VARCHAR(255),
    
    -- Risk Assessment
    risk_score DECIMAL(5, 2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
    fraud_indicators JSONB DEFAULT '[]',
    
    -- Failure Information
    failure_code VARCHAR(100),
    failure_message TEXT,
    failure_reason VARCHAR(255),
    
    -- Dispute Information
    dispute_id VARCHAR(255),
    dispute_reason VARCHAR(255),
    dispute_status VARCHAR(50),
    dispute_evidence JSONB,
    
    -- Timing
    processed_at TIMESTAMP,
    settled_at TIMESTAMP,
    failed_at TIMESTAMP,
    disputed_at TIMESTAMP,
    
    -- Metadata
    description TEXT,
    statement_descriptor VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_transactions table
CREATE INDEX idx_payment_transactions_transaction_number ON payment_transactions(transaction_number);
CREATE INDEX idx_payment_transactions_external_id ON payment_transactions(external_transaction_id);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_payment_method_id ON payment_transactions(payment_method_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_amount ON payment_transactions(amount);

-- =============================================================================
-- PAYMENT WEBHOOKS TABLE
-- =============================================================================

CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Webhook Information
    provider VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    
    -- Processing Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
    
    -- Webhook Data
    payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processing Information
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Related Transaction
    transaction_id UUID REFERENCES payment_transactions(id),
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_webhooks table
CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_event_id ON payment_webhooks(event_id);
CREATE INDEX idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX idx_payment_webhooks_transaction_id ON payment_webhooks(transaction_id);

-- =============================================================================
-- PAYMENT RECONCILIATION TABLE
-- =============================================================================

CREATE TABLE payment_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reconciliation Period
    reconciliation_date DATE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    
    -- Financial Summary
    total_transactions INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_fees DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Reconciliation Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'discrepancy', 'resolved')),
    
    -- Provider Data
    provider_report_id VARCHAR(255),
    provider_settlement_id VARCHAR(255),
    provider_data JSONB,
    
    -- Discrepancy Information
    discrepancy_amount DECIMAL(12, 2) DEFAULT 0.00,
    discrepancy_notes TEXT,
    
    -- Resolution
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment_reconciliation table
CREATE INDEX idx_payment_reconciliation_date ON payment_reconciliation(reconciliation_date);
CREATE INDEX idx_payment_reconciliation_provider ON payment_reconciliation(provider);
CREATE INDEX idx_payment_reconciliation_status ON payment_reconciliation(status);

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
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reconciliation_updated_at BEFORE UPDATE ON payment_reconciliation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    trans_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    trans_num := 'TXN' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get count of transactions today
    SELECT COUNT(*) + 1 INTO counter
    FROM payment_transactions 
    WHERE transaction_number LIKE trans_num || '%';
    
    -- Append counter with zero padding
    trans_num := trans_num || LPAD(counter::TEXT, 6, '0');
    
    RETURN trans_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- Daily payment summary view
CREATE VIEW daily_payment_summary AS
SELECT 
    DATE(created_at) as payment_date,
    payment_provider,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
    SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total_amount,
    SUM(CASE WHEN status = 'succeeded' THEN fee_amount ELSE 0 END) as total_fees,
    SUM(CASE WHEN status = 'succeeded' THEN net_amount ELSE 0 END) as net_amount,
    AVG(CASE WHEN status = 'succeeded' THEN amount END) as average_transaction_amount
FROM payment_transactions
GROUP BY DATE(created_at), payment_provider
ORDER BY payment_date DESC, payment_provider;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Payments database schema created successfully!';
    RAISE NOTICE 'Tables created: payment_methods, payment_transactions, payment_webhooks, payment_reconciliation';
    RAISE NOTICE 'Views created: daily_payment_summary';
    RAISE NOTICE 'Functions created: update_updated_at_column, generate_transaction_number';
    RAISE NOTICE 'Security: Proper indexing and constraints applied';
END $$;
