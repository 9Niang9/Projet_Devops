async function loadLoans() {
  const status = document.getElementById('filter-status').value;
  const url = status ? `${API.loans}?status=${status}` : API.loans;
  try {
    const loans = await apiRequest(url);
    renderLoans(loans);
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderLoans(loans) {
  const tbody = document.getElementById('loans-table');
  tbody.innerHTML = '';
  loans.forEach(loan => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${loan.id}</td>
      <td>#${loan.book_id}</td>
      <td>#${loan.user_id}</td>
      <td>${loan.loan_date}</td>
      <td>${loan.due_date}</td>
      <td><span class="badge ${loan.status}">${loan.status.replace('_', ' ')}</span></td>
      <td class="actions">
        ${loan.status !== 'RETOURNE' ? `<button class="success" onclick="returnLoan(${loan.id})">↩️ Retourner</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('loan-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    book_id: parseInt(document.getElementById('book_id').value, 10),
    user_id: parseInt(document.getElementById('user_id').value, 10)
  };
  try {
    await apiRequest(API.loans, { method: 'POST', body: JSON.stringify(payload) });
    showToast('Emprunt enregistré avec succès');
    e.target.reset();
    loadLoans();
  } catch (err) {
    showToast(err.message, true);
  }
});

async function returnLoan(id) {
  try {
    await apiRequest(`${API.loans}/${id}/return`, { method: 'PUT' });
    showToast('Livre retourné');
    loadLoans();
  } catch (err) {
    showToast(err.message, true);
  }
}

loadLoans();
