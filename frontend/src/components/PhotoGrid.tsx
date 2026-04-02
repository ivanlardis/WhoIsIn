import { useState } from "react";
import { Users } from "lucide-react";
import { cn, trackEvent } from "../lib/utils";
import type { Photo } from "../types";
import PhotoLightbox from "./PhotoLightbox";

interface Props {
  photos: Photo[];
  eventId: number;
}

export default function PhotoGrid({ photos, eventId }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        Фотографии не найдены
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => { trackEvent("photo-opened", { photoId: photo.id, eventId }); setSelectedIdx(idx); }}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg bg-slate-100",
              "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500"
            )}
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.filename}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {photo.faceCount > 0 && (
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                <Users className="h-3 w-3" />
                {photo.faceCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedIdx !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={selectedIdx}
          eventId={eventId}
          onClose={() => setSelectedIdx(null)}
          onNavigate={setSelectedIdx}
        />
      )}
    </>
  );
}
