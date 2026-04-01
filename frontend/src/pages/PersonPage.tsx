import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { usePersonPhotos, useUpdatePerson } from "../api/hooks";
import { downloadPersonPhotos } from "../api/client";
import PhotoGrid from "../components/PhotoGrid";

export default function PersonPage() {
  const { eventId: rawEventId, personId: rawPersonId } = useParams<{
    eventId: string;
    personId: string;
  }>();
  const eventId = Number(rawEventId);
  const personId = Number(rawPersonId);
  const navigate = useNavigate();

  const { data: photos, isLoading } = usePersonPhotos(personId);
  const update = useUpdatePerson(eventId);

  // We get person info from photos query or from navigation state
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Attempt to read person info — we'll use a simple fetch
  const [personInfo, setPersonInfo] = useState<{
    name: string;
    thumbnailUrl: string;
    photoCount: number;
  } | null>(null);

  useEffect(() => {
    // Read persons for the event to find this person
    fetch(`/api/v1/events/${eventId}/persons`)
      .then((r) => r.json())
      .then((persons: Array<{ id: number; name: string; thumbnailUrl: string; photoCount: number }>) => {
        const p = persons.find((x) => x.id === personId);
        if (p) {
          setPersonInfo(p);
          setName(p.name);
        }
      })
      .catch(() => {});
  }, [eventId, personId]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setEditValue(name);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    update.mutate(
      { personId, data: { name: trimmed } },
      {
        onSuccess: (person) => {
          setName(person.name);
          setEditing(false);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(`/events/${eventId}`)}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к мероприятию
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center gap-6">
        {/* Avatar */}
        <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 shadow-lg ring-4 ring-white">
          {personInfo?.thumbnailUrl ? (
            <img
              src={personInfo.thumbnailUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-300">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="rounded-lg border border-indigo-300 px-3 py-1.5 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-lg bg-indigo-600 p-1.5 text-white transition hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="group flex items-center gap-2"
              >
                <h1 className="text-2xl font-bold text-slate-800">
                  {name || `Персона ${personId}`}
                </h1>
                <Pencil className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              {photos?.length ?? personInfo?.photoCount ?? 0} фото
            </span>
          </div>
        </div>

        {/* Download */}
        <button
          type="button"
          onClick={() => downloadPersonPhotos(personId)}
          className={cn(
            "flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5",
            "text-sm font-medium text-white shadow-sm",
            "transition hover:bg-indigo-700"
          )}
        >
          <Download className="h-4 w-4" />
          Скачать ZIP
        </button>
      </div>

      {/* Photos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <PhotoGrid photos={photos ?? []} eventId={eventId} />
      )}
    </div>
  );
}
