const mongoose = require('mongoose');

const HappyHourSchema = new mongoose.Schema({
  startTime: {
    type: String, // "HH:mm"
    required: true
  },
  endTime: {
    type: String, // "HH:mm"
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isLive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const HappyHours = mongoose.model('HappyHours', HappyHourSchema);

module.exports = HappyHours;
