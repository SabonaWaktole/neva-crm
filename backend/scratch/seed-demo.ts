/**
 * Demo data seeder for the remote (Render) Postgres database.
 *
 * Creates a set of fully-populated workspaces ("stores"): staff, warehouses,
 * categories, products, stock levels + movements, clients with custom fields,
 * interactions, appointments, quotations and notifications.
 *
 * Idempotent-ish: it skips any tenant whose urlSlug already exists, so existing
 * workspaces are never touched. Re-running only adds what is missing.
 *
 *   DATABASE_URL=$(grep DATABASE_URL .env.prod | cut -d'"' -f2) npx tsx scratch/seed-demo.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const PASSWORD = 'S@b0n@W@';

/** Deterministic PRNG so re-runs and reviews see the same shape of data. */
let seed = 20260728;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;
const daysFromNow = (d: number, hour = 9) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, [0, 15, 30, 45][int(0, 3)], 0, 0);
  return t;
};

// ---------------------------------------------------------------------------
// People — the mailboxes the user actually owns, with a name for each.
// ---------------------------------------------------------------------------

const PEOPLE = [
  { email: 'sabonawaktole01@gmail.com', firstName: 'Sabona', lastName: 'Waktole' },
  { email: 'sabonawaktole02@gmail.com', firstName: 'Liya', lastName: 'Bekele' },
  { email: 'sabonawaktole03@gmail.com', firstName: 'Dawit', lastName: 'Hailu' },
  { email: 'sabonawaktole04@gmail.com', firstName: 'Meron', lastName: 'Tesfaye' },
  { email: 'sabonawaktole05@gmail.com', firstName: 'Yonas', lastName: 'Girma' },
  { email: 'sabonawaktole06@gmail.com', firstName: 'Hanna', lastName: 'Abera' },
  { email: 'sabonawaktole07@gmail.com', firstName: 'Kaleb', lastName: 'Mengistu' },
  { email: 'sabonawaktole08@gmail.com', firstName: 'Selam', lastName: 'Desta' },
  { email: 'sabonawaktole09@gmail.com', firstName: 'Nahom', lastName: 'Alemu' },
  { email: 'sabonawaktole11@gmail.com', firstName: 'Ruth', lastName: 'Kebede' },
  { email: 'sabonawaktole12@gmail.com', firstName: 'Abel', lastName: 'Tadesse' },
  { email: 'sabonawaktole13@gmail.com', firstName: 'Eden', lastName: 'Mulugeta' },
  { email: 'sabonawaktole14@gmail.com', firstName: 'Biruk', lastName: 'Assefa' },
  { email: 'sabonawaktole15@gmail.com', firstName: 'Tigist', lastName: 'Negash' },
  { email: 'sabonawaktole16@gmail.com', firstName: 'Samuel', lastName: 'Worku' },
  { email: 'sabonawaktole17@gmail.com', firstName: 'Bethel', lastName: 'Getachew' },
  { email: 'sanonawaktole14@gmail.com', firstName: 'Naol', lastName: 'Chala' },
  { email: 'tafesesabona@gmai.com', firstName: 'Tafese', lastName: 'Sabona' },
  { email: 'waktolesabona@gmail.com', firstName: 'Waktole', lastName: 'Sabona' },
  { email: 'zpiratelifeog@gmail.com', firstName: 'Fikru', lastName: 'Lemma' },
  { email: 'zseesailor@gmail.com', firstName: 'Marta', lastName: 'Solomon' },
  { email: 'zunforsaken@gmail.com', firstName: 'Henok', lastName: 'Yilma' },
] as const;

// ---------------------------------------------------------------------------
// Stores. Each one gets the full roster above, so every mailbox can sign in to
// every workspace; the owner rotates so each address owns at least one store.
// ---------------------------------------------------------------------------

type StoreSpec = {
  name: string;
  slug: string;
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  language: string;
  city: string;
  state: string;
  postal: string;
  street: string;
  phone: string;
  regNo: string;
  suspended?: boolean;
  requiresQuotationApproval: boolean;
  warehouses: { name: string; address: string }[];
  categories: { name: string; description: string }[];
  /** [name, category, brand, price, cost, tags] */
  products: [string, string, string, number, number, string[]][];
};

