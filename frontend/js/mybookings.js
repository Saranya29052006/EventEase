const API = 'http://localhost:5000/api';
let allBookings = [];

window.onload = async () => {
  checkAuth();
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  await loadMyBookings(token);
};
function formatTime(time) {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}
async function loadMyBookings(token) {
  try {
    const res = await fetch(`${API}/bookings/mine`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const bookings = await res.json();
    allBookings = bookings;
    const tbody = document.getElementById('bookingsBody');
    const noBookings = document.getElementById('noBookings');

    if (bookings.length === 0) {
      noBookings.style.display = 'block';
      document.getElementById('bookingsTable').style.display = 'none';
      return;
    }

    tbody.innerHTML = bookings.map((b, i) => `
      <tr>
        <td class="booking-id" style="font-size:0.85rem">${b.bookingId}</td>
        <td>${b.eventId?.title || 'N/A'}</td>
        <td>${b.eventId ? new Date(b.eventId.date).toDateString() : 'N/A'}</td>
        <td>${b.ticketCount}</td>
        <td style="color:var(--primary);font-weight:700">₹${b.totalPrice}</td>
        <td>
          <button class="btn btn-primary" style="padding:0.4rem 1rem;font-size:0.8rem;border-radius:8px;cursor:pointer" onclick="showDetails(${i})">
            View
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Error:', err);
  }
}

function showDetails(index) {
  const b = allBookings[index];
  const event = b.eventId;

  document.getElementById('detailsContent').innerHTML = `
    <div class="detail-row" style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:0.5px solid rgba(255,255,255,0.07)">
      <span style="color:var(--text-muted)">Booking ID</span>
      <span class="booking-id" style="font-weight:700">${b.bookingId}</span>
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

  document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
}