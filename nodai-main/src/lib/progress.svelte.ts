/**
 * Global driver for the top-of-page loading bar.
 *
 * SvelteKit navigations feed the bar automatically. Wrap any other async work
 * — an inference run, a reward claim — in `progress.track()` so long actions
 * get the same feedback as a page change.
 */
class Progress {
	/** Counted rather than boolean so overlapping tasks cannot end it early. */
	#pending = $state(0);

	get busy() {
		return this.#pending > 0;
	}

	start() {
		this.#pending += 1;
	}

	done() {
		this.#pending = Math.max(0, this.#pending - 1);
	}

	/** Runs `work` with the bar active, releasing it even if `work` throws. */
	async track<T>(work: () => Promise<T>): Promise<T> {
		this.start();
		try {
			return await work();
		} finally {
			this.done();
		}
	}
}

export const progress = new Progress();
