// E-commerce test data - Perfect for MongoDB editor testing
const { MongoClient, ObjectId } = require('mongodb');

const ecommerceCollections = {
  customers: [
    {
      customerId: "CUST001",
      firstName: "Alice",
      lastName: "Johnson", 
      email: "alice.johnson@email.com",
      age: 28,
      city: "New York",
      state: "NY",
      zipCode: "10001",
      isVip: false,
      totalSpent: 1250.50,
      lastOrderDate: new Date("2024-01-15"),
      joinDate: new Date("2023-06-10"),
      phoneNumber: "+1-555-2001"
    },
    {
      customerId: "CUST002",
      firstName: "Bob", 
      lastName: "Smith",
      email: "bob.smith@email.com",
      age: 35,
      city: "Los Angeles",
      state: "CA", 
      zipCode: "90210",
      isVip: true,
      totalSpent: 3450.75,
      lastOrderDate: new Date("2024-01-20"),
      joinDate: new Date("2022-03-15"),
      phoneNumber: "+1-555-2002"
    },
    {
      customerId: "CUST003", 
      firstName: "Carol",
      lastName: "Williams",
      email: "carol.williams@email.com",
      age: 42,
      city: "Chicago", 
      state: "IL",
      zipCode: "60601",
      isVip: true,
      totalSpent: 2890.25,
      lastOrderDate: new Date("2024-01-18"),
      joinDate: new Date("2023-01-20"),
      phoneNumber: "+1-555-2003"
    },
    {
      customerId: "CUST004",
      firstName: "David",
      lastName: "Brown",
      email: "david.brown@email.com",
      age: 29,
      city: "Miami",
      state: "FL",
      zipCode: "33101", 
      isVip: false,
      totalSpent: 567.80,
      lastOrderDate: new Date("2024-01-12"),
      joinDate: new Date("2023-11-05"),
      phoneNumber: "+1-555-2004"
    }
  ],
  
  products: [
    {
      productId: "PROD001",
      name: "Wireless Headphones",
      category: "Electronics",
      brand: "TechSound",
      price: 199.99,
      costPrice: 120.00,
      inStock: true,
      stockQuantity: 45,
      isDiscounted: false,
      weight: 0.8,
      launchDate: new Date("2023-05-15"),
      rating: 4.5,
      reviewCount: 128
    },
    {
      productId: "PROD002",
      name: "Coffee Maker",
      category: "Appliances",
      brand: "BrewMaster",
      price: 89.99,
      costPrice: 55.00,
      inStock: true,
      stockQuantity: 23,
      isDiscounted: true,
      weight: 3.2,
      launchDate: new Date("2023-03-20"), 
      rating: 4.2,
      reviewCount: 89
    },
    {
      productId: "PROD003",
      name: "Running Shoes",
      category: "Sports",
      brand: "RunFast",
      price: 129.99,
      costPrice: 70.00,
      inStock: false,
      stockQuantity: 0,
      isDiscounted: false,
      weight: 1.1,
      launchDate: new Date("2023-02-10"),
      rating: 4.7,
      reviewCount: 203
    },
    {
      productId: "PROD004",
      name: "Laptop Stand",
      category: "Office",
      brand: "WorkSpace",
      price: 49.99,
      costPrice: 25.00,
      inStock: true,
      stockQuantity: 67,
      isDiscounted: true,
      weight: 2.5,
      launchDate: new Date("2023-07-01"),
      rating: 4.3,
      reviewCount: 156
    },
    {
      productId: "PROD005",
      name: "Gaming Mouse",
      category: "Electronics", 
      brand: "GamePro",
      price: 79.99,
      costPrice: 45.00,
      inStock: true,
      stockQuantity: 31,
      isDiscounted: false,
      weight: 0.3,
      launchDate: new Date("2023-09-12"),
      rating: 4.6,
      reviewCount: 94
    }
  ],

  orders: [
    {
      orderId: "ORD001",
      customerId: "CUST001",
      customerName: "Alice Johnson",
      productId: "PROD001",
      productName: "Wireless Headphones",
      quantity: 1,
      unitPrice: 199.99,
      totalAmount: 199.99,
      orderDate: new Date("2024-01-15"),
      shippedDate: new Date("2024-01-17"),
      deliveredDate: new Date("2024-01-20"),
      status: "delivered",
      paymentMethod: "credit_card",
      isExpressShipping: false
    },
    {
      orderId: "ORD002",
      customerId: "CUST002", 
      customerName: "Bob Smith",
      productId: "PROD002",
      productName: "Coffee Maker",
      quantity: 2,
      unitPrice: 89.99,
      totalAmount: 179.98,
      orderDate: new Date("2024-01-20"),
      shippedDate: new Date("2024-01-21"),
      deliveredDate: null,
      status: "shipped",
      paymentMethod: "paypal",
      isExpressShipping: true
    },
    {
      orderId: "ORD003",
      customerId: "CUST003",
      customerName: "Carol Williams",
      productId: "PROD004",
      productName: "Laptop Stand", 
      quantity: 3,
      unitPrice: 49.99,
      totalAmount: 149.97,
      orderDate: new Date("2024-01-18"),
      shippedDate: null,
      deliveredDate: null,
      status: "processing",
      paymentMethod: "debit_card",
      isExpressShipping: false
    },
    {
      orderId: "ORD004",
      customerId: "CUST004",
      customerName: "David Brown",
      productId: "PROD005",
      productName: "Gaming Mouse",
      quantity: 1,
      unitPrice: 79.99,
      totalAmount: 79.99,
      orderDate: new Date("2024-01-12"),
      shippedDate: new Date("2024-01-14"),
      deliveredDate: new Date("2024-01-16"),
      status: "delivered",
      paymentMethod: "credit_card",
      isExpressShipping: true
    }
  ],

  reviews: [
    {
      reviewId: "REV001",
      customerId: "CUST001",
      customerName: "Alice Johnson",
      productId: "PROD001", 
      productName: "Wireless Headphones",
      rating: 5,
      title: "Excellent sound quality!",
      comment: "These headphones exceeded my expectations. Great bass and clarity.",
      isVerifiedPurchase: true,
      isHelpful: true,
      helpfulVotes: 12,
      reviewDate: new Date("2024-01-25"),
      wouldRecommend: true
    },
    {
      reviewId: "REV002",
      customerId: "CUST002",
      customerName: "Bob Smith", 
      productId: "PROD002",
      productName: "Coffee Maker",
      rating: 4,
      title: "Good value for money",
      comment: "Makes decent coffee, easy to use. Wish it had a timer feature.",
      isVerifiedPurchase: true,
      isHelpful: true,
      helpfulVotes: 8,
      reviewDate: new Date("2024-01-28"),
      wouldRecommend: true
    },
    {
      reviewId: "REV003",
      customerId: "CUST003",
      customerName: "Carol Williams",
      productId: "PROD004",
      productName: "Laptop Stand",
      rating: 5,
      title: "Perfect for home office",
      comment: "Sturdy build, adjustable height. Great for ergonomics.",
      isVerifiedPurchase: true,
      isHelpful: true, 
      helpfulVotes: 15,
      reviewDate: new Date("2024-01-30"),
      wouldRecommend: true
    }
  ]
};

