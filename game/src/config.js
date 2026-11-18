// Teluk Surya — tuning, palette, story and mission data.
// Everything here is original: a sun-soaked port city of our own.

export const WORLD = {
  w: 3200,
  h: 2400,
  roadGap: 400, // distance between road centre lines
  roadWidth: 72,
  sidewalk: 14,
};

export const PALETTE = {
  grass: '#7fae62',
  park: '#69a357',
  road: '#3d3f45',
  roadLine: '#e8d44d',
  sidewalk: '#9a938a',
  building: ['#c96f4a', '#d9a441', '#5b7fa6', '#8a6fb0', '#b0576e', '#4f9d8a', '#a8b545'],
  roof: '#00000022',
  water: '#2e7fb8',
  deepWater: '#256b9e',
  sand: '#e3cd96',
  dock: '#8a6f4d',
  car: ['#d94f3d', '#3d7fd9', '#e8b73a', '#7ac74f', '#e8e8e8', '#2b2b2b', '#c77fd9'],
  cop: '#1d4ed8',
  player: '#f2c14e',
  ped: ['#e07a5f', '#81b29a', '#f2cc8f', '#6d9dc5', '#c77dff'],
};

export const TUNE = {
  walkSpeed: 165,
  runSpeed: 265,
  carAccel: 520,
  carBrake: 900,
  carMax: 460,
  carReverseMax: 150,
  carTurn: 2.6,
  carDrag: 0.6,
  pedSpeed: 55,
  trafficSpeed: 130,
  copSpeed: 330,
  copRamDamage: 14,
  punchRange: 46,
  punchDamage: 25,
  bulletDamage: 60,
  bulletRange: 340,
  wantedDecay: 0.045, // per second while unseen
  bustRadius: 30,
  pickupRadius: 34,
  missionRadius: 54,
};

export const STORY = {
  title: 'TELUK SURYA',
  subtitle: 'Kota Pelabuhan · Cerita Orisinal',
  player: 'Dimas Anggara',
  playerRole: 'Kurir yang berutang',
  fixer: 'Laras Wulandari',
  intro:
    'Dimas Anggara berutang besar pada Laras Wulandari, sang pengatur kota. ' +
    'Lima pekerjaan, satu malam, dan utang itu lunas — kalau polisi tidak menangkapnya dulu.',
  controlsHint: 'WASD jalan · Shift lari · E masuk/keluar mobil · F pukul / tembak · P jeda · M misi · N musik',
};

export const MISSION_DEFS = [
  {
    id: 'meet',
    name: 'Temui Laras',
    brief: 'Laras menunggumu di dermaga timur. Datangi penanda kuning itu.',
    reward: 150,
  },
  {
    id: 'steal',
    name: 'Curi Sedan Biru',
    brief: 'Sebuah sedan biru terparkir di blok pasar. Curi, lalu antar ke titik serah terima.',
    reward: 300,
  },
  {
    id: 'deliver',
    name: 'Antar Tiga Paket',
    brief: 'Tiga paket, tiga alamat. Antar semuanya tanpa ketahuan polisi.',
    reward: 450,
  },
  {
    id: 'escape',
    name: 'Kabur dari Razia',
    brief: 'Razia besar-besaran! Bertahan 60 detik, lalu sembunyi di rumah aman.',
    reward: 600,
  },
  {
    id: 'getaway',
    name: 'Pelarian Terakhir',
    brief: 'Naik kapal di pelabuhan sebelum polisi menutup kota. Ini pekerjaan terakhir.',
    reward: 1000,
  },
];

export const SAVE_KEY = 'teluk-surya-save-v1';
