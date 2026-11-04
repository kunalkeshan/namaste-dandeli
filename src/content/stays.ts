/**
 * Resorts, deliberately unnamed.
 *
 * Irshad's whole margin depends on not publishing the names — a named
 * resort gets booked direct and he is cut out of his own introduction.
 * So this is organised by what the stay is LIKE, which is also what a
 * guest is actually choosing between.
 *
 * Images here show the Dandeli region, not specific properties. The
 * honest label is part of the content, not small print.
 */
export interface Stay {
  kind: string;
  blurb: string;
}

export const stays: Stay[] = [
  {
    kind: 'On the river',
    blurb:
      'Cottages and tents close enough to the Kali to hear it at night. Best if you came for the water.',
  },
  {
    kind: 'In the trees',
    blurb:
      'Treehouses and jungle camps set back in the forest. Quieter, darker, and the birds start early.',
  },
  {
    kind: 'Pool & family',
    blurb:
      'Larger resorts with a pool, a restaurant and room to spread out. Easiest with children or a big group.',
  },
];

export const staysDisclosure =
  'Photographs show the Dandeli region, not any specific property. ' +
  'I work with resorts, jungle camps and homestays across the area and ' +
  'match you to one on your dates, your group and your budget — tell me ' +
  'what you want and I will tell you what is actually free.';
