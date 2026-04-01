export interface CreateEventRequest {
  name: string;
  date?: string;
  description?: string;
}

export interface Event {
  id: number;
  name: string;
  date: string | null;
  description: string | null;
  photoCount: number;
  personCount: number;
  status: "created" | "processing" | "completed";
  createdAt: string;
}

export interface EventStats {
  totalPhotos: number;
  totalFaces: number;
  totalPersons: number;
  photosWithoutFaces: number;
}

export interface EventDetail extends Event {
  stats: EventStats;
}

export interface UploadResult {
  uploaded: number;
  failed: number;
  photoIds: number[];
}

export interface Photo {
  id: number;
  filename: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  faceCount: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Face {
  id: number;
  bbox: BBox;
  confidence: number;
  thumbnailUrl: string;
  personId: number | null;
}

export interface PhotoDetail extends Photo {
  faces: Face[];
  description: string | null;
}

export interface PhotoList {
  items: Photo[];
  total: number;
  page: number;
  limit: number;
}

export interface Person {
  id: number;
  name: string;
  thumbnailUrl: string;
  photoCount: number;
  faceCount: number;
}

export interface UpdatePersonRequest {
  name: string;
}

export type PipelineStage =
  | "idle"
  | "detecting"
  | "embedding"
  | "clustering"
  | "describing"
  | "complete"
  | "failed";

export interface PipelineStatus {
  eventId: number;
  status: PipelineStage;
  progress: number;
  etaSeconds: number | null;
  currentPhotoIndex: number;
  totalPhotos: number;
  error: string | null;
}

export interface SelfieMatch {
  person: Person;
  confidence: number;
}

export interface SelfieSearchResult {
  matches: SelfieMatch[];
}

export interface SemanticSearchResultItem {
  photo: Photo;
  relevance: number;
}

export interface SemanticSearchResult {
  results: SemanticSearchResultItem[];
}

export interface ConsentRequest {
  eventId: number;
  accepted: boolean;
}
