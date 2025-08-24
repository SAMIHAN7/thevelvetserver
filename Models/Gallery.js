const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        enum: ['ambience', 'food'],
        required: true
    }
});

module.exports = mongoose.model('Gallery', GallerySchema);