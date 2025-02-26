# SuperPromptor

## How to run

- `npm install`
- `npm run dev`

## Docker Setup

### Using Docker directly
- `docker build . -t superpromptor`
- `docker run -p 3000:3000 superpromptor`

### Using Docker Compose
- `docker-compose up -d` (starts the container in detached mode)
- `docker-compose down` (stops the container)
