#!/usr/bin/env python
"""Reusable SQL runner for corpus research, through the dhamma-pg flyctl proxy.

Usage:
  python sql.py "SELECT count(*) FROM passages;"          # inline SQL -> TSV
  python sql.py -f query.sql                               # SQL from file -> TSV
  python sql.py --json "SELECT ...;"                       # JSON rows to stdout
  echo "SELECT ...;" | python sql.py -                     # SQL from stdin

DSN: set DATABASE_URL yourself (fastest for many queries — extract once, export,
reuse), e.g.
  postgres://dhamma:PASS@localhost:15432/dhamma
OR just run with DATABASE_URL UNSET and this script self-extracts it:
it wakes the auto-stopped app, pulls DATABASE_URL via `flyctl ssh`, and rewrites
the host to the local proxy (with retry, so it doesn't fail on a cold app). The
password stays in this process's memory only — never written to disk, never echoed.
The proxy must be up: `flyctl proxy 15432:5432 --app dhamma-pg` (note the :5432).

For BULK work (many stems x strata) prefer a one-connection script
(run_cosmology.py / run_samadhi.py): build a temp table once + a trgm index, then
count everything serially — far faster than many sql.py calls, and gentle on the
serial-only dhamma-pg (never fan concurrent connections at it).
"""
import os, sys, json, re, time, subprocess, socket

PROXY_HOST, PROXY_PORT = "127.0.0.1", 15432


def _proxy_up():
    try:
        with socket.create_connection((PROXY_HOST, PROXY_PORT), timeout=2):
            return True
    except OSError:
        return False


def _extract_dsn():
    """Wake the auto-stopped app, pull DATABASE_URL via flyctl ssh, rewrite the
    host to the local proxy. Retries (the first ssh after wake is flaky). Returns
    the proxy DSN or None. The password never touches disk."""
    for _ in range(3):
        try:
            subprocess.run(["curl", "-s", "--max-time", "120",
                            "https://dhamma.fly.dev/api/dbcheck"],
                           capture_output=True, timeout=130)
        except Exception:
            pass
        try:
            out = subprocess.run(["flyctl", "ssh", "console", "-a", "dhamma",
                                  "-C", "printenv DATABASE_URL"],
                                 capture_output=True, text=True, timeout=90).stdout or ""
        except Exception:
            out = ""
        m = re.search(r"postgres[^\s]*", out.replace("\r", ""))
        if m:
            return re.sub(r"@[^/]+/", f"@{PROXY_HOST}:{PROXY_PORT}/", m.group(0))
        time.sleep(3)
    return None


def _get_dsn():
    dsn = os.environ.get("DATABASE_URL")
    if dsn:
        return dsn
    if not _proxy_up():
        sys.exit("DATABASE_URL not set and the proxy is down. Start it:\n"
                 "  flyctl proxy 15432:5432 --app dhamma-pg")
    sys.stderr.write("[sql.py] DATABASE_URL unset; self-extracting via flyctl "
                     "(set+export it yourself to skip this ~5s step)...\n")
    dsn = _extract_dsn()
    if not dsn:
        sys.exit("DATABASE_URL not set and self-extract failed (flyctl ssh).")
    return dsn


def main():
    import psycopg2
    args = sys.argv[1:]
    as_json = False
    if "--json" in args:
        as_json = True
        args.remove("--json")
    if not args:
        sys.exit("no SQL given")
    if args[0] == "-f":
        sql = open(args[1], encoding="utf-8").read()
    elif args[0] == "-":
        sql = sys.stdin.read()
    else:
        sql = args[0]

    conn = psycopg2.connect(_get_dsn(), connect_timeout=20)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SET statement_timeout = '120s';")
    cur.execute(sql)
    if cur.description is None:
        print("(no rows returned)")
        return
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    if as_json:
        out = [dict(zip(cols, r)) for r in rows]
        sys.stdout.write(json.dumps(out, ensure_ascii=False, default=str, indent=1))
        sys.stdout.write("\n")
    else:
        print("\t".join(cols))
        for r in rows:
            print("\t".join("" if v is None else str(v) for v in r))
        print(f"-- {len(rows)} row(s)")


if __name__ == "__main__":
    main()
