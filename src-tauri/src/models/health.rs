use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate, NaiveDateTime};

// Health Check Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthCheck {
    pub id: Option<i64>,
    pub pigeon_id: i64,
    pub check_date: NaiveDate, // SQLx returns DATE as NaiveDate
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub condition: String,
    pub respiratory_rate: Option<i64>,
    pub heart_rate: Option<i64>,
    pub feathers_condition: Option<String>,
    pub eyes_condition: Option<String>,
    pub nose_condition: Option<String>,
    pub mouth_condition: Option<String>,
    pub crop_condition: Option<String>,
    pub vent_condition: Option<String>,
    pub feet_condition: Option<String>,
    pub notes: Option<String>,
    pub examiner: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns DATETIME as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckInput {
    pub pigeon_id: i64,
    pub check_date: NaiveDate,
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub condition: String,
    pub respiratory_rate: Option<i64>,
    pub heart_rate: Option<i64>,
    pub feathers_condition: Option<String>,
    pub eyes_condition: Option<String>,
    pub nose_condition: Option<String>,
    pub mouth_condition: Option<String>,
    pub crop_condition: Option<String>,
    pub vent_condition: Option<String>,
    pub feet_condition: Option<String>,
    pub notes: Option<String>,
    pub examiner: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckUpdate {
    pub id: i64,
    pub check_date: Option<NaiveDate>,
    pub weight: Option<f64>,
    pub temperature: Option<f64>,
    pub condition: Option<String>,
    pub respiratory_rate: Option<i64>,
    pub heart_rate: Option<i64>,
    pub feathers_condition: Option<String>,
    pub eyes_condition: Option<String>,
    pub nose_condition: Option<String>,
    pub mouth_condition: Option<String>,
    pub crop_condition: Option<String>,
    pub vent_condition: Option<String>,
    pub feet_condition: Option<String>,
    pub notes: Option<String>,
    pub examiner: Option<String>,
}

// Vaccine Type Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VaccineType {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub recommended_age_days: Option<i64>,
    pub frequency_days: Option<i64>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns datetime as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaccineTypeInput {
    pub name: String,
    pub description: Option<String>,
    pub recommended_age_days: Option<i64>,
    pub frequency_days: Option<i64>,
}

// Vaccination Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Vaccination {
    pub id: Option<i64>,
    pub pigeon_id: i64,
    pub vaccine_type_id: i64,
    pub vaccination_date: NaiveDate, // SQLx returns DATE as NaiveDate
    pub next_due_date: Option<NaiveDate>, // SQLx returns DATE as Option<NaiveDate>
    pub batch_number: Option<String>,
    pub manufacturer: Option<String>,
    pub veterinarian: Option<String>,
    pub dosage: Option<String>,
    pub administration_route: Option<String>,
    pub injection_site: Option<String>,
    pub adverse_reactions: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns DATETIME as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaccinationInput {
    pub pigeon_id: i64,
    pub vaccine_type_id: i64,
    pub vaccination_date: NaiveDate,
    pub next_due_date: Option<NaiveDate>,
    pub batch_number: Option<String>,
    pub manufacturer: Option<String>,
    pub veterinarian: Option<String>,
    pub dosage: Option<String>,
    pub administration_route: Option<String>,
    pub injection_site: Option<String>,
    pub adverse_reactions: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaccinationUpdate {
    pub id: i64,
    pub vaccination_date: Option<String>,
    pub next_due_date: Option<String>,
    pub batch_number: Option<String>,
    pub manufacturer: Option<String>,
    pub veterinarian: Option<String>,
    pub dosage: Option<String>,
    pub administration_route: Option<String>,
    pub injection_site: Option<String>,
    pub adverse_reactions: Option<String>,
    pub notes: Option<String>,
}

// Disease Type Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DiseaseType {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub symptoms: Option<String>,
    pub treatment_recommendations: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns datetime as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiseaseTypeInput {
    pub name: String,
    pub description: Option<String>,
    pub symptoms: Option<String>,
    pub treatment_recommendations: Option<String>,
}

// Medication Type Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MedicationType {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub dosage_form: Option<String>,
    pub standard_dosage: Option<String>,
    pub contraindications: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns datetime as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MedicationTypeInput {
    pub name: String,
    pub description: Option<String>,
    pub dosage_form: Option<String>,
    pub standard_dosage: Option<String>,
    pub contraindications: Option<String>,
}

// Treatment Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Treatment {
    pub id: Option<i64>,
    pub pigeon_id: i64,
    pub disease_type_id: Option<i64>,
    pub medication_type_id: Option<i64>,
    pub diagnosis_date: NaiveDate, // SQLx returns DATE as NaiveDate
    pub start_date: NaiveDate, // SQLx returns DATE as NaiveDate
    pub end_date: Option<NaiveDate>, // SQLx returns DATE as Option<NaiveDate>
    pub status: String,
    pub symptoms: Option<String>,
    pub diagnosis: Option<String>,
    pub medication_name: Option<String>,
    pub dosage: Option<String>,
    pub frequency: Option<String>,
    pub administration_route: Option<String>,
    pub duration_days: Option<i64>,
    pub response_to_treatment: Option<String>,
    pub side_effects: Option<String>,
    pub follow_up_required: bool,
    pub follow_up_date: Option<NaiveDate>, // SQLx returns DATE as Option<NaiveDate>
    pub veterinarian: Option<String>,
    pub cost: Option<f64>,
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns DATETIME as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreatmentInput {
    pub pigeon_id: i64,
    pub disease_type_id: Option<i64>,
    pub medication_type_id: Option<i64>,
    pub diagnosis_date: NaiveDate,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
    pub status: String,
    pub symptoms: Option<String>,
    pub diagnosis: Option<String>,
    pub medication_name: Option<String>,
    pub dosage: Option<String>,
    pub frequency: Option<String>,
    pub administration_route: Option<String>,
    pub duration_days: Option<i64>,
    pub response_to_treatment: Option<String>,
    pub side_effects: Option<String>,
    pub follow_up_required: bool,
    pub follow_up_date: Option<NaiveDate>,
    pub veterinarian: Option<String>,
    pub cost: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreatmentUpdate {
    pub id: i64,
    pub diagnosis_date: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: Option<String>,
    pub symptoms: Option<String>,
    pub diagnosis: Option<String>,
    pub medication_name: Option<String>,
    pub dosage: Option<String>,
    pub frequency: Option<String>,
    pub administration_route: Option<String>,
    pub duration_days: Option<i64>,
    pub response_to_treatment: Option<String>,
    pub side_effects: Option<String>,
    pub follow_up_required: bool,
    pub follow_up_date: Option<NaiveDate>,
    pub veterinarian: Option<String>,
    pub cost: Option<f64>,
    pub notes: Option<String>,
}

// Health Reminder Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthReminder {
    pub id: Option<i64>,
    pub pigeon_id: i64,
    pub reminder_type: String,
    pub title: String,
    pub description: Option<String>,
    pub due_date: String, // SQLx returns date as string
    pub due_time: Option<String>, // SQLx returns time as string
    pub priority: String,
    pub status: String,
    pub is_recurring: bool,
    pub recurrence_pattern: Option<String>,
    pub recurrence_interval: i32,
    pub recurrence_end_date: Option<String>, // SQLx returns date as string
    pub notification_sent: bool,
    pub completed_at: Option<String>, // SQLx returns datetime as string
    pub notes: Option<String>,
    pub created_at: Option<NaiveDateTime>, // SQLx returns datetime as NaiveDateTime
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReminderInput {
    pub pigeon_id: i64,
    pub reminder_type: String,
    pub title: String,
    pub description: Option<String>,
    pub due_date: String,
    pub due_time: Option<String>,
    pub priority: String,
    pub is_recurring: bool,
    pub recurrence_pattern: Option<String>,
    pub recurrence_interval: i32,
    pub recurrence_end_date: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReminderUpdate {
    pub id: i64,
    pub reminder_type: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub due_time: Option<String>,
    pub priority: Option<String>,
    pub status: Option<String>,
    pub is_recurring: bool,
    pub recurrence_pattern: Option<String>,
    pub recurrence_interval: i32,
    pub recurrence_end_date: Option<String>,
    pub notification_sent: bool,
    pub completed_at: Option<String>,
    pub notes: Option<String>,
}

// Statistics and Report Models
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthStatistics {
    pub pigeon_id: i64,
    pub ring_number: String,
    pub pigeon_name: Option<String>,
    pub total_health_checks: i32,
    pub last_check_date: Option<String>, // SQLx returns date as string
    pub avg_weight: Option<f64>,
    pub total_vaccinations: i32,
    pub last_vaccination_date: Option<String>, // SQLx returns date as string
    pub total_treatments: i32,
    pub ongoing_treatments: i32,
    pub pending_reminders: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VaccinationSchedule {
    pub pigeon_id: i64,
    pub ring_number: String,
    pub pigeon_name: Option<String>,
    pub vaccine_name: String,
    pub vaccination_date: Option<String>, // SQLx returns date as string, can be NULL
    pub next_due_date: Option<String>, // SQLx returns date as string, can be NULL
    pub status: String,
    pub days_until_due: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TreatmentHistory {
    pub pigeon_id: i64,
    pub ring_number: String,
    pub pigeon_name: Option<String>,
    pub disease_name: Option<String>,
    pub medication_name: Option<String>,
    pub diagnosis_date: Option<String>, // SQLx returns date as string, can be NULL
    pub start_date: Option<String>, // SQLx returns date as string, can be NULL
    pub end_date: Option<String>, // SQLx returns date as string
    pub status: String,
    pub treatment_duration_days: i32,
}

// Health Summary for Dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthSummary {
    pub total_pigeons: i32,
    pub healthy_pigeons: i32,
    pub sick_pigeons: i32,
    pub vaccinations_due_this_week: i32,
    pub overdue_vaccinations: i32,
    pub ongoing_treatments: i32,
    pub pending_reminders: i32,
    pub recent_health_checks: i32,
}

// Health Condition Enum for validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthCondition {
    Excellent,
    Good,
    Fair,
    Poor,
}

impl HealthCondition {
    pub fn as_str(&self) -> &'static str {
        match self {
            HealthCondition::Excellent => "excellent",
            HealthCondition::Good => "good",
            HealthCondition::Fair => "fair",
            HealthCondition::Poor => "poor",
        }
    }
}

// Treatment Status Enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TreatmentStatus {
    Ongoing,
    Completed,
    Discontinued,
}

impl TreatmentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TreatmentStatus::Ongoing => "ongoing",
            TreatmentStatus::Completed => "completed",
            TreatmentStatus::Discontinued => "discontinued",
        }
    }
}

// Reminder Status Enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReminderStatus {
    Pending,
    Completed,
    Dismissed,
    Postponed,
}

impl ReminderStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReminderStatus::Pending => "pending",
            ReminderStatus::Completed => "completed",
            ReminderStatus::Dismissed => "dismissed",
            ReminderStatus::Postponed => "postponed",
        }
    }
}

// Reminder Priority Enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReminderPriority {
    Low,
    Medium,
    High,
}

impl ReminderPriority {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReminderPriority::Low => "low",
            ReminderPriority::Medium => "medium",
            ReminderPriority::High => "high",
        }
    }
}

// Reminder Type Enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReminderType {
    Vaccination,
    HealthCheck,
    TreatmentFollowUp,
    General,
}

impl ReminderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReminderType::Vaccination => "vaccination",
            ReminderType::HealthCheck => "health_check",
            ReminderType::TreatmentFollowUp => "treatment_followup",
            ReminderType::General => "general",
        }
    }
}