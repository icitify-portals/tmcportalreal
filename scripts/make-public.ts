import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'eu-west-1', 
  endpoint: 'https://s3.eu-west-1.wasabisys.com', 
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '', 
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
  }
});

const policy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "PublicReadGetObject",
      Effect: "Allow",
      Principal: "*",
      Action: "s3:GetObject",
      Resource: "arn:aws:s3:::tmcbackup/*"
    }
  ]
};

async function run() {
  try {
    const result = await s3.send(new PutBucketPolicyCommand({
      Bucket: 'tmcbackup',
      Policy: JSON.stringify(policy)
    }));
    console.log("Bucket policy applied successfully:", result);
  } catch (error) {
    console.error("Failed to apply policy:", error);
  }
}

run().finally(() => process.exit(0));
