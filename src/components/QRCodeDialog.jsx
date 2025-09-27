import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export function QRCodeDialog({ open, onOpenChange, product }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && product) {
      generateQRCode();
    }
  }, [open, product]);

  const generateQRCode = async () => {
    if (!product) return;
    
    setIsGenerating(true);
    try {
      // Generate QR code with product ID
      const qrDataUrl = await QRCode.toDataURL(product.id.toString(), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!qrCodeDataUrl) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product?.name || 'Product'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #000;
              padding: 20px;
              border-radius: 8px;
              background: white;
            }
            .qr-code {
              margin: 20px 0;
            }
            .product-info {
              margin-top: 20px;
              font-size: 14px;
            }
            .product-name {
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .product-details {
              color: #666;
              line-height: 1.4;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${product?.name || 'Product'}</div>
            <div class="qr-code">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
            <div class="product-info">
              <div class="product-details">
                <div><strong>Product ID:</strong> ${product?.id}</div>
                <div><strong>SKU:</strong> ${product?.sku || 'N/A'}</div>
                <div><strong>Price:</strong> $${product?.price || '0.00'}</div>
                <div><strong>Category:</strong> ${product?.category?.name || 'Uncategorized'}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${product?.name?.replace(/\s+/g, '-').toLowerCase() || 'product'}-${product?.id}.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {product?.name || 'Product'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Generating QR Code...</p>
              </div>
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p><strong>Product ID:</strong> {product?.id}</p>
                <p><strong>SKU:</strong> {product?.sku || 'N/A'}</p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print QR Code
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Unable to generate QR code</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
