#!/usr/bin/env node

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`{{PROJECT_NAME}}

Usage:
  {{PROJECT_NAME}} [options]
  {{PROJECT_NAME}} --help

Replace this CLI with your actual implementation.`);
    process.exit(0);
  }

  console.log(JSON.stringify({ message: 'Hello from {{PROJECT_NAME}}!', args }, null, 2));
}

main();
