import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export async function ask(question, fallback = '') {
	if (!stdin.isTTY) return fallback;

	const rl = createInterface({ input: stdin, output: stdout });
	const hint = fallback ? ` [${fallback}]` : '';
	const answer = (await rl.question(`${question}${hint}: `)).trim();
	rl.close();
	return answer || fallback;
}

export function say(message = '') {
	console.log(message);
}
