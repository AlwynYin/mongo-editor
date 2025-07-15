# Test Data for MongoDB Collection Editor

This directory contains scripts to populate your MongoDB with **editor-friendly sample data** - no nested JSON, perfect for testing document editing functionality.

## 🎯 Editor-Optimized Datasets (Recommended)

### Option 1: Simple Test Data ⭐ (Perfect for Editor Testing)
```bash
# Import flat collections designed for the MongoDB editor
cd test-data
node simple-test-data.js mongodb://localhost:27017 editor_test_db
```

This creates 4 collections with **NO nested objects**:
- **employees** (5 documents) - HR data with mixed field types
- **books** (4 documents) - Library catalog with ratings
- **students** (4 documents) - University records with GPAs
- **movies** (3 documents) - Film database with box office data

### Option 2: E-commerce Data (Realistic Business Data)
```bash
# Import e-commerce collections with relational data
cd test-data
node ecommerce-data.js mongodb://localhost:27017 ecommerce_test_db
```

This creates 4 collections:
- **customers** (4 documents) - Customer profiles with VIP status
- **products** (5 documents) - Product catalog with inventory
- **orders** (4 documents) - Order history with shipping status
- **reviews** (3 documents) - Product reviews and ratings

### Option 3: Public Datasets (Real-World Data)
```bash
# Download and import flattened public datasets
cd test-data
node download-public-datasets.js mongodb://localhost:27017 public_test_db
```

This creates collections from public APIs:
- **covid** - COVID-19 country statistics (flattened)
- **countries** - World population data

## 🚫 Legacy Data (Contains Nested JSON - Not Recommended)

### Option 4: Original Sample Data (Has Nested Objects)
```bash
# Import original sample collections (contains nested JSON)
cd test-data
node import-sample-data.js mongodb://localhost:27017 test_db
```

### Option 5: Restaurant Data (Large Dataset with Nested Objects)
```bash
# Download and import MongoDB's official restaurant dataset
cd test-data
node import-restaurants.js mongodb://localhost:27017 test_db
```

## What you get:

### Custom Sample Data Features:
- **Mixed data types**: strings, numbers, booleans, dates, arrays
- **Realistic values**: Names, emails, addresses, prices
- **Varying data**: Some fields missing, different structures
- **Small size**: Perfect for development and testing

### Restaurant Data Features:
- **Large dataset**: 25,000+ real restaurant records
- **Complex structure**: Nested address objects, grade arrays
- **Real data**: Actual NYC restaurant inspection data
- **Performance testing**: Great for testing pagination

## Usage with MongoDB Collection Editor

1. **Start your MongoDB instance**:
   ```bash
   mongod
   ```

2. **Import editor-friendly test data**:
   ```bash
   cd test-data
   node simple-test-data.js mongodb://localhost:27017 editor_test_db
   ```

3. **Start the MongoDB Editor**:
   ```bash
   cd ..
   pnpm dev
   ```

4. **Connect in the web app**:
   - MongoDB URL: `mongodb://localhost:27017`
   - Database Name: `editor_test_db`
   - Click "Connect"
   - Select a collection: `employees`, `books`, `students`, or `movies`

5. **Test editing functionality**:
   - Click any row to open the edit modal
   - Edit fields using appropriate input types
   - Save changes and see immediate feedback
   - All data is flat (no nested objects) for easy editing!

## Alternative: MongoDB Atlas (Cloud)

For a cloud option without local setup:

1. **Create free MongoDB Atlas account**: https://cloud.mongodb.com
2. **Create cluster and get connection string**
3. **Load sample data** (Atlas provides built-in sample datasets)
4. **Use connection string** in the MongoDB Editor

Example Atlas connection:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sample_restaurants
```

## Manual MongoDB Commands

If you prefer manual setup:

```bash
# Connect to MongoDB shell
mongosh

# Create and switch to test database
use test_db

# Insert sample users
db.users.insertMany([
  {
    name: "John Doe",
    email: "john@example.com",
    age: 28,
    department: "Engineering",
    isActive: true,
    joinDate: new Date("2022-03-15")
  },
  {
    name: "Jane Smith", 
    email: "jane@example.com",
    age: 32,
    department: "Design",
    isActive: true,
    joinDate: new Date("2021-07-20")
  }
])

# View the data
db.users.find().pretty()
```

## Troubleshooting

### MongoDB not running:
```bash
# Start MongoDB service (varies by system)
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
```

### Connection refused:
- Check MongoDB is running on port 27017
- Verify firewall settings
- Use `127.0.0.1` instead of `localhost` if needed

### Import errors:
- Ensure Node.js is installed
- Run `npm install mongodb` if needed
- Check MongoDB permissions

## 🔍 Field Types in Editor-Optimized Data

The new editor-friendly datasets include various MongoDB field types perfect for testing editing functionality:

### Simple Test Data Fields:
- **String**: firstName, lastName, email, title, author, department
- **Number**: age, salary, price, pages, rating, gpa, runtime, budget
- **Boolean**: isActive, inStock, isEnrolled, isAvailable
- **Date**: hireDate, publishedDate, enrollmentDate, releaseDate
- **ObjectId**: _id (auto-generated)

### E-commerce Data Fields:
- **String**: customerId, productId, orderId, name, email, category, status
- **Number**: age, price, quantity, totalSpent, stockQuantity, rating
- **Boolean**: isVip, inStock, isDiscounted, isVerifiedPurchase
- **Date**: joinDate, lastOrderDate, orderDate, shippedDate, reviewDate
- **Null**: Some deliveredDate fields for testing null handling

### 🎯 Perfect for Testing:
- **All scalar fields** (no nested objects or arrays)
- **Mixed data types** in each collection
- **Realistic values** for meaningful editing tests
- **Null values** to test optional field handling
- **Various string lengths** for UI testing
- **Different number ranges** for validation testing

This variety ensures the MongoDB Collection Editor handles all common field types correctly!