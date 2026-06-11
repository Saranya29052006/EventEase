const API = 'https://eventease-backend-cgn0.onrender.com/api';
let currentEvent = null;
let ticketCount = 1;

window.onload = async () => {
  checkAuth();
  const eventId = localStorage.getItem('selectedEventId');
  if (!eventId) {
    window.location.href = 'index.html';
    return;
  }
  await loadEvent(eventId);
};
function formatTime(time) {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}
async function loadEvent(id) {
  try {
    const res = await fetch(`${API}/events/${id}`);
    if (!res.ok) {
      alert('This event has expired and is no longer available.');
      window.location.href = 'index.html';
      return;
    }
    const event = await res.json();
    currentEvent = event;
    renderEvent(event);
  } catch (err) {
    console.log('Error:', err);
  }
}
function renderEvent(event) {
  const container = document.getElementById('eventDetail');
  container.innerHTML = `
  <div class="event-layout">

    <div class="event-left">
<div class="img-wrapper">
  <img class="banner" src="${event.image || 'https://via.placeholder.com/600x400?text=EventEase'}" alt="${event.title}"/>
</div>      <h1 class="event-title">${event.title}</h1>
      <p class="event-desc">${event.description}</p>
    </div>

    <div class="event-right">

      <div class="meta-grid">
        <div class="meta-card">
          <i class="fas fa-calendar"></i>
          <span class="m-label">Date</span>
          <span class="m-value">${new Date(event.date).toDateString()}</span>
        </div>
        <div class="meta-card">
          <i class="fas fa-clock"></i>
          <span class="m-label">Time</span>
          <span class="m-value">${formatTime(event.time)}</span>
        </div>
        <div class="meta-card">
          <i class="fas fa-map-marker-alt"></i>
          <span class="m-label">Venue</span>
          <span class="m-value">${event.venue}</span>
        </div>
        <div class="meta-card">
          <i class="fas fa-chair"></i>
          <span class="m-label">Available Seats</span>
          <span class="m-value">${event.availableSeats}</span>
        </div>
      </div>

      <hr class="right-divider"/>

      <p class="booking-label">Book Tickets</p>

      <div id="bookingAlert" class="alert" style="display:none;margin-bottom:1rem"></div>

      <div class="ticket-row">
        <div>
          <p class="ticket-name">${event.title}</p>
          <p class="ticket-price">₹${event.price} per ticket</p>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeTickets(-1)">−</button>
          <span class="qty-num" id="ticketCount">1</span>
          <button class="qty-btn" onclick="changeTickets(1)">+</button>
        </div>
      </div>

      <div class="total-section">
        <span class="total-label">Total Amount</span>
        <span class="total-amount">₹<span id="totalPrice">${event.price}</span></span>
      </div>

      <button class="confirm-btn" onclick="bookTickets()">Confirm Booking</button>

    </div>
  </div>
`;
}

function changeTickets(change) {
  const newCount = ticketCount + change;
  if (newCount < 1 || newCount > currentEvent.availableSeats) return;
  ticketCount = newCount;
  document.getElementById('ticketCount').textContent = ticketCount;
  document.getElementById('totalPrice').textContent = currentEvent.price * ticketCount;
}

async function bookTickets() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        eventId: currentEvent._id,
        ticketCount
      })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('lastBooking', JSON.stringify({
        booking: data.booking,
        event: currentEvent
      }));
      window.location.href = 'booking.html';
    } else {
      showAlert(data.message, 'error');
    }
  } catch (err) {
    showAlert('Something went wrong. Try again.', 'error');
  }
}

function showAlert(message, type) {
  const alert = document.getElementById('bookingAlert');
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.style.display = 'block';
}