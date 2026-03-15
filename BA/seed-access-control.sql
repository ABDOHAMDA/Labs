USE security_lab_db;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user'
);

INSERT INTO users (username, password, role) VALUES
('admin', 'password', 'admin'),
('user', 'password', 'user');
