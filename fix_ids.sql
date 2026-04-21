UPDATE jurisdiction_codes SET code='11' WHERE type='STATE' AND name LIKE '%Niger%';
UPDATE members SET memberId = REPLACE(memberId, '/99/', '/11/') WHERE memberId LIKE '%/99/%';
