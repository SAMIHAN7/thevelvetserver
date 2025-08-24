const mongoose = require('mongoose');


const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/ // Adjust for your format/region
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const Customer = mongoose.model('Customer', CustomerSchema);

module.exports = Customer;
