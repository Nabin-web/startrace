# CSV File Manager - Full-Stack Web Application

A full-stack web application that allows users to sign up, log in, and browse CSV files uploaded by admins. Features real-time updates and role-based access control (RBAC) enforced via JWT.

## Features

### Authentication & RBAC
- User sign up and login with username/password
- JWT authentication with access & refresh tokens
- Role-based access control (admin/user)
- Default admin user created on first startup

### Admin Panel
- Upload CSV files
- View list of uploaded files with metadata
- Delete CSV files
- View CSV content in formatted table
- View all registered users
- Delete users
- Real-time updates when files are added/removed

### User Panel
- View list of available CSV files
- Open CSV files and display content in table
- Real-time updates when admin uploads/deletes files

### Real-Time Updates
- WebSocket connection for instant notifications
- All connected clients receive updates automatically
- Event: `csv_list_updated`

## Tech Stack

### Backend
- **FastAPI** (Python) - REST API and WebSocket server
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **JWT** - Authentication (python-jose)
- **WebSockets** - Real-time updates

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **WebSocket** - Real-time client

## Project Structure

```
startrace/
├── BE/              # Backend (FastAPI)
│   ├── main.py      # Main application
│   ├── models.py    # Database models
│   ├── auth.py      # Authentication & JWT
│   ├── schemas.py   # Pydantic schemas
│   ├── database.py  # Database connection
│   ├── config.py    # Configuration
│   └── websocket_manager.py  # WebSocket manager
└── FE/              # Frontend (React + Vite)
    ├── src/
    │   ├── pages/   # Page components
    │   ├── contexts/ # React contexts
    │   ├── hooks/   # Custom hooks
    │   ├── components/ # Reusable components
    │   └── api.js   # API client
    └── ...
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
```bash
cd BE
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL database and create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

Example `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/csv_app_db
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
```

5. Create the database:
```sql
CREATE DATABASE csv_app_db;
```

6. Run the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd FE
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

This user is automatically created on first startup.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/login` - Login (returns JWT tokens)
- `GET /api/auth/me` - Get current user info

### User Endpoints
- `GET /api/files` - List all CSV files
- `GET /api/files/{file_id}` - Download CSV file
- `GET /api/files/{file_id}/content` - Get CSV content as JSON

### Admin Endpoints
- `POST /api/admin/files/upload` - Upload CSV file
- `DELETE /api/admin/files/{file_id}` - Delete CSV file
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/{user_id}` - Delete user

### WebSocket
- `WS /ws?token=<jwt_token>` - Real-time updates connection

## Usage

1. Start both backend and frontend servers
2. Navigate to `http://localhost:5173`
3. Sign up as a new user or login with admin credentials
4. Admin users can:
   - Upload CSV files via the admin panel
   - Manage files and users
5. Regular users can:
   - Browse available CSV files
   - View CSV content
6. All users receive real-time updates when files are added or removed

## Storage

- CSV files are stored in the `BE/uploads/` directory (configurable via `UPLOAD_DIR` in `.env`)
- File metadata is stored in PostgreSQL
- User data is stored in PostgreSQL

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control enforced on backend
- CORS enabled for frontend origin
- File upload validation (CSV files only)

## Development

- Backend auto-reloads on code changes (via `--reload` flag)
- Frontend hot module replacement enabled (via Vite)
- WebSocket connections automatically reconnect on disconnect

## License

MIT

