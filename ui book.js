const kenangan = [
  {
      judul: "Lembah Berkabut",
      gambar: "assets/vintage-fantasy-memory1.jpg", // Ganti Path
      deskripsi: "Ingatkah saat kita memandang lembah yang diselimuti kabut pagi? Ada keajaiban tersendiri di sana, seolah dunia lain baru saja terbangun.",
      alt: "Pemandangan lembah berkabut dengan gaya vintage fantasi"
  },
  {
      judul: "Festival Lentera",
      gambar: "assets/vintage-fantasy-memory2.jpg", // Ganti Path
      deskripsi: "Malam itu, langit dipenuhi cahaya harapan dari lentera-lentera yang terbang, membawa doa-doa dalam keheningan malam.",
      alt: "Suasana festival lentera malam hari"
  },
  {
      judul: "Kedai Teh Tersembunyi",
      gambar: "assets/vintage-fantasy-memory3.jpg", // Ganti Path
      deskripsi: "Menemukan kedai teh tua di ujung jalan setapak, dengan aroma melati yang menenangkan jiwa dan cerita dari masa lalu.",
      alt: "Kedai teh tradisional dengan suasana tenang"
  },
  { // Kenangan ke-4
      judul: "Jembatan Merah",
      gambar: "assets/vintage-fantasy-memory4.jpg", // Ganti Path
      deskripsi: "Berjalan melintasi jembatan merah di atas sungai yang tenang, seakan melangkah ke dimensi lain yang penuh kedamaian.",
      alt: "Jembatan kayu merah tradisional di atas sungai"
  },
  { // Kenangan ke-5
      judul: "Di Bawah Pohon Sakura",
      gambar: "assets/vintage-fantasy-memory5.jpg", // Ganti Path
      deskripsi: "Duduk berdua di bawah pohon sakura yang mekar penuh, kelopaknya berjatuhan seperti salju merah muda yang lembut.",
      alt: "Pemandangan pohon sakura mekar dengan gaya fantasi"
  },
];

// --- Konfigurasi Pesan & Suara ---
const nomorWhatsApp = "6281234567890"; // GANTI NOMOR
const pesanDefaultWhatsApp = "Terima kasih untuk kartu ucapan ajaibnya! Sangat indah. Permohonanku tadi adalah...";
let isMuted = false;
let toneStarted = false;
let backgroundMusic = null; // Variabel untuk menyimpan sequence musik latar

// Inisialisasi Synth & Piano Synth
let synth, pingSound, pianoSynth;
try {
   // Synth untuk efek UI
   synth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.3 } }).toDestination();
   pingSound = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.05, sustain: 0.01, release: 0.1 } }).toDestination();
   pingSound.volume.value = -12; // Lebih pelan
   synth.volume.value = -10;

   // Piano Synth untuk Musik Latar (PolySynth agar bisa main beberapa nada)
   pianoSynth = new Tone.PolySynth(Tone.FMSynth, { // Menggunakan FMSynth untuk suara mirip piano elektrik/kalimba
       harmonicity: 3.01,
       modulationIndex: 14,
       envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 },
       modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.05, release: 0.1 }
   }).toDestination();
   pianoSynth.volume.value = -18; // Volume musik latar sangat pelan

   // Melodi Piano Sederhana (Contoh: Arpeggio Am - C - G - Em)
   const melody = [
       ['A3', 'C4', 'E4'], null, 'C4', null, ['G3', 'B3', 'D4'], null, 'E4', null,
       ['E3', 'G3', 'B3'], null, 'G3', null, ['A3', 'C4', 'E4'], null, ['A3', 'C4', 'E4'], null,
   ];

   backgroundMusic = new Tone.Sequence((time, note) => {
       if (note) {
           pianoSynth.triggerAttackRelease(note, '2n', time); // Mainkan chord/nada
       }
   }, melody, '1n'); // Durasi per langkah sequence (1n = 1 whole note)

   backgroundMusic.loop = true; // Ulangi terus
   Tone.Transport.bpm.value = 70; // Tempo lambat

} catch (error) {
  console.error("Tone.js gagal diinisialisasi:", error);
  synth = pingSound = pianoSynth = backgroundMusic = null;
}

