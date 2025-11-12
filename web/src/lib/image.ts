import imageCompression from 'browser-image-compression'

export async function compress(file: File) {
  const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1600, useWebWorker: true }
  const out = await imageCompression(file, options)
  return new File([await out.arrayBuffer()], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

