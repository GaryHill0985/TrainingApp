import { supabase, cloudConfigured } from './supabase'
import { newId } from '../lib/ids'

/**
 * Upload a photo or short video to the media bucket. Returns the storage path to save on the row,
 * or a plain-words problem. Needs the coach's phone to be online and paired.
 */
export async function uploadMedia(file: File, folder: 'photos' | 'videos' | 'inspiration'): Promise<{ path: string } | { problem: string }> {
  if (!cloudConfigured) return { problem: 'This build has no cloud settings.' }
  if (!navigator.onLine) return { problem: 'You are offline. Connect to the internet and try again.' }
  const maxMb = folder === 'videos' ? 100 : 15
  if (file.size > maxMb * 1024 * 1024) return { problem: `That file is too big (over ${maxMb} MB). Try a shorter clip or a smaller photo.` }
  const ext = (file.name.split('.').pop() || (file.type.split('/')[1] ?? 'bin')).toLowerCase()
  const path = `${folder}/${newId()}.${ext}`
  const { error } = await supabase().storage.from('media').upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (error) return { problem: `Upload did not work: ${error.message}` }
  return { path }
}
