const express = require('express');
const Gallery = require('../../../Models/Gallery');
const router = express.Router();

// GET /web/landing/gallery - Get top 10 images each for ambience and food tags
router.get('/', async (req, res) => {
  try {
    // Get top 10 ambience images
    const ambienceImages = await Gallery.find({ 
      tag: 'ambience' 
    })
    .select('imageUrl tag')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get top 10 food images
    const foodImages = await Gallery.find({ 
      tag: 'food' 
    })
    .select('imageUrl tag')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        ambience: ambienceImages,
        food: foodImages,
        totalAmbience: ambienceImages.length,
        totalFood: foodImages.length
      }
    });

  } catch (err) {
    console.error('Error fetching landing page gallery:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch gallery',
      message: err.message 
    });
  }
});

// GET /web/landing/gallery/ambience - Get ambience images
router.get('/ambience', async (req, res) => {
  try {
    const ambienceImages = await Gallery.find({ 
      tag: 'ambience'
    })
    .select('imageUrl tag')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: {
        tag: 'ambience',
        images: ambienceImages,
        total: ambienceImages.length
      }
    });

  } catch (err) {
    console.error('Error fetching ambience gallery:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ambience gallery',
      message: err.message 
    });
  }
});

// GET /web/landing/gallery/food - Get food images
router.get('/food', async (req, res) => {
  try {
    const foodImages = await Gallery.find({ 
      tag: 'food'
    })
    .select('imageUrl tag')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: {
        tag: 'food',
        images: foodImages,
        total: foodImages.length
      }
    });

  } catch (err) {
    console.error('Error fetching food gallery:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch food gallery',
      message: err.message 
    });
  }
});

// GET /web/landing/gallery/stats - Get gallery statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Gallery.aggregate([
      { 
        $group: { 
          _id: '$tag', 
          count: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const statsData = {
      ambience: 0,
      food: 0,
      total: 0
    };

    stats.forEach(stat => {
      statsData[stat._id] = stat.count;
      statsData.total += stat.count;
    });

    res.json({
      success: true,
      data: statsData
    });

  } catch (err) {
    console.error('Error fetching gallery stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch gallery stats',
      message: err.message 
    });
  }
});

module.exports = router;