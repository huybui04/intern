# Queue System API Documentation

## Course Enrollment Queue System

The course enrollment system now uses a queue-based approach to handle enrollment requests asynchronously. This provides better scalability and handles concurrent enrollment requests more effectively.

## New API Endpoints

### 1. Enroll in Course (Updated)

```
POST /api/courses/:id/enroll
```

**Request Body:**

```json
{
  "priority": 5 // Optional: 1=LOW, 5=NORMAL, 10=HIGH, 15=CRITICAL
}
```

**Response:**

```json
{
  "message": "Enrollment request has been queued for processing",
  "data": {
    "jobId": "12345",
    "status": "queued"
  }
}
```

### 2. Check Enrollment Job Status

```
GET /api/courses/queue/job/:jobId
```

**Response:**

```json
{
  "message": "Job status retrieved successfully",
  "data": {
    "id": "12345",
    "status": "completed",
    "progress": 100,
    "result": {
      "success": true,
      "enrollmentId": "64f8...",
      "message": "Successfully enrolled in course"
    },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "processedAt": "2025-01-15T10:00:01.000Z",
    "finishedAt": "2025-01-15T10:00:02.000Z"
  }
}
```

### 3. Get Queue Statistics (Admin/Instructor only)

```
GET /api/courses/queue/stats
```

**Response:**

```json
{
  "message": "Queue statistics retrieved successfully",
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "total": 110
  }
}
```

### 4. Cancel Enrollment Job

```
DELETE /api/courses/queue/job/:jobId
```

**Response:**

```json
{
  "message": "Job cancelled successfully"
}
```

### 5. Queue Management Dashboard (Admin/Instructor only)

```
GET /api/queue/stats
GET /api/queue/job/:jobId
DELETE /api/queue/job/:jobId
```

## Job Status Values

- `waiting`: Job is in queue waiting to be processed
- `active`: Job is currently being processed
- `completed`: Job finished successfully
- `failed`: Job failed (will be retried up to 3 times)
- `delayed`: Job is delayed for retry

## Priority Levels

- `LOW` (1): Low priority enrollments
- `NORMAL` (5): Default priority
- `HIGH` (10): High priority enrollments
- `CRITICAL` (15): Critical enrollments (admin use)

## Error Handling

The queue system includes:

- Automatic retry (up to 3 attempts)
- Exponential backoff for retries
- Atomic operations to prevent race conditions
- Job status tracking and monitoring

## Environment Variables

Add these to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Usage Examples

### 1. Basic Enrollment

```javascript
// Student enrolls in course
const response = await fetch("/api/courses/123/enroll", {
  method: "POST",
  headers: {
    Authorization: "Bearer <token>",
    "Content-Type": "application/json",
  },
});

const { data } = await response.json();
const jobId = data.jobId;

// Check status
const statusResponse = await fetch(`/api/courses/queue/job/${jobId}`);
const status = await statusResponse.json();
```

### 2. High Priority Enrollment

```javascript
const response = await fetch("/api/courses/123/enroll", {
  method: "POST",
  headers: {
    Authorization: "Bearer <token>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    priority: 10, // HIGH priority
  }),
});
```

### 3. Monitor Queue (Admin)

```javascript
const statsResponse = await fetch("/api/queue/stats", {
  headers: {
    Authorization: "Bearer <admin_token>",
  },
});

const stats = await statsResponse.json();
console.log("Queue status:", stats.data);
```

## Benefits

1. **Scalability**: Handles many concurrent enrollment requests
2. **Reliability**: Automatic retry mechanism for failed enrollments
3. **Monitoring**: Real-time queue statistics and job tracking
4. **Priority Support**: Different priority levels for enrollments
5. **Atomic Operations**: Prevents race conditions during enrollment
6. **Background Processing**: Non-blocking enrollment process
