const express = require('express');
const router = express.Router();

// Import individual landing page route modules
const eventsRouter = require('./events');
const menuRouter = require('./menu');
const galleryRouter = require('./gallery');
const registrationRouter = require('./registration');
const happyhoursRouter = require('./happyhours');
const offersRouter = require('./offers');

// Landing page routes
router.use('/events', eventsRouter);
router.use('/menu', menuRouter);
router.use('/gallery', galleryRouter);
router.use('/registration', registrationRouter);
router.use('/happyhours', happyhoursRouter);
router.use('/offers', offersRouter);

// GET /web/landing - Landing page overview data (all sections combined)
router.get('/', async (req, res) => {
  try {
    const Events = require('../../../Models/Events');
    const Menu = require('../../../Models/Menu');
    const Gallery = require('../../../Models/Gallery');
    const Offer = require('../../../Models/Offers');

    const now = new Date();

    // Get all landing page data in parallel
    const [upcomingEvents, menuCategories, ambienceImages, foodImages, liveOffers] = await Promise.all([
      // Get 4 upcoming events
      Events.find({ startTime: { $gt: now } })
        .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
        .sort({ startTime: 1 })
        .limit(4),
      
      // Get all menu categories
      Menu.find({}).select('category image subcategories'),
      
      // Get top 10 ambience images
      Gallery.find({ tag: 'ambience' })
        .select('imageUrl tag')
        .sort({ createdAt: -1 })
        .limit(10),
        
      // Get top 10 food images
      Gallery.find({ tag: 'food' })
        .select('imageUrl tag')
        .sort({ createdAt: -1 })
        .limit(10),
        
      // Get all live offers
      Offer.find({ isLive: true })
        .select('offer description isLive createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        events: {
          upcoming: upcomingEvents,
          total: upcomingEvents.length
        },
        menu: {
          categories: menuCategories,
          totalCategories: menuCategories.length
        },
        gallery: {
          ambience: ambienceImages,
          food: foodImages,
          totalAmbience: ambienceImages.length,
          totalFood: foodImages.length
        },
        offers: {
          live: liveOffers,
          totalLive: liveOffers.length,
          hasLiveOffers: liveOffers.length > 0
        },
        timestamp: new Date().toISOString()
      },
      message: 'Landing page data fetched successfully'
    });

  } catch (err) {
    console.error('Error fetching landing page overview:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch landing page data',
      message: err.message 
    });
  }
});

// GET /web/landing/stats - Get landing page statistics
router.get('/stats', async (req, res) => {
  try {
    const Events = require('../../../Models/Events');
    const Menu = require('../../../Models/Menu');
    const Gallery = require('../../../Models/Gallery');

    const [eventStats, menuStats, galleryStats] = await Promise.all([
      Events.countDocuments({ status: 'active' }),
      Menu.countDocuments({ status: 'active' }),
      Gallery.countDocuments({ status: 'active' })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents: eventStats,
          totalMenuItems: menuStats,
          totalGalleryImages: galleryStats
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Error fetching landing page stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats',
      message: err.message 
    });
  }
});

module.exports = router;