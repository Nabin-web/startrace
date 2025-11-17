# Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL installed and running

## Quick Setup

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb csv_app_db
# Or via psql:
psql -U postgres -c "CREATE DATABASE csv_app_db;"
```

### 2. Backend Setup
```bash
cd BE

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/csv_app_db
SECRET_KEY=change-this-to-a-random-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
EOF

# Edit .env with your actual database credentials

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd FE

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## First Login

1. Navigate to `http://localhost:5173`
2. Login with default admin credentials:
   - Username: `admin`
   - Password: `admin123`

Or sign up as a new user.

## Testing Real-Time Updates

1. Open the app in two browser windows (or two different browsers)
2. Login as admin in one window
3. Login as a regular user in the other window
4. Upload a CSV file as admin
5. Watch it appear instantly in the user's window!

## Creating Sample CSV Files

Create a test CSV file to upload:
```bash
cat > test.csv << EOF
name,age,city
John,25,New York
Jane,30,Los Angeles
Bob,35,Chicago
EOF
```

Then upload it via the admin panel.

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

