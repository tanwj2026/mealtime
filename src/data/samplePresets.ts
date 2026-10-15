import { SamplePreset } from '../types.ts';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'fridge-shelves',
    title: 'Open Fridge Shelves',
    subtitle: 'Milk, cheese, produce & condiments',
    tag: 'Fridge',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=75',
    description: 'Inside a well-stocked family refrigerator with dairy cartons, glass jars, fresh greens, and beverage containers.',
  },
  {
    id: 'table-produce',
    title: 'Market Produce on Table',
    subtitle: 'Tomatoes, peppers, greens & avocado',
    tag: 'Tabletop',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=75',
    description: 'Fresh farmers market vegetables laid out across a wooden kitchen table ready for meal prep.',
  },
  {
    id: 'countertop-italian',
    title: 'Mediterranean Prep Counter',
    subtitle: 'Garlic, cherry tomatoes, olive oil & herbs',
    tag: 'Countertop',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=75',
    description: 'Vibrant fresh cooking ingredients arranged around a cutting board on a kitchen counter.',
  },
  {
    id: 'breakfast-pantry',
    title: 'Breakfast Table & Dairy',
    subtitle: 'Eggs, berries, bread, butter & milk',
    tag: 'Tabletop',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=75',
    description: 'Breakfast table with fresh eggs, berries, artisan bread, and dairy essentials.',
  },
];

/**
 * Resizes and compresses any image element onto an offscreen canvas.
 * Ideal target for Gemini Vision: max dimension 1200px, JPEG quality 0.78
 * Results in ~120KB-250KB base64 string that uploads in 50ms and avoids 413/504 gateway errors.
 */
function compressImageElement(img: HTMLImageElement): { base64: string; mimeType: string } {
  const maxDim = 1200;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

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
    throw new Error('Canvas 2D context not supported');
  }

  // Draw with high quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = 'image/jpeg';
  const base64 = canvas.toDataURL(mimeType, 0.78);
  return { base64, mimeType };
}

/**
 * Utility to convert an image URL (including sample presets) to a compressed Base64 string
 */
export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const result = compressImageElement(img);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      // Fallback: fetch as blob and compress
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(compressImageElement(fallbackImg));
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('Failed to load preset image'));
          };
          fallbackImg.src = blobUrl;
        })
        .catch(reject);
    };

    img.src = url;
  });
}

/**
 * Compress user uploaded image files (mobile camera photos or gallery files)
 * before sending over the network
 */
export async function optimizeImageFile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const result = compressImageElement(img);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read and process image file'));
    };

    img.src = objectUrl;
  });
}
