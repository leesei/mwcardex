#!/usr/bin/env python
import json
from pprint import pprint
import sys

# Input (Python list items to be eval-ed):
# [id, name, schools (school: level), cost, subtypes, tags (attack, traits and effects)]
#   ['mw1j21', 'Suppression Orb', {'mind': 2}, 8,
#     ['force', 'mana', 'artifact'],
#     ['zone exclusive', 'legendary', 'epic', 'mana drain']]
# cost of -1 means variable cost
# for Enchantment it denotes the reveal cost, the casting cost of 2 is not counted

# Output (JSON):
# id: {cost, name, schools, subtypes, tags (subtypes included), type}
#   "mw1j21": {
#     "cost": 8,
#     "name": "Suppression Orb",
#     "schools": {
#       "mind": 2
#     },
#     "subtypes": [
#       "force",
#       "mana",
#       "artifact"
#     ],
#     "tags": [
#       "zone exclusive",
#       "legendary",
#       "epic",
#       "mana drain"
#     ],
#     "type": "j"
#   }


# dissection of id:
# mw(?P<deck-number>\d)(?P<spell-type>\c)(?P<spell-number>\d{2})
# deck-number === 1
# spell-type:
#  'a': Attack
#  'j': Conjuration
#  'w': Conjuration (Wall)
#  'c': Creature
#  'e': Enchantment
#  'q': Equipment
#  'i': Incantation

damage_types = set(['flame', 'hydro', 'light', 'lightning', 'poison', 'psychic', 'wind'])


def load_database(infile):
    l = []
    with open(infile) as f:
        for line in f.readlines():
            l.append(eval(line))
    return l


def constuct_dict(l):
    d = {}
    for i in l:
        type = i[0][3]
        # Wall ('w') is also Conjuration ('j')
        if (type == 'w'):
            type = 'j'

        d[i[0]] = {
            'name': i[1],
            'type': type,
            'schools': i[2],
            'cost': int(i[3]),
            'subtypes': i[4],
            'tags': i[4] + i[5],
        }
    return d

# not put in main so that we can import this file and play with the data

listee = load_database('spell_database')
# debug: work on the subset of elements
#listee = listee[0:15]
#listee = [i for i in listee if i[4] and i[4][0]]
#listee = [i for i in listee if i[0][3] == 'c']
#pprint(listee, width=999)

target = 'db'
if len(sys.argv) > 1:
    target = sys.argv[1]

if target == 'db':
    dictee = constuct_dict(listee)
    print 'var gSpellDB = \n' + json.dumps(dictee, indent=2, sort_keys=True) + ';'
elif target == 'subtypes':
    typee = set()
    for i in listee:
        typee = set.union(typee, i[4])
    typee = list(typee)
    typee.sort()
    print 'var gSpellSubtypes = \n' + json.dumps(typee, indent=2) + ';'
elif target == 'tags':
    taggee = set()
    for i in listee:
        taggee = set.union(taggee, i[5])
        #taggee = set.union(typee, i[4])  # also add the subtype in tag
    taggee = list(taggee)
    taggee.sort()
    print 'var gSpellTags = \n' + json.dumps(taggee, indent=2) + ';'
elif target == 'list':
    pprint(listee, indent=0, width=999)
elif target == 'damagetypes':
    print '=== check if we have attack whose type was not in tags ==='
    filtered = [i for i in listee
                    for t in damage_types
                        if t in i[4] and not str(t) + '.' in i[5]]
    pprint(filtered, indent=2)
elif target == '?':
    print 'Available targets:'
    print '  db, subtypes, tags, list, damagetypes'
else:
    # playground
    print '=== default:', target, '==='
    filtered = [i for i in listee
                    for t in ['vampiric']
                        if t in i[4] and not str(t) + '.' in i[5]]
