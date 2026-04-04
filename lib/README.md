# External Libraries

This directory contains local copies of external JavaScript libraries to enable offline functionality.

## Libraries

- **p5.min.js** (v1.9.0) - p5.js creative coding library
- **CCapture.all.min.js** (v1.1.0) - CCapture.js for video recording
- **jszip.min.js** (v3.10.1) - JSZip for creating ZIP archives
- **marked.min.js** (v11.1.1) - Marked markdown parser

## Fallback Strategy

HTML files are configured to load libraries locally first. If local files fail to load, they automatically fall back to CDN versions:

1. Attempt to load from `lib/` directory (offline-ready)
2. On error, fall back to CDN (online mode)

This ensures the application works both online and offline.
