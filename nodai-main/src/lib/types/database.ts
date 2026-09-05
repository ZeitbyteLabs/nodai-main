export type JobStatus = 'queued' | 'assigned' | 'running' | 'completed' | 'failed';
export type TransactionType = 'consumption' | 'reward' | 'fee' | 'grant';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type NodeStatus = 'pending' | 'online' | 'offline';

/**
 * These are type aliases rather than interfaces on purpose: postgrest-js
 * constrains table rows to `Record<string, unknown>`, and only type aliases
 * get an implicit index signature.
 */
export type Profile = {
	id: string;
	email: string;
	username: string | null;
	wallet_address: string | null;
	nod_balance: number;
	created_at: string;
};

export type Model = {
	id: string;
	name: string;
	description: string | null;
	license: string | null;
	s3_path: string | null;
	vllm_model_name: string | null;
	is_active: boolean;
	created_at: string;
};

export type InferenceJob = {
	id: string;
	user_id: string;
	model_id: string | null;
	prompt: string;
	response: string | null;
	tokens_used: number | null;
	latency_ms: number | null;
	status: JobStatus;
	node_id: string | null;
	temperature: number;
	max_tokens: number;
	created_at: string;
	completed_at: string | null;
};

export type Transaction = {
	id: string;
	user_id: string;
	type: TransactionType;
	amount: number;
	signature: string | null;
	status: TransactionStatus;
	job_id: string | null;
	created_at: string;
};

export type NodeRecord = {
	id: string;
	auth_token: string;
	label: string | null;
	status: NodeStatus;
	last_heartbeat: string | null;
	created_at: string;
};

/** Shape required by postgrest-js: Row/Insert/Update/Relationships per table. */
type Table<Row, RequiredKeys extends keyof Row> = {
	Row: Row;
	Insert: Partial<Omit<Row, RequiredKeys>> & Pick<Row, RequiredKeys>;
	Update: Partial<Row>;
	Relationships: [];
};

export type Database = {
	public: {
		Tables: {
			profiles: Table<Profile, 'id' | 'email'>;
			models: Table<Model, 'name'>;
			inference_jobs: Table<InferenceJob, 'user_id' | 'prompt'>;
			transactions: Table<Transaction, 'user_id' | 'type' | 'amount'>;
			nodes: Table<NodeRecord, 'auth_token'>;
		};
		Views: Record<string, never>;
		Functions: {
			debit_nod: {
				Args: { p_user_id: string; p_amount: number };
				Returns: number;
			};
			credit_nod: {
				Args: { p_user_id: string; p_amount: number };
				Returns: number;
			};
			record_run_rewards: {
				Args: {
					p_user_id: string;
					p_job_id: string;
					p_reward: number;
					p_fee: number;
				};
				Returns: string | null;
			};
			settle_rewards: {
				Args: { p_user_id: string; p_ids: string[]; p_signature: string };
				Returns: number;
			};
			grant_test_nod: {
				Args: { p_user_id: string; p_amount: number };
				Returns: number;
			};
			mark_stale_nodes_offline: {
				Args: { p_seconds?: number };
				Returns: number;
			};
			claim_next_job: {
				Args: { p_node_id: string };
				Returns: {
					job_id: string;
					user_id: string;
					model_id: string | null;
					prompt: string;
					temperature: number;
					max_tokens: number;
					vllm_model_name: string | null;
				}[];
			};
			complete_node_job: {
				Args: {
					p_node_id: string;
					p_job_id: string;
					p_response: string;
					p_tokens_used: number | null;
					p_latency_ms: number | null;
					p_status: string;
				};
				Returns: string;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
