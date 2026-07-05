-- =========================================================
-- Script d'initialisation des bases de données
-- Bibliothèque Numérique - DIT
-- =========================================================

CREATE DATABASE IF NOT EXISTS books_db;
CREATE DATABASE IF NOT EXISTS users_db;
CREATE DATABASE IF NOT EXISTS loans_db;

-- ---------------------------------------------------------
-- Base BOOKS
-- ---------------------------------------------------------
USE books_db;

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100),
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES
('Clean Code', 'Robert C. Martin', '9780132350884', 'Informatique', 3, 3),
('Design Patterns', 'GoF', '9780201633610', 'Informatique', 2, 2),
('1984', 'George Orwell', '9780451524935', 'Littérature', 4, 4);

-- ---------------------------------------------------------
-- Base USERS
-- ---------------------------------------------------------
USE users_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    user_type ENUM('ETUDIANT', 'PROFESSEUR', 'PERSONNEL_ADMINISTRATIF') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, last_name, email, user_type) VALUES
('Fatou', 'Diop', 'fatou.diop@dit.sn', 'ETUDIANT'),
('Moussa', 'Ndiaye', 'moussa.ndiaye@dit.sn', 'PROFESSEUR'),
('Awa', 'Fall', 'awa.fall@dit.sn', 'PERSONNEL_ADMINISTRATIF');

-- ---------------------------------------------------------
-- Base LOANS
-- ---------------------------------------------------------
USE loans_db;

CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status ENUM('EN_COURS', 'RETOURNE', 'EN_RETARD') NOT NULL DEFAULT 'EN_COURS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
