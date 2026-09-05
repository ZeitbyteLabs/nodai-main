#!/usr/bin/env node
import { runCli } from '../src/cli.mjs';

runCli(process.argv).catch((error) => {
	console.error(`\nError: ${error.message ?? error}\n`);
	process.exit(1);
});
