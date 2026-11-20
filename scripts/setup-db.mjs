import { neon } from "@neondatabase/serverless";

if (process.env.HEARTH_REMOTE !== "1") {
  console.log("Hearth uses the local in-memory desk. No hosted database is contacted.");
  console.log("Run npm run dev. Nothing else is required.");
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Add it to .env.local.");
  process.exit(1);
}

const sql = neon(url);

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('homeowner', 'underwriter')),
    desk text,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS coverage_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    homeowner_id uuid NOT NULL REFERENCES users(id),
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    coverage_amount numeric(14,2) NOT NULL CHECK (coverage_amount > 0),
    peril text NOT NULL CHECK (peril IN ('wildfire', 'earthquake', 'flood', 'wind', 'landslide')),
    deductible numeric(14,2) NOT NULL CHECK (deductible >= 0),
    start_date date NOT NULL,
    notes text,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awarded', 'withdrawn')),
    accepted_bid_id uuid,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS bids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE CASCADE,
    underwriter_id uuid NOT NULL REFERENCES users(id),
    premium_annual numeric(14,2) NOT NULL CHECK (premium_annual > 0),
    max_coverage numeric(14,2) NOT NULL CHECK (max_coverage > 0),
    terms text NOT NULL,
    expires_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'closed', 'withdrawn')),
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS request_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES coverage_requests(id) ON DELETE CASCADE,
    src text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `DO $$
   BEGIN
     ALTER TABLE coverage_requests
       ADD CONSTRAINT coverage_requests_accepted_bid_fk
       FOREIGN KEY (accepted_bid_id) REFERENCES bids(id);
   EXCEPTION
     WHEN duplicate_object THEN NULL;
   END $$`,
  `CREATE INDEX IF NOT EXISTS bids_request_idx ON bids (request_id, status)`,
  `CREATE INDEX IF NOT EXISTS requests_market_idx ON coverage_requests (status, zip, peril)`,
];

const users = [
  ["a1000000-0000-4000-8000-000000000001", "elena.voss@demo.hearth", "Elena Voss", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000002", "david.okonkwo@demo.hearth", "David Okonkwo", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000003", "priya.shah@demo.hearth", "Priya Shah", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000004", "lena.morales@demo.hearth", "Lena Morales", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000005", "andre.brooks@demo.hearth", "Andre Brooks", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000006", "sofia.ellin@demo.hearth", "Sofia Ellin", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000007", "jonah.keller@demo.hearth", "Jonah Keller", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000008", "ruth.abebe@demo.hearth", "Ruth Abebe", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000009", "chris.hale@demo.hearth", "Chris Hale", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000010", "maya.lin@demo.hearth", "Maya Lin", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000011", "paul.ike@demo.hearth", "Paul Ike", "homeowner", null],
  ["a1000000-0000-4000-8000-000000000021", "june.adler@demo.hearth", "June Adler", "underwriter", "Cedar Syndicate"],
  ["a1000000-0000-4000-8000-000000000022", "tomas.reeve@demo.hearth", "Tomás Reeve", "underwriter", "Westwind Capacity"],
  ["a1000000-0000-4000-8000-000000000023", "naomi.chen@demo.hearth", "Naomi Chen", "underwriter", "Ash Line Re"],
  ["a1000000-0000-4000-8000-000000000024", "leo.park@demo.hearth", "Leo Park", "underwriter", "Private desk"],
];

const elena = users[0][0];
const david = users[1][0];
const priya = users[2][0];
const lena = users[3][0];
const andre = users[4][0];
const sofia = users[5][0];
const jonah = users[6][0];
const ruth = users[7][0];
const chris = users[8][0];
const maya = users[9][0];
const paul = users[10][0];
const june = users[11][0];
const tomas = users[12][0];
const naomi = users[13][0];
const leo = users[14][0];

const legal =
  "Non-binding indication of interest only. Not a binder, not a policy, and not an offer of insurance. Any real contract would be issued by a licensed carrier or broker after inspection. No premium is payable on Hearth.";

function terms(line) {
  return `${line} ${legal}`;
}