const STORES: StoreSpec[] = [
  {
    name: 'Bole Electronics Depot',
    slug: 'bole-electronics-depot',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postal: '1000',
    street: 'Bole Road, Friendship Building, 4th Floor',
    phone: '+251 911 204 118',
    regNo: 'ET-AA-0094417',
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Bole Main Warehouse', address: 'Bole Road, Warehouse Block A, Addis Ababa' },
      { name: 'Kality Overflow Store', address: 'Kality Industrial Zone, Gate 3, Addis Ababa' },
      { name: 'Adama Regional Hub', address: 'Adama Bypass Road, Depot 7, Adama' },
    ],
    categories: [
      { name: 'Laptops & Computers', description: 'Business laptops, desktops and workstations' },
      { name: 'Networking', description: 'Routers, switches, access points and cabling' },
      { name: 'Peripherals', description: 'Keyboards, mice, monitors and docking stations' },
      { name: 'Power & UPS', description: 'Uninterruptible power supplies and stabilizers' },
      { name: 'Printing', description: 'Printers, scanners and consumables' },
    ],
    products: [
      ['Dell Latitude 5540 i7', 'Laptops & Computers', 'Dell', 1499.0, 1180.0, ['laptop', 'business']],
      ['Dell Latitude 3540 i5', 'Laptops & Computers', 'Dell', 989.0, 760.0, ['laptop', 'entry']],
      ['HP ProBook 450 G10', 'Laptops & Computers', 'HP', 1120.0, 880.0, ['laptop']],
      ['Lenovo ThinkPad E14 Gen 5', 'Laptops & Computers', 'Lenovo', 1050.0, 815.0, ['laptop', 'popular']],
      ['Apple MacBook Air M3 13"', 'Laptops & Computers', 'Apple', 1399.0, 1210.0, ['laptop', 'premium']],
      ['HP EliteDesk 800 SFF', 'Laptops & Computers', 'HP', 870.0, 690.0, ['desktop']],
      ['MikroTik hEX S Router', 'Networking', 'MikroTik', 79.0, 52.0, ['router']],
      ['TP-Link Omada EAP650 AP', 'Networking', 'TP-Link', 119.0, 84.0, ['wifi', 'access-point']],
      ['Cisco CBS250-24T Switch', 'Networking', 'Cisco', 549.0, 430.0, ['switch', 'managed']],
      ['Ubiquiti UniFi 6 Lite', 'Networking', 'Ubiquiti', 99.0, 71.0, ['wifi']],
      ['Cat6 UTP Cable 305m Box', 'Networking', 'Nexans', 149.0, 98.0, ['cabling', 'bulk']],
      ['Dell P2422H 24" Monitor', 'Peripherals', 'Dell', 219.0, 168.0, ['monitor']],
      ['LG 27UP650 27" 4K Monitor', 'Peripherals', 'LG', 399.0, 315.0, ['monitor', '4k']],
      ['Logitech MX Keys S', 'Peripherals', 'Logitech', 109.0, 78.0, ['keyboard']],
      ['Logitech MX Master 3S', 'Peripherals', 'Logitech', 99.0, 70.0, ['mouse']],
      ['Dell WD19S Docking Station', 'Peripherals', 'Dell', 229.0, 172.0, ['dock']],
      ['APC Back-UPS 1100VA', 'Power & UPS', 'APC', 189.0, 141.0, ['ups']],
      ['APC Smart-UPS 3000VA RM', 'Power & UPS', 'APC', 1290.0, 1035.0, ['ups', 'rack']],
      ['Eaton 5E 850VA', 'Power & UPS', 'Eaton', 109.0, 79.0, ['ups', 'entry']],
      ['HP LaserJet Pro M404dn', 'Printing', 'HP', 329.0, 258.0, ['printer', 'mono']],
      ['HP 59A Toner Cartridge', 'Printing', 'HP', 89.0, 61.0, ['consumable', 'toner']],
      ['Epson EcoTank L3260', 'Printing', 'Epson', 239.0, 186.0, ['printer', 'inkjet']],
      ['Canon imageFORMULA R40', 'Printing', 'Canon', 449.0, 355.0, ['scanner']],
    ],
  },
  {
    name: 'Piassa Building Supplies',
    slug: 'piassa-building-supplies',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postal: '1104',
    street: 'Piassa, De Gaulle Square, Sholla Building',
    phone: '+251 912 887 340',
    regNo: 'ET-AA-0112908',
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Piassa Yard', address: 'De Gaulle Square, Rear Yard, Addis Ababa' },
      { name: 'Sebeta Bulk Yard', address: 'Sebeta Industrial Park, Plot 22' },
      { name: 'Bishoftu Depot', address: 'Bishoftu Airport Road, Km 4' },
    ],
    categories: [
      { name: 'Cement & Aggregates', description: 'Cement, sand, gravel and blocks' },
      { name: 'Steel & Rebar', description: 'Reinforcement bar, mesh and sections' },
      { name: 'Plumbing', description: 'Pipes, fittings and sanitary ware' },
      { name: 'Electrical', description: 'Conduit, cable and switchgear' },
      { name: 'Finishing', description: 'Paint, tiles and adhesives' },
    ],
    products: [
      ['Dangote OPC 42.5 Cement 50kg', 'Cement & Aggregates', 'Dangote', 12.5, 9.4, ['cement', 'bulk']],
      ['Derba OPC 32.5 Cement 50kg', 'Cement & Aggregates', 'Derba', 11.2, 8.6, ['cement']],
      ['Washed River Sand (m³)', 'Cement & Aggregates', 'Local', 28.0, 19.0, ['aggregate']],
      ['Crushed Stone 3/4" (m³)', 'Cement & Aggregates', 'Local', 32.0, 22.5, ['aggregate']],
      ['Hollow Block 20cm', 'Cement & Aggregates', 'Local', 1.4, 0.95, ['block']],
      ['Rebar Ø8mm 12m', 'Steel & Rebar', 'Steely RMI', 7.9, 6.1, ['rebar']],
      ['Rebar Ø12mm 12m', 'Steel & Rebar', 'Steely RMI', 17.4, 13.6, ['rebar', 'popular']],
      ['Rebar Ø16mm 12m', 'Steel & Rebar', 'Steely RMI', 30.8, 24.2, ['rebar']],
      ['BRC Mesh A142 Sheet', 'Steel & Rebar', 'Steely RMI', 44.0, 34.0, ['mesh']],
      ['Binding Wire 25kg Coil', 'Steel & Rebar', 'Local', 38.0, 27.5, ['consumable']],
      ['PPR Pipe 25mm PN20 4m', 'Plumbing', 'Amanco', 6.2, 4.3, ['pipe']],
      ['PVC Drain Pipe 110mm 3m', 'Plumbing', 'Amanco', 14.5, 10.2, ['pipe', 'drainage']],
      ['Gate Valve 1" Brass', 'Plumbing', 'Cimberio', 9.8, 6.9, ['valve']],
      ['WC Suite Close-Coupled', 'Plumbing', 'Twyford', 148.0, 112.0, ['sanitary']],
      ['Wash Basin 55cm + Pedestal', 'Plumbing', 'Twyford', 96.0, 71.0, ['sanitary']],
      ['PVC Conduit 20mm 3m', 'Electrical', 'Marshall', 2.1, 1.35, ['conduit']],
      ['NYA Cable 2.5mm² 100m', 'Electrical', 'Ethio Cable', 42.0, 31.0, ['cable']],
      ['Consumer Unit 12-Way', 'Electrical', 'Schneider', 68.0, 49.0, ['switchgear']],
      ['MCB 16A Type C', 'Electrical', 'Schneider', 4.6, 3.1, ['switchgear']],
      ['Emulsion Paint 20L White', 'Finishing', 'Kadisco', 78.0, 58.0, ['paint']],
      ['Gloss Enamel 4L', 'Finishing', 'Kadisco', 26.0, 18.5, ['paint']],
      ['Porcelain Floor Tile 60x60', 'Finishing', 'Habesha Ceramics', 13.9, 9.8, ['tile']],
      ['Tile Adhesive 25kg', 'Finishing', 'Sika', 15.4, 10.9, ['adhesive']],
      ['Silicone Sealant 300ml', 'Finishing', 'Sika', 5.2, 3.4, ['consumable']],
    ],
  },
  {
    name: 'Moonwalk Pharma Distribution',
    slug: 'moonwalk-pharma-distribution',
    currency: 'EUR',
    locale: 'en-US',
    timezone: 'Europe/Tirane',
    dateFormat: 'DD/MM/YYYY',
    language: 'sq',
    city: 'Tirana',
    state: 'Tirana',
    postal: '1001',
    street: 'Rruga e Kavajës, Pallati 27, Kati 3',
    phone: '+355 69 402 1188',
    regNo: 'AL-K91824006',
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Tirana Cold Store', address: 'Rruga e Kavajës, Depo 4, Tirana' },
      { name: 'Durrës Port Warehouse', address: 'Port Free Zone, Hangar 11, Durrës' },
      { name: 'Vlorë Branch Store', address: 'Lagjja Pavarësia, Rruga Sadik Zotaj, Vlorë' },
    ],
    categories: [
      { name: 'Analgesics', description: 'Pain relief and antipyretics' },
      { name: 'Antibiotics', description: 'Prescription antibacterials' },
      { name: 'Vitamins & Supplements', description: 'OTC supplements' },
      { name: 'Medical Devices', description: 'Diagnostic and monitoring devices' },
      { name: 'Consumables', description: 'Gloves, syringes and dressings' },
    ],
    products: [
      ['Paracetamol 500mg x100', 'Analgesics', 'Profarma', 4.2, 2.6, ['otc']],
      ['Ibuprofen 400mg x50', 'Analgesics', 'Profarma', 5.6, 3.4, ['otc']],
      ['Diclofenac Gel 50g', 'Analgesics', 'Novartis', 8.9, 5.7, ['topical']],
      ['Amoxicillin 500mg x20', 'Antibiotics', 'Sandoz', 9.4, 6.1, ['rx']],
      ['Azithromycin 500mg x3', 'Antibiotics', 'Teva', 11.8, 7.9, ['rx']],
      ['Ciprofloxacin 500mg x10', 'Antibiotics', 'Bayer', 13.5, 9.2, ['rx']],
      ['Vitamin D3 2000IU x90', 'Vitamins & Supplements', 'Solgar', 16.9, 10.4, ['otc']],
      ['Vitamin C 1000mg x60', 'Vitamins & Supplements', 'Solgar', 14.2, 8.8, ['otc']],
      ['Magnesium + B6 x60', 'Vitamins & Supplements', 'Sanofi', 12.6, 7.9, ['otc']],
      ['Omega-3 1000mg x120', 'Vitamins & Supplements', 'Solgar', 22.4, 14.1, ['otc']],
      ['Digital Thermometer', 'Medical Devices', 'Omron', 9.9, 5.8, ['device']],
      ['Blood Pressure Monitor M3', 'Medical Devices', 'Omron', 54.0, 38.0, ['device']],
      ['Pulse Oximeter Fingertip', 'Medical Devices', 'Contec', 18.5, 11.2, ['device']],
      ['Glucometer Starter Kit', 'Medical Devices', 'Accu-Chek', 29.9, 19.4, ['device']],
      ['Nebulizer Compact', 'Medical Devices', 'Omron', 46.0, 32.0, ['device']],
      ['Nitrile Gloves M x100', 'Consumables', 'Medline', 7.8, 4.9, ['ppe']],
      ['Surgical Mask Type IIR x50', 'Consumables', 'Medline', 5.4, 3.1, ['ppe']],
      ['Syringe 5ml x100', 'Consumables', 'BD', 11.2, 7.3, ['sterile']],
      ['Sterile Gauze 10x10 x100', 'Consumables', 'Hartmann', 9.6, 6.2, ['dressing']],
      ['Alcohol Swabs x200', 'Consumables', 'Hartmann', 4.4, 2.5, ['dressing']],
    ],
  },
  {
    name: 'Hawassa Agro Traders',
    slug: 'hawassa-agro-traders',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Hawassa',
    state: 'Sidama',
    postal: '0500',
    street: 'Piassa Road, Tabor Sub-city, Building 12',
    phone: '+251 916 553 902',
    regNo: 'ET-SD-0033719',
    requiresQuotationApproval: false,
    warehouses: [
      { name: 'Hawassa Central Store', address: 'Tabor Sub-city, Store 1, Hawassa' },
      { name: 'Shashemene Collection Point', address: 'Shashemene Market Road, Shed 6' },
      { name: 'Dilla Seed Store', address: 'Dilla Town, Coffee Union Compound' },
    ],
    categories: [
      { name: 'Seeds', description: 'Certified crop and vegetable seed' },
      { name: 'Fertilizer', description: 'Granular and foliar fertilizer' },
      { name: 'Crop Protection', description: 'Herbicides, fungicides and insecticides' },
      { name: 'Irrigation', description: 'Pumps, pipes and drip kits' },
      { name: 'Tools & Equipment', description: 'Hand tools and sprayers' },
    ],
    products: [
      ['Hybrid Maize BH-661 25kg', 'Seeds', 'EthioSeed', 62.0, 44.0, ['seed', 'maize']],
      ['Wheat Kakaba 50kg', 'Seeds', 'EthioSeed', 41.0, 29.5, ['seed', 'wheat']],
      ['Tomato Galilea F1 10g', 'Seeds', 'Hazera', 34.0, 22.0, ['seed', 'vegetable']],
      ['Onion Bombay Red 500g', 'Seeds', 'EthioSeed', 18.0, 11.5, ['seed', 'vegetable']],
      ['Haricot Bean Awash-1 25kg', 'Seeds', 'EthioSeed', 37.0, 26.0, ['seed']],
      ['Urea 46% 50kg', 'Fertilizer', 'OCP', 28.0, 21.0, ['fertilizer', 'bulk']],
      ['NPS 50kg', 'Fertilizer', 'OCP', 31.0, 23.5, ['fertilizer', 'bulk']],
      ['DAP 50kg', 'Fertilizer', 'OCP', 33.5, 25.0, ['fertilizer']],
      ['Foliar Micro Mix 1L', 'Fertilizer', 'Yara', 14.8, 9.6, ['fertilizer', 'foliar']],
      ['Glyphosate 480 SL 1L', 'Crop Protection', 'Syngenta', 9.4, 6.2, ['herbicide']],
      ['2,4-D Amine 1L', 'Crop Protection', 'Adama', 8.1, 5.4, ['herbicide']],
      ['Mancozeb 80 WP 1kg', 'Crop Protection', 'Adama', 11.6, 7.8, ['fungicide']],
      ['Karate 5 EC 250ml', 'Crop Protection', 'Syngenta', 13.2, 8.9, ['insecticide']],
      ['Ridomil Gold 1kg', 'Crop Protection', 'Syngenta', 24.0, 16.8, ['fungicide']],
      ['Honda WB20 Water Pump', 'Irrigation', 'Honda', 289.0, 224.0, ['pump']],
      ['Drip Kit 1000m²', 'Irrigation', 'Netafim', 410.0, 322.0, ['drip']],
      ['Layflat Hose 2" 100m', 'Irrigation', 'Netafim', 96.0, 68.0, ['hose']],
      ['Sprinkler Head Set x10', 'Irrigation', 'Netafim', 42.0, 28.0, ['sprinkler']],
      ['Knapsack Sprayer 16L', 'Tools & Equipment', 'Jacto', 34.0, 22.5, ['sprayer']],
      ['Motorized Mist Blower 25L', 'Tools & Equipment', 'Jacto', 268.0, 205.0, ['sprayer']],
      ['Hoe (Dongora) Heavy', 'Tools & Equipment', 'Local', 8.6, 5.4, ['hand-tool']],
      ['Pruning Shear Bypass', 'Tools & Equipment', 'Felco', 29.0, 19.5, ['hand-tool']],
    ],
  },
  {
    name: 'Adama Auto Parts Center',
    slug: 'adama-auto-parts-center',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Adama',
    state: 'Oromia',
    postal: '1888',
    street: 'Dembela Road, Auto Market Block C',
    phone: '+251 922 118 774',
    regNo: 'ET-OR-0071265',
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Adama Parts Warehouse', address: 'Dembela Road, Block C, Adama' },
      { name: 'Modjo Transit Store', address: 'Modjo Dry Port Access Road, Unit 9' },
      { name: 'Addis Retail Counter', address: 'Merkato Auto Spare Line, Shop 214, Addis Ababa' },
    ],
    categories: [
      { name: 'Filters', description: 'Oil, air, fuel and cabin filters' },
      { name: 'Brakes', description: 'Pads, discs and fluid' },
      { name: 'Lubricants', description: 'Engine, gear and hydraulic oils' },
      { name: 'Batteries & Electrical', description: 'Batteries, alternators, bulbs' },
      { name: 'Suspension', description: 'Shocks, bushings and arms' },
      { name: 'Tyres', description: 'Passenger and light truck tyres' },
    ],
    products: [
      ['Oil Filter Toyota 90915-YZZE1', 'Filters', 'Denso', 6.4, 3.9, ['toyota']],
      ['Air Filter Hilux 2.4D', 'Filters', 'Mann', 14.2, 9.1, ['toyota']],
      ['Fuel Filter Isuzu NPR', 'Filters', 'Bosch', 18.9, 12.6, ['isuzu']],
      ['Cabin Filter Corolla', 'Filters', 'Mann', 11.4, 7.2, ['toyota']],
      ['Brake Pad Set Front Hilux', 'Brakes', 'TRW', 46.0, 31.0, ['toyota']],
      ['Brake Disc Front Corolla', 'Brakes', 'Brembo', 38.5, 26.4, ['toyota']],
      ['Brake Fluid DOT4 1L', 'Brakes', 'Bosch', 7.2, 4.4, ['fluid']],
      ['Brake Shoe Set Rear NPR', 'Brakes', 'TRW', 68.0, 48.0, ['isuzu']],
      ['Engine Oil 15W-40 20L', 'Lubricants', 'Total', 74.0, 56.0, ['bulk']],
      ['Engine Oil 5W-30 Synth 4L', 'Lubricants', 'Mobil', 42.0, 30.5, ['synthetic']],
      ['Gear Oil 80W-90 4L', 'Lubricants', 'Total', 28.0, 19.5, []],
      ['Coolant Concentrate 5L', 'Lubricants', 'Total', 19.5, 13.0, ['fluid']],
      ['Battery 12V 70Ah', 'Batteries & Electrical', 'Varta', 96.0, 71.0, ['battery']],
      ['Battery 12V 100Ah HD', 'Batteries & Electrical', 'Varta', 148.0, 112.0, ['battery', 'truck']],
      ['Alternator Hilux 12V 80A', 'Batteries & Electrical', 'Denso', 210.0, 158.0, ['toyota']],
      ['H4 Halogen Bulb Pair', 'Batteries & Electrical', 'Osram', 8.9, 5.2, ['bulb']],
      ['Shock Absorber Front Hilux', 'Suspension', 'KYB', 62.0, 44.0, ['toyota']],
      ['Shock Absorber Rear Corolla', 'Suspension', 'KYB', 48.0, 33.5, ['toyota']],
      ['Lower Control Arm Bush Kit', 'Suspension', 'Febest', 24.0, 15.8, []],
      ['Tyre 265/65R17 AT', 'Tyres', 'Bridgestone', 168.0, 129.0, ['tyre', '4x4']],
      ['Tyre 195/65R15', 'Tyres', 'Michelin', 88.0, 66.0, ['tyre']],
      ['Tyre 7.50R16 LT', 'Tyres', 'Bridgestone', 142.0, 108.0, ['tyre', 'truck']],
    ],
  },
  {
    name: 'Kazanchis Office Interiors',
    slug: 'kazanchis-office-interiors',
    currency: 'USD',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    city: 'Addis Ababa',
    state: 'Addis Ababa',
    postal: '1250',
    street: 'Kazanchis, Zequala Complex, Ground Floor',
    phone: '+251 913 660 271',
    regNo: 'ET-AA-0128844',
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Kazanchis Showroom Store', address: 'Zequala Complex, Basement Store, Addis Ababa' },
      { name: 'Lebu Assembly Warehouse', address: 'Lebu Industrial Area, Shed 14, Addis Ababa' },
    ],
    categories: [
      { name: 'Desks & Workstations', description: 'Executive and open-plan desking' },
      { name: 'Seating', description: 'Task, executive and visitor chairs' },
      { name: 'Storage', description: 'Cabinets, pedestals and lockers' },
      { name: 'Meeting & Reception', description: 'Boardroom tables and reception counters' },
      { name: 'Partitions & Acoustics', description: 'Screens, panels and acoustic treatment' },
    ],
    products: [
      ['Executive Desk 1800mm Walnut', 'Desks & Workstations', 'Neva Line', 640.0, 470.0, ['executive']],
      ['Manager Desk 1600mm Oak', 'Desks & Workstations', 'Neva Line', 480.0, 352.0, []],
      ['Bench Workstation 4-Person', 'Desks & Workstations', 'Neva Line', 1180.0, 880.0, ['open-plan']],
      ['Height-Adjustable Desk 1400mm', 'Desks & Workstations', 'Flexi', 720.0, 545.0, ['sit-stand']],
      ['Task Chair Mesh Mid-Back', 'Seating', 'Sihoo', 148.0, 98.0, ['task']],
      ['Ergonomic Chair High-Back', 'Seating', 'Sihoo', 268.0, 189.0, ['ergonomic', 'popular']],
      ['Executive Leather Chair', 'Seating', 'Neva Line', 395.0, 288.0, ['executive']],
      ['Visitor Chair Cantilever', 'Seating', 'Neva Line', 96.0, 62.0, ['visitor']],
      ['Stackable Training Chair', 'Seating', 'Neva Line', 68.0, 42.0, ['training']],
      ['3-Drawer Mobile Pedestal', 'Storage', 'Neva Line', 138.0, 94.0, []],
      ['2-Door Steel Cabinet 1850mm', 'Storage', 'SteelCo', 262.0, 190.0, ['steel']],
      ['Filing Cabinet 4-Drawer', 'Storage', 'SteelCo', 218.0, 158.0, ['steel']],
      ['Locker Unit 6-Door', 'Storage', 'SteelCo', 285.0, 205.0, ['steel']],
      ['Boardroom Table 3600mm', 'Meeting & Reception', 'Neva Line', 1450.0, 1090.0, ['boardroom']],
      ['Round Meeting Table 1200mm', 'Meeting & Reception', 'Neva Line', 265.0, 186.0, []],
      ['Reception Counter 2400mm', 'Meeting & Reception', 'Neva Line', 890.0, 645.0, ['reception']],
      ['3-Seater Reception Sofa', 'Meeting & Reception', 'Neva Line', 720.0, 520.0, ['reception']],
      ['Desk Screen 1400x400 Acoustic', 'Partitions & Acoustics', 'Quietly', 118.0, 78.0, ['acoustic']],
      ['Floor Partition 1800x1200', 'Partitions & Acoustics', 'Quietly', 245.0, 172.0, ['partition']],
      ['Acoustic Wall Panel 600x600', 'Partitions & Acoustics', 'Quietly', 46.0, 28.0, ['acoustic']],
    ],
  },
  {
    name: 'Dire Dawa Textile House',
    slug: 'dire-dawa-textile-house',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Dire Dawa',
    state: 'Dire Dawa',
    postal: '3000',
    street: 'Kezira Market, Textile Row 8',
    phone: '+251 915 330 660',
    regNo: 'ET-DD-0019004',
    requiresQuotationApproval: false,
    warehouses: [
      { name: 'Kezira Main Store', address: 'Kezira Market, Textile Row 8, Dire Dawa' },
      { name: 'Dewele Border Depot', address: 'Dewele Customs Road, Warehouse 2' },
    ],
    categories: [
      { name: 'Fabric Rolls', description: 'Cotton, polyester and blends by the roll' },
      { name: 'Traditional Wear', description: 'Habesha kemis, netela and gabi' },
      { name: 'Uniforms', description: 'School, hospital and corporate uniforms' },
      { name: 'Haberdashery', description: 'Thread, buttons, zippers and trims' },
    ],
    products: [
      ['Cotton Poplin Roll 50m White', 'Fabric Rolls', 'Ayka Addis', 118.0, 84.0, ['cotton', 'bulk']],
      ['Polyester Gabardine Roll 50m Navy', 'Fabric Rolls', 'Ayka Addis', 132.0, 96.0, ['bulk']],
      ['Cotton Twill Roll 50m Khaki', 'Fabric Rolls', 'Ayka Addis', 126.0, 91.0, ['bulk']],
      ['Linen Blend Roll 30m Beige', 'Fabric Rolls', 'Bahir Dar Textile', 148.0, 108.0, []],
      ['Chiffon Roll 30m Assorted', 'Fabric Rolls', 'Imported', 96.0, 66.0, []],
      ['Habesha Kemis Hand-Woven', 'Traditional Wear', 'Shiro Meda', 168.0, 118.0, ['traditional', 'premium']],
      ['Netela Standard', 'Traditional Wear', 'Shiro Meda', 42.0, 27.0, ['traditional']],
      ['Gabi Double-Layer', 'Traditional Wear', 'Shiro Meda', 78.0, 54.0, ['traditional']],
      ['Kuta Men’s', 'Traditional Wear', 'Shiro Meda', 58.0, 39.0, ['traditional']],
      ['School Shirt Set (30 pcs)', 'Uniforms', 'Neva Line', 210.0, 148.0, ['school', 'bulk']],
      ['School Trousers (30 pcs)', 'Uniforms', 'Neva Line', 268.0, 192.0, ['school', 'bulk']],
      ['Hospital Scrub Set', 'Uniforms', 'Neva Line', 24.0, 15.0, ['medical']],
      ['Corporate Blazer Navy', 'Uniforms', 'Neva Line', 68.0, 46.0, ['corporate']],
      ['Chef Jacket White', 'Uniforms', 'Neva Line', 22.0, 13.5, ['hospitality']],
      ['Polyester Thread Cone 5000m', 'Haberdashery', 'Coats', 3.4, 2.05, ['consumable']],
      ['Nylon Zipper 20cm (100 pcs)', 'Haberdashery', 'YKK', 12.8, 8.1, ['consumable']],
      ['Shirt Buttons 4-Hole (1000 pcs)', 'Haberdashery', 'Generic', 6.9, 4.2, ['consumable']],
      ['Elastic Band 25mm 50m', 'Haberdashery', 'Generic', 5.6, 3.4, ['consumable']],
      ['Interfacing Fusible 50m', 'Haberdashery', 'Generic', 18.2, 12.4, ['consumable']],
    ],
  },
  {
    name: 'Mekelle Cold Chain Foods',
    slug: 'mekelle-cold-chain-foods',
    currency: 'ETB',
    locale: 'en-US',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    city: 'Mekelle',
    state: 'Tigray',
    postal: '7000',
    street: 'Hawelti Sub-city, Industry Street 4',
    phone: '+251 914 772 015',
    regNo: 'ET-TG-0008812',
    suspended: true,
    requiresQuotationApproval: true,
    warehouses: [
      { name: 'Mekelle Cold Store -18°C', address: 'Hawelti Industry Street 4, Cold Room A' },
      { name: 'Mekelle Ambient Store', address: 'Hawelti Industry Street 4, Dry Store B' },
      { name: 'Adigrat Distribution Point', address: 'Adigrat Main Road, Depot 3' },
    ],
    categories: [
      { name: 'Frozen Meat', description: 'Beef, lamb and poultry, frozen' },
      { name: 'Dairy', description: 'Milk, butter and cheese' },
      { name: 'Frozen Vegetables', description: 'IQF vegetables and blends' },
      { name: 'Dry Goods', description: 'Ambient-stored staples' },
    ],
    products: [
      ['Beef Cuts Frozen 10kg Box', 'Frozen Meat', 'Luna Export', 88.0, 66.0, ['frozen', 'bulk']],
      ['Lamb Carcass Frozen (kg)', 'Frozen Meat', 'Luna Export', 9.4, 7.1, ['frozen']],
      ['Chicken Whole Frozen 1.2kg', 'Frozen Meat', 'Alema Koudijs', 6.8, 4.9, ['frozen', 'popular']],
      ['Chicken Breast Fillet 5kg', 'Frozen Meat', 'Alema Koudijs', 34.0, 25.5, ['frozen']],
      ['UHT Milk 1L (12 pack)', 'Dairy', 'Family Milk', 14.4, 10.6, ['dairy']],
      ['Butter Unsalted 500g', 'Dairy', 'Shola', 6.2, 4.4, ['dairy', 'chilled']],
      ['Mozzarella Block 2.5kg', 'Dairy', 'Almi', 26.0, 19.2, ['dairy', 'chilled']],
      ['Yoghurt Plain 1kg', 'Dairy', 'Shola', 3.9, 2.6, ['dairy', 'chilled']],
      ['IQF Green Beans 2.5kg', 'Frozen Vegetables', 'Ardo', 11.8, 8.2, ['frozen']],
      ['IQF Mixed Vegetables 2.5kg', 'Frozen Vegetables', 'Ardo', 10.9, 7.6, ['frozen']],
      ['IQF Sweet Corn 2.5kg', 'Frozen Vegetables', 'Ardo', 9.8, 6.7, ['frozen']],
      ['French Fries 7mm 2.5kg', 'Frozen Vegetables', 'Aviko', 12.6, 8.9, ['frozen', 'popular']],
      ['Sunflower Oil 20L', 'Dry Goods', 'Wilmar', 42.0, 33.0, ['ambient', 'bulk']],
      ['Rice Long Grain 25kg', 'Dry Goods', 'Imported', 38.0, 29.0, ['ambient', 'bulk']],
      ['Wheat Flour 50kg', 'Dry Goods', 'Dire Flour', 34.0, 26.0, ['ambient', 'bulk']],
      ['Tomato Paste 800g x12', 'Dry Goods', 'Merti', 22.0, 16.4, ['ambient']],
      ['Iodized Salt 1kg x25', 'Dry Goods', 'Afdera', 9.5, 6.3, ['ambient']],
    ],
  },
];

