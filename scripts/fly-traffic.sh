#!/usr/bin/env bash
# Pull edge HTTP traffic for the dhamma Fly app from Fly's Prometheus API.
#
# The app keeps NO client-side analytics by design (see CLAUDE.md hard
# rule). This reads aggregate request counts from Fly's edge metrics —
# infrastructure-side, no per-user tracking, no PII.
#
# GOTCHA that cost an afternoon: Fly's Prometheus proxy wants the token
# with its native `FlyV1 ` scheme prefix, NOT `Bearer`. `flyctl auth
# token` prints the bare `fm2_...` macaroon, so we prepend `FlyV1 `
# ourselves. Using `Bearer` (or the bare token) yields the misleading
# "something went wrong resolving organization" error — which looks like
# an org/permission problem but is purely the auth header format.
#
# The separate flyctl "Metrics token unavailable: ... context canceled"
# warning on every flyctl command is unrelated and cosmetic (a flyctl
# race refreshing its own internal metrics_token); it does not affect
# this script, which talks to the Prometheus HTTP API directly.
#
# Usage: bash scripts/fly-traffic.sh [app] [org]
set -euo pipefail

APP="${1:-dhamma}"
ORG="${2:-personal}"
PROM="https://api.fly.io/prometheus/${ORG}/api/v1"
TOK="$(flyctl auth token 2>/dev/null | tr -d '\r\n ')"
H="Authorization: FlyV1 ${TOK}"

# instant scalar from a promQL expression (sum of the result vector)
scalar() {
  curl -s -m 25 -G -H "$H" --data-urlencode "query=$1" "$PROM/query" \
    | python -c "import sys,json;r=json.load(sys.stdin)['data']['result'];print(round(float(r[0]['value'][1])) if r else 0)"
}

echo "== ${APP} edge HTTP traffic =="
for w in 24h 7d 30d; do
  printf '  last %-4s : %s responses\n' "$w" \
    "$(scalar "sum(increase(fly_edge_http_responses_count{app=\"${APP}\"}[$w]))")"
done

echo "  -- by status, 7d --"
curl -s -m 25 -G -H "$H" \
  --data-urlencode "query=sum by (status)(increase(fly_edge_http_responses_count{app=\"${APP}\"}[7d]))" \
  "$PROM/query" \
  | python -c "import sys,json;[print('    ',s['metric'].get('status','?'),'=',round(float(s['value'][1]))) for s in json.load(sys.stdin)['data']['result']]"

echo "  -- per day, last 7d --"
curl -s -m 30 -G -H "$H" \
  --data-urlencode "query=sum(increase(fly_edge_http_responses_count{app=\"${APP}\"}[1d]))" \
  --data-urlencode "start=$(date -u -d '7 days ago' +%s)" \
  --data-urlencode "end=$(date -u +%s)" \
  --data-urlencode "step=86400" \
  "$PROM/query_range" \
  | python -c "import sys,json,datetime;r=json.load(sys.stdin)['data']['result'];[print('    ',datetime.datetime.fromtimestamp(int(t),datetime.UTC).strftime('%Y-%m-%d'),'=',round(float(v))) for t,v in (r[0]['values'] if r else [])]"

echo "  -- data out (MB), 7d --"
printf '    %s MB\n' "$(python -c "print(round($(scalar "sum(increase(fly_edge_data_out{app=\"${APP}\"}[7d]))")/1048576,1))")"