const requests = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    homeowner: elena,
    city: "Pacific Palisades",
    zip: "90272",
    coverage: 2400000,
    peril: "wildfire",
    deductible: 50000,
    start: "2026-12-15",
    daysAgo: 16,
    notes:
      "Hillside ranch above Via de la Paz. Composition roof, Class A, brush clearance done this spring. The admitted carrier non-renewed in March. This request is for the dwelling, not a full homeowners package.",
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    homeowner: david,
    city: "Altadena",
    zip: "91001",
    coverage: 1150000,
    peril: "wildfire",
    deductible: 25000,
    start: "2027-01-01",
    daysAgo: 14,
    notes:
      "1924 bungalow on the east edge of Altadena, still standing after the Eaton fire. New defensible space, stucco exterior. Admitted markets will not quote the street.",
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    homeowner: priya,
    city: "Malibu",
    zip: "90265",
    coverage: 3800000,
    peril: "wildfire",
    deductible: 100000,
    start: "2026-12-01",
    daysAgo: 18,
    notes:
      "Bluff house, concrete and stucco, hydrant within 200 feet. Contents are not requested. Wildfire and brush only.",
    photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000004",
    homeowner: lena,
    city: "Topanga",
    zip: "90290",
    coverage: 1680000,
    peril: "wildfire",
    deductible: 35000,
    start: "2027-01-15",
    daysAgo: 12,
    notes:
      "Canyon lot with a single access road. Metal roof, 2021. Looking for dwelling coverage the FAIR Plan does not replace.",
    photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000005",
    homeowner: andre,
    city: "La Cañada Flintridge",
    zip: "91011",
    coverage: 2100000,
    peril: "wildfire",
    deductible: 40000,
    start: "2027-02-01",
    daysAgo: 9,
    notes:
      "North of Foothill Boulevard. Tile roof, irrigated zone to the street. The carrier sent a non-renewal effective January.",
    photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000006",
    homeowner: sofia,
    city: "Montecito",
    zip: "93108",
    coverage: 2750000,
    peril: "wildfire",
    deductible: 75000,
    start: "2026-12-20",
    daysAgo: 11,
    notes:
      "Above East Valley Road. The parcel is also in a debris-flow zone. This request is wildfire only.",
    photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000007",
    homeowner: jonah,
    city: "Santa Rosa",
    zip: "95404",
    coverage: 920000,
    peril: "wildfire",
    deductible: 15000,
    start: "2027-01-10",
    daysAgo: 8,
    notes:
      "Fountaingrove-adjacent. Rebuilt in 2019 after Tubbs with hardened eaves and enclosed soffits. Still trying to move off a surplus line.",
  },
  {
    id: "b1000000-0000-4000-8000-000000000008",
    homeowner: ruth,
    city: "Lake Arrowhead",
    zip: "92352",
    coverage: 1340000,
    peril: "wildfire",
    deductible: 30000,
    start: "2026-12-05",
    daysAgo: 15,
    notes:
      "Primary home, wood siding, composition roof, community hydrant. Winter access is plowed. Wildfire only.",
    photo: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000009",
    homeowner: chris,
    city: "La Crescenta",
    zip: "91214",
    coverage: 1480000,
    peril: "wildfire",
    deductible: 25000,
    start: "2027-02-15",
    daysAgo: 6,
    notes: "Hillside above Honolulu Avenue. Stucco, Class A roof, ember-resistant vents replaced last year.",
  },
  {
    id: "b1000000-0000-4000-8000-000000000010",
    homeowner: maya,
    city: "Brentwood",
    zip: "90049",
    coverage: 3200000,
    peril: "wildfire",
    deductible: 50000,
    start: "2027-01-05",
    daysAgo: 5,
    notes:
      "North of Sunset, at the edge of the Palisades brush. Lower slope exposure than 90272. Posted to see the spread against that book.",
    photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "b1000000-0000-4000-8000-000000000011",
    homeowner: paul,
    city: "Calabasas",
    zip: "91302",
    coverage: 1900000,
    peril: "wildfire",
    deductible: 40000,
    start: "2027-03-01",
    daysAgo: 1,
    notes: "Stokes Canyon side. Just posted. No inspection yet. Dwelling limit only.",
  },
  {
    id: "b1000000-0000-4000-8000-000000000012",
    homeowner: elena,
    city: "Pacific Palisades",
    zip: "90272",
    coverage: 1600000,
    peril: "earthquake",
    deductible: 80000,
    start: "2026-12-15",
    daysAgo: 4,
    notes:
      "Same Palisades dwelling as the wildfire request. This one is earthquake only, a difference-in-conditions style limit, not a homeowners package.",
  },
  {
    id: "b1000000-0000-4000-8000-000000000013",
    homeowner: lena,
    city: "Topanga",
    zip: "90290",
    coverage: 640000,
    peril: "wildfire",
    deductible: 15000,
    start: "2026-11-01",
    daysAgo: 22,
    notes: "Guest house on the same Topanga parcel. In this demo, an indication has already been accepted. Nothing was bound.",
    awardedBid: "c1000000-0000-4000-8000-000000000031",
  },
];

