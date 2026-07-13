// Patches expo-modules-jsi's build script to disable codesigning on the
// nested xcodebuild call. Required because the project lives on iCloud Drive
// (Desktop), which adds extended attributes that codesign rejects.
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(
  __dirname,
  '../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh'
);

if (!fs.existsSync(scriptPath)) {
  console.log('patch-expo-modules-jsi: script not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(scriptPath, 'utf8');

const marker = 'CODE_SIGNING_ALLOWED=NO';
if (content.includes(marker)) {
  console.log('patch-expo-modules-jsi: already patched');
  process.exit(0);
}

content = content.replace(
  'SWIFT_COMPILATION_MODE=wholemodule \\',
  'SWIFT_COMPILATION_MODE=wholemodule \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\'
);

fs.writeFileSync(scriptPath, content, 'utf8');
console.log('patch-expo-modules-jsi: patched build-xcframework.sh');
