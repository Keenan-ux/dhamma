#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Discovery sweep for the 2026-06-24 expansion slate: per-layer per-million-char density of each
study's HEADLINE stem(s), so each pre-registration can freeze with its discovery signal stated (the
program's discovery-before-freeze discipline). One serial connection (dhamma-pg is serial-only).
Canon numerator = work_role='mula' AND work_slug<>'pli-vism'; per-Mc denominators from the program
(mula 53.5M, attha 29.5M, tika 28.4M). PYTHONIOENCODING=utf-8 python research/_expansion_discovery.py"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'naga'))
from sql import _get_dsn
import psycopg2

MC = {'mula': 53.543921, 'attha': 29.488533, 'tika': 28.357746}

# study -> list of (label, diacritic-correct regex). Core stems only at discovery; the frozen lexica
# (refined variants, co-occurrence, sense-splits) come from the per-study protocols.
STEMS = {
 'vitakka-jhana':            [('vitakka', 'vitakk'), ('vicara', 'vicār'),
                              ('APPLIC abhiniropana', 'abhiniropan|abhiropan'), ('DISCURS papanca', 'papañc')],
 'sati':                     [('sati', '\\msati|satiyā|satiṃ|satīnaṃ|sato|satimā|satipaṭṭhān'),
                              ('memory sarati/anussati', 'sarati|anussar|anussati|muṭṭhassat|asammos')],
 'sankhara':                 [('sankhara', 'saṅkhār'), ('abhisankhara', 'abhisaṅkhār')],
 'anatta':                   [('anatta', 'anatt'), ('natthi atta (exist-denial)', 'natthi attā|natthattā'),
                              ('sabbe dhamma anatta (maxim)', 'sabbe dhammā anattā')],
 'matika-readback':          [('matika', 'mātik'), ('paramattha', 'paramatth'), ('cetasika', 'cetasik')],
 'sabhava-realist':          [('sabhava (raw)', 'sabhāv'),
                              ('sabhava ex-purisabhava', 'sabhāv'), ('lakkhana-rasa', 'lakkhaṇa.{0,40}rasa')],
 'abhinna-supernatural':     [('abhinna', 'abhiññ'), ('iddhi', 'iddh'), ('patihariya', 'pāṭihār'),
                              ('chalabhinna (six-list)', 'chaḷabhiññ|cha abhiññ|chaabhiññ')],
 'theravada-self-label':     [('theravada', 'theravād'), ('vibhajjavada', 'vibhajjavād')],
}

LAYERS = (
 ('mula',  "work_role='mula' AND work_slug <> 'pli-vism'"),
 ('attha', "(work_slug LIKE '%%-attha' OR work_slug='pli-vism')"),
 ('tika',  "work_slug LIKE '%%-tika'"),
)

def main():
    os.environ.setdefault('DATABASE_URL', _get_dsn())
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=25); conn.autocommit = True
    cur = conn.cursor(); cur.execute("SET statement_timeout='115s';")
    out = {'meta': {'as_of': '2026-06-24', 'note': 'discovery sweep (headline stems) for the expansion slate; '
                    'core stems only, frozen lexica come from per-study protocols', 'char_totals_Mc': MC}, 'studies': {}}
    print(f"{'study / lexeme':42} {'mula':>6} {'attha':>6} {'tika':>6} | {'can/Mc':>7} {'com/Mc':>7} {'ratio':>6}")
    print('-'*92)
    for study, items in STEMS.items():
        rows = []
        for label, rx in items:
            cnt = {}
            for lname, cond in LAYERS:
                # special-case: sabhava ex-purisabhava
                extra = " AND original !~* 'purisabhāv|ekaṃsabhāvit'" if label == 'sabhava ex-purisabhava' else ''
                cur.execute(f"SELECT count(*) FROM passages WHERE {cond} AND original ~* %s{extra}", (rx,))
                cnt[lname] = cur.fetchone()[0]
            can = round(cnt['mula']/MC['mula'], 2)
            com = round((cnt['attha']+cnt['tika'])/(MC['attha']+MC['tika']), 2)
            ratio = round(can/com, 2) if com else None
            rows.append({'lexeme': label, 'regex': rx, 'mula': cnt['mula'], 'attha': cnt['attha'],
                         'tika': cnt['tika'], 'canon_per_Mc': can, 'comm_per_Mc': com, 'canon_comm_ratio': ratio})
            print(f"{study[:18]+' / '+label[:21]:42} {cnt['mula']:>6} {cnt['attha']:>6} {cnt['tika']:>6} | "
                  f"{can:>7} {com:>7} {str(ratio):>6}")
        out['studies'][study] = rows
        print('-'*92)
    cur.close(); conn.close()
    path = os.path.join(os.path.dirname(__file__), 'EXPANSION-DISCOVERY-2026-06-24.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, default=str)
    print('wrote', path)

if __name__ == '__main__':
    main()
