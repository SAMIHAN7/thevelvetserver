const express = require('express');
const Menu = require('../../Models/Menu');
const Event = require('../../Models/Events');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const mongoose = require('mongoose');
const Customer = require('../../Models/Customer');
const router = express.Router();


router.post('/register/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone and email are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const now = new Date();
    if (now < new Date(event.registrationStart) || now > new Date(event.registrationEnd)) {
      return res.status(400).json({ error: 'Registration is not open for this event.' });
    }

    if (event.capacity <= event.attendees.length) {
      return res.status(400).json({ error: 'Event is full.' });
    }

    if (event.password) {
      if (!password) return res.status(400).json({ error: 'Event password required.' });

      const bcrypt = await import('bcrypt');
      const match = await bcrypt.compare(password, event.password);
      if (!match) return res.status(401).json({ error: 'Incorrect event password.' });
    }

    // Check if customer already exists
    let customer = await Customer.findOne({ email });

    if (!customer) {
      customer = await Customer.create({ name, phone, email });
    }

    // Check if already registered
    if (event.attendees.includes(customer._id)) {
      return res.status(409).json({ error: 'Already registered for this event.' });
    }

    // Add attendee
    event.attendees.push(customer._id);
    await event.save();

    res.status(200).json({ message: 'Registered successfully!', eventId, customerId: customer._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({ data: customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/customer', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required.' });
    }

    // Validate phone and email formats
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Check if customer already exists
    const exists = await Customer.findOne({ $or: [{ phone }, { email }] });
    if (exists) {
      return res.status(409).json({ error: 'Customer with this phone or email already exists.' });
    }

    // Create new customer
    const customer = await Customer.create({ name, phone, email });
    res.status(201).json({ message: 'Customer created successfully.', customer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    // Find all events where this customer is listed as an attendee
    const attendedEvents = await Event.find({ attendees: customerId }).select('name description startTime endTime');

    res.json({
      data: {
        customer,
        attendedEvents
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const exists = await Customer.findOne({
      $or: [{ phone }, { email }],
      _id: { $ne: customerId }
    });

    if (exists) {
      return res.status(409).json({ error: 'Another customer with this phone or email already exists.' });
    }

    const updated = await Customer.findByIdAndUpdate(customerId, { name, phone, email }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found.' });

    res.json({ message: 'Customer updated.', data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const deleted = await Customer.findByIdAndDelete(customerId);
    if (!deleted) return res.status(404).json({ error: 'Customer not found.' });

    res.json({ message: 'Customer deleted successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;