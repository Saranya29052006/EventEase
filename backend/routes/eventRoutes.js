const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const auth = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Get all events
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find expired events
    const expiredEvents = await Event.find({ date: { $lt: today } });

    // Delete expired events and their bookings
    for (const ev of expiredEvents) {
      await Booking.deleteMany({ eventId: ev._id });
      await Event.findByIdAndDelete(ev._id);
    }

    // Return only upcoming events
    const events = await Event.find({ date: { $gte: today } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id); // ✅ fixed

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (event.date < today) {
      await Booking.deleteMany({ eventId: event._id });
      await Event.findByIdAndDelete(event._id);
      return res.status(404).json({ message: 'Event has expired and been removed' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add event (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      category: req.body.category,
      price: Number(req.body.price),
      totalSeats: Number(req.body.totalSeats),
      availableSeats: Number(req.body.totalSeats), // ✅ use totalSeats as initial availableSeats
      image: req.file ? req.file.path : ''
    };
    const event = new Event(eventData);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Update event (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.path;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.log('Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Delete event (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    await Event.findByIdAndDelete(req.params.id);
    await Booking.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event and related bookings deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;