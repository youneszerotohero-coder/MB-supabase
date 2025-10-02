import { supabase } from '../lib/supabaseClient';

export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats(period = 'daily', days = 30) {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(endDate.getDate() - days);
          break;
        case 'weekly':
          // days represents the total number of days to look back (e.g., 84 days = ~12 weeks)
          startDate.setDate(endDate.getDate() - days);
          break;
        case 'monthly':
          // days represents the total number of days to look back (e.g., 365 days = ~12 months)
          startDate.setDate(endDate.getDate() - days);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      let query = supabase
        .from('dashboard_summary')
        .select('revenue, profit, campaign_spend, stock_value, online_revenue, online_profit, instore_revenue, instore_profit')
        .gte('period', startDate.toISOString())
        .lte('period', endDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate the data
      const stats = (data || []).reduce((acc, item) => ({
        revenue: acc.revenue + parseFloat(item.revenue || 0),
        netProfit: acc.netProfit + parseFloat(item.profit || 0),
        campaignSpend: acc.campaignSpend + parseFloat(item.campaign_spend || 0),
        stockValue: acc.stockValue + parseFloat(item.stock_value || 0),
        onlineRevenue: acc.onlineRevenue + parseFloat(item.online_revenue || 0),
        onlineProfit: acc.onlineProfit + parseFloat(item.online_profit || 0),
        instoreRevenue: acc.instoreRevenue + parseFloat(item.instore_revenue || 0),
        instoreProfit: acc.instoreProfit + parseFloat(item.instore_profit || 0),
      }), {
        revenue: 0,
        netProfit: 0,
        campaignSpend: 0,
        stockValue: 0,
        onlineRevenue: 0,
        onlineProfit: 0,
        instoreRevenue: 0,
        instoreProfit: 0,
        ordersCount: 0
      });

      // Get orders count for the same period
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      stats.ordersCount = ordersCount || 0;

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        revenue: 0,
        ordersCount: 0,
        campaignSpend: 0,
        netProfit: 0,
        stockValue: 0,
        onlineRevenue: 0,
        onlineProfit: 0,
        instoreRevenue: 0,
        instoreProfit: 0
      };
    }
  },

  // Get sales over time data
  async getSalesOverTime(period = 'daily', days = 30, fromDate = null, toDate = null) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total, id')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching sales over time:', error);
      return [];
    }
  },

  // Get chart data with campaign spend, revenue, and profit (from dashboard_summary view)
  async getChartData(period = 'daily', days = 30, fromDate = null, toDate = null) {
    try {
      let query = supabase
        .from('dashboard_summary')
        .select('period, revenue, profit, campaign_spend, stock_value')
        .order('period', { ascending: true });

      // Calculate date range
      const endDate = toDate ? new Date(toDate) : new Date();
      const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      query = query.gte('period', startDate.toISOString())
                   .lte('period', endDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      // Transform and group data based on period
      const groupedData = groupByPeriod(data || [], period);
      
      return groupedData.map(item => ({
        date: item.period,
        revenue: parseFloat(item.revenue || 0),
        profit: parseFloat(item.profit || 0),
        campaignSpend: parseFloat(item.campaign_spend || 0),
        stockValue: parseFloat(item.stock_value || 0)
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  },

  // Get product profitability data
  async getProductProfitability(categoryId = null, limit = 50, sortBy = 'profit', sortOrder = 'desc', page = 1) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Map frontend sortBy to database columns
      const sortColumn = sortBy === 'margin' ? 'profit_margin' : sortBy;
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
                   .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching product profitability:', error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  },

  // Get product performance with orders and campaign spend (from product_performance view)
  async getProductPerformance(limit = 10, page = 1, fromDate = null, toDate = null) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('product_performance')
        .select('*', { count: 'exact' })
        .order('revenue', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data from the materialized view to match frontend expectations
      const transformedData = (data || []).map(item => ({
        id: item.product_id,
        name: item.product_name,
        orders: parseInt(item.order_quantity || 0),
        revenue: parseFloat(item.revenue || 0),
        campaignSpend: parseFloat(item.campaign_spend || 0),
        profit: parseFloat(item.profit || 0),
        performance: parseFloat(item.performance || 0)
      }));

      return {
        data: transformedData,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching product performance:', error);
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
  },

  // Get total stock value
  async getTotalStockValue() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity, cost');

      if (error) throw error;

      const totalStockValue = (data || []).reduce((total, product) => {
        return total + (parseFloat(product.stock_quantity || 0) * parseFloat(product.cost || 0));
      }, 0);

      return totalStockValue;
    } catch (error) {
      console.error('Error fetching total stock value:', error);
      return 0;
    }
  }
};

// Helper function to group data by period
function groupByPeriod(data, period) {
  if (period === 'daily') {
    return data; // Already grouped by day in the view
  }

  const grouped = {};

  data.forEach(item => {
    const date = new Date(item.period);
    let key;

    if (period === 'weekly') {
      // Get the Monday of the week
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      key = monday.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      // Get the first day of the month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      key = item.period;
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        revenue: 0,
        profit: 0,
        campaign_spend: 0,
        stock_value: 0,
        count: 0
      };
    }

    grouped[key].revenue += parseFloat(item.revenue || 0);
    grouped[key].profit += parseFloat(item.profit || 0);
    grouped[key].campaign_spend += parseFloat(item.campaign_spend || 0);
    grouped[key].stock_value += parseFloat(item.stock_value || 0);
    grouped[key].count += 1;
  });

  // For stock_value, use average instead of sum
  return Object.values(grouped).map(item => ({
    ...item,
    stock_value: item.count > 0 ? item.stock_value / item.count : 0
  }));
}

export default analyticsService;