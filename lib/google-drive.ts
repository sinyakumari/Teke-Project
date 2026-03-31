import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]

export function createOAuth2Client() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

console.log('[GoogleDrive] Using REDIRECT_URI:', REDIRECT_URI)

export function getAuthUrl() {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI // Directly ensure it's passed
  })
}

export async function getAccessToken(code: string) {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  const client = createOAuth2Client()
  client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await client.refreshAccessToken()
  return credentials
}

/**
 * Creates a folder in Google Drive.
 */
export async function createGoogleDriveFolder(
  credentials: { access_token: string; refresh_token?: string },
  folderName: string
) {
  const client = createOAuth2Client()
  client.setCredentials(credentials)
  const drive = google.drive({ version: 'v3', auth: client })
  
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  }

  const file = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  })

  return file.data.id
}

/**
 * Uploads a file to a specific Google Drive folder.
 */
export async function uploadToGoogleDrive(
  credentials: { access_token: string; refresh_token?: string },
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId?: string
) {
  const client = createOAuth2Client()
  client.setCredentials(credentials)
  const drive = google.drive({ version: 'v3', auth: client })
  
  const fileMetadata: any = {
    name: fileName,
  }
  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId]
  }

  const media = {
    mimeType: mimeType,
    body: require('stream').Readable.from(fileBuffer),
  }

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  })

  // Set permissions so anyone with link can view (needed for fetching content)
  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
  }
}

/**
 * Deletes a file from Google Drive.
 */
export async function deleteFromGoogleDrive(
  credentials: { access_token: string; refresh_token?: string },
  fileId: string
) {
  const client = createOAuth2Client()
  client.setCredentials(credentials)
  const drive = google.drive({ version: 'v3', auth: client })
  await drive.files.delete({ fileId: fileId })
}

/**
 * Fetches the raw buffer of a file from Google Drive.
 */
export async function getFileBuffer(
  credentials: { access_token: string; refresh_token?: string },
  fileId: string
): Promise<Buffer> {
  const client = createOAuth2Client()
  client.setCredentials(credentials)
  const drive = google.drive({ version: 'v3', auth: client })
  
  console.log(`[GoogleDrive] Starting download for fileId: ${fileId}...`)
  
  const response = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  const data = response.data

  if (!data) {
    throw new Error('Failed to retrieve file content from Google Drive (empty response)')
  }

  let buffer: Buffer

  if (Buffer.isBuffer(data)) {
    // Already a Node.js Buffer
    buffer = data
  } else if (data instanceof ArrayBuffer) {
    // Standard ArrayBuffer
    buffer = Buffer.from(data)
  } else if (ArrayBuffer.isView(data)) {
    // Typed array (Uint8Array, etc.)
    buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  } else if (typeof data === 'object') {
    // Fallback: googleapis sometimes wraps the arraybuffer in an object
    // Try to convert via JSON stringification path or treat as buffer-like
    try {
      buffer = Buffer.from(data as any)
    } catch {
      throw new Error(`[GoogleDrive] Could not convert response to Buffer. Type: ${typeof data}, Constructor: ${(data as any)?.constructor?.name}`)
    }
  } else {
    throw new Error(`[GoogleDrive] Unexpected response data type: ${typeof data}`)
  }

  console.log(`[GoogleDrive] Downloaded ${buffer.length} bytes for ${fileId}`)
  return buffer
}
