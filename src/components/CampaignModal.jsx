import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CampaignForm from './CampaignForm'

const CampaignModal = ({ isOpen, onClose, campaign = null, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = (result) => {
    setIsSubmitting(false)
    onSuccess?.(result)
    onClose()
  }

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>
        <CampaignForm
          campaign={campaign}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}

export default CampaignModal
