import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import * as api from "./client";
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
} from "../types";

// Keys
const keys = {
  events: ["events"] as const,
  event: (id: number) => ["events", id] as const,
  photos: (eventId: number, page: number) =>
    ["photos", eventId, page] as const,
  photo: (eventId: number, photoId: number) =>
    ["photo", eventId, photoId] as const,
  pipeline: (eventId: number) => ["pipeline", eventId] as const,
  persons: (eventId: number) => ["persons", eventId] as const,
  personPhotos: (personId: number) => ["personPhotos", personId] as const,
};

// Events
export function useEvents(): UseQueryResult<Event[]> {
  return useQuery({ queryKey: keys.events, queryFn: api.listEvents });
}

export function useEvent(eventId: number): UseQueryResult<EventDetail> {
  return useQuery({
    queryKey: keys.event(eventId),
    queryFn: () => api.getEvent(eventId),
    enabled: eventId > 0,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation<Event, Error, CreateEventRequest>({
    mutationFn: api.createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.events }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: api.deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.events }),
  });
}

// Photos
export function useUploadPhotos(eventId: number) {
  const qc = useQueryClient();
  return useMutation<UploadResult, Error, File[]>({
    mutationFn: (files) => api.uploadPhotos(eventId, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.event(eventId) });
      qc.invalidateQueries({ queryKey: ["photos", eventId] });
    },
  });
}

export function usePhotos(
  eventId: number,
  page = 1,
  limit = 50
): UseQueryResult<PhotoList> {
  return useQuery({
    queryKey: keys.photos(eventId, page),
    queryFn: () => api.listPhotos(eventId, page, limit),
    enabled: eventId > 0,
  });
}

export function usePhoto(
  eventId: number,
  photoId: number
): UseQueryResult<PhotoDetail> {
  return useQuery({
    queryKey: keys.photo(eventId, photoId),
    queryFn: () => api.getPhoto(eventId, photoId),
    enabled: eventId > 0 && photoId > 0,
  });
}

// Pipeline
export function useStartPipeline(eventId: number) {
  const qc = useQueryClient();
  return useMutation<PipelineStatus, Error>({
    mutationFn: () => api.startPipeline(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.pipeline(eventId) });
      qc.invalidateQueries({ queryKey: keys.event(eventId) });
    },
  });
}

export function usePipelineStatus(
  eventId: number,
  enabled = true
): UseQueryResult<PipelineStatus> {
  return useQuery({
    queryKey: keys.pipeline(eventId),
    queryFn: () => api.getPipelineStatus(eventId),
    enabled: enabled && eventId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && !["complete", "failed", "idle"].includes(status))
        return 3000;
      return false;
    },
  });
}

// Persons
export function usePersons(eventId: number): UseQueryResult<Person[]> {
  return useQuery({
    queryKey: keys.persons(eventId),
    queryFn: () => api.listPersons(eventId),
    enabled: eventId > 0,
  });
}

export function useUpdatePerson(eventId: number) {
  const qc = useQueryClient();
  return useMutation<
    Person,
    Error,
    { personId: number; data: UpdatePersonRequest }
  >({
    mutationFn: ({ personId, data }) => api.updatePerson(personId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.persons(eventId) }),
  });
}

export function usePersonPhotos(personId: number): UseQueryResult<Photo[]> {
  return useQuery({
    queryKey: keys.personPhotos(personId),
    queryFn: () => api.getPersonPhotos(personId),
    enabled: personId > 0,
  });
}

// Search
export function useSelfieSearch(eventId: number) {
  return useMutation<SelfieSearchResult, Error, File>({
    mutationFn: (file) => api.searchBySelfie(eventId, file),
  });
}

// Consent
export function useRecordConsent() {
  return useMutation<void, Error, { eventId: number; accepted: boolean }>({
    mutationFn: (data) => api.recordConsent(data),
  });
}
