#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_FILE_PATH = path.join(__dirname, '..', 'sample', '.env');
const XCCONFIG_FILE_PATH = path.join(__dirname, '..', 'sample', 'ios', 'JSEnvironment.xcconfig');

function convertEnvToXcconfig() {
  try {
    // Check if .env file exists
    if (!fs.existsSync(ENV_FILE_PATH)) {
      console.error(`Error: .env file not found at ${ENV_FILE_PATH}`);
      process.exit(1);
    }

    // Read the .env file
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const lines = envContent.split('\n');

    const xcconfigLines = [];

    for (const line of lines) {
      // Handle empty lines
      if (line.trim() === '') {
        xcconfigLines.push('');
        continue;
      }

      // Handle comments (lines starting with #)
      if (line.trim().startsWith('#')) {
        // Convert # comment to // comment
        const commentContent = line.replace(/^(\s*)#/, '$1//');
        xcconfigLines.push(commentContent);
        continue;
      }

      // Handle environment variable declarations
      const firstEqualsIndex = line.indexOf('=');

      // If no equals sign found, treat as a comment or skip
      if (firstEqualsIndex === -1) {
        // If the line has content but no equals, preserve it as is (might be multiline continuation)
        xcconfigLines.push(line);
        continue;
      }

      const key = line.substring(0, firstEqualsIndex).trim();
      const value = line.substring(firstEqualsIndex + 1);

      // Verify both key and value are non-empty after trimming
      if (key === '') {
        // Invalid line, skip it
        console.warn(`Warning: Skipping invalid line (empty key): ${line}`);
        continue;
      }

      // Check if value already has double quotes
      const trimmedValue = value.trim();
      let finalValue = trimmedValue;

      if (!trimmedValue.startsWith('"') || !trimmedValue.endsWith('"')) {
        // Wrap in quotes if not already quoted
        finalValue = `"${trimmedValue}"`;
      }

      xcconfigLines.push(`${key}=${finalValue}`);
    }

    // Write to xcconfig file
    const xcconfigContent = xcconfigLines.join('\n');
    fs.writeFileSync(XCCONFIG_FILE_PATH, xcconfigContent, 'utf8');

    console.log(`✅ Successfully converted ${ENV_FILE_PATH} to ${XCCONFIG_FILE_PATH}`);

  } catch (error) {
    console.error(`Error converting .env to xcconfig: ${error.message}`);
    process.exit(1);
  }
}

// Run the conversion
convertEnvToXcconfig();