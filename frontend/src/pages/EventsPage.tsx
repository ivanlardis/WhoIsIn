import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../lib/utils";
import {
  Plus,
  Calendar,
  Camera,
  Users,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { useEvents, useCreateEvent } from "../api/hooks";
import type { Event } from "../types";

const statusConfig: Record<
  Event["status"],
  { label: string; bg: string; text: string }
> = {
  created: { label: "Новое", bg: "bg-slate-100", text: "text-slate-600" },
  processing: {
    label: "Обработка",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  completed: {
    label: "Готово",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const create = useCreateEvent();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", description: "" });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    create.mutate(
      {
        name: form.name.trim(),
        date: form.date || undefined,
        description: form.description || undefined,
      },
      {
        onSuccess: (event) => {
          trackEvent("event-created", { eventId: event.id });
          setShowModal(false);
          setForm({ name: "", date: "", description: "" });
          navigate(`/events/${event.id}`);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Мероприятия</h1>
          <p className="mt-1 text-sm text-slate-500">
            Управляйте фотографиями ваших мероприятий
          </p>
        </div>
        <button
          type="button"
          onClick={() => { trackEvent("modal-open", { modal: "create-event" }); setShowModal(true); }}
          className={cn(
            "flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5",
            "text-sm font-medium text-white shadow-sm",
            "transition hover:bg-indigo-700 active:bg-indigo-800"
          )}
        >
          <Plus className="h-4 w-4" />
          Создать мероприятие
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Empty */}
      {events && events.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Sparkles className="h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Мероприятий пока нет</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Создать первое
          </button>
        </div>
      )}

      {/* Grid */}
      {events && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const sCfg = statusConfig[event.status];
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => { trackEvent("event-opened", { eventId: event.id, eventName: event.name }); navigate(`/events/${event.id}`); }}
                className={cn(
                  "group flex flex-col gap-4 rounded-xl bg-white p-5",
                  "shadow-sm text-left transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                )}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      sCfg.bg,
                      sCfg.text
                    )}
                  >
                    {sCfg.label}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-4 text-xs text-slate-400">
                  {event.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.date)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" />
                    {event.photoCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {event.personCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Новое мероприятие
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Название *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="TechCommunity Fest 2026"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Дата
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Описание
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Краткое описание мероприятия"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!form.name.trim() || create.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {create.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
