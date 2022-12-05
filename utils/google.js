import vision from '@google-cloud/vision';
import path from 'node:path';
import logger from './logger.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_VISION_CREDENTIALS_PATH = process.env.GOOGLE_VISION_CREDENTIALS_PATH;

class Google {
  visionClient = new vision.ImageAnnotatorClient({ keyFilename: path.join(__dirname, '..', GOOGLE_VISION_CREDENTIALS_PATH) });

  async textDetection(url) {
    try {
      logger.info(`[Google] Trying to extract text for ${url}`);
      const [response] = await this.visionClient.textDetection(url);
      logger.info(`[Google] Successfully extracted text`);
      if (response.fullTextAnnotation) {
        const text = response.fullTextAnnotation.text;
        return text;
      } else {
        return '';
      }
    } catch (error) {
      logger.error(`[Google] Failed to extract text for ${url}`);
      throw new Error(error);
    }
  }
}

export default new Google();
