import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CampaignPerformanceForm from './CampaignPerformanceForm'

const CampaignPerformanceModal = ({ isOpen, onClose, campaign, onSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Update Campaign Performance
          </DialogTitle>
        </DialogHeader>
        <CampaignPerformanceForm
          campaign={campaign}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default CampaignPerformanceModal
