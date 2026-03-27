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

export function getAuthUrl() {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
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

  if (!response.data || !(response.data instanceof ArrayBuffer)) {
    console.error('[GoogleDrive] Unexpected response type from Google Drive API:', typeof response.data)
    throw new Error('Failed to retrieve file content from Google Drive (Invalid response type)')
  }

  const buffer = Buffer.from(response.data)
  console.log(`[GoogleDrive] Downloaded ${buffer.length} bytes for ${fileId}`)
  return buffer
}
