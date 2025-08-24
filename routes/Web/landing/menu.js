const express = require('express');
const Menu = require('../../../Models/Menu');
const router = express.Router();

// GET /web/landing/menu - Get all menu categories with subcategories and items
router.get('/', async (req, res) => {
  try {
    // Get all menu categories with their complete structure
    const menuCategories = await Menu.find({})
    .select('category image subcategories');

    res.json({
      success: true,
      data: {
        categories: menuCategories,
        totalCategories: menuCategories.length
      }
    });

  } catch (err) {
    console.error('Error fetching landing page menu:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch menu',
      message: err.message 
    });
  }
});

// GET /web/landing/menu/categories - Get only category names and item counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Menu.find({})
      .select('category image subcategories');

    const categoryData = categories.map(cat => {
      // Count total items across all subcategories
      const totalItems = cat.subcategories.reduce((total, subcat) => {
        return total + (subcat.items ? subcat.items.length : 0);
      }, 0);

      return {
        name: cat.category,
        image: cat.image,
        totalItems: totalItems,
        subcategoriesCount: cat.subcategories.length
      };
    });

    res.json({
      success: true,
      data: {
        categories: categoryData,
        totalCategories: categoryData.length
      }
    });

  } catch (err) {
    console.error('Error fetching menu categories:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch menu categories',
      message: err.message 
    });
  }
});

// GET /web/landing/menu/:category - Get specific category with all subcategories and items
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const menuCategory = await Menu.findOne({ 
      category: new RegExp(`^${category}$`, 'i') 
    })
    .select('category image subcategories');

    if (!menuCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: menuCategory
    });

  } catch (err) {
    console.error('Error fetching menu category:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch menu category',
      message: err.message 
    });
  }
});

module.exports = router;