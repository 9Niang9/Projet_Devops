async function loadUsers() {
  const type = document.getElementById('filter-type').value;
  const url = type ? `${API.users}?type=${type}` : API.users;
  try {
    const users = await apiRequest(url);
    renderUsers(users);
  } catch (err) {
    showToast(err.message, true);
  }
}

function typeLabel(type) {
  return { ETUDIANT: 'Étudiant', PROFESSEUR: 'Professeur', PERSONNEL_ADMINISTRATIF: 'Personnel admin.' }[type] || type;
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table');
  tbody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.first_name} ${user.last_name}</td>
      <td>${user.email}</td>
      <td>${typeLabel(user.user_type)}</td>
      <td class="actions">
        <button class="secondary" onclick="viewUser(${user.id})">👁️</button>
        <button class="danger" onclick="deleteUser(${user.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    first_name: document.getElementById('first_name').value,
    last_name: document.getElementById('last_name').value,
    email: document.getElementById('email').value,
    user_type: document.getElementById('user_type').value
  };
  try {
    await apiRequest(API.users, { method: 'POST', body: JSON.stringify(payload) });
    showToast('Utilisateur créé avec succès');
    e.target.reset();
    loadUsers();
  } catch (err) {
    showToast(err.message, true);
  }
});

async function viewUser(id) {
  try {
    const user = await apiRequest(`${API.users}/${id}`);
    alert(`Profil utilisateur\n\nNom : ${user.first_name} ${user.last_name}\nEmail : ${user.email}\nType : ${typeLabel(user.user_type)}\nInscrit le : ${user.created_at}`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return;
  try {
    await apiRequest(`${API.users}/${id}`, { method: 'DELETE' });
    showToast('Utilisateur supprimé');
    loadUsers();
  } catch (err) {
    showToast(err.message, true);
  }
}

loadUsers();
