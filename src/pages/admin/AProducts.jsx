import { useState } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, X, QrCode, RefreshCw } from "lucide-react";
import { resolveImageUrl } from '@/utils/imageUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { AddCategoryDialog } from "../../components/AddCategoryDialog";
import { AddProductDialog } from "../../components/AddProductDialog";
import { EditProductDialog } from "../../components/EditProductDialog";
import { DeleteProductDialog } from "../../components/DeleteProductDialog";
import { EditCategoryDialog } from "../../components/EditCategoryDialog";
import { DeleteCategoryDialog } from "../../components/DeleteCategoryDialog";
import { QRCodeDialog } from "../../components/QRCodeDialog";

export default function AProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin_products'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 50 });
      return res.data.products;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await getCategories();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Transform data for rendering
  const allProducts = Array.isArray(productsData) ? productsData : [];
  const allCategories = Array.isArray(categoriesData) ? categoriesData : [];

  // Filter products based on search term
  const products = allProducts.filter(product => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.category?.name?.toLowerCase().includes(term) ||
      product.slug?.toLowerCase().includes(term)
    );
  });

  // Filter categories based on search term (only in categories tab)
  const categories = activeTab === "categories" 
    ? allCategories.filter(category => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return category.name?.toLowerCase().includes(term);
      })
    : allCategories;

  // Handler functions
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditProductOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setDeleteProductOpen(true);
  };

  const handleQRCode = (product) => {
    setSelectedProduct(product);
    setQrCodeOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditProductOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteProductOpen(false);
    setSelectedProduct(null);
  };

  // Category handler functions
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setEditCategoryOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setDeleteCategoryOpen(true);
  };

  const handleCloseEditCategoryDialog = () => {
    setEditCategoryOpen(false);
    setSelectedCategory(null);
  };

  const handleCloseDeleteCategoryDialog = () => {
    setDeleteCategoryOpen(false);
    setSelectedCategory(null);
  };

  const handleCloseQRCodeDialog = () => {
    setQrCodeOpen(false);
    setSelectedProduct(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin_products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre catalogue de produits et vos catégories
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
            onClick={() => setAddProductOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Produit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6 w-[100%]">
          <div className="flex justify-between items-center w-[100%]">
            <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des catégories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {searchTerm && (
                <div className="text-sm text-muted-foreground">
                  Trouvé {categories.length} sur {allCategories.length} catégories
                </div>
              )}
              <Button 
              className="text-white"
                variant="outline"
                onClick={() => setAddCategoryOpen(true)}
              >
                <Plus className="w-4 h-4 text-white mr-2" />
                Ajouter une Catégorie
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">Aucune catégorie trouvée</h3>
                  <p className="text-sm text-muted-foreground mb-4">Commencez par créer votre première catégorie</p>
                  <Button onClick={() => setAddCategoryOpen(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une Catégorie
                  </Button>
                </div>
              </div>
            ) : (
              categories.map((category) => (
                <Card key={category.id} className="hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          title="Modifier la catégorie"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCategory(category)}
                          title="Supprimer la catégorie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center px-6 mb-6">
                      <span className="text-sm text-muted-foreground">
                        {category.productCount || 0} produits
                      </span>
                      <Badge variant="secondary" className="bg-success-light text-success">
                        Actif
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits par nom, marque, catégorie ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {searchTerm && (
                <span>
                  Trouvé {products.length} sur {allProducts.length} produits
                </span>
              )}
            </div>
          </div>

          <Card className="cards-mobile">
            <CardContent className="">
              <div className="">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Produit</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Catégorie</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Prix/Coût</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Bénéfice</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Stock</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Variantes</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Statut</th>
                      <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-muted-foreground">
                          Chargement des produits...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-muted-foreground">
                          {searchTerm ? `Aucun produit trouvé correspondant à "${searchTerm}"` : "Aucun produit trouvé. Créez votre premier produit pour commencer."}
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              {product.images?.[0] ? (
                                <img
                                  src={resolveImageUrl(product.images[0].url)}
                                  alt={product.name}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.slug || 'Pas de slug'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-foreground">{product.category?.name || 'Sans catégorie'}</td>
                        <td className="py-4 px-6">
                          <div className="text-foreground font-medium">${product.price}</div>
                          <div className="text-sm text-muted-foreground">${product.cost || '0.00'}</div>
                        </td>
                        <td className="py-4 px-6 text-success font-semibold">
                          ${((product.price || 0) - (product.cost || 0)).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-medium ${product.stock_quantity > 0 ? 'text-foreground' : 'text-destructive'}`}>
                            {product.stock_quantity || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Couleurs: {(product.colors || []).map(c => c.name || c).join(", ") || "Aucune"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Tailles: {(product.sizes || []).map(s => s.value || s).join(", ") || "Aucune"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              product.stock_quantity > 0 
                                ? 'bg-success-light text-success' 
                                : 'bg-warning-light text-warning'
                            }`}
                          >
                            {product.stock_quantity > 0 ? 'En Stock' : 'Rupture de Stock'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              title="Modifier le produit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleQRCode(product)}
                              title="Générer un QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteProduct(product)}
                              title="Supprimer le produit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddProductDialog 
        open={addProductOpen} 
        onOpenChange={setAddProductOpen} 
      />
      <AddCategoryDialog 
        open={addCategoryOpen} 
        onOpenChange={setAddCategoryOpen} 
      />
      <EditProductDialog 
        open={editProductOpen} 
        onOpenChange={handleCloseEditDialog}
        product={selectedProduct}
      />
      <DeleteProductDialog 
        open={deleteProductOpen} 
        onOpenChange={handleCloseDeleteDialog}
        product={selectedProduct}
      />
      <EditCategoryDialog 
        open={editCategoryOpen} 
        onOpenChange={handleCloseEditCategoryDialog}
        category={selectedCategory}
      />
      <DeleteCategoryDialog 
        open={deleteCategoryOpen} 
        onOpenChange={handleCloseDeleteCategoryDialog}
        category={selectedCategory}
      />
      <QRCodeDialog 
        open={qrCodeOpen} 
        onOpenChange={handleCloseQRCodeDialog}
        product={selectedProduct}
      />
    </div>
  );
}
