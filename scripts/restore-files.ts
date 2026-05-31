import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { pipeline } from 'stream/promises';

const s3 = new S3Client({
  region: 'eu-west-1', 
  endpoint: 'https://s3.eu-west-1.wasabisys.com', 
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '', 
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
  }
});

async function run() {
  console.log("Downloading the last full backup of the local files (auto-1779710405017)...");
  const response = await s3.send(new GetObjectCommand({
    Bucket: 'tmcbackup', 
    Key: 'backups/auto-1779710405017/files.zip'
  }));
  
  if (response.Body) {
    const fileStream = fs.createWriteStream('/app/recovered-files.zip');
    // @ts-ignore
    await pipeline(response.Body, fileStream);
    console.log("Download complete! Saved to /app/recovered-files.zip");
  } else {
    console.error("No body in response");
  }
}

run().catch(console.error);
