import Tesseract from 'tesseract.js';

/**
 * OCR Service class for image text recognition
 */
class OCRService {
  /**
   * Extract text from image file
   */
  async extractTextFromImage(imageFile: File): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });

      return result.data.text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Extract text from image URL
   */
  async extractTextFromImageUrl(imageUrl: string): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageUrl, 'eng');
      return result.data.text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }
}

export default new OCRService();
