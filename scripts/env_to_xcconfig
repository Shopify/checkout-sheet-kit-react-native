#!/usr/bin/env bash

# Set script directory and file paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default paths (when running from repository root)
ENV_FILE_PATH="${SCRIPT_DIR}/../sample/.env"
XCCONFIG_FILE_PATH="${SCRIPT_DIR}/../sample/ios/JSEnvironment.xcconfig"

# Override if PROJECT_DIR is set (Xcode provides this in scheme build pre-action)
if [[ -n "$PROJECT_DIR" ]]; then
    ENV_FILE_PATH="${PROJECT_DIR}/../.env"
    XCCONFIG_FILE_PATH="${PROJECT_DIR}/JSEnvironment.xcconfig"
fi

# Function to convert .env to xcconfig
convert_env_to_xcconfig() {
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE_PATH" ]]; then
        echo "Error: .env file not found at $ENV_FILE_PATH" >&2
        exit 1
    fi

    # Create or clear the xcconfig file
    > "$XCCONFIG_FILE_PATH"

    # Read the .env file line by line
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Handle empty lines
        if [[ -z "${line// }" ]]; then
            echo "" >> "$XCCONFIG_FILE_PATH"
            continue
        fi

        # Handle comments (lines starting with #)
        if [[ "$line" =~ ^[[:space:]]*# ]]; then
            # Convert # comment to // comment
            converted_comment=$(echo "$line" | sed 's/^\([[:space:]]*\)#/\1\/\//')
            echo "$converted_comment" >> "$XCCONFIG_FILE_PATH"
            continue
        fi

        # Handle environment variable declarations
        # Check if line contains an equals sign
        if [[ "$line" != *"="* ]]; then
            # If no equals sign, preserve the line as is (might be multiline continuation)
            echo "$line" >> "$XCCONFIG_FILE_PATH"
            continue
        fi

        # Split on first equals sign
        key="${line%%=*}"
        value="${line#*=}"

        # Trim whitespace from key
        key=$(echo "$key" | xargs)

        # Check if key is empty
        if [[ -z "$key" ]]; then
            echo "Warning: Skipping invalid line (empty key): $line" >&2
            continue
        fi

        # Trim whitespace from value
        value=$(echo "$value" | xargs)

        # Remove outer quotes if present (both single and double quotes)
        if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
            # Remove first and last character (the quotes)
            value="${value:1:-1}"
        fi

        # Write to xcconfig without quotes
        echo "${key}=${value}" >> "$XCCONFIG_FILE_PATH"

    done < "$ENV_FILE_PATH"

    echo "✅ Successfully converted $ENV_FILE_PATH to $XCCONFIG_FILE_PATH"
}

# Run the conversion
convert_env_to_xcconfig