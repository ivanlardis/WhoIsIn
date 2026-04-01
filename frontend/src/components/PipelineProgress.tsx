import {
  Search,
  Brain,
  CheckCircle,
  Layers,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn, formatEta } from "../lib/utils";
import type { PipelineStage, PipelineStatus } from "../types";

interface Props {
  status: PipelineStatus;
}

const stageConfig: Record<
  PipelineStage,
  { label: string; icon: React.ElementType; color: string }
> = {
  idle: { label: "Ожидание", icon: Loader2, color: "text-slate-400" },
  detecting: {
    label: "Детекция лиц",
    icon: Search,
    color: "text-amber-500",
  },
  embedding: {
    label: "Векторизация",
    icon: Layers,
    color: "text-blue-500",
  },
  clustering: {
    label: "Кластеризация",
    icon: Brain,
    color: "text-purple-500",
  },
  describing: {
    label: "Описание фото",
    icon: FileText,
    color: "text-cyan-500",
  },
  complete: {
    label: "Завершено",
    icon: CheckCircle,
    color: "text-emerald-500",
  },
  failed: {
    label: "Ошибка",
    icon: AlertTriangle,
    color: "text-red-500",
  },
};

const stages: PipelineStage[] = [
  "detecting",
  "embedding",
  "clustering",
  "describing",
  "complete",
];

function getStageIndex(stage: PipelineStage): number {
  return stages.indexOf(stage);
}

export default function PipelineProgress({ status }: Props) {
  const cfg = stageConfig[status.status];
  const Icon = cfg.icon;
  const isActive = !["idle", "complete", "failed"].includes(status.status);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            status.status === "complete"
              ? "bg-emerald-50"
              : status.status === "failed"
                ? "bg-red-50"
                : "bg-indigo-50"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              cfg.color,
              isActive && "animate-pulse"
            )}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
          {isActive && status.totalPhotos > 0 && (
            <p className="text-xs text-slate-500">
              {status.currentPhotoIndex} / {status.totalPhotos} фото
              {status.etaSeconds ? ` \u2022 ${formatEta(status.etaSeconds)}` : ""}
            </p>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            status.status === "complete"
              ? "bg-emerald-50 text-emerald-700"
              : status.status === "failed"
                ? "bg-red-50 text-red-700"
                : "bg-indigo-50 text-indigo-700"
          )}
        >
          {Math.round(status.progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status.status === "complete"
              ? "bg-emerald-500"
              : status.status === "failed"
                ? "bg-red-500"
                : "bg-indigo-600"
          )}
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center justify-between">
        {stages.map((stage, i) => {
          const currentIdx = getStageIndex(status.status);
          const done = i <= currentIdx;
          const active = stage === status.status;
          const sCfg = stageConfig[stage];
          const SIcon = sCfg.icon;
          return (
            <div key={stage} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : done
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-400"
                )}
              >
                <SIcon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active
                    ? "text-indigo-600"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                )}
              >
                {sCfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {status.error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {status.error}
        </div>
      )}
    </div>
  );
}
