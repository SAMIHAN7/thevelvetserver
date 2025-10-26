const mongoose = require('mongoose');

// Variant Schema (for individual variants within an option group)
const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "VEG", "CHICKEN", "30ML"
  price: {
    standard: { type: Number, required: true },
    happyHour: { type: Number },
    isHappyHourActive: { type: Boolean, default: false }
  },
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Egg', 'None'],
    default: 'None'
  }
});

// Option Group Schema (for groups like "PENNE", "Spaghetti")
const OptionGroupSchema = new mongoose.Schema({
  title: { type: String }, // e.g., "PENNE", "Spaghetti" (optional)
  description: { type: String }, // e.g., "Choice Of Sace :- Creamy Alfredo..." (optional)
  variants: [VariantSchema] // Array of variants
});

const ItemSchema = new mongoose.Schema({
  name: {type:String, required: true},
  image:{type:String},
  description: {type:String},
  type: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Egg','None'],
    default: 'Veg'
  },
  // NEW: hasOptions flag
  hasOptions: {
    type: Boolean,
    default: false
  },
  // MODIFIED: price is now optional (not required when hasOptions = true)
  price: {
    standard: {type:Number,default:0}, // Removed required: true
    happyHour: {type:Number},
    isHappyHourActive: {type:Boolean,
    default: false
  }
},
  // NEW: optionGroups array
  optionGroups: [OptionGroupSchema]
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