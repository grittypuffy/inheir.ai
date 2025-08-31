# InHeir.AI Backend

Backend for InHeir.AI – a property and title resolution platform.  
Built with **FastAPI**, MongoDB, and integrates with Azure AI services.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Setup & Installation](#setup--installation)
- [Running the Server](#running-the-server)
- [Running the Server with HTTPS](#running-the-server-with-https)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [License](#license)

---

## Features

- User authentication (JWT-based)
- Case creation, management, and resolution
- Chatbot and RAG (Retrieval-Augmented Generation) support
- GIS and property data integration
- Admin and reporting endpoints
- Azure AI and OpenAI integration

---

## Project Structure

```
inheir-backend/
│
├── src/
│   └── inheir_backend/
│       ├── routers/          # FastAPI routers (API endpoints)
│       ├── models/           # Pydantic models and schemas
│       ├── services/         # Business logic, RAG, storage, etc.
│       ├── helpers/          # Utility functions (auth, serialization, etc.)
│       ├── middleware/       # JWT and other middleware
│       ├── config/           # App and environment config
│       ├── constants/        # Constants (e.g., CORS settings)
│       └── server.py         # FastAPI app entrypoint
│
├── data/                     # Reference legal/property documents
├── functions/ChatBotFunction # Azure Function for chatbot (serverless)
├── Dockerfile                # Docker build for backend
├── pyproject.toml            # Poetry project config
├── poetry.lock               # Poetry lock file
├── README.md                 # This file
└── tests/                    # Test suite
```

---

## API Overview

All endpoints are prefixed with `/api/v1/`.

### Main Routers

- **/auth**: Authentication (sign in, sign up, is_admin, etc.)
- **/case**: Case management (create, history, resolve, abort, chats, etc.)
- **/report**: Reporting and admin verification
- **/chatbot**: Chatbot and AI endpoints
- **/gis**: GIS and property data

### Example Endpoints

- `POST /api/v1/auth/sign_in` – User login
- `POST /api/v1/auth/sign_up` – User registration
- `GET  /api/v1/case/is_admin` – Check if current user is admin
- `POST /api/v1/case/create` – Create a new case
- `GET  /api/v1/case/history` – List user's cases
- `POST /api/v1/case/{case_id}/resolve` – Resolve a case
- `POST /api/v1/case/{case_id}/abort` – Abort a case
- `GET  /api/v1/case/{case_id}/chats` – Get chats for a case
- `GET  /api/v1/report/all` – Get all reports (admin only)

---

## Setup & Installation

### Prerequisites

- Python 3.13+
- Poetry (for dependency management)
- MongoDB (running instance)
- (Optional) Docker

### Install dependencies

```bash
poetry install
```

### Environment Variables

Create a `.env` file or set the following variables:

- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – Secret for JWT signing
- `FRONTEND_URL` – Allowed CORS origin
- Azure/OpenAI keys as needed for AI features

---

## Running the Server

### With Poetry

```bash
poetry run uvicorn inheir_backend.server:app --reload --host 0.0.0.0 --port 8000
```

### With Docker

Build and run the backend:

```bash
docker build -t inheir-backend .
docker run -p 8000:8000 --env-file .env inheir-backend
```

---

## Running the Server with HTTPS

### 1. Generate Trusted Local Certificates with mkcert (Recommended for Local Development)

[mkcert](https://github.com/FiloSottile/mkcert) is a simple tool to make locally-trusted development certificates.

Install mkcert (see [mkcert installation guide](https://github.com/FiloSottile/mkcert#installation)):

```bash
# Install mkcert (example for Windows via Chocolatey)
choco install mkcert

# Or for Mac
brew install mkcert
brew install nss # if you use Firefox

# Or for Linux (see mkcert docs)
```

Set up the local CA (first time only):

```bash
mkcert -install
```

Generate certificates for localhost:

```bash
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 ::1
```

This will create `cert.pem` and `key.pem` in the `certs/` directory, trusted by your local browsers.

### 2. Generate Self-Signed Certificates with OpenSSL (Alternative)

You can also generate a self-signed certificate using OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem \
  -subj "/CN=localhost"
```

This will create `cert.pem` and `key.pem` in a `certs/` directory, but browsers may show warnings.

### 3. Run with Uvicorn (Development)

```bash
poetry run uvicorn inheir_backend.server:app --reload --host 0.0.0.0 --port 8000 \
  --ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem
```

### 4. Run with Docker (Production)

For production, you should use a reverse proxy (like Nginx or Traefik) to handle HTTPS, or mount your certificates and configure Gunicorn/Uvicorn accordingly.

Example (if you want to run Gunicorn directly with SSL):

```bash
docker run -p 8000:8000 \
  -v $(pwd)/certs:/certs \
  --env-file .env \
  inheir-backend \
  poetry run python -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:8000 \
    --keyfile /certs/key.pem --certfile /certs/cert.pem inheir_backend.server:app
```

> **Note:** For production, always use certificates from a trusted CA.

---

## Development

- Code is organized by feature (routers, models, services, etc.)
- Uses FastAPI for API, Motor for async MongoDB, and Pydantic for validation
- JWT-based authentication via custom middleware
- CORS is enabled for the frontend URL

---

## License

This project is licensed under the MIT License.

---
