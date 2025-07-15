#!/usr/bin/env bash
# load_flat_dataset.sh
# Usage: ./load_flat_dataset.sh cars|movies

set -euo pipefail

DATASET=${1:-cars}          # default = cars
DB=test_db                  # target database

case "$DATASET" in
  cars)
    URL="https://raw.githubusercontent.com/vega/vega/master/docs/data/cars.json"
    COLLECTION="cars"
    ;;
  movies)
    URL="https://raw.githubusercontent.com/vega/vega-datasets/main/data/movies.json"
    COLLECTION="movies"
    ;;
  *)
    echo "Allowed arguments: cars | movies" >&2; exit 1 ;;
esac

echo "⏬  Downloading $DATASET dataset…"
curl -sSL "$URL" -o "$DATASET.json"

echo "📥  Importing into MongoDB ($DB.$COLLECTION)…"
mongoimport --db "$DB" \
            --collection "$COLLECTION" \
            --file "$DATASET.json" \
            --jsonArray --drop

echo "✅  Done. Run: mongo $DB --eval 'db.$COLLECTION.count()'"
