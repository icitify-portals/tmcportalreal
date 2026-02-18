
-- Seed Countries
INSERT INTO jurisdiction_codes (id, type, name, code, createdAt, updatedAt)
SELECT UUID(), 'COUNTRY', 'Nigeria', '01', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Nigeria' AND type = 'COUNTRY');

UPDATE jurisdiction_codes SET code = '01' WHERE name = 'Nigeria' AND type = 'COUNTRY';

INSERT INTO jurisdiction_codes (id, type, name, code, createdAt, updatedAt)
SELECT UUID(), 'COUNTRY', 'Benin', '02', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Benin' AND type = 'COUNTRY');

UPDATE jurisdiction_codes SET code = '02' WHERE name = 'Benin' AND type = 'COUNTRY';

-- Get Nigeria ID
SET @nigeria_id = (SELECT id FROM jurisdiction_codes WHERE name = 'Nigeria' AND type = 'COUNTRY' LIMIT 1);

-- Seed States
-- Specific States
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Lagos', '01', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Lagos' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Oyo', '02', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Oyo' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Ogun', '03', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Ogun' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Osun', '04', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Osun' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Kwara', '05', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Kwara' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Edo', '06', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Edo' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Ondo', '07', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Ondo' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Ekiti', '08', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Ekiti' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Abuja', '09', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Abuja' AND type = 'STATE' AND parentId = @nigeria_id);

INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt)
SELECT UUID(), 'STATE', 'Niger', '10', @nigeria_id, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Niger' AND type = 'STATE' AND parentId = @nigeria_id);

-- Remaining States
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Abia', '11', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Abia' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Adamawa', '12', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Adamawa' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Akwa Ibom', '13', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Akwa Ibom' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Anambra', '14', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Anambra' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Bauchi', '15', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Bauchi' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Bayelsa', '16', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Bayelsa' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Benue', '17', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Benue' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Borno', '18', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Borno' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Cross River', '19', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Cross River' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Delta', '20', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Delta' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Ebonyi', '21', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Ebonyi' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Enugu', '22', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Enugu' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Gombe', '23', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Gombe' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Imo', '24', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Imo' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Jigawa', '25', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Jigawa' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Kaduna', '26', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Kaduna' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Kano', '27', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Kano' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Katsina', '28', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Katsina' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Kebbi', '29', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Kebbi' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Kogi', '30', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Kogi' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Nasarawa', '31', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Nasarawa' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Plateau', '32', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Plateau' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Rivers', '33', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Rivers' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Sokoto', '34', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Sokoto' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Taraba', '35', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Taraba' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Yobe', '36', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Yobe' AND type = 'STATE' AND parentId = @nigeria_id);
INSERT INTO jurisdiction_codes (id, type, name, code, parentId, createdAt, updatedAt) SELECT UUID(), 'STATE', 'Zamfara', '37', @nigeria_id, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM jurisdiction_codes WHERE name = 'Zamfara' AND type = 'STATE' AND parentId = @nigeria_id);

