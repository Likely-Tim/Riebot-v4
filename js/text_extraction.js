import fetch from 'node-fetch';
import crypto from 'node:crypto';
import logger from '../utils/logger.js';
import oracle from '../utils/oracle.js';
import google from '../utils/google.js';

const ORACLE_BUCKET_NAME = 'Discord_Pictures';

export async function textExtraction(messageAttachments) {
  for (const messageAttachment of messageAttachments) {
    const url = messageAttachment.url;
    const fileExtension = url.split('.').pop();
    if (fileExtension === 'jpg' || fileExtension === 'png') {
      const urlHash = crypto.createHash('sha256').update(url).digest('hex');
      const fileName = `${urlHash}.${fileExtension}`;
      try {
        logger.info(`[Text Extraction] Trying Oracle for ${url}`);
        throw new Error(`Oracle Analyze Image Not Always Free`);
        const readableStream = (await fetch(url)).body;
        await oracle.putObject(fileName, ORACLE_BUCKET_NAME, readableStream);
        const [text, tags] = await oracle.analyzeImage(fileName, ORACLE_BUCKET_NAME);
        await oracle.discordPicturesTableInsert(fileName, text, tags, url);
        logger.info(`[Text Extraction] Oracle Success for ${url}`);
      } catch (error) {
        logger.warn(`[Text Extraction] Oracle Fail: ${error}`);
        try {
          logger.info(`[Text Extraction] Trying Google for ${url}`);
          const text = await google.textDetection(url);
          await oracle.discordPicturesTableInsert(fileName, text, '', url);
          logger.info(`[Text Extraction] Google Success`);
        } catch (error) {
          logger.error(`[Text Extraction] Google Fail: ${error}`);
        }
      }
    }
  }
}
