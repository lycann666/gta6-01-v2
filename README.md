# Teluk Surya — Kota Pelabuhan

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/lycann666/gta6-01-v2/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/lycann666/gta6-01-v2/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Game open-world 2D orisinal: kota pelabuhan **Teluk Surya** yang bisa dijelajahi
dengan berjalan kaki dan mengemudi. Kamu bermain sebagai **Dimas Anggara**,
seorang kurir yang berutang pada **Laras Wulandari**, sang pengatur kota.
Lima pekerjaan dalam satu malam — kalau polisi tidak menangkapmu dulu.

Semua nama, tempat, karakter, kendaraan, dan cerita di game ini orisinal;
tidak ada yang diambil dari game, film, atau peta yang sudah ada.

## Yang ada di dalam game

- Kota hidup (3.200 × 2.400) di tepi laut: jalan berpetak, gedung, taman,
  dermaga, dan pantai.
- **Berkendara dan berjalan kaki**: mobil lalu lintas di jalan, pejalan kaki
  di trotoar, mobil parkir yang bisa dicuri (E) dan dikendarai.
- **Tingkat buronan (0–5 bintang)**: kejahatan menaikkannya, mobil polisi
  mengejar, ketangkap saat jalan kaki berarti tertangkap; ditabrak saat
  mengemudi mengurangi nyawa.
- **5 misi cerita** dengan penanda, panah arah, dan minimap: temui Laras di
  dermaga, curi sedan biru, antar tiga paket, kabur dari razia, dan pelarian
  terakhir ke kapal.
- **Pertarungan**: pukul (F), atau tembak (F, kalau ada peluru) ke arah hadap.
  Paket nyawa dan peluru tersebar di kota.
- HUD dengan uang, bintang buronan, nyawa, kecepatan, peluru, tujuan misi,
  dan minimap; layar judul / jeda / tertangkap / kalah / menang; progres dan
  uang terbaik tersimpan di `localStorage`.
- Suara sintetis WebAudio saja (deru mesin, sirene, pukulan, tembakan,
  jingle misi, plus loop musik malam Am–F–C–G yang bisa dimatikan dengan N)
  — tanpa file audio, tanpa permintaan jaringan.

## Kontrol

| Tombol | Aksi |
| --- | --- |
| W A S D / panah | Jalan / mengemudi (Atas = gas) |
| Shift | Lari saat jalan kaki |
| E | Masuk / keluar mobil terdekat |
| F | Pukul, atau tembak saat ada peluru |
| P / Esc | Jeda (progres tersimpan) |
| M | Pengingat misi |
| N | Musik nyala / mati |
| Enter / klik | Mulai, lanjut, ulangi |

## Run it

```sh
python3 -m http.server --directory game 8080
```

Lalu buka <http://localhost:8080> di browser desktop. Server file statis
apa saja bisa dipakai (`npx serve game`, misalnya). Game memakai ES module,
jadi harus disajikan lewat HTTP — membuka `index.html` langsung dari file
tidak akan memuat modulnya.

## File

- `game/index.html` — halaman game; `game/src/` — game, dibagi per tugas:
  `config.js` (tuning, cerita, palet), `rng.js` (RNG bersed), `city.js`
  (kota + tabrakan), `input.js`, `audio.js` (suara sintetis), `world.js`
  (simulasi: pemain, mobil, lalu lintas, pejalan kaki, polisi, buronan,
  pertarungan), `missions.js` (mesin 5 misi), `render.js` (gambar + HUD +
  minimap), `shots.js` (adegan screenshot deterministik), `main.js` (loop).
- `main.ts` — menyalin `game/` + `screenshots/` ke `/output` dan menulis
  dossier lewat pustaka make.fun yang disertakan.
- `screenshots/` — 4 render asli dari game (lihat `shots.json` untuk query
  `?shot=…&seed=1` di balik tiap gambar).

## Screenshot deterministik

`?shot=start|drive|chase|mission&seed=1` menata adegan simulasi yang nyata
(jalan kaki di jalan ramai / mengemudi di tengah lalu lintas / kejar-kejaran
polisi bintang 3 / misi curi sedan biru) dan menyetel `window.__shotReady`
saat sudah digambar.

<sub>Entered on [make.fun](https://make.fun/?ref=5f3j6jyb&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
