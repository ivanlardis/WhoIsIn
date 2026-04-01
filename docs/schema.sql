-- WhoIsIn Database Schema
-- PostgreSQL 16 + pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- Мероприятия
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- created, processing, completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Фотографии
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(512) NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    face_count INTEGER DEFAULT 0,
    description TEXT, -- семантическое описание от OpenRouter
    description_embedding vector(768), -- text embedding для семантического поиска
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_event_id ON photos(event_id);

-- Обнаруженные лица
CREATE TABLE faces (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES persons(id) ON DELETE SET NULL,
    bbox_x REAL NOT NULL,
    bbox_y REAL NOT NULL,
    bbox_width REAL NOT NULL,
    bbox_height REAL NOT NULL,
    confidence REAL NOT NULL,
    embedding vector(512) NOT NULL, -- ArcFace 512-dim
    thumbnail_path VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faces_photo_id ON faces(photo_id);
CREATE INDEX idx_faces_person_id ON faces(person_id);
CREATE INDEX idx_faces_embedding ON faces USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Персоны (сгруппированные лица)
CREATE TABLE persons (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Person_1, Person_2, ... или пользовательское имя
    thumbnail_path VARCHAR(512),
    representative_embedding vector(512), -- среднее embedding для поиска по селфи
    photo_count INTEGER DEFAULT 0,
    face_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_persons_event_id ON persons(event_id);
CREATE INDEX idx_persons_embedding ON persons USING ivfflat (representative_embedding vector_cosine_ops) WITH (lists = 50);

-- M2M: фото ↔ персоны (одно фото может содержать несколько персон)
CREATE TABLE photo_persons (
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    PRIMARY KEY (photo_id, person_id)
);

-- Согласия на обработку биометрии
CREATE TABLE consent_records (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    accepted BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Статус pipeline
CREATE TABLE pipeline_runs (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'idle', -- idle, detecting, embedding, clustering, describing, complete, failed
    progress REAL DEFAULT 0,
    current_photo_index INTEGER DEFAULT 0,
    total_photos INTEGER DEFAULT 0,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_event_id ON pipeline_runs(event_id);

-- Результаты бенчмарка ML-моделей
CREATE TABLE benchmark_results (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    precision_score REAL,
    recall_score REAL,
    f1_score REAL,
    avg_time_per_photo REAL,
    total_photos INTEGER,
    run_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
