const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/livres - lister tous les livres, avec recherche optionnelle
// ?chercher=titre|auteur|isbn
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM books';
    let params = [];

    if (search) {
      query += ' WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?';
      const term = `%${search}%`;
      params = [term, term, term];
    }
    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id - obtenir un livre
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Livre introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books - ajouter un livre
router.post('/', async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'title, author et isbn sont obligatoires' });
    }
    const copies = total_copies || 1;
    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)',
      [title, author, isbn, category || null, copies, copies]
    );
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/books/:id - modifier un livre
router.put('/:id', async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies, available_copies } = req.body;
    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Livre introuvable' });

    const current = existing[0];
    await pool.query(
      `UPDATE books SET title=?, author=?, isbn=?, category=?, total_copies=?, available_copies=? WHERE id=?`,
      [
        title ?? current.title,
        author ?? current.author,
        isbn ?? current.isbn,
        category ?? current.category,
        total_copies ?? current.total_copies,
        available_copies ?? current.available_copies,
        req.params.id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id - supprimer un livre
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Livre introuvable' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes internes utilisées par le service Emprunts
// PATCH /api/books/:id/availability { delta: -1 ou +1 }
router.patch('/:id/availability', async (req, res) => {
  try {
    const { delta } = req.body;
    await pool.query('UPDATE books SET available_copies = available_copies + ? WHERE id = ?', [delta, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
