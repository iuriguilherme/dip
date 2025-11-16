#!/bin/bash

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

# Check if update.sql exists
if [ -f "${PROJECT_ROOT}/instance/update.sql" ]; then
    echo "Found update.sql, executing..."

    ENV_FILE="${PROJECT_ROOT}/.env"

    # Check if .env file exists
    if [ ! -f "${ENV_FILE}" ]; then
        echo "Error: .env file not found at ${ENV_FILE}"
        exit 1
    fi

    # Extract POSTGRES_USER and POSTGRES_DB from .env
    POSTGRES_USER=$(grep "^POSTGRES_USER=" "${ENV_FILE}" | cut -d '=' -f2- | sed 's/^["'\'']\(.*\)["'\'']$/\1/' | xargs)
    POSTGRES_DB=$(grep "^POSTGRES_DB=" "${ENV_FILE}" | cut -d '=' -f2- | sed 's/^["'\'']\(.*\)["'\'']$/\1/' | xargs)

    if [ -z "${POSTGRES_USER}" ] || [ -z "${POSTGRES_DB}" ]; then
        echo "Error: POSTGRES_USER or POSTGRES_DB not found in .env file"
        exit 1
    fi

    # Extract postgres container name from docker-compose.yml
    if [ ! -f "${PROJECT_ROOT}/docker-compose.yml" ]; then
        echo "Error: docker-compose.yml not found at ${PROJECT_ROOT}/docker-compose.yml"
        exit 1
    fi

    CONTAINER_NAME=$(grep -A 2 "^  postgres:" "${PROJECT_ROOT}/docker-compose.yml" | grep "container_name:" | awk '{print $2}')

    if [ -z "${CONTAINER_NAME}" ]; then
        echo "Error: Could not find postgres container_name in docker-compose.yml"
        exit 1
    fi

    echo "Using container: ${CONTAINER_NAME}"
    echo "Database: ${POSTGRES_DB}"
    echo "User: ${POSTGRES_USER}"
    echo ""
    
    # Copy the update.sql file to the container
    docker cp "${PROJECT_ROOT}/instance/update.sql" "${CONTAINER_NAME}:/update.sql"

    # Execute the update.sql file
    docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f /update.sql

    # Remove the update.sql file from the container
    docker exec -i "${CONTAINER_NAME}" rm /update.sql
    
    echo "Done!"
else
    echo "No update.sql file found at ${PROJECT_ROOT}/instance/update.sql"
fi
