-- Create pigeons table
CREATE TABLE pigeons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ring_number TEXT NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    name TEXT,
    color TEXT,
    sex INTEGER NOT NULL, -- 0: male, 1: female, 2: unknown
    strain TEXT,
    loft TEXT,
    status INTEGER DEFAULT 1, -- 1: active, other: inactive
    image_path TEXT,
    sire_ring_number TEXT,
    sire_year INTEGER,
    dam_ring_number TEXT,
    dam_year INTEGER,
    extra_fields TEXT, -- JSON format for additional fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_pigeons_ring_number ON pigeons(ring_number);
CREATE INDEX idx_pigeons_year ON pigeons(year);
CREATE INDEX idx_pigeons_sex ON pigeons(sex);
CREATE INDEX idx_pigeons_status ON pigeons(status);
CREATE INDEX idx_pigeons_loft ON pigeons(loft);

-- Create breed table
CREATE TABLE breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create lofts table
CREATE TABLE lofts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create colors table
CREATE TABLE colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data
INSERT INTO breeds (name, description) VALUES
    ('Unknown', 'Unknown breed'),
    ('Homing Pigeon', 'Traditional homing pigeon'),
    ('Racing Homer', 'Racing homer pigeon'),
    ('Fancy Pigeon', 'Fancy pigeon breed');

INSERT INTO lofts (name, description) VALUES
    ('Main Loft', 'Main pigeon loft'),
    ('Breeding Loft', 'Breeding loft'),
    ('Quarantine', 'Quarantine loft');

INSERT INTO colors (name) VALUES
    ('Unknown'),
    ('Blue'),
    ('Blue Bar'),
    ('Blue Check'),
    ('Black'),
    ('Red'),
    ('Yellow'),
    ('White'),
    ('Silver'),
    ('Mealy'),
    ('Grizzle');