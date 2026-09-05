import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
		}
	}

	interface Window {
		solana?: SolanaProvider;
		backpack?: SolanaProvider;
		phantom?: { solana?: SolanaProvider };
	}

	interface SolanaProvider {
		isPhantom?: boolean;
		isBackpack?: boolean;
		publicKey?: { toString(): string } | null;
		connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
		disconnect(): Promise<void>;
		on?(event: string, handler: (...args: unknown[]) => void): void;
	}
}

export {};
