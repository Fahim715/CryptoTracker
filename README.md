# CryptoTracker

CryptoTracker is a full-stack, real-time cryptocurrency analytics dashboard built with Spring Boot, Kafka, MongoDB, and React.

It fetches live market data from CoinGecko, processes and streams updates through Kafka, stores historical data in MongoDB, and delivers live updates to the frontend through Server-Sent Events (SSE) and WebSocket.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Option A: Run with Docker Compose (Recommended)](#option-a-run-with-docker-compose-recommended)
  - [Option B: Run Locally (Without Docker)](#option-b-run-locally-without-docker)
- [API Reference](#api-reference)
- [Streaming Interfaces](#streaming-interfaces)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

## Overview

The platform tracks a default set of symbols:

- BTC
- ETH
- BNB
- SOL
- ADA

Data flow:

1. A scheduled backend job fetches prices from CoinGecko every 15 seconds.
2. The producer publishes each tick to Kafka topic `crypto-prices`.
3. A Kafka consumer persists ticks to MongoDB and aggregates OHLCV candles.
4. Alert rules are evaluated in real time.
5. Updates are pushed to clients via SSE and WebSocket.
6. React dashboard renders live cards, charts, candles, indicators, and alerts.

## Key Features

- Real-time crypto price streaming to frontend
- Historical price API (24h+ query window)
- OHLCV candle generation (1m, 5m, 1h)
- Technical indicators (RSI, MACD, Bollinger Bands, SMA, EMA, trend)
- Price alert creation, deletion, and real-time alert stream
- WebSocket broadcast for low-latency clients
- Token-bucket rate limiter for safe external API usage
- Dockerized backend + frontend + Kafka + Zookeeper + MongoDB

## Architecture

```text
CoinGecko API
   |
   v
Spring Scheduler (fetch every 15s)
   |
   v
Kafka Producer  -->  Kafka Topic: crypto-prices  -->  Kafka Consumer
                                                     |         |
                                                     |         +--> MongoDB (ticks + candles + alerts)
                                                     |
                                                     +--> Alert Service
                                                     |
                                                     +--> SSE /api/prices/stream
                                                     +--> SSE /api/alerts/stream
                                                     +--> WebSocket /ws/prices

React Frontend (dashboard)
```

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.2
- Spring Web / WebFlux
- Spring Kafka
- Spring Data MongoDB
- Spring WebSocket
- Maven

### Frontend

- React 18
- Recharts
- Nginx (container serving production build)

### Infrastructure

- Apache Kafka
- Zookeeper
- MongoDB
- Docker & Docker Compose

## Project Structure

```text
CryptoTracker/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/cryptotracker/
│       ├── config/
│       ├── consumer/
│       ├── controller/
│       ├── model/
│       ├── producer/
│       ├── ratelimit/
│       ├── repository/
│       ├── service/
│       └── websocket/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── components/
        └── hooks/
```

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Or local toolchain:
  - Java 17+
  - Maven 3.9+
  - Node.js 20+
  - npm
  - MongoDB
  - Kafka + Zookeeper

---

### Option A: Run with Docker Compose (Recommended)

From the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Kafka: localhost:9092
- Zookeeper: localhost:2181
- MongoDB: localhost:27017

To stop:

```bash
docker compose down
```

To stop and remove persisted Mongo volume:

```bash
docker compose down -v
```

---

### Option B: Run Locally (Without Docker)

#### 1. Start Infrastructure

Start MongoDB, Kafka, and Zookeeper locally (or via your own setup).

Expected local endpoints:

- MongoDB: `mongodb://localhost:27017/cryptotracker`
- Kafka bootstrap servers: `localhost:9092`

#### 2. Run Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs on: http://localhost:8080

#### 3. Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

The frontend proxy is configured to forward `/api` requests to backend port 8080.

## API Reference

Base URL: `http://localhost:8080/api`

### Price Endpoints

- `GET /prices/latest`  
  Returns latest tick for tracked symbols.

- `GET /prices/history/{symbol}?hours=24`  
  Returns ascending historical ticks.

- `GET /health`  
  Health check endpoint.

### Candle Endpoints

- `GET /candles/{symbol}?interval=1h&limit=100`  
  Returns OHLCV candles. Supported intervals: `1m`, `5m`, `1h`.

### Indicator Endpoints

- `GET /indicators/{symbol}`  
  Returns technical indicators and trend signal.

### Alert Endpoints

- `GET /alerts`  
  Lists all alerts.

- `POST /alerts`  
  Creates a price alert.

  Example request body:

  ```json
  {
    "symbol": "BTC",
    "condition": "ABOVE",
    "targetPrice": 70000
  }
  ```

- `DELETE /alerts/{id}`  
  Deletes an alert.

### System Endpoints

- `GET /system/stats`  
  Returns rate limiter token availability and WebSocket connected client count.

## Streaming Interfaces

### SSE Streams

- Price updates: `GET /api/prices/stream`  
  Event name: `price-update`

- Alert triggers: `GET /api/alerts/stream`  
  Event name: `alert-triggered`

### WebSocket

- Endpoint: `ws://localhost:8080/ws/prices`
- Broadcast payload: `CryptoPrice` JSON per tick

## Configuration

Primary backend settings in `backend/src/main/resources/application.properties`:

- `server.port=8080`
- `spring.data.mongodb.uri=mongodb://localhost:27017/cryptotracker`
- `spring.kafka.bootstrap-servers=localhost:9092`

When running in Docker Compose, service-level environment variables override these values for container networking:

- `SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092`
- `SPRING_DATA_MONGODB_URI=mongodb://mongodb:27017/cryptotracker`

## Troubleshooting

- Frontend loads but no live updates:
  - Verify backend is reachable on port 8080.
  - Confirm SSE endpoint: `http://localhost:8080/api/prices/stream`.

- No data in dashboard:
  - Check backend logs for CoinGecko fetch failures.
  - Ensure Kafka and MongoDB are running.

- Alerts do not trigger:
  - Verify alerts are created via `POST /api/alerts`.
  - Confirm live price ticks are being consumed.

- Docker networking issues:
  - Rebuild cleanly with `docker compose down -v && docker compose up --build`.

## Future Improvements

- Symbol subscription filters for WebSocket clients
- Authentication and per-user alerts
- Redis caching for hot endpoints
- Test coverage for service and controller layers
- Observability stack (Prometheus + Grafana)

## License

No license file is currently included in this repository. Add a LICENSE file if you plan to distribute this project publicly.
