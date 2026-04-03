# Rebound - Lost & Found Platform

Rebound is a smart Lost & Found platform designed to reconnect people with their lost belongings efficiently and securely. It bridges the gap between those who lose items and those who find them through a modern, user-friendly interface with advanced verification and safety features.

## 🚀 Key Features

### 🔍 Smart Matching
- **Automatic Matching**: The system intelligently matches lost item reports with found item listings based on category, location, and description.
- **Visual Search**: Upload photo support for accurate item identification.

### 🛡️ Safe & Secure Recovery
- **Safe Meetup Points**: No more sharing personal addresses. The system suggests safe, public locations (e.g., Security Offices, Help Desks) for item exchange.
- **Help Desk Handover**: Finders can hand items over to designated Help Desks, ending their responsibility immediately.
- **Two-Way Verification**: 
    - **Direct Exchange**: Secure OTP verification between Owner and Finder at the meetup spot.
    - **Help Desk**: Owners assert their claim at the Help Desk using a secure system-generated code.

### 🗺️ Interactive Map
- **Live Tracking**: View lost and found items on an interactive map.
- **Clustered View**: Efficiently browse items in high-density areas.

## 🛠️ Tech Stack

**MERN Stack**:
- **Frontend**: React (Vite), TailwindCSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io (for live updates/tracking - planned)

## 📦 Project Structure

```bash
rebound/
├── client/         # React Frontend
├── server/         # Express Backend
├── scripts/        # Utility scripts
└── package.json    # Root configuration
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or cloud URI)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/rebound.git
    cd rebound
    ```

2.  **Install dependencies**:
    ```bash
    # Install server dependencies
    cd server && npm install
    
    # Install client dependencies
    cd ../client && npm install
    
    # Go back to root
    cd ..
    ```

3.  **Environment Setup**:
    - Configure `server/.env` (see `.env.example`).
    - Configure `client/.env` (see `.env.example`).

### Running the App

The project uses `concurrently` to run both client and server from the root.

```bash
# Start both Client and Server (Development Mode)
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:4000](http://localhost:4000)

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request, do give us insights to make it better, working to built a new world.
