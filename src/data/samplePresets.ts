import { SamplePreset } from '../types.ts';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'fridge-shelves',
    title: 'Open Fridge Shelves',
    subtitle: 'Milk, cheese, produce & condiments',
    tag: 'Fridge',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=900&q=80',
    description: 'Inside a well-stocked family refrigerator with dairy cartons, glass jars, fresh greens, and beverage containers.',
  },
  {
    id: 'table-produce',
    title: 'Market Produce on Table',
    subtitle: 'Tomatoes, peppers, greens & avocado',
    tag: 'Tabletop',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
    description: 'Fresh farmers market vegetables laid out across a wooden kitchen table ready for meal prep.',
  },
  {
    id: 'countertop-italian',
    title: 'Mediterranean Prep Counter',
    subtitle: 'Garlic, cherry tomatoes, olive oil & herbs',
    tag: 'Countertop',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=900&q=80',
    description: 'Vibrant fresh cooking ingredients arranged around a cutting board on a kitchen counter.',
  },
  {
    id: 'breakfast-pantry',
    title: 'Breakfast Table & Dairy',
    subtitle: 'Eggs, berries, bread, butter & milk',
    tag: 'Tabletop',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
    description: 'Breakfast table with fresh eggs, berries, artisan bread, and dairy essentials.',
  },
];

/**
 * Utility to convert an image URL (including sample presets) or blob to Base64
 */
export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const mimeType = blob.type || 'image/jpeg';
      resolve({ base64: dataUrl, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress client-side images before uploading if they exceed ~1600px
 * to ensure snappy upload speeds on mobile cellular connections
 */
export async function optimizeImageFile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = 'image/jpeg';
      const base64 = canvas.toDataURL(mimeType, 0.88);
      resolve({ base64, mimeType });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file'));
    };

    img.src = objectUrl;
  });
}
