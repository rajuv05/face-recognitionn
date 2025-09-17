CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20)
);

CREATE TABLE attendance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    date DATE,
    time TIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
