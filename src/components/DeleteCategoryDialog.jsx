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
import { deleteCategory } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

export function DeleteCategoryDialog({ open, onOpenChange, category }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!category) return;
    
    setIsLoading(true);

    try {
      await deleteCategory(category.id);
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      // Invalidate and refetch category queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const productCount = category?._count?.products || category?.productCount || 0;
  const hasChildren = category?.children?.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete Category</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold">"{category?.name}"</span>?
          </p>
          
          {productCount > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This category contains {productCount} product{productCount > 1 ? 's' : ''}. 
                The products will be moved to "Uncategorized".
              </p>
            </div>
          )}

          {hasChildren && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Cannot delete:</strong> This category has subcategories. 
                Please delete or move the subcategories first.
              </p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mt-3">
            This will permanently remove the category and cannot be recovered.
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
            disabled={isLoading || hasChildren}
          >
            {isLoading ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

