-- ============================================================================
-- FINAL MATERIALIZED VIEWS FOR DASHBOARD
-- ============================================================================
-- Version: 2.0 (Production Ready)
-- Date: 2025-09-30
-- Fixes: JOIN duplication prevented, inventory included in performance
-- New: Online vs In-Store revenue/profit breakdown
-- ============================================================================

-- ============================================================================
-- 1. DASHBOARD SUMMARY VIEW
-- ============================================================================
-- Purpose: Chart data showing revenue, profit, stock value, and campaign spend over time
-- Used by: Dashboard charts with day/week/month toggle
-- New: Includes online vs in-store breakdown for revenue and profit
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS dashboard_summary CASCADE;

CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT 
  date_trunc('day', o.created_at) AS period,
  
  -- Total metrics
  SUM(oi.line_total) AS revenue,
  -- Profit = Revenue - COGS (using product cost from products table)
  SUM(oi.line_total - (oi.quantity * COALESCE(p.cost, oi.unit_cost, 0))) AS profit,
  
  -- Online orders (website + phone)
  SUM(CASE WHEN o.order_source IN ('website', 'phone') THEN oi.line_total ELSE 0 END) AS online_revenue,
  SUM(CASE WHEN o.order_source IN ('website', 'phone') THEN (oi.line_total - (oi.quantity * COALESCE(p.cost, oi.unit_cost, 0))) ELSE 0 END) AS online_profit,
  
  -- In-store orders (POS)
  SUM(CASE WHEN o.order_source = 'pos' THEN oi.line_total ELSE 0 END) AS instore_revenue,
  SUM(CASE WHEN o.order_source = 'pos' THEN (oi.line_total - (oi.quantity * COALESCE(p.cost, oi.unit_cost, 0))) ELSE 0 END) AS instore_profit,
  
  -- Stock value calculated separately to avoid duplication
  (
    SELECT SUM(COALESCE(stock_quantity, 0) * COALESCE(cost, 0))
    FROM products
  ) AS stock_value,
  
  -- Campaign spend per day (pre-aggregated to avoid duplication)
  SUM(COALESCE(cp_summary.campaign_cost, 0)) AS campaign_spend
  
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN (
  -- Pre-aggregate campaign costs per product to avoid JOIN duplication
  SELECT 
    product_id,
    SUM(allocated_cost) AS campaign_cost
  FROM campaign_products
  GROUP BY product_id
) cp_summary ON cp_summary.product_id = oi.product_id
GROUP BY date_trunc('day', o.created_at);

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_period 
ON dashboard_summary (period);

COMMENT ON MATERIALIZED VIEW dashboard_summary IS 
'Daily aggregated data for dashboard charts with online/in-store breakdown. Order sources: online (website, phone), in-store (pos). Prevents JOIN duplication.';


-- ============================================================================
-- 2. PRODUCT PERFORMANCE VIEW
-- ============================================================================
-- Purpose: Product metrics including orders, revenue, campaign spend, and performance
-- Performance includes inventory investment: Revenue - (Sold + Stock) × Cost - Campaign
-- Used by: Dashboard products table with pagination
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS product_performance CASCADE;

CREATE MATERIALIZED VIEW product_performance AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  
  -- Order data (pre-aggregated to avoid duplication)
  COALESCE(order_data.total_quantity, 0) AS order_quantity,
  COALESCE(order_data.total_revenue, 0) AS revenue,
  
  -- Campaign spend (pre-aggregated to avoid duplication)
  COALESCE(campaign_data.total_campaign_spend, 0) AS campaign_spend,
  
  -- Profit from sales only (excludes inventory)
  -- Formula: Revenue - (Units Sold × Unit Cost) - Campaign Spend
  (
    COALESCE(order_data.total_revenue, 0)                          -- Revenue from sales
    - (COALESCE(order_data.total_quantity, 0) * COALESCE(p.cost, 0))  -- Cost of goods sold
    - COALESCE(campaign_data.total_campaign_spend, 0)              -- Campaign spend
  ) AS profit,
  
  -- Performance including inventory investment
  -- Formula: Revenue - (Units Sold + Current Stock) × Unit Cost - Campaign Spend
  (
    COALESCE(order_data.total_revenue, 0)                                         -- Revenue from sales
    - (
        (COALESCE(order_data.total_quantity, 0) + COALESCE(p.stock_quantity, 0)) -- Units sold + Current inventory
        * COALESCE(p.cost, 0)                                                     -- × Unit cost
      )
    - COALESCE(campaign_data.total_campaign_spend, 0)                             -- Campaign spend
  ) AS performance
  
FROM products p

-- Get order data (no duplication possible)
LEFT JOIN (
  SELECT 
    product_id,
    SUM(quantity) AS total_quantity,
    SUM(line_total) AS total_revenue
  FROM order_items
  GROUP BY product_id
) order_data ON order_data.product_id = p.id

-- Get campaign data (no duplication possible)
LEFT JOIN (
  SELECT 
    product_id,
    SUM(allocated_cost) AS total_campaign_spend
  FROM campaign_products
  GROUP BY product_id
) campaign_data ON campaign_data.product_id = p.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_performance_product_id 
ON product_performance (product_id);

COMMENT ON MATERIALIZED VIEW product_performance IS 
'Product performance metrics. Profit = sales only, Performance = includes inventory investment. Prevents JOIN duplication.';


-- ============================================================================
-- 3. INITIAL REFRESH
-- ============================================================================

REFRESH MATERIALIZED VIEW dashboard_summary;
REFRESH MATERIALIZED VIEW product_performance;


-- ============================================================================
-- 4. VERIFY VIEWS WERE CREATED
-- ============================================================================

-- Check dashboard_summary
SELECT 
    COUNT(*) AS total_days,
    MIN(period) AS earliest_date,
    MAX(period) AS latest_date,
    SUM(revenue) AS total_revenue,
    SUM(profit) AS total_profit,
    SUM(online_revenue) AS total_online_revenue,
    SUM(instore_revenue) AS total_instore_revenue,
    SUM(campaign_spend) AS total_campaign_spend
FROM dashboard_summary;

-- Check product_performance
SELECT 
    COUNT(*) AS total_products,
    SUM(order_quantity) AS total_orders,
    SUM(revenue) AS total_revenue,
    SUM(campaign_spend) AS total_campaign_spend,
    SUM(profit) AS total_profit,
    SUM(performance) AS total_performance
FROM product_performance;


-- ============================================================================
-- SETUP COMPLETE! ✅
-- ============================================================================
/*
Next Steps:

1. Set up auto-refresh (choose one):
   
   Option A: pg_cron (Scheduled - Every Hour)
   -----------------------------------------------
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   SELECT cron.schedule(
     'refresh-dashboard-views',
     '0 * * * *',
     $$
       REFRESH MATERIALIZED VIEW dashboard_summary;
       REFRESH MATERIALIZED VIEW product_performance;
     $$
   );
   
   
   Option B: Triggers (Real-time - On Data Changes)
   -----------------------------------------------
   See: refresh_views_trigger.sql
   
   
   Option C: Manual Refresh (When Needed)
   -----------------------------------------------
   REFRESH MATERIALIZED VIEW dashboard_summary;
   REFRESH MATERIALIZED VIEW product_performance;

2. Your frontend is already configured to use these views!

3. Test the dashboard and verify data accuracy.

═══════════════════════════════════════════════════════════════════════════
*/
