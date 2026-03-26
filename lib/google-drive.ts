import { google } from 'googleapis'
import { Readable } from 'stream'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
)

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
]

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })
}

export async function getAccessToken(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  } catch (error) {
    console.error('Error getting tokens:', error)
    throw error
  }
}

export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens)
}

export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

export async function uploadToGoogleDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  
  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined
  }

  const media = {
    mimeType: mimeType,
    body: Readable.from(buffer)
  }

  console.log(`Starting Drive API file creation for: ${fileName}`)
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink'
  })

  // Set permissions to public viewable
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  })

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!
  }
}

export async function deleteFromGoogleDrive(fileId: string) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  await drive.files.delete({ fileId: fileId })
}
