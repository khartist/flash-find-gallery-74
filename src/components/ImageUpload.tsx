import React, { useRef, useState } from "react";
import { Upload, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  SelectContent,
	Select,
  SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"
 

interface ImageUploadProps {
  onUpload: (file: File, metadata: { description: string; category: string }) => void;
}
interface UploadFormValues {
  description: string;
  category: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<UploadFormValues>({
    defaultValues: {
      description: '',
      category: '',
    },
  });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check for valid image types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const file = files[0];
    
    if (!validImageTypes.includes(file.type)) {
      toast.error(`File '${file.name}' is not a supported image format.`);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error(`File '${file.name}' exceeds the 10MB size limit.`);
      return;
    }
    
    // Create a preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = form.handleSubmit((values) => {
    if (!selectedFile) {
      toast.error("Please select an image to upload");
      return;
    }
    
    onUpload(selectedFile, {
      description: values.description,
      category: values.category,
    });
    toast.success(`Image '${selectedFile.name}' uploaded successfully!`);
    
    // Reset the form
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset();
  });

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error(`File '${file.name}' is not an image.`);
      return;
    }
    
    // Create a preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <label htmlFor="file-upload" className="hidden">
        Upload File
      </label>
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        title="Upload an image file"
      />
      
      {!selectedFile ? (
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
      ) : (
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Image preview */}
              <div className="w-full md:w-1/3">
                <div className="aspect-square rounded-md overflow-hidden border border-border">
                  <img 
                    src={previewUrl || ''} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Image description */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Add details</h3>
                  <p className="text-sm text-muted-foreground">
                    File: {selectedFile.name}
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a description to your image..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
    
                    </FormItem>
                  )}
                />

								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
									<FormItem>
										<FormLabel>Category</FormLabel>
											<FormControl>
												<Select
												defaultValue={field.value}
												onValueChange={field.onChange}>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select a category" />
													</SelectTrigger>

													<SelectContent>
														<SelectItem value="natural">Natural</SelectItem>
														<SelectItem value="people">People</SelectItem>
														<SelectItem value="animal">Animal</SelectItem>
														<SelectItem value="food">Food</SelectItem>
														<SelectItem value="indoor">Indoor</SelectItem>
														<SelectItem value="outdoor">Outdoor</SelectItem>
													</SelectContent>
												</Select>												
											</FormControl>
										</FormItem>
									)}
								/>
                
                
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ImageUpload;
