-- Pigeon Planner Health Records Migration
-- Health Management System Database Schema
-- Version 005

-- Vaccine Types Dictionary
CREATE TABLE IF NOT EXISTS vaccine_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    recommended_age_days INTEGER,
    frequency_days INTEGER,  -- How often to repeat (0 = one-time)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Disease Types Dictionary
CREATE TABLE IF NOT EXISTS disease_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    symptoms TEXT,
    treatment_recommendations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medication Types Dictionary
CREATE TABLE IF NOT EXISTS medication_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    dosage_form TEXT,  -- tablet, injection, liquid, etc.
    standard_dosage TEXT,
    contraindications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Health Check Records
CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pigeon_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    weight REAL,  -- in grams
    temperature REAL,  -- in Celsius
    condition TEXT NOT NULL,  -- excellent, good, fair, poor
    respiratory_rate INTEGER,  -- breaths per minute
    heart_rate INTEGER,  -- beats per minute
    feathers_condition TEXT,  -- excellent, good, fair, poor
    eyes_condition TEXT,  -- clear, cloudy, discharge
    nose_condition TEXT,  -- clear, discharge
    mouth_condition TEXT,  -- normal, abnormal
    crop_condition TEXT,  -- full, empty, abnormal
    vent_condition TEXT,  -- clean, dirty, abnormal
    feet_condition TEXT,  -- normal, abnormal
    notes TEXT,
    examiner TEXT,  -- who performed the check
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE
);

-- Vaccination Records
CREATE TABLE IF NOT EXISTS vaccinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pigeon_id INTEGER NOT NULL,
    vaccine_type_id INTEGER NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    batch_number TEXT,
    manufacturer TEXT,
    veterinarian TEXT,
    dosage TEXT,
    administration_route TEXT,  -- injection, oral, nasal
    injection_site TEXT,  -- neck, breast, leg
    adverse_reactions TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_type_id) REFERENCES vaccine_types(id) ON DELETE RESTRICT
);

-- Treatment Records
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pigeon_id INTEGER NOT NULL,
    disease_type_id INTEGER,
    medication_type_id INTEGER,
    diagnosis_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'ongoing',  -- ongoing, completed, discontinued
    symptoms TEXT,
    diagnosis TEXT,
    medication_name TEXT,
    dosage TEXT,
    frequency TEXT,  -- e.g., "twice daily", "once weekly"
    administration_route TEXT,
    duration_days INTEGER,
    response_to_treatment TEXT,  -- excellent, good, fair, poor
    side_effects TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    veterinarian TEXT,
    cost REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    FOREIGN KEY (disease_type_id) REFERENCES disease_types(id) ON DELETE SET NULL,
    FOREIGN KEY (medication_type_id) REFERENCES medication_types(id) ON DELETE SET NULL
);

