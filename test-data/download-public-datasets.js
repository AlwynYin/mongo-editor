// Download and process public datasets to create flat MongoDB collections
const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Public datasets that we can easily flatten
const publicDatasets = {
  // Simple COVID data (country-level stats)
  covid: {
    url: 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/latest/owid-covid-latest.csv',
    description: 'COVID-19 country statistics (flattened)'
  },
  
  // Country data
  countries: {
    url: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv', 
    description: 'World country population data'
  }
};

async function downloadCSV(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
      
      file.on('error', (err) => {
        fs.unlink(filename, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', reject);
  });
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;
    
    const obj = {};
    headers.forEach((header, index) => {
      let value = values[index].replace(/"/g, '').trim();
      
      // Try to convert to appropriate types
      if (value === '' || value.toLowerCase() === 'null') {
        obj[header] = null;
      } else if (!isNaN(value) && value !== '') {
        obj[header] = parseFloat(value);
      } else if (value.toLowerCase() === 'true') {
        obj[header] = true;
      } else if (value.toLowerCase() === 'false') {
        obj[header] = false;
      } else {
        obj[header] = value;
      }
    });
    data.push(obj);
  }
  
  return data;
}

async function downloadAndImportPublicData(mongoUrl, databaseName = 'public_test_db') {
  const client = new MongoClient(mongoUrl);
  
  try {
    console.log('📥 Downloading public datasets...');
    
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp');
    }
    
    await client.connect();
    const db = client.db(databaseName);
    
    for (const [name, dataset] of Object.entries(publicDatasets)) {
      try {
        console.log(`\n📊 Processing ${name}...`);
        console.log(`Description: ${dataset.description}`);
        
        const filename = path.join('temp', `${name}.csv`);
        
        // Download CSV
        console.log('⬇️  Downloading...');
        await downloadCSV(dataset.url, filename);
        
        // Parse CSV
        console.log('📄 Parsing CSV...');
        const csvContent = fs.readFileSync(filename, 'utf8');
        const data = parseCSV(csvContent);
        
        if (data.length === 0) {
          console.log(`⚠️  No data found in ${name}`);
          continue;
        }
        
        // Limit to first 100 records for testing
        const limitedData = data.slice(0, 100);
        
        console.log(`📝 Found ${data.length} records, importing first ${limitedData.length}...`);
        
        // Import to MongoDB
        const collection = db.collection(name);
        await collection.deleteMany({});
        const result = await collection.insertMany(limitedData);
        
        console.log(`✅ Successfully imported ${result.insertedCount} documents to ${name}`);
        
        // Show sample fields
        const sampleDoc = limitedData[0];
        const fieldTypes = Object.entries(sampleDoc).map(([key, value]) => {
          const type = value === null ? 'null' : typeof value;
          return `${key}: ${type}`;
        }).slice(0, 5); // Show first 5 fields
        
        console.log(`📋 Sample fields: ${fieldTypes.join(', ')}${Object.keys(sampleDoc).length > 5 ? '...' : ''}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Public dataset import completed!');
    console.log(`Database: ${databaseName}`);
    console.log('\n📚 Available collections for testing:');
    console.log('- covid: COVID-19 country statistics');
    console.log('- countries: World population data');
    console.log('\n✨ All data is flattened (no nested objects) for easy editing!');
    
  } catch (error) {
    console.error('❌ Error importing public datasets:', error);
  } finally {
    await client.close();
  }
}

// Usage
const mongoUrl = process.argv[2] || 'mongodb://localhost:27017';
const databaseName = process.argv[3] || 'public_test_db';

if (require.main === module) {
  downloadAndImportPublicData(mongoUrl, databaseName);
}

module.exports = { downloadAndImportPublicData };