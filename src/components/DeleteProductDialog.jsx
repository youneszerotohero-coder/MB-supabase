import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from '@tanstack/react-query';
import { deleteProduct } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

export function DeleteProductDialog({ open, onOpenChange, product }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!product) return;
    
    setIsLoading(true);

    try {
      await deleteProduct(product.id);
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Invalidate and refetch product queries
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete Product</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold">"{product?.name}"</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently remove the product from your catalog and cannot be recovered.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

