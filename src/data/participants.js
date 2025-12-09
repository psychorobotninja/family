export const participants = [
  { id: 'ana', name: 'Ana', exclusions: [] },
  { id: 'erin', name: 'Erin', exclusions: ['thomas'] },
  { id: 'thomas', name: 'Thomas', exclusions: ['erin'] },
  { id: 'michele', name: 'Michele', exclusions: ['wes'] },
  { id: 'wes', name: 'Wes', exclusions: ['michele'] },
  { id: 'bernadette', name: 'Bernadette', exclusions: ['michael'] },
  { id: 'michael', name: 'Michael', exclusions: ['bernadette'] },
  { id: 'e', name: 'E', exclusions: ['jordon'] },
  { id: 'jordon', name: 'Jordon', exclusions: ['e'] },
  { id: 'rob', name: 'Rob', exclusions: ['vv'] },
  { id: 'vv', name: 'VV', exclusions: ['rob'] }
];

export const defaultWishlists = {
  ana: {
    ideas: ['Cooking class with Ana'],
    links: ['https://example.com/ana-cookware-set']
  },
  erin: {
    ideas: ['Spa day gift certificate'],
    links: ['https://example.com/erin-spa-set']
  },
  thomas: {
    ideas: ['Smart home gadgets'],
    links: ['https://example.com/thomas-smart-speaker']
  },
  michele: {
    ideas: ['Handmade jewelry workshop'],
    links: ['https://example.com/michele-jewelry-kit']
  },
  wes: {
    ideas: ['Cycling accessories'],
    links: ['https://example.com/wes-bike-light']
  },
  bernadette: {
    ideas: ['Weekend art retreat'],
    links: ['https://example.com/bernadette-art-kit']
  },
  michael: {
    ideas: ['Gourmet coffee subscription'],
    links: ['https://example.com/michael-coffee']
  },
  e: {
    ideas: ['Trail running gear'],
    links: ['https://example.com/e-running-pack']
  },
  jordon: {
    ideas: ['Photography workshop'],
    links: ['https://example.com/jordon-camera-strap']
  },
  rob: {
    ideas: ['Vinyl record club membership'],
    links: ['https://example.com/rob-record-player']
  },
  vv: {
    ideas: ['Designer planter set'],
    links: ['https://example.com/vv-planter']
  }
};
