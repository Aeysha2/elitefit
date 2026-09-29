-- Schéma de la base EliteFit (MySQL 8)

DROP TABLE IF EXISTS bookings, messages, admins, time_slots, gallery_images, testimonials, programs, trainers, plans;

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  duration_months TINYINT UNSIGNED NOT NULL,
  price_fcfa INT UNSIGNED NOT NULL,
  benefits JSON NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  experience_years TINYINT UNSIGNED NOT NULL,
  certifications JSON NOT NULL,
  photo_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  duration_weeks TINYINT UNSIGNED NOT NULL,
  level ENUM('beginner','intermediate','advanced') NOT NULL,
  image_url VARCHAR(255),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author VARCHAR(100) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(150) NOT NULL,
  category ENUM('interior','equipment','sessions','events') NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Créneaux proposés pour les séances d'essai (la salle est ouverte 24 h/24)
CREATE TABLE time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weekday TINYINT UNSIGNED NOT NULL,   -- 1 = lundi ... 7 = dimanche
  start_time TIME NOT NULL,
  capacity TINYINT UNSIGNED NOT NULL DEFAULT 3,
  UNIQUE (weekday, start_time)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  goal ENUM('weight_loss','muscle_gain','fitness','flexibility','other') NOT NULL,
  plan_id INT NULL,
  status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  INDEX idx_slot (booking_date, booking_time),
  INDEX idx_email (email)
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash CHAR(60) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
