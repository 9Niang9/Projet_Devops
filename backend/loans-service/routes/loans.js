const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');

const BOOKS_SERVICE_URL = process.env.BOOKS_SERVICE_URL || 'http://books-service:3001';
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:3002';
const LOAN_DURATION_DAYS = 14;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Met a jour automatiquement le statut EN_RETARD des emprunts en cours
async function refreshOverdueStatus() {
  await pool.query(
    `UPDATE loans SET status = 'EN_RETARD'
     WHERE status = 'EN_COURS' AND due_date < CURDATE()`
  );
}

// GET /api/loans - historique complet des emprunts (avec enrichissement livre/utilisateur)
router.get('/', async (req, res) => {
  try {
    await refreshOverdueStatus();
    const { status, user_id } = req.query;
    let query = 'SELECT * FROM loans';
    const conditions = [];
    const params = [];
    if (status) { conditions.push('status = ?'); params.push(status.toUpperCase()); }
    if (user_id) { conditions.push('user_id = ?'); params.push(user_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id DESC';

    const [loans] = await pool.query(query, params);
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/loans/overdue - detection des retards
router.get('/overdue', async (req, res) => {
  try {
    await refreshOverdueStatus();
    const [rows] = await pool.query("SELECT * FROM loans WHERE status = 'EN_RETARD'");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/loans/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Emprunt introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/loans - emprunter un livre
router.post('/', async (req, res) => {
  try {
    const { book_id, user_id } = req.body;
    if (!book_id || !user_id) {
      return res.status(400).json({ error: 'book_id et user_id sont obligatoires' });
    }

    // Verifier que l'utilisateur existe (appel au users-service)
    try {
      await axios.get(`${USERS_SERVICE_URL}/api/users/${user_id}`);
    } catch (e) {
      return res.status(404).json({ error: "Utilisateur introuvable dans le service Utilisateurs" });
    }

    // Verifier la disponibilite du livre (appel au books-service)
    let book;
    try {
      const bookResp = await axios.get(`${BOOKS_SERVICE_URL}/api/books/${book_id}`);
      book = bookResp.data;
    } catch (e) {
      return res.status(404).json({ error: "Livre introuvable dans le service Livres" });
    }

    if (book.available_copies < 1) {
      return res.status(409).json({ error: "Aucun exemplaire disponible pour ce livre" });
    }

    const loanDate = new Date();
    const dueDate = addDays(loanDate, LOAN_DURATION_DAYS);

    const [result] = await pool.query(
      'INSERT INTO loans (book_id, user_id, loan_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [book_id, user_id, formatDate(loanDate), formatDate(dueDate), 'EN_COURS']
    );

    // Decrementer le nombre d'exemplaires disponibles
    await axios.patch(`${BOOKS_SERVICE_URL}/api/books/${book_id}/availability`, { delta: -1 });

    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/loans/:id/return - retourner un livre
router.put('/:id/return', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Emprunt introuvable' });

    const loan = rows[0];
    if (loan.status === 'RETOURNE') {
      return res.status(400).json({ error: 'Ce livre a deja ete retourne' });
    }

    await pool.query(
      "UPDATE loans SET status = 'RETOURNE', return_date = ? WHERE id = ?",
      [formatDate(new Date()), req.params.id]
    );

    // Reincrementer le nombre d'exemplaires disponibles
    await axios.patch(`${BOOKS_SERVICE_URL}/api/books/${loan.book_id}/availability`, { delta: 1 });

    const [updated] = await pool.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
