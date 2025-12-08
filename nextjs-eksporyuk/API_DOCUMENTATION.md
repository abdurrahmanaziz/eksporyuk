# API Documentation - Eksporyuk Web App

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.eksporyuk.com
```

## Authentication

All API requests (except register & login) require authentication using NextAuth session.

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Registrasi berhasil",
  "user": {
    "id": "clx...",
    "email": "john@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "role": "MEMBER_FREE",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Login
```http
POST /api/auth/[...nextauth]
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

## Users API

### Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10&search=john&role=MEMBER_PREMIUM
```

Response:
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Get User Detail
```http
GET /api/users/{userId}
```

### Update User
```http
PATCH /api/users/{userId}
Content-Type: application/json

{
  "name": "New Name",
  "bio": "New bio",
  "avatar": "url",
  "phone": "+62123456789"
}
```

### Delete User (Admin Only)
```http
DELETE /api/users/{userId}
```

## Dashboard API

### Get Statistics
```http
GET /api/dashboard/stats?period=month
```

Query Parameters:
- `period`: day, week, month, year

Response includes role-specific stats:
```json
{
  "admin": {
    "totalUsers": 1000,
    "totalRevenue": 100000000,
    "totalTransactions": 500,
    "pendingPayouts": 10,
    "activeMembers": 800,
    "totalGroups": 50,
    "totalProducts": 100,
    "revenueByType": [...],
    "wallet": {...}
  },
  "mentor": {
    "totalStudents": 50,
    "totalCourses": 5,
    "revenue": 5000000
  },
  "affiliate": {
    "totalClicks": 1000,
    "totalConversions": 50,
    "totalEarnings": 2000000,
    "recentClicks": 100,
    "recentConversions": 10,
    "recentEarnings": 500000
  },
  "recentActivities": [...]
}
```

## Products API

### Get All Products
```http
GET /api/products?page=1&limit=10&category=digital&search=course
```

### Get Product Detail
```http
GET /api/products/{productId}
```

### Create Product (Mentor/Admin)
```http
POST /api/products
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 100000,
  "originalPrice": 150000,
  "category": "digital",
  "groupId": "group-id",
  "mentorCommission": 30
}
```

### Update Product
```http
PATCH /api/products/{productId}
```

### Delete Product
```http
DELETE /api/products/{productId}
```

## Groups API

### Get All Groups
```http
GET /api/groups?type=PUBLIC&page=1&limit=10
```

### Get Group Detail
```http
GET /api/groups/{groupId}
```

### Create Group
```http
POST /api/groups
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group description",
  "type": "PUBLIC",
  "avatar": "url",
  "coverImage": "url"
}
```

### Join Group
```http
POST /api/groups/{groupId}/join
```

### Leave Group
```http
POST /api/groups/{groupId}/leave
```

### Get Group Posts
```http
GET /api/groups/{groupId}/posts?page=1&limit=20
```

### Create Post in Group
```http
POST /api/groups/{groupId}/posts
Content-Type: application/json

{
  "content": "Post content",
  "images": ["url1", "url2"],
  "type": "POST"
}
```

## Posts API

### Like Post
```http
POST /api/posts/{postId}/like
```

### Unlike Post
```http
DELETE /api/posts/{postId}/like
```

### Comment on Post
```http
POST /api/posts/{postId}/comments
Content-Type: application/json

{
  "content": "Comment content",
  "parentId": "optional-parent-comment-id"
}
```

### Save Post
```http
POST /api/posts/{postId}/save
```

### Get Saved Posts
```http
GET /api/posts/saved
```

## Affiliate API

### Get Affiliate Profile
```http
GET /api/affiliates/profile
```

### Create Affiliate Link
```http
POST /api/affiliates/links
Content-Type: application/json

{
  "productId": "product-id",
  "membershipId": "membership-id"
}
```

### Get Affiliate Statistics
```http
GET /api/affiliates/stats?period=month
```

### Get Affiliate Links
```http
GET /api/affiliates/links
```

### Track Click (Public)
```http
POST /api/affiliates/track/{shortCode}
```

## Events API

### Get All Events
```http
GET /api/events?upcoming=true&page=1&limit=10
```

### Get Event Detail
```http
GET /api/events/{eventId}
```

### Create Event (Admin/Mentor)
```http
POST /api/events
Content-Type: application/json

{
  "title": "Event Title",
  "description": "Event description",
  "type": "WEBINAR",
  "startDate": "2024-01-01T10:00:00Z",
  "endDate": "2024-01-01T12:00:00Z",
  "location": "Online",
  "maxAttendees": 100,
  "price": 50000,
  "groupId": "group-id"
}
```

### RSVP to Event
```http
POST /api/events/{eventId}/rsvp
Content-Type: application/json

{
  "status": "GOING"
}
```

## Courses API

### Get All Courses
```http
GET /api/courses?mentorId=mentor-id&page=1&limit=10
```

### Get Course Detail
```http
GET /api/courses/{courseId}
```

### Enroll in Course
```http
POST /api/courses/{courseId}/enroll
```

### Get Course Modules
```http
GET /api/courses/{courseId}/modules
```

### Get Module Lessons
```http
GET /api/courses/modules/{moduleId}/lessons
```

## Transactions API

### Create Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "type": "PRODUCT",
  "productId": "product-id",
  "amount": 100000,
  "couponCode": "DISCOUNT10",
  "affiliateCode": "affiliate-code"
}
```

### Get My Transactions
```http
GET /api/transactions?page=1&limit=10&status=SUCCESS
```

### Get Transaction Detail
```http
GET /api/transactions/{transactionId}
```

## Wallet API

### Get Wallet Balance
```http
GET /api/wallet
```

Response:
```json
{
  "id": "wallet-id",
  "balance": 1000000,
  "totalEarnings": 5000000,
  "totalPayout": 4000000
}
```

### Request Payout
```http
POST /api/wallet/payout
Content-Type: application/json

{
  "amount": 500000,
  "bankName": "BCA",
  "accountName": "John Doe",
  "accountNumber": "1234567890",
  "notes": "Monthly payout"
}
```

### Get Payout History
```http
GET /api/wallet/payouts?page=1&limit=10
```

## Coupons API

### Get All Coupons (Admin)
```http
GET /api/coupons
```

### Create Coupon (Admin)
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "DISCOUNT10",
  "description": "10% discount",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minPurchase": 50000,
  "maxDiscount": 100000,
  "usageLimit": 100,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

### Validate Coupon
```http
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "DISCOUNT10",
  "amount": 100000
}
```

## Integrations API

### Get Integration Settings (Admin)
```http
GET /api/integrations
```

### Update Integration (Admin)
```http
PATCH /api/integrations/{name}
Content-Type: application/json

{
  "isEnabled": true,
  "config": {
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret"
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- Public endpoints: 60 requests/minute
- Authenticated endpoints: 120 requests/minute
- Admin endpoints: 300 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1609459200
```

## Pagination

List endpoints support pagination:
```http
GET /api/resource?page=1&limit=10
```

Response includes pagination info:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Webhooks

Configure webhooks in admin panel for:
- Payment success/failure
- New user registration
- Affiliate conversion
- Event RSVP

Webhook payload:
```json
{
  "event": "transaction.success",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```
