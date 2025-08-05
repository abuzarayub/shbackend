# SKILL_HUB_BACKEND

A professional, production-ready backend for the Skill Hub learning management system.

## Features

- **Modular Architecture**: Clean separation of concerns with controllers, services, and routes
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Redis Integration**: Caching, session management, and real-time monitoring
- **RabbitMQ**: Asynchronous job processing and event-driven architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Logging**: Structured logging with request tracing and error tracking
- **Health Checks**: Comprehensive system health monitoring
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Professional error responses with support codes

## Professional Logging & Error Handling

### Request Tracing
Every request is assigned a unique request ID for distributed tracing:

```typescript
// Request ID is automatically added to all logs
logger.info({ requestId: req.id, userId: req.user?.id }, "User action");
```

### Support Codes
All errors include a unique support code for easier debugging:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal Server Error",
  "supportCode": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Structured Logging
Use the `getRequestLogger` utility for context-rich logs:

```typescript
import { getRequestLogger } from "./utils/Logger";

const reqLogger = getRequestLogger({
  requestId: req.id,
  userId: req.user?.id
});

reqLogger.info("User action completed");
reqLogger.warn("Suspicious activity detected");
reqLogger.error("Operation failed");
```

### Error Monitoring
Errors are automatically:
- Logged with full context
- Pushed to Redis for real-time monitoring
- Stored in the database for audit trails
- Include request ID and support code for traceability

### Health Check Endpoint
Monitor system health at `/health`:

```json
{
  "status": "ok",
  "redis": true,
  "rabbitmq": true,
  "db": true
}
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course (instructors only)
- `GET /api/courses/:id` - Get course details

### Enrollments
- `POST /api/client/enrollments` - Enroll in course
- `GET /api/client/enrollments` - Get enrollment status

### Transactions
- `POST /api/client/transactions` - Create transaction
- `GET /api/client/transactions` - Get user transactions

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/dashboard-overview` - Admin dashboard

## Development

### Logging Best Practices
- Always use `getRequestLogger` for request-scoped logs
- Include relevant context (userId, requestId, etc.)
- Use appropriate log levels (info, warn, error)
- Log suspicious activity for security monitoring

### Error Handling
- All errors are automatically logged and tracked
- Support codes help with debugging and customer support
- Errors include request context for better debugging

### Testing
```bash
npm test
```

## Production Deployment

The backend is production-ready with:
- Comprehensive error handling and logging
- Health checks for all dependencies
- Rate limiting and security headers
- Structured logging for monitoring
- Request tracing for debugging

## Contributing

1. Follow the existing code structure
2. Add appropriate logging for new features
3. Include error handling for all endpoints
4. Test thoroughly before submitting

## License

[Your License Here]
