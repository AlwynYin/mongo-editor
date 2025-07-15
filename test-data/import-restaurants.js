// Import MongoDB restaurant dataset
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function importRestaurants(mongoUrl, databaseName = 'test_db') {
  const client = new MongoClient(mongoUrl);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(databaseName);
    const collection = db.collection('restaurants');
    
    // Check if restaurants.json exists
    const restaurantsFile = path.join(__dirname, 'temp', 'restaurants.json');
    
    if (!fs.existsSync(restaurantsFile)) {
      console.log('restaurants.json not found. Downloading...');
      
      // Download the file first
      const https = require('https');
      const url = 'https://raw.githubusercontent.com/mongodb/docs-assets/primer-dataset/primer-dataset.json';
      
      if (!fs.existsSync(path.join(__dirname, 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });
      }
      
      const file = fs.createWriteStream(restaurantsFile);
      
      await new Promise((resolve, reject) => {
        https.get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      });
      
      console.log('Download completed!');
    }
    
    // Read and parse the JSON file
    console.log('Reading restaurant data...');
    const jsonData = fs.readFileSync(restaurantsFile, 'utf8');
    
    // Parse JSON lines format
    const restaurants = jsonData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // Clear existing data
    await collection.deleteMany({});
    
    // Insert restaurants
    console.log(`Importing ${restaurants.length} restaurants...`);
    const result = await collection.insertMany(restaurants);
    
    console.log(`Successfully imported ${result.insertedCount} restaurants!`);
    console.log(`Database: ${databaseName}`);
    console.log(`Collection: restaurants`);
    
    // Show sample document structure
    const sampleDoc = await collection.findOne({});
    console.log('\nSample document structure:');
    console.log(JSON.stringify(sampleDoc, null, 2));
    
  } catch (error) {
    console.error('Error importing restaurants:', error);
  } finally {
    await client.close();
  }
}

// Usage
const mongoUrl = process.argv[2] || 'mongodb://localhost:27017';
const databaseName = process.argv[3] || 'test_db';

if (require.main === module) {
  importRestaurants(mongoUrl, databaseName);
}

module.exports = { importRestaurants };