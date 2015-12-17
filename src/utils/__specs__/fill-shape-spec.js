import test from 'tape';
import fillShape from '../fill-shape';
import _ from 'lodash';

test('Basic functionality', (t) => {
  t.plan(3);

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

  let exampleState = {
    settings: {
      notifyPosition: 'top-right',
      version: '0.1.0'
    },
    notifications: [
      {
        content: 'Hello World'
      },
      {
        content: 'Hello Mars'
      }
    ],
    emptyList: [],
    zero: 0,
    bool: false,
    emptyObj: {},
    teams: {
      '123': {
        name: 'The A Team',
        icons: {
          32: 's3.com/image_34.png',
          64: 's3.com/image_64.png',
          128: 's3.com/image_128.png'
        }
      },
      '321': {
        name: 'The B Team',
        icons: {
          32: 's4.com/image2_32.png',
          64: 's4.com/image2_64.png',
          128: 's4.com/image2_128.png'
        }
      }
    }
  };

  let exampleFilter = {
    notifications: true,
    settings: {
      notifyPosition: true
    },
    emptyList: true,
    zero: true,
    bool: true,
    emptyObj: true,
    teams: (teams) => {
      return _.mapValues(teams, (team) => {
        return {icons: true};
      });
    }
  };

  t.deepEquals(
    fillShape(exampleState, exampleFilter),
    {
      settings: {
        notifyPosition: 'top-right'
      },
      notifications: [
        {
          content: 'Hello World'
        },
        {
          content: 'Hello Mars'
        }
      ],
      emptyList: [],
      zero: 0,
      bool: false,
      emptyObj: {},
      teams: {
        '123': {
          icons: {
            32: 's3.com/image_34.png',
            64: 's3.com/image_64.png',
            128: 's3.com/image_128.png'
          }
        },
        '321': {
          icons: {
            32: 's4.com/image2_32.png',
            64: 's4.com/image2_64.png',
            128: 's4.com/image2_128.png'
          }
        }
      }
    }
  );
});

