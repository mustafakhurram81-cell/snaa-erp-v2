-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- These RPCs power the dashboard KPIs, charts, and pipeline widgets.

-- 1. Dashboard Summary KPIs
CREATE OR REPLACE FUNCTION get_dashboard_summary(date_from timestamptz DEFAULT '2000-01-01'::timestamptz)
RETURNS json AS $$
  SELECT json_build_object(
    'total_revenue', COALESCE((SELECT SUM(total_amount) FROM invoices WHERE status = 'paid' AND created_at >= date_from), 0),
    'open_orders', COALESCE((SELECT COUNT(*) FROM sales_orders WHERE status IN ('pending', 'in_progress', 'confirmed') AND created_at >= date_from), 0),
    'active_production', COALESCE((SELECT COUNT(*) FROM production_orders WHERE status IN ('in_progress', 'planned') AND created_at >= date_from), 0),
    'pending_invoices', COALESCE((SELECT SUM(total_amount) FROM invoices WHERE status IN ('pending', 'draft', 'overdue') AND created_at >= date_from), 0),
    'overdue_count', COALESCE((SELECT COUNT(*) FROM invoices WHERE status = 'overdue' AND created_at >= date_from), 0),
    'ar_total', COALESCE((SELECT SUM(total_amount) FROM invoices WHERE status IN ('pending', 'overdue') AND created_at >= date_from), 0),
    'ap_total', COALESCE((SELECT SUM(total_amount) FROM purchase_orders WHERE status IN ('sent', 'draft') AND created_at >= date_from), 0)
  );
$$ LANGUAGE sql STABLE;

-- 2. Revenue Chart Data (monthly aggregation)
CREATE OR REPLACE FUNCTION get_revenue_chart_data(date_from timestamptz DEFAULT '2000-01-01'::timestamptz)
RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT
      TO_CHAR(created_at, 'Mon') AS name,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue,
      COALESCE(SUM(total_amount), 0) AS invoiced
    FROM invoices
    WHERE created_at >= date_from
    GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon')
    ORDER BY DATE_TRUNC('month', created_at)
  ) t;
$$ LANGUAGE sql STABLE;

-- 3. Invoice Pipeline (status breakdown)
CREATE OR REPLACE FUNCTION get_invoice_pipeline(date_from timestamptz DEFAULT '2000-01-01'::timestamptz)
RETURNS json AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT
      status,
      COUNT(*)::int AS count,
      COALESCE(SUM(total_amount), 0) AS amount
    FROM invoices
    WHERE created_at >= date_from
    GROUP BY status
    ORDER BY count DESC
  ) t;
$$ LANGUAGE sql STABLE;
