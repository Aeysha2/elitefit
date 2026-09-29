-- Données de démonstration EliteFit.
-- Prix et contenus de démonstration : modifiez-les librement puis relancez npm run db:seed après npm run db:schema.

INSERT INTO plans (name, duration_months, price_fcfa, benefits, is_featured, sort_order) VALUES
('Mensuel', 1, 20000, JSON_ARRAY('Accès illimité 24 h/24', 'Vestiaires et douches', '1 séance d''essai avec un coach'), FALSE, 1),
('Trimestriel', 3, 55000, JSON_ARRAY('Accès illimité 24 h/24', 'Vestiaires et douches', 'Cours collectifs inclus', 'Bilan forme offert'), FALSE, 2),
('Semestriel', 6, 100000, JSON_ARRAY('Accès illimité 24 h/24', 'Cours collectifs inclus', 'Bilan forme tous les 2 mois', '2 séances de coaching personnalisé'), FALSE, 3),
('Annuel', 12, 150000, JSON_ARRAY('Accès illimité 24 h/24', 'Cours collectifs inclus', 'Bilan forme mensuel', 'Programme d''entraînement personnalisé', 'Plan nutritionnel', '1 serviette offerte'), TRUE, 4);

INSERT INTO trainers (name, specialization, experience_years, certifications, photo_url) VALUES
('Moussa Diallo', 'Musculation et force', 8, JSON_ARRAY('Diplôme d''État de coach sportif', 'Préparation physique'), 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&q=70&fm=webp'),
('Aïcha Traoré', 'Perte de poids et cardio', 6, JSON_ARRAY('Coach en nutrition sportive', 'Instructrice HIIT'), 'https://images.unsplash.com/photo-1609899464926-c34737e0a5b6?w=600&q=70&fm=webp'),
('Karim Ndiaye', 'CrossFit', 5, JSON_ARRAY('CrossFit Level 2 Trainer'), 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=70&fm=webp'),
('Fatou Sow', 'Yoga et mobilité', 7, JSON_ARRAY('Professeure de yoga certifiée (500 h)'), 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=70&fm=webp');

INSERT INTO programs (name, description, duration_weeks, level, image_url, is_featured) VALUES
('Perte de poids', 'Cardio, renforcement et suivi nutritionnel pour perdre du poids durablement.', 12, 'beginner', 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=70&fm=webp', TRUE),
('Prise de muscle', 'Programme de musculation progressive pour gagner en masse et en force.', 16, 'intermediate', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=70&fm=webp', TRUE),
('Cardio', 'Séances d''endurance sur tapis, vélo et rameur pour le cœur et le souffle.', 8, 'beginner', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=70&fm=webp', FALSE),
('Yoga', 'Souplesse, respiration et gestion du stress, pour tous les niveaux.', 8, 'beginner', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=70&fm=webp', FALSE),
('CrossFit', 'Entraînements fonctionnels à haute intensité en petits groupes.', 10, 'advanced', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=70&fm=webp', TRUE),
('Coaching personnalisé', 'Un coach dédié, un programme sur mesure et un suivi chaque semaine.', 12, 'intermediate', 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800&q=70&fm=webp', FALSE);

INSERT INTO testimonials (author, rating, content) VALUES
('Awa K.', 5, 'Des coachs excellents et des installations au top ! Pouvoir venir à 23 h change tout.'),
('Ibrahim S.', 5, 'J''ai pris 6 kg de muscle en 4 mois avec le programme de Moussa.'),
('Mariam D.', 4, 'Salle propre, ambiance motivante et cours de yoga très apaisants.'),
('Serge B.', 5, 'L''abonnement annuel est vraiment rentable. Je recommande.');

INSERT INTO gallery_images (url, alt_text, category, sort_order) VALUES
('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=70&fm=webp', 'Plateau de musculation de la salle', 'interior', 1),
('https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=1200&q=70&fm=webp', 'Espace cardio avec tapis de course', 'interior', 2),
('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=70&fm=webp', 'Haltères et bancs de musculation', 'equipment', 3),
('https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1200&q=70&fm=webp', 'Rack à haltères', 'equipment', 4),
('https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&q=70&fm=webp', 'Séance de CrossFit en groupe', 'sessions', 5),
('https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&q=70&fm=webp', 'Cours de yoga', 'sessions', 6),
('https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200&q=70&fm=webp', 'Compétition interne de la salle', 'events', 7),
('https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&q=70&fm=webp', 'Journée portes ouvertes', 'events', 8);

-- Salle ouverte 24 h/24 : un créneau d'essai par heure, 7 jours sur 7, 3 places chacun.
INSERT INTO time_slots (weekday, start_time, capacity)
WITH RECURSIVE days(d) AS (SELECT 1 UNION ALL SELECT d + 1 FROM days WHERE d < 7),
hours(h) AS (SELECT 0 UNION ALL SELECT h + 1 FROM hours WHERE h < 23)
SELECT d, MAKETIME(h, 0, 0), 3 FROM days CROSS JOIN hours;
