import test from 'tape';
import fillShape from '../fill-shape';


test('Basic functionality', (t) => {
  t.plan(2);

  let basicSource = {
    teams: {
      a: {
        name: 'The A Team',
        rating: 5
      },
      b: {
        name: 'The B Team',
        rating: 3
      }
    }
  };

  let basicSink = {
    teams: {
      a: {
        name: true
      },
      b: true
    }
  };

  t.deepEquals(
    fillShape(basicSource, basicSink),
    {
      teams: {
        a: {
          name: basicSource.teams.a.name
        },
        b: basicSource.teams.b
      }
    }
  );

  t.deepEquals(
    fillShape(basicSource, true),
    basicSource
  );
});

