#!/bin/bash

# update_pharmacies.sh

set -e  # Exit immediately if a command exits with a non-zero status

# Directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Run the Python script to fetch and process pharmacy data
python3 extract_table_data.py

echo "Pharmacy data update complete"