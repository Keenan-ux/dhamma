import json, sys, urllib.parse

# reads a raw json file (search result) and writes a tsv summary to a txt file
raw = sys.argv[1]
out = sys.argv[2]
d = json.load(open(raw, encoding='utf-8'))
r = d.get('results', [])
with open(out, 'w', encoding='utf-8') as f:
    f.write('count ' + str(len(r)) + '\n')
    for x in r:
        f.write(str(x.get('id')) + ' | ' + str(x.get('citation')) + ' | ' + str(x.get('layer')) + ' | ' + str(x.get('title')) + '\n')
print('ok', len(r))
