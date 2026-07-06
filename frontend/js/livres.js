async function loadBooks() {
  const search = document.getElementById('search').value.trim();
  const url = search ? `${API.books}?search=${encodeURIComponent(search)}` : API.books;
  try {
    const books = await apiRequest(url);
    renderBooks(books);
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderBooks(books) {
  const tbody = document.getElementById('books-table');
  tbody.innerHTML = '';
  books.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.isbn}</td>
      <td>${book.category || '-'}</td>
      <td>${book.available_copies} / ${book.total_copies}</td>
      <td class="actions">
        <button class="secondary" onclick="editBook(${book.id})">✏️</button>
        <button class="danger" onclick="deleteBook(${book.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('book-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    isbn: document.getElementById('isbn').value,
    category: document.getElementById('category').value,
    total_copies: parseInt(document.getElementById('total_copies').value, 10) || 1
  };
  try {
    await apiRequest(API.books, { method: 'POST', body: JSON.stringify(payload) });
    showToast('Livre ajouté avec succès');
    e.target.reset();
    loadBooks();
  } catch (err) {
    showToast(err.message, true);
  }
});

async function editBook(id) {
  const newTitle = prompt('Nouveau titre (laisser vide pour ne pas changer) :');
  if (newTitle === null) return;
  try {
    const payload = {};
    if (newTitle.trim()) payload.title = newTitle.trim();
    await apiRequest(`${API.books}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Livre modifié');
    loadBooks();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteBook(id) {
  if (!confirm('Supprimer ce livre ?')) return;
  try {
    await apiRequest(`${API.books}/${id}`, { method: 'DELETE' });
    showToast('Livre supprimé');
    loadBooks();
  } catch (err) {
    showToast(err.message, true);
  }
}

loadBooks();
