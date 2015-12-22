import test from 'tape';
import objectMerge from '../object-merge';

test('Basic functionality', (t) => {
  t.plan(1);

  let obj1 = {
    numTeams: 3,
    teamIndices: ['a', 'b', 'c'],
  };

  let obj2 = {
    teamIndices: ['b', 'c', 'a'],
    numUnread: 6
  };

  t.looseEquals(objectMerge(obj1, obj2), {
    teamIndices: ['b', 'c', 'a'],
    numTeams: 3,
    numUnread: 6
  });
});