const bids = [
  ["c1000000-0000-4000-8000-000000000001", requests[0].id, june, 82800, 2400000, terms("Wildfire only. Ordinance or law excluded. Deductible as posted."), 14, 20],
  ["c1000000-0000-4000-8000-000000000002", requests[0].id, tomas, 75600, 2400000, terms("Dwelling limit only. Extended replacement is not included in this premium."), 9, 16],
  ["c1000000-0000-4000-8000-000000000003", requests[0].id, naomi, 91200, 2400000, terms("Capacity behind a licensed fronting carrier. A minimum earned premium would apply on a real policy."), 6, 12],
  ["c1000000-0000-4000-8000-000000000004", requests[0].id, leo, 60000, 1500000, terms("Personal capacity. I would not write the full limit requested."), 2, 8],
  ["c1000000-0000-4000-8000-000000000005", requests[1].id, naomi, 41400, 1150000, terms("Post-fire street. Inspection required before any real form is discussed."), 10, 14],
  ["c1000000-0000-4000-8000-000000000006", requests[1].id, june, 45400, 1150000, terms("Wildfire only. Brush warranty would be a condition of a real policy."), 7, 11],
  ["c1000000-0000-4000-8000-000000000007", requests[1].id, tomas, 48300, 1150000, terms("Higher rate for the Eaton scar. Deductible as posted."), 3, 9],
  ["c1000000-0000-4000-8000-000000000008", requests[2].id, june, 102600, 3800000, terms("Bluff exposure. Dwelling only, no contents, no loss of use."), 15, 18],
  ["c1000000-0000-4000-8000-000000000009", requests[2].id, tomas, 112100, 3800000, terms("Wildfire. Hydrant distance noted, not credited."), 8, 15],
  ["c1000000-0000-4000-8000-000000000010", requests[2].id, naomi, 121600, 3800000, terms("Full limit available. Pricing assumes a licensed front."), 4, 10],
  ["c1000000-0000-4000-8000-000000000011", requests[2].id, leo, 77500, 2500000, terms("Partial limit. I stop at $2.5 million of the dwelling."), 1, 7],
  ["c1000000-0000-4000-8000-000000000012", requests[3].id, tomas, 42840, 1680000, terms("Single-access canyon. Evacuation route is a pricing factor, not a declination."), 9, 13],
  ["c1000000-0000-4000-8000-000000000013", requests[3].id, june, 47040, 1680000, terms("Wildfire only. Metal roof noted."), 5, 12],
  ["c1000000-0000-4000-8000-000000000014", requests[3].id, naomi, 51240, 1680000, terms("Full limit. Would require a current brush report on a real file."), 2, 8],
  ["c1000000-0000-4000-8000-000000000015", requests[4].id, tomas, 38850, 2100000, terms("Foothill exposure, irrigated setback noted."), 6, 14],
  ["c1000000-0000-4000-8000-000000000016", requests[4].id, june, 43050, 2100000, terms("Wildfire. Tile roof credited in the rate."), 3, 11],
  ["c1000000-0000-4000-8000-000000000017", requests[4].id, naomi, 48300, 2100000, terms("Full limit behind a fronting carrier."), 1, 9],
  ["c1000000-0000-4000-8000-000000000018", requests[5].id, june, 56100, 2750000, terms("Wildfire only. Debris flow is excluded from this indication."), 8, 15],
  ["c1000000-0000-4000-8000-000000000019", requests[5].id, naomi, 63250, 2750000, terms("Montecito brush. Full dwelling limit."), 4, 12],
  ["c1000000-0000-4000-8000-000000000020", requests[5].id, leo, 70100, 2750000, terms("Personal capacity for the full limit, short expiry."), 2, 6],
  ["c1000000-0000-4000-8000-000000000021", requests[6].id, tomas, 13340, 920000, terms("Hardened rebuild. Rate reflects Tubbs-area history, not a new inspection."), 6, 16],
  ["c1000000-0000-4000-8000-000000000022", requests[6].id, june, 15640, 920000, terms("Wildfire. Enclosed soffits noted."), 2, 10],
  ["c1000000-0000-4000-8000-000000000023", requests[7].id, tomas, 38190, 1340000, terms("Mountain community. Seasonal access is acceptable on this indication."), 11, 14],
  ["c1000000-0000-4000-8000-000000000024", requests[7].id, june, 41540, 1340000, terms("Wildfire only. Wood siding is in the rate."), 6, 11],
  ["c1000000-0000-4000-8000-000000000025", requests[7].id, naomi, 45560, 1340000, terms("Full limit. Would want a hydrant-flow note on a real file."), 3, 9],
  ["c1000000-0000-4000-8000-000000000026", requests[8].id, june, 33300, 1480000, terms("Foothill stucco. Vents noted."), 4, 13],
  ["c1000000-0000-4000-8000-000000000027", requests[8].id, naomi, 37000, 1480000, terms("Full limit at a wider rate."), 1, 8],
  ["c1000000-0000-4000-8000-000000000028", requests[9].id, tomas, 36800, 3200000, terms("Edge of the Palisades brush, not in 90272. Lower rate than that book."), 4, 15],
  ["c1000000-0000-4000-8000-000000000029", requests[9].id, june, 43200, 3200000, terms("Wildfire. Would still want a fuel map."), 2, 12],
  ["c1000000-0000-4000-8000-000000000030", requests[9].id, naomi, 49600, 3200000, terms("Full limit. Priced as Westside edge, not canyon."), 1, 9],
  ["c1000000-0000-4000-8000-000000000032", requests[11].id, june, 8800, 1600000, terms("Earthquake difference-in-conditions. Shake only. No fire, no contents."), 3, 20],
  ["c1000000-0000-4000-8000-000000000033", requests[11].id, naomi, 11520, 1600000, terms("Earthquake capacity. Higher retention than the fire book."), 1, 12],
  ["c1000000-0000-4000-8000-000000000031", requests[12].id, june, 16640, 640000, terms("Guest house. This demo indication is the one marked accepted."), 18, 30],
  ["c1000000-0000-4000-8000-000000000034", requests[12].id, tomas, 18560, 640000, terms("Guest house, full limit. Closed in the demo after another indication was accepted."), 12, 20],
];

