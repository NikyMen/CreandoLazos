import { api } from './api';

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  uri: string;
  date: string;
  type: 'activity' | 'session' | 'event' | 'image' | 'video';
  forEmail?: string;
  resourceType?: 'image' | 'video';
};

// Configuración de Cloudinary (parametrizable vía variables públicas de Expo)
const CLOUD_NAME = (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'depctrd2m').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'ml_default').trim();

export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    // Para unsigned upload, no hay un endpoint de "ping" perfecto sin API Key.
    // Pero podemos verificar si el Cloud Name existe intentando acceder a una imagen inexistente
    // o simplemente validando el formato del cloud name.
    // Una forma simple es verificar si el dominio responde.
    const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/sample.jpg`);
    return res.status === 200 || res.status === 404; // 404 significa que el cloud name es correcto pero la imagen no existe
  } catch (err) {
    return false;
  }
}

async function uploadToCloudinary(
  fileData: any, 
  resourceType: 'image' | 'video' = 'image',
  onProgress?: (step: string) => void
): Promise<string | null> {
  try {
    onProgress?.(`Subiendo ${resourceType === 'video' ? 'video' : 'imagen'} a Cloudinary...`);
    
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
    
    const formData = new FormData();
    
    // En React Native, fileData puede ser un objeto { uri, type, name }
    // En Web, puede ser un Blob o File
    formData.append('file', fileData);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    console.log(`Intentando subir a: ${url} con preset: ${CLOUDINARY_UPLOAD_PRESET}`);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('--- ERROR CLOUDINARY ---');
      console.error('Status:', response.status);
      console.error('Response Data:', JSON.stringify(data, null, 2));
      
      let errorMsg = data.error?.message || `Error ${response.status} en Cloudinary`;
      if (errorMsg.includes('unsigned uploads')) {
        errorMsg = 'Configuración de Cloudinary: El Upload Preset debe ser de tipo "Unsigned". Por favor, verifica en tu consola de Cloudinary que el preset "ml_default" esté configurado como Unsigned.';
      }
      throw new Error(errorMsg);
    }

    if (data.secure_url) {
      console.log('Subida exitosa:', data.secure_url);
      return data.secure_url;
    }
    throw new Error('No se recibió secure_url de Cloudinary');
  } catch (err: any) {
    console.error('Error detallado en uploadToCloudinary:', err);
    throw err;
  }
}

export async function getGalleryFor(email?: string): Promise<GalleryItem[]> {
  try {
    const res = await api.get('/gallery', { params: { email } });
    return res.data || [];
  } catch (err) {
    console.error('Error fetching gallery:', err);
    return [];
  }
}

export async function uploadMediaToGallery(
  email: string,
  base64: string,
  title: string,
  type: GalleryItem['type'] = 'activity',
  resourceType: 'image' | 'video' = 'image',
  onProgress?: (step: string) => void
): Promise<GalleryItem | null> {
  try {
    // 1. Subir a Cloudinary primero
    const mediaUrl = await uploadToCloudinary(base64, resourceType, onProgress);
    if (!mediaUrl) {
      throw new Error('No se pudo obtener la URL del medio');
    }

    // 2. Guardar la referencia en nuestra API
    onProgress?.('Guardando en base de datos...');
    const res = await api.post('/gallery', {
      email,
      uri: mediaUrl,
      title,
      type,
      resourceType,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    
    onProgress?.('¡Completado!');
    return res.data;
  } catch (err: any) {
    console.error('Error uploading media to gallery:', err);
    throw err;
  }
}

// Mantener compatibilidad con el nombre anterior si se usa en otros lados
export const uploadImageToGallery = uploadMediaToGallery;

export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    await api.delete(`/gallery/${id}`);
    return true;
  } catch (err) {
    console.error('Error deleting gallery item:', err);
    return false;
  }
}
