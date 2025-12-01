-- 比赛管理功能数据库迁移
-- 版本: 004
-- 日期: 2025-11-29
-- 描述: 添加比赛管理、比赛结果和比赛统计功能

-- 1. 创建比赛信息表
CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_name TEXT NOT NULL,
    race_date DATE NOT NULL,
    distance_km REAL NOT NULL, -- 比赛距离（公里）
    release_point TEXT, -- 放飞地点
    release_time DATETIME, -- 放飞时间
    weather_condition TEXT, -- 天气条件
    wind_speed REAL, -- 风速（公里/小时）
    wind_direction TEXT, -- 风向
    temperature REAL, -- 温度（摄氏度）
    category TEXT NOT NULL CHECK(category IN ('sprint', 'middle', 'long', 'marathon')), -- 比赛类别
    status TEXT NOT NULL CHECK(status IN ('scheduled', 'ongoing', 'completed', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建比赛参与表 (注册参赛的鸽子)
CREATE TABLE IF NOT EXISTS race_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    pigeon_id INTEGER NOT NULL,
    basket_number TEXT, -- 集装笼编号
    registration_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK(status IN ('registered', 'scratched', 'no_show', 'flying')) DEFAULT 'registered',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    UNIQUE(race_id, pigeon_id) -- 防止重复注册
);

-- 3. 创建比赛结果表
CREATE TABLE IF NOT EXISTS race_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    pigeon_id INTEGER NOT NULL,
    arrival_time DATETIME NOT NULL,
    arrival_speed REAL, -- 到达速度（米/秒）
    flight_duration_seconds INTEGER, -- 飞行时长（秒）
    distance_flown_km REAL, -- 实际飞行距离（公里）
    rank_position INTEGER, -- 排名
    points REAL, -- 积分
    prize_won REAL, -- 奖金
    disqualification_reason TEXT, -- 取消资格原因
    status TEXT NOT NULL CHECK(status IN ('finished', 'disqualified', 'lost', 'withdrawn')) DEFAULT 'finished',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (pigeon_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    UNIQUE(race_id, pigeon_id) -- 每个鸽子在每个比赛中只能有一个结果
);

-- 4. 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_races_date ON races(race_date);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_races_category ON races(category);
CREATE INDEX IF NOT EXISTS idx_races_name ON races(race_name);

CREATE INDEX IF NOT EXISTS idx_race_participants_race_id ON race_participants(race_id);
CREATE INDEX IF NOT EXISTS idx_race_participants_pigeon_id ON race_participants(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_race_participants_status ON race_participants(status);

CREATE INDEX IF NOT EXISTS idx_race_results_race_id ON race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_pigeon_id ON race_results(pigeon_id);
CREATE INDEX IF NOT EXISTS idx_race_results_arrival_time ON race_results(arrival_time);
CREATE INDEX IF NOT EXISTS idx_race_results_rank_position ON race_results(rank_position);
CREATE INDEX IF NOT EXISTS idx_race_results_status ON race_results(status);

-- 5. 创建比赛统计视图
CREATE VIEW IF NOT EXISTS race_statistics AS
SELECT
    r.id as race_id,
    r.race_name,
    r.race_date,
    r.distance_km,
    r.category,
    r.status as race_status,
    COUNT(DISTINCT rp.id) as total_participants,
    COUNT(DISTINCT rr.id) as total_finishers,
    COUNT(DISTINCT CASE WHEN rr.status = 'finished' THEN rr.id END) as finished_count,
    COUNT(DISTINCT CASE WHEN rr.status = 'disqualified' THEN rr.id END) as disqualified_count,
    COUNT(DISTINCT CASE WHEN rr.status = 'lost' THEN rr.id END) as lost_count,
    CASE
        WHEN COUNT(DISTINCT rp.id) > 0
        THEN ROUND(COUNT(DISTINCT rr.id) * 100.0 / COUNT(DISTINCT rp.id), 2)
        ELSE 0
    END as completion_rate_percent,
    CASE
        WHEN COUNT(DISTINCT rr.id) > 0
        THEN ROUND(AVG(rr.arrival_speed), 2)
        ELSE NULL
    END as average_speed_mps,
    CASE
        WHEN COUNT(DISTINCT rr.id) > 0
        THEN ROUND(AVG(rr.flight_duration_seconds), 0)
        ELSE NULL
    END as average_flight_duration_seconds,
    MIN(rr.arrival_time) as first_arrival_time,
    MAX(rr.arrival_time) as last_arrival_time,
    CASE
        WHEN MIN(rr.arrival_time) IS NOT NULL AND MAX(rr.arrival_time) IS NOT NULL
        THEN (julianday(MAX(rr.arrival_time)) - julianday(MIN(rr.arrival_time))) * 86400
        ELSE NULL
    END as time_span_seconds
FROM races r
LEFT JOIN race_participants rp ON r.id = rp.race_id AND rp.status IN ('registered', 'flying')
LEFT JOIN race_results rr ON r.id = rr.race_id
GROUP BY r.id
ORDER BY r.race_date DESC;

-- 6. 创建鸽子比赛历史视图
CREATE VIEW IF NOT EXISTS pigeon_race_history AS
SELECT
    p.id as pigeon_id,
    p.ring_number,
    p.name as pigeon_name,
    p.sex,
    p.color,
    COUNT(DISTINCT rp.race_id) as total_races_participated,
    COUNT(DISTINCT rr.id) as total_races_finished,
    COUNT(DISTINCT CASE WHEN rr.status = 'finished' AND rr.rank_position <= 10 THEN rr.id END) as top_10_finishes,
    COUNT(DISTINCT CASE WHEN rr.status = 'finished' AND rr.rank_position = 1 THEN rr.id END) as first_place_finishes,
    COUNT(DISTINCT CASE WHEN rr.status = 'finished' AND rr.rank_position = 2 THEN rr.id END) as second_place_finishes,
    COUNT(DISTINCT CASE WHEN rr.status = 'finished' AND rr.rank_position = 3 THEN rr.id END) as third_place_finishes,
    COALESCE(SUM(rr.points), 0) as total_points,
    COALESCE(SUM(rr.prize_won), 0) as total_prize_won,
    CASE
        WHEN COUNT(DISTINCT rr.id) > 0
        THEN ROUND(AVG(CASE WHEN rr.status = 'finished' THEN rr.rank_position END), 2)
        ELSE NULL
    END as average_rank,
    CASE
        WHEN COUNT(DISTINCT rr.id) > 0
        THEN ROUND(AVG(CASE WHEN rr.status = 'finished' THEN rr.arrival_speed END), 2)
        ELSE NULL
    END as average_speed_mps,
    MAX(rr.arrival_time) as last_race_time
FROM pigeons p
LEFT JOIN race_participants rp ON p.id = rp.pigeon_id AND rp.status IN ('registered', 'flying')
LEFT JOIN race_results rr ON p.id = rr.pigeon_id
GROUP BY p.id
ORDER BY total_points DESC, average_rank ASC;

-- 7. 创建鸽舍比赛统计视图
CREATE VIEW IF NOT EXISTS loft_race_statistics AS
SELECT
    l.id as loft_id,
    l.name as loft_name,
    COUNT(DISTINCT p.id) as total_pigeons,
    COUNT(DISTINCT rp.pigeon_id) as racing_pigeons,
    COUNT(DISTINCT rp.race_id) as total_race_entries,
    COUNT(DISTINCT rr.id) as total_finishes,
    COUNT(DISTINCT CASE WHEN rr.rank_position = 1 THEN rr.id END) as total_wins,
    COUNT(DISTINCT CASE WHEN rr.rank_position <= 3 THEN rr.id END) as total_podium_finishes,
    COUNT(DISTINCT CASE WHEN rr.rank_position <= 10 THEN rr.id END) as total_top_10_finishes,
    COALESCE(SUM(rr.points), 0) as total_points,
    COALESCE(SUM(rr.prize_won), 0) as total_prize_won,
    CASE
        WHEN COUNT(DISTINCT rr.id) > 0
        THEN ROUND(COUNT(DISTINCT CASE WHEN rr.rank_position = 1 THEN rr.id END) * 100.0 / COUNT(DISTINCT rr.id), 2)
        ELSE 0
    END as win_rate_percent
FROM lofts l
LEFT JOIN pigeons p ON l.id = p.loft_id
LEFT JOIN race_participants rp ON p.id = rp.pigeon_id AND rp.status IN ('registered', 'flying')
LEFT JOIN race_results rr ON p.id = rr.pigeon_id AND rr.status = 'finished'
GROUP BY l.id
ORDER BY total_points DESC;

-- 8. 创建触发器以自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_races_timestamp
    AFTER UPDATE ON races
    FOR EACH ROW
BEGIN
    UPDATE races
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_race_participants_timestamp
    AFTER UPDATE ON race_participants
    FOR EACH ROW
BEGIN
    UPDATE race_participants
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_race_results_timestamp
    AFTER UPDATE ON race_results
    FOR EACH ROW
BEGIN
    UPDATE race_results
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 9. 插入一些示例比赛数据
INSERT INTO races (race_name, race_date, distance_km, release_point, category, status)
SELECT
    '春季短距离赛',
    DATE('now', '-30 days'),
    150.0,
    '南郊放飞点',
    'sprint',
    'completed'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE race_name = '春季短距离赛');

INSERT INTO races (race_name, race_date, distance_km, release_point, category, status)
SELECT
    '夏季中距离赛',
    DATE('now', '-15 days'),
    350.0,
    '北郊放飞点',
    'middle',
    'completed'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE race_name = '夏季中距离赛');

