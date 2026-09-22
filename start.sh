#!/bin/bash
# Double-click this file (or run ./start.sh) to set up and launch the BODMAS server.
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env with a default admin password (admin / changeme123)."
  echo "You can edit .env later to set your own password."
fi

if [ ! -d node_modules ]; then
  echo "First time setup — installing dependencies, this takes a minute..."
  npm install
fi

echo ""
echo "Starting server..."
echo "Game:  http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo ""
npm start
