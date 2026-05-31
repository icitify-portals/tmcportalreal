import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
const s3 = new S3Client({
  region: 'eu-west-1', 
  endpoint: 'https://s3.eu-west-1.wasabisys.com', 
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '', 
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || ''
  }
});
s3.send(new ListObjectsV2Command({Bucket: 'tmcbackup', Prefix: 'backups/'}))
  .then(r => console.log(JSON.stringify(r.Contents?.map(c => ({key: c.Key, size: c.Size})), null, 2)))
  .catch(console.error);
