import {S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3'
import {env} from "../validator/envValidator.js"
import {logger} from "../config/logger.js"


const isS3Configured = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME

let s3 = null
if(isS3Configured){
    s3 = new S3Client({
        credentials:{
            accessKeyId : env.AWS_ACCESS_KEY_ID,
            secretAccessKey : env.AWS_SECRET_ACCESS_KEY
        },
        region : env.AWS_REGION,
        // endpoint: `https://s3.${env.AWS_REGION}.amazonaws.com`,
        // forcePathStyle: false
    })
}

const Bucket = env.S3_BUCKET_NAME

export const isLargePaste = (content) => Buffer.byteLength(content, 'utf8') > 10*1024

export const uploadToS3 = async (shortId, content) => {
  if (!s3) throw new Error('S3 not configured')
  const key = `pastes/${shortId}.txt`
  try {
    await s3.send(new PutObjectCommand({
      Bucket: Bucket,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
    }))
    logger.info({ shortId, key }, 'Uploaded paste to S3')
    return key
  } catch (err) {
    logger.error({ err: err.message, code: err.Code, region: err.Region, endpoint: err.Endpoint }, 'S3 upload error')
    throw err
  }
}

export const getFromS3 = async(s3Key) =>{
    if (!s3) throw new Error('S3 not configured')
    const response = await s3.send(new GetObjectCommand({
        Bucket: Bucket,
        Key: s3Key
    }))

    // const chunks = []
    // for await(const chunk of response.Body){
    //     chunks.push(chunk)
    // }
    return await response.Body.transformToString()
}

export const deleteFromS3 = async (s3Key) => {
  if (!s3) throw new Error('S3 not configured')
  await s3.send(new DeleteObjectCommand({
    Bucket: Bucket,
    Key: s3Key,
  }))
  logger.info({ s3Key }, 'Deleted paste from S3')
}
