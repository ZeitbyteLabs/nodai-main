import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import {
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	Transaction,
	sendAndConfirmTransaction
} from '@solana/web3.js';
import {
	TokenAccountNotFoundError,
	TokenInvalidAccountOwnerError,
	createAssociatedTokenAccountInstruction,
	createTransferCheckedInstruction,
	getAccount,
	getAssociatedTokenAddress,
	getMint
} from '@solana/spl-token';
import bs58 from 'bs58';

/**
 * Treasury-side NOD operations. The mint authority key never leaves the
 * server, so every on-chain credit is issued from here.
 */

const b58 = (bs58 as unknown as { default?: typeof bs58 }).default ?? bs58;

export class SolanaError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'SolanaError';
	}
}

function rpcUrl() {
	return (env.SOLANA_RPC_URL ?? '').trim() || 'https://api.devnet.solana.com';
}

export function cluster() {
	return (publicEnv.PUBLIC_SOLANA_CLUSTER ?? '').trim() || 'devnet';
}

export function connection() {
	return new Connection(rpcUrl(), 'confirmed');
}

function mintAddress() {
	return (env.NOD_MINT_ADDRESS ?? '').trim();
}

function secretKey() {
	return (env.TREASURY_SECRET_KEY ?? '').trim();
}

/** True once both the mint and the treasury key are present in the env. */
export function isNodTokenConfigured() {
	return mintAddress().length > 0 && secretKey().length > 0;
}

export function nodMint() {
	const address = mintAddress();
	if (!address) throw new SolanaError('NOD_MINT_ADDRESS is not set.', 503);

	try {
		return new PublicKey(address);
	} catch {
		throw new SolanaError('NOD_MINT_ADDRESS is not a valid public key.', 500);
	}
}

/**
 * Accepts either a base58 string (what the setup script prints, and what
 * wallets export) or a JSON byte array (what `solana-keygen` writes).
 */
export function treasuryKeypair() {
	const raw = secretKey();
	if (!raw) throw new SolanaError('TREASURY_SECRET_KEY is not set.', 503);

	let bytes: Uint8Array;
	try {
		bytes = raw.startsWith('[') ? Uint8Array.from(JSON.parse(raw)) : b58.decode(raw);
	} catch {
		throw new SolanaError('TREASURY_SECRET_KEY could not be decoded.', 500);
	}

	try {
		return Keypair.fromSecretKey(bytes);
	} catch {
		throw new SolanaError('TREASURY_SECRET_KEY is not a valid Solana secret key.', 500);
	}
}

export function parseOwner(address: string) {
	try {
		return new PublicKey(address);
	} catch {
		throw new SolanaError('That wallet address is not valid.', 400);
	}
}

/** Decimal-safe conversion, so 0.005 NOD never lands a rounding error. */
function toBaseUnits(amount: number, decimals: number): bigint {
	const [whole, fraction = ''] = amount.toFixed(decimals).split('.');
	return BigInt(`${whole}${fraction.padEnd(decimals, '0')}`);
}

function fromBaseUnits(raw: bigint, decimals: number): number {
	return Number(raw) / 10 ** decimals;
}

let cachedDecimals: number | null = null;

async function mintDecimals(conn: Connection, mint: PublicKey) {
	if (cachedDecimals !== null) return cachedDecimals;

	const info = await getMint(conn, mint);
	cachedDecimals = info.decimals;
	return cachedDecimals;
}

export function explorerTxUrl(signature: string) {
	return `https://explorer.solana.com/tx/${signature}?cluster=${cluster()}`;
}

export function explorerAddressUrl(address: string) {
	return `https://explorer.solana.com/address/${address}?cluster=${cluster()}`;
}

export type NodAccount = {
	/** null when the wallet has never held NOD (no token account yet). */
	balance: number | null;
	mint: string;
};

/** Reads the on-chain NOD balance for a wallet. */
export async function readNodBalance(ownerAddress: string): Promise<NodAccount> {
	const mint = nodMint();
	const owner = parseOwner(ownerAddress);
	const conn = connection();

	const ata = await getAssociatedTokenAddress(mint, owner);

	try {
		const account = await getAccount(conn, ata);
		const decimals = await mintDecimals(conn, mint);
		return { balance: fromBaseUnits(account.amount, decimals), mint: mint.toBase58() };
	} catch (cause) {
		// No token account means a zero balance, not a failure.
		if (
			cause instanceof TokenAccountNotFoundError ||
			cause instanceof TokenInvalidAccountOwnerError
		) {
			return { balance: null, mint: mint.toBase58() };
		}
		throw cause;
	}
}

/** SOL left in the treasury; each reward transfer costs a small fee. */
export async function treasurySol() {
	const treasury = treasuryKeypair();
	const lamports = await connection().getBalance(treasury.publicKey);
	return lamports / LAMPORTS_PER_SOL;
}

/**
 * Transfers NOD from the treasury to a wallet, creating the recipient's token
 * account on first use. Returns the confirmed transaction signature.
 */
export async function transferNod(ownerAddress: string, amount: number): Promise<string> {
	if (amount <= 0) throw new SolanaError('Transfer amount must be positive.', 400);

	const treasury = treasuryKeypair();
	const mint = nodMint();
	const owner = parseOwner(ownerAddress);
	const conn = connection();
	const decimals = await mintDecimals(conn, mint);

	const source = await getAssociatedTokenAddress(mint, treasury.publicKey);
	const destination = await getAssociatedTokenAddress(mint, owner);

	const transaction = new Transaction();

	let needsAccount = false;
	try {
		await getAccount(conn, destination);
	} catch (cause) {
		if (
			cause instanceof TokenAccountNotFoundError ||
			cause instanceof TokenInvalidAccountOwnerError
		) {
			needsAccount = true;
		} else {
			throw cause;
		}
	}

	if (needsAccount) {
		transaction.add(
			createAssociatedTokenAccountInstruction(treasury.publicKey, destination, owner, mint)
		);
	}

	transaction.add(
		createTransferCheckedInstruction(
			source,
			mint,
			destination,
			treasury.publicKey,
			toBaseUnits(amount, decimals),
			decimals
		)
	);

	try {
		return await sendAndConfirmTransaction(conn, transaction, [treasury], {
			commitment: 'confirmed'
		});
	} catch (cause) {
		const detail = cause instanceof Error ? cause.message : '';

		if (/insufficient funds|Attempt to debit/i.test(detail)) {
			throw new SolanaError(
				'The treasury is out of SOL or NOD. Top it up before claiming again.',
				503
			);
		}
		throw new SolanaError(`On-chain transfer failed. ${detail.slice(0, 160)}`.trim(), 502);
	}
}
