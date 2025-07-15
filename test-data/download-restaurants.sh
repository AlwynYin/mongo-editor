#!/bin/bash

# Download MongoDB sample restaurant dataset
echo "Downloading MongoDB sample restaurant data..."

# Create temp directory
mkdir -p temp

# Download the sample dataset
curl -o temp/restaurants.json "https://raw.githubusercontent.com/mongodb/docs-assets/primer-dataset/primer-dataset.json"

echo "Download completed!"
echo ""
echo "To import the restaurant data into MongoDB, run:"
echo "mongoimport --db test_db --collection restaurants --file temp/restaurants.json"
echo ""
echo "Or use our Node.js script:"
echo "node import-restaurants.js mongodb://localhost:27017 test_db"