import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { usePhoto } from "../api/hooks";
import type { Photo } from "../types";

interface Props {
  photos: Photo[];
  currentIndex: number;
  eventId: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const FACE_COLORS = [
  "border-indigo-400",
  "border-emerald-400",
  "border-amber-400",
  "border-rose-400",
  "border-cyan-400",
  "border-purple-400",
];

export default function PhotoLightbox({
  photos,
  currentIndex,
  eventId,
  onClose,
  onNavigate,
}: Props) {
  const photo = photos[currentIndex];
  const { data: detail } = usePhoto(eventId, photo?.id ?? 0);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Nav prev */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Nav next */}
      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image with face bboxes */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.filename}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        />

        {/* Face bounding boxes */}
        {detail?.faces?.map((face, i) => (
          <div
            key={face.id}
            className={cn(
              "absolute border-2 rounded",
              FACE_COLORS[i % FACE_COLORS.length]
            )}
            style={{
              left: `${(face.bbox.x / photo.width) * 100}%`,
              top: `${(face.bbox.y / photo.height) * 100}%`,
              width: `${(face.bbox.width / photo.width) * 100}%`,
              height: `${(face.bbox.height / photo.height) * 100}%`,
            }}
          >
            {face.personId && (
              <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                ID {face.personId}
              </span>
            )}
          </div>
        ))}

        {/* Description */}
        {detail?.description && (
          <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent p-4 pt-8">
            <p className="text-sm text-white/90">{detail.description}</p>
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}
