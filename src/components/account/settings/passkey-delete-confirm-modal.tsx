import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/dialog';
import Button from '@/components/nae-button';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const PasskeyDeleteConfirmModal = ({ open, onOpenChange, onCancel, onConfirm }: ModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Passkey</DialogTitle>
          <DialogDescription>
            This passkey will be permanently removed and you won&apos;t be able to use it to sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="secondary"
            onClick={onCancel} 
          >
            Cancel
          </Button>
          <Button 
            variant="extreme"
            onClick={onConfirm} 
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PasskeyDeleteConfirmModal