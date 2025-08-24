const mongoose = require('mongoose');


const OfferSchema = new mongoose.Schema({
  offer: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  isLive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

const Offer = mongoose.model('Offer', OfferSchema);
module.exports = Offer;
// Exporting the model for use in other parts of the application