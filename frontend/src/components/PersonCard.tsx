import { useNavigate } from "react-router-dom";
import { Camera, Pencil } from "lucide-react";
import { cn, trackEvent } from "../lib/utils";
import type { Person } from "../types";

interface Props {
  person: Person;
  eventId: number;
  confidence?: number;
  onClick?: () => void;
}

export default function PersonCard({
  person,
  eventId,
  confidence,
  onClick,
}: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    trackEvent("person-viewed", { personId: person.id, personName: person.name, eventId });
    if (onClick) {
      onClick();
    } else {
      navigate(`/events/${eventId}/persons/${person.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-xl bg-white p-5",
        "shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        "w-full text-left"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white shadow">
          {person.thumbnailUrl ? (
            <img
              src={person.thumbnailUrl}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-300">
              {person.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {confidence !== undefined && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
          {person.name}
        </span>
        <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Camera className="h-3.5 w-3.5" />
        <span>{person.photoCount} фото</span>
      </div>
    </button>
  );
}
