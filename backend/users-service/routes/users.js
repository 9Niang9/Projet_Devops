const express = require('express');
const router = express.Router();
const pool = require('../db');

const VALID_TYPES = ['ETUDIANT', 'PROFESSEUR', 'PERSONNEL_ADMINISTRATIF'];

// GET /api/users - lister les utilisateurs (filtre optionnel ?type=)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM users';
    let params = [];
    if (type) {
      query += ' WHERE user_type = ?';
      params.push(type.toUpperCase());
    }
    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id - consulter le profil d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - creer un utilisateur
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, user_type } = req.body;
    if (!first_name || !last_name || !email || !user_type) {
      return res.status(400).json({ error: 'first_name, last_name, email et user_type sont obligatoires' });
    }
    if (!VALID_TYPES.includes(user_type.toUpperCase())) {
      return res.status(400).json({ error: `user_type doit etre l'un de : ${VALID_TYPES.join(', ')}` });
    }
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, user_type) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, user_type.toUpperCase()]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cet email existe deja' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - modifier un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, user_type } = req.body;
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const current = existing[0];
    await pool.query(
      'UPDATE users SET first_name=?, last_name=?, email=?, user_type=? WHERE id=?',
      [
        first_name ?? current.first_name,
        last_name ?? current.last_name,
        email ?? current.email,
        (user_type ?? current.user_type).toUpperCase(),
        req.params.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id - supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
