import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampaignModal from "@/components/CampaignModal";
import { campaignService } from "@/services/campaignService";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, campaign: null });
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch campaigns using React Query
  const { data: campaignsData, isLoading: loading, error } = useQuery({
    queryKey: ['admin_campaigns', debouncedSearchTerm],
    queryFn: async () => {
      const response = await campaignService.getCampaigns({ search: debouncedSearchTerm });
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const campaigns = campaignsData || [];

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


  const confirmDelete = async () => {
    if (!deleteDialog.campaign) return;

    try {
      setDeleting(true);
      await campaignService.deleteCampaign(deleteDialog.campaign.id);
      
      // Invalidate campaigns queries
      queryClient.invalidateQueries({ queryKey: ['admin_campaigns'] });
      
      // Invalidate dashboard/analytics queries to refresh stats after campaign deletion
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      
      setDeleteDialog({ isOpen: false, campaign: null });
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin_campaigns'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin_campaigns'] });
  };


  // Search is now handled by React Query with server-side filtering
  const filteredCampaigns = campaigns;

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
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Active
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
            Manage marketing campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleCreateCampaign}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Campaign
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
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
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Campaign Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Products</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Duration</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-4 px-6">
                        <div className="font-medium text-foreground">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {campaign.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          {((campaign.campaign_products || campaign.campaignProducts)?.length > 0) ? (
                            <div className="space-y-1">
                              {(campaign.campaign_products || campaign.campaignProducts).map((cp, index) => (
                                <div key={index} className="text-foreground">
                                  {cp.product?.name || 'Unknown Product'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No products linked</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-foreground">
                          ${parseFloat(campaign.cost || 0).toLocaleString()}
                        </div>
                        {campaign.budget && (
                          <div className="text-sm text-muted-foreground">
                            Budget: ${parseFloat(campaign.budget).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="text-foreground">{formatDate(campaign.start_date || campaign.startDate)}</div>
                          <div className="text-muted-foreground">
                            {(campaign.end_date || campaign.endDate) ? `to ${formatDate(campaign.end_date || campaign.endDate)}` : 'Ongoing'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(campaign.is_active !== undefined ? campaign.is_active : campaign.isActive, campaign.end_date || campaign.endDate)}
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
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCampaign(campaign)}
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Modal */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={editingCampaign}
        onSuccess={handleModalSuccess}
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