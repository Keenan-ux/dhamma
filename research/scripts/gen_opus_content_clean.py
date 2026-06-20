#!/usr/bin/env python3
"""Single-cell rerun: Opus lowfame WITH-CONTENT, tools-forbidden (viva must-fix #1).
Reuses fable_cells_run.js verbatim up to the launch block."""
fable = open("research/out/fable_cells_run.js", encoding="utf-8").read()
s = fable.replace("name: 'cpd-crossfamily-cells'", "name: 'cpd-opus-content-lowfame-clean'")
s = s.replace(
    "description: 'Cross-family controls: Fable 5 four-cell (content/location x famous/lowfame) + Opus clean lowfame location cell. All tools-forbidden.'",
    "description: 'Viva must-fix: Opus lowfame with-content arm rerun tools-forbidden.'")
marker = "const [cf, cl, lf, ll, ol] = await parallel(["
i = s.index(marker)
tail = """const ocl = await contentRun(D.CL, 'o-val-low', 'opus')
return { batch: 'opus-content-lowfame-clean-20260612',
  opus_content_lowfame_clean: { batch: 'external-validation', n: ocl.filter(Boolean).length, results: ocl.filter(Boolean) } }
"""
s = s[:i] + tail
# contentRun hardcodes phase 'Fable content'; fine for grouping, but relabel meta phases
s = s.replace("""  phases: [
    { title: 'Fable content', detail: 'with-content validation, 3 annotators/sutta', model: 'fable' },
    { title: 'Fable location', detail: 'location-only probe, 2 reps/sutta', model: 'fable' },
    { title: 'Opus location', detail: 'clean lowfame location-only, 2 reps/sutta', model: 'opus' },
  ],""", """  phases: [
    { title: 'Fable content', detail: 'opus lowfame with-content rerun (label legacy)', model: 'opus' },
  ],""")
open("research/out/opus_content_clean_run.js", "w", encoding="utf-8").write(s)
print("wrote research/out/opus_content_clean_run.js", len(s), "chars")
