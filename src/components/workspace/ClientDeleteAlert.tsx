import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onConfirm: () => void;
  clientName: string;
  slotLockUntil: string | null;
  isDeleting: boolean;
}

export default function ClientDeleteAlert({ isOpen, onClose, onConfirm, clientName, slotLockUntil, isDeleting }: Props) {
  const deleteLockLabel = slotLockUntil
    ? new Date(slotLockUntil).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "your next billing cycle";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the client from the app, clear connected social accounts, stored credentials, and scheduled or draft content.
            {slotLockUntil ? (
              <> This slot will remain occupied until <strong>{deleteLockLabel}</strong> to prevent system abuse. This is a platform policy.</>
            ) : (
              <> This will delete the client immediately.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => { event.preventDefault(); onConfirm(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Delete client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
