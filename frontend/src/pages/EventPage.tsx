import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Users,
  Eye,
  Play,
  Search,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import {
  useEvent,
  usePersons,
  usePhotos,
  useStartPipeline,
  usePipelineStatus,
  useDeleteEvent,
} from "../api/hooks";
import { usePipelineWS } from "../hooks/useWebSocket";
import UploadZone from "../components/UploadZone";
import PipelineProgress from "../components/PipelineProgress";
import PersonCard from "../components/PersonCard";
import PhotoGrid from "../components/PhotoGrid";
import SelfieSearch from "../components/SelfieSearch";
import ConsentBanner from "../components/ConsentBanner";

type Tab = "persons" | "photos";

export default function EventPage() {
  const { eventId: rawId } = useParams<{ eventId: string }>();
  const eventId = Number(rawId);
  const navigate = useNavigate();

  const { data: event, isLoading } = useEvent(eventId);
  const { data: persons } = usePersons(eventId);
  const { data: photoList } = usePhotos(eventId);
  const { data: pipelineHTTP } = usePipelineStatus(eventId);
  const pipelineWS = usePipelineWS(eventId);
  const startPipeline = useStartPipeline(eventId);
  const deleteEvent = useDeleteEvent();

  const [tab, setTab] = useState<Tab>("persons");
  const [showSelfie, setShowSelfie] = useState(false);

  // Prefer WS data, fall back to HTTP polling
  const pipeline = pipelineWS ?? pipelineHTTP;
  const isProcessing =
    pipeline &&
    !["idle", "complete", "failed"].includes(pipeline.status);

  const handleDelete = () => {
    if (!confirm("Удалить мероприятие и все данные?")) return;
    deleteEvent.mutate(eventId, {
      onSuccess: () => navigate("/"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center text-slate-500">
        Мероприятие не найдено
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Все мероприятия
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{event.name}</h1>
          {event.date && (
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(event.date)}
            </p>
          )}
          {event.description && (
            <p className="mt-2 text-sm text-slate-600">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSelfie(true)}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
            Найти себя
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-white p-2 text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Camera,
            label: "Фото",
            value: event.stats.totalPhotos,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            icon: Eye,
            label: "Лица",
            value: event.stats.totalFaces,
            color: "text-amber-600 bg-amber-50",
          },
          {
            icon: Users,
            label: "Персоны",
            value: event.stats.totalPersons,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            icon: Camera,
            label: "Без лиц",
            value: event.stats.photosWithoutFaces,
            color: "text-slate-500 bg-slate-100",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                stat.color
              )}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="mb-6">
        <UploadZone eventId={eventId} />
      </div>

      {/* Pipeline */}
      {pipeline && pipeline.status !== "idle" && (
        <div className="mb-6">
          <PipelineProgress status={pipeline} />
        </div>
      )}

      {/* Start Pipeline Button */}
      {event.stats.totalPhotos > 0 &&
        (!pipeline || pipeline.status === "idle") && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => startPipeline.mutate()}
              disabled={startPipeline.isPending}
              className={cn(
                "flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3",
                "text-sm font-medium text-white shadow-sm",
                "transition hover:bg-indigo-700 disabled:opacity-50"
              )}
            >
              {startPipeline.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Запустить обработку
            </button>
          </div>
        )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: "persons" as Tab, label: "Персоны", icon: Users },
            { key: "photos" as Tab, label: "Все фото", icon: Camera },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
              tab === t.key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "persons" && (
        <div>
          {persons && persons.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {persons.map((p) => (
                <PersonCard key={p.id} person={p} eventId={eventId} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              {isProcessing
                ? "Обработка фотографий..."
                : "Персоны появятся после обработки фото"}
            </div>
          )}
        </div>
      )}

      {tab === "photos" && (
        <PhotoGrid
          photos={photoList?.items ?? []}
          eventId={eventId}
        />
      )}

      {/* Selfie search modal */}
      {showSelfie && (
        <SelfieSearch eventId={eventId} onClose={() => setShowSelfie(false)} />
      )}

      {/* Consent */}
      <ConsentBanner eventId={eventId} />
    </div>
  );
}
