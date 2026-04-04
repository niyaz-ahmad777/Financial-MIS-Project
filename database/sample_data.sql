INSERT INTO users (username, password_hash, role) VALUES
(''admin'', ''admin123'', ''admin''),
(''analyst'', ''analyst123'', ''analyst'');

INSERT INTO transactions (account, amount, type) VALUES
(''AC001'', 1800.00, ''transfer''),
(''AC104'', 9200.00, ''withdrawal''),
(''AC988'', 400.00, ''payment'');

INSERT INTO alerts (level, message) VALUES
(''HIGH'', ''Unusual high-value withdrawal detected''),
(''MEDIUM'', ''Multiple failed login attempts'');
