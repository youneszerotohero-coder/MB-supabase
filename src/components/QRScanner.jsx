import { useState } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Camera, CameraOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QRScanner({ open, onOpenChange, onProductFound, products = [] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScan = async (err, result) => {
    if (err || !result || isProcessing) return;
    
    setIsProcessing(true);
    setScannedResult(result.text);
    
    try {
      // Extract product ID from QR code - handle both UUID and numeric IDs
      const scannedText = result.text.trim();
      
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(scannedText);
      
      let productId;
      if (isUuid) {
        productId = scannedText;
      } else {
        // Try parsing as integer for backward compatibility
        productId = parseInt(scannedText);
        if (isNaN(productId)) {
          toast({
            title: "Invalid QR Code",
            description: "This QR code doesn't contain a valid product ID",
            variant: "destructive",
          });
          return;
        }
      }

      // Find the product by ID
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        toast({
          title: "Product Not Found",
          description: `No product found with ID: ${productId}`,
          variant: "destructive",
        });
        return;
      }

      if (product.stock_quantity <= 0) {
        toast({
          title: "Product Unavailable",
          description: `${product.name} is currently out of stock`,
          variant: "destructive",
        });
        return;
      }

      // Success - product found
      toast({
        title: "Product Found",
        description: `Added ${product.name} to cart`,
      });

      // Call the callback with the found product
      onProductFound(product);
      
      // Close the scanner
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast({
        title: "Scan Error",
        description: "Failed to process the QR code",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setScannedResult(null);
    }
  };


  const startScanning = () => {
    setIsScanning(true);
    setScannedResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScannedResult(null);
  };

  const closeScanner = () => {
    setIsScanning(false);
    setScannedResult(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Product QR Code
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeScanner}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Ready to Scan</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button below to start scanning product QR codes
                </p>
              </div>
              <Button onClick={startScanning} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <BarcodeScanner
                  width={400}
                  height={300}
                  onUpdate={handleScan}
                  style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                />
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                </div>
              </div>
              
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing QR code...
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Scanning
                </Button>
                <Button onClick={closeScanner} variant="ghost" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            <p>Point your camera at a product QR code to add it to the cart</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
