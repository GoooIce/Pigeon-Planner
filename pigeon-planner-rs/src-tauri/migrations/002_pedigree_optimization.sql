-- 添加血统关系字段到 pigeons 表
ALTER TABLE pigeons ADD COLUMN sire_id INTEGER;
ALTER TABLE pigeons ADD COLUMN dam_id INTEGER;

-- 创建血统查询索引
CREATE INDEX IF NOT EXISTS idx_pigeons_sire_id ON pigeons(sire_id);
CREATE INDEX IF NOT EXISTS idx_pigeons_dam_id ON pigeons(dam_id);
CREATE INDEX IF NOT EXISTS idx_pigeons_ring_year ON pigeons(ring_number, year);
-- status 索引已经在初始迁移中创建，所以跳过
-- CREATE INDEX IF NOT EXISTS idx_pigeons_status ON pigeons(status);

-- 创建血统查询优化视图
CREATE VIEW pigeon_family AS
SELECT
    p.id,
    p.ring_number,
    p.year,
    p.name,
    p.sex,
    p.color,
    p.strain,
    p.loft,
    p.status,
    p.image_path,
    p.sire_ring_number,
    p.sire_year,
    p.dam_ring_number,
    p.dam_year,
    p.sire_id,
    sire.ring_number as sire_ring_number_id,
    sire.year as sire_year_id,
    sire.name as sire_name,
    p.dam_id,
    dam.ring_number as dam_ring_number_id,
    dam.year as dam_year_id,
    dam.name as dam_name,
    p.extra_fields,
    p.created_at,
    p.updated_at
FROM pigeons p
LEFT JOIN pigeons sire ON p.sire_id = sire.id
LEFT JOIN pigeons dam ON p.dam_id = dam.id;

-- 创建触发器，当 sire_ring_number 和 sire_year 更新时自动更新 sire_id
CREATE TRIGGER update_sire_id
AFTER UPDATE OF sire_ring_number, sire_year ON pigeons
WHEN NEW.sire_ring_number IS NOT NULL AND NEW.sire_year IS NOT NULL
BEGIN
    UPDATE pigeons
    SET sire_id = (
        SELECT id FROM pigeons
        WHERE ring_number = NEW.sire_ring_number
        AND year = NEW.sire_year
        AND sex = 0  -- 父鸽必须是雄性
        LIMIT 1
    )
    WHERE id = NEW.id;
END;

CREATE TRIGGER update_dam_id
AFTER UPDATE OF dam_ring_number, dam_year ON pigeons
WHEN NEW.dam_ring_number IS NOT NULL AND NEW.dam_year IS NOT NULL
BEGIN
    UPDATE pigeons
    SET dam_id = (
        SELECT id FROM pigeons
        WHERE ring_number = NEW.dam_ring_number
        AND year = NEW.dam_year
        AND sex = 1  -- 母鸽必须是雌性
        LIMIT 1
    )
    WHERE id = NEW.id;
END;

-- 数据迁移：将现有的环号关联转换为 ID 关联
UPDATE pigeons
SET sire_id = (
    SELECT id FROM pigeons sire
    WHERE sire.ring_number = pigeons.sire_ring_number
    AND sire.year = pigeons.sire_year
    AND sire.sex = 0
)
WHERE sire_ring_number IS NOT NULL AND sire_year IS NOT NULL;

UPDATE pigeons
SET dam_id = (
    SELECT id FROM pigeons dam
    WHERE dam.ring_number = pigeons.dam_ring_number
    AND dam.year = pigeons.dam_year
    AND dam.sex = 1
)
WHERE dam_ring_number IS NOT NULL AND dam_year IS NOT NULL;