ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'test';
GRANT ALL ON *.* TO 'root'@'localhost' IDENTIFIED BY 'test';
FLUSH PRIVILEGES;