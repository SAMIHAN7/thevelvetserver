const express = require('express');
const Customer = require('../../../Models/Customer');
const Events = require('../../../Models/Events');
const router = express.Router();

// POST /web/landing/registration/verify-phone - Verify if phone number exists
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number (10 digits)
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.json({
        success: true,
        userExists: true,
        data: {
          id: existingCustomer._id,
          name: existingCustomer.name,
          email: existingCustomer.email,
          phone: existingCustomer.phone
        }
      });
    }

    return res.json({
      success: true,
      userExists: false,
      message: 'New user - collect details'
    });

  } catch (err) {
    console.error('Error verifying phone:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify phone number',
      message: err.message
    });
  }
});

// POST /web/landing/registration/register - Register user for event
router.post('/register', async (req, res) => {
  try {
    const { phone, name, email, eventId } = req.body;

    // Validate required fields
    if (!phone || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Phone number and event ID are required'
      });
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Find the event
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if registration is open
    const now = new Date();
    if (now < event.registrationStart || now > event.registrationEnd) {
      return res.status(400).json({
        success: false,
        error: 'Registration is not open',
        message: 'Event registration period has expired or not started yet'
      });
    }


    // Check if event is full
    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is full',
        message: 'Maximum capacity reached'
      });
    }

    let customer;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      customer = existingCustomer;
      
      // Check if already registered for this event
      if (event.attendees.includes(customer._id)) {
        // User is already registered - return success with a positive message
        const successMessages = [
          "🎉 Welcome back! You're already registered for this amazing event!",
          "✨ Great news! Your spot is already secured for this event!",
          "🎯 You're all set! Your registration is confirmed for this event!",
          "🔥 Awesome! You're already on the list for this epic night!",
          "🎆 Perfect! Your registration is active for this event!",
          "🎵 You're in! Your spot is reserved for this incredible event!",
          "🌈 Fantastic! You're already registered and ready to party!",
          "🚀 Excellent! Your registration is confirmed for this event!",
          "🎁 You're golden! Already registered for this amazing experience!",
          "🎪 Wonderful! Your ticket to fun is already secured!"
        ];
        
        const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        
        return res.json({
          success: true,
          message: randomMessage,
          alreadyRegistered: true,
          data: {
            customer: {
              id: customer._id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            },
            event: {
              id: event._id,
              name: event.name,
              startTime: event.startTime,
              endTime: event.endTime
            },
            registrationTime: customer.createdAt
          }
        });
      }
    } else {
      // Create new customer
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Missing customer details',
          message: 'Name and email are required for new users'
        });
      }

      // Validate email
      if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      try {
        customer = new Customer({ name, email, phone });
        await customer.save();
      } catch (customerErr) {
        if (customerErr.code === 11000) {
          if (customerErr.keyPattern.email) {
            return res.status(400).json({
              success: false,
              error: 'Email already exists',
              message: 'This email is already registered with another phone number'
            });
          }
          if (customerErr.keyPattern.phone) {
            return res.status(400).json({
              success: false,
              error: 'Phone number already exists'
            });
          }
        }
        throw customerErr;
      }
    }

    // Register customer for event
    event.attendees.push(customer._id);
    await event.save();

    // Generate random success message
    const successMessages = [
      "🎉 Welcome to the ultimate experience! Get ready to dance the night away!",
      "🔥 You're in! Prepare for an unforgettable night of music and magic!",
      "✨ Registration complete! The dance floor is calling your name!",
      "🎵 Awesome! You're all set for the most epic night of the year!",
      "🌟 Congratulations! Your spot is secured for this amazing event!",
      "💫 You're registered! Time to get your party shoes ready!",
      "🎊 Welcome aboard! This is going to be absolutely legendary!",
      "🚀 Success! Buckle up for an incredible night of entertainment!",
      "💃 You're in the club! Prepare for beats that'll move your soul!",
      "🎈 Registration successful! Let the countdown to fun begin!"
    ];

    const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];

    res.status(201).json({
      success: true,
      message: randomMessage,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        event: {
          id: event._id,
          name: event.name,
          startTime: event.startTime,
          endTime: event.endTime
        },
        registrationTime: new Date()
      }
    });

  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to register for event',
      message: err.message
    });
  }
});

// GET /web/landing/registration/event/:id - Get event details by ID
router.get('/event/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Events.findById(id)
      .select('name description images capacity startTime endTime registrationStart registrationEnd password attendees');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const eventData = {
      ...event.toObject(),
      availableSpots: Math.max(0, event.capacity - event.attendees.length),
      isFull: event.attendees.length >= event.capacity
    };

    delete eventData.attendees;

    res.json({
      success: true,
      data: eventData
    });

  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event details',
      message: err.message
    });
  }
});

module.exports = router;