export type FireZone = {
  zip: string;
  city: string;
  region: string;
  col: number;
  row: number;
};

export const FIRE_ZONES: FireZone[] = [
  { zip: "90265", city: "Malibu", region: "Santa Monica Mountains", col: 1, row: 1 },
  { zip: "90290", city: "Topanga", region: "Santa Monica Mountains", col: 2, row: 1 },
  { zip: "90272", city: "Pacific Palisades", region: "Santa Monica Mountains", col: 3, row: 1 },
  { zip: "90049", city: "Brentwood", region: "Westside edge", col: 4, row: 1 },
  { zip: "91302", city: "Calabasas", region: "Santa Monica Mountains", col: 1, row: 2 },
  { zip: "91214", city: "La Crescenta", region: "San Gabriel foothills", col: 2, row: 2 },
  { zip: "91011", city: "La Cañada Flintridge", region: "San Gabriel foothills", col: 3, row: 2 },
  { zip: "91001", city: "Altadena", region: "San Gabriel foothills", col: 4, row: 2 },
  { zip: "92352", city: "Lake Arrowhead", region: "San Bernardino Mountains", col: 1, row: 3 },
  { zip: "93108", city: "Montecito", region: "Santa Barbara front country", col: 2, row: 3 },
  { zip: "95404", city: "Santa Rosa", region: "North Bay", col: 3, row: 3 },
];
