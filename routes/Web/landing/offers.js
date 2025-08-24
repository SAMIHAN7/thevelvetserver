const express = require('express');
const Offer = require('../../../Models/Offers');
const router = express.Router();

// GET /web/landing/offers - Get all live offers for web frontend
router.get('/', async (req, res) => {
  try {
    // Get all live offers
    const offers = await Offer.find({ isLive: true })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('offer description isLive createdAt updatedAt');

    res.json({
      success: true,
      data: {
        offers: offers,
        totalOffers: offers.length,
        hasLiveOffers: offers.length > 0
      }
    });

  } catch (err) {
    console.error('Error fetching offers for web:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offers',
      message: err.message 
    });
  }
});

// GET /web/landing/offers/all - Get all offers (both live and inactive) for web frontend
router.get('/all', async (req, res) => {
  try {
    // Get all offers regardless of status
    const offers = await Offer.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('offer description isLive createdAt updatedAt');

    // Separate live and inactive offers
    const liveOffers = offers.filter(offer => offer.isLive);
    const inactiveOffers = offers.filter(offer => !offer.isLive);

    res.json({
      success: true,
      data: {
        allOffers: offers,
        liveOffers: liveOffers,
        inactiveOffers: inactiveOffers,
        totalOffers: offers.length,
        totalLiveOffers: liveOffers.length,
        totalInactiveOffers: inactiveOffers.length,
        hasLiveOffers: liveOffers.length > 0
      }
    });

  } catch (err) {
    console.error('Error fetching all offers for web:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch all offers',
      message: err.message 
    });
  }
});

// GET /web/landing/offers/:id - Get specific offer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id)
      .select('offer description isLive createdAt updatedAt');

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
    }

    res.json({
      success: true,
      data: offer
    });

  } catch (err) {
    console.error('Error fetching offer by ID:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offer',
      message: err.message 
    });
  }
});

module.exports = router;