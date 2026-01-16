# KestrelsImageAPI

KestrelsImageAPI is a lightweight Node.js-based API that reads image files from a folder, generates different-sized versions, and serves them through an Express server. It efficiently handles image processing and caching to improve performance.


## Features
- Reads images from a specified folder
- Dynamically generates resized versions on-the-fly
- Serves images through Express API
- Implements Redis caching for optimized performance
- Automatic image optimization using Sharp


## Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then clone this repository and install dependencies:

``
sh git clone [https://github.com/yourusername/KestrelsImageAPI.git](https://github.com/yourusername/KestrelsImageAPI.git) 
cd KestrelsImageAPI npm install
``

## Configuration

Create a `.env` file in the project root and configure the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port number for the Express server | `3000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `REDIS_URL` | Redis connection URL for caching | `redis://localhost:6379` |
| `REPO_PATH` | Path to the folder containing the source images | `./images` |
| `LOG_LEVEL` | Logging level (e.g., `info`, `debug`, `error`) | `info` |
| `LOG_COLORIZE` | Enable colorized log output | `true` |

### Example `.env` file:
``
PORT=3000
NODE_ENV=development 
REDIS_URL=redis://localhost:6379 
REPO_PATH=./images 
LOG_LEVEL=info 
LOG_COLORIZE=true
``


## Usage

### Development

Start the API server in development mode with:
``sh npm start``


### Docker

You can also run the API using Docker Compose:
``sh docker-compose up``


The API will be available at `http://localhost:3000/`.

## API Endpoints

### `GET /:filename`
Serves the original image from the configured folder.

### `GET /:filename?size=<size>`
Returns a resized version of the image where `size` specifies the largest dimension (width or height) in pixels. The aspect ratio is preserved.

#### Example Request:
``sh GET /sample.jpg?size=200``

This returns `sample.jpg` resized so its largest side is 200 pixels.

## Logging

The API uses Winston for logging to track requests and errors. Configure logging behavior using:
- `LOG_LEVEL` - Set the verbosity of logs
- `LOG_COLORIZE` - Enable/disable colorized console output

## Caching

- Resized images are cached using Redis to improve performance
- Subsequent requests for the same image and size are served directly from cache
- Cache configuration is managed through the `REDIS_URL` environment variable
