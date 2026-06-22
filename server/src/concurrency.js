// In-process concurrency guard (F6). The shared box (shared-cpu-2x, 4 GB) has no
// concurrency guard of its own, so a burst of expensive Meaning queries — each
// loading/running BGE-M3 + a vector ANN — piles up and wedges it (the documented
// concurrency wedge: dhamma-concurrency-wedge memory note). This caps how many
// heavy queries RUN at once; the rest queue briefly, then shed (503) rather than
// pile up. Serial / light (Exact, Stem) use never touches it.
//
// Deliberately tiny and dependency-free, and unit-testable in isolation
// (server/src/concurrency.test.mjs) so the guard logic is verified without a DB.

export class Semaphore {
  constructor(max) {
    this.max = Math.max(1, max | 0);
    this.active = 0;
    this.waiters = []; // FIFO; each { resolve, reject, timer }
  }

  // Acquire a slot. If one is free, returns immediately. Otherwise waits up to
  // timeoutMs for a slot; if none frees in time, rejects with Error('busy') so
  // the caller can shed load (503) instead of queueing unboundedly.
  acquire(timeoutMs) {
    if (this.active < this.max) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const w = { resolve, reject, timer: null };
      w.timer = setTimeout(() => {
        const i = this.waiters.indexOf(w);
        if (i >= 0) this.waiters.splice(i, 1);
        reject(new Error('busy'));
      }, timeoutMs);
      this.waiters.push(w);
    });
  }

  // Release a slot. If a waiter is queued, hand it the slot directly (active
  // count stays at max while anyone is waiting); otherwise free the slot.
  release() {
    const w = this.waiters.shift();
    if (w) {
      clearTimeout(w.timer);
      w.resolve(); // the waiter inherits this slot — active unchanged
    } else if (this.active > 0) {
      this.active--;
    }
  }

  stats() {
    return { active: this.active, max: this.max, waiting: this.waiters.length };
  }
}
