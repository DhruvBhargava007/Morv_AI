# Morv AI - AI-Powered Predictive Maintenance System

An intelligent predictive maintenance platform for military tank fleets using a multi-agent AI architecture.

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Morv_AI
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following to `backend/.env`:

```
OPENAI_API_KEY

```


## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate
python api.py
```

The backend API will start on http://localhost:8000

### Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```
