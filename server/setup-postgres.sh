#!/bin/bash
# Run this once to create the local database
createdb skillsnjobs 2>/dev/null || echo "Database may already exist"
echo "PostgreSQL database 'skillsnjobs' ready"
