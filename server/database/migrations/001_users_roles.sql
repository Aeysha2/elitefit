-- Comptes et rôles : remplace la table admins par users (admin / coach / member),
-- relie les réservations à un compte et à un coach, ajoute les abonnements.
-- À appliquer sur une base créée avant cette version : npm run db:migrate

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password_hash CHAR(60) NOT NULL,
  role ENUM('admin','coach','member') NOT NULL DEFAULT 'member',
  trainer_id INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- Les administrateurs existants deviennent des comptes « admin »
INSERT INTO users (full_name, email, password_hash, role, created_at)
SELECT 'Administrateur', email, password_hash, 'admin', created_at FROM admins;

DROP TABLE admins;

ALTER TABLE bookings
  ADD COLUMN user_id INT NULL AFTER plan_id,
  ADD COLUMN trainer_id INT NULL AFTER user_id,
  ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_bookings_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL;

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NULL,
  plan_name VARCHAR(50) NOT NULL,
  amount_fcfa INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
  INDEX idx_user_dates (user_id, end_date)
);
