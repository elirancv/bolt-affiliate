import { supabase } from './supabase';

export async function uploadProductImage(file: File, storeId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `products/${storeId}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrl;
}