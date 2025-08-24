const express = require('express');
const mongoose = require('mongoose');
const Gallery = require('../../Models/Gallery'); // adjust the path based on your folder structure

const router = express.Router();

// CREATE a gallery item
router.post('/', async (req, res) => {
  try {
    const { imageUrl, tag } = req.body;

    if (!imageUrl || !tag) {
      return res.status(400).json({ error: 'Both imageUrl and tag are required.' });
    }

    const validTags = ['ambience', 'food'];
    if (!validTags.includes(tag)) {
      return res.status(400).json({ error: 'Invalid tag. Use "ambience" or "food".' });
    }

    const newItem = await Gallery.create({ imageUrl, tag });
    res.status(201).json({ message: 'Gallery item created.', data: newItem });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all gallery items
router.get('/', async (req, res) => {
  try {
    const items = await Gallery.find();
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ single gallery item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }

    const item = await Gallery.findById(id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });

    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a gallery item by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl, tag } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }

    if (!imageUrl || !tag) {
      return res.status(400).json({ error: 'Both imageUrl and tag are required.' });
    }

    const validTags = ['ambience', 'food'];
    if (!validTags.includes(tag)) {
      return res.status(400).json({ error: 'Invalid tag. Use "ambience" or "food".' });
    }

    const updated = await Gallery.findByIdAndUpdate(
      id,
      { imageUrl, tag },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Gallery item not found.' });

    res.json({ message: 'Gallery item updated.', data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a gallery item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format.' });
    }

    const deleted = await Gallery.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: 'Gallery item not found.' });

    res.json({ message: 'Gallery item deleted successfully.', data: deleted });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// BULK DELETE gallery items
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'An array of valid IDs is required.' });
    }

    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: `Invalid ID(s): ${invalidIds.join(', ')}` });
    }

    const result = await Gallery.deleteMany({ _id: { $in: ids } });

    res.json({
      message: `${result.deletedCount} gallery item(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
