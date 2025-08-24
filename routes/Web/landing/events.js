const express = require('express');
const Events = require('../../../Models/Events');
const router = express.Router();

// GET /web/landing/events - Get upcoming 4 events for landing page
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    // Get 4 upcoming events that haven't started yet
    const upcomingEvents = await Events.find({ 
      startTime: { $gt: now }
    })
    .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
    .sort({ startTime: 1 })
    .limit(4);

    res.json({
      success: true,
      data: {
        upcoming: upcomingEvents,
        total: upcomingEvents.length
      }
    });

  } catch (err) {
    console.error('Error fetching landing page events:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch events',
      message: err.message 
    });
  }
});

// GET /web/landing/events/next - Get the next upcoming event
router.get('/next', async (req, res) => {
  try {
    const now = new Date();
    
    const nextEvent = await Events.findOne({ 
      startTime: { $gt: now }
    })
    .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
    .sort({ startTime: 1 });

    res.json({
      success: true,
      data: nextEvent
    });

  } catch (err) {
    console.error('Error fetching next event:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch next event',
      message: err.message 
    });
  }
});

// GET /web/landing/events/all - Get all events categorized for events page
router.get('/all', async (req, res) => {
  try {
    const now = new Date();
    
    // Get all events with attendees populated
    const allEvents = await Events.find()
      .populate('attendees', 'name email phone')
      .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
      .sort({ startTime: 1 });

    // Categorize events
    const upcoming = [];
    const ongoing = [];
    const past = [];

    allEvents.forEach(event => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);

      if (now < startTime) {
        upcoming.push(event);
      } else if (now >= startTime && now <= endTime) {
        ongoing.push(event);
      } else {
        past.push(event);
      }
    });

    res.json({
      success: true,
      data: {
        upcoming,
        ongoing,
        past,
        total: allEvents.length
      }
    });

  } catch (err) {
    console.error('Error fetching all events:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch all events',
      message: err.message 
    });
  }
});

// GET /web/landing/events/upcoming - Get only upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const { page = 1, limit = 6 } = req.query;
    
    const upcomingEvents = await Events.find({ 
      startTime: { $gt: now }
    })
    .populate('attendees', 'name email phone')
    .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
    .sort({ startTime: 1 })
    .limit(limit * page);

    res.json({
      success: true,
      data: upcomingEvents,
      hasMore: upcomingEvents.length === (limit * page)
    });

  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch upcoming events',
      message: err.message 
    });
  }
});

// GET /web/landing/events/ongoing - Get only ongoing events
router.get('/ongoing', async (req, res) => {
  try {
    const now = new Date();
    
    const ongoingEvents = await Events.find({ 
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
    .populate('attendees', 'name email phone')
    .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
    .sort({ startTime: 1 });

    res.json({
      success: true,
      data: ongoingEvents
    });

  } catch (err) {
    console.error('Error fetching ongoing events:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ongoing events',
      message: err.message 
    });
  }
});

// GET /web/landing/events/past - Get only past events
router.get('/past', async (req, res) => {
  try {
    const now = new Date();
    const { page = 1, limit = 6 } = req.query;
    
    const pastEvents = await Events.find({ 
      endTime: { $lt: now }
    })
    .populate('attendees', 'name email phone')
    .select('name description images capacity startTime endTime registrationStart registrationEnd attendees')
    .sort({ startTime: -1 })
    .limit(limit * page);

    res.json({
      success: true,
      data: pastEvents,
      hasMore: pastEvents.length === (limit * page)
    });

  } catch (err) {
    console.error('Error fetching past events:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch past events',
      message: err.message 
    });
  }
});

module.exports = router;