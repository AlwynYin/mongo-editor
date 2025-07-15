// MongoDB Sample Data Import Script
const { MongoClient } = require('mongodb');

// Sample data collections
const sampleCollections = {
  users: [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      age: 28,
      department: "Engineering",
      salary: 75000,
      isActive: true,
      joinDate: new Date("2022-03-15"),
      skills: ["JavaScript", "React", "Node.js"],
      address: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94105"
      }
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com", 
      age: 32,
      department: "Design",
      salary: 68000,
      isActive: true,
      joinDate: new Date("2021-07-20"),
      skills: ["Figma", "Photoshop", "UI/UX"],
      address: {
        street: "456 Oak Ave",
        city: "New York",
        state: "NY", 
        zip: "10001"
      }
    },
    {
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      age: 35,
      department: "Marketing",
      salary: 62000,
      isActive: false,
      joinDate: new Date("2020-01-10"),
      skills: ["SEO", "Content Marketing", "Analytics"],
      address: {
        street: "789 Pine Rd",
        city: "Austin",
        state: "TX",
        zip: "73301"
      }
    },
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      age: 26,
      department: "Engineering",
      salary: 82000,
      isActive: true,
      joinDate: new Date("2023-01-05"),
      skills: ["Python", "Django", "PostgreSQL"],
      address: {
        street: "321 Elm St",
        city: "Seattle",
        state: "WA",
        zip: "98101"
      }
    },
    {
      name: "David Brown",
      email: "david.brown@example.com",
      age: 41,
      department: "Sales",
      salary: 95000,
      isActive: true,
      joinDate: new Date("2019-11-22"),
      skills: ["CRM", "Lead Generation", "Negotiation"],
      address: {
        street: "654 Maple Dr",
        city: "Boston",
        state: "MA",
        zip: "02108"
      }
    }
  ],
  products: [
    {
      name: "Wireless Headphones",
      category: "Electronics",
      price: 199.99,
      inStock: true,
      quantity: 45,
      description: "High-quality wireless headphones with noise cancellation",
      brand: "TechAudio",
      rating: 4.5,
      reviews: 128,
      createdAt: new Date("2023-06-15"),
      tags: ["wireless", "audio", "bluetooth"]
    },
    {
      name: "Coffee Maker",
      category: "Appliances", 
      price: 89.99,
      inStock: true,
      quantity: 23,
      description: "Programmable coffee maker with 12-cup capacity",
      brand: "BrewMaster",
      rating: 4.2,
      reviews: 89,
      createdAt: new Date("2023-05-20"),
      tags: ["coffee", "kitchen", "appliance"]
    },
    {
      name: "Running Shoes",
      category: "Sports",
      price: 129.99,
      inStock: false,
      quantity: 0,
      description: "Lightweight running shoes with advanced cushioning",
      brand: "RunFast",
      rating: 4.7,
      reviews: 203,
      createdAt: new Date("2023-04-10"),
      tags: ["shoes", "running", "sports"]
    },
    {
      name: "Laptop Stand",
      category: "Office",
      price: 49.99,
      inStock: true,
      quantity: 67,
      description: "Adjustable aluminum laptop stand for ergonomic viewing",
      brand: "WorkSpace",
      rating: 4.3,
      reviews: 156,
      createdAt: new Date("2023-07-01"),
      tags: ["laptop", "stand", "office"]
    }
  ],
  orders: [
    {
      orderId: "ORD-001",
      customerId: "CUST-123",
      customerName: "Alice Johnson",
      customerEmail: "alice@example.com",
      items: [
        { productId: "PROD-001", name: "Wireless Headphones", quantity: 1, price: 199.99 },
        { productId: "PROD-004", name: "Laptop Stand", quantity: 1, price: 49.99 }
      ],
      totalAmount: 249.98,
      status: "shipped",
      orderDate: new Date("2023-08-15"),
      shippingDate: new Date("2023-08-17"),
      shippingAddress: {
        street: "123 Customer St",
        city: "Portland",
        state: "OR",
        zip: "97201"
      }
    },
    {
      orderId: "ORD-002", 
      customerId: "CUST-456",
      customerName: "Bob Smith",
      customerEmail: "bob@example.com",
      items: [
        { productId: "PROD-002", name: "Coffee Maker", quantity: 1, price: 89.99 }
      ],
      totalAmount: 89.99,
      status: "delivered",
      orderDate: new Date("2023-08-10"),
      shippingDate: new Date("2023-08-12"),
      deliveryDate: new Date("2023-08-15"),
      shippingAddress: {
        street: "456 Buyer Ave",
        city: "Denver",
        state: "CO", 
        zip: "80201"
      }
    },
    {
      orderId: "ORD-003",
      customerId: "CUST-789", 
      customerName: "Carol Davis",
      customerEmail: "carol@example.com",
      items: [
        { productId: "PROD-003", name: "Running Shoes", quantity: 2, price: 129.99 }
      ],
      totalAmount: 259.98,
      status: "pending",
      orderDate: new Date("2023-08-20"),
      shippingAddress: {
        street: "789 Runner Rd",
        city: "Miami",
        state: "FL",
        zip: "33101"
      }
    }
  ]
};

async function importSampleData(mongoUrl, databaseName = 'test_db') {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(databaseName);
    
    // Import each collection
    for (const [collectionName, data] of Object.entries(sampleCollections)) {
      console.log(`Importing ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      
      // Clear existing data
      await collection.deleteMany({});
      
      // Insert sample data
      const result = await collection.insertMany(data);
      console.log(`Inserted ${result.insertedCount} documents into ${collectionName}`);
    }
    
    console.log('\nSample data import completed successfully!');
    console.log(`Database: ${databaseName}`);
    console.log('Collections created:');
    console.log('- users (5 documents)');
    console.log('- products (4 documents)'); 
    console.log('- orders (3 documents)');
    
  } catch (error) {
    console.error('Error importing sample data:', error);
  } finally {
    await client.close();
  }
}

// Usage
const mongoUrl = process.argv[2] || 'mongodb://localhost:27017';
const databaseName = process.argv[3] || 'test_db';

if (require.main === module) {
  importSampleData(mongoUrl, databaseName);
}

module.exports = { importSampleData };