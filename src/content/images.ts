/**
 * EVERY image URL on the site lives here.
 *
 * Phase 1 hotlinks real, licence-cleared photographs of Dandeli from
 * Wikimedia Commons. When Irshad sends his own photos, swap the `src`
 * values in this one file — no component changes.
 *
 * Why Commons over Unsplash: Unsplash has no verified Dandeli
 * photography (its "Western Ghats" results are unrelated Indian
 * landscapes). Commons has the real river, the real hornbill, the
 * real rock. Honest beats convenient.
 *
 * Licences: CC0 needs no credit; CC BY-SA 4.0 must be credited —
 * see `imageCredits` below, rendered in the footer.
 */

const COMMONS = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/';

/** Builds a Commons URL at a given render width. */
function commons(file: string, width: number): string {
  return `${COMMONS}${encodeURIComponent(file)}&width=${width}`;
}

export interface Img {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: string;
  credit?: string;
}

/** Commons image with a responsive srcset at sensible widths. */
function commonsImg(
  file: string,
  o: { width: number; height: number; alt: string; credit?: string },
): Img {
  return {
    src: commons(file, 1600),
    srcset: [480, 800, 1200, 1600, 2000]
      .map((w) => `${commons(file, w)} ${w}w`)
      .join(', '),
    ...o,
  };
}

export const images = {
  /* Hero — CC0, verified: a real rafting team running the Kali. */
  rafting: commonsImg('Dandeli river rafting.jpg', {
    width: 3264, height: 2224,
    alt: 'A rafting team paddling through white water on the Kali river at Dandeli, forested banks on both sides',
  }),

  /* Verified: Malabar pied hornbill tossing a fruit, shot at Dandeli. */
  hornbill: commonsImg('Malabar Pied Hornbill at Dandeli, Karnataka 04.jpg', {
    width: 2903, height: 1936,
    alt: 'A Malabar pied hornbill perched in a tree at Dandeli, tossing an orange fruit from its beak',
    credit: 'Malabar Pied Hornbill at Dandeli — Drashokk, CC BY-SA 4.0, via Wikimedia Commons',
  }),

  /* Verified: banyan roots over green water, photographed from a coracle. */
  coracle: commonsImg('Dandeli, River Kali.jpg', {
    width: 2517, height: 1894,
    alt: 'Banyan roots trailing into the still green water of the Kali river, seen from a coracle',
    credit: 'Dandeli, River Kali — Vaibhavipakhare, CC BY-SA 4.0, via Wikimedia Commons',
  }),

  riverDawn: commonsImg('River Kali At Dawn.jpg', {
    width: 3264, height: 1952,
    alt: 'The Kali river at dawn inside Kali Tiger Reserve, mist lying over the water',
    credit: 'River Kali At Dawn — Vaibhavipakhare, CC BY-SA 4.0, via Wikimedia Commons',
  }),

  syntheri: commonsImg('Syntheri Rock Dandeli.jpg', {
    width: 2560, height: 1440,
    alt: 'The tall granite monolith of Syntheri Rocks rising above the Kaneri river',
    credit: 'Syntheri Rock Dandeli — Narayan21, CC BY-SA 4.0, via Wikimedia Commons',
  }),

  sykesPoint: commonsImg('Sykes point GaneshGudi.jpg', {
    width: 5184, height: 3456,
    alt: 'Sunset over forested valleys seen from Sykes Point near Ganeshgudi',
    credit: 'Sykes point GaneshGudi — Abhinavsharmamr, CC BY-SA 4.0, via Wikimedia Commons',
  }),

  /* CC0 — forest road, stands in for the drive itself. */
  forestRoad: commonsImg('Evergreen Forests in Castlerock, Kali Tiger Reserve IMG20251202090900 03.jpg', {
    width: 4096, height: 2304,
    alt: 'A road running through dense evergreen forest in Kali Tiger Reserve',
  }),

  kaliHabitat: commonsImg('Kali river habitat shot.jpg', {
    width: 6066, height: 4052,
    alt: 'Wide view of the Kali river running between forested hills',
    credit: 'Kali river habitat shot — Drashokk, CC BY-SA 4.0, via Wikimedia Commons',
  }),
} as const;

/**
 * Irshad's own photographs.
 * TODO: these are the most valuable images on the page — his face is
 * the trust asset. Drop the files into /public/photos/ and set `ready`.
 */
export const ownPhotos = {
  ready: false,
  irshadWithCar: {
    src: '/photos/irshad-with-car.jpg',
    width: 960, height: 1280,
    alt: 'Irshad standing beside his white sedan on a forest road near Dandeli',
  } satisfies Img,
  logoDecal: {
    src: '/photos/namaste-dandeli-decal.jpg',
    width: 1200, height: 1600,
    alt: 'The Namaste Dandeli monogram on the rear windscreen of the cab',
  } satisfies Img,
};

/** Attribution for CC BY-SA images. Rendered in the footer. */
export const imageCredits: string[] = Object.values(images)
  .map((i) => i.credit)
  .filter((c): c is string => Boolean(c));
