USE security_lab_2;

DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE profiles (
    user_id INT PRIMARY KEY,
    flag VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (username, password, email, role) VALUES
('admin', 'admin123', 'admin@lab.local', 'admin'),
('alice', 'alice123', 'alice@test.com', 'user'),
('bob', 'bob123', 'bob@test.com', 'user'),
('charlie', 'charlie123', 'charlie@test.com', 'user'),
('user', 'password', 'user@gmail.com', 'user'),
('dave', 'dave123', 'dave@test.com', 'user'),
('eve', 'eve123', 'eve@test.com', 'user'),
('frank', 'frank123', 'frank@test.com', 'user'),
('grace', 'grace123', 'grace@test.com', 'user'),
('henry', 'henry123', 'henry@test.com', 'user');

-- Flag only in user id 10
INSERT INTO profiles (user_id, flag) VALUES
(1, NULL),
(2, NULL),
(3, NULL),
(4, NULL),
(5, NULL),
(6, NULL),
(7, NULL),
(8, NULL),
(9, NULL),
(10, 'FLAG{IDOR_ACCESS_CONTROL_BYPASS}');
