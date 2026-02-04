import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * Uploads a file to a Supabase storage bucket.
   * @param bucket Name of the bucket (e.g., 'band-logos')
   * @param path Path within the bucket (e.g., 'band-123/logo.png')
   * @param file The file object from input
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl.publicUrl;
  }
}