INSERT INTO races (race_name, race_date, distance_km, release_point, category, status)
SELECT
    '秋季长距离赛',
    DATE('now', '+15 days'),
    600.0,
    '东郊放飞点',
    'long',
    'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM races WHERE race_name = '秋季长距离赛');

-- 10. 创建一些实用的查询函数（通过视图实现）

-- 比赛排名汇总视图
CREATE VIEW IF NOT EXISTS race_rankings_summary AS
SELECT
    'scheduled_races' as metric,
    COUNT(*) as value,
    '计划中的比赛' as description
FROM races
WHERE status = 'scheduled'
UNION ALL
SELECT
    'completed_races' as metric,
    COUNT(*) as value,
    '已完成的比赛' as description
FROM races
WHERE status = 'completed'
UNION ALL
SELECT
    'total_race_entries' as metric,
    COUNT(*) as value,
    '总参赛次数' as description
FROM race_participants
WHERE status IN ('registered', 'flying')
UNION ALL
SELECT
    'total_finishes' as metric,
    COUNT(*) as value,
    '总完成次数' as description
FROM race_results
WHERE status = 'finished'
UNION ALL
SELECT
    'active_racing_pigeons' as metric,
    COUNT(DISTINCT pigeon_id) as value,
    '活跃参赛鸽数' as description
