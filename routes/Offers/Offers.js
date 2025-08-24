
const express = require('express');
const mongoose = require('mongoose');
const Offer = require('../../Models/Offers.js'); // Adjust path as needed
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { offer, description, isLive } = req.body;

    if (!offer || !description) {
      return res.status(400).json({ error: 'Offer name and description are required.' });
    }

    const exists = await Offer.findOne({ offer });
    if (exists) return res.status(409).json({ error: 'Offer already exists.' });

    const newOffer = await Offer.create({ offer, description, isLive: !!isLive });

    res.status(201).json({ message: 'Offer created successfully.', data: newOffer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json({ data: offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/offer/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ error: 'Offer not found.' });

    res.json({ data: offer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/updateoffer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { offer, description, isLive } = req.body;
console.log(req.body);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const existing = await Offer.findOne({ offer, _id: { $ne: id } });
    if (existing) return res.status(409).json({ error: 'Another offer with the same name already exists.' });

    const updated = await Offer.findByIdAndUpdate(
      id,
      { offer, description, isLive },
      { new: true, runValidators: true }
    );
console.log(req.body, updated);


    if (!updated) return res.status(404).json({ error: 'Offer not found.' });

    res.json({ message: 'Offer updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/deletoffer/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const deleted = await Offer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Offer not found.' });

    res.json({ message: 'Offer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;