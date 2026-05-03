import * as React from "react";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "./dialog";

interface AlertDialogProps {
  title: string;
  open?: boolean;
  description: string;
  actionLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  onOpenChange?: (open: boolean) => void;
}

export const AlertDialog = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      actionLabel,
      cancelLabel = "Hủy",
      onConfirm,
      onCancel,
      variant = "default",
    },
    ref,
  ) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                onOpenChange?.(false);
              }}
              className="px-4 py-2 cursor-pointer rounded-lg border border-[#e7d6cf] text-[#1b110d] hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange?.(false);
              }}
              className={`px-4 py-2 rounded-lg cursor-pointer text-white font-medium transition-colors ${
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#ed5012] hover:bg-[#d64311]"
              }`}
            >
              {actionLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

AlertDialog.displayName = "AlertDialog";