FROM race_participants
WHERE status IN ('registered', 'flying');

-- 比赛性能分析视图
CREATE VIEW IF NOT EXISTS race_performance_analysis AS
SELECT
    r.id as race_id,
    r.race_name,
    r.race_date,
    r.distance_km,
    r.category,
    COUNT(DISTINCT rp.pigeon_id) as participants,
    COUNT(DISTINCT rr.pigeon_id) as finishers,
    ROUND(COUNT(DISTINCT rr.pigeon_id) * 100.0 / COUNT(DISTINCT rp.pigeon_id), 2) as return_rate_percent,
    CASE
        WHEN COUNT(DISTINCT rr.pigeon_id) > 1
        THEN (julianday(MIN(rr.arrival_time)) - julianday(MAX(rr.arrival_time))) * -86400
        ELSE 0
    END as competition_span_seconds,
    ROUND(AVG(rr.arrival_speed), 2) as average_speed_mps,
    MIN(rr.arrival_speed) as slowest_speed_mps,
    MAX(rr.arrival_speed) as fastest_speed_mps,
    ROUND(AVG(rr.flight_duration_seconds), 0) as average_duration_seconds
FROM races r
LEFT JOIN race_participants rp ON r.id = rp.race_id AND rp.status IN ('registered', 'flying')
LEFT JOIN race_results rr ON r.id = rr.race_id AND rr.status = 'finished'
WHERE r.status = 'completed'
GROUP BY r.id
ORDER BY r.race_date DESC;