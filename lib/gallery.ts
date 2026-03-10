import { api } from './api';

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  uri: string;
  date: string;
  type: 'activity' | 'session' | 'event' | 'image';
  forEmail?: string;
};

export async function getGalleryFor(email?: string): Promise<GalleryItem[]> {
  try {
    const res = await api.get('/gallery', { params: { email } });
    return res.data || [];
  } catch (err) {
    console.error('Error fetching gallery:', err);
    return [];
  }
}

export async function uploadImageToGallery(
  email: string,
  base64: string,
  title: string,
  type: GalleryItem['type'] = 'activity'
): Promise<GalleryItem | null> {
  try {
    const res = await api.post('/gallery', {
      email,
      base64,
      title,
      type,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    return res.data;
  } catch (err) {
    console.error('Error uploading image to gallery:', err);
    return null;
  }
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/gallery/${id}`);
    return true;
  } catch (err) {
    console.error('Error deleting gallery item:', err);
    return false;
  }
}
