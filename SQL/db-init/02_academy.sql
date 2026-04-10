USE security_lab_db;

DROP TABLE IF EXISTS academy_users;

CREATE TABLE academy_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(80) NOT NULL,
    password VARCHAR(80) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    email VARCHAR(120) NULL,
    UNIQUE KEY (user_name)
);

INSERT INTO academy_users (user_name, password, role, email) VALUES
('admin', 'Admin@123', 'admin', 'admin@codeacademy.local'),
('instructor', 'Teach#456', 'admin', 'instructor@codeacademy.local'),
('lab_target', 'RemoveMe!99', 'user', 'lab_target@academy.demo'),
('student1', 'Stu001!', 'user', 'student1@example.com'),
('student2', 'Stu002!', 'user', 'student2@example.com'),
('student3', 'Stu003!', 'user', 'student3@example.com'),
('alice', 'Alice$789', 'user', 'alice@example.com'),
('bob', 'Bob^321', 'user', 'bob@example.com');

DROP TABLE IF EXISTS academy_sessions;
CREATE TABLE academy_sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    role VARCHAR(20) NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX (expires_at)
);
