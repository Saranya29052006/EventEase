window.onload = () => {
  checkAuth();
  const data = JSON.parse(localStorage.getItem('lastBooking'));
  if (!data) {
    window.location.href = 'index.html';
    return;
  }

  const { booking, event } = data;
  const container = document.getElementById('bookingDetails');

  container.innerHTML = `
    <div class="detail-row">
      <span>Booking ID</span>
      <span class="booking-id">${booking.bookingId}</span>
    </div>
    <div class="detail-row">
      <span>Event</span>
      <span>${event.title}</span>
    </div>
    <div class="detail-row">
      <span>Date</span>
      <span>${new Date(event.date).toDateString()}</span>
    </div>
    <div class="detail-row">
      <span>Time</span>
      <span>${event.time}</span>
    </div>
    <div class="detail-row">
      <span>Venue</span>
      <span>${event.venue}</span>
    </div>
    <div class="detail-row">
      <span>Tickets</span>
      <span>${booking.ticketCount}</span>
    </div>
    <div class="detail-row">
      <span>Total Paid</span>
      <span style="color:var(--primary);font-weight:700">₹${booking.totalPrice}</span>
    </div>
    <div class="detail-row">
      <span>Status</span>
      <span class="badge badge-success">✅ Confirmed</span>
    </div>
  `;
};