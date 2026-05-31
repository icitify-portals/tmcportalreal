import { S3Client, PutPublicAccessBlockCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'eu-west-1', 
  endpoint: 'https://s3.eu-west-1.wasabisys.com', 
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '', 
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
  }
});

async function run() {
  try {
    const result = await s3.send(new PutPublicAccessBlockCommand({
      Bucket: 'tmcbackup',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }));
    console.log("Public Access Block removed successfully:", result);
  } catch (error) {
    console.error("Failed to remove public access block:", error);
  }
}

run().finally(() => process.exit(0));
