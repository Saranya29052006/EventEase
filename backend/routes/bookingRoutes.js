const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const auth = require('../middleware/authMiddleware');

// Book tickets
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, ticketCount } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats < ticketCount) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    const totalPrice = event.price * ticketCount;
    const bookingId = 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    const booking = new Booking({
      userId: req.user.userId,
      eventId,
      ticketCount,
      totalPrice,
      bookingId
    });
    await booking.save();

    event.availableSeats -= ticketCount;
    await event.save();

    res.status(201).json({ message: 'Booking confirmed!', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my bookings (remove bookings where event no longer exists)
router.get('/mine', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).populate('eventId');

    // Filter out bookings where event was deleted
    const validBookings = bookings.filter(b => b.eventId !== null);

    // Delete invalid bookings from DB
    const invalidBookings = bookings.filter(b => b.eventId === null);
    for (const b of invalidBookings) {
      await Booking.findByIdAndDelete(b._id);
    }

    res.json(validBookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings (admin only) — remove bookings where event no longer exists
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find().populate('eventId').populate('userId', 'name email');

    // Delete invalid bookings where event was deleted
    const invalidBookings = bookings.filter(b => b.eventId === null);
    for (const b of invalidBookings) {
      await Booking.findByIdAndDelete(b._id);
    }

    // Return only valid bookings
    const validBookings = bookings.filter(b => b.eventId !== null);
    res.json(validBookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;