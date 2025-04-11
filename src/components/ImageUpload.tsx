
import React, { useRef } from "react";
import { Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (file: File) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check for valid image types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    // Process each uploaded file
    Array.from(files).forEach(file => {
      if (!validImageTypes.includes(file.type)) {
        toast.error(`File '${file.name}' is not a supported image format.`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File '${file.name}' exceeds the 10MB size limit.`);
        return;
      }
      
      onUpload(file);
      toast.success(`Image '${file.name}' uploaded successfully!`);
    });
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // Process each file using the same logic as handleFileChange
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`File '${file.name}' is not an image.`);
        return;
      }
      
      onUpload(file);
      toast.success(`Image '${file.name}' uploaded successfully!`);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <div 
        className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center hover:bg-accent/50 transition-all cursor-pointer"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="bg-primary/10 p-3 rounded-full">
            <Image className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Upload images</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Drag and drop your images here or click to browse
          </p>
          <Button variant="default" className="mt-2" onClick={handleClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
