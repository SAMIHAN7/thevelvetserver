const express = require('express');
const Admin = require('../../Models/Admin');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.PRIVATE_KEY || 'your-secret-key'; 
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Admin with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newAdmin = await Admin.create({ name, email, password: hashedPassword });

 return   res.status(201).json({
      message: 'Admin registered successfully.',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    });

  } catch (err) {
   return res.status(500).json({ error: err.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      JWT_SECRET,
    );

 return   res.json({
      message: 'Login successful.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (err) {
return    res.status(500).json({ error: err.message });
  }
});

// Protected admin routes
router.get('/dashboard', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    
    res.json({
      success: true,
      message: 'Admin dashboard accessed successfully.',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;