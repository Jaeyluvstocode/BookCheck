delete_test_reviews.js

Purpose

This script helps remove test data (reviews and optional books) from the `bookcheck` database.

Location

server/scripts/delete_test_reviews.js

Usage

- Dry-run (no changes):
  node delete_test_reviews.js --dry-run

- Remove matching reviews (non-destructive to books):
  node delete_test_reviews.js

- Delete entire books owned by users whose username starts with `test`:
  node delete_test_reviews.js --delete-books

- Use a custom Mongo URI instead of the `MONGO_URI` env var:
  node delete_test_reviews.js --uri="mongodb+srv://user:pass@cluster0.mongodb.net/bookcheck"

Notes

- Patterns used to identify test reviews:
  - username starts with `test` (case-insensitive)
  - comment contains `test`, `good book`, `great book`, or `test book` (case-insensitive)

- The script is conservative and supports `--dry-run` so you can review matches before deletions.

- Back up your database before running destructive operations. You can use `mongodump` or your provider's snapshot features.
