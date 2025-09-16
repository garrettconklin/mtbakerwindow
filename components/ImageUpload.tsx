"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
}

export function ImageUpload({ onImageUploaded }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUploaded(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-gray-800 border-gray-700 p-8 text-center max-w-md mx-auto">
      <div className="mb-6">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Upload Your Home Photo</h2>
        <p className="text-gray-300 text-sm">
          Upload a daylight photo of your home to start creating your holiday light mockup. 
          We'll automatically convert it to evening lighting for the best visualization.
        </p>
      </div>

      <Button onClick={openFileDialog} className="w-full bg-green-600 hover:bg-green-700">
        <Upload className="w-4 h-4 mr-2" />
        Choose Photo
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mt-4 text-xs text-gray-400">
        <p>Supported formats: JPG, PNG, WebP</p>
        <p>Best results with clear, well-lit photos</p>
      </div>
    </Card>
  );
}