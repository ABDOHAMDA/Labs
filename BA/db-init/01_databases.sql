CREATE DATABASE IF NOT EXISTS security_lab_1;
CREATE DATABASE IF NOT EXISTS security_lab_2;
-- lab_user is only granted MYSQL_DATABASE by default; lab2 API needs this user on security_lab_2.
GRANT ALL PRIVILEGES ON security_lab_2.* TO 'lab_user'@'%';
FLUSH PRIVILEGES;
