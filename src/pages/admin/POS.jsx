import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Minus, ShoppingCart, Trash2, Calculator, Search, X, CheckCircle, QrCode, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getProducts } from "@/services/productService";
import { createOrder } from "@/services/orderService";
import { getProductImageUrl } from "@/utils/imageUtils";
import { QRScanner } from "../../components/QRScanner";

export default function POS() {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Automated customer info for in-store orders
  const [customerInfo] = useState({
    name: "Walk-in Customer",
    phone: "N/A",
    wilaya: "In Store",
    baladiya: "Physical Location",
    address: "Store Location",
    email: "pos@store.com"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products from API
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['pos_products', debouncedSearchTerm],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 100,
        search: debouncedSearchTerm || undefined
      };
      const res = await getProducts(params);
      return res.data.products;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for POS as stock changes frequently)
    refetchOnWindowFocus: false,
  });

  const products = Array.isArray(productsData) ? productsData : [];

  const addToCart = (product) => {
    // Check stock availability
    if (product.stock_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Check if adding one more would exceed stock
        if (existing.quantity >= product.stock_quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${product.stock_quantity} units available`,
            variant: "destructive",
          });
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      // Find the product to check stock
      const product = products.find(p => p.id === id);
      if (product && quantity > product.stock_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock_quantity} units available`,
          variant: "destructive",
        });
        return;
      }
      
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const total = subtotal;

  const clearCart = () => {
    setCart([]);
    setOrderSuccess(false);
  };

  const handleProductFound = (product) => {
    addToCart(product);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['pos_products'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing order",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerWilaya: customerInfo.wilaya,
        customerBaladiya: customerInfo.baladiya,
        customerAddress: customerInfo.address,
        customerEmail: customerInfo.email,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          productName: item.name
        })),
        deliveryFee: 0, // In-store orders have no delivery fee
        orderSource: 'pos',
        notes: 'In-store POS order'
      };

      const response = await createOrder(orderData);
      
      toast({
        title: "Order Processed Successfully",
        description: `Order #${response.data.orderNumber} created for ${customerInfo.name}`,
      });
      
      setOrderSuccess(true);
      clearCart();
      
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('orderCreated', {
        detail: { orderId: response.data.orderNumber }
      }));
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Order Failed",
        description: error.response?.data?.message || "Failed to process order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Point of Sale (POS)</h1>
          <p className="text-muted-foreground mt-2">
            Create orders for in-store customers
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Products
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setQrScannerOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center bg-muted text-muted-foreground text-xs">
                            <div className="text-center">
                              <div className="w-6 h-6 mx-auto mb-1">📦</div>
                              No Image
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-semibold text-foreground">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`ml-2 ${
                              product.stock_quantity > 10 
                                ? 'bg-success-light text-success' 
                                : product.stock_quantity > 0 
                                ? 'bg-warning-light text-warning' 
                                : 'bg-destructive-light text-destructive'
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </Badge>
                        </div>
                        <Button
                          onClick={() => addToCart(product)}
                          size="sm"
                          className="bg-primary hover:bg-primary-hover"
                          disabled={product.stock_quantity <= 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout Section */}
        <div className="space-y-6">
          {/* Success Message */}
          {orderSuccess && (
            <Card className="border-success bg-success-light">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <h3 className="font-semibold text-success">Order Processed Successfully!</h3>
                    <p className="text-sm text-success/80">The order has been created and added to the system.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Shopping Cart</CardTitle>
                <Badge variant="secondary" className="bg-primary-light text-primary">
                  {cart.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 border border-border rounded-lg"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full hidden items-center justify-center bg-muted text-muted-foreground text-xs">
                          <div className="text-center">
                            <div className="w-4 h-4 mx-auto mb-1">📦</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${Number(item.price).toFixed(2)} each
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info Display */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <h4 className="font-medium text-sm text-muted-foreground">Customer Information</h4>
                  <div className="text-sm">
                    <p><span className="font-medium">Name:</span> {customerInfo.name}</p>
                    <p><span className="font-medium">Location:</span> {customerInfo.wilaya}, {customerInfo.baladiya}</p>
                    <p><span className="font-medium">Order Type:</span> In-Store POS</p>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>Delivery Fee:</span>
                    <span className="text-success">$0.00 (In-Store)</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-lg font-semibold text-foreground">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={processOrder}
                    className="w-full bg-success hover:bg-success/90 text-success-foreground"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Process Order'
                    )}
                  </Button>
                  <Button onClick={clearCart} variant="outline" className="w-full" disabled={isProcessing}>
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        onProductFound={handleProductFound}
        products={products}
      />
    </div>
  );
}
