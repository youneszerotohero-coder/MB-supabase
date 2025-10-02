import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Filter, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import OrderViewDialog from "@/components/OrderViewDialog";
import { getOrders, updateOrderStatus } from "@/services/orderService";

// Mock data removed - now using real API data

const statusConfig = {
  pending: { label: "En attente", class: "bg-warning-light text-warning" },
  confirmed: { label: "Confirmée", class: "bg-primary-light text-primary" },
  processing: { label: "En traitement", class: "bg-primary/10 text-primary" },
  shipped: { label: "Expédiée", class: "bg-accent text-accent-foreground" },
  delivered: { label: "Livrée", class: "bg-success-light text-success" },
  cancelled: { label: "Annulée", class: "bg-destructive-light text-destructive" },
  refunded: { label: "Remboursée", class: "bg-muted text-muted-foreground" }
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders using React Query
  const { data: ordersData, isLoading: loading, error } = useQuery({
    queryKey: ['admin_orders', pagination.page, statusFilter, searchTerm],
    queryFn: async () => {
      const options = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      };
      const response = await getOrders(options);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Update pagination when data changes
  useEffect(() => {
    if (ordersData?.pagination) {
      setPagination(prev => ({
        ...prev,
        ...ordersData.pagination
      }));
    }
  }, [ordersData?.pagination]);

  // Listen for order creation events from POS
  useEffect(() => {
    const handleOrderCreated = (event) => {
      console.log('Order created event received:', event.detail);
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      toast({
        title: "Liste des Commandes Mise à Jour",
        description: "Une nouvelle commande a été ajoutée à la liste.",
      });
    };

    window.addEventListener('orderCreated', handleOrderCreated);
    return () => window.removeEventListener('orderCreated', handleOrderCreated);
  }, [queryClient]);

  // Get orders from query data
  const orders = ordersData?.orders || [];

  // Filter unique wilayas from current orders for the filter dropdown
  const uniqueWilayas = [...new Set(orders.map(order => order.customer_wilaya))].filter(Boolean);

  const filteredOrders = orders.filter(order => {
    const matchesWilaya = wilayaFilter === "all" || order.customer_wilaya === wilayaFilter;
    return matchesWilaya;
  });

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant="secondary" className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setViewDialogOpen(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setStatusUpdating(orderId);
      await updateOrderStatus(orderId, newStatus);
      
      // Invalidate and refetch orders
      await queryClient.invalidateQueries({ queryKey: ['admin_orders'] });

      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour avec succès"
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err.response?.data?.message || "Échec de la mise à jour du statut de la commande",
        variant: "destructive"
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commandes</h1>
          <p className="text-muted-foreground mt-2">
            Gérez et suivez les commandes clients
            {pagination.totalCount > 0 && (
              <span className="ml-2">
                ({pagination.totalCount} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-white" onClick={handleRefresh} disabled={loading || isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 text-white ${loading || isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {/* <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter les Commandes
          </Button> */}
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres des Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de commande, nom du client, téléphone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par wilaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les wilayas</SelectItem>
                {uniqueWilayas.map(wilaya => (
                  <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 cards-mobile">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement des commandes...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center p-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                Réessayer
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="">
              {filteredOrders.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Aucune commande trouvée correspondant à vos filtres.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 font-semibold text-foreground">N° Commande</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Client</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Localisation</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Statut</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Total</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-6">
                          <div className="font-mono text-sm font-medium text-primary">
                            {order.order_number}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-foreground">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.order_items?.length || 0} articles
                          </div>
                          {order.customer_phone && (
                            <div className="text-sm text-muted-foreground">
                              {order.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-foreground">{order.customer_wilaya}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_baladiya}</div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-4 px-6 font-semibold text-foreground">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewOrder(order.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select 
                              value={order.status}
                              onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                              disabled={statusUpdating === order.id}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue placeholder="Mettre à jour" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="confirmed">Confirmée</SelectItem>
                                <SelectItem value="processing">En traitement</SelectItem>
                                <SelectItem value="shipped">Expédiée</SelectItem>
                                <SelectItem value="delivered">Livrée</SelectItem>
                                <SelectItem value="cancelled">Annulée</SelectItem>
                                <SelectItem value="refunded">Remboursée</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Order View Dialog */}
      <OrderViewDialog
        orderId={selectedOrderId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  );
}