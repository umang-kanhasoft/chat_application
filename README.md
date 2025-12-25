# Freelance Platform

A full-stack freelance marketplace platform with real-time chat functionality.

## Features

- **User Management**: Support for Clients, Freelancers, and dual-role users
- **Project Management**: Create and manage freelance projects with skill requirements
- **Bidding System**: Freelancers can bid on projects, clients can accept/reject
- **Real-time Chat**: WebSocket-based messaging with read receipts and online status
- **Skills Matching**: Match freelancers with projects based on skills
- **GraphQL API**: Flexible data querying with Apollo Server
- **REST API**: Additional REST endpoints for specific operations

## Tech Stack

### Backend
- **Fastify** - Fast and low overhead web framework
- **Apollo Server** - GraphQL server
- **Sequelize** - ORM for PostgreSQL
- **WebSocket** - Real-time bidirectional communication
- **TypeScript** - Type-safe development

### Frontend
- **React** - UI library
- **Axios** - HTTP client

### Database
- **PostgreSQL** - Relational database

## Project Structure

```
demo_project/
├── src/                    # Backend source
│   ├── config/            # Configuration files
│   ├── models/            # Database models
│   ├── graphql/           # GraphQL schemas and types
│   ├── modules/           # Feature modules
│   ├── services/          # Business logic
│   ├── plugins/           # Fastify plugins
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── client/                # React frontend
├── test/                  # Test files
├── docs/                  # Documentation
└── README.md
```

For detailed structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE freelance_platform;
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freelance_platform
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=4000
NODE_ENV=development
```

### 4. Database Migration

Run Sequelize migrations to create tables:

```bash
npm run migrate
```

## Running the Application

### Development Mode

Start the backend server with hot reload:

```bash
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd client
npm start
```

The application will be available at:
- Backend: http://localhost:4000
- Frontend: http://localhost:3000
- GraphQL Playground: http://localhost:4000/graphql

### Production Mode

Build and start the production server:

```bash
# Build TypeScript
npm run build:ts

# Start server
npm start
```

## API Documentation

### GraphQL Endpoint

**URL**: `http://localhost:4000/graphql`

Available queries and mutations for:
- Users
- Skills
- Projects
- Bids
- Messages
- User Skills
- Project Skills

### REST Endpoints

**Skills API**:
- `GET /skill` - List all skills
- `GET /skill/:id` - Get skill by ID
- `POST /skill` - Create new skill
- `PATCH /skill/:id` - Update skill

### WebSocket

**URL**: `ws://localhost:4000/chat`

**Events**:
- `AUTH` - Authenticate user
- `MESSAGE_SEND` - Send message
- `MESSAGE_HISTORY` - Get chat history
- `MARK_AS_READ` - Mark messages as read
- `TYPING_START` / `TYPING_STOP` - Typing indicators
- `GET_PROJECT_USERS` - Get users in project
- `GET_USER_PROJECTS` - Get user's projects

For detailed WebSocket documentation, see [docs/CHAT_MODULE_GUIDE.md](./docs/CHAT_MODULE_GUIDE.md)

## Testing

Run the test suite:

```bash
npm test
```

## Code Quality

### Format Code

```bash
npm run format
```

### Check Formatting

```bash
npm run format:check
```

## Database Models

### Core Entities

- **User**: Platform users (clients/freelancers)
- **Skill**: Available skills
- **Project**: Client projects
- **Bid**: Freelancer bids on projects
- **Message**: Chat messages between users

### Relationships

- Users have many Skills (many-to-many)
- Projects require many Skills (many-to-many)
- Users create Projects (one-to-many)
- Users place Bids on Projects (many-to-many)
- Users send Messages to each other (one-to-many)

## Key Features Explained

### Real-time Chat

The chat system uses WebSocket for real-time communication:

1. **Message Status**: Messages progress through SENT → DELIVERED → READ
2. **Online Presence**: Real-time online/offline status
3. **Read Receipts**: WhatsApp-style checkmarks
4. **Typing Indicators**: See when someone is typing
5. **Project Context**: Messages are organized by project

### Bidding System

1. Freelancers browse projects
2. Submit bids with proposed amount and timeline
3. Clients review bids
4. Accept one bid per project
5. Chat opens between client and freelancer

### Skills Matching

- Users add skills to their profile
- Projects specify required skills
- System can match freelancers to relevant projects

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running:
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
pg_ctl start
```

### Port Already in Use

Change the port in `.env`:
```env
PORT=4001
```

### WebSocket Connection Failed

Ensure the backend server is running and check the WebSocket URL in your client code.

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Use TypeScript strictly
5. Follow ESLint and Prettier configurations

## Documentation

- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed project organization
- [Chat Module Guide](./docs/CHAT_MODULE_GUIDE.md) - WebSocket chat implementation
- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) - Feature implementation details

## License

ISC

## Support

For questions or issues, please refer to the documentation in the `docs/` directory.
