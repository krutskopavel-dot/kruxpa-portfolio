// Glows behind case-study screen tiles, converted from the Figma radial gradients.
// Positions and radii are in tile pixels (1408×816 wide, 700×700 square) and emitted as
// percentages, so the glow scales with the tile. Each case has its own accent palette.

type Stop = [alpha: number, offset: number, rgb: string];
type Palette = { light: string; mid: string; deep: string; dark: string };

const FADE = '23,23,23';

const palettes = {
  teal: { light: '47,211,176', mid: '29,161,138', deep: '11,110,99', dark: '17,67,61' },
  orange: { light: '255,106,26', mid: '225,72,19', deep: '194,38,12', dark: '109,31,18' },
} satisfies Record<string, Palette>;

export type Accent = keyof typeof palettes;

const stops = {
  // Hero: two strong glows in opposite corners
  strongA: (p: Palette): Stop[] => [
    [0.95, 0, p.light],
    [0.75, 0.175, p.mid],
    [0.55, 0.35, p.deep],
    [0.275, 0.675, p.dark],
    [0, 1, FADE],
  ],
  strong: (p: Palette): Stop[] => [
    [1, 0, p.light],
    [0.75, 0.2, p.mid],
    [0.5, 0.4, p.deep],
    [0.25, 0.7, p.dark],
    [0, 1, FADE],
  ],
  // DISio's version has no dark stop; Artchain's does.
  edge: (p: Palette, accent: Accent): Stop[] => [
    [0.9, 0, p.light],
    [0.675, 0.2, p.mid],
    [0.45, 0.4, p.deep],
    ...(accent === 'orange' ? ([[0.225, 0.7, p.dark]] as Stop[]) : []),
    [0, 1, FADE],
  ],
  soft: (p: Palette, a: number): Stop[] => [
    [a, 0, p.light],
    [a / 2, 0.4, p.deep],
    [0, 1, FADE],
  ],
};

type Layer = { x: number; y: number; r: [number, number]; stops: Stop[] };

const pct = (v: number, total: number) => `${+((v / total) * 100).toFixed(2)}%`;

function gradient(layers: Layer[], w: number, h: number) {
  return layers
    .map(({ x, y, r: [rx, ry], stops }) => {
      const list = stops.map(([a, o, rgb]) => `rgba(${rgb},${a}) ${o * 100}%`).join(', ');
      return `radial-gradient(${pct(rx, w)} ${pct(ry, h)} at ${pct(x, w)} ${pct(y, h)}, ${list})`;
    })
    .join(', ');
}

const W = 1408;
const H = 816;
const S = 700;
const WIDE_SOFT: [number, number] = [502.86, 291.43];
const WIDE_STRONG: [number, number] = [1005.7, 582.86];

// Layer sets per preset; `soft` = the faint counter-glow, second layer = the main glow.
const presets = {
  hero: (p: Palette) =>
    gradient(
      [
        { x: 140.8, y: -81.6, r: [440, 255], stops: stops.strongA(p) },
        { x: 1098.2, y: 856.8, r: [828.24, 480], stops: stops.strongA(p) },
      ],
      W,
      H,
    ),
  /** Soft top-left, strong bottom-right */
  wideRight: (p: Palette) =>
    gradient(
      [
        { x: 140.8, y: 0, r: WIDE_SOFT, stops: stops.soft(p, 0.3) },
        { x: 1196.8, y: 816, r: WIDE_STRONG, stops: stops.strong(p) },
      ],
      W,
      H,
    ),
  /** Soft top-right, strong bottom-left */
  wideLeft: (p: Palette) =>
    gradient(
      [
        { x: 1267.2, y: 0, r: WIDE_SOFT, stops: stops.soft(p, 0.3) },
        { x: 140.8, y: 816, r: WIDE_STRONG, stops: stops.strong(p) },
      ],
      W,
      H,
    ),
  /** Soft top-right, strong bottom-left, a little further in */
  wideLeftInset: (p: Palette) =>
    gradient(
      [
        { x: 1267.2, y: 0, r: WIDE_SOFT, stops: stops.soft(p, 0.3) },
        { x: 211.2, y: 816, r: WIDE_STRONG, stops: stops.strong(p) },
      ],
      W,
      H,
    ),
  /** Left square of a pair: soft top-right, strong bottom-left */
  squareLeft: (p: Palette) =>
    gradient(
      [
        { x: 630, y: 0, r: [250, 250], stops: stops.soft(p, 0.3) },
        { x: 105, y: 700, r: [500, 500], stops: stops.strong(p) },
      ],
      S,
      S,
    ),
  /** Right square of a pair: soft top-centre, strong bottom-centre */
  squareRight: (p: Palette) =>
    gradient(
      [
        { x: 350, y: -140, r: [291.67, 291.67], stops: stops.soft(p, 0.25) },
        { x: 350, y: 805, r: [583.33, 583.33], stops: stops.strong(p) },
      ],
      S,
      S,
    ),
  /** Soft bottom-left, strong from the right edge */
  squareEdge: (p: Palette, accent: Accent) =>
    gradient(
      [
        { x: 0, y: 700, r: [291.67, 291.67], stops: stops.soft(p, 0.35) },
        { x: 735, y: 350, r: [500, 500], stops: stops.edge(p, accent) },
      ],
      S,
      S,
    ),
  /** Soft top-left, strong bottom-right (strong slightly in from the corner) */
  squareCorner: (p: Palette) =>
    gradient(
      [
        { x: 70, y: 0, r: [250, 250], stops: stops.soft(p, 0.3) },
        { x: 595, y: 700, r: [500, 500], stops: stops.strong(p) },
      ],
      S,
      S,
    ),
  /** Soft top-left, strong bottom-right corner */
  squareDiagonal: (p: Palette) =>
    gradient(
      [
        { x: 70, y: 0, r: [250, 250], stops: stops.soft(p, 0.3) },
        { x: 630, y: 700, r: [500, 500], stops: stops.strong(p) },
      ],
      S,
      S,
    ),
  /** Soft top-right, strong bottom-left corner */
  squareDiagonalMirror: (p: Palette) =>
    gradient(
      [
        { x: 630, y: 0, r: [250, 250], stops: stops.soft(p, 0.3) },
        { x: 70, y: 700, r: [500, 500], stops: stops.strong(p) },
      ],
      S,
      S,
    ),
};

export type Glow = keyof typeof presets;

export const glow = (name: Glow, accent: Accent) => presets[name](palettes[accent], accent);