async function importEcommerceData(mongoUrl, databaseName = 'ecommerce_test_db') {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(databaseName);
    
    // Import each collection
    for (const [collectionName, data] of Object.entries(ecommerceCollections)) {
      console.log(`Importing ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      
      // Clear existing data
      await collection.deleteMany({});
      
      // Insert sample data
      const result = await collection.insertMany(data);
      console.log(`✓ Inserted ${result.insertedCount} documents into ${collectionName}`);
    }
    
    console.log('\n🛍️ E-commerce test data import completed successfully!');
    console.log(`Database: ${databaseName}`);
    console.log('\n📋 Collections created:');
    console.log('👥 customers (4 documents) - Customer profiles with VIP status');
    console.log('📦 products (5 documents) - Product catalog with prices and inventory');
    console.log('🛒 orders (4 documents) - Order history with shipping status');
    console.log('⭐ reviews (3 documents) - Product reviews and ratings');
    
    console.log('\n✨ Perfect for testing the MongoDB Editor:');
    console.log('- Realistic e-commerce data relationships');
    console.log('- All scalar fields (no nested objects)');
    console.log('- Mixed data types: strings, numbers, booleans, dates, nulls');
    console.log('- Great for testing editing workflows');
    
  } catch (error) {
    console.error('❌ Error importing e-commerce test data:', error);
  } finally {
    await client.close();
  }
}

// Usage
const mongoUrl = process.argv[2] || 'mongodb://localhost:27017';
const databaseName = process.argv[3] || 'ecommerce_test_db';

if (require.main === module) {
  importEcommerceData(mongoUrl, databaseName);
}

module.exports = { importEcommerceData };