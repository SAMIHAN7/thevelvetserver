const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Menu = require('../../Models/Menu');

router.post('/create', async (req, res) => {
  try {
    const { category, image, subcategories } = req.body;

    if (!category || !image) {
      return res.status(400).json({ error: 'Category name and image are required.' });
    }

    const exists = await Menu.findOne({ category });
    if (exists) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const newCategory = await Menu.create({ category, image, subcategories: subcategories || [] });
    res.status(201).json({ message: 'Category created successfully.', data: newCategory });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subcategory/create/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const duplicate = categoryDoc.subcategories.find(sc => sc.name === name);
    if (duplicate) {
      return res.status(409).json({ error: 'Subcategory already exists in this category.' });
    }

    categoryDoc.subcategories.push({ name, items: items || [] });
    await categoryDoc.save();

    res.status(201).json({ message: 'Subcategory added successfully.', data: categoryDoc });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/item/create/:categoryId/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name, image, description, type, price, hasOptions, optionGroups } = req.body;

    // Validate item name
    if (!name) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    // Validate based on hasOptions flag
    if (hasOptions) {
      // If item has options, validate optionGroups
      if (!optionGroups || !Array.isArray(optionGroups) || optionGroups.length === 0) {
        return res.status(400).json({ error: 'Option groups are required when hasOptions is true.' });
      }

      // Validate each option group
      for (let i = 0; i < optionGroups.length; i++) {
        const group = optionGroups[i];

        // Validate variants array exists
        if (!group.variants || !Array.isArray(group.variants) || group.variants.length === 0) {
          return res.status(400).json({ error: `Option group ${i + 1} must have at least one variant.` });
        }

        // Validate each variant
        for (let j = 0; j < group.variants.length; j++) {
          const variant = group.variants[j];

          if (!variant.name) {
            return res.status(400).json({ error: `Variant ${j + 1} in option group ${i + 1} must have a name.` });
          }

          if (!variant.price || typeof variant.price.standard !== 'number') {
            return res.status(400).json({ error: `Variant ${j + 1} in option group ${i + 1} must have a valid standard price.` });
          }

          // Validate variant type if provided
          const allowedTypes = ['Veg', 'Non-Veg', 'Egg', 'None'];
          if (variant.type && !allowedTypes.includes(variant.type)) {
            return res.status(400).json({ error: `Invalid type for variant ${j + 1} in option group ${i + 1}.` });
          }
        }
      }
    } else {
      // If item doesn't have options, require standard price
      if (!price || typeof price.standard !== 'number') {
        return res.status(400).json({ error: 'Standard price is required when hasOptions is false.' });
      }

      // Validate item type
      const allowedTypes = ['Veg', 'Non-Veg', 'Egg', 'None'];
      if (type && !allowedTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ error: 'Invalid category or subcategory ID.' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const exists = subcategory.items.find(item => item.name === name);
    if (exists) return res.status(409).json({ error: 'Item already exists in this subcategory.' });

    // Create item object based on hasOptions
    const newItem = {
      name,
      image,
      description,
      type: type || 'Veg',
      hasOptions: hasOptions || false
    };

    if (hasOptions) {
      newItem.optionGroups = optionGroups;
    } else {
      newItem.price = price;
    }

    subcategory.items.push(newItem);

    await categoryDoc.save();
    res.status(201).json({ message: 'Item added successfully.', data: subcategory.items });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/updatecategory/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { category, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    if (!category || !image) {
      return res.status(400).json({ error: 'Category name and image are required.' });
    }

    const existing = await Menu.findOne({ category, _id: { $ne: categoryId } });
    if (existing) {
      return res.status(409).json({ error: 'Another category with this name already exists.' });
    }

    const updated = await Menu.findByIdAndUpdate(
      categoryId,
      { category, image },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Category not found.' });

    res.json({ message: 'Category updated successfully.', data: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/updatesubcategory/:categoryId/:subcategoryId", async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const duplicate = categoryDoc.subcategories.find(sc => sc.name === name && sc._id.toString() !== subcategoryId);
    if (duplicate) return res.status(409).json({ error: 'Subcategory with same name already exists.' });

    subcategory.name = name;
    await categoryDoc.save();

    res.json({ message: 'Subcategory updated successfully.', data: subcategory });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/updateitem/:categoryId/:subcategoryId/:itemId', async (req, res) => {
  try {
    const { categoryId, subcategoryId, itemId } = req.params;
    const { name, image, description, type, price, hasOptions, optionGroups } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const item = subcategory.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Check for duplicate item name
    if (name) {
      const duplicate = subcategory.items.find(i => i.name === name && i._id.toString() !== itemId);
      if (duplicate) return res.status(409).json({ error: 'Another item with this name already exists.' });
    }

    // Validate based on hasOptions flag if being updated
    if (hasOptions !== undefined) {
      if (hasOptions) {
        // If switching to hasOptions, validate optionGroups
        if (!optionGroups || !Array.isArray(optionGroups) || optionGroups.length === 0) {
          return res.status(400).json({ error: 'Option groups are required when hasOptions is true.' });
        }

        // Validate each option group
        for (let i = 0; i < optionGroups.length; i++) {
          const group = optionGroups[i];

          if (!group.variants || !Array.isArray(group.variants) || group.variants.length === 0) {
            return res.status(400).json({ error: `Option group ${i + 1} must have at least one variant.` });
          }

          for (let j = 0; j < group.variants.length; j++) {
            const variant = group.variants[j];

            if (!variant.name) {
              return res.status(400).json({ error: `Variant ${j + 1} in option group ${i + 1} must have a name.` });
            }

            if (!variant.price || typeof variant.price.standard !== 'number') {
              return res.status(400).json({ error: `Variant ${j + 1} in option group ${i + 1} must have a valid standard price.` });
            }

            const allowedTypes = ['Veg', 'Non-Veg', 'Egg', 'None'];
            if (variant.type && !allowedTypes.includes(variant.type)) {
              return res.status(400).json({ error: `Invalid type for variant ${j + 1} in option group ${i + 1}.` });
            }
          }
        }
      } else {
        // If switching to non-options, validate price
        if (!price || typeof price.standard !== 'number') {
          return res.status(400).json({ error: 'Standard price is required when hasOptions is false.' });
        }
      }
    } else {
      // If hasOptions is not being changed, validate existing structure
      if (item.hasOptions && optionGroups !== undefined) {
        // Validate optionGroups if provided
        if (!Array.isArray(optionGroups) || optionGroups.length === 0) {
          return res.status(400).json({ error: 'Option groups array cannot be empty for items with options.' });
        }
      } else if (!item.hasOptions && price !== undefined) {
        // Validate price if provided for non-option items
        if (typeof price.standard !== 'number') {
          return res.status(400).json({ error: 'Standard price must be a number.' });
        }
      }
    }

    // Validate type if provided
    const allowedTypes = ['Veg', 'Non-Veg', 'Egg', 'None'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type.` });
    }

    // Apply updates
    if (name !== undefined) item.name = name;
    if (image !== undefined) item.image = image;
    if (description !== undefined) item.description = description;
    if (type !== undefined) item.type = type;

    // Update hasOptions and related fields
    if (hasOptions !== undefined) {
      item.hasOptions = hasOptions;

      if (hasOptions) {
        // Switching to options mode
        item.optionGroups = optionGroups;
        item.price = { standard: 0, happyHour: 0, isHappyHourActive: false }; // Clear price
      } else {
        // Switching to non-options mode
        item.price = price;
        item.optionGroups = []; // Clear option groups
      }
    } else {
      // hasOptions not changed, update respective fields
      if (item.hasOptions && optionGroups !== undefined) {
        item.optionGroups = optionGroups;
      } else if (!item.hasOptions && price !== undefined) {
        item.price = price;
      }
    }

    await categoryDoc.save();
    res.json({ message: 'Food item updated successfully.', data: item });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const deleted = await Menu.findByIdAndDelete(categoryId);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category deleted successfully.', data: deleted });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subcategory/:categoryId/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    // ✅ Use pull to remove subdocument
    categoryDoc.subcategories.pull(subcategoryId);
    await categoryDoc.save();

    return res.json({ message: 'Subcategory deleted successfully.', data: categoryDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});


router.delete('/item/:categoryId/:subcategoryId/:itemId', async (req, res) => {
  try {
    const { categoryId, subcategoryId, itemId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const item = subcategory.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // ✅ Use pull to remove item
    subcategory.items.pull(itemId);
    await categoryDoc.save();

  return  res.json({ message: 'Item deleted successfully.', data: subcategory.items });

  } catch (error) {
  return  res.status(500).json({ error: error.message });
  }
});

// DELETE option group from an item
router.delete('/item/:categoryId/:subcategoryId/:itemId/optiongroup/:optionGroupId', async (req, res) => {
  try {
    const { categoryId, subcategoryId, itemId, optionGroupId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId) ||
      !mongoose.Types.ObjectId.isValid(optionGroupId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const item = subcategory.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    if (!item.hasOptions || !item.optionGroups) {
      return res.status(400).json({ error: 'Item does not have option groups.' });
    }

    const optionGroup = item.optionGroups.id(optionGroupId);
    if (!optionGroup) return res.status(404).json({ error: 'Option group not found.' });

    // Remove the option group
    item.optionGroups.pull(optionGroupId);

    // If no option groups left, you might want to switch hasOptions to false
    if (item.optionGroups.length === 0) {
      item.hasOptions = false;
      item.price = { standard: 0, happyHour: 0, isHappyHourActive: false };
    }

    await categoryDoc.save();

    return res.json({
      message: 'Option group deleted successfully.',
      data: item
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE variant from an option group
router.delete('/item/:categoryId/:subcategoryId/:itemId/optiongroup/:optionGroupId/variant/:variantId', async (req, res) => {
  try {
    const { categoryId, subcategoryId, itemId, optionGroupId, variantId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId) ||
      !mongoose.Types.ObjectId.isValid(optionGroupId) ||
      !mongoose.Types.ObjectId.isValid(variantId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const categoryDoc = await Menu.findById(categoryId);
    if (!categoryDoc) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = categoryDoc.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const item = subcategory.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    if (!item.hasOptions || !item.optionGroups) {
      return res.status(400).json({ error: 'Item does not have option groups.' });
    }

    const optionGroup = item.optionGroups.id(optionGroupId);
    if (!optionGroup) return res.status(404).json({ error: 'Option group not found.' });

    const variant = optionGroup.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: 'Variant not found.' });

    // Check if this is the last variant in the option group
    if (optionGroup.variants.length === 1) {
      return res.status(400).json({
        error: 'Cannot delete the last variant. Delete the option group instead or add another variant first.'
      });
    }

    // Remove the variant
    optionGroup.variants.pull(variantId);

    await categoryDoc.save();

    return res.json({
      message: 'Variant deleted successfully.',
      data: item
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


router.get('/categories', async (req, res) => {
  try {
    const categories = await Menu.find();
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    res.json({ data: category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category/:categoryId/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log(categoryId);

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    res.json({ data: category.subcategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category/:categoryId/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    res.json({ data: category.subcategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category/:categoryId/subcategory/:subcategoryId/items', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    res.json({ data: subcategory.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category/:categoryId/subcategory/:subcategoryId/item/:itemId', async (req, res) => {
  try {
    const { categoryId, subcategoryId, itemId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const category = await Menu.findById(categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found.' });

    const item = subcategory.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    res.json({ data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