// ---------------------------------------------------------------------------
// Content pools
// ---------------------------------------------------------------------------

const CLIENT_COMPANIES = [
  'Habesha Construction PLC', 'Blue Nile Trading', 'Rift Valley Logistics', 'Zemen Engineering',
  'Awash Insurance Branch', 'Selam Bus Line Share Co.', 'Ethio Telecom Regional', 'Sunshine Real Estate',
  'Rainbow Hotel Group', 'Golden Star Import', 'Nile Petroleum Depot', 'Green Land Agro PLC',
  'Addis Medical Center', 'Unity University Campus', 'Kaldi’s Coffee Franchise', 'Bunna Bank Branch',
  'Dashen Brewery Depot', 'Sheger Bottling', 'MIDROC Facilities', 'East Africa Freight',
  'Tana Print House', 'Lion Security Services', 'Abay Cement Retail', 'Horizon Plantations',
  'Zewditu General Hospital', 'Prime Retail Chain', 'Nova Tech Solutions', 'Wabe Shebelle Resorts',
];
const CONTACT_SUFFIX = ['procurement', 'purchasing', 'admin', 'ops', 'finance', 'info'];

const INTERACTION_TEXT: Record<string, string[]> = {
  CALL: [
    'Called to follow up on the outstanding quotation. They asked for a revised delivery window.',
    'Rang to confirm receipt of the proforma. Finance is releasing payment this week.',
    'Quick call about a stock shortfall on the last delivery; two units short, arranging replacement.',
    'Discussed volume pricing over the phone. They want a 5% break above 50 units.',
  ],
  MEETING: [
    'On-site meeting at their head office. Walked through the full catalogue and agreed on a pilot order.',
    'Met the procurement committee. They need our tax registration and bank details before onboarding.',
    'Site visit to measure the space before finalising the layout and quantities.',
    'Quarterly review meeting. They are happy with lead times but want tighter delivery slots.',
  ],
  EMAIL: [
    'Emailed the updated price list with the new currency rates applied.',
    'Sent the signed delivery note and the corresponding invoice as requested.',
    'Received an RFQ by email covering 14 line items; preparing a quotation now.',
    'Emailed to confirm the warehouse pickup slot for Thursday morning.',
  ],
  NOTE: [
    'Long-standing account, pays reliably within 30 days. Safe to extend credit terms.',
    'Prefers to be contacted in the morning. Decision maker is the operations manager, not procurement.',
    'Watch this one: two late payments in a row. Keep to cash on delivery for now.',
    'Expanding to a second location next quarter — good upsell opportunity.',
  ],
};

