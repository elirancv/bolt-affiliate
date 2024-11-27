import { useState } from 'react';

export function useImageUpload(initialUrls: string[] = ['']) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialUrls);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null]);
  const [imageUploadError, setImageUploadError] = useState('');

  const handleFileSelect = (file: File, index: number) => {
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('File size must be less than 5MB');
      return;
    }
    const newImageFiles = [...imageFiles];
    newImageFiles[index] = file;
    setImageFiles(newImageFiles);
    
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = URL.createObjectURL(file);
    setImageUrls(newImageUrls);
    
    setImageUploadError('');
  };

  const addImageField = () => {
    setImageUrls([...imageUrls, '']);
    setImageFiles([...imageFiles, null]);
  };

  const removeImageField = (index: number) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
    setImageFiles(newImageFiles);
  };

  const updateImageUrl = (index: number, url: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = url;
    setImageUrls(newImageUrls);
  };

  return {
    imageUrls,
    imageFiles,
    imageUploadError,
    handleFileSelect,
    addImageField,
    removeImageField,
    updateImageUrl,
    setImageUploadError
  };
}