const mongoose = require('mongoose');


const EventSchema = new mongoose.Schema({
  name: { type: String, required: true }, // optional: add name/title of the event
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs or file paths
  capacity: { type: Number, required: true },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  registrationStart: { type: Date, required: true },
  registrationEnd: { type: Date, required: true },

  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }], // Reference to registered users

}, {
  timestamps: true // Adds createdAt and updatedAt
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