function ago(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function ahead(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

for (const statement of schema) {
  await sql.query(statement);
}

await sql.query(`UPDATE coverage_requests SET accepted_bid_id = NULL WHERE is_demo = true`);
await sql.query(
  `DELETE FROM request_photos WHERE request_id IN (SELECT id FROM coverage_requests WHERE is_demo = true)`,
);
await sql.query(
  `DELETE FROM bids WHERE is_demo = true OR request_id IN (SELECT id FROM coverage_requests WHERE is_demo = true)`,
);
await sql.query(`DELETE FROM coverage_requests WHERE is_demo = true`);

for (const [id, email, name, role, desk] of users) {
  await sql`
    INSERT INTO users (id, email, name, role, desk, is_demo)
    VALUES (${id}, ${email}, ${name}, ${role}, ${desk}, true)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      desk = EXCLUDED.desk,
      is_demo = true
  `;
}

for (const request of requests) {
  await sql`
    INSERT INTO coverage_requests (
      id, homeowner_id, city, state, zip, coverage_amount, peril, deductible, start_date, notes, status, is_demo, created_at
    ) VALUES (
      ${request.id},
      ${request.homeowner},
      ${request.city},
      'CA',
      ${request.zip},
      ${request.coverage},
      ${request.peril},
      ${request.deductible},
      ${request.start},
      ${request.notes},
      'open',
      true,
      ${ago(request.daysAgo)}
    )
  `;
  if (request.photo) {
    await sql`
      INSERT INTO request_photos (request_id, src)
      VALUES (${request.id}, ${request.photo})
    `;
  }
}

for (const [id, requestId, underwriter, premium, maxCoverage, bidTerms, createdDays, expiresDays] of bids) {
  await sql`
    INSERT INTO bids (
      id, request_id, underwriter_id, premium_annual, max_coverage, terms, expires_at, status, is_demo, created_at
    ) VALUES (
      ${id},
      ${requestId},
      ${underwriter},
      ${premium},
      ${maxCoverage},
      ${bidTerms},
      ${ahead(expiresDays)},
      'active',
      true,
      ${ago(createdDays)}
    )
  `;
}

await sql`
  UPDATE bids
  SET status = 'accepted'
  WHERE id = 'c1000000-0000-4000-8000-000000000031'
`;
await sql`
  UPDATE bids
  SET status = 'closed'
  WHERE id = 'c1000000-0000-4000-8000-000000000034'
`;
await sql`
  UPDATE coverage_requests
  SET status = 'awarded', accepted_bid_id = 'c1000000-0000-4000-8000-000000000031'
  WHERE id = 'b1000000-0000-4000-8000-000000000013'
`;

const counts = await sql`
  SELECT
    (SELECT count(*) FROM coverage_requests WHERE is_demo) AS requests,
    (SELECT count(*) FROM bids WHERE is_demo) AS bids,
    (SELECT count(*) FROM users WHERE is_demo) AS users
`;
console.log("Demo book ready", counts[0]);