// --- Variabel Global & Elemen DOM (Sama seperti V2) ---
let indexKenanganSaatIni = 0;
let permohonanPengguna = "";
let lilinPadamCount = 0;
const bodyElem = document.body;
const muteButton = document.getElementById('mute-button');
const cakeContainer = document.getElementById('cake-container');
const candles = document.querySelectorAll('.candle');
const flames = document.querySelectorAll('.flame');
const wishPopup = document.getElementById('wish-popup');
const wishText = document.getElementById('wish-text');
const tombolLanjutDariPopup = document.getElementById('tombol-lanjut-dari-popup');
const bukuKenangan = document.getElementById('buku-kenangan');
const hadiahContainer = document.getElementById('hadiah-container');
const tombolLanjut = document.getElementById('tombol-lanjut');
const tombolSebelumnya = document.getElementById('tombol-sebelumnya');
const tombolPutarUlang = document.getElementById('tombol-putar-ulang');
const tombolWhatsApp = document.getElementById('tombol-whatsapp');
const judulKenanganElem = document.getElementById('judul-kenangan');
const gambarKenanganElem = document.getElementById('gambar-kenangan');
const deskripsiKenanganElem = document.getElementById('deskripsi-kenangan');
const videoHadiahElem = document.getElementById('video-hadiah');
const sideGifs = document.querySelectorAll('.side-gif');
const allContentSections = document.querySelectorAll('.content-section');

// --- Fungsi Suara (Update) ---
async function startToneAndMusic() {
  if (!toneStarted && Tone.context.state !== 'running') {
      try {
          await Tone.start();
          console.log('Audio context started!');
          toneStarted = true;
          // Mulai Transport dan musik jika tidak muted
          if (!isMuted && backgroundMusic) {
              Tone.Transport.start();
              backgroundMusic.start(0);
              console.log('Background music started.');
          }
      } catch (e) {
          console.error("Could not start Tone.js context:", e);
      }
  } else if (toneStarted && !isMuted && backgroundMusic && Tone.Transport.state !== 'started') {
       // Jika context sudah jalan tapi musik belum (misal setelah unmute)
       Tone.Transport.start();
       backgroundMusic.start(0);
       console.log('Background music restarted.');
  }
}

function playSound(soundType = 'transition') {
   startToneAndMusic(); // Coba mulai audio & musik saat interaksi
   if (isMuted || !toneStarted) return;
   try {
       // (Logika playSound sama seperti V2)
       if (soundType === 'click' && pingSound) { pingSound.triggerAttackRelease('C5', '8n'); }
       else if (soundType === 'transition' && synth) { synth.triggerAttackRelease('G4', '4n'); }
       else if (soundType === 'popupOpen' && synth) { synth.triggerAttackRelease('E5', '8n'); }
       else if (soundType === 'popupClose' && synth) { synth.triggerAttackRelease('C4', '4n'); }
   } catch (error) { console.error("Error playing sound:", error); }
}

function toggleMute() {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? '🔇' : '🔊';
  muteButton.title = isMuted ? 'Nyalakan Suara' : 'Matikan Suara';
  console.log("Sound Muted:", isMuted);

  if (toneStarted && backgroundMusic) {
      if (isMuted) {
          Tone.Transport.pause(); // Jeda musik
          console.log('Background music paused.');
      } else {
          startToneAndMusic(); // Coba start lagi (akan melanjutkan jika sudah pernah start)
      }
  } else if (!isMuted) {
       startToneAndMusic(); // Coba start jika belum pernah
  }
}

// --- Fungsi Tampilan & Transisi (Sama seperti V2) ---
function setGifsVisible(visible) { /* ... (Sama) ... */
   sideGifs.forEach(gif => { visible ? gif.classList.add('visible') : gif.classList.remove('visible'); });
}
function switchContent(hideElement, showElement) { /* ... (Sama, memanggil playSound) ... */
   playSound('transition');
   if (hideElement) {
       hideElement.classList.add('hidden-transition');
       setTimeout(() => { hideElement.classList.add('hidden'); }, 600);
   }
   if (showElement) {
       showElement.classList.remove('hidden');
       showElement.classList.remove('hidden-transition');
       void showElement.offsetWidth;
       showElement.classList.add('visible-transition');
   }
   setGifsVisible(showElement === bukuKenangan || showElement === hadiahContainer);
   bodyElem.style.alignItems = (showElement === cakeContainer) ? 'center' : 'flex-start';
}

