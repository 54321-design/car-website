import type { StillId } from '@/lib/media';

export const BRAND = {
  name: 'JAIHIND',
  model: 'GT V8',
  full: 'JAIHIND GT V8',
  tagline: 'Twin-Turbo Grand Tourer',
  reference: 'MODEL. JH-GT-V8',
  price: 'From Rs. 2,50,00,000',
  year: new Date().getFullYear(),
} as const;

export const NAV_SECTIONS = [
  { id: 'hero', label: 'Exterior' },
  { id: 'precision', label: 'Performance' },
  { id: 'engineering', label: 'Architecture' },
  { id: 'heart', label: 'The Engine' },
  { id: 'materials', label: 'Craftsmanship' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'specifications', label: 'Specifications' },
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

/* ------------------------------------------------------------------ *
 * Section 2 — Performance
 * ------------------------------------------------------------------ */

export const PRECISION_COUNTERS = [
  { value: 620, suffix: 'HP', label: 'Horsepower', note: 'Twin-turbo V8, hand-built.' },
  { value: 3.2, suffix: 's', label: '0-100 km/h', decimals: 1, note: 'Launch control engaged.' },
  { value: 320, suffix: 'km/h', label: 'Top Speed', note: 'Electronically limited.' },
] as const;

/* ------------------------------------------------------------------ *
 * Section 3 — Architecture
 *
 * `at` is the normalised scrub position where the component separates in the
 * exploded sequence; the callout is tied to that moment rather than to a
 * fixed timer, so copy and image can never drift apart.
 * ------------------------------------------------------------------ */

export type Component = {
  id: string;
  index: string;
  name: string;
  spec: string;
  body: string;
  at: number;
  /** Callout anchor in normalised viewport space (0-1). */
  anchor: { x: number; y: number };
};

export const COMPONENTS: Component[] = [
  {
    id: 'body',
    index: '01',
    name: 'Carbon Body',
    spec: 'Carbon fibre monocoque - 1,200 kg',
    body: 'Hand-laid carbon fibre panels over an aluminum spaceframe, cured in autoclave at 120C. Every panel is weight-optimised for aerodynamic efficiency.',
    at: 0.14,
    anchor: { x: 0.24, y: 0.42 },
  },
  {
    id: 'chassis',
    index: '02',
    name: 'Chassis',
    spec: 'Aluminum alloy - double-wishbone',
    body: 'Billet-machined suspension towers connected to a central tunnel, tuned for razor-sharp turn-in while maintaining grand touring composure.',
    at: 0.28,
    anchor: { x: 0.7, y: 0.24 },
  },
  {
    id: 'powertrain',
    index: '03',
    name: 'Powertrain',
    spec: '4.0L Twin-Turbo V8 - 620 HP',
    body: 'Hand-assembled engine with dry sump lubrication, twin turbochargers spooling to 180,000 rpm. Power delivered through a 8-speed dual-clutch gearbox.',
    at: 0.42,
    anchor: { x: 0.28, y: 0.7 },
  },
  {
    id: 'interior',
    index: '04',
    name: 'Interior',
    spec: 'Italian leather - Alcantara - carbon',
    body: 'Every stitch placed by hand, every surface wrapped in materials chosen for how they feel at speed. The cockpit wraps around the driver like a glove.',
    at: 0.56,
    anchor: { x: 0.66, y: 0.62 },
  },
  {
    id: 'wheels',
    index: '05',
    name: 'Wheels',
    spec: 'Forged aluminium - 21 inch - centre-lock',
    body: 'Flow-forged from a single billet, each wheel is machined to within 2 grams of its target weight. Centre-lock hub for quick changes on track.',
    at: 0.7,
    anchor: { x: 0.3, y: 0.3 },
  },
  {
    id: 'aero',
    index: '06',
    name: 'Aerodynamics',
    spec: 'Active aero - 400kg downforce',
    body: 'Adaptive front splitter and rear wing adjust in real-time, generating downforce that pins the car to the road at triple-digit speeds.',
    at: 0.84,
    anchor: { x: 0.72, y: 0.44 },
  },
  {
    id: 'suspension',
    index: '07',
    name: 'Suspension',
    spec: 'Adaptive dampers - carbon anti-roll',
    body: 'Magnetic ride dampers sampling the road 1,000 times per second, paired with carbon fibre anti-roll bars for minimal unsprung mass.',
    at: 0.95,
    anchor: { x: 0.5, y: 0.78 },
  },
];

/* ------------------------------------------------------------------ *
 * Section 5 — Craftsmanship
 * ------------------------------------------------------------------ */

export type Material = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  body: string;
  image: StillId;
  meta: { k: string; v: string }[];
};

