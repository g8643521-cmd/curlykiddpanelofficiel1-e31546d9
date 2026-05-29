import { useEffect, useRef, useState } from "react";
import { Upload, Link as LinkIcon, Trash2, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fileToDataUrl } from "@/hooks/useCustomIcons";

interface CustomIconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  currentIcon?: string;
  onSave: (dataUrlOrUrl: string) => void;
  onClear?: () => void;
}

const MAX_BYTES = 1_500_000; // ~1.5 MB after base64

const CustomIconDialog = ({
  open,
  onOpenChange,
  title,
  currentIcon,
  onSave,
  onClear,
}: CustomIconDialogProps) => {
  const [preview, setPreview] = useState<string | undefined>(currentIcon);
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPreview(currentIcon);
      setUrl("");
    }
  }, [open, currentIcon]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl.length > MAX_BYTES * 1.4) {
        toast({ title: "Image too large", description: "Try one under ~1.5 MB.", variant: "destructive" });
        return;
      }
      setPreview(dataUrl);
    } catch {
      toast({ title: "Failed to read file", variant: "destructive" });
    }
  };

  const handleSave = () => {
    const value = preview || url.trim();
    if (!value) {
      toast({ title: "Nothing to save", description: "Pick a file or paste a URL." });
      return;
    }
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Set custom icon"}</DialogTitle>
          <DialogDescription>
            Upload an image or paste a direct image URL. Stored only on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-2">
          <div className="w-24 h-24 rounded-xl overflow-hidden border border-border/50 bg-secondary/40 flex items-center justify-center">
            {preview || url ? (
              <img
                src={preview || url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreview(undefined)}
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload image
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="https://example.com/icon.png"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreview(undefined);
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {currentIcon && onClear && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
              onClick={() => {
                onClear();
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomIconDialog;
