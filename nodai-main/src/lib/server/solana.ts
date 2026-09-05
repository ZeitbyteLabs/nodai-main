import bs58 from 'bs58';
import {
	cluster,
	explorerAddressUrl,
	explorerTxUrl,
	isNodTokenConfigured,
	mintAddressConfigured,
	rpcUrl,
	secretKeyConfigured
} from '$lib/server/solana-config';

export { cluster, explorerAddressUrl, explorerTxUrl, isNodTokenConfigured };

/**
 * Treasury-side NOD operations. Solana libraries are loaded dynamically so
 * Vercel serverless does not hit ESM/CJS issues during SSR.
 */

const b58 = (bs58 as unknown as { default?: typeof bs58 }).default ?? bs58;

type Web3 = typeof import('@solana/web3.js');
type Spl = typeof import('@solana/spl-token');

let web3Promise: Promise<Web3> | null = null;
let splPromise: Promise<Spl> | null = null;

async function web3() {
	web3Promise ??= import('@solana/web3.js');
	return web3Promise;
}

async function spl() {
	splPromise ??= import('@solana/spl-token');
	return splPromise;
}

export class SolanaError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'SolanaError';
	}
}

export async function connection() {
	const { Connection } = await web3();
	return new Connection(rpcUrl(), 'confirmed');
}

async function nodMint() {
	const address = mintAddressConfigured();
	if (!address) throw new SolanaError('NOD_MINT_ADDRESS is not set.', 503);

	const { PublicKey } = await web3();
	try {
		return new PublicKey(address);
	} catch {
		throw new SolanaError('NOD_MINT_ADDRESS is not a valid public key.', 500);
	}
}

async function treasuryKeypair() {
	const raw = secretKeyConfigured();
	if (!raw) throw new SolanaError('TREASURY_SECRET_KEY is not set.', 503);

	const { Keypair } = await web3();

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

async function parseOwner(address: string) {
	const { PublicKey } = await web3();
	try {
		return new PublicKey(address);
	} catch {
		throw new SolanaError('That wallet address is not valid.', 400);
	}
}

function toBaseUnits(amount: number, decimals: number): bigint {
	const [whole, fraction = ''] = amount.toFixed(decimals).split('.');
	return BigInt(`${whole}${fraction.padEnd(decimals, '0')}`);
}

function fromBaseUnits(raw: bigint, decimals: number): number {
	return Number(raw) / 10 ** decimals;
}

let cachedDecimals: number | null = null;

async function mintDecimals(conn: Awaited<ReturnType<typeof connection>>, mint: import('@solana/web3.js').PublicKey) {
	const { getMint } = await spl();
	if (cachedDecimals !== null) return cachedDecimals;

	const info = await getMint(conn, mint);
	cachedDecimals = info.decimals;
	return cachedDecimals;
}

function isMissingTokenAccount(cause: unknown) {
	if (!cause || typeof cause !== 'object') return false;

	const name = 'name' in cause ? String(cause.name) : '';
	if (name === 'TokenAccountNotFoundError' || name === 'TokenInvalidAccountOwnerError') {
		return true;
	}

	const message = 'message' in cause ? String(cause.message) : String(cause);
	return /could not find account|account does not exist|invalid account owner/i.test(message);
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error('Solana RPC timeout')), ms);
		})
	]);
}

export type NodAccount = {
	balance: number | null;
	mint: string;
};

export async function readNodBalance(ownerAddress: string): Promise<NodAccount> {
	const mintAddress = mintAddressConfigured();

	try {
		const mint = await nodMint();
		const owner = await parseOwner(ownerAddress);
		const conn = await connection();
		const {
			getAssociatedTokenAddress,
			getAccount,
			TokenAccountNotFoundError,
			TokenInvalidAccountOwnerError
		} = await spl();

		const ata = await getAssociatedTokenAddress(mint, owner);

		try {
			const account = await withTimeout(getAccount(conn, ata), 8000);
			const decimals = await withTimeout(mintDecimals(conn, mint), 8000);
			return { balance: fromBaseUnits(account.amount, decimals), mint: mint.toBase58() };
		} catch (cause) {
			if (
				cause instanceof TokenAccountNotFoundError ||
				cause instanceof TokenInvalidAccountOwnerError ||
				isMissingTokenAccount(cause)
			) {
				return { balance: null, mint: mint.toBase58() };
			}
			throw cause;
		}
	} catch (cause) {
		// Devnet public RPC often rate-limits serverless hosts — don't break the dashboard.
		console.error('readNodBalance:', cause instanceof Error ? cause.message : cause);
		return { balance: null, mint: mintAddress || '' };
	}
}

export async function treasurySol() {
	const { LAMPORTS_PER_SOL } = await web3();
	const treasury = await treasuryKeypair();
	const lamports = await (await connection()).getBalance(treasury.publicKey);
	return lamports / LAMPORTS_PER_SOL;
}

export async function transferNod(ownerAddress: string, amount: number): Promise<string> {
	if (amount <= 0) throw new SolanaError('Transfer amount must be positive.', 400);

	const { Transaction, sendAndConfirmTransaction } = await web3();
	const {
		getAssociatedTokenAddress,
		getAccount,
		createAssociatedTokenAccountInstruction,
		createTransferCheckedInstruction,
		TokenAccountNotFoundError,
		TokenInvalidAccountOwnerError
	} = await spl();

	const treasury = await treasuryKeypair();
	const mint = await nodMint();
	const owner = await parseOwner(ownerAddress);
	const conn = await connection();
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
