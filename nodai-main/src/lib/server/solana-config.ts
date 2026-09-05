import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/** Lightweight Solana config — no @solana/web3.js import (safe for SSR). */

export function cluster() {
	return (publicEnv.PUBLIC_SOLANA_CLUSTER ?? '').trim() || 'devnet';
}

function mintAddress() {
	return (env.NOD_MINT_ADDRESS ?? '').trim();
}

function secretKey() {
	return (env.TREASURY_SECRET_KEY ?? '').trim();
}

export function isNodTokenConfigured() {
	return mintAddress().length > 0 && secretKey().length > 0;
}

export function explorerTxUrl(signature: string) {
	return `https://explorer.solana.com/tx/${signature}?cluster=${cluster()}`;
}

export function explorerAddressUrl(address: string) {
	return `https://explorer.solana.com/address/${address}?cluster=${cluster()}`;
}

export function mintAddressConfigured() {
	return mintAddress();
}

export function secretKeyConfigured() {
	return secretKey();
}

export function rpcUrl() {
	return (env.SOLANA_RPC_URL ?? '').trim() || 'https://api.devnet.solana.com';
}
