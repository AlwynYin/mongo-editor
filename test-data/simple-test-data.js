// MongoDB Editor Test Data - NO NESTED JSON - Perfect for testing editing functionality
const { MongoClient, ObjectId } = require('mongodb');

// Simple flat datasets - ideal for the MongoDB editor
const simpleCollections = {
  employees: [
    {
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      age: 28,
      salary: 75000,
      department: "Engineering",
      isActive: true,
      hireDate: new Date("2022-03-15"),
      phoneNumber: "+1-555-0123",
      rating: 4.5
    },
    {
      employeeId: "EMP002", 
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@company.com",
      age: 32,
      salary: 68000,
      department: "Design",
      isActive: true,
      hireDate: new Date("2021-07-20"),
      phoneNumber: "+1-555-0124",
      rating: 4.8
    },
    {
      employeeId: "EMP003",
      firstName: "Mike",
      lastName: "Johnson", 
      email: "mike.johnson@company.com",
      age: 35,
      salary: 62000,
      department: "Marketing",
      isActive: false,
      hireDate: new Date("2020-01-10"),
      phoneNumber: "+1-555-0125",
      rating: 3.9
    },
    {
      employeeId: "EMP004",
      firstName: "Sarah",
      lastName: "Wilson",
      email: "sarah.wilson@company.com", 
      age: 26,
      salary: 82000,
      department: "Engineering",
      isActive: true,
      hireDate: new Date("2023-01-05"),
      phoneNumber: "+1-555-0126",
      rating: 4.7
    },
    {
      employeeId: "EMP005",
      firstName: "David",
      lastName: "Brown",
      email: "david.brown@company.com",
      age: 41,
      salary: 95000,
      department: "Sales",
      isActive: true,
      hireDate: new Date("2019-11-22"),
      phoneNumber: "+1-555-0127",
      rating: 4.2
    }
  ],
  books: [
    {
      isbn: "978-0-123456-78-9",
      title: "The Great Adventure",
      author: "Alice Johnson",
      publishYear: 2020,
      pages: 324,
      price: 19.99,
      inStock: true,
      genre: "Fiction",
      publishedDate: new Date("2020-05-15"),
      rating: 4.6,
      language: "English"
    },
    {
      isbn: "978-0-987654-32-1", 
      title: "Learning React",
      author: "Bob Developer",
      publishYear: 2023,
      pages: 456,
      price: 39.99,
      inStock: true,
      genre: "Technology",
      publishedDate: new Date("2023-03-20"),
      rating: 4.8,
      language: "English"
    },
    {
      isbn: "978-0-555666-77-8",
      title: "Cooking Basics", 
      author: "Chef Maria",
      publishYear: 2019,
      pages: 280,
      price: 24.99,
      inStock: false,
      genre: "Cooking",
      publishedDate: new Date("2019-09-10"),
      rating: 4.3,
      language: "English"
    },
    {
      isbn: "978-0-111222-33-4",
      title: "History of Art",
      author: "Dr. Smith",
      publishYear: 2021,
      pages: 520,
      price: 49.99,
      inStock: true,
      genre: "Education",
      publishedDate: new Date("2021-11-05"),
      rating: 4.1,
      language: "English"
    }
  ],
  students: [
    {
      studentId: "STU2024001",
      firstName: "Emma",
      lastName: "Williams",
      email: "emma.williams@university.edu",
      age: 20,
      gpa: 3.8,
      major: "Computer Science",
      isEnrolled: true,
      enrollmentDate: new Date("2023-08-15"),
      graduationYear: 2027,
      creditsCompleted: 45,
      phone: "+1-555-1001"
    },
    {
      studentId: "STU2024002",
      firstName: "James",
      lastName: "Davis",
      email: "james.davis@university.edu", 
      age: 19,
      gpa: 3.6,
      major: "Mathematics",
      isEnrolled: true,
      enrollmentDate: new Date("2023-08-15"),
      graduationYear: 2027,
      creditsCompleted: 42,
      phone: "+1-555-1002"
    },
    {
      studentId: "STU2023001",
      firstName: "Sophia",
      lastName: "Garcia",
      email: "sophia.garcia@university.edu",
      age: 21,
      gpa: 3.9,
      major: "Biology",
      isEnrolled: true,
      enrollmentDate: new Date("2022-08-20"),
      graduationYear: 2026,
      creditsCompleted: 78,
      phone: "+1-555-1003"
    },
    {
      studentId: "STU2022001",
      firstName: "Michael",
      lastName: "Taylor",
      email: "michael.taylor@university.edu",
      age: 22,
      gpa: 3.4,
      major: "Business",
      isEnrolled: false,
      enrollmentDate: new Date("2021-08-25"),
      graduationYear: 2025,
      creditsCompleted: 110,
      phone: "+1-555-1004"
    }
  ],
  movies: [
    {
      title: "Stellar Journey",
      director: "Steven Future",
      releaseYear: 2023,
      runtime: 142,
      budget: 180000000,
      boxOffice: 850000000,
      isAvailable: true,
      genre: "Sci-Fi",
      rating: "PG-13",
      imdbScore: 8.2,
      releaseDate: new Date("2023-06-15")
    },
    {
      title: "Comedy Night",
      director: "Funny Director",
      releaseYear: 2022,
      runtime: 98,
      budget: 25000000,
      boxOffice: 150000000,
      isAvailable: true,
      genre: "Comedy", 
      rating: "R",
      imdbScore: 7.5,
      releaseDate: new Date("2022-12-20")
    },
    {
      title: "Drama Heights",
      director: "Serious Filmmaker",
      releaseYear: 2021,
      runtime: 156,
      budget: 45000000,
      boxOffice: 95000000,
      isAvailable: false,
      genre: "Drama",
      rating: "PG-13", 
      imdbScore: 8.7,
      releaseDate: new Date("2021-10-10")
    }
  ]
};

async function importSimpleTestData(mongoUrl, databaseName = 'editor_test_db') {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(databaseName);
    
    // Import each collection
    for (const [collectionName, data] of Object.entries(simpleCollections)) {
      console.log(`Importing ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      
      // Clear existing data
      await collection.deleteMany({});
      
      // Insert sample data
      const result = await collection.insertMany(data);
      console.log(`✓ Inserted ${result.insertedCount} documents into ${collectionName}`);
    }
    
    console.log('\n🎉 Simple test data import completed successfully!');
    console.log(`Database: ${databaseName}`);
    console.log('\n📋 Collections created:');
    console.log('📊 employees (5 documents) - HR data with various field types');
    console.log('📚 books (4 documents) - Library catalog with prices and ratings');
    console.log('🎓 students (4 documents) - University records with GPAs'); 
    console.log('🎬 movies (3 documents) - Film database with box office data');
    
    console.log('\n✨ Perfect for testing the MongoDB Editor:');
    console.log('- All scalar fields (no nested objects)');
    console.log('- Mixed data types: strings, numbers, booleans, dates');
    console.log('- Realistic data for editing and validation');
    console.log('- Varying field counts per collection');
    
  } catch (error) {
    console.error('❌ Error importing simple test data:', error);
  } finally {
    await client.close();
  }
}

// Usage
const mongoUrl = process.argv[2] || 'mongodb://localhost:27017';
const databaseName = process.argv[3] || 'editor_test_db';

if (require.main === module) {
  importSimpleTestData(mongoUrl, databaseName);
}

module.exports = { importSimpleTestData };