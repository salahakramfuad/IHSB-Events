import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// Parse CLOUDINARY_URL (format: cloudinary://api_key:api_secret@cloud_name)
function getCloudConfig(): { cloud_name: string; api_key: string; api_secret: string } | null {
  const url = process.env.CLOUDINARY_URL
  if (url) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/)
    if (match) {
      const [, api_key, api_secret, cloud_name] = match
      return { cloud_name: cloud_name.trim(), api_key, api_secret }
    }
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (cloudName && apiKey && apiSecret) {
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const config = getCloudConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Set CLOUDINARY_URL (e.g. cloudinary://api_key:api_secret@cloud_name) or CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET.' },
        { status: 500 }
      )
    }

    cloudinary.config(config)

    const formData = await request.formData()
    const file = formData.get('file') ?? formData.get('image')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const readableStream = Readable.from(buffer)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ihsb-events',
          resource_type: 'image',
        },
        (err, res) => {
          if (err) reject(err)
          else if (res?.secure_url) resolve(res)
          else reject(new Error('Upload failed'))
        }
      )
      readableStream.pipe(uploadStream)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
