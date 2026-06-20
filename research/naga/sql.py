#!/usr/bin/env python
"""Reusable SQL runner for the naga study, through the dhamma-pg flyctl proxy.

Usage:
  python sql.py "SELECT count(*) FROM passages;"          # inline SQL -> TSV
  python sql.py -f query.sql                               # SQL from file -> TSV
  python sql.py --json "SELECT ...;"                       # JSON rows to stdout
  echo "SELECT ...;" | python sql.py -                     # SQL from stdin

Needs DATABASE_URL in env, e.g.
  postgres://dhamma:PASS@localhost:15432/dhamma
(proxy: flyctl proxy 15432:5432 --app dhamma-pg)
"""
import os, sys, json
import psycopg2

def main():
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

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        sys.exit("DATABASE_URL not set")
    conn = psycopg2.connect(dsn, connect_timeout=20)
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
