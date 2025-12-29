# React Chat Application

A modern, scalable real-time chat application built with React, TypeScript, Vite, and WebSocket.

## Features

- 🚀 **Real-time messaging** with WebSocket
- 💬 **Read receipts** (sent, delivered, read)
- 👥 **Online/offline status** tracking
- ⌨️ **Typing indicators**
- 🔔 **Unread message counts**
- 📱 **Responsive design**
- 🔄 **Automatic reconnection** with exponential backoff
- 💾 **Message queuing** for offline support
- 🎨 **Modern UI** with Tailwind CSS

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Zustand** for state management
- **Tailwind CSS** for styling
- **WebSocket** for real-time communication
- **pnpm** for package management

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm installed globally: `npm install -g pnpm`
- Backend server running on `ws://localhost:4000/chat`

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your WebSocket URL if different
# VITE_WS_URL=ws://localhost:4000/chat
```

### Development

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:5173
```

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat-specific components
│   ├── layout/         # Layout components
│   ├── ui/             # Reusable UI components
│   └── user/           # User-related components
├── hooks/              # Custom React hooks
├── services/           # Business logic and services
├── store/              # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Constants and configuration
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Usage

1. **Login**: Enter your User ID to connect
2. **Select Project**: Choose a project from the dropdown
3. **Select User**: Click on a user to start chatting
4. **Send Messages**: Type and press Enter to send

## Key Features Explained

### WebSocket Service
- Automatic reconnection with exponential backoff
- Message queuing when offline
- Heartbeat mechanism for connection health
- Event-based architecture for loose coupling

### State Management
- **Auth Store**: User authentication state
- **Connection Store**: WebSocket connection and online users
- **Chat Store**: Selected project/user, unread counts, typing state

### Performance
- Optimized re-renders with React.memo
- Debounced typing indicators
- Efficient state management with Zustand

## Environment Variables

```
VITE_WS_URL=ws://localhost:4000/chat
```

## Architecture Highlights

- **Component-based architecture**: Modular, reusable components
- **Custom hooks**: Encapsulated logic for WebSocket and chat
- **Type-safe**: Full TypeScript coverage
- **Scalable**: Designed to handle millions of users
- **Maintainable**: Clean code structure and separation of concerns

## Future Enhancements

- Message search functionality
- File/image sharing
- Voice messages
- Video calls
- Group chats
- Message reactions
- IndexedDB caching for offline support
- Service worker for PWA capabilities

## License

MIT
