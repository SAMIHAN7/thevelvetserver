const express = require('express');
const Menu = require('../../Models/Menu');
const Event = require('../../Models/Events');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const mongoose = require('mongoose');
const router = express.Router();
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      description,
      images,
      capacity,
      password,
      startTime,
      endTime,
      registrationStart,
      registrationEnd
    } = req.body;

    if (!name || !description || !capacity || !startTime || !endTime || !registrationStart || !registrationEnd) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'Start time must be before end time.' });
    }

    if (new Date(registrationStart) >= new Date(registrationEnd)) {
      return res.status(400).json({ error: 'Registration start must be before registration end.' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUNDS) : undefined;

    const event = await Event.create({
      name,
      description,
      images,
      capacity,
      password: hashedPassword,
      startTime,
      endTime,
      registrationStart,
      registrationEnd
    });

    res.status(201).json({ message: 'Event created successfully.', data: event });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('attendees', 'name email phone'); // optional
    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID.' });
    }

    const event = await Event.findById(eventId).populate('attendees', 'name email phone');
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    res.json({success:true, event: event });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID.' });
    }

    // Check for time logic
    if (updateData.startTime && updateData.endTime) {
      if (new Date(updateData.startTime) >= new Date(updateData.endTime)) {
        return res.status(400).json({ error: 'Start time must be before end time.' });
      }
    }

    if (updateData.registrationStart && updateData.registrationEnd) {
      if (new Date(updateData.registrationStart) >= new Date(updateData.registrationEnd)) {
        return res.status(400).json({ error: 'Registration start must be before registration end.' });
      }
    }

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }

    const updated = await Event.findByIdAndUpdate(eventId, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'Event not found.' });

    res.json({success:true, message: 'Event updated.', updatedEvent: updated });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID.' });
    }

    const deleted = await Event.findByIdAndDelete(eventId);
    if (!deleted) return res.status(404).json({ error: 'Event not found.' });

    res.json({ message: 'Event deleted successfully.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;