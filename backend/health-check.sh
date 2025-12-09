#!/bin/bash
# Health check script for Railway
# This ensures the server is actually running before marking as healthy

curl -f http://localhost:${PORT:-3001}/health || exit 1

