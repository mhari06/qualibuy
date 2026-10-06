# QualiBuy

QualiBuy is a local full-stack comparison platform for product quality, shop reliability, price tracking, and buyer decision support.

## Features
- Modern responsive storefront and search experience
- Product quality analysis with score breakdowns
- Shop comparison table showing price, quality, availability, rating, and value
- User login/register flow with password hashing
- Saved products, comparison history, and recently viewed items
- Multilingual UI with English, Tamil, Hindi, Telugu, Malayalam, and Kannada
- Browser voice search via the Web Speech API
- SQLite-backed local database for demo data

## Tech stack
- Node.js + Express
- SQLite via better-sqlite3
- HTML + CSS + vanilla JavaScript frontend
- bcryptjs for password hashing

## Run locally
1. Install dependencies:
   npm install
2. Start the server:
   npm start
3. Open the app in a browser:
   http://localhost:3000

## Database
The app uses a local SQLite database file named `qualibuy.db` in the project root. Seed data for products and shops is created automatically on the first run.

## Notes
This project uses demo product data for a working local experience and is structured so real APIs and shop feeds can be plugged in later.
