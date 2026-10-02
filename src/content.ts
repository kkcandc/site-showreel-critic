export const STUDIO = {
  name: 'Arcade Lab',
  url: 'arcadelab.gg',
  cabinet: '04',
} as const;

export const GAMES = [
  {
    code: 'ND',
    title: 'Neon Drift',
    genre: 'Night race',
    year: '87',
    blurb: 'A one-thumb lane duel under a broken moon.',
  },
  {
    code: 'PV',
    title: 'Pinball Void',
    genre: 'Gravity',
    year: '89',
    blurb: 'Three flippers and a black hole that keeps score.',
  },
  {
    code: 'S8',
    title: 'Siege 8',
    genre: 'Defense',
    year: '91',
    blurb: 'Hold the cabinet door for eight waves. Then nine.',
  },
  {
    code: 'ER',
    title: 'Echo Run',
    genre: 'Rhythm',
    year: '93',
    blurb: 'Footsteps quantized to the kick. Miss, and the city forgets you.',
  },
] as const;

export const PROOF = [
  { value: '48', label: 'Prototypes' },
  { value: '12', label: 'Shipped' },
  { value: '00', label: 'Crunch weeks' },
] as const;
