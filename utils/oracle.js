import common from 'oci-common';
import objectStorage from 'oci-objectstorage';
import aiVision from 'oci-aivision';
import logger from './logger.js';
import oracleDb from 'oracledb';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORACLE_CONFIG_PATH = process.env.ORACLE_CONFIG_PATH;
const ORACLE_OBJECT_STORAGE_NAMESPACE = process.env.ORACLE_OBJECT_STORAGE_NAMESPACE;
const ORACLE_COMPARTMENT = process.env.ORACLE_COMPARTMENT;
const ORACLE_AUTONOMOUS_DATABASE_USER = process.env.ORACLE_AUTONOMOUS_DATABASE_USER;
const ORACLE_AUTONOMOUS_DATABASE_PASSWORD = process.env.ORACLE_AUTONOMOUS_DATABASE_PASSWORD;
const ORACLE_AUTONOMOUS_DATABASE_CONNECTION = process.env.ORACLE_AUTONOMOUS_DATABASE_CONNECTION;

class Oracle {
  provider = new common.ConfigFileAuthenticationDetailsProvider(path.join(__dirname, '..', ORACLE_CONFIG_PATH));
  objectStorageClient = new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: this.provider });
  aiVisionClient = new aiVision.AIServiceVisionClient({ authenticationDetailsProvider: this.provider });
  dbConnection;

  constructor() {
    oracleDb.autoCommit = true;
    oracleDb.dbObjectAsPojo = true;
    oracleDb
      .getConnection({
        user: ORACLE_AUTONOMOUS_DATABASE_USER,
        password: ORACLE_AUTONOMOUS_DATABASE_PASSWORD,
        connectString: ORACLE_AUTONOMOUS_DATABASE_CONNECTION,
      })
      .then((connection) => {
        logger.info('Oracle Autonomous Database Connected');
        this.dbConnection = connection;
      })
      .catch((error) => {
        logger.error('Failed to connect to Oracle autonomous database');
        logger.error(error);
      });
  }

  async putObject(objectName, bucketName, readableStream) {
    const config = {
      namespaceName: ORACLE_OBJECT_STORAGE_NAMESPACE,
      bucketName: bucketName,
      objectName: objectName,
      putObjectBody: readableStream,
    };
    try {
      logger.info(`[Oracle] Trying to put object ${objectName} in bucket ${bucketName}`);
      await this.objectStorageClient.putObject(config);
      logger.info(`[Oracle] Successfully put object`);
      return true;
    } catch (error) {
      logger.error(`[Oracle] Failed to put object`);
      throw new Error(error);
    }
  }

  async analyzeImage(objectName, bucketName) {
    const config = {
      compartmentId: ORACLE_COMPARTMENT,
      features: [{ featureType: 'OBJECT_DETECTION' }, { featureType: 'TEXT_DETECTION' }],
      image: { objectName: objectName, source: 'OBJECT_STORAGE', bucketName: bucketName, namespaceName: ORACLE_OBJECT_STORAGE_NAMESPACE },
    };
    console.log(config);
    try {
      logger.info(`[Oracle] Trying to analyze image in ${bucketName} called ${objectName}`);
      const response = await this.aiVisionClient.analyzeImage({ analyzeImageDetails: config });
      logger.info(`[Oracle] Successfully analyzed image`);
      const result = response.analyzeImageResult;
      const objects = [];
      const text = [];
      for (const imageObject of result.imageObjects) {
        if (imageObject.confidence > 0.5) {
          objects.push(imageObject.name);
        }
      }
      for (const imageText of result.imageText.lines) {
        if (imageText.confidence > 0.5) {
          text.push(imageText.text);
        }
      }
      return [text.join('\n'), objects.join(', ')];
    } catch (error) {
      logger.error(`[Oracle] Failed to analyze image`);
      throw new Error(error);
    }
  }

  async discordPicturesTableInsert(fileName, text, tags, url) {
    fileName = escapeSingleQuotes(fileName);
    text = escapeSingleQuotes(text);
    tags = escapeSingleQuotes(tags);
    url = escapeSingleQuotes(url);
    try {
      logger.info(`[Oracle] Trying to put entry into discord picture table`);
      await this.dbConnection.execute(`INSERT INTO DISCORDPICTURES VALUES ('${fileName}', '${text}', '${tags}', '${url}')`);
      logger.info(`[Oracle] Successfully put entry into discord picture tables`);
      return true;
    } catch (error) {
      logger.error(`[Oracle] Failed to put entry into discord picture table`);
      throw new Error(error);
    }
  }
}

function escapeSingleQuotes(string) {
  return string.replaceAll("'", "''");
}

export default new Oracle();