-- Health Reminders
CREATE TABLE IF NOT EXISTS health_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pigeon_id INTEGER NOT NULL,
    reminder_type TEXT NOT NULL,  -- vaccination, health_check, treatment_followup, general
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME,
    priority TEXT DEFAULT 'medium',  -- low, medium, high
    status TEXT DEFAULT 'pending',  -- pending, completed, dismissed, postponed
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,  -- daily, weekly, monthly, yearly
    recurrence_interval INTEGER DEFAULT 1,  -- e.g., every 2 weeks
    recurrence_end_date DATE,
    notification_sent BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_checks_pigeon_id ON health_checks(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_date ON health_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_health_checks_pigeon_date ON health_checks(pigeon_id, check_date);

CREATE INDEX IF NOT EXISTS idx_vaccinations_pigeon_id ON vaccinations(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_vaccine_type ON vaccinations(vaccine_type_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(vaccination_date);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON vaccinations(next_due_date);

CREATE INDEX IF NOT EXISTS idx_treatments_pigeon_id ON treatments(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_treatments_disease_type ON treatments(disease_type_id);
CREATE INDEX IF NOT EXISTS idx_treatments_medication_type ON treatments(medication_type_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments(status);
CREATE INDEX IF NOT EXISTS idx_treatments_diagnosis_date ON treatments(diagnosis_date);

CREATE INDEX IF NOT EXISTS idx_health_reminders_pigeon_id ON health_reminders(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_health_reminders_type ON health_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_health_reminders_due_date ON health_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_health_reminders_status ON health_reminders(status);
CREATE INDEX IF NOT EXISTS idx_health_reminders_priority ON health_reminders(priority);

-- Create triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_vaccine_types_timestamp
    AFTER UPDATE ON vaccine_types
    FOR EACH ROW
    BEGIN
        UPDATE vaccine_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_disease_types_timestamp
    AFTER UPDATE ON disease_types
    FOR EACH ROW
    BEGIN
        UPDATE disease_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_medication_types_timestamp
    AFTER UPDATE ON medication_types
    FOR EACH ROW
    BEGIN
        UPDATE medication_types SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_health_checks_timestamp
    AFTER UPDATE ON health_checks
    FOR EACH ROW
    BEGIN
        UPDATE health_checks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_vaccinations_timestamp
    AFTER UPDATE ON vaccinations
    FOR EACH ROW
    BEGIN
        UPDATE vaccinations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_treatments_timestamp
    AFTER UPDATE ON treatments
    FOR EACH ROW
    BEGIN
        UPDATE treatments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_health_reminders_timestamp
    AFTER UPDATE ON health_reminders
    FOR EACH ROW
    BEGIN
        UPDATE health_reminders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create views for statistics and reporting
CREATE VIEW IF NOT EXISTS health_statistics AS
SELECT
    p.id as pigeon_id,
    p.band_number,
    p.name as pigeon_name,
    COUNT(hc.id) as total_health_checks,
    MAX(hc.check_date) as last_check_date,
    AVG(hc.weight) as avg_weight,
    COUNT(v.id) as total_vaccinations,
    MAX(v.vaccination_date) as last_vaccination_date,
    COUNT(t.id) as total_treatments,
    COUNT(CASE WHEN t.status = 'ongoing' THEN 1 END) as ongoing_treatments,
    COUNT(hr.id) as pending_reminders
FROM pigeons p
LEFT JOIN health_checks hc ON p.id = hc.pigeon_id
LEFT JOIN vaccinations v ON p.id = v.pigeon_id
LEFT JOIN treatments t ON p.id = t.pigeon_id
LEFT JOIN health_reminders hr ON p.id = hr.pigeon_id AND hr.status = 'pending'
GROUP BY p.id, p.band_number, p.name;

CREATE VIEW IF NOT EXISTS vaccination_schedule AS
SELECT
    p.id as pigeon_id,
    p.band_number,
    p.name as pigeon_name,
    vt.name as vaccine_name,
    v.vaccination_date,
    v.next_due_date,
    CASE
        WHEN v.next_due_date < date('now') THEN 'overdue'
        WHEN v.next_due_date <= date('now', '+7 days') THEN 'due_soon'
        ELSE 'scheduled'
    END as status,
    DATEDIFF(v.next_due_date, date('now')) as days_until_due
FROM pigeons p
JOIN vaccinations v ON p.id = v.pigeon_id
JOIN vaccine_types vt ON v.vaccine_type_id = vt.id
WHERE v.next_due_date IS NOT NULL
ORDER BY v.next_due_date;

CREATE VIEW IF NOT EXISTS treatment_history AS
SELECT
    p.id as pigeon_id,
    p.band_number,
    p.name as pigeon_name,
    dt.name as disease_name,
    mt.name as medication_name,
    t.diagnosis_date,
    t.start_date,
    t.end_date,
    t.status,
    DATEDIFF(COALESCE(t.end_date, date('now')), t.start_date) as treatment_duration_days
FROM pigeons p
JOIN treatments t ON p.id = t.pigeon_id
LEFT JOIN disease_types dt ON t.disease_type_id = dt.id
LEFT JOIN medication_types mt ON t.medication_type_id = mt.id
ORDER BY t.diagnosis_date DESC;

-- Insert basic data for vaccine types
INSERT OR IGNORE INTO vaccine_types (id, name, description, recommended_age_days, frequency_days) VALUES
(1, 'Newcastle Disease', 'Newcastle disease vaccination', 30, 365),
(2, 'Paramyxovirus', 'Paramyxovirus (PMV) vaccination', 30, 365),
(3, 'Pox', 'Pox vaccination', 45, 730),
(4, 'Salmonella', 'Salmonella (Paratyphoid) vaccination', 60, 365),
(5, 'E. Coli', 'E. Coli vaccination', 90, 365),
(6, 'Herpes', 'Herpes vaccination', 120, 365),
(7, 'Influenza', 'Avian influenza vaccination', 180, 365),
(8, 'Trichomoniasis', 'Trichomoniasis prevention', 30, 180);

-- Insert basic data for disease types
INSERT OR IGNORE INTO disease_types (id, name, description, symptoms, treatment_recommendations) VALUES
(1, 'Respiratory Infection', 'Upper respiratory tract infection', 'Sneezing, nasal discharge, wheezing', 'Antibiotics, supportive care'),
(2, 'Coccidiosis', 'Parasitic infection of the intestinal tract', 'Diarrhea, weight loss, lethargy', 'Anticoccidial medication'),
(3, 'Worms', 'Intestinal parasites', 'Weight loss, poor condition', 'Deworming medication'),
(4, 'Canker', 'Trichomoniasis infection', 'Yellow patches in mouth/throat', 'Antiprotozoal medication'),
(5, 'Salmonellosis', 'Bacterial infection', 'Diarrhea, joint swelling, infertility', 'Antibiotics, supportive care'),
(6, 'E. Coli Infection', 'Bacterial infection', 'Diarrhea, respiratory symptoms', 'Antibiotics'),
(7, 'Pox', 'Viral infection', 'Skin lesions, scabs around eyes/beak', 'Supportive care, vaccination'),
(8, 'Mites/Lice', 'External parasites', 'Itching, feather damage', 'Anti-parasite treatment'),
(9, 'Injury', 'Physical injury', 'Visible wounds, limping', 'Wound care, antibiotics if needed'),
(10, 'Heat Stress', 'Heat-related illness', 'Panting, lethargy', 'Cooling, fluids, electrolytes');

-- Insert basic data for medication types
INSERT OR IGNORE INTO medication_types (id, name, description, dosage_form, standard_dosage, contraindications) VALUES
(1, 'Doxycycline', 'Broad-spectrum antibiotic', 'tablet', '10-20 mg/kg twice daily', 'Pregnant birds'),
(2, 'Enrofloxacin', 'Fluoroquinolone antibiotic', 'tablet', '10-15 mg/kg twice daily', 'Young birds < 4 weeks'),
(3, 'Amoxicillin', 'Penicillin antibiotic', 'tablet', '20 mg/kg twice daily', 'Penicillin allergy'),
(4, 'Metronidazole', 'Antiprotozoal medication', 'tablet', '25 mg/kg twice daily', 'Liver disease'),
(5, 'Ivermectin', 'Antiparasitic', 'liquid', '0.2 mg/kg orally', 'Very young birds'),
(6, 'Toltrazuril', 'Anticoccidial', 'liquid', '25 mg/kg once daily for 2 days', 'Egg-laying hens'),
(7, 'Vitamin B Complex', 'Vitamin supplement', 'liquid', '1-2 ml in drinking water', 'None'),
(8, 'Electrolytes', 'Rehydration solution', 'powder', '1-2 g/liter water', 'Severe kidney disease'),
(9, 'Probiotics', 'Digestive health supplement', 'powder', '1-2 g/kg feed', 'None'),
(10, 'Anti-inflammatory', 'NSAID for pain/inflammation', 'tablet', '5-10 mg/kg once daily', 'Kidney disease, ulcers');