import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getStorageConfig() {
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION ?? "auto";
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return { configured: false as const };
  }

  return {
    configured: true as const,
    bucket,
    publicBaseUrl: publicBaseUrl ?? null,
    client: new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export function isStorageConfigured(): boolean {
  return !!(
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_ACCESS_KEY_ID &&
    process.env.STORAGE_SECRET_ACCESS_KEY
  );
}

export type UploadFileResult = {
  uploaded: boolean;
  fileUrl: string;
};

export async function uploadFile(
  file: File | Buffer | Uint8Array,
  fileName: string,
  contentType: string,
): Promise<UploadFileResult> {
  const config = getStorageConfig();

  if (!config.configured) {
    return {
      uploaded: false,
      fileUrl: `pending-storage://${fileName}`,
    };
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${Date.now()}-${sanitized}`;
  const body =
    file instanceof File
      ? Buffer.from(await file.arrayBuffer())
      : Buffer.from(file);

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  const fileUrl = config.publicBaseUrl
    ? `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`
    : `https://${config.bucket}.s3.amazonaws.com/${key}`;

  return { uploaded: true, fileUrl };
}