export const MATERIALS: Material[] = [
  {
    id: 'carbon',
    index: '01',
    title: 'Carbon Fibre',
    subtitle: 'Autoclave-cured, hand-laid',
    body: 'Chosen for its extraordinary strength-to-weight ratio. Each panel is laid by hand, layer by layer, then cured under immense pressure. The result is lighter than aluminium, stronger than steel, and unmistakably beautiful.',
    image: 'exterior',
    meta: [
      { k: 'Grade', v: 'T700 aerospace carbon' },
      { k: 'Finish', v: 'Exposed weave, clear coat' },
      { k: 'Weight', v: '1.6 g/cm3' },
    ],
  },
  {
    id: 'aluminum',
    index: '02',
    title: 'Aluminium',
    subtitle: 'Billet-machined, anodised',
    body: 'Aerospace-grade aluminium, CNC-machined from solid billet for precision components. Anodised for corrosion resistance and a finish that catches light like polished silver.',
    image: 'profile',
    meta: [
      { k: 'Alloy', v: '6061-T6 aircraft grade' },
      { k: 'Application', v: 'Billet, not cast' },
      { k: 'Treatment', v: 'Hard anodised' },
    ],
  },
  {
    id: 'leather',
    index: '03',
    title: 'Italian Leather',
    subtitle: 'Hand-stitched, naturally tanned',
    body: 'Sourced from tanneries that have perfected their craft over generations. Each hide is selected for consistency, then hand-stitched with contrasting thread that speaks to the care in every seam.',
    image: 'interior',
    meta: [
      { k: 'Source', v: 'Tuscany, Italy' },
      { k: 'Tanning', v: 'Vegetable, 40 days' },
      { k: 'Stitching', v: 'Hand, 7 stitches/cm' },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Section 6 — Gallery
 * ------------------------------------------------------------------ */

export type GalleryItem = {
  id: string;
  image: StillId;
  caption: string;
  detail: string;
  /** Tailwind grid span classes - drives the offset editorial grid. */
  span: string;
  aspect: string;
};

export const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    image: 'exterior',
    caption: 'Three-Quarter',
    detail: 'Golden hour, single key light, no fill.',
    span: 'md:col-span-7 md:row-span-2',
    aspect: 'aspect-[4/5]',
  },
  {
    id: 'g2',
    image: 'engine',
    caption: 'Engine Bay',
    detail: 'Twin-turbo V8, photographed at 2:1.',
    span: 'md:col-span-5 md:mt-24',
    aspect: 'aspect-square',
  },
  {
    id: 'g3',
    image: 'profile',
    caption: 'Profile',
    detail: 'Silhouette against the horizon.',
    span: 'md:col-span-5',
    aspect: 'aspect-[3/4]',
  },
  {
    id: 'g4',
    image: 'interior',
    caption: 'Cockpit',
    detail: 'Driver-focused, every control at your fingertips.',
    span: 'md:col-span-6 md:col-start-2 md:-mt-16',
    aspect: 'aspect-[5/6]',
  },
  {
    id: 'g5',
    image: 'wheel',
    caption: 'Wheels',
    detail: 'Forged aluminium, centre-lock hub.',
    span: 'md:col-span-6 md:mt-20',
    aspect: 'aspect-[4/5]',
  },
];

/* ------------------------------------------------------------------ *
 * Section 7 — Specifications
 * ------------------------------------------------------------------ */

export const SPECIFICATIONS = [
  { k: 'Engine', v: '4.0L V8 Twin-Turbo', note: '620 HP @ 7,500 rpm' },
  { k: 'Displacement', v: '3,996 cc', note: 'Flat-plane crank' },
  { k: 'Transmission', v: '8-Speed DCT', note: 'Paddle-shift, rear-wheel drive' },
  { k: '0-100 km/h', v: '3.2 Seconds', note: 'Launch control' },
  { k: 'Top Speed', v: '320 km/h', note: 'Electronically limited' },
  { k: 'Kerb Weight', v: '1,520 kg', note: 'Carbon fibre body' },
  { k: 'Fuel Economy', v: '8.2 L/100km', note: 'Combined cycle' },
] as const;

/* ------------------------------------------------------------------ *
 * Footer
 * ------------------------------------------------------------------ */

export const FOOTER_LINKS = [
  {
    title: 'JAIHIND',
    links: ['Our Story', 'Craftsmanship', 'Heritage', 'Careers'],
  },
  {
    title: 'Ownership',
    links: ['Service Centre', 'Warranty', 'Spare Parts', 'Contact'],
  },
] as const;
