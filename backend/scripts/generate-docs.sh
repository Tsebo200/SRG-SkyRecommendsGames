#!/bin/bash
# Generate Swagger documentation

# Install swag if not present
if ! command -v swag &> /dev/null; then
    echo "Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
fi

# Generate docs
echo "Generating Swagger docs..."
swag init -g cmd/server/main.go -o cmd/server/docs

echo "Docs generated in cmd/server/docs/"
echo "Start server and visit: http://localhost:8080/swagger/index.html"

