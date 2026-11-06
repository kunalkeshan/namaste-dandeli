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

/**
 * The disclosure had to change when real photographs of partner
 * properties replaced the region shots: "Photographs show the Dandeli
 * region, not any specific property" became FALSE, which is exactly
 * the kind of drift content-rules.md §4 exists to catch.
 *
 * The replacement turns the constraint into the argument. Not naming
 * the resorts is not evasion — it is the reason Irshad still gets paid
 * for the introduction, and saying so plainly is more persuasive than
 * hiding it.
 */
export const staysDisclosure =
  'These are real photographs of places Irshad books people into. They are ' +
  'not named here on purpose — a named resort gets booked direct and he ' +
  'loses the introduction he made. Tell him your dates, your group and your ' +
  'budget, and he will tell you what is actually free.';
