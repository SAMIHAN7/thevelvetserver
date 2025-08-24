const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {type:String, required: true},
  image:{type:String},
  description: {type:String},
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Egg'],
    default: 'Veg'
  },
  price: {
    standard: {type:Number,required:true},
    happyHour: {type:Number,},
    isHappyHourActive: {type:Boolean,
    default: false
  }
}
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Subcategory Schema
const SubcategorySchema = new mongoose.Schema({
  name: String,
  items: [ItemSchema]
});

// Direct Category Schema (as root model)
const CategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
required: true,
  },
  subcategories: [SubcategorySchema]
});

// Create model from CategorySchema directly
const Menu = mongoose.model('Menu', CategorySchema);
module.exports = Menu;
