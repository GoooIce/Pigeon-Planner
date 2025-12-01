-- 繁殖管理功能数据库迁移
-- 版本: 003
-- 日期: 2025-11-28
-- 描述: 添加繁殖配对、繁殖记录和巢箱管理功能

-- 1. 创建巢箱管理表
CREATE TABLE IF NOT EXISTS nest_boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_number TEXT NOT NULL UNIQUE,
    location TEXT,
    status TEXT NOT NULL CHECK(status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
    current_pair_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_pair_id) REFERENCES breeding_pairs(id) ON DELETE SET NULL
);

-- 2. 创建配对记录表
CREATE TABLE IF NOT EXISTS breeding_pairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sire_id INTEGER NOT NULL,
    dam_id INTEGER NOT NULL,
    pair_date DATE NOT NULL,
    separate_date DATE,
    status TEXT NOT NULL CHECK(status IN ('active', 'separated', 'completed')) DEFAULT 'active',
    nest_box_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sire_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    FOREIGN KEY (dam_id) REFERENCES pigeons(id) ON DELETE CASCADE,
    FOREIGN KEY (nest_box_id) REFERENCES nest_boxes(id) ON DELETE SET NULL,
    UNIQUE(sire_id, dam_id, pair_date) -- 防止重复配对
);

-- 3. 创建繁殖记录表
CREATE TABLE IF NOT EXISTS breeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair_id INTEGER NOT NULL,
    clutch_number INTEGER NOT NULL DEFAULT 1,
    first_egg_date DATE,
    second_egg_date DATE,
    first_hatch_date DATE,
    second_hatch_date DATE,
    egg_count INTEGER NOT NULL DEFAULT 2,
    hatched_count INTEGER NOT NULL DEFAULT 0,
    fledged_count INTEGER NOT NULL DEFAULT 0,
    first_chick_id INTEGER,
    second_chick_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pair_id) REFERENCES breeding_pairs(id) ON DELETE CASCADE,
    FOREIGN KEY (first_chick_id) REFERENCES pigeons(id) ON DELETE SET NULL,
    FOREIGN KEY (second_chick_id) REFERENCES pigeons(id) ON DELETE SET NULL
);

-- 4. 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_breeding_pairs_sire_id ON breeding_pairs(sire_id);
CREATE INDEX IF NOT EXISTS idx_breeding_pairs_dam_id ON breeding_pairs(dam_id);
CREATE INDEX IF NOT EXISTS idx_breeding_pairs_status ON breeding_pairs(status);
CREATE INDEX IF NOT EXISTS idx_breeding_pairs_pair_date ON breeding_pairs(pair_date);
CREATE INDEX IF NOT EXISTS idx_breeding_pairs_nest_box_id ON breeding_pairs(nest_box_id);

CREATE INDEX IF NOT EXISTS idx_breeding_records_pair_id ON breeding_records(pair_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_clutch_number ON breeding_records(pair_id, clutch_number);
CREATE INDEX IF NOT EXISTS idx_breeding_records_egg_dates ON breeding_records(first_egg_date, second_egg_date);

CREATE INDEX IF NOT EXISTS idx_nest_boxes_status ON nest_boxes(status);
CREATE INDEX IF NOT EXISTS idx_nest_boxes_current_pair_id ON nest_boxes(current_pair_id);

-- 5. 创建繁殖性能统计视图
CREATE VIEW IF NOT EXISTS breeding_performance AS
SELECT
    bp.id as pair_id,
    sire.ring_number as sire_ring_number,
    sire.name as sire_name,
    dam.ring_number as dam_ring_number,
    dam.name as dam_name,
    bp.pair_date,
    bp.status as pair_status,
    COUNT(br.id) as total_clutches,
    SUM(br.egg_count) as total_eggs,
    SUM(br.hatched_count) as total_hatched,
    SUM(br.fledged_count) as total_fledged,
    CASE
        WHEN SUM(br.egg_count) > 0
        THEN ROUND(SUM(br.hatched_count) * 100.0 / SUM(br.egg_count), 2)
        ELSE 0
    END as hatch_rate_percent,
    CASE
        WHEN SUM(br.hatched_count) > 0
        THEN ROUND(SUM(br.fledged_count) * 100.0 / SUM(br.hatched_count), 2)
        ELSE 0
    END as fledge_rate_percent,
    nb.box_number,
    nb.location as nest_location
FROM breeding_pairs bp
LEFT JOIN breeding_records br ON bp.id = br.pair_id
LEFT JOIN pigeons sire ON bp.sire_id = sire.id
LEFT JOIN pigeons dam ON bp.dam_id = dam.id
LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
GROUP BY bp.id;

-- 6. 创建活跃配对视图
CREATE VIEW IF NOT EXISTS active_breeding_pairs AS
SELECT
    bp.*,
    sire.ring_number as sire_ring_number,
    sire.name as sire_name,
    sire.color as sire_color,
    sire.strain as sire_strain,
    dam.ring_number as dam_ring_number,
    dam.name as dam_name,
    dam.color as dam_color,
    dam.strain as dam_strain,
    nb.box_number,
    nb.location as nest_location,
    -- 最新繁殖信息
    (SELECT COUNT(*) FROM breeding_records br WHERE br.pair_id = bp.id) as total_clutches,
    (SELECT MAX(br.created_at) FROM breeding_records br WHERE br.pair_id = bp.id) as last_record_date
FROM breeding_pairs bp
LEFT JOIN pigeons sire ON bp.sire_id = sire.id
LEFT JOIN pigeons dam ON bp.dam_id = dam.id
LEFT JOIN nest_boxes nb ON bp.nest_box_id = nb.id
WHERE bp.status = 'active'
ORDER BY bp.pair_date DESC;

-- 7. 创建触发器以自动更新巢箱状态
CREATE TRIGGER IF NOT EXISTS update_nest_box_on_pair_insert
    AFTER INSERT ON breeding_pairs
    FOR EACH ROW
BEGIN
    -- 更新巢箱状态为占用
    UPDATE nest_boxes
    SET status = 'occupied',
        current_pair_id = NEW.id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.nest_box_id AND NEW.status = 'active';
END;

CREATE TRIGGER IF NOT EXISTS update_nest_box_on_pair_update
    AFTER UPDATE ON breeding_pairs
    FOR EACH ROW
BEGIN
    -- 更新巢箱状态为占用
    UPDATE nest_boxes
    SET status = 'occupied',
        current_pair_id = NEW.id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.nest_box_id AND NEW.status = 'active';

    -- 释放之前分配的巢箱
    UPDATE nest_boxes
    SET status = 'available',
        current_pair_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT nest_box_id FROM breeding_pairs
                WHERE id = NEW.id AND nest_box_id IS NOT NULL
                AND nest_box_id != NEW.nest_box_id);
END;

CREATE TRIGGER IF NOT EXISTS release_nest_box_on_pair_separation
    AFTER UPDATE ON breeding_pairs
    FOR EACH ROW
    WHEN NEW.status IN ('separated', 'completed') AND OLD.status = 'active'
BEGIN
    -- 当配对被分离或完成时，释放巢箱
    UPDATE nest_boxes
    SET status = 'available',
        current_pair_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.nest_box_id;
END;

-- 8. 创建触发器以自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_breeding_pairs_timestamp
    AFTER UPDATE ON breeding_pairs
    FOR EACH ROW
BEGIN
    UPDATE breeding_pairs
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_breeding_records_timestamp
    AFTER UPDATE ON breeding_records
    FOR EACH ROW
BEGIN
    UPDATE breeding_records
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_nest_boxes_timestamp
    AFTER UPDATE ON nest_boxes
    FOR EACH ROW
BEGIN
    UPDATE nest_boxes
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- 9. 插入一些默认巢箱数据
INSERT INTO nest_boxes (box_number, location, status)
SELECT 'A-01', '主鸽舍左前', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'A-01');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'A-02', '主鸽舍左中', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'A-02');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'A-03', '主鸽舍左后', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'A-03');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'B-01', '主鸽舍右前', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'B-01');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'B-02', '主鸽舍右中', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'B-02');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'B-03', '主鸽舍右后', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'B-03');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'C-01', '繁殖区左侧', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'C-01');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'C-02', '繁殖区右侧', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'C-02');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'D-01', '隔离区1', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'D-01');

INSERT INTO nest_boxes (box_number, location, status)
SELECT 'D-02', '隔离区2', 'available'
WHERE NOT EXISTS (SELECT 1 FROM nest_boxes WHERE box_number = 'D-02');

-- 10. 创建一些实用的查询函数（通过视图实现）

-- 繁殖统计汇总视图
CREATE VIEW IF NOT EXISTS breeding_summary AS
SELECT
    'total_pairs' as metric,
    COUNT(*) as value,
    '配对总数' as description
FROM breeding_pairs
UNION ALL
SELECT
    'active_pairs' as metric,
    COUNT(*) as value,
    '活跃配对数' as description
FROM breeding_pairs
WHERE status = 'active'
UNION ALL
SELECT
    'total_clutches' as metric,
    COUNT(*) as value,
    '总窝数' as description
FROM breeding_records
UNION ALL
SELECT
    'total_eggs' as metric,
    SUM(egg_count) as value,
    '总蛋数' as description
FROM breeding_records
UNION ALL
SELECT
    'total_hatched' as metric,
    SUM(hatched_count) as value,
    '总孵化数' as description
FROM breeding_records
UNION ALL
SELECT
    'total_fledged' as metric,
    SUM(fledged_count) as value,
    '总出飞数' as description
FROM breeding_records
UNION ALL
SELECT
    'available_nest_boxes' as metric,
    COUNT(*) as value,
    '可用巢箱数' as description
FROM nest_boxes
WHERE status = 'available';