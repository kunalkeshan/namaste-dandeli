/**
 * The fleet. Models are named in real reviews; seat counts are the
 * manufacturer's standard.
 * TODO: confirm exact models and whether the Innova is still running.
 */
export interface Vehicle {
  name: string;
  /** Key into carImages in content/images.ts */
  kind: 'sedan' | 'ertiga' | 'cruiser';
  seats: string;
  suits: string;
  note: string;
}

export const vehicles: Vehicle[] = [
  {
    name: 'Sedan',
    kind: 'sedan',
    seats: '4 passengers',
    suits: 'Couples and small families, airport runs, a day of sightseeing.',
    note: 'The lightest on fuel, so the cheapest for long straight roads.',
  },
  {
    name: 'Ertiga',
    kind: 'ertiga',
    seats: '6 passengers',
    suits: 'Families with luggage, and anyone heading to the rafting point.',
    note: 'The car customers name most often in reviews. Higher clearance for the forest roads.',
  },
  {
    name: 'Cruiser',
    kind: 'cruiser',
    seats: '9–12 passengers',
    suits: 'Big groups, friends travelling together, a whole family at once.',
    note: 'What customers call the "toofan". One vehicle instead of three.',
  },
];
