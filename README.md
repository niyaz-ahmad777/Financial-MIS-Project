# Financial MIS with AI Fraud Detection and Cyber Security Alert System

## Overview
This project provides a simple Financial MIS dashboard with:
- Login and role placeholders
- Transaction monitoring
- Fraud risk scoring
- Security alert listing
- JWT-protected APIs
- CSV report download

## Project Structure
- frontend: HTML, CSS, JS pages
- backend: Flask API, routes, models, utilities
- database: SQL schema and sample data
- ml_model: dataset, training script, generated model file

## Quick Start
1. Create and activate a Python virtual environment.
2. Install dependencies:
   pip install -r requirements.txt
3. Run backend:
   cd backend
   python app.py
4. Open frontend/index.html in your browser and log in with:
   - admin / admin123
   - analyst / analyst123

## Notes
- SQLite database is auto-created at backend/financial_mis.db on first run.
- Tables are initialized from database/schema.sql with seed demo data.
- Protected API routes require a Bearer token from /api/auth/login.
