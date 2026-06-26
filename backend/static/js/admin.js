const API = 'http://localhost:5000/api';
let deleteEventId = null;
let allBookingsData = [];

function formatTime(time) {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

window.onload = async () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 'admin') {
    window.location.href = '/';
    return;
  }
  await loadStats();
  await loadEvents();
  await loadAllBookings();
};

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

async function loadStats() {
  const token = localStorage.getItem('token');
  document.getElementById('totalEvents').textContent = '...';
  document.getElementById('totalBookings').textContent = '...';
  document.getElementById('totalRevenue').textContent = '...';
  try {
    const [eventsRes, bookingsRes] = await Promise.all([
      fetch(`${API}/events/`),
      fetch(`${API}/bookings/all`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const events = await eventsRes.json();
    const bookings = await bookingsRes.json();
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('totalBookings').textContent = bookings.length;
    const revenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    document.getElementById('totalRevenue').textContent = revenue;
  } catch (err) {
    console.log('Error loading stats:', err);
  }
}

async function loadEvents() {
  try {
    const res = await fetch(`${API}/events/`);
    const events = await res.json();
    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = events.map(e => `
      <tr>
        <td>${e.title}</td>
        <td><span class="badge badge-success">${e.category}</span></td>
        <td>${new Date(e.date).toDateString()}</td>
        <td>₹${e.price}</td>
        <td>${e.availableSeats}</td>
        <td style="display:flex;gap:0.5rem">
          <button class="btn btn-primary" style="padding:0.4rem 1rem;font-size:0.8rem;border-radius:8px"
            onclick='openEditModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>
            ✏️ Edit
          </button>
          <button class="btn btn-danger" style="padding:0.4rem 1rem;font-size:0.8rem;border-radius:8px"
            onclick="openDeleteModal('${e._id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Error:', err);
  }
}

async function loadAllBookings() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/bookings/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const bookings = await res.json();
    allBookingsData = bookings;
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = bookings.map((b, i) => `
      <tr>
        <td style="font-size:0.8rem">${b.bookingId}</td>
        <td>${b.userId?.name || 'N/A'}<br>
          <span style="color:var(--text-muted);font-size:0.8rem">${b.userId?.email || ''}</span>
        </td>
        <td>${b.eventId?.title || 'N/A'}</td>
        <td>${b.ticketCount}</td>
        <td style="color:var(--primary);font-weight:700">₹${b.totalPrice}</td>
        <td>
          <button class="btn btn-primary" style="padding:0.4rem 1rem;font-size:0.8rem;border-radius:8px;cursor:pointer" onclick="showBookingDetails(${i})">
            View
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Error:', err);
  }
}

function openDeleteModal(id) {
  deleteEventId = id;
  const modal = document.getElementById('deleteModal');
  modal.style.display = 'flex';
  document.getElementById('confirmDeleteBtn').onclick = () => confirmDelete();
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deleteEventId = null;
}

async function confirmDelete() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/events/${deleteEventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      closeDeleteModal();
      await loadEvents();
      await loadStats();
      await loadAllBookings();
    }
  } catch (err) {
    console.log('Error:', err);
  }
}

function openEditModal(e) {
  document.getElementById('editId').value = e._id;
  document.getElementById('editTitle').value = e.title;
  document.getElementById('editDescription').value = e.description;
  document.getElementById('editDate').value = e.date ? e.date.split('T')[0] : '';
  document.getElementById('editTime').value = e.time;
  document.getElementById('editVenue').value = e.venue;
  document.getElementById('editCategory').value = e.category;
  document.getElementById('editPrice').value = e.price;
  document.getElementById('editAvailableSeats').value = e.availableSeats;
  document.getElementById('editImage').value = '';
  document.getElementById('editAlert').style.display = 'none';
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

async function saveEdit() {
  const token = localStorage.getItem('token');
  const id = document.getElementById('editId').value;
  const imageFile = document.getElementById('editImage').files[0];

  try {
    let res;
    if (imageFile) {
      const formData = new FormData();
      formData.append('title', document.getElementById('editTitle').value.trim());
      formData.append('description', document.getElementById('editDescription').value.trim());
      formData.append('date', document.getElementById('editDate').value);
      formData.append('time', document.getElementById('editTime').value);
      formData.append('venue', document.getElementById('editVenue').value.trim());
      formData.append('category', document.getElementById('editCategory').value);
      formData.append('price', document.getElementById('editPrice').value);
      formData.append('availableSeats', document.getElementById('editAvailableSeats').value);
      formData.append('image', imageFile);
      res = await fetch(`${API}/events/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    } else {
      res = await fetch(`${API}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: document.getElementById('editTitle').value.trim(),
          description: document.getElementById('editDescription').value.trim(),
          date: document.getElementById('editDate').value,
          time: document.getElementById('editTime').value,
          venue: document.getElementById('editVenue').value.trim(),
          category: document.getElementById('editCategory').value,
          price: Number(document.getElementById('editPrice').value),
          availableSeats: Number(document.getElementById('editAvailableSeats').value)
        })
      });
    }
    if (res.ok) {
      closeEditModal();
      await loadEvents();
      await loadStats();
    } else {
      const data = await res.json();
      showEditAlert(data.message || 'Update failed');
    }
  } catch (err) {
    showEditAlert('Something went wrong');
  }
}

