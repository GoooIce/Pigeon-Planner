use crate::models::health::*;
use crate::database::Database;
use anyhow::Result;
use chrono::{NaiveDate, NaiveTime, Utc};
use tauri::State;

// Health Check Commands
#[tauri::command]
pub async fn create_health_check(
    check_input: HealthCheckInput,
    db: State<'_, Database>,
) -> Result<HealthCheck, String> {
    let pool = &db.pool;

    let now = Utc::now().to_rfc3339();

    let health_check = sqlx::query_as!(
        HealthCheck,
        r#"
        INSERT INTO health_checks (
            pigeon_id, check_date, weight, temperature, condition,
            respiratory_rate, heart_rate, feathers_condition, eyes_condition,
            nose_condition, mouth_condition, crop_condition, vent_condition,
            feet_condition, notes, examiner, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
        RETURNING
            id as "id: i64",
            pigeon_id as "pigeon_id: i64",
            check_date as "check_date!",
            weight,
            temperature,
            condition as "condition!: String",
            respiratory_rate,
            heart_rate,
            feathers_condition,
            eyes_condition,
            nose_condition,
            mouth_condition,
            crop_condition,
            vent_condition,
            feet_condition,
            notes,
            examiner,
            created_at,
            updated_at
        "#,
        check_input.pigeon_id,
        check_input.check_date,
        check_input.weight,
        check_input.temperature,
        check_input.condition,
        check_input.respiratory_rate,
        check_input.heart_rate,
        check_input.feathers_condition,
        check_input.eyes_condition,
        check_input.nose_condition,
        check_input.mouth_condition,
        check_input.crop_condition,
        check_input.vent_condition,
        check_input.feet_condition,
        check_input.notes,
        check_input.examiner,
        now,
        now
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to create health check: {}", e))?;

    Ok(health_check)
}

#[tauri::command]
pub async fn get_health_checks(
    pigeon_id: i32,
    limit: Option<i64>,
    offset: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<HealthCheck>, String> {
    let pool = &db.pool;
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let pid = pigeon_id as i32;
    let lim = limit as i32;
    let off = offset as i32;

    let checks = sqlx::query_as!(
        HealthCheck,
        r#"
        SELECT
            id as "id: i64",
            pigeon_id as "pigeon_id: i64",
            check_date as "check_date!",
            weight,
            temperature,
            condition as "condition!: String",
            respiratory_rate,
            heart_rate,
            feathers_condition,
            eyes_condition,
            nose_condition,
            mouth_condition,
            crop_condition,
            vent_condition,
            feet_condition,
            notes,
            examiner,
            created_at,
            updated_at
        FROM health_checks
        WHERE pigeon_id = ?
        ORDER BY check_date DESC, created_at DESC
        LIMIT ? OFFSET ?
        "#,
        pid,
        lim,
        off
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch health checks: {}", e))?;

    Ok(checks)
}

#[tauri::command]
pub async fn get_health_check_by_id(
    id: i64,
    db: State<'_, Database>,
) -> Result<Option<HealthCheck>, String> {
    let pool = &db.pool;

    let check = sqlx::query_as!(
        HealthCheck,
        r#"
        SELECT
            id, pigeon_id, check_date, weight, temperature, condition,
            respiratory_rate, heart_rate, feathers_condition, eyes_condition,
            nose_condition, mouth_condition, crop_condition, vent_condition,
            feet_condition, notes, examiner, created_at, updated_at
        FROM health_checks
        WHERE id = ?
        "#,
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to fetch health check: {}", e))?;

    Ok(check)
}

#[tauri::command]
pub async fn update_health_check(
    update: HealthCheckUpdate,
    db: State<'_, Database>,
) -> Result<HealthCheck, String> {
    let pool = &db.pool;
    let now = Utc::now().to_rfc3339();

    // For simplicity, use a static update with COALESCE for all fields
    let health_check = sqlx::query_as!(
        HealthCheck,
        r#"
        UPDATE health_checks
        SET
            check_date = COALESCE(?1, check_date),
            weight = COALESCE(?2, weight),
            temperature = COALESCE(?3, temperature),
            condition = COALESCE(?4, condition),
            respiratory_rate = COALESCE(?5, respiratory_rate),
            heart_rate = COALESCE(?6, heart_rate),
            feathers_condition = COALESCE(?7, feathers_condition),
            eyes_condition = COALESCE(?8, eyes_condition),
            nose_condition = COALESCE(?9, nose_condition),
            mouth_condition = COALESCE(?10, mouth_condition),
            crop_condition = COALESCE(?11, crop_condition),
            vent_condition = COALESCE(?12, vent_condition),
            feet_condition = COALESCE(?13, feet_condition),
            notes = COALESCE(?14, notes),
            examiner = COALESCE(?15, examiner),
            updated_at = ?16
        WHERE id = ?17
        RETURNING
            id, pigeon_id, check_date, weight, temperature, condition,
            respiratory_rate, heart_rate, feathers_condition, eyes_condition,
            nose_condition, mouth_condition, crop_condition, vent_condition,
            feet_condition, notes, examiner, created_at, updated_at
        "#,
        update.check_date,
        update.weight,
        update.temperature,
        update.condition,
        update.respiratory_rate,
        update.heart_rate,
        update.feathers_condition,
        update.eyes_condition,
        update.nose_condition,
        update.mouth_condition,
        update.crop_condition,
        update.vent_condition,
        update.feet_condition,
        update.notes,
        update.examiner,
        now,
        update.id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to update health check: {}", e))?;

    Ok(health_check)
}

#[tauri::command]
pub async fn delete_health_check(
    id: i64,
    db: State<'_, Database>,
) -> Result<(), String> {
    let pool = &db.pool;

    let result = sqlx::query!(
        "DELETE FROM health_checks WHERE id = ?",
        id
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete health check: {}", e))?;

    if result.rows_affected() == 0 {
        return Err("Health check not found".to_string());
    }

    Ok(())
}

// Vaccination Commands
#[tauri::command]
pub async fn create_vaccination(
    vaccination_input: VaccinationInput,
    db: State<'_, Database>,
) -> Result<Vaccination, String> {
    let pool = &db.pool;
    let now = Utc::now().to_rfc3339();

    let vaccination = sqlx::query_as!(
        Vaccination,
        r#"
        INSERT INTO vaccinations (
            pigeon_id, vaccine_type_id, vaccination_date, next_due_date,
            batch_number, manufacturer, veterinarian, dosage, administration_route,
            injection_site, adverse_reactions, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING
            id, pigeon_id, vaccine_type_id, vaccination_date, next_due_date,
            batch_number, manufacturer, veterinarian, dosage, administration_route,
            injection_site, adverse_reactions, notes, created_at, updated_at
        "#,
        vaccination_input.pigeon_id,
        vaccination_input.vaccine_type_id,
        vaccination_input.vaccination_date,
        vaccination_input.next_due_date,
        vaccination_input.batch_number,
        vaccination_input.manufacturer,
        vaccination_input.veterinarian,
        vaccination_input.dosage,
        vaccination_input.administration_route,
        vaccination_input.injection_site,
        vaccination_input.adverse_reactions,
        vaccination_input.notes,
        now,
        now
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to create vaccination: {}", e))?;

    Ok(vaccination)
}

#[tauri::command]
pub async fn get_vaccinations(
    pigeon_id: i32,
    limit: Option<i64>,
    offset: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<Vaccination>, String> {
    let pool = &db.pool;
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let vaccinations = sqlx::query_as!(
        Vaccination,
        r#"
        SELECT
            id, pigeon_id, vaccine_type_id, vaccination_date, next_due_date,
            batch_number, manufacturer, veterinarian, dosage, administration_route,
            injection_site, adverse_reactions, notes, created_at, updated_at
        FROM vaccinations
        WHERE pigeon_id = ?
        ORDER BY vaccination_date DESC, created_at DESC
        LIMIT ? OFFSET ?
        "#,
        pigeon_id,
        limit,
        offset
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch vaccinations: {}", e))?;

    Ok(vaccinations)
}

#[tauri::command]
pub async fn get_vaccination_schedule(
    pigeon_id: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<VaccinationSchedule>, String> {
    let pool = &db.pool;

    let schedule = if let Some(pid) = pigeon_id {
        sqlx::query_as!(
            VaccinationSchedule,
            r#"
            SELECT
                v.pigeon_id as "pigeon_id!: i64",
                p.ring_number as "ring_number: String",
                p.name as "pigeon_name: Option<String>",
                vt.name as "vaccine_name!: String",
                v.vaccination_date as "vaccination_date: Option<String>",
                v.next_due_date as "next_due_date: Option<String>",
                CASE
                    WHEN v.next_due_date < date('now') THEN 'overdue'
                    WHEN v.next_due_date <= date('now', '+7 days') THEN 'due_soon'
                    ELSE 'scheduled'
                END as "status: String",
                (julianday(IFNULL(v.next_due_date, date('now', '+1 year'))) - julianday(date('now'))) as "days_until_due!: i32"
            FROM vaccinations v
            LEFT JOIN pigeons p ON v.pigeon_id = p.id
            LEFT JOIN vaccine_types vt ON v.vaccine_type_id = vt.id
            WHERE v.pigeon_id = ?
            ORDER BY v.next_due_date
            "#,
            pid
        )
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as!(
            VaccinationSchedule,
            r#"
            SELECT
                v.pigeon_id as "pigeon_id!: i64",
                p.ring_number as "ring_number: String",
                p.name as "pigeon_name: Option<String>",
                vt.name as "vaccine_name!: String",
                v.vaccination_date as "vaccination_date: Option<String>",
                v.next_due_date as "next_due_date: Option<String>",
                CASE
                    WHEN v.next_due_date < date('now') THEN 'overdue'
                    WHEN v.next_due_date <= date('now', '+7 days') THEN 'due_soon'
                    ELSE 'scheduled'
                END as "status: String",
                (julianday(IFNULL(v.next_due_date, date('now', '+1 year'))) - julianday(date('now'))) as "days_until_due!: i32"
            FROM vaccinations v
            LEFT JOIN pigeons p ON v.pigeon_id = p.id
            LEFT JOIN vaccine_types vt ON v.vaccine_type_id = vt.id
            ORDER BY v.next_due_date
            "#
        )
        .fetch_all(pool)
        .await
    };

    Ok(schedule.map_err(|e| format!("Failed to fetch vaccination schedule: {}", e))?)
}

// Treatment Commands
#[tauri::command]
pub async fn create_treatment(
    treatment_input: TreatmentInput,
    db: State<'_, Database>,
) -> Result<Treatment, String> {
    let pool = &db.pool;
    let now = Utc::now().to_rfc3339();

    let treatment = sqlx::query_as!(
        Treatment,
        r#"
        INSERT INTO treatments (
            pigeon_id, disease_type_id, medication_type_id, diagnosis_date,
            start_date, end_date, status, symptoms, diagnosis, medication_name,
            dosage, frequency, administration_route, duration_days,
            response_to_treatment, side_effects, follow_up_required,
            follow_up_date, veterinarian, cost, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING
            id, pigeon_id, disease_type_id, medication_type_id, diagnosis_date,
            start_date, end_date, status, symptoms, diagnosis, medication_name,
            dosage, frequency, administration_route, duration_days,
            response_to_treatment, side_effects, follow_up_required,
            follow_up_date, veterinarian, cost, notes, created_at, updated_at
        "#,
        treatment_input.pigeon_id,
        treatment_input.disease_type_id,
        treatment_input.medication_type_id,
        treatment_input.diagnosis_date,
        treatment_input.start_date,
        treatment_input.end_date,
        treatment_input.status,
        treatment_input.symptoms,
        treatment_input.diagnosis,
        treatment_input.medication_name,
        treatment_input.dosage,
        treatment_input.frequency,
        treatment_input.administration_route,
        treatment_input.duration_days,
        treatment_input.response_to_treatment,
        treatment_input.side_effects,
        treatment_input.follow_up_required,
        treatment_input.follow_up_date,
        treatment_input.veterinarian,
        treatment_input.cost,
        treatment_input.notes,
        now,
        now
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to create treatment: {}", e))?;

    Ok(treatment)
}

#[tauri::command]
pub async fn get_treatments(
    pigeon_id: i32,
    status: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<Treatment>, String> {
    let pool = &db.pool;
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    let treatments = if let Some(s) = status {
        sqlx::query_as!(
            Treatment,
            r#"
            SELECT
                id, pigeon_id, disease_type_id, medication_type_id, diagnosis_date,
                start_date, end_date, status, symptoms, diagnosis, medication_name,
                dosage, frequency, administration_route, duration_days,
                response_to_treatment, side_effects, follow_up_required,
                follow_up_date, veterinarian, cost, notes, created_at, updated_at
            FROM treatments
            WHERE pigeon_id = ? AND status = ?
            ORDER BY diagnosis_date DESC, created_at DESC
            LIMIT ? OFFSET ?
            "#,
            pigeon_id,
            s,
            limit,
            offset
        )
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as!(
            Treatment,
            r#"
            SELECT
                id, pigeon_id, disease_type_id, medication_type_id, diagnosis_date,
                start_date, end_date, status, symptoms, diagnosis, medication_name,
                dosage, frequency, administration_route, duration_days,
                response_to_treatment, side_effects, follow_up_required,
                follow_up_date, veterinarian, cost, notes, created_at, updated_at
            FROM treatments
            WHERE pigeon_id = ?
            ORDER BY diagnosis_date DESC, created_at DESC
            LIMIT ? OFFSET ?
            "#,
            pigeon_id,
            limit,
            offset
        )
        .fetch_all(pool)
        .await
    };

    Ok(treatments.map_err(|e| format!("Failed to fetch treatments: {}", e))?)
}

#[tauri::command]
pub async fn get_treatment_history(
    pigeon_id: i32,
    db: State<'_, Database>,
) -> Result<Vec<TreatmentHistory>, String> {
    let pool = &db.pool;

    let history = sqlx::query_as!(
        TreatmentHistory,
        r#"
        SELECT
            t.pigeon_id as "pigeon_id!: i64",
            p.ring_number as "ring_number: String",
            p.name as "pigeon_name: Option<String>",
            dt.name as "disease_name: Option<String>",
            t.medication_name,
            t.diagnosis_date as "diagnosis_date: Option<String>",
            t.start_date as "start_date: Option<String>",
            COALESCE(t.end_date, '') as "end_date",
            t.status as "status!: String",
            COALESCE((julianday(IFNULL(t.end_date, date('now'))) - julianday(t.start_date)), 0) as "treatment_duration_days!: i32"
        FROM treatments t
        LEFT JOIN pigeons p ON t.pigeon_id = p.id
        LEFT JOIN disease_types dt ON t.disease_type_id = dt.id
        WHERE t.pigeon_id = ?
        ORDER BY t.diagnosis_date DESC
        "#,
        pigeon_id
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch treatment history: {}", e))?;

    Ok(history)
}

// Statistics Commands
#[tauri::command]
pub async fn get_health_statistics(
    pigeon_id: Option<i64>,
    db: State<'_, Database>,
) -> Result<Vec<HealthStatistics>, String> {
    let pool = &db.pool;

    let stats = if let Some(pid) = pigeon_id {
        sqlx::query_as!(
            HealthStatistics,
            r#"
            SELECT
                p.id as "pigeon_id!: i64",
                p.ring_number as "ring_number: String",
                p.name as "pigeon_name: Option<String>",
                COUNT(DISTINCT hc.id) as "total_health_checks!: i32",
                MAX(hc.check_date) as "last_check_date: Option<String>",
                AVG(hc.weight) as "avg_weight: Option<f64>",
                COUNT(DISTINCT v.id) as "total_vaccinations!: i32",
                MAX(v.vaccination_date) as "last_vaccination_date: Option<String>",
                COUNT(DISTINCT t.id) as "total_treatments!: i32",
                COUNT(DISTINCT CASE WHEN t.status = 'ongoing' THEN t.id END) as "ongoing_treatments!: i32",
                COUNT(DISTINCT hr.id) as "pending_reminders!: i32"
            FROM pigeons p
            LEFT JOIN health_checks hc ON p.id = hc.pigeon_id
            LEFT JOIN vaccinations v ON p.id = v.pigeon_id
            LEFT JOIN treatments t ON p.id = t.pigeon_id
            LEFT JOIN health_reminders hr ON p.id = hr.pigeon_id AND hr.status = 'pending'
            WHERE p.id = ?
            GROUP BY p.id, p.ring_number, p.name
            "#,
            pid
        )
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as!(
            HealthStatistics,
            r#"
            SELECT
                p.id as "pigeon_id!: i64",
                p.ring_number as "ring_number: String",
                p.name as "pigeon_name: Option<String>",
                COUNT(DISTINCT hc.id) as "total_health_checks!: i32",
                MAX(hc.check_date) as "last_check_date: Option<String>",
                AVG(hc.weight) as "avg_weight: Option<f64>",
                COUNT(DISTINCT v.id) as "total_vaccinations!: i32",
                MAX(v.vaccination_date) as "last_vaccination_date: Option<String>",
                COUNT(DISTINCT t.id) as "total_treatments!: i32",
                COUNT(DISTINCT CASE WHEN t.status = 'ongoing' THEN t.id END) as "ongoing_treatments!: i32",
                COUNT(DISTINCT hr.id) as "pending_reminders!: i32"
            FROM pigeons p
            LEFT JOIN health_checks hc ON p.id = hc.pigeon_id
            LEFT JOIN vaccinations v ON p.id = v.pigeon_id
            LEFT JOIN treatments t ON p.id = t.pigeon_id
            LEFT JOIN health_reminders hr ON p.id = hr.pigeon_id AND hr.status = 'pending'
            GROUP BY p.id, p.ring_number, p.name
            "#
        )
        .fetch_all(pool)
        .await
    };

    Ok(stats.map_err(|e| format!("Failed to fetch health statistics: {}", e))?)
}

#[tauri::command]
pub async fn get_health_summary(
    db: State<'_, Database>,
) -> Result<HealthSummary, String> {
    let pool = &db.pool;

    let summary = sqlx::query!(
        r#"
        SELECT
            COUNT(DISTINCT p.id) as total_pigeons,
            COUNT(DISTINCT CASE WHEN hc.condition IN ('excellent', 'good') THEN p.id END) as healthy_pigeons,
            COUNT(DISTINCT CASE WHEN hc.condition IN ('fair', 'poor') THEN p.id END) as sick_pigeons,
            COUNT(DISTINCT CASE WHEN v.next_due_date <= date('now', '+7 days') THEN p.id END) as vaccinations_due_this_week,
            COUNT(DISTINCT CASE WHEN v.next_due_date < date('now') THEN p.id END) as overdue_vaccinations,
            COUNT(DISTINCT CASE WHEN t.status = 'ongoing' THEN p.id END) as ongoing_treatments,
            COUNT(DISTINCT CASE WHEN hr.status = 'pending' AND hr.due_date <= date('now') THEN p.id END) as pending_reminders,
            COUNT(DISTINCT CASE WHEN hc.check_date >= date('now', '-7 days') THEN p.id END) as recent_health_checks
        FROM pigeons p
        LEFT JOIN health_checks hc ON p.id = hc.pigeon_id
        LEFT JOIN vaccinations v ON p.id = v.pigeon_id AND v.next_due_date IS NOT NULL
        LEFT JOIN treatments t ON p.id = t.pigeon_id
        LEFT JOIN health_reminders hr ON p.id = hr.pigeon_id
        "#
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to fetch health summary: {}", e))?;

    Ok(HealthSummary {
        total_pigeons: summary.total_pigeons,
        healthy_pigeons: summary.healthy_pigeons,
        sick_pigeons: summary.sick_pigeons,
        vaccinations_due_this_week: summary.vaccinations_due_this_week,
        overdue_vaccinations: summary.overdue_vaccinations,
        ongoing_treatments: summary.ongoing_treatments,
        pending_reminders: summary.pending_reminders,
        recent_health_checks: summary.recent_health_checks,
    })
}

// Vaccine Type Commands
#[tauri::command]
pub async fn get_vaccine_types(
    db: State<'_, Database>,
) -> Result<Vec<VaccineType>, String> {
    let pool = &db.pool;

    let types = sqlx::query_as!(
        VaccineType,
        r#"
        SELECT
            id, name, description, recommended_age_days, frequency_days,
            created_at, updated_at
        FROM vaccine_types
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch vaccine types: {}", e))?;

    Ok(types)
}

// Disease Type Commands
#[tauri::command]
pub async fn get_disease_types(
    db: State<'_, Database>,
) -> Result<Vec<DiseaseType>, String> {
    let pool = &db.pool;

    let types = sqlx::query_as!(
        DiseaseType,
        r#"
        SELECT
            id, name, description, symptoms, treatment_recommendations,
            created_at, updated_at
        FROM disease_types
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch disease types: {}", e))?;

    Ok(types)
}

// Medication Type Commands
#[tauri::command]
pub async fn get_medication_types(
    db: State<'_, Database>,
) -> Result<Vec<MedicationType>, String> {
    let pool = &db.pool;

    let types = sqlx::query_as!(
        MedicationType,
        r#"
        SELECT
            id, name, description, dosage_form, standard_dosage, contraindications,
            created_at, updated_at
        FROM medication_types
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch medication types: {}", e))?;

    Ok(types)
}