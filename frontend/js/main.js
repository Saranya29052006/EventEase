const API = 'https://eventease-backend-cgn0.onrender.com/api';
let allEvents = [];

// Load events on page load
window.onload = async () => {
  checkAuth();
  await loadEvents();
};
function formatTime(time) {
  if (!time) return 'N/A';
  const [hours, minutes] = time.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}
// Load all events from backend
async function loadEvents() {
  try {
    const res = await fetch(`${API}/events`);
    const events = await res.json();
    allEvents = events;
    displayEvents(events);
  } catch (err) {
    console.log('Error loading events:', err);
  }
}

// Display events in grid
function displayEvents(events) {
  const grid = document.getElementById('eventsGrid');
  const noEvents = document.getElementById('noEvents');

  if (events.length === 0) {
    grid.innerHTML = '';
    noEvents.style.display = 'block';
    return;
  }

  noEvents.style.display = 'none';
  grid.innerHTML = events.map(event => `
    <div class="event-card" onclick="goToEvent('${event._id}')">
      <img src="${event.image || 'https://via.placeholder.com/300x180?text=EventEase'}" alt="${event.title}"/>
      <div class="event-card-body">
        <span class="category">${event.category}</span>
        <h3>${event.title}</h3>
        <p class="info"><i class="fas fa-calendar"></i> ${new Date(event.date).toDateString()}</p>
        <p class="info"><i class="fas fa-clock"></i> ${formatTime(event.time)}</p>
        <p class="info"><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
        <p class="info"><i class="fas fa-chair"></i> ${event.availableSeats} seats left</p>
      </div>
      <div class="event-card-footer">
        <span class="price">₹${event.price}</span>
        <button class="btn btn-primary">Book Now</button>
      </div>
    </div>
  `).join('');
}

// Filter events
function filterEvents() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = allEvents.filter(event => {
    const matchSearch = event.title.toLowerCase().includes(search) ||
                        event.venue.toLowerCase().includes(search);
    const matchCategory = category === '' || event.category === category;
    return matchSearch && matchCategory;
  });

  displayEvents(filtered);
}

// Go to event detail page
function goToEvent(id) {
  localStorage.setItem('selectedEventId', id);
  window.location.href = 'event.html';
}