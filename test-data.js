// Sample test data for events
require('dotenv').config();
require('./db/db');
const Events = require('./Models/Events');
const Customer = require('./Models/Customer');

async function seedTestData() {
  try {
    // Clear existing data
    await Events.deleteMany({});
    await Customer.deleteMany({});

    // Create multiple sample events with different statuses
    const now = new Date();
    
    // Upcoming event
    const upcomingEvent = new Events({
      name: "NEON NIGHTS: Electric Dreams",
      description: "Experience the ultimate nightclub adventure with world-class DJs, mesmerizing light shows, and an atmosphere that will leave you breathless. Join us for an unforgettable night of music, dancing, and pure electric energy.",
      images: [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571266028243-d220c9c9b2a4?w=800&h=600&fit=crop"
      ],
      capacity: 200,
      startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
      registrationStart: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Started yesterday
      registrationEnd: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
      attendees: []
    });
    
    // Ongoing event
    const ongoingEvent = new Events({
      name: "MIDNIGHT MADNESS: Live Now",
      description: "The hottest party is happening RIGHT NOW! Amazing DJs, incredible atmosphere, and non-stop dancing until dawn.",
      images: [
        "https://images.unsplash.com/photo-1571266028243-d220c9c9b2a4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop"
      ],
      capacity: 150,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Started 2 hours ago
      endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Ends in 4 hours
      registrationStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
      registrationEnd: new Date(now.getTime() - 3 * 60 * 60 * 1000), // Ended 3 hours ago
      attendees: []
    });
    
    // Past event
    const pastEvent = new Events({
      name: "RETRO NIGHTS: Last Weekend",
      description: "What an incredible night it was! Thank you to everyone who joined us for this amazing throwback party with classic hits and vintage vibes.",
      images: [
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571266028243-d220c9c9b2a4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop"
      ],
      capacity: 180,
      startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
      registrationStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      registrationEnd: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      attendees: []
    });

    const [savedUpcomingEvent, savedOngoingEvent, savedPastEvent] = await Promise.all([
      upcomingEvent.save(),
      ongoingEvent.save(),
      pastEvent.save()
    ]);
    
    console.log('✅ Events created:');
    console.log(`   Upcoming: ${savedUpcomingEvent._id} - ${savedUpcomingEvent.name}`);
    console.log(`   Ongoing:  ${savedOngoingEvent._id} - ${savedOngoingEvent.name}`);
    console.log(`   Past:     ${savedPastEvent._id} - ${savedPastEvent.name}`);

    // Create a sample customer for testing existing user flow
    const sampleCustomer = new Customer({
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210"
    });

    const savedCustomer = await sampleCustomer.save();
    console.log('✅ Sample customer created:', savedCustomer._id);

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📱 Test URLs:');
    console.log(`   Upcoming event: http://localhost:3000/events/${savedUpcomingEvent._id}`);
    console.log(`   Ongoing event:  http://localhost:3000/events/${savedOngoingEvent._id}`);
    console.log(`   Past event:     http://localhost:3000/events/${savedPastEvent._id}`);
    console.log('\n👤 Test user phone: 9876543210');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();