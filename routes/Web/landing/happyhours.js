const express = require('express');
const HappyHours = require('../../../Models/HappyHours');
const Menu = require('../../../Models/Menu');
const router = express.Router();

// Helper function to check if current time is within happy hours
function isCurrentlyHappyHour(startTime, endTime) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const currentMinutes = currentHour * 60 + currentMin;
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// GET /web/landing/happyhours - Get happy hours data for web frontend
router.get('/', async (req, res) => {
  try {
    const happyHoursData = await HappyHours.findOne();
    
    if (!happyHoursData) {
      return res.json({
        success: true,
        data: {
          exists: false,
          isLive: false,
          message: "Happy hours not configured"
        }
      });
    }

    // Check if happy hours are currently live
    const isLive = isCurrentlyHappyHour(happyHoursData.startTime, happyHoursData.endTime);

    res.json({
      success: true,
      data: {
        exists: true,
        isLive: isLive,
        startTime: happyHoursData.startTime,
        endTime: happyHoursData.endTime,
        image: happyHoursData.image,
        timeRange: `${happyHoursData.startTime} - ${happyHoursData.endTime}`,
        status: isLive ? 'LIVE' : `Available ${happyHoursData.startTime} - ${happyHoursData.endTime}`
      }
    });

  } catch (err) {
    console.error('Error fetching happy hours for web:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch happy hours data',
      message: err.message 
    });
  }
});

// GET /web/landing/happyhours/menu - Get all happy hours menu items organized by categories and subcategories
router.get('/menu', async (req, res) => {
  try {
    const happyHoursConfig = await HappyHours.findOne();
    
    if (!happyHoursConfig) {
      return res.json({
        success: false,
        error: 'Happy hours not configured'
      });
    }

    // Check if happy hours are currently live
    const isLive = isCurrentlyHappyHour(happyHoursConfig.startTime, happyHoursConfig.endTime);

    // Get all menu categories and filter for happy hour items
    const allMenus = await Menu.find({});
    
    const happyHourCategories = [];

    allMenus.forEach(category => {
      const categoryHappyHours = {
        category: category.category,
        image: category.image,
        subcategories: []
      };

      category.subcategories.forEach(subcategory => {
        const happyHourItems = subcategory.items.filter(item => item.isHappyHourActive);
        
        if (happyHourItems.length > 0) {
          categoryHappyHours.subcategories.push({
            name: subcategory.name,
            items: happyHourItems.map(item => ({
              _id: item._id,
              name: item.name,
              description: item.description,
              image: item.image,
              type: item.type,
              standardPrice: item.price.standard,
              happyHourPrice: item.price.happyHour,
              currentPrice: isLive ? (item.price.happyHour || item.price.standard) : item.price.standard,
              isHappyHourActive: item.isHappyHourActive,
              isCurrentlyDiscounted: isLive && item.price.happyHour
            }))
          });
        }
      });

      // Only add category if it has happy hour items
      if (categoryHappyHours.subcategories.length > 0) {
        happyHourCategories.push(categoryHappyHours);
      }
    });

    res.json({
      success: true,
      data: {
        happyHoursConfig: {
          exists: true,
          isLive: isLive,
          startTime: happyHoursConfig.startTime,
          endTime: happyHoursConfig.endTime,
          timeRange: `${happyHoursConfig.startTime} - ${happyHoursConfig.endTime}`,
          status: isLive ? 'LIVE' : `Available ${happyHoursConfig.startTime} - ${happyHoursConfig.endTime}`
        },
        categories: happyHourCategories,
        totalCategories: happyHourCategories.length,
        totalItems: happyHourCategories.reduce((total, cat) => 
          total + cat.subcategories.reduce((subTotal, subcat) => subTotal + subcat.items.length, 0), 0
        )
      }
    });

  } catch (err) {
    console.error('Error fetching happy hours menu:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch happy hours menu',
      message: err.message 
    });
  }
});

module.exports = router;