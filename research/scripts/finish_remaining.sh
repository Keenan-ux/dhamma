#!/bin/bash
# Wait for dhamma-pg to recover (lookup latency < 5s), then run the detector
# on the remaining 10 passages offline-for-text, merge, and re-score.
echo "polling DB recovery..."
for i in $(seq 1 60); do
  t=$(curl -s -G "https://dhamma.fly.dev/api/lookup" --data-urlencode "term=dukkha" -o /dev/null -w '%{time_total}' 2>/dev/null)
  ti=${t%.*}
  echo "  attempt $i: lookup ${t}s"
  if [ -n "$ti" ] && [ "$ti" -lt 5 ]; then echo "DB recovered (${t}s)"; break; fi
  sleep 30
done
echo "=== running detector on remaining 10 ==="
PYTHONIOENCODING=utf-8 python research/scripts/detector.py --batch research/data/rest_sample.json --out research/out/detector_results_rest.json --textfile research/data/rest_text.json --nsense 2
echo "=== merge + score full 22 ==="
PYTHONIOENCODING=utf-8 python research/scripts/merge_and_score.py
echo "=== DONE remaining ==="
