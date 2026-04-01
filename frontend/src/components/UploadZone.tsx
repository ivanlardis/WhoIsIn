import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { useUploadPhotos } from "../api/hooks";

interface Props {
  eventId: number;
}

export default function UploadZone({ eventId }: Props) {
  const upload = useUploadPhotos(eventId);
  const [progress, setProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setProgress({ total: accepted.length, done: 0 });

      // Upload in batches of 10
      const batchSize = 10;
      let done = 0;
      for (let i = 0; i < accepted.length; i += batchSize) {
        const batch = accepted.slice(i, i + batchSize);
        await upload.mutateAsync(batch);
        done += batch.length;
        setProgress({ total: accepted.length, done });
      }
      setTimeout(() => setProgress(null), 2000);
    },
    [upload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    disabled: upload.isPending,
  });

  const isComplete = progress && progress.done === progress.total;

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer",
        isDragActive
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50",
        upload.isPending && "pointer-events-none opacity-60"
      )}
    >
      <input {...getInputProps()} />

      {progress ? (
        <div className="space-y-3">
          {isComplete ? (
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
          ) : (
            <Upload className="mx-auto h-10 w-10 animate-pulse text-indigo-500" />
          )}
          <p className="text-sm font-medium text-slate-700">
            {isComplete
              ? "Загрузка завершена!"
              : `Загрузка: ${progress.done} / ${progress.total}`}
          </p>
          <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${(progress.done / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="mx-auto h-10 w-10 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            {isDragActive
              ? "Отпустите файлы для загрузки"
              : "Перетащите фото сюда или нажмите для выбора"}
          </p>
          <p className="text-xs text-slate-400">JPG, PNG, WebP</p>
        </div>
      )}

      {upload.isError && (
        <div className="mt-3 flex items-center justify-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          Ошибка загрузки
        </div>
      )}
    </div>
  );
}
