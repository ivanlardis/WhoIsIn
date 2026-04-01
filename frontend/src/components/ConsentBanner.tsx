import { useState, useEffect } from "react";
import { ShieldAlert, Check } from "lucide-react";
import { useRecordConsent } from "../api/hooks";

interface Props {
  eventId: number;
}

const CONSENT_KEY = "whoisin_consent";

export default function ConsentBanner({ eventId }: Props) {
  const [visible, setVisible] = useState(false);
  const consent = useRecordConsent();

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        if (!parsed[String(eventId)]) setVisible(true);
      } catch {
        setVisible(true);
      }
    }
  }, [eventId]);

  const handleAccept = () => {
    consent.mutate(
      { eventId, accepted: true },
      {
        onSuccess: () => {
          const stored = localStorage.getItem(CONSENT_KEY);
          const parsed = stored ? JSON.parse(stored) : {};
          parsed[String(eventId)] = true;
          localStorage.setItem(CONSENT_KEY, JSON.stringify(parsed));
          setVisible(false);
        },
      }
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-200 bg-amber-50 px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <ShieldAlert className="h-6 w-6 shrink-0 text-amber-500" />
        <p className="flex-1 text-sm text-amber-800">
          Для работы сервиса используется обработка биометрических данных (распознавание лиц).
          Нажимая &laquo;Принимаю&raquo;, вы даёте согласие на обработку.
        </p>
        <button
          type="button"
          onClick={handleAccept}
          disabled={consent.isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Принимаю
        </button>
      </div>
    </div>
  );
}
