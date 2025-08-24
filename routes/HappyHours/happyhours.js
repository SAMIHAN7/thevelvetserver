const express = require('express');
const mongoose = require('mongoose');
const HappyHours = require('../../Models/HappyHours');

const router = express.Router();

// Helper to compare "HH:mm" time strings
function isValidTimeFormat(timeStr) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

function isEndTimeAfterStart(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh > sh || (eh === sh && em > sm);
}

// ✅ Create Happy Hours (only one allowed)
router.post('/', async (req, res) => {
  try {
    const { startTime, endTime, image } = req.body;

    if (!startTime || !endTime || !image) {
      return res.status(400).json({ error: 'Start time, end time, and image are required.' });
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({ error: 'Time must be in HH:mm format.' });
    }

    if (!isEndTimeAfterStart(startTime, endTime)) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    const exists = await HappyHours.findOne();
    if (exists) {
      return res.status(400).json({ error: 'Happy hours already exist. Please update the existing one.' });
    }

    const newHH = await HappyHours.create({ startTime, endTime, image });
    res.status(201).json({ message: 'Happy hours created.', data: newHH });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get the only Happy Hours entry
router.get('/', async (req, res) => {
  try {
    const data = await HappyHours.findOne();
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Update the single Happy Hours document by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID.' });
    }

    if (!startTime || !endTime || !image) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return res.status(400).json({ error: 'Time must be in HH:mm format.' });
    }

    if (!isEndTimeAfterStart(startTime, endTime)) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

    const updated = await HappyHours.findByIdAndUpdate(
      id,
      { startTime, endTime, image },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Happy hours not found.' });

    res.json({ message: 'Updated successfully.', data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
