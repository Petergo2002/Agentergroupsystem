/**
 * Image utilities för att konvertera bilder till base64
 * Blob URLs fungerar inte i @react-pdf/renderer server-side
 */

/**
 * Konverterar en File eller Blob till base64 data URL
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Konverterar en blob URL till base64 data URL
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return await fileToBase64(blob);
  } catch (error) {
    console.error('Failed to convert blob URL to base64:', error);
    throw error;
  }
}

/**
 * Konverterar en array av bild-URLs (blob eller http) till base64
 */
export async function convertImagesToBase64(imageUrls: string[]): Promise<string[]> {
  const promises = imageUrls.map(async (url) => {
    // Om det är en blob URL, konvertera till base64
    if (url.startsWith('blob:')) {
      return await blobUrlToBase64(url);
    }
    // Om det är en data URL, returnera som den är
    if (url.startsWith('data:')) {
      return url;
    }
    // Om det är en http URL, returnera som den är (PDF-renderer kan hantera det)
    return url;
  });
  
  return await Promise.all(promises);
}
