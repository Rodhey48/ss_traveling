import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  confirmText?: string;
  cancelText?: string;
  onConfirm: (inputValue?: string) => void | Promise<void>;
  isLoading?: boolean;
  promptInput?: {
    label: string;
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
  };
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'primary',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  isLoading = false,
  promptInput,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) {
      setInputValue(promptInput?.defaultValue || '');
    }
  }, [open, promptInput]);

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (promptInput?.required && !inputValue.trim()) return;
    await onConfirm(inputValue);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="p-2.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'info':
        return (
          <div className="p-2.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Info className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-semibold';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white font-semibold';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-700 text-white font-semibold';
      default:
        return 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px]">
        <form onSubmit={handleConfirm} className="space-y-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {getIcon()}
              <div className="space-y-1 text-left">
                <DialogTitle className="text-base font-bold text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {promptInput && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-foreground">
                {promptInput.label} {promptInput.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={promptInput.placeholder}
                className="h-9 text-xs"
                required={promptInput.required}
                autoFocus
              />
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs h-9"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || (promptInput?.required ? !inputValue.trim() : false)}
              className={`text-xs h-9 ${getConfirmButtonClass()}`}
            >
              {isLoading ? 'Memproses...' : confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
