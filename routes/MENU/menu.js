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
    const { name, image, description, type, price } = req.body;

    if (!name || !price?.standard) {
      return res.status(400).json({ error: 'Item name and standard price are required.' });
    }

    const allowedTypes = ['Veg', 'Non-Veg', 'Egg'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
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

    subcategory.items.push({
      name,
      image,
      description,
      type: type || 'Veg',
      price
    });

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
    const { name, image, description, type, price } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({ error: 'Invalid ID(s).' });
    }

    const allowedTypes = ['Veg', 'Non-Veg', 'Egg'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type.` });
    }

    if (price && typeof price.standard !== 'number') {
      return res.status(400).json({ error: 'Standard price must be a number.' });
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

    // Apply updates
    if (name !== undefined) item.name = name;
    if (image !== undefined) item.image = image;
    if (description !== undefined) item.description = description;
    if (type !== undefined) item.type = type;
    if (price !== undefined) item.price = price;

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
