import type {
  CreateEventRequest,
  Event,
  EventDetail,
  UploadResult,
  PhotoList,
  PhotoDetail,
  PipelineStatus,
  Person,
  UpdatePersonRequest,
  Photo,
  SelfieSearchResult,
  ConsentRequest,
} from "../types";

const BASE = "/api/v1";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Events
export function createEvent(data: CreateEventRequest): Promise<Event> {
  return request("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listEvents(): Promise<Event[]> {
  return request("/events");
}

export function getEvent(eventId: number): Promise<EventDetail> {
  return request(`/events/${eventId}`);
}

export function deleteEvent(eventId: number): Promise<void> {
  return request(`/events/${eventId}`, { method: "DELETE" });
}

// Photos
export function uploadPhotos(
  eventId: number,
  files: File[]
): Promise<UploadResult> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return request(`/events/${eventId}/photos`, {
    method: "POST",
    body: form,
  });
}

export function listPhotos(
  eventId: number,
  page = 1,
  limit = 50
): Promise<PhotoList> {
  return request(`/events/${eventId}/photos?page=${page}&limit=${limit}`);
}

export function getPhoto(
  eventId: number,
  photoId: number
): Promise<PhotoDetail> {
  return request(`/events/${eventId}/photos/${photoId}`);
}

// Pipeline
export function startPipeline(eventId: number): Promise<PipelineStatus> {
  return request(`/events/${eventId}/pipeline/start`, { method: "POST" });
}

export function getPipelineStatus(eventId: number): Promise<PipelineStatus> {
  return request(`/events/${eventId}/pipeline/status`);
}

// Persons
export function listPersons(eventId: number): Promise<Person[]> {
  return request(`/events/${eventId}/persons`);
}

export function updatePerson(
  personId: number,
  data: UpdatePersonRequest
): Promise<Person> {
  return request(`/persons/${personId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getPersonPhotos(personId: number): Promise<Photo[]> {
  return request(`/persons/${personId}/photos`);
}

export function downloadPersonPhotos(personId: number): void {
  window.open(`${BASE}/persons/${personId}/download`, "_blank");
}

// Search
export function searchBySelfie(
  eventId: number,
  file: File
): Promise<SelfieSearchResult> {
  const form = new FormData();
  form.append("file", file);
  return request(`/events/${eventId}/search/selfie`, {
    method: "POST",
    body: form,
  });
}

// Consent
export function recordConsent(data: ConsentRequest): Promise<void> {
  return request("/consent", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
