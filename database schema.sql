CREATE DATABASE pose_with_ai;

USE pose_with_ai;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pose Modes Table
CREATE TABLE pose_modes (
    mode_id INT PRIMARY KEY AUTO_INCREMENT,
    mode_name VARCHAR(50) NOT NULL
);

-- Pose Sessions Table
CREATE TABLE pose_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    mode_id INT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (mode_id) REFERENCES pose_modes(mode_id)
);

-- Pose Analysis Table
CREATE TABLE pose_analysis (
    analysis_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT,

    head_angle FLOAT,
    neck_score FLOAT,
    shoulder_score FLOAT,
    spine_score FLOAT,

    total_score FLOAT,

    FOREIGN KEY (session_id)
    REFERENCES pose_sessions(session_id)
);

-- AI Suggestions Table
CREATE TABLE ai_suggestions (
    suggestion_id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_id INT,

    suggestion_text TEXT,

    FOREIGN KEY (analysis_id)
    REFERENCES pose_analysis(analysis_id)
);

-- Captured Photos Table
CREATE TABLE captured_photos (
    photo_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT,

    image_path VARCHAR(255),
    score FLOAT,

    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
    REFERENCES pose_sessions(session_id)
);

-- Pose History Table
CREATE TABLE pose_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT,
    photo_id INT,

    pose_mode VARCHAR(50),
    pose_score FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(user_id),

    FOREIGN KEY (photo_id)
    REFERENCES captured_photos(photo_id)
);