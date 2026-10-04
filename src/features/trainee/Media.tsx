import { useState } from 'react'
import type { Exercise } from '../../plan/types'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { mediaUrl } from '../../sync/supabase'

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

/** Coach-set video, or a link to a search; never autoplay, never a broken player. */
export function DemoVideo({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false)
  const url = exercise.video_url?.trim()
  if (url) {
    const yt = youtubeId(url)
    return (
      <section className="mt-4">
        {!open ? (
          <Button variant="secondary" size="lg" full icon="play" onClick={() => setOpen(true)}>Watch the demo</Button>
        ) : yt ? (
          <div className="aspect-video overflow-hidden rounded-card bg-black">
            <iframe
              title={`Demo: ${exercise.name}`}
              src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`}
              className="size-full"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <video controls playsInline preload="metadata" src={mediaUrl(url)} className="w-full rounded-card bg-black" />
        )}
      </section>
    )
  }
  return (
    <Card className="mt-4">
      <p className="text-muted">Your own demo video will go here.</p>
      {exercise.video_search_url && (
        <a href={exercise.video_search_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-control bg-surface2 px-4 font-semibold">
          <Icon name="external" className="size-5" />
          Find a demo on YouTube
        </a>
      )}
    </Card>
  )
}

export function MachinePhoto({ exercise }: { exercise: Exercise }) {
  const url = exercise.photo_url?.trim()
  if (url) return <img src={mediaUrl(url)} alt={`The machine for ${exercise.name} at our gym`} className="mt-4 w-full rounded-card border border-line" loading="lazy" />
  if (!exercise.needs_photo) return null
  return (
    <div className="mt-4 flex min-h-20 items-center gap-3 rounded-card border border-dashed border-line px-4 text-muted">
      <Icon name="photo" className="size-6" />
      <span>No photo yet</span>
    </div>
  )
}
