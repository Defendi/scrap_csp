-- Schema de Banco de Dados para Scrap-CSP Analysis

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status: 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
CREATE TYPE task_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
-- Resource type: 'script', 'style', 'img', 'font', 'frame', 'media', 'other'
CREATE TYPE resource_type AS ENUM ('script', 'style', 'img', 'font', 'frame', 'media', 'api', 'other');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_url TEXT NOT NULL,
    status task_status DEFAULT 'PENDING',
    suggested_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages_scanned (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    csp_header_found TEXT,
    vulnerabilities JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'PENDING', -- PENDING, SCRAPED, FAILED
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources_found (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages_scanned(id) ON DELETE CASCADE,
    type resource_type NOT NULL,
    domain TEXT NOT NULL,
    source_url TEXT NOT NULL,
    duration_ms INTEGER,
    has_error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for background worker
CREATE INDEX idx_tasks_status ON tasks(status) WHERE status = 'PENDING';
