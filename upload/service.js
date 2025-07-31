import { DeleteObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import config from "../config/config.js";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import helper from "../helper/common.helper.js";

const s3Client = new S3({
  forcePathStyle: false,
  endpoint: config.cloud.digitalocean.endpoint,
  region: config.cloud.digitalocean.region,
  credentials: {
    accessKeyId: config.cloud.digitalocean.credentials.accessKeyId,
    secretAccessKey: config.cloud.digitalocean.credentials.secretAccessKey,
  },
});

// Upload file
const uploadFile = async ({
  mimetype,
  uuid,
  folderName,
  buffer,
  ACL = "public-read",
}) => {
  const prefix = config.cloud.digitalocean.rootDirname;
  // const uuid = uuidv4();
  const extension = mime.extension(mimetype);

  const fileKey = `${prefix}/${folderName}/${uuid}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.cloud.digitalocean.bucketName,
      Key: fileKey,
      Body: buffer,
      ACL: ACL,
    })
  );

  return config.cloud.digitalocean.baseUrl + "/" + fileKey;
};

// Update file
const updateFile = async ({
  url,
  uuid,
  folderName,
  mimetype,
  buffer,
  ACL = "public-read",
}) => {
  // Delete existing file
  if (url) {
    await deleteFile({
      url,
    });
  }
  // Upload new file
  const newURL = await uploadFile({
    uuid,
    folderName,
    buffer: buffer,
    mimetype: mimetype,
    ACL,
  });

  return newURL;
};

// Delete file
const deleteFile = async ({ url }) => {
  const fileKey = helper.extractFileKey(url);

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.cloud.digitalocean.bucketName,
      Key: fileKey,
    })
  );
  console.log("file deleted");

  return url;
};

export default {
  uploadFile,
  deleteFile,
  updateFile,
};
