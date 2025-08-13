# Hướng dẫn Triển khai Queue System cho Đăng ký Khóa học

## Tóm tắt

Đã triển khai thành công hệ thống queue cho việc đăng ký khóa học với các tính năng:

1. **Đăng ký bất đồng bộ**: Xử lý đăng ký khóa học thông qua queue
2. **Atomic operations**: Tránh race conditions khi nhiều sinh viên đăng ký cùng lúc
3. **Retry mechanism**: Tự động thử lại khi có lỗi
4. **Priority system**: Hỗ trợ các mức độ ưu tiên khác nhau
5. **Job monitoring**: Theo dõi trạng thái của các job

## Các file đã tạo/cập nhật

### 1. Queue Configuration

- `src/services/queue.config.ts`: Cấu hình Bull queue và Redis
- `src/interfaces/queue.interface.ts`: Interfaces cho queue system

### 2. Queue Service

- `src/services/queue.service.ts`: Logic xử lý queue và enrollment jobs

### 3. Updated Services

- `src/services/course.service.ts`: Cập nhật để sử dụng queue system

### 4. Updated Controllers

- `src/controllers/course.controller.ts`: Thêm endpoints để quản lý queue

### 5. New Routes

- `src/routes/course.routes.ts`: Thêm routes cho queue management
- `src/routes/queue.routes.ts`: Dashboard routes cho admin

### 6. Application Setup

- `src/app.ts`: Khởi tạo queue processors

## API Endpoints Mới

### Đăng ký khóa học (cập nhật)

```
POST /api/courses/:id/enroll
Content-Type: application/json
Authorization: Bearer <token>

{
  "priority": 5  // Tùy chọn: 1=LOW, 5=NORMAL, 10=HIGH, 15=CRITICAL
}
```

### Kiểm tra trạng thái job

```
GET /api/courses/queue/job/:jobId
```

### Thống kê queue (Admin/Instructor)

```
GET /api/courses/queue/stats
GET /api/queue/stats
```

### Hủy job

```
DELETE /api/courses/queue/job/:jobId
```

## Yêu cầu hệ thống

**QUAN TRỌNG**: Để chạy queue system này, bạn cần:

1. **Node.js >= 16.20.1**: Phiên bản hiện tại (14.21.3) không tương thích
2. **Redis Server**: Để lưu trữ queue data
3. **MongoDB**: Database chính

## Cách khởi chạy

1. **Cập nhật Node.js**:

   ```bash
   # Tải và cài đặt Node.js 18+ từ https://nodejs.org/
   node --version  # Kiểm tra phiên bản mới
   ```

2. **Khởi động Redis**:

   ```bash
   # Windows với Docker
   docker run -d -p 6379:6379 redis:alpine

   # Hoặc cài đặt Redis trực tiếp
   ```

3. **Cấu hình environment**:

   ```env
   # Thêm vào .env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

4. **Khởi động server**:
   ```bash
   npm run dev
   ```

## Lợi ích của Queue System

1. **Khả năng mở rộng**: Xử lý nhiều request đăng ký đồng thời
2. **Độ tin cậy**: Retry mechanism cho các job thất bại
3. **Theo dõi**: Monitoring và logging chi tiết
4. **Hiệu suất**: Non-blocking enrollment process
5. **Fairness**: Hỗ trợ priority system

## Ví dụ sử dụng

### Frontend Integration

```javascript
// Đăng ký khóa học
const enrollResponse = await fetch("/api/courses/123/enroll", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ priority: 5 }),
});

const { data } = await enrollResponse.json();
const jobId = data.jobId;

// Polling để kiểm tra trạng thái
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/courses/queue/job/${jobId}`);
  const status = await statusResponse.json();

  if (status.data.status === "completed") {
    if (status.data.result.success) {
      alert("Đăng ký thành công!");
    } else {
      alert("Đăng ký thất bại: " + status.data.result.error);
    }
  } else if (status.data.status === "failed") {
    alert("Đăng ký thất bại");
  } else {
    // Vẫn đang xử lý, check lại sau 2 giây
    setTimeout(checkStatus, 2000);
  }
};

checkStatus();
```

## Troubleshooting

1. **Node.js version**: Upgrade to 18+
2. **Redis connection**: Kiểm tra Redis server đang chạy
3. **Memory**: Queue có thể sử dụng nhiều memory với job lớn
4. **Networking**: Đảm bảo Redis accessible từ application

## Tương lai

Có thể mở rộng thêm:

- Dead letter queue for failed jobs
- Job scheduling cho delayed enrollment
- Email notifications cho job completion
- Dashboard UI cho queue monitoring
- Metrics và analytics