// --- Fungsi Inti Aplikasi (Sama seperti V2, panggil startToneAndMusic di awal) ---
function padamkanApi(event) {
  startToneAndMusic(); // Coba mulai audio & musik saat interaksi pertama
  /* ... (Logika padamkan api & popup sama) ... */
  const candleGroup = event.currentTarget;
  const flame = candleGroup.querySelector('.flame');
  if (flame && !flame.classList.contains('extinguished')) {
      playSound('click');
      flame.classList.add('extinguished');
      lilinPadamCount++;
      if (lilinPadamCount === flames.length) {
          setTimeout(() => { wishPopup.classList.add('show'); playSound('popupOpen'); }, 500);
      }
  }
}
function lanjutKeKenangan() { /* ... (Sama, panggil switchContent) ... */
   playSound('popupClose');
   permohonanPengguna = wishText.value.trim();
   wishPopup.classList.remove('show');
   switchContent(cakeContainer, bukuKenangan);
   tampilkanKenangan(indexKenanganSaatIni);
}
function tampilkanKenangan(index) { /* ... (Sama, logika navigasi) ... */
   if (index < 0 || index >= kenangan.length) return;
   const data = kenangan[index];
   judulKenanganElem.textContent = data.judul;
   gambarKenanganElem.src = data.gambar;
   gambarKenanganElem.alt = data.alt;
   gambarKenanganElem.classList.remove('zoomed');
   deskripsiKenanganElem.textContent = data.deskripsi;
   tombolSebelumnya.classList.toggle('invisible', index === 0);
   tombolLanjut.textContent = (index === kenangan.length - 1) ? "Lihat Kejutan" : "Berikutnya";
   setGifsVisible(true);
}
function toggleZoomGambar() { /* ... (Sama) ... */
   gambarKenanganElem.classList.toggle('zoomed');
}
function tampilkanHadiah() { /* ... (Sama, panggil switchContent, update WA link) ... */
   switchContent(bukuKenangan, hadiahContainer);
   const pesanWA = `${pesanDefaultWhatsApp}\n"${permohonanPengguna || '(Aku tidak menulis permohonan khusus, tapi aku berharap yang terbaik!)'}"`;
   const encodedMessage = encodeURIComponent(pesanWA);
   tombolWhatsApp.href = `https://wa.me/${nomorWhatsApp}?text=${encodedMessage}`;
   videoHadiahElem.pause();
   videoHadiahElem.currentTime = 0;
   setGifsVisible(true);
}
function resetKeAwal() { /* ... (Sama, panggil switchContent, reset state) ... */
   let currentVisibleElement = null;
   if (bukuKenangan.classList.contains('visible-transition')) currentVisibleElement = bukuKenangan;
   else if (hadiahContainer.classList.contains('visible-transition')) currentVisibleElement = hadiahContainer;
   switchContent(currentVisibleElement, cakeContainer);
   flames.forEach(flame => flame.classList.remove('extinguished'));
   lilinPadamCount = 0;
   wishText.value = "";
   permohonanPengguna = "";
   gambarKenanganElem.classList.remove('zoomed');
   indexKenanganSaatIni = 0;
   videoHadiahElem.pause();
   videoHadiahElem.currentTime = 0;
   allContentSections.forEach(section => {
       if (section !== cakeContainer) {
           section.classList.remove('visible-transition');
           if (!section.classList.contains('hidden')) {
                setTimeout(() => section.classList.add('hidden'), 600);
           }
       }
   });
}

// --- Event Listeners (Sama) ---
muteButton.addEventListener('click', toggleMute);
candles.forEach(candle => candle.addEventListener('click', padamkanApi));
tombolLanjutDariPopup.addEventListener('click', lanjutKeKenangan);
tombolLanjut.addEventListener('click', () => {
  if (indexKenanganSaatIni < kenangan.length - 1) {
      indexKenanganSaatIni++;
      tampilkanKenangan(indexKenanganSaatIni);
      playSound('transition');
  } else { tampilkanHadiah(); }
});
tombolSebelumnya.addEventListener('click', () => {
  if (indexKenanganSaatIni > 0) {
      indexKenanganSaatIni--;
      tampilkanKenangan(indexKenanganSaatIni);
      playSound('transition');
  }
});
tombolPutarUlang.addEventListener('click', resetKeAwal);
gambarKenanganElem.addEventListener('click', toggleZoomGambar);

// --- Penanganan Error Media (Sama) ---
gambarKenanganElem.onerror = function() { /* ... (Sama) ... */
  console.error("Gagal memuat gbr kenangan:", this.src); this.src = 'https://placehold.co/600x400/e8e0d0/7a6f63?text=Gbr+Hilang'; this.alt = 'Gagal memuat gbr'; this.style.filter='none'; this.style.boxShadow='none'; this.style.border='none'; this.style.cursor='default'; this.removeEventListener('click', toggleZoomGambar);
};
videoHadiahElem.onerror = function() { /* ... (Sama) ... */
   console.error("Gagal memuat video:", this.currentSrc || this.src); const errorP = document.createElement('p'); errorP.textContent = "Video kejutan tdk dpt dimuat."; errorP.style.color="var(--color-accent-red)"; errorP.style.marginTop="1rem"; if(hadiahContainer && videoHadiahElem.parentNode === hadiahContainer){ hadiahContainer.insertBefore(errorP, videoHadiahElem); } videoHadiahElem.style.display='none';
};

// --- Inisialisasi Awal (Sama) ---
allContentSections.forEach(section => {
  if (section.id !== 'cake-container') { section.classList.add('hidden'); section.classList.remove('visible-transition'); }
  else { section.classList.remove('hidden'); section.classList.add('visible-transition'); }
});
setGifsVisible(false);
bodyElem.style.alignItems = 'center';
console.log("Kartu ucapan v3 siap.");