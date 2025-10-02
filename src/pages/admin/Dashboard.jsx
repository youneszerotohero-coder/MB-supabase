import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Globe,
  Store
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import analyticsService from "@/services/analyticsService";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'dzd'
  }).format(amount);
};

// Helper function to format number with commas
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('daily'); // daily, weekly, monthly - single period for both stats and chart
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Listen for campaign changes to refresh dashboard
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'admin_campaigns') {
        // Refresh dashboard when campaigns are modified
        fetchDashboardData();
        fetchProductData();
      }
    });

    return () => unsubscribe?.();
  }, [queryClient]);

  // Get days based on period
  const getDaysForPeriod = (period) => {
    switch (period) {
      case 'daily': return 30;
      case 'weekly': return 84; // ~12 weeks
      case 'monthly': return 365; // 12 months
      default: return 30;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [stats, chart] = await Promise.all([
        analyticsService.getDashboardStats(period, getDaysForPeriod(period)),
        analyticsService.getChartData(
          period, 
          getDaysForPeriod(period)
        )
      ]);

      setDashboardData(stats);
      setChartData(Array.isArray(chart) ? chart : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      if (err.response?.status === 500) {
        setError('Server error occurred. Please check if the backend is running and try again.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view analytics.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
      
      setDashboardData(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product performance data with pagination
  const fetchProductData = async () => {
    try {
      const response = await analyticsService.getProductPerformance(
        10,
        currentPage
      );
      
      setProductData(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching product data:', err);
      setProductData([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  useEffect(() => {
    fetchProductData();
  }, [currentPage]);

  // Generate stats array from dashboard data
  const getStatsArray = () => {
    if (!dashboardData) return [];
    
    return [
      {
        name: "Revenu Total",
        value: formatCurrency(dashboardData.revenue || 0),
        breakdown: [
          { label: "En ligne", value: formatCurrency(dashboardData.onlineRevenue || 0), icon: Globe },
          { label: "En magasin", value: formatCurrency(dashboardData.instoreRevenue || 0), icon: Store }
        ],
        icon: DollarSign,
        color: "bg-blue-500"
      },
      {
        name: "Bénéfice Total",
        value: formatCurrency(dashboardData.netProfit || 0),
        breakdown: [
          { label: "En ligne", value: formatCurrency(dashboardData.onlineProfit || 0), icon: Globe },
          { label: "En magasin", value: formatCurrency(dashboardData.instoreProfit || 0), icon: Store }
        ],
        icon: TrendingUp,
        color: "bg-green-500"
      },
      {
        name: "Valeur du Stock",
        value: formatCurrency(dashboardData.stockValue || 0),
        icon: Package,
        color: "bg-purple-500"
      },
      {
        name: "Dépenses Campagnes",
        value: formatCurrency(dashboardData.campaignSpend || 0),
        icon: Megaphone,
        color: "bg-orange-500"
      },
    ];
  };

  // Format date based on period
  const formatDateForPeriod = (dateString, period) => {
    const date = new Date(dateString);
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{formatDateForPeriod(label, period)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-2">
            Aperçu de la performance de votre e-commerce
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Toggle */}
          <div className="flex gap-2 bg-muted p-1 rounded-lg">
            <Button
            className="text-white"
              variant={period === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('daily')}
            >
              Jour
            </Button>
            <Button
            className="text-white"
              variant={period === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              Semaine
            </Button>
            <Button
            className="text-white"
              variant={period === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Mois
            </Button>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={fetchDashboardData}
            disabled={loading}
            variant="outline"
            size="icon"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Top Section - 4 Cards with Breakdowns */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {getStatsArray().map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground ml-3">{stat.value}</div>
              
              {/* Breakdown for Revenue and Profit */}
              {stat.breakdown && (
                <div className="mt-3 space-y-2 pt-3 border-t px-3">
                  {stat.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Section - Sales Graph */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div>
            <CardTitle className="text-foreground">Analyse des Ventes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Dépenses campagnes vs revenus vs bénéfices dans le temps
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCampaign" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => formatDateForPeriod(value, period)}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit"
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="campaignSpend" 
                    name="Campaign Spend"
                    stroke="#f97316" 
                    fillOpacity={1} 
                    fill="url(#colorCampaign)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section - Products Table */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Performance des Produits</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bénéfice = ventes uniquement • Performance = inclut l'investissement en stock
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {productData.length > 0 ? (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Produit</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Commandes</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Revenu</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Dépenses Campagnes</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Bénéfice</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((product) => (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 text-foreground font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-foreground">{formatNumber(product.orders || 0)}</td>
                        <td className="py-3 px-4 text-foreground">{formatCurrency(product.revenue || 0)}</td>
                        <td className="py-3 px-4 text-foreground">{formatCurrency(product.campaignSpend || 0)}</td>
                        <td className={`py-3 px-4 font-semibold ${product.profit < 0 ? "text-red-500" : "text-green-500"}`}>
                          {formatCurrency(product.profit || 0)}
                        </td>
                        <td className={`py-3 px-4 font-semibold ${product.performance < 0 ? "text-red-500" : "text-green-500"}`}>
                          {formatCurrency(product.performance || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Affichage de {((currentPage - 1) * pagination.limit) + 1} à {Math.min(currentPage * pagination.limit, pagination.total)} sur {pagination.total} produits
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === pagination.totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, index, array) => {
                            // Add ellipsis
                            const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsisBefore && <span className="px-2">...</span>}
                                <Button
                                  variant={currentPage === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="min-w-[40px]"
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune donnée de performance produit disponible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}