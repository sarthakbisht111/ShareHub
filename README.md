# ShareHub

A production-grade Pastebin clone built with Node.js, Redis, MongoDB, AWS S3, and Docker — deployed on AWS EC2.

![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-5-black?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3%20%7C%20ECR-orange?style=flat-square&logo=amazon-aws)

## What is ShareHub?

ShareHub lets you paste and share text or code snippets via a short link. Built to learn and demonstrate real-world backend engineering concepts including caching, rate limiting, queue-based async processing, cloud storage, and containerized deployment.

## Features

- **Paste creation** — share text or code with a generated short link
- **Syntax highlighting** — powered by highlight.js for 10+ languages
- **Redis caching** — pastes served from cache on repeat visits (sub-millisecond reads)
- **Auto-expiry** — TTL-based expiry using Redis and MongoDB TTL indexes (1h / 1d / 1w / never)
- **Rate limiting** — sliding window algorithm (10 requests/min per IP) using Redis sorted sets
- **S3 storage** — pastes over 10KB automatically stored in AWS S3 instead of MongoDB
- **View tracking** — atomic view count per paste using Redis INCR
- **Analytics dashboard** — total pastes, views, language breakdown, storage breakdown
- **Input validation** — request validation using Zod
- **Structured logging** — Pino logger writing to terminal and file
- **Dockerized** — full Docker Compose setup for local development
- **Production deployed** — running on AWS EC2, image hosted on AWS ECR

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Database | MongoDB 7 (Mongoose) |
| Cache + Rate limit | Redis 7 (ioredis) |
| File storage | AWS S3 |
| Validation | Zod |
| Logging | Pino + pino-http |
| Templating | EJS |
| Container | Docker + Docker Compose |
| Registry | AWS ECR |
| Deployment | AWS EC2 |
| Security | Helmet, CORS, Compression |

## Architecture

```
Client
  │
  ▼
Express Server (EC2)
  │
  ├── Rate Limiter (Redis sliding window)
  │
  ├── POST /api/pastes
  │     ├── Validate input (Zod)
  │     ├── Content > 10KB? → Upload to S3
  │     ├── Save metadata to MongoDB
  │     └── Cache in Redis with TTL
  │
  ├── GET /api/pastes/:id
  │     ├── Check Redis cache → HIT: return instantly
  │     └── MISS: fetch MongoDB → fetch S3 if needed → cache result
  │
  └── GET /api/pastes/:id/stats
        ├── Fetch metadata from MongoDB
        └── Fetch view count from Redis
```

## Project Structure

```
ShareHub/
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── redis.js        # Redis client
│   │   └── logger.js       # Pino logger
│   ├── controllers/
│   │   ├── paste.controller.js
│   │   └── view.controller.js
│   ├── middleware/
│   │   ├── rateLimiter.js  # Sliding window rate limiter
│   │   ├── validate.js     # Zod validation middleware
│   │   └── errorHandler.js # Central error handler
│   ├── models/
│   │   └── pasteModel.js
│   ├── routes/
│   │   ├── paste.routes.js # API routes
│   │   └── view.routes.js  # EJS view routes
│   ├── services/
│   │   └── s3.service.js   # S3 upload/download/delete
│   ├── validator/
│   │   └── envValidator.js # Zod env validation
│   ├── views/              # EJS templates
│   ├── public/             # CSS + JS
│   └── app.js
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── server.js
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### Setup

```bash
# clone the repo
git clone https://github.com/sarthakbisht111/ShareHub.git
cd ShareHub

# install dependencies
npm install

# copy env file and fill in values
cp .env.example .env
```

### Run with Docker (recommended)

```bash
docker-compose up
```

App runs at `http://localhost:8001`

### Run without Docker

Make sure MongoDB and Redis are running locally, then:

```bash
npm run dev
```

## Environment Variables

```env
PORT=8001
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/sharehub

REDIS_HOST=localhost
REDIS_PORT=6379

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your_bucket_name
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/pastes | Create a paste |
| GET | /api/pastes/:id | Get a paste |
| GET | /api/pastes/:id/raw | Get raw content |
| GET | /api/pastes/:id/stats | Get paste stats |
| DELETE | /api/pastes/:id | Delete a paste |
| GET | /api/pastes/recent | Get recent pastes |
| GET | /api/pastes/analytics | Get analytics data |

### Create paste request body

```json
{
  "title": "My snippet",
  "content": "console.log('hello')",
  "language": "javascript",
  "expiry": "1d"
}
```

`expiry` options: `1h` `1d` `1w` `never`

## Key Engineering Decisions

**Why Redis for rate limiting?**
Redis sorted sets allow sliding window rate limiting — each request is stored with its timestamp as the score. Requests outside the window are removed atomically before counting. More accurate than fixed window counters.

**Why S3 for large pastes?**
MongoDB documents have a 16MB limit and storing large text blobs degrades query performance. Pastes over 10KB are offloaded to S3, with only the S3 key stored in MongoDB.

**Why cache-aside pattern?**
On GET requests, Redis is checked first. On a cache miss, MongoDB is queried and the result is cached with a TTL matching the paste expiry. This keeps Redis and MongoDB in sync without over-caching.

**Why Docker before EC2?**
Containerizing first means EC2 deployment is just `docker-compose up`. No manual Node.js, MongoDB, or Redis installation on the server. Same image runs in dev and production.

## Deployment

The app is containerized and deployed on AWS EC2 using Docker Compose. The image is stored in AWS ECR (Elastic Container Registry).

```bash
# build and push to ECR
docker build -t sharehub-app .
docker tag sharehub-app <ecr-uri>:latest
docker push <ecr-uri>:latest

# on EC2
docker-compose pull
docker-compose up -d
```
