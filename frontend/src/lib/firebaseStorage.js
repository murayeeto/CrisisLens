import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

function sanitizeFileName(name) {
  return (name || 'proof')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function uploadCampaignProofFiles({ uid, campaignId, files, bucket = 'general' }) {
  const uploads = Array.from(files || [])

  return Promise.all(
    uploads.map(async (file, index) => {
      const storagePath = `campaign-proof/${uid}/${campaignId}/${bucket}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`
      const proofRef = ref(storage, storagePath)
      await uploadBytes(proofRef, file, {
        contentType: file.type || 'application/octet-stream',
      })
      const downloadUrl = await getDownloadURL(proofRef)

      return {
        name: file.name,
        storagePath,
        downloadUrl,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }
    }),
  )
}
