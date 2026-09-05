/** HTTP client for the NodAI platform node API. */

function authHeaders(token) {
	return {
		authorization: `Bearer ${token}`,
		'content-type': 'application/json'
	};
}

async function parseJson(response) {
	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const message = body?.message ?? body?.error ?? `HTTP ${response.status}`;
		throw new Error(message);
	}
	return body;
}

export async function registerNode(platformUrl, label, apiKey, servedModel) {
	const response = await fetch(`${platformUrl}/api/nodes/register`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-nodai-key': apiKey
		},
		body: JSON.stringify({ label, served_model: servedModel || undefined })
	});
	return parseJson(response);
}

export async function linkNode(config) {
	const response = await fetch(`${config.platformUrl}/api/nodes/link`, {
		method: 'POST',
		headers: authHeaders(config.authToken),
		body: JSON.stringify({ api_key: config.apiKey })
	});
	return parseJson(response);
}

export async function sendHeartbeat(config, servedModel) {
	const response = await fetch(`${config.platformUrl}/api/nodes/heartbeat`, {
		method: 'POST',
		headers: authHeaders(config.authToken),
		body: JSON.stringify({
			status: 'online',
			served_model: servedModel || undefined
		})
	});
	return parseJson(response);
}

export async function pullNextJob(config) {
	const response = await fetch(`${config.platformUrl}/api/nodes/jobs/next`, {
		method: 'POST',
		headers: authHeaders(config.authToken)
	});
	return parseJson(response);
}

export async function completeJob(config, jobId, payload) {
	const response = await fetch(`${config.platformUrl}/api/nodes/jobs/${jobId}/complete`, {
		method: 'POST',
		headers: authHeaders(config.authToken),
		body: JSON.stringify(payload)
	});
	return parseJson(response);
}

export async function listNodes(platformUrl) {
	const response = await fetch(`${platformUrl}/api/nodes`);
	return parseJson(response);
}
