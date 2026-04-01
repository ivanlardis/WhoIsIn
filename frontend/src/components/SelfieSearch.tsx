import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Camera, Loader2, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { useSelfieSearch } from "../api/hooks";
import PersonCard from "./PersonCard";

interface Props {
  eventId: number;
  onClose: () => void;
}

export default function SelfieSearch({ eventId, onClose }: Props) {
  const search = useSelfieSearch(eventId);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      search.mutate(file);
    },
    [search]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: search.isPending,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              Найти себя по селфи
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        {!search.data && (
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer",
              isDragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-indigo-400"
            )}
          >
            <input {...getInputProps()} />
            {search.isPending ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Поиск...</p>
              </>
            ) : preview ? (
              <img
                src={preview}
                alt="preview"
                className="h-32 w-32 rounded-full object-cover shadow"
              />
            ) : (
              <>
                <Camera className="h-10 w-10 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">
                  Загрузите селфи для поиска
                </p>
                <p className="text-xs text-slate-400">
                  Перетащите или нажмите для выбора
                </p>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {search.data && (
          <div className="space-y-4">
            {preview && (
              <div className="flex justify-center">
                <img
                  src={preview}
                  alt="selfie"
                  className="h-20 w-20 rounded-full object-cover shadow ring-2 ring-indigo-100"
                />
              </div>
            )}

            {search.data.matches.length > 0 ? (
              <>
                <p className="text-center text-sm text-slate-600">
                  Найдено совпадений: {search.data.matches.length}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {search.data.matches.map((m) => (
                    <PersonCard
                      key={m.person.id}
                      person={m.person}
                      eventId={eventId}
                      confidence={m.confidence}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Совпадений не найдено
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Попробуйте другое фото или просмотрите галерею
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                search.reset();
                setPreview(null);
              }}
              className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Error */}
        {search.isError && (
          <p className="mt-3 text-center text-sm text-red-500">
            Ошибка поиска. Попробуйте ещё раз.
          </p>
        )}
      </div>
    </div>
  );
}
