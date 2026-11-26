import type { MarketingPage } from '../content/marketing';

/** Plain-language hand-off line — not a note about JavaScript. */
export function enquiryLede(section: MarketingPage['section'], topic: string): string {
  const t = topic.trim() || 'your trip';
  switch (section) {
    case 'routes':
      return `Add when you land or leave and how many passengers. Irshad quotes ${t} after he knows your slot — not from a generic fare table.`;
    case 'stays':
      return `Tell him your nights and how many of you need ${t}. He checks which places are actually free for those dates.`;
    case 'things-to-do':
      return `Share your Dandeli dates and group size for ${t}. He checks releases, safari times and drives before you pay.`;
    default:
      return `Tell him your dates and how many are travelling. He replies with what is possible for ${t}.`;
  }
}