function showEditAlert(message) {
  const alert = document.getElementById('editAlert');
  alert.textContent = message;
  alert.className = 'alert alert-error';
  alert.style.display = 'block';
}

function showBookingDetails(index) {
  const b = allBookingsData[index];
  const event = b.eventId;
  const user = b.userId;
  document.getElementById('bookingDetailsContent').innerHTML = `
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Booking ID</span>
      <span class="booking-id" style="font-weight:700">${b.bookingId}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">User</span>
      <span>${user?.name || 'N/A'} (${user?.email || ''})</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Event</span>
      <span>${event ? event.title : 'N/A'}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Date</span>
      <span>${event ? new Date(event.date).toDateString() : 'N/A'}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Time</span>
      <span>${event ? formatTime(event.time) : 'N/A'}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Venue</span>
      <span>${event ? event.venue : 'N/A'}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Tickets</span>
      <span>${b.ticketCount}</span>
    </div>
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0">
      <span style="color:var(--text-muted)">Total Paid</span>
      <span style="color:var(--primary);font-weight:700">₹${b.totalPrice}</span>
    </div>
  `;
  document.getElementById('bookingDetailsModal').style.display = 'flex';
}

function closeBookingDetailsModal() {
  document.getElementById('bookingDetailsModal').style.display = 'none';
}

async function addEvent() {
  const token = localStorage.getItem('token');
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const venue = document.getElementById('venue').value.trim();
  const category = document.getElementById('category').value;
  const price = document.getElementById('price').value;
  const totalSeats = document.getElementById('totalSeats').value;
  const imageFile = document.getElementById('image').files[0];

  if (!title || !description || !date || !time || !venue || !price || !totalSeats) {
    showAddAlert('Please fill in all required fields', 'error');
    return;
  }

  try {
    let res;
    if (imageFile) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('venue', venue);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('totalSeats', totalSeats);
      formData.append('availableSeats', totalSeats);
      formData.append('image', imageFile);
      res = await fetch(`${API}/events/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    } else {
      res = await fetch(`${API}/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title, description, date, time, venue, category,
          price: Number(price),
          totalSeats: Number(totalSeats),
          availableSeats: Number(totalSeats)
        })
      });
    }
    const data = await res.json();
    if (res.ok) {
      showAddAlert('Event added successfully!', 'success');
      ['title','description','date','time','venue','price','totalSeats']
        .forEach(id => document.getElementById(id).value = '');
      document.getElementById('image').value = '';
      await loadEvents();
      await loadStats();
    } else {
      showAddAlert(data.message, 'error');
    }
  } catch (err) {
    showAddAlert('Something went wrong.', 'error');
  }
}

function showAddAlert(message, type) {
  const alert = document.getElementById('addAlert');
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.style.display = 'block';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}