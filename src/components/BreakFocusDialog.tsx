import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BreakFocusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penalty: number;
  onConfirm: () => void;
}

export function BreakFocusDialog({ open, onOpenChange, penalty, onConfirm }: BreakFocusDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-destructive/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Break Focus?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You must pay <span className="text-accent font-bold">₹{penalty}</span> to exit focus mode.
            This amount will be deducted from your wallet. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue Focus
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="glow-danger">
            Pay ₹{penalty} & Exit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
