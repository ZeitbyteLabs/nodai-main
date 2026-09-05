#!/usr/bin/env node
/**
 * NodAI Phase 3 — one-time Solana devnet setup.
 *
 * Creates a treasury keypair, mints the NOD SPL token, and mints the initial
 * supply into the treasury's token account. Prints the two env vars the app
 * needs. Safe to re-run: existing artifacts under .solana/ are reused.
 *
 * Usage:
 *   node scripts/setup-nod-token.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } from '@solana/spl-token';
import bs58 from 'bs58';

const b58 = bs58.default ?? bs58;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = join(ROOT, '.solana');
const TREASURY_FILE = join(STORE, 'treasury.json');
const MINT_FILE = join(STORE, 'nod-mint.json');

const DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000_000; // 1B NOD
/**
 * Enough for mint rent (~0.0015), the treasury token account (~0.002), and
 * many thousands of reward transfers (~0.000005 each).
 */
const MIN_SOL = 0.1;
/** Below this there is not enough to create the mint at all. */
const FLOOR_SOL = 0.02;

function readEnvFile() {
	const path = join(ROOT, '.env');
	if (!existsSync(path)) return {};

	return Object.fromEntries(
		readFileSync(path, 'utf8')
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#') && line.includes('='))
			.map((line) => {
				const index = line.indexOf('=');
				return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
			})
	);
}

const fileEnv = readEnvFile();
const RPC_URL =
	process.env.SOLANA_RPC_URL || fileEnv.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function log(message) {
	console.log(message);
}

/** Loads the saved treasury, or generates and persists a fresh one. */
function loadTreasury() {
	mkdirSync(STORE, { recursive: true });

	if (existsSync(TREASURY_FILE)) {
		const saved = JSON.parse(readFileSync(TREASURY_FILE, 'utf8'));
		log(`==> Reusing treasury from .solana/treasury.json`);
		return Keypair.fromSecretKey(Uint8Array.from(saved.secretKey));
	}

	const keypair = Keypair.generate();
	writeFileSync(
		TREASURY_FILE,
		JSON.stringify(
			{
				publicKey: keypair.publicKey.toBase58(),
				secretKey: Array.from(keypair.secretKey)
			},
			null,
			2
		)
	);
	log(`==> Generated a new treasury keypair`);
	return keypair;
}

/**
 * Devnet faucets are aggressively rate limited, so treat a failed airdrop as a
 * prompt for the user rather than a fatal error.
 */
async function ensureSol(connection, treasury) {
	let balance = await connection.getBalance(treasury.publicKey);
	log(`    Treasury SOL: ${(balance / LAMPORTS_PER_SOL).toFixed(4)}`);

	if (balance / LAMPORTS_PER_SOL >= MIN_SOL) return;

	log(`==> Requesting a devnet SOL airdrop`);
	for (let attempt = 1; attempt <= 2; attempt += 1) {
		try {
			const signature = await connection.requestAirdrop(treasury.publicKey, 1 * LAMPORTS_PER_SOL);
			await connection.confirmTransaction(signature, 'confirmed');
			balance = await connection.getBalance(treasury.publicKey);
			log(`    Airdrop confirmed. Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
			if (balance / LAMPORTS_PER_SOL >= MIN_SOL) return;
		} catch {
			log(`    Airdrop attempt ${attempt} was rate limited.`);
		}
	}

	// The public faucet refuses most requests, so hand off to the web faucet
	// rather than failing with an RPC error later during mint creation.
	if (balance / LAMPORTS_PER_SOL < FLOOR_SOL) {
		log('');
		log('!! The devnet faucet would not fund the treasury (this is common).');
		log('!! Fund it manually, then re-run: npm run nod:setup');
		log('');
		log(`     Address: ${treasury.publicKey.toBase58()}`);
		log('     Faucet:  https://faucet.solana.com  (paste the address, pick Devnet)');
		log('');
		log('     0.1 SOL is plenty. It is free and takes about 20 seconds.');
		log('');
		process.exit(1);
	}

	log(`    Continuing with ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
}

async function loadOrCreateMint(connection, treasury) {
	if (existsSync(MINT_FILE)) {
		const saved = JSON.parse(readFileSync(MINT_FILE, 'utf8'));
		const mint = new PublicKey(saved.mint);
		try {
			await getMint(connection, mint);
			log(`==> Reusing NOD mint from .solana/nod-mint.json`);
			return mint;
		} catch {
			log(`==> Saved mint is not on this cluster; creating a new one`);
		}
	}

	log(`==> Creating the NOD mint (${DECIMALS} decimals)`);
	const mint = await createMint(
		connection,
		treasury,
		treasury.publicKey, // mint authority
		treasury.publicKey, // freeze authority
		DECIMALS
	);

	writeFileSync(MINT_FILE, JSON.stringify({ mint: mint.toBase58(), decimals: DECIMALS }, null, 2));
	return mint;
}

async function main() {
	log('');
	log('NodAI — NOD token setup');
	log(`RPC: ${RPC_URL}`);
	log('');

	const connection = new Connection(RPC_URL, 'confirmed');
	const treasury = loadTreasury();
	log(`    Treasury: ${treasury.publicKey.toBase58()}`);

	await ensureSol(connection, treasury);

	const mint = await loadOrCreateMint(connection, treasury);
	log(`    Mint: ${mint.toBase58()}`);

	log(`==> Ensuring the treasury token account exists`);
	const treasuryAta = await getOrCreateAssociatedTokenAccount(
		connection,
		treasury,
		mint,
		treasury.publicKey
	);

	const info = await getMint(connection, mint);
	const supply = Number(info.supply) / 10 ** info.decimals;

	if (supply === 0) {
		log(`==> Minting ${INITIAL_SUPPLY.toLocaleString()} NOD to the treasury`);
		await mintTo(
			connection,
			treasury,
			mint,
			treasuryAta.address,
			treasury,
			BigInt(INITIAL_SUPPLY) * BigInt(10) ** BigInt(DECIMALS)
		);
	} else {
		log(`==> Supply already minted: ${supply.toLocaleString()} NOD`);
	}

	log('');
	log('-----------------------------------------------------------');
	log('Add these two lines to nodai-main/.env');
	log('-----------------------------------------------------------');
	log('');
	log(`NOD_MINT_ADDRESS=${mint.toBase58()}`);
	log(`TREASURY_SECRET_KEY=${b58.encode(treasury.secretKey)}`);
	log('');
	log('-----------------------------------------------------------');
	log(`Treasury token account: ${treasuryAta.address.toBase58()}`);
	log(`Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
	log('-----------------------------------------------------------');
	log('');
	log('Keep .solana/treasury.json private. It is gitignored.');
	log('');
}

main().catch((error) => {
	console.error('');
	console.error('Setup failed:', error.message ?? error);
	console.error('');
	process.exit(1);
});
