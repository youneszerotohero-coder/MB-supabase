import { useState, useEffect } from "react";
import { Plus, Search, Calendar, DollarSign, TrendingUp, Edit, Trash2, AlertCircle, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampaignModal from "@/components/CampaignModal";
import CampaignPerformanceModal from "@/components/CampaignPerformanceModal";
import { campaignService } from "@/services/campaignService";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, campaign: null });
  const [deleting, setDeleting] = useState(false);
  const [performanceModal, setPerformanceModal] = useState({ isOpen: false, campaign: null });

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campaignService.getCampaigns();
      setCampaigns(response.data || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDeleteCampaign = (campaign) => {
    setDeleteDialog({ isOpen: true, campaign });
  };

  const handleUpdatePerformance = (campaign) => {
    setPerformanceModal({ isOpen: true, campaign });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.campaign) return;

    try {
      setDeleting(true);
      await campaignService.deleteCampaign(deleteDialog.campaign.id);
      await loadCampaigns(); // Reload campaigns
      setDeleteDialog({ isOpen: false, campaign: null });
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    loadCampaigns(); // Reload campaigns after create/update
  };

  const handlePerformanceSuccess = () => {
    loadCampaigns(); // Reload campaigns after performance update
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpend = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.cost || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.totalRevenue || 0), 0);
  const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;

  const getStatusBadge = (isActive, endDate) => {
    if (!isActive) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Inactive
        </Badge>
      );
    }

    if (endDate && new Date(endDate) < new Date()) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Completed
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-success-light text-success">
        Active
      </Badge>
    );
  };

  const getCampaignTypeBadge = (type) => {
    const typeLabels = {
      'product_linked': 'Product Linked',
      'general': 'General Marketing',
      'brand_awareness': 'Brand Awareness',
      'seasonal': 'Seasonal'
    };

    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || 'General Marketing'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateCampaignROI = (campaign) => {
    const cost = parseFloat(campaign.cost || 0);
    const revenue = parseFloat(campaign.totalRevenue || 0);
    return cost > 0 ? ((revenue - cost) / cost * 100) : 0;
  };

  const getCampaignPerformance = (campaign) => {
    const totalImpressions = campaign.campaignProducts?.reduce((sum, cp) => sum + (cp.impressions || 0), 0) || 0;
    const totalClicks = campaign.campaignProducts?.reduce((sum, cp) => sum + (cp.clicks || 0), 0) || 0;
    const totalConversions = campaign.campaignProducts?.reduce((sum, cp) => sum + (cp.conversions || 0), 0) || 0;
    
    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      revenue: parseFloat(campaign.totalRevenue || 0)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading campaigns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage marketing campaigns and track their performance
          </p>
        </div>
        <Button 
          onClick={handleCreateCampaign}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Overall ROI</p>
                <p className={`text-2xl font-bold ${totalROI >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm ? 'No campaigns found matching your search.' : 'No campaigns created yet.'}
              </div>
              {!searchTerm && (
                <Button 
                  onClick={handleCreateCampaign}
                  className="mt-4 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Campaign</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Duration</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Spend</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Performance</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">ROI</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const performance = getCampaignPerformance(campaign);
                    const roi = calculateCampaignROI(campaign);
                    
                    return (
                      <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-foreground">{campaign.name}</div>
                            {campaign.campaignProducts?.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Linked: {campaign.campaignProducts.map(cp => cp.product?.name).filter(Boolean).join(", ")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {getCampaignTypeBadge(campaign.campaignType)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div className="text-foreground">{formatDate(campaign.startDate)}</div>
                            <div className="text-muted-foreground">
                              {campaign.endDate ? `to ${formatDate(campaign.endDate)}` : 'Ongoing'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-dashboard-spend">
                            ${parseFloat(campaign.cost || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm space-y-1">
                            <div className="text-foreground">
                              {performance.impressions.toLocaleString()} impressions
                            </div>
                            <div className="text-muted-foreground">
                              {performance.clicks.toLocaleString()} clicks • {performance.conversions} conversions
                            </div>
                            {performance.revenue > 0 && (
                              <div className="text-success font-medium">
                                ${performance.revenue.toLocaleString()} revenue
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`font-semibold ${roi > 0 ? 'text-success' : roi < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(campaign.isActive, campaign.endDate)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditCampaign(campaign)}
                              title="Edit Campaign"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdatePerformance(campaign)}
                              title="Update Performance"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCampaign(campaign)}
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Campaign Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Performance trends chart will be here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ROI by Campaign Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary-light rounded-lg">
                <div>
                  <div className="font-medium text-foreground">Product-Linked Campaigns</div>
                  <div className="text-sm text-muted-foreground">Higher conversion rate</div>
                </div>
                <div className="text-lg font-bold text-success">+127%</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium text-foreground">General Marketing</div>
                  <div className="text-sm text-muted-foreground">Brand awareness focused</div>
                </div>
                <div className="text-lg font-bold text-muted-foreground">-100%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={editingCampaign}
        onSuccess={handleModalSuccess}
      />

      {/* Performance Modal */}
      <CampaignPerformanceModal
        isOpen={performanceModal.isOpen}
        onClose={() => setPerformanceModal({ isOpen: false, campaign: null })}
        campaign={performanceModal.campaign}
        onSuccess={handlePerformanceSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, campaign: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.campaign?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, campaign: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}