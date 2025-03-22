# KestrelsImageAPI

KestrelsImageAPI is a lightweight Node.js-based API that reads image files from a folder, generates different-sized versions, and serves them through an Express server. It efficiently handles image processing and caching to improve performance.

## Features
- Reads images from a specified folder
- Dynamically generates resized versions
- Serves images through Express API
- Implements caching for optimized performance

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed, then clone this repository and install dependencies:

```sh
git clone https://github.com/yourusername/KestrelsImageAPI.git
cd KestrelsImageAPI
npm install
```

## Configuration

Create a `.env` file in the project root and configure the following environment variables:

```
IMAGE_FOLDER=./images
CACHE_ENABLED=true
CACHE_TTL=3600
REDIS_URL=redis://localhost:6379
PORT=3000
```

## Usage

Start the API server with:

```sh
npm start
```

The API will be available at `http://localhost:3000/`.

## API Endpoints

### `GET /images/:filename`
Serves the original image from the configured folder.

### `GET /images/:filename?width=WIDTH&height=HEIGHT`
Returns a resized version of the image.

#### Example Request:
```sh
GET /images/sample.jpg?width=200&height=200
```

## Logging

The API uses a logging system to track requests and errors. Logs are saved in a specified location.

## Caching

- Images are cached using Redis to improve performance.
- The cache duration is configurable through the `.env` file.

## License

This project is licensed under the MIT License.

