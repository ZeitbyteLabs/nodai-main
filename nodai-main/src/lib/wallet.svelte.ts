import { browser } from '$app/environment';

export type WalletKind = 'phantom' | 'backpack';

export interface DetectedWallet {
	kind: WalletKind;
	name: string;
	provider: SolanaProvider;
}

function providerFor(kind: WalletKind): SolanaProvider | undefined {
	if (!browser) return undefined;

	if (kind === 'phantom') {
		const injected = window.phantom?.solana ?? window.solana;
		return injected?.isPhantom ? injected : undefined;
	}

	const backpack = window.backpack ?? (window.solana?.isBackpack ? window.solana : undefined);
	return backpack;
}

export function detectWallets(): DetectedWallet[] {
	const candidates: Array<{ kind: WalletKind; name: string }> = [
		{ kind: 'phantom', name: 'Phantom' },
		{ kind: 'backpack', name: 'Backpack' }
	];

	return candidates.flatMap(({ kind, name }) => {
		const provider = providerFor(kind);
		return provider ? [{ kind, name, provider }] : [];
	});
}

export const INSTALL_URLS: Record<WalletKind, string> = {
	phantom: 'https://phantom.app/download',
	backpack: 'https://backpack.app/download'
};

/**
 * Wallet connection state for the current page. Connecting only proves control
 * of the key in the browser; the address is persisted server-side by /api/wallet.
 */
export class WalletState {
	address = $state<string | null>(null);
	connecting = $state(false);
	error = $state<string | null>(null);
	available = $state<DetectedWallet[]>([]);

	constructor(initialAddress: string | null = null) {
		this.address = initialAddress;
	}

	refresh() {
		this.available = detectWallets();
	}

	async connect(kind: WalletKind): Promise<string | null> {
		this.error = null;
		const provider = providerFor(kind);

		if (!provider) {
			this.error = `${kind === 'phantom' ? 'Phantom' : 'Backpack'} is not installed.`;
			return null;
		}

		this.connecting = true;
		try {
			const { publicKey } = await provider.connect();
			const address = publicKey.toString();

			const response = await fetch('/api/wallet', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ wallet_address: address })
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({ message: 'Could not save wallet.' }));
				this.error = body.message ?? 'Could not save wallet.';
				return null;
			}

			this.address = address;
			return address;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Wallet connection was rejected.';
			this.error = message;
			return null;
		} finally {
			this.connecting = false;
		}
	}

	async disconnect() {
		this.error = null;

		for (const kind of ['phantom', 'backpack'] as WalletKind[]) {
			const provider = providerFor(kind);
			if (provider?.publicKey) {
				await provider.disconnect().catch(() => undefined);
			}
		}

		const response = await fetch('/api/wallet', { method: 'DELETE' });
		if (response.ok) this.address = null;
	}
}