const OUTCOME_LABELS = ['Interested', 'Needs Follow-up', 'Quotation Requested', 'Not Interested', 'Closed Won'];

const APPOINTMENT_NOTES = [
  'Bring the printed catalogue and the current price list.',
  'Site survey — take measurements and photos of the loading bay.',
  'Contract signing. Company stamp required.',
  'Delivery hand-over and acceptance walkthrough.',
  'Demo of the top three items on their shortlist.',
  'Payment collection visit. Confirm the cheque is ready.',
  'Follow-up on the pending quotation and objections raised last time.',
];

const ADJUSTMENT_REASONS = [
  'Goods received from supplier',
  'Cycle count correction',
  'Damaged in handling — written off',
  'Customer return restocked',
  'Opening balance',
  'Expired stock removed',
  'Sample issued to sales team',
];
const TRANSFER_REASONS = [
  'Rebalancing stock between locations',
  'Fulfilling a regional order',
  'Consolidating slow movers at the main store',
  'Branch replenishment run',
];

// ---------------------------------------------------------------------------

const skuFor = (name: string, i: number) =>
  `${name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join('-')}-${String(i + 1).padStart(3, '0')}`;

async function seedStore(spec: StoreSpec, storeIndex: number, hashedPassword: string) {
  const existing = await prisma.tenant.findUnique({ where: { urlSlug: spec.slug } });
  if (existing) {
    console.log(`  ~ ${spec.name} already exists, skipping`);
    return;
  }

  const tenantId = randomUUID();
  await prisma.tenant.create({
    data: {
      id: tenantId,
      name: spec.name,
      urlSlug: spec.slug,
      requiresQuotationApproval: spec.requiresQuotationApproval,
      registrationNumber: spec.regNo,
      addressLine: spec.street,
      addressCity: spec.city,
      addressState: spec.state,
      addressPostalCode: spec.postal,
      contactEmail: `info@${spec.slug.replace(/-/g, '')}.com`,
      contactPhone: spec.phone,
      currency: spec.currency,
      locale: spec.locale,
      timezone: spec.timezone,
      dateFormat: spec.dateFormat,
      defaultLanguage: spec.language,
      subscriptionStatus: spec.suspended ? 'SUSPENDED' : 'ACTIVE',
      createdAt: daysFromNow(-(420 - storeIndex * 40)),
    },
  });

  // --- Warehouses -----------------------------------------------------------
  const warehouses = spec.warehouses.map((w) => ({
    id: randomUUID(),
    tenantId,
    name: w.name,
    address: w.address,
    createdAt: daysFromNow(-(400 - storeIndex * 40)),
    updatedAt: new Date(),
  }));
  await prisma.warehouse.createMany({ data: warehouses });

  // --- Users: the whole roster, owner rotates per store ----------------------
  const ownerIdx = storeIndex % PEOPLE.length;
  const users = PEOPLE.map((p, i) => {
    const isOwner = i === ownerIdx;
    // Roughly a third of staff manage a specific warehouse; the rest are
    // floaters. Spread by a counter rather than `i` so every warehouse gets
    // managers — `i % 3` would land every third staffer on warehouse 0.
    const managed = !isOwner && i % 3 === 0 ? warehouses[Math.floor(i / 3) % warehouses.length].id : null;
    return {
      id: randomUUID(),
      email: p.email,
      hashedPassword,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: `+251 9${String(10 + storeIndex)} ${String(100000 + i * 4321).slice(0, 3)} ${String(100000 + i * 7919).slice(0, 3)}`,
      role: isOwner ? 'BUSINESS_OWNER' : 'STAFF',
      isActive: i !== PEOPLE.length - 1, // one deactivated account per store
      language: null as string | null,
      tenantId,
      warehouseId: managed,
      createdAt: daysFromNow(-(395 - storeIndex * 40) + i),
    };
  });
  await prisma.user.createMany({ data: users });
  const owner = users[ownerIdx];
  const activeUsers = users.filter((u) => u.isActive);

  // --- Categories -----------------------------------------------------------
  const categories = spec.categories.map((c) => ({
    id: randomUUID(),
    tenantId,
    name: c.name,
    description: c.description,
    isArchived: false,
    createdAt: daysFromNow(-380),
    updatedAt: new Date(),
  }));
  await prisma.category.createMany({ data: categories });
  const catByName = new Map(categories.map((c) => [c.name, c.id]));

  // --- Products -------------------------------------------------------------
  const products = spec.products.map(([name, cat, brand, price, cost, tags], i) => ({
    id: randomUUID(),
    tenantId,
    name,
    description: `${name} — supplied by ${spec.name}. ${brand} quality, sold from ${spec.warehouses[0].name}.`,
    sku: skuFor(name, i),
    brand,
    categoryId: catByName.get(cat) ?? null,
    price,
    cost,
    tags,
    lowStockThreshold: [5, 10, 15, 20, 25][i % 5],
    // A couple of discontinued lines per store, so the archive filter has something to show.
    isArchived: i > 0 && i % 11 === 0,
    createdAt: daysFromNow(-370 + i * 2),
    updatedAt: new Date(),
  }));
  await prisma.product.createMany({ data: products });

  // --- Stock levels: every product in every warehouse -----------------------
  const stockLevels: any[] = [];
  for (const p of products) {
    for (const [wi, w] of warehouses.entries()) {
      // Main warehouse holds the bulk; a slice of rows land at or under the
      // low-stock threshold and a few are outright zero, so the dashboard
      // alerts and the "out of stock" badges are populated.
      let qty: number;
      const roll = rnd();
      if (roll < 0.08) qty = 0;
      else if (roll < 0.24) qty = int(1, p.lowStockThreshold);
      else qty = wi === 0 ? int(40, 480) : int(10, 160);
      stockLevels.push({
        id: randomUUID(),
        tenantId,
        productId: p.id,
        productTenantId: tenantId,
        warehouseId: w.id,
        warehouseTenantId: tenantId,
        quantity: qty,
      });
    }
  }
  await prisma.stockLevel.createMany({ data: stockLevels });

  // --- Stock movements: the history behind those levels ---------------------
  const movements: any[] = [];
  for (const p of products) {
    for (let n = 0; n < int(2, 5); n++) {
      const author = pick(activeUsers);
      if (chance(0.72) || warehouses.length < 2) {
        movements.push({
          id: randomUUID(),
          tenantId,
          productId: p.id,
          warehouseId: pick(warehouses).id,
          fromWarehouseId: null,
          toWarehouseId: null,
          quantity: chance(0.7) ? int(5, 200) : -int(1, 25),
          type: 'ADJUSTMENT',
          reason: pick(ADJUSTMENT_REASONS),
          createdBy: author.id,
          createdAt: daysFromNow(-int(1, 300), int(8, 17)),
        });
      } else {
        const from = pick(warehouses);
        const to = pick(warehouses.filter((w) => w.id !== from.id));
        movements.push({
          id: randomUUID(),
          tenantId,
          productId: p.id,
          warehouseId: null,
          fromWarehouseId: from.id,
          toWarehouseId: to.id,
          quantity: int(2, 60),
          type: 'TRANSFER',
          reason: pick(TRANSFER_REASONS),
          createdBy: author.id,
          createdAt: daysFromNow(-int(1, 300), int(8, 17)),
        });
      }
    }
  }
  await prisma.stockMovement.createMany({ data: movements });

  // --- Custom field definitions & outcome categories ------------------------
  const cfds = [
    { id: randomUUID(), tenantId, fieldName: 'Industry', fieldType: 'SINGLE_SELECT', options: ['Construction', 'Retail', 'Hospitality', 'Healthcare', 'Government', 'Manufacturing', 'Education'] },
    { id: randomUUID(), tenantId, fieldName: 'Payment Terms', fieldType: 'SINGLE_SELECT', options: ['Cash on Delivery', 'Net 15', 'Net 30', 'Net 60'] },
    { id: randomUUID(), tenantId, fieldName: 'Credit Limit', fieldType: 'NUMBER', options: [] },
    { id: randomUUID(), tenantId, fieldName: 'TIN Number', fieldType: 'TEXT', options: [] },
    { id: randomUUID(), tenantId, fieldName: 'VAT Registered', fieldType: 'BOOLEAN', options: [] },
    { id: randomUUID(), tenantId, fieldName: 'Onboarded On', fieldType: 'DATE', options: [] },
  ];
  await prisma.customFieldDefinition.createMany({ data: cfds });

  const outcomes = OUTCOME_LABELS.map((label) => ({ id: randomUUID(), tenantId, label }));
  await prisma.outcomeCategory.createMany({ data: outcomes });

  // --- Clients --------------------------------------------------------------
  const clientCount = 18;
  const clients = Array.from({ length: clientCount }, (_, i) => {
    const company = CLIENT_COMPANIES[(i + storeIndex * 5) % CLIENT_COMPANIES.length];
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const status = i < 9 ? 'ACTIVE' : i < 15 ? 'PROSPECT' : 'INACTIVE';
    return {
      id: randomUUID(),
      tenantId,
      name: `${company}${i >= CLIENT_COMPANIES.length ? ' (Branch 2)' : ''}`,
      email: `${pick(CONTACT_SUFFIX)}@${slug.slice(0, 18)}.com`,
      phone: `+251 1${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      status,
      assignedUserId: pick(activeUsers).id,
      customFieldValues: {
        Industry: pick(['Construction', 'Retail', 'Hospitality', 'Healthcare', 'Government', 'Manufacturing', 'Education']),
        'Payment Terms': pick(['Cash on Delivery', 'Net 15', 'Net 30', 'Net 60']),
        'Credit Limit': int(2, 60) * 2500,
        'TIN Number': `00${int(10000000, 99999999)}`,
        'VAT Registered': chance(0.7),
        'Onboarded On': daysFromNow(-int(30, 700)).toISOString().slice(0, 10),
      },
      lastUpdatedByUserId: pick(activeUsers).id,
      createdAt: daysFromNow(-int(20, 360)),
      updatedAt: daysFromNow(-int(0, 19)),
    };
  });
  await prisma.client.createMany({ data: clients });

  // --- Interactions ---------------------------------------------------------
  const interactions: any[] = [];
  for (const c of clients) {
    for (let n = 0; n < int(2, 6); n++) {
      const channel = pick(['CALL', 'MEETING', 'EMAIL', 'NOTE'] as const);
      interactions.push({
        id: randomUUID(),
        tenantId,
        clientId: c.id,
        authorUserId: pick(activeUsers).id,
        content: pick(INTERACTION_TEXT[channel]),
        channel,
        outcomeCategoryId: chance(0.75) ? pick(outcomes).id : null,
        createdAt: daysFromNow(-int(1, 200), int(8, 18)),
      });
    }
  }
  await prisma.interaction.createMany({ data: interactions });

  // --- Appointments (past + upcoming) + reschedule audit trail --------------
  const appointments: any[] = [];
  const auditLogs: any[] = [];
  for (let i = 0; i < 24; i++) {
    const past = i < 12;
    const scheduledAt = past ? daysFromNow(-int(1, 90), int(8, 17)) : daysFromNow(int(0, 45), int(8, 17));
    const status = past
      ? pick(['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'] as const)
      : pick(['SCHEDULED', 'SCHEDULED', 'CONFIRMED'] as const);
    const assignee = pick(activeUsers);
    const appt = {
      id: randomUUID(),
      tenantId,
      clientId: pick(clients).id,
      assignedUserId: assignee.id,
      scheduledAt,
      status,
      notes: chance(0.85) ? pick(APPOINTMENT_NOTES) : null,
      createdAt: new Date(scheduledAt.getTime() - int(3, 20) * 86400000),
      updatedAt: new Date(),
    };
    appointments.push(appt);
    if (chance(0.3)) {
      const previous = new Date(scheduledAt.getTime() - int(1, 6) * 86400000);
      auditLogs.push({
        id: randomUUID(),
        appointmentId: appt.id,
        previousDate: previous,
        newDate: scheduledAt,
        reason: pick(['Client requested a later slot', 'Vehicle unavailable', 'Contact was travelling', 'Overlapped with another visit']),
        changedBy: assignee.id,
        createdAt: previous,
      });
    }
  }
  await prisma.appointment.createMany({ data: appointments });
  await prisma.appointmentAuditLog.createMany({ data: auditLogs });

  // --- Quotations, line items and status history ---------------------------
  const sellable = products.filter((p) => !p.isArchived);
  const quotations: any[] = [];
  const lineItems: any[] = [];
  const history: any[] = [];
  const notifications: any[] = [];

  const STATUS_FLOW = ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const;
  for (let i = 0; i < 22; i++) {
    const status = STATUS_FLOW[i % STATUS_FLOW.length];
    const createdBy = pick(activeUsers);
    const createdAt = daysFromNow(-int(2, 150), int(9, 16));
    const isSent = ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status);
    const responded = ['ACCEPTED', 'REJECTED'].includes(status);
    const q = {
      id: randomUUID(),
      tenantId,
      clientId: pick(clients).id,
      createdByUserId: createdBy.id,
      status,
      sentAt: isSent ? new Date(createdAt.getTime() + 86400000) : null,
      respondedAt: responded ? new Date(createdAt.getTime() + 4 * 86400000) : null,
      createdAt,
      updatedAt: new Date(),
    };
    quotations.push(q);

    const picked = new Set<string>();
    for (let n = 0; n < int(2, 7); n++) {
      const p = pick(sellable);
      if (picked.has(p.id)) continue;
      picked.add(p.id);
      lineItems.push({
        id: randomUUID(),
        tenantId,
        quotationId: q.id,
        productId: p.id,
        warehouseId: pick(warehouses).id,
        quantity: int(1, 40),
        // Occasionally discounted off list, which is what the pricing column shows.
        unitPrice: chance(0.25) ? Math.round(p.price * 0.93 * 100) / 100 : p.price,
      });
    }

    const reference = `Q-${String(1000 + storeIndex * 100 + i)}`;
    const path: [string, string][] = [];
    if (status !== 'DRAFT') path.push(['DRAFT', 'PENDING_APPROVAL']);
    if (isSent) path.push(['PENDING_APPROVAL', 'SENT']);
    if (responded) path.push(['SENT', status]);
    if (status === 'EXPIRED') path.push(['SENT', 'EXPIRED']);
    path.forEach(([from, to], step) => {
      const changer = pick(activeUsers);
      history.push({
        id: randomUUID(),
        tenantId,
        quotationId: q.id,
        fromStatus: from,
        toStatus: to,
        changedByUserId: changer.id,
        note: chance(0.4) ? pick(['Approved after margin check', 'Client confirmed by phone', 'Prices refreshed before sending', 'Rejected on price']) : null,
        createdAt: new Date(createdAt.getTime() + (step + 1) * 86400000),
      });
      const type =
        to === 'PENDING_APPROVAL' ? 'QUOTATION_SUBMITTED_FOR_APPROVAL'
          : to === 'SENT' ? 'QUOTATION_APPROVED'
            : to === 'ACCEPTED' ? 'QUOTATION_ACCEPTED'
              : to === 'REJECTED' ? 'QUOTATION_REJECTED'
                : 'QUOTATION_EXPIRED';
      notifications.push({
        id: randomUUID(),
        tenantId,
        recipientUserId: to === 'PENDING_APPROVAL' ? owner.id : createdBy.id,
        type,
        params: { reference },
        actorUserId: type === 'QUOTATION_EXPIRED' ? null : changer.id,
        entityType: 'QUOTATION',
        entityId: q.id,
        readAt: chance(0.55) ? new Date() : null,
        createdAt: new Date(createdAt.getTime() + (step + 1) * 86400000),
      });
    });
  }
  await prisma.quotation.createMany({ data: quotations });
  await prisma.quotationLineItem.createMany({ data: lineItems });
  await prisma.quotationStatusHistory.createMany({ data: history });

  // --- Remaining notifications: appointments and client assignments ---------
  for (const a of appointments.slice(0, 10)) {
    const client = clients.find((c) => c.id === a.clientId)!;
    notifications.push({
      id: randomUUID(),
      tenantId,
      recipientUserId: a.assignedUserId,
      type: 'APPOINTMENT_ASSIGNED',
      params: { client: client.name },
      actorUserId: owner.id,
      entityType: 'APPOINTMENT',
      entityId: a.id,
      readAt: chance(0.5) ? new Date() : null,
      createdAt: a.createdAt,
    });
  }
  for (const c of clients.slice(0, 8)) {
    notifications.push({
      id: randomUUID(),
      tenantId,
      recipientUserId: c.assignedUserId!,
      type: 'CLIENT_ASSIGNED',
      params: { client: c.name },
      actorUserId: owner.id,
      entityType: 'CLIENT',
      entityId: c.id,
      readAt: chance(0.4) ? new Date() : null,
      createdAt: c.createdAt,
    });
  }
  await prisma.notification.createMany({ data: notifications });

  // --- Pending invitations (the team page's "invited" state) ----------------
  await prisma.invitation.createMany({
    data: [0, 1].map((n) => ({
      id: randomUUID(),
      tenantId,
      email: `new.hire${n + 1}.${spec.slug}@example.com`,
      role: 'STAFF',
      token: randomUUID().replace(/-/g, ''),
      expiresAt: daysFromNow(int(2, 10)),
      acceptedAt: null,
      warehouseId: warehouses[n % warehouses.length].id,
      invitedByUserId: owner.id,
    })),
  });

  // --- Integrations ---------------------------------------------------------
  await prisma.integration.create({
    data: {
      id: randomUUID(),
      tenantId,
      provider: 'GOOGLE_CALENDAR',
      status: chance(0.5) ? 'CONNECTED' : 'DISCONNECTED',
      config: { calendarId: 'primary', syncAppointments: true },
      createdAt: daysFromNow(-200),
      updatedAt: new Date(),
    },
  });

  console.log(
    `  + ${spec.name} (/${spec.slug})  ` +
    `users=${users.length} wh=${warehouses.length} cat=${categories.length} prod=${products.length} ` +
    `stock=${stockLevels.length} mov=${movements.length} clients=${clients.length} ` +
    `inter=${interactions.length} appt=${appointments.length} quo=${quotations.length} notif=${notifications.length}`
  );
}

async function main() {
  const target = process.env.DATABASE_URL ?? '';
  console.log(`Seeding ${target.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@')}\n`);

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (const [i, spec] of STORES.entries()) {
    await seedStore(spec, i, hashedPassword);
  }

  console.log('\nTotals now in the database:');
  for (const [label, n] of [
    ['tenants', await prisma.tenant.count()],
    ['users', await prisma.user.count()],
    ['warehouses', await prisma.warehouse.count()],
    ['products', await prisma.product.count()],
    ['stock levels', await prisma.stockLevel.count()],
    ['stock movements', await prisma.stockMovement.count()],
    ['clients', await prisma.client.count()],
    ['interactions', await prisma.interaction.count()],
    ['appointments', await prisma.appointment.count()],
    ['quotations', await prisma.quotation.count()],
    ['quotation line items', await prisma.quotationLineItem.count()],
    ['notifications', await prisma.notification.count()],
  ] as [string, number][]) {
    console.log(`  ${label.padEnd(22)} ${n}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
