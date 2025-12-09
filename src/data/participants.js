export const participants = [
  { id: 'ana', name: 'Ana', exclusions: [] },
  { id: 'erin', name: 'Erin', exclusions: ['thomas'] },
  { id: 'thomas', name: 'Thomas', exclusions: ['erin'] },
  { id: 'michele', name: 'Michele', exclusions: ['wes'] },
  { id: 'wes', name: 'Wes', exclusions: ['michele'] },
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
  }
};
