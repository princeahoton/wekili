'use strict';

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME;

function s3Active() {
  const key = process.env.AWS_ACCESS_KEY_ID || '';
  return !!(BUCKET && key.length > 10 && !key.includes('REMPLACE'));
}

async function deleteS3Object(url_s3) {
  if (!url_s3 || !s3Active()) return;
  const parts = url_s3.split('.amazonaws.com/');
  if (!parts[1]) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: parts[1] }));
}

module.exports = { s3, BUCKET, s3Active, deleteS3Object };
