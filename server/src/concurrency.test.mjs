// Unit test for the Semaphore guard (no DB needed). Run: node server/src/concurrency.test.mjs
import { Semaphore } from './concurrency.js';

let failures = 0;
const ok = (cond, msg) => { if (!cond) { failures++; console.error('FAIL:', msg); } else console.log('ok:', msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1) up to `max` acquire immediately; the next waits.
  const s = new Semaphore(2);
  await s.acquire(1000); await s.acquire(1000);
  ok(s.stats().active === 2, 'two slots taken');
  let third = 'pending';
  const p3 = s.acquire(1000).then(() => { third = 'acquired'; });
  await sleep(20);
  ok(third === 'pending', 'third acquire blocks while full');
  ok(s.stats().waiting === 1, 'one waiter queued');

  // 2) release hands the slot to the waiter (active stays at max).
  s.release();
  await p3;
  ok(third === 'acquired', 'release wakes the waiter');
  ok(s.stats().active === 2 && s.stats().waiting === 0, 'active stays at max, no waiters');

  // 3) draining below max frees slots.
  s.release(); s.release();
  ok(s.stats().active === 0, 'all slots freed');

  // 4) a waiter that times out rejects with busy, and does not leak a slot.
  const s2 = new Semaphore(1);
  await s2.acquire(1000);
  let rejected = null;
  await s2.acquire(30).catch((e) => { rejected = e.message; });
  ok(rejected === 'busy', 'waiter past timeout rejects busy (load shed)');
  ok(s2.stats().waiting === 0, 'timed-out waiter removed from queue');
  s2.release();
  ok(s2.stats().active === 0, 'slot freed after the holder releases');

  // 5) a slot freed with no waiters is reusable.
  await s2.acquire(1000);
  ok(s2.stats().active === 1, 'reacquire after drain');
  s2.release();

  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}
main();
