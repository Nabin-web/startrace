# CSV File Manager - Frontend

React + Vite frontend for CSV file management with real-time updates.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173`

## Features

- **Authentication**: Sign up and login with JWT tokens
- **Role-based Access**: Admin and user roles
- **Admin Panel**: 
  - Upload CSV files
  - Delete CSV files
  - View all users
  - Delete users
  - View CSV content in table format
- **User Panel**:
  - Browse available CSV files
  - View CSV content in table format
- **Real-time Updates**: WebSocket connection for instant file updates

## Default Credentials

- Admin: `admin` / `admin123`
- Create your own user account via signup

## Configuration

Update `src/config.js` to change API endpoints if needed.
