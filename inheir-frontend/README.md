# Inheir Web

## Overview

Inheir Web is the frontend application for Inheir.AI, a modern platform built with Next.js. This repository contains all the source code and resources needed to build, develop, and deploy the client-side interface.

## Features

- Modern React-based UI with Next.js
- TypeScript for enhanced code quality and developer experience
- Responsive design for all device types
- Component-based architecture for reusability
- Optimized build process for production deployment

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **Bun** (v1.0 or later) - Our preferred package manager
- **Git** - For version control
- **Docker** (optional) - For containerized development and deployment

### Project Structure

The project is organized with the following structure:

```
.
├── public/                       # Static assets
├── src/                          # Source code
│   ├── lib/                      # Libraries and services
│   │   ├── utils.ts              # Utility functions
│   │   ├── components/           # Reusable UI components
│   │   └── validators/           # TypeScript types & validation schemas
│   └── app/                      # Next.js application code
├── .gitignore                    # Git ignore file
├── next.config.js                # Next.js configuration
├── bun.lock                      # Bun lock file for dependencies
├── package.json                  # Project metadata and dependencies
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Dockerfile for containerization
├── LICENSE                       # Project license
└── README.md                     # Project documentation
```

## Development

### Setting Up the Development Environment

#### Method 1: Using Node.js and Bun

```bash
# Clone the repository
git clone https://github.com/vg006/inheir-frontend.git

# Navigate to the project directory
cd inheir-frontend

# Install dependencies
bun install

# Start the development server
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

#### Method 2: Using Docker

```bash
# Clone the repository
git clone https://github.com/vg006/inheir-frontend.git

# Navigate to the project directory
cd inheir-frontend

# Build the Docker image
docker build -t inheir-frontend .

# Run the Docker container
docker run -p 3000:3000 inheir-frontend
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy the `.env.sample` file to `.env` and adjust the variables as needed:

```bash
cp .env.sample .env
```

## Deployment

### Production Build

```bash
# Generate a production-optimized build
bun run build

# Start the production server
bun run start
```

### Docker Deployment

For production deployments using Docker:

```bash
docker build -t inheir-frontend:production --build-arg NODE_ENV=production .
docker run -p 3000:3000 inheir-frontend:production
```

## License

Inheir.AI is licensed under the MIT License. For more information, check [LICENSE](/LICENSE).
