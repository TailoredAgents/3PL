import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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
  storageKey: string | null;
  fileSize: number | null;
  mimeType: string | null;
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
      storageKey: null,
      fileSize: file instanceof File ? file.size : Buffer.byteLength(file),
      mimeType: contentType,
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

  return {
    uploaded: true,
    fileUrl,
    storageKey: key,
    fileSize: body.byteLength,
    mimeType: contentType,
  };
}

export async function downloadStoredFile(storageKey: string) {
  const config = getStorageConfig();

  if (!config.configured) {
    throw new Error("Storage is not configured.");
  }

  const response = await config.client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: storageKey,
    }),
  );

  if (!response.Body) {
    throw new Error("Stored file is empty.");
  }

  const body = await response.Body.transformToByteArray();

  return {
    body,
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength ?? body.byteLength,
  };
}
