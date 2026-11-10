/**
 * JM BIRTHDAY - INTERACTIVE JAVASCRIPT ENGINE (RESPECTFUL DOST / AAP EDITION)
 * WITH SUPABASE CLOUD SYNC & VIEW-ONLY (NON-EDITABLE) SHARING FOR BIRTHDAY GIRL!
 * 
 * - When opened with `?view=1` (or in View Mode), all edit buttons, delete buttons,
 *   uploaders, and admin bars are completely HIDDEN.
 * - When Supabase is configured in `supabase-config.js`, all photos, GIF, letter,
 *   and memories sync to the cloud so Render hosting works across any phone/PC!
 */

(function () {
  'use strict';

  // ==========================================
  // 1. SUPABASE CLIENT INITIALIZATION
  // ==========================================
  let supabase = null;
  const isSupabaseConfigured = typeof SUPABASE_CONFIG !== 'undefined' && 
                               SUPABASE_CONFIG.url && 
                               SUPABASE_CONFIG.anonKey &&
                               SUPABASE_CONFIG.url.startsWith('http');

  if (isSupabaseConfigured && typeof window.supabase !== 'undefined') {
    try {
      supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
    }
  }

  function updateSupabaseStatusUI() {
    const indicator = document.getElementById('supabase-status-indicator');
    if (!indicator) return;
    if (supabase) {
      indicator.innerHTML = '<span style="color: #10B981; font-weight: bold;">☁️ Supabase Cloud: Connected &amp; Synced ✅</span>';
    } else {
      indicator.innerHTML = '<span style="color: #F59E0B; font-weight: 600;">💾 Local Mode (Supabase not configured yet - details in supabase-config.js)</span>';
    }
  }

  // Convert DataURL to Blob for Supabase Storage uploads
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // ==========================================
  // 2. VIEW-ONLY (NON-EDITABLE) MODE FOR RECIPIENT
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const isViewOnlyFromUrl = urlParams.get('view') === '1' || urlParams.get('mode') === 'view';

  function initViewMode() {
    const adminBar = document.getElementById('admin-bar');
    const toggleBtn = document.getElementById('btn-toggle-view-mode');
    const copyShareBtn = document.getElementById('btn-copy-share-link');

    if (isViewOnlyFromUrl) {
      document.body.classList.add('view-mode');
      if (adminBar) adminBar.style.display = 'none';
      return;
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('view-mode');
        const isNowView = document.body.classList.contains('view-mode');
        toggleBtn.innerHTML = isNowView ? '<span>✏️</span> Wapas Edit Mode Me Jaiye' : '<span>👁️</span> Birthday Girl View Check Kijiye';
      });
    }

    if (copyShareBtn) {
      copyShareBtn.addEventListener('click', async () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('view', '1');
        const cfg = await getPasscodeConfig();
        const passcodeInfo = cfg.enabled ? `\n\n🔐 Secret Passcode: ${cfg.passcode}\n(Birthday Girl ko link ke saath yeh passcode bhi bhej dijiyega taaki wo surprise unlock kar sakein! 🎀)` : '';
        navigator.clipboard.writeText(shareUrl.toString()).then(() => {
          launchConfettiBurst(50);
          playSparkleSound();
          openModalNotification('Clean Shareable Link Copy Ho Gaya! 🔗💖', 
            `Aapka clean link copy ho chuka hai:\n\n${shareUrl.toString()}${passcodeInfo}\n\nJab Birthday Girl yeh link kholegi, toh unhe koi bhi edit/delete button nahi dikhega—sirf ekdam clean, magical surprise website dikhegi! ✨`);
        }).catch(() => {
          prompt('Bhejne ke liye yeh clean link copy kar lijiye:', shareUrl.toString());
        });
      });
    }
  }

  const DEFAULT_LETTER = {
    salutation: 'Meri Sabse Pyaari Dost / Birthday Girl 🎀,',
    body: `Janamdin bohot bohot mubarak ho! 🎂✨

Aaj ke iss khaas din pe bas aapko dil se yeh yaad dilana tha ki aap mere liye kitni anmol dost aur special person hain.

Waqt kitni jaldi guzar gaya, par aapke saath bitaya hua har ek pal kisi fun storybook ke panno jaisa lagta hai. Wo random plans, coffee , ghanto tak chalne wali baatein, aap meri sabse favorite dost rahi hain.

Thank you hamesha meri baatein dhyan se sunne ke liye, aur din ko itna bright banane ke liye.

Rab kare aapka yeh naya saal dher saari kamiyabi, sukoon, sweet surprises aur wo saari khushiyan lekar aaye jo aap deserve karti hain. Kabhi yeh mat bhooliye ki aap kitni special aur valued dost hain.

Always stay the same graceful & awesome soul you are. Happy Birthday! 💖✨`,
    closing: 'Dher saari wishes ,\nAapka Lifetime Friend 🌸'
  };

  const DEFAULT_TIMELINE = [
    {
      id: 'time_1',
      kissa: 'Kissa 1',
      title: 'Kahan Se Shuru Hui Dosti ✨',
      story: 'Pehli baar jab hum mile the, tab socha nahi tha ki hum itne achhe besties ban jayenge! Ekdum instant connection tha.',
      tag: 'First Hello 💬'
    },
    {
      id: 'time_2',
      kissa: 'Kissa 2',
      title: 'Coffee Hangouts 🧋',
      story: 'Coffee pite huye ghanto tak baatein karna aur dher saari hasi mazak. Golden memories!',
      tag: 'Inside Jokes 😂'
    },
    {
      id: 'time_3',
      kissa: 'Kissa 3',
      title: 'Aaj Ka Din & Lifetime Memories 🎀',
      story: 'Aapke janamdin ka jashn aur aane wale saare future plans aur trips ke liye excited! Yeh dosti hamesha aisi hi bani rahe.',
      tag: 'Birthday Milestone 🫶🏻🎂'
    }
  ];

  const DEFAULT_GIF_URL = 'assets/cute_birthday_bear.svg';
  const DEFAULT_GIF_CAPTION = 'Hey cutiee! 🥳🎂🎉';

  // ==========================================
  // 4. INDEXED DB HELPER (FALLBACK FOR LOCAL)
  // ==========================================
  const DB_NAME = 'JMBirthdaySurpriseDB';
  const DB_VERSION = 1;
  const STORE_PHOTOS = 'photos';

  let dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  async function getStoredPhotosLocal() {
    try {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PHOTOS, 'readonly');
        const store = tx.objectStore(STORE_PHOTOS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }

  async function savePhotoToDBLocal(photoObj) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.put(photoObj);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function deletePhotoFromDBLocal(id) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function clearPhotosDBLocal() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ==========================================
  // 5. SUPABASE CLOUD SYNC FUNCTIONS
  // ==========================================
  async function getPhotos() {
    if (!supabase) {
        console.error('Supabase connection unavailable!');
        return [];
    }

    const { data, error } = await supabase
        .from('birthday_photos')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Supabase photos error:', error);
        return [];
    }

    console.log('Supabase photos loaded:', data);

    return data || [];
}

  async function savePhoto(photo) {
    await savePhotoToDBLocal(photo);
    if (supabase) {
      try {
        // If image is a base64 DataURL, upload it to Supabase Storage bucket
        if (photo.src && photo.src.startsWith('data:image')) {
          const blob = dataURLtoBlob(photo.src);
          const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`;
          const { data: uploadData, error: uploadErr } = await supabase.storage.from(SUPABASE_CONFIG.bucketName).upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });
          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage.from(SUPABASE_CONFIG.bucketName).getPublicUrl(fileName);
            if (publicUrlData && publicUrlData.publicUrl) {
              photo.src = publicUrlData.publicUrl;
            }
          }
        }
        await supabase.from('birthday_photos').upsert({
          id: photo.id,
          src: photo.src,
          caption: photo.caption,
          badge: photo.badge,
          angle: photo.angle || 0,
          likes: photo.likes || 0
        });
      } catch (err) {
        console.warn('Could not sync photo to Supabase:', err);
      }
    }
  }

  async function deletePhoto(id) {
    await deletePhotoFromDBLocal(id);
    if (supabase) {
      try {
        await supabase.from('birthday_photos').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete photo from Supabase:', err);
      }
    }
  }

  // ==========================================
  // 6. LOCAL STORAGE & CLOUD SETTINGS HELPERS
  // ==========================================
  const STORAGE_KEYS = {
    PASSCODE_LOCK: 'jm_bday_passcode_lock',
    HERO_NAME: 'jm_bday_hero_name',
    HERO_WISH: 'jm_bday_hero_wish',
    LETTER: 'jm_bday_letter',
    REASONS: 'jm_bday_reasons',
    TIMELINE: 'jm_bday_timeline',
    WISHES_JAR: 'jm_bday_wishes_jar',
    CUSTOM_AUDIO: 'jm_bday_custom_audio',
    CUSTOM_GIF: 'jm_bday_custom_gif',
    GIF_CAPTION: 'jm_bday_gif_caption',
    INITIALIZED_RESPECT_V4: 'jm_bday_init_respect_v4'
  };


  const DEFAULT_PASSCODE_CONFIG = {
    enabled: true,
    passcode: '1311',
    hint: 'Hint: ni duga ehehehehe🎀'
  };

  async function getPasscodeConfig() {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('birthday_settings')
          .select('value')
          .eq('key', 'passcode_lock')
          .maybeSingle();
        if (data && data.value) return data.value;
      } catch (e) {}
    }
    const stored = localStorage.getItem(STORAGE_KEYS.PASSCODE_LOCK);
    return stored ? JSON.parse(stored) : DEFAULT_PASSCODE_CONFIG;
  }

  async function savePasscodeConfig(cfg) {
    localStorage.setItem(STORAGE_KEYS.PASSCODE_LOCK, JSON.stringify(cfg));
    if (supabase) {
      try {
        await supabase.from('birthday_settings').upsert({ key: 'passcode_lock', value: cfg });
      } catch (e) {}
    }
  }

  async function getLetterData() {
    if (supabase) {
      try {
        const { data } = await supabase.from('birthday_settings').select('value').eq('key', 'letter').single();
        if (data && data.value) return data.value;
      } catch (e) {}
    }
    const stored = localStorage.getItem(STORAGE_KEYS.LETTER);
    return stored ? JSON.parse(stored) : DEFAULT_LETTER;
  }
  async function saveLetterData(data) {
    localStorage.setItem(STORAGE_KEYS.LETTER, JSON.stringify(data));
    if (supabase) {
      try {
        await supabase.from('birthday_settings').upsert({ key: 'letter', value: data });
      } catch (e) {}
    }
  }

  async function getReasonsData() {
    if (!supabase) {
        console.error('Supabase connection unavailable!');
        return [];
    }

    const { data, error } = await supabase
        .from('birthday_settings')
        .select('value')
        .eq('key', 'reasons')
        .maybeSingle();

    if (error) {
        console.error('Reasons fetch error:', error);
        return [];
    }

    return data?.value || [];
}
  async function saveReasonsData(data) {
    localStorage.setItem(STORAGE_KEYS.REASONS, JSON.stringify(data));
    if (supabase) {
      try {
        await supabase.from('birthday_settings').upsert({ key: 'reasons', value: data });
      } catch (e) {}
    }
  }

  async function getTimelineData() {
    if (supabase) {
      try {
        const { data } = await supabase.from('birthday_timeline').select('*').order('created_at', { ascending: true });
        if (data && data.length > 0) return data;
      } catch (e) {}
    }
    const stored = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    return stored ? JSON.parse(stored) : DEFAULT_TIMELINE;
  }
  async function saveTimelineData(data) {
    localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(data));
    if (supabase) {
      try {
        for (const item of data) {
          await supabase.from('birthday_timeline').upsert({
            id: item.id,
            kissa: item.kissa,
            title: item.title,
            story: item.story,
            tag: item.tag
          });
        }
      } catch (e) {}
    }
  }

  async function getGifData() {
    let src = localStorage.getItem(STORAGE_KEYS.CUSTOM_GIF) || DEFAULT_GIF_URL;
    let caption = localStorage.getItem(STORAGE_KEYS.GIF_CAPTION) || DEFAULT_GIF_CAPTION;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('birthday_settings').select('value').eq('key', 'gif_config').single();
        if (!error && data && data.value) {
          if (data.value.src && typeof data.value.src === 'string' && data.value.src.trim() !== '') {
            src = data.value.src;
            localStorage.setItem(STORAGE_KEYS.CUSTOM_GIF, src);
          }
          if (data.value.caption && typeof data.value.caption === 'string' && data.value.caption.trim() !== '') {
            caption = data.value.caption;
            localStorage.setItem(STORAGE_KEYS.GIF_CAPTION, caption);
          }
        }
      } catch (e) {
        console.warn('Error reading gif_config from Supabase:', e);
      }
    }
    return {
      src: src || DEFAULT_GIF_URL,
      caption: caption || DEFAULT_GIF_CAPTION
    };
  }

  async function saveGifData(newSrc, newCaption) {
    // Current data prapt kijiye taaki jo cheez change nahi hui wo gayab na ho
    const current = await getGifData();

    const finalSrc = (newSrc !== null && newSrc !== undefined && typeof newSrc === 'string' && newSrc.trim() !== '') 
                     ? newSrc.trim() 
                     : current.src;

    const finalCaption = (newCaption !== null && newCaption !== undefined && typeof newCaption === 'string' && newCaption.trim() !== '') 
                         ? newCaption.trim() 
                         : current.caption;

    // LocalStorage me save kijiye
    if (finalSrc) localStorage.setItem(STORAGE_KEYS.CUSTOM_GIF, finalSrc);
    if (finalCaption) localStorage.setItem(STORAGE_KEYS.GIF_CAPTION, finalCaption);

    // Supabase me cloud sync kijiye
    if (supabase) {
      try {
        let cloudSrc = finalSrc;
        // Agar naya base64 file upload hua hai, toh storage bucket me upload kijiye
        if (newSrc && typeof newSrc === 'string' && newSrc.startsWith('data:image')) {
          try {
            const blob = dataURLtoBlob(newSrc);
            const isGif = newSrc.includes('image/gif');
            const ext = isGif ? 'gif' : 'png';
            const fileName = `gif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
            const { data: upData, error: upErr } = await supabase.storage.from(SUPABASE_CONFIG.bucketName).upload(fileName, blob, {
              contentType: isGif ? 'image/gif' : 'image/png',
              upsert: true
            });
            if (!upErr && upData) {
              const { data: pubData } = supabase.storage.from(SUPABASE_CONFIG.bucketName).getPublicUrl(fileName);
              if (pubData && pubData.publicUrl) {
                cloudSrc = pubData.publicUrl;
                localStorage.setItem(STORAGE_KEYS.CUSTOM_GIF, cloudSrc);
              }
            }
          } catch (storageErr) {
            console.warn('Supabase storage upload error for GIF, saving direct src:', storageErr);
          }
        }

        await supabase.from('birthday_settings').upsert({
          key: 'gif_config',
          value: { src: cloudSrc, caption: finalCaption }
        });
      } catch (err) {
        console.warn('Could not sync GIF to Supabase:', err);
      }
    }
  }

  async function initSeedsIfNeeded() {
    localStorage.setItem(
        STORAGE_KEYS.INITIALIZED_RESPECT_V4,
        'true'
    );

    console.log('Initialization complete. Using existing data.');
}

  // ==========================================
  // 7. WEB AUDIO MUSIC BOX SYNTHESIZER
  // ==========================================
  let audioCtx = null;
  let isPlayingMusic = false;
  let isMuted = false;
  let musicGainNode = null;
  let musicTimeout = null;
  let currentMelodyNoteIndex = 0;
  let customAudioElement = null;

  const NOTES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50
  };

  const MELODY = [
    ['C5', 0.8], ['C5', 0.8], ['D5', 1.5], ['C5', 1.5], ['F5', 1.5], ['E5', 2.5],
    ['C5', 0.8], ['C5', 0.8], ['D5', 1.5], ['C5', 1.5], ['G5', 1.5], ['F5', 2.5],
    ['C5', 0.8], ['C5', 0.8], ['C6', 1.5], ['A5', 1.5], ['F5', 1.5], ['E5', 1.5], ['D5', 2.0],
    ['B4', 0.8], ['B4', 0.8], ['A5', 1.5], ['F5', 1.5], ['G5', 1.5], ['F5', 3.0],
    ['A5', 1.0], ['C6', 1.0], ['E5', 1.5], ['F5', 2.5],
    ['G5', 1.0], ['B5', 1.0], ['D5', 1.5], ['C5', 3.0]
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChimeNote(freq, time, duration = 1.2) {
    if (!audioCtx || isMuted) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.18, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(musicGainNode || audioCtx.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  function scheduleMelodyLoop() {
    if (!isPlayingMusic) return;
    const ctx = getAudioContext();
    if (!musicGainNode) {
      musicGainNode = ctx.createGain();
      musicGainNode.gain.value = 0.7;
      musicGainNode.connect(ctx.destination);
    }

    const [noteName, beats] = MELODY[currentMelodyNoteIndex];
    const freq = NOTES[noteName] || 440;
    const tempo = 0.55;
    const duration = beats * tempo;

    playChimeNote(freq, ctx.currentTime, Math.max(1.0, duration * 1.4));

    currentMelodyNoteIndex = (currentMelodyNoteIndex + 1) % MELODY.length;
    musicTimeout = setTimeout(scheduleMelodyLoop, duration * 1000);
  }

  function playSparkleSound() {
    try {
      const ctx = getAudioContext();
      const chimeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chimeNotes.forEach((f, idx) => {
        playChimeNote(f, ctx.currentTime + idx * 0.08, 0.9);
      });
    } catch (e) {}
  }

  function startMusic() {
    const customAudioData = localStorage.getItem(STORAGE_KEYS.CUSTOM_AUDIO);
    if (customAudioData) {
      if (!customAudioElement) {
        customAudioElement = new Audio(customAudioData);
        customAudioElement.loop = true;
      }
      customAudioElement.muted = isMuted;
      customAudioElement.play().catch(() => {});
      isPlayingMusic = true;
      updateMusicUI();
      return;
    }

    isPlayingMusic = true;
    getAudioContext();
    scheduleMelodyLoop();
    updateMusicUI();
  }

  function pauseMusic() {
    isPlayingMusic = false;
    if (musicTimeout) clearTimeout(musicTimeout);
    if (customAudioElement) {
      customAudioElement.pause();
    }
    updateMusicUI();
  }

  function toggleMusic() {
    if (isPlayingMusic) {
      pauseMusic();
    } else {
      startMusic();
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (customAudioElement) {
      customAudioElement.muted = isMuted;
    }
    if (musicGainNode && audioCtx) {
      musicGainNode.gain.value = isMuted ? 0 : 0.7;
    }
    updateMusicUI();
  }

  function updateMusicUI() {
    const disc = document.getElementById('music-disc');
    const playBtn = document.getElementById('btn-music-play');
    const muteBtn = document.getElementById('btn-music-mute');
    const soundBars = document.querySelectorAll('.sound-bar');
    const musicStatus = document.getElementById('music-status');

    if (disc) {
      disc.classList.toggle('playing', isPlayingMusic);
    }
    if (playBtn) {
      playBtn.innerHTML = isPlayingMusic ? '⏸️' : '▶️';
      playBtn.title = isPlayingMusic ? 'Music Rokiye' : 'Music Bajaiye';
    }
    if (muteBtn) {
      muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
      muteBtn.title = isMuted ? 'Awaaz Kholiye' : 'Mute Kijiye';
    }
    if (soundBars) {
      soundBars.forEach(b => b.classList.toggle('paused', !isPlayingMusic || isMuted));
    }
    if (musicStatus) {
      musicStatus.innerText = isPlayingMusic ? 'Baji Rahi Hai Dhun...' : 'Ruka Hua Hai';
    }
  }

  // ==========================================
  // 8. CANVAS CONFETTI & FIREWORKS SYSTEM
  // ==========================================
  const confettiCanvas = document.getElementById('sparkle-canvas');
  const fireworksCanvas = document.getElementById('fireworks-canvas');
  let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
  let fireworksCtx = fireworksCanvas ? fireworksCanvas.getContext('2d') : null;

  function resizeCanvases() {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    if (fireworksCanvas) {
      fireworksCanvas.width = window.innerWidth;
      fireworksCanvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  const backgroundParticles = [];
  const PASTEL_COLORS = ['#FFCCD8', '#FFB3C6', '#FB6F92', '#E8D7F1', '#C9A9E8', '#FDE68A', '#FFFDF9'];

  class Particle {
    constructor(x, y, type = 'confetti') {
      this.x = x || Math.random() * window.innerWidth;
      this.y = y || -20;
      this.type = type;
      this.color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
      this.size = Math.random() * 8 + 5;
      this.speedY = Math.random() * 3 + 1.5;
      this.speedX = (Math.random() - 0.5) * 3;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 8;
      this.opacity = 1;
      this.decay = Math.random() * 0.005 + 0.003;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.02) * 0.5;
      this.rotation += this.rotationSpeed;
      this.opacity -= this.decay;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;

      if (this.type === 'heart') {
        const h = this.size;
        ctx.beginPath();
        ctx.moveTo(0, h / 4);
        ctx.bezierCurveTo(0, 0, -h / 2, 0, -h / 2, h / 3);
        ctx.bezierCurveTo(-h / 2, h * 0.7, 0, h, 0, h * 1.2);
        ctx.bezierCurveTo(0, h, h / 2, h * 0.7, h / 2, h / 3);
        ctx.bezierCurveTo(h / 2, 0, 0, 0, 0, h / 4);
        ctx.fill();
      } else if (this.type === 'sparkle') {
        const s = this.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.fill();
      } else {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.7);
      }
      ctx.restore();
    }
  }

  function launchConfettiBurst(count = 80, originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
    for (let i = 0; i < count; i++) {
      const p = new Particle(originX + (Math.random() - 0.5) * 60, originY + (Math.random() - 0.5) * 40);
      p.speedY = (Math.random() - 0.65) * 10;
      p.speedX = (Math.random() - 0.5) * 14;
      p.type = Math.random() > 0.4 ? 'heart' : 'confetti';
      backgroundParticles.push(p);
    }
  }

  function animateParticles() {
    if (confettiCtx) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      for (let i = backgroundParticles.length - 1; i >= 0; i--) {
        const p = backgroundParticles[i];
        p.update();
        p.draw(confettiCtx);
        if (p.opacity <= 0 || p.y > window.innerHeight + 50) {
          backgroundParticles.splice(i, 1);
        }
      }
    }
    requestAnimationFrame(animateParticles);
  }
  requestAnimationFrame(animateParticles);

  const fireworks = [];
  class FireworkParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = 1;
      this.decay = Math.random() * 0.02 + 0.015;
      this.gravity = 0.08;
      this.radius = Math.random() * 3 + 1.5;
    }
    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function launchGrandFireworks() {
    const colors = ['#FF8FAB', '#FB6F92', '#E8D7F1', '#C9A9E8', '#FCD34D', '#FFF'];
    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        const x = Math.random() * (window.innerWidth * 0.7) + window.innerWidth * 0.15;
        const y = Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.15;
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 60; i++) {
          fireworks.push(new FireworkParticle(x, y, color));
        }
        playSparkleSound();
      }, f * 350);
    }
  }

  function animateFireworks() {
    if (fireworksCtx) {
      fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fp = fireworks[i];
        fp.update();
        fp.draw(fireworksCtx);
        if (fp.alpha <= 0) {
          fireworks.splice(i, 1);
        }
      }
    }
    requestAnimationFrame(animateFireworks);
  }
  requestAnimationFrame(animateFireworks);

  let lastTrailTime = 0;
  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrailTime > 65) {
      lastTrailTime = now;
      const p = new Particle(e.clientX, e.clientY, Math.random() > 0.5 ? 'sparkle' : 'heart');
      p.speedY = (Math.random() - 0.5) * 1.5;
      p.speedX = (Math.random() - 0.5) * 1.5;
      p.size = Math.random() * 5 + 4;
      p.decay = 0.035;
      backgroundParticles.push(p);
    }
  });

  // ==========================================
  // 9. WELCOME SCREEN INTERACTION
  // ==========================================
  function setupWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const openBtn = document.getElementById('btn-open-surprise');
    const giftBox = document.getElementById('gift-box-wrapper');

    function openSurprise() {
      if (!welcomeScreen || welcomeScreen.classList.contains('hidden')) return;
      launchConfettiBurst(120, window.innerWidth / 2, window.innerHeight / 2);
      playSparkleSound();
      startMusic();

      welcomeScreen.classList.add('hidden');
      setTimeout(() => {
        welcomeScreen.style.display = 'none';
      }, 900);
    }

    if (openBtn) openBtn.addEventListener('click', openSurprise);
    if (giftBox) giftBox.addEventListener('click', openSurprise);
  }

  // ==========================================
  // 10. BIRTHDAY SECTION & INTERACTIVE CAKE
  // ==========================================
  function setupBirthdayCake() {
    const candles = document.querySelectorAll('.candle');
    const btnBlow = document.getElementById('btn-blow-candles');
    const wishBanner = document.getElementById('wish-made-banner');
    let allBlownOut = false;

    function blowOutCandle(candleEl) {
      if (!candleEl.classList.contains('blown-out')) {
        candleEl.classList.add('blown-out');
        checkCandleStatus();
      }
    }

    function checkCandleStatus() {
      const remaining = document.querySelectorAll('.candle:not(.blown-out)');
      if (remaining.length === 0 && !allBlownOut) {
        allBlownOut = true;
        launchConfettiBurst(100, window.innerWidth / 2, window.innerHeight * 0.45);
        playSparkleSound();
        if (wishBanner) wishBanner.style.display = 'block';
        if (btnBlow) {
          btnBlow.innerHTML = '<span>✨</span> Phirse Candles Jalaiye';
        }
      }
    }

    candles.forEach(candle => {
      candle.addEventListener('click', () => {
        blowOutCandle(candle);
      });
    });

    if (btnBlow) {
      btnBlow.addEventListener('click', () => {
        if (!allBlownOut) {
          candles.forEach(c => c.classList.add('blown-out'));
          checkCandleStatus();
        } else {
          candles.forEach(c => c.classList.remove('blown-out'));
          allBlownOut = false;
          if (wishBanner) wishBanner.style.display = 'none';
          btnBlow.innerHTML = '<span>💨</span> Wish Maangiye Aur Candles Bujhaiye';
          playSparkleSound();
        }
      });
    }

    // Editable Hero Wishes
    const heroWishEl = document.getElementById('hero-wishes-text');
    const editHeroWishBtn = document.getElementById('btn-edit-hero-wish');
    const savedHeroWish = localStorage.getItem(STORAGE_KEYS.HERO_WISH);
    if (savedHeroWish && heroWishEl) {
      heroWishEl.innerText = savedHeroWish;
    }

    if (editHeroWishBtn && heroWishEl) {
      editHeroWishBtn.addEventListener('click', () => {
        openEditSimpleModal('Birthday Wish Message Badliye', heroWishEl.innerText, async (newText) => {
          heroWishEl.innerText = newText;
          localStorage.setItem(STORAGE_KEYS.HERO_WISH, newText);
          if (supabase) {
            try {
              await supabase.from('birthday_settings').upsert({ key: 'hero_wish', value: newText });
            } catch (e) {}
          }
          launchConfettiBurst(30);
        });
      });
    }
  }

  // ==========================================
  // 11. DEDICATED BIRTHDAY GIF SECTION 🧸🎀
  // ==========================================
  async function setupGifSection() {
    const gifImg = document.getElementById('featured-gif-img');
    const gifCaption = document.getElementById('gif-caption-text');
    const changeGifBtn = document.getElementById('btn-change-gif');
    const editGifCaptionBtn = document.getElementById('btn-edit-gif-caption');
    const modalGif = document.getElementById('modal-change-gif');
    const closeGifModal = document.getElementById('btn-close-gif-modal');
    const gifFileInput = document.getElementById('gif-file-input');
    const gifUrlInput = document.getElementById('gif-url-input');
    const modalCaptionInput = document.getElementById('modal-gif-caption-input');
    const saveGifUrlBtn = document.getElementById('btn-save-gif-url');

    async function renderGif() {
      const data = await getGifData();
      if (gifImg && data.src) gifImg.src = data.src;
      if (gifCaption && data.caption) gifCaption.innerText = data.caption;
      if (modalCaptionInput && data.caption) modalCaptionInput.value = data.caption;
    }
    await renderGif();

    if (changeGifBtn && modalGif) {
      changeGifBtn.addEventListener('click', async () => {
        const data = await getGifData();
        if (modalCaptionInput) modalCaptionInput.value = data.caption || '';
        modalGif.classList.add('active');
      });
    }
    if (closeGifModal && modalGif) {
      closeGifModal.addEventListener('click', () => {
        modalGif.classList.remove('active');
      });
    }

    // Upload GIF from Device
    if (gifFileInput) {
      gifFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
          const cap = modalCaptionInput ? modalCaptionInput.value.trim() : null;
          await saveGifData(ev.target.result, cap);
          await renderGif();
          modalGif.classList.remove('active');
          launchConfettiBurst(50);
          playSparkleSound();
        };
        reader.readAsDataURL(file);
      });
    }

    // Set GIF from URL and/or update Caption
    if (saveGifUrlBtn) {
      saveGifUrlBtn.addEventListener('click', async () => {
        const url = gifUrlInput ? gifUrlInput.value.trim() : '';
        const cap = modalCaptionInput ? modalCaptionInput.value.trim() : '';
        if (!url && !cap) {
          alert('Pehle koi GIF URL daliye ya caption likhiye! 🖼️');
          return;
        }
        await saveGifData(url || null, cap || null);
        await renderGif();
        if (gifUrlInput) gifUrlInput.value = '';
        modalGif.classList.remove('active');
        launchConfettiBurst(50);
        playSparkleSound();
      });
    }

    // Edit GIF Caption
    if (editGifCaptionBtn && gifCaption) {
      editGifCaptionBtn.addEventListener('click', async () => {
        const currentData = await getGifData();
        openEditSimpleModal('GIF Ka Caption Badliye', currentData.caption || gifCaption.innerText, async (newCap) => {
          await saveGifData(null, newCap);
          await renderGif();
          launchConfettiBurst(30);
        });
      });
    }
  }

  // ==========================================
  // 12. PHOTO GALLERY (POLAROID WALL & UPLOADER)
  // ==========================================
  let activePhotos = [];

  async function renderGallery() {
    const grid = document.getElementById('polaroids-grid');
    if (!grid) return;

    activePhotos = await getPhotos();
    grid.innerHTML = '';

    if (activePhotos.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty" style="grid-column: 1 / -1;">
          <p style="font-family: var(--font-handwriting); font-size: 1.8rem; color: var(--color-pink-deep); margin-bottom: 10px;">Abhi koi photos nahi hain! 📸</p>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 16px;">Neeche diye button pe click karke apni favorite yaadein add kijiye.</p>
          <button class="btn-upload-photos" onclick="document.getElementById('btn-open-upload-modal').click()">➕ Photos Add Kijiye</button>
        </div>
      `;
      return;
    }

    activePhotos.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'polaroid-card';
      const angle = photo.angle || ((idx % 2 === 0 ? -1 : 1) * (1.5 + (idx % 3) * 0.7));
      card.style.transform = `rotate(${angle}deg)`;

      const tapeClass = idx % 3 === 0 ? 'tape-left' : (idx % 3 === 1 ? 'tape-right' : '');

      card.innerHTML = `
        <div class="polaroid-tape ${tapeClass}"></div>
        <div class="polaroid-img-wrapper" data-photo-id="${photo.id}">
          <img src="${photo.src}" alt="${photo.caption || 'Memory'}" class="polaroid-img" loading="lazy">
        </div>
        <div class="polaroid-content">
          <p class="polaroid-caption" data-photo-id="${photo.id}">${photo.caption || 'Pyaara sa moment ✨'}</p>
          <div class="polaroid-meta">
            <span class="polaroid-badge-tag btn-edit-badge" data-id="${photo.id}" title="Tag badalne ke liye click kijiye (Crime Partner, Bestie etc.)">${photo.badge || 'Dosti Moment 🌸'} <span class="badge-edit-icon" style="font-size: 0.68rem; opacity: 0.75;">✏️</span></span>
            <div class="polaroid-actions">
              <button class="btn-like-heart" data-id="${photo.id}" title="Yeh photo pasand aayi">
                ${(photo.likes && photo.likes > 0) ? '💖' : '🤍'} <span class="like-count" style="font-size: 0.75rem;">${photo.likes || 0}</span>
              </button>
              <button class="btn-card-mini btn-edit-caption" data-id="${photo.id}" title="Caption Badliye">✏️</button>
              <button class="btn-card-mini btn-replace-photo" data-id="${photo.id}" title="Photo Replace Kijiye">🔄</button>
              <button class="btn-card-mini btn-delete" data-id="${photo.id}" title="Delete Kijiye">🗑️</button>
            </div>
          </div>
        </div>
      `;

      // Lightbox click
      const imgWrapper = card.querySelector('.polaroid-img-wrapper');
      imgWrapper.addEventListener('click', () => {
        openLightbox(photo.src, photo.caption);
      });

      // Like button
      const likeBtn = card.querySelector('.btn-like-heart');
      likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        photo.likes = (photo.likes || 0) + 1;
        await savePhoto(photo);
        likeBtn.innerHTML = `💖 <span class="like-count" style="font-size: 0.75rem;">${photo.likes}</span>`;
        likeBtn.classList.add('liked');
        launchConfettiBurst(15, e.clientX, e.clientY);
        setTimeout(() => likeBtn.classList.remove('liked'), 400);
      });

      // Edit Tag by clicking badge directly
      const badgeTag = card.querySelector('.polaroid-badge-tag');
      if (badgeTag) {
        badgeTag.addEventListener('click', (e) => {
          e.stopPropagation();
          if (document.body.classList.contains('view-mode')) return;
          openEditPhotoModal(photo, 'tag');
        });
      }

      // Edit caption & tag via pencil button
      const editCapBtn = card.querySelector('.btn-edit-caption');
      if (editCapBtn) {
        editCapBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditPhotoModal(photo, 'caption');
        });
      }

      // Replace photo
      const replaceBtn = card.querySelector('.btn-replace-photo');
      replaceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        replaceSinglePhoto(photo.id);
      });

      // Delete photo
      const delBtn = card.querySelector('.btn-delete');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Kya sach me yeh polaroid memory delete karni hai? 🗑️')) {
          await deletePhoto(photo.id);
          await renderGallery();
          launchConfettiBurst(20);
        }
      });

      grid.appendChild(card);
    });
  }

  function resizeImageFile(file, maxWidth = 1400, maxHeight = 1400, quality = 0.88) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function setupGalleryModal() {
    const uploadModal = document.getElementById('modal-upload-photos');
    const openUploadBtn = document.getElementById('btn-open-upload-modal');
    const closeUploadBtn = document.getElementById('btn-close-upload-modal');
    const fileInput = document.getElementById('gallery-file-input');
    const dropzone = document.getElementById('upload-dropzone');
    const previewsContainer = document.getElementById('upload-previews-list');
    const savePhotosBtn = document.getElementById('btn-save-uploaded-photos');
    const shuffleBtn = document.getElementById('btn-shuffle-photos');

    let pendingFilesData = [];

    function openModal() {
      pendingFilesData = [];
      previewsContainer.innerHTML = '';
      uploadModal.classList.add('active');
    }
    function closeModal() {
      uploadModal.classList.remove('active');
    }

    if (openUploadBtn) openUploadBtn.addEventListener('click', openModal);
    if (closeUploadBtn) closeUploadBtn.addEventListener('click', closeModal);

    if (dropzone) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleIncomingFiles(e.dataTransfer.files);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleIncomingFiles(e.target.files);
        }
      });
    }

    async function handleIncomingFiles(fileList) {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.match('image.*')) continue;

        try {
          const resizedDataUrl = await resizeImageFile(file);
          const item = {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            src: resizedDataUrl,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' ✨',
            badge: 'Bestie Yaadein 💖',
            angle: (Math.random() - 0.5) * 5,
            likes: 0
          };
          pendingFilesData.push(item);
          renderUploadPreviews();
        } catch (err) {
          console.error('Error resizing file', err);
        }
      }
    }

    function renderUploadPreviews() {
      previewsContainer.innerHTML = '';
      pendingFilesData.forEach((item, idx) => {
        const previewEl = document.createElement('div');
        previewEl.className = 'upload-preview-item';
        previewEl.innerHTML = `
          <button class="btn-remove-preview" title="Hatai">✕</button>
          <img src="${item.src}" class="upload-preview-img" alt="Preview">
          <input type="text" class="upload-badge-input" value="${item.badge || 'Bestie Yaadein 💖'}" placeholder="Tag: e.g. Crime Partner 🎀">
          <input type="text" class="upload-caption-input" value="${item.caption}" placeholder="Pyaara caption likhiye...">
        `;

        const badgeInput = previewEl.querySelector('.upload-badge-input');
        if (badgeInput) {
          badgeInput.addEventListener('input', (e) => {
            item.badge = e.target.value;
          });
        }

        const capInput = previewEl.querySelector('.upload-caption-input');
        capInput.addEventListener('input', (e) => {
          item.caption = e.target.value;
        });

        const removeBtn = previewEl.querySelector('.btn-remove-preview');
        removeBtn.addEventListener('click', () => {
          pendingFilesData.splice(idx, 1);
          renderUploadPreviews();
        });

        previewsContainer.appendChild(previewEl);
      });
    }

    if (savePhotosBtn) {
      savePhotosBtn.addEventListener('click', async () => {
        if (pendingFilesData.length === 0) {
          alert('Pehle kam se kam ek photo toh select kijiye! 📸');
          return;
        }

        savePhotosBtn.disabled = true;
        savePhotosBtn.innerText = 'Save ho raha hai... ✨';

        for (const photo of pendingFilesData) {
          await savePhoto(photo);
        }

        savePhotosBtn.disabled = false;
        savePhotosBtn.innerText = 'Gallery Me Save Kijiye 💖';
        closeModal();
        await renderGallery();
        launchConfettiBurst(80);
      });
    }

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', async () => {
        const photos = await getPhotos();
        photos.sort(() => Math.random() - 0.5);
        for (const p of photos) {
          p.angle = (Math.random() - 0.5) * 6;
          await savePhoto(p);
        }
        await renderGallery();
        playSparkleSound();
      });
    }
  }

  function replaceSinglePhoto(photoId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/jpg, image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const resized = await resizeImageFile(file);
        const photos = await getPhotos();
        const target = photos.find(p => p.id === photoId);
        if (target) {
          target.src = resized;
          await savePhoto(target);
          await renderGallery();
          launchConfettiBurst(40);
        }
      } catch (err) {
        console.error('Error replacing photo', err);
      }
    };
    input.click();
  }

  // ==========================================
  // 13. REASONS WHY YOU ARE SPECIAL (6 RESPECTFUL REASONS)
  // ==========================================
  async function renderReasons() {
    const container = document.getElementById('reasons-grid');
    if (!container) return;

    const reasons = await getReasonsData();
    container.innerHTML = '';

    // Sort reasons by number so changing the number reorders them properly!
    reasons.sort((a, b) => {
      const numA = parseInt(a.num, 10) || 0;
      const numB = parseInt(b.num, 10) || 0;
      return numA - numB;
    });

    reasons.forEach(item => {
      const card = document.createElement('div');
      card.className = 'reason-card';
      card.innerHTML = `
        <div class="reason-card-top">
          <span class="reason-badge">Reason #${item.num}</span>
          <span class="reason-emoji">${item.emoji}</span>
        </div>
        <h3 class="reason-title">${item.title}</h3>
        <p class="reason-desc">${item.desc}</p>
        <div class="reason-footer">
          <button class="btn-card-mini btn-edit-reason" data-id="${item.id}" title="Yeh reason edit kijiye">✏️</button>
          <button class="btn-card-mini btn-delete btn-delete-reason" data-id="${item.id}" title="Yeh reason delete kijiye">🗑️</button>
        </div>
      `;

      const editBtn = card.querySelector('.btn-edit-reason');
      editBtn.addEventListener('click', () => {
        openEditReasonModal(item);
      });

      const delBtn = card.querySelector('.btn-delete-reason');
      delBtn.addEventListener('click', async () => {
        if (confirm('Kya sach me yeh reason delete karna hai? 🗑️')) {
          const reasons = await getReasonsData();
          const filtered = reasons.filter(r => r.id !== item.id);
          await saveReasonsData(filtered);
          await renderReasons();
          launchConfettiBurst(20);
        }
      });

      container.appendChild(card);
    });
  }

  function setupReasonsEditor() {
    const addBtn = document.getElementById('btn-add-reason');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const reasons = await getReasonsData();
        const nextNum = reasons.length + 1;
        openEditReasonModal({ num: String(nextNum), emoji: '💖', title: '', desc: '' }, true);
      });
    }


  }

  function openEditReasonModal(reasonItem, isNew = false) {
    const modal = document.getElementById('modal-edit-reason');
    if (!modal) return;

    const numInput   = document.getElementById('edit-reason-num');
    const titleInput = document.getElementById('edit-reason-title');
    const emojiInput = document.getElementById('edit-reason-emoji');
    const descInput  = document.getElementById('edit-reason-desc');
    const saveBtn    = document.getElementById('btn-save-reason');
    const closeBtn   = document.getElementById('btn-close-reason-modal');
    const modalTitle = modal.querySelector('.modal-title');

    if (modalTitle) {
      modalTitle.textContent = isNew ? 'Naya Reason Jodein ✨' : 'Reason Edit Kijiye 💖';
    }

    if (isNew || !reasonItem) {
      numInput.value   = (reasonItem && reasonItem.num) ? reasonItem.num : '';
      titleInput.value = '';
      emojiInput.value = '💖';
      descInput.value  = '';
    } else {
      numInput.value   = reasonItem.num !== undefined ? reasonItem.num : '';
      titleInput.value = reasonItem.title || '';
      emojiInput.value = reasonItem.emoji || '✨';
      descInput.value  = reasonItem.desc  || '';
    }

    modal.classList.add('active');

    function cleanup() {
      modal.classList.remove('active');
      saveBtn.onclick = null;
      closeBtn.onclick = null;
      modal.onclick = null;
    }

    closeBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    saveBtn.onclick = async () => {
      const reasons = await getReasonsData();
      const rawNum = numInput.value.trim();
      const numVal = rawNum || (reasonItem ? reasonItem.num : String(reasons.length + 1));
      const emojiVal = emojiInput.value.trim() || '✨';
      const titleVal = titleInput.value.trim() || 'Khaas Baat';
      const descVal  = descInput.value.trim() || 'Aap sach me bohot pyaari aur anmol dost hain!';

      if (isNew || !reasonItem || !reasonItem.id) {
        const newReason = {
          id: 'reason_' + Date.now(),
          num: numVal,
          emoji: emojiVal,
          title: titleVal,
          desc: descVal
        };
        reasons.push(newReason);
      } else {
        reasonItem.num   = numVal;
        reasonItem.emoji = emojiVal;
        reasonItem.title = titleVal;
        reasonItem.desc  = descVal;

        const idx = reasons.findIndex(r => r.id === reasonItem.id);
        if (idx !== -1) {
          reasons[idx] = reasonItem;
        }
      }

      // Automatically sort reasons by number
      reasons.sort((a, b) => {
        const numA = parseInt(a.num, 10) || 0;
        const numB = parseInt(b.num, 10) || 0;
        return numA - numB;
      });

      await saveReasonsData(reasons);
      await renderReasons();
      launchConfettiBurst(30);
      cleanup();
    };
  }

  // ==========================================
  // 14. SPECIAL LETTER 💌
  // ==========================================
  async function setupLetterSection() {
    const envelope = document.getElementById('envelope-box');
    const letterSheet = document.getElementById('opened-letter-sheet');
    const salutationEl = document.getElementById('letter-salutation');
    const bodyEl = document.getElementById('letter-body');
    const closingEl = document.getElementById('letter-closing');
    const editLetterBtn = document.getElementById('btn-edit-letter');

    async function renderLetterText() {
      const data = await getLetterData();
      if (salutationEl) salutationEl.innerText = data.salutation;
      if (bodyEl) bodyEl.innerText = data.body;
      if (closingEl) closingEl.innerText = data.closing;
    }
    await renderLetterText();

    if (envelope) {
      envelope.addEventListener('click', () => {
        letterSheet.classList.toggle('active');
        if (letterSheet.classList.contains('active')) {
          launchConfettiBurst(60, window.innerWidth / 2, envelope.getBoundingClientRect().top);
          playSparkleSound();
          letterSheet.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    if (editLetterBtn) {
      editLetterBtn.addEventListener('click', () => {
        openEditLetterModal();
      });
    }
  }

  async function openEditLetterModal() {
    const modal = document.getElementById('modal-edit-letter');
    if (!modal) return;

    const data = await getLetterData();
    const salutationInput = document.getElementById('edit-letter-salutation');
    const bodyInput = document.getElementById('edit-letter-body');
    const closingInput = document.getElementById('edit-letter-closing');
    const saveBtn = document.getElementById('btn-save-letter');
    const closeBtn = document.getElementById('btn-close-letter-modal');

    salutationInput.value = data.salutation;
    bodyInput.value = data.body;
    closingInput.value = data.closing;

    modal.classList.add('active');

    async function saveHandler() {
      const updated = {
        salutation: salutationInput.value.trim() || data.salutation,
        body: bodyInput.value.trim() || data.body,
        closing: closingInput.value.trim() || data.closing
      };
      await saveLetterData(updated);

      document.getElementById('letter-salutation').innerText = updated.salutation;
      document.getElementById('letter-body').innerText = updated.body;
      document.getElementById('letter-closing').innerText = updated.closing;

      launchConfettiBurst(40);
      cleanup();
    }

    function cleanup() {
      modal.classList.remove('active');
      saveBtn.removeEventListener('click', saveHandler);
      closeBtn.removeEventListener('click', cleanup);
    }

    saveBtn.addEventListener('click', saveHandler);
    closeBtn.addEventListener('click', cleanup);
  }

  // ==========================================
  // 15. OUR MEMORIES & FRIENDSHIP TIMELINE
  // ==========================================
  async function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    const items = await getTimelineData();
    container.innerHTML = '';

    items.forEach((item, idx) => {
      const isLeft = idx % 2 === 0;
      const el = document.createElement('div');
      el.className = `timeline-item ${isLeft ? 'left' : 'right'}`;
      el.innerHTML = `
        <div class="timeline-dot">💖</div>
        <div class="timeline-card">
          <span class="timeline-date">${item.kissa || 'Kissa ' + (idx + 1)}</span>
          ${item.tag ? `<span class="timeline-tag">${item.tag}</span>` : ''}
          <h4 class="timeline-title">${item.title}</h4>
          <p class="timeline-story">${item.story}</p>
          <div class="timeline-item-actions">
            <button class="btn-card-mini btn-edit-timeline" data-id="${item.id}" title="Edit Kissa">✏️</button>
            <button class="btn-card-mini btn-delete-timeline btn-delete" data-id="${item.id}" title="Delete Kissa">🗑️</button>
          </div>
        </div>
      `;

      const editBtn = el.querySelector('.btn-edit-timeline');
      editBtn.addEventListener('click', () => {
        openEditTimelineModal(item);
      });

      const delBtn = el.querySelector('.btn-delete-timeline');
      delBtn.addEventListener('click', async () => {
        if (confirm('Kya sach me iss dosti ke chapter ko delete karna hai? 📖')) {
          const all = (await getTimelineData()).filter(m => m.id !== item.id);
          await saveTimelineData(all);
          if (supabase) {
            try {
              await supabase.from('birthday_timeline').delete().eq('id', item.id);
            } catch (e) {}
          }
          await renderTimeline();
        }
      });

      container.appendChild(el);
    });
  }

  function setupTimelineActions() {
    const addBtn = document.getElementById('btn-add-memory');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openEditTimelineModal(null);
      });
    }
  }

  function openEditTimelineModal(existingItem) {
    const modal = document.getElementById('modal-edit-memory');
    if (!modal) return;

    const kissaInput = document.getElementById('edit-memory-date');
    const tagInput = document.getElementById('edit-memory-tag');
    const titleInput = document.getElementById('edit-memory-title');
    const storyInput = document.getElementById('edit-memory-story');
    const saveBtn = document.getElementById('btn-save-memory');
    const closeBtn = document.getElementById('btn-close-memory-modal');

    if (existingItem) {
      kissaInput.value = existingItem.kissa || 'Kissa 1';
      tagInput.value = existingItem.tag || '';
      titleInput.value = existingItem.title;
      storyInput.value = existingItem.story;
    } else {
      kissaInput.value = 'Kissa ' + 5;
      tagInput.value = 'Special Moment ✨';
      titleInput.value = '';
      storyInput.value = '';
    }

    modal.classList.add('active');

    async function saveHandler() {
      const list = await getTimelineData();
      if (existingItem) {
        existingItem.kissa = kissaInput.value.trim() || existingItem.kissa;
        existingItem.tag = tagInput.value.trim() || '';
        existingItem.title = titleInput.value.trim() || existingItem.title;
        existingItem.story = storyInput.value.trim() || existingItem.story;
        const idx = list.findIndex(m => m.id === existingItem.id);
        if (idx !== -1) list[idx] = existingItem;
      } else {
        list.push({
          id: 'time_' + Date.now(),
          kissa: kissaInput.value.trim() || 'Naya Kissa',
          tag: tagInput.value.trim() || 'Sweet Memory',
          title: titleInput.value.trim() || 'Ek Pyaara Sa Din',
          story: storyInput.value.trim() || 'Hamesha yaad rehne wala dosti ka pal.'
        });
      }

      await saveTimelineData(list);
      await renderTimeline();
      launchConfettiBurst(35);
      cleanup();
    }

    function cleanup() {
      modal.classList.remove('active');
      saveBtn.removeEventListener('click', saveHandler);
      closeBtn.removeEventListener('click', cleanup);
    }

    saveBtn.addEventListener('click', saveHandler);
    closeBtn.addEventListener('click', cleanup);
  }

  // ==========================================
  // 16. FINAL CELEBRATION, VIRTUAL HUG & WISH JAR
  // ==========================================
  function setupFinalSection() {
    const btnFireworks = document.getElementById('btn-launch-fireworks');
    const btnHug = document.getElementById('btn-virtual-hug');
    const btnSaveWish = document.getElementById('btn-save-wish');
    const wishInput = document.getElementById('wish-jar-input');

    if (btnFireworks) {
      btnFireworks.addEventListener('click', () => {
        launchGrandFireworks();
        launchConfettiBurst(150);
      });
    }

    if (btnHug) {
      btnHug.addEventListener('click', () => {
        launchConfettiBurst(90, window.innerWidth / 2, window.innerHeight / 2);
        playSparkleSound();
        openModalNotification('Virtual Warm Hug 🤗💖', 'Aapke liye ek bohot bada, warmest aur coziest dost wala hug! Aap hamesha aisi hi khush rahein, muskurati rahein aur dosti me chamakti rahein. Cheers to our wonderful friendship!');
      });
    }

    if (btnSaveWish && wishInput) {
    btnSaveWish.addEventListener('click', async () => {

        const text = wishInput.value.trim();

        if (!text) {
            alert('Pehle apni secret wish jar me likhiye! 🔮✨');
            return;
        }

        if (!supabase) {
            alert('Supabase connection nahi hai!');
            return;
        }

        btnSaveWish.disabled = true;

        try {
            const { error } = await supabase
                .from('birthday_wishes')
                .insert({
                    id: 'wish_' + Date.now(),
                    wish: text
                });

            if (error) throw error;

            wishInput.value = '';

            launchConfettiBurst(60);
            playSparkleSound();

            openModalNotification(
                'Wish Magic Jar Me Seal Ho Gayi! 🌟🔮',
                `"${text}"\n\nAapki secret wish sitaron ke paas safe ho chuki hai. Rab kare yeh jaldi se sach ho jaye! ✨`
            );

        } catch (error) {
            console.error('Wish save error:', error);
            alert('Wish save nahi hui. Please dobara try karein!');
        } finally {
            btnSaveWish.disabled = false;
        }
    });
}
  }

  // ==========================================
  // 17. MUSIC CONTROLLER UI & CUSTOM SONG UPLOAD
  // ==========================================
  function setupMusicPlayer() {
    const playBtn = document.getElementById('btn-music-play');
    const muteBtn = document.getElementById('btn-music-mute');
    const changeBtn = document.getElementById('btn-music-change');
    const audioInput = document.getElementById('custom-audio-input');

    if (playBtn) playBtn.addEventListener('click', toggleMusic);
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    if (changeBtn && audioInput) {
      changeBtn.addEventListener('click', () => audioInput.click());
      audioInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_AUDIO, ev.target.result);
            if (customAudioElement) {
              customAudioElement.pause();
              customAudioElement = null;
            }
            const titleEl = document.getElementById('music-title');
            if (titleEl) titleEl.innerText = file.name.substring(0, 16) + '...';
            startMusic();
            launchConfettiBurst(30);
          } catch (err) {
            alert('File browser storage ke liye thodi badi hai, par iss session me play ho jayegi! 🎶');
            if (customAudioElement) customAudioElement.pause();
            customAudioElement = new Audio(ev.target.result);
            customAudioElement.loop = true;
            customAudioElement.play();
            isPlayingMusic = true;
            updateMusicUI();
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // ==========================================
  // 18. SIMPLE MODALS (LIGHTBOX, NOTIFICATION, EDIT STRING)
  // ==========================================
  function openLightbox(src, caption) {
    const modal = document.getElementById('modal-lightbox');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('btn-close-lightbox');

    if (!modal) return;
    img.src = src;
    cap.innerText = caption || '';
    modal.classList.add('active');

    function close() {
      modal.classList.remove('active');
      closeBtn.removeEventListener('click', close);
      modal.removeEventListener('click', modalClick);
    }
    function modalClick(e) {
      if (e.target === modal) close();
    }

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', modalClick);
  }


  function openEditPhotoModal(photo, focusField = 'tag') {
    const modal = document.getElementById('modal-edit-photo');
    if (!modal) return;

    const tagInput = document.getElementById('edit-photo-tag');
    const capInput = document.getElementById('edit-photo-caption');
    const saveBtn = document.getElementById('btn-save-photo-details');
    const closeBtn = document.getElementById('btn-close-photo-modal');

    tagInput.value = photo.badge || 'Bestie Masti ✨';
    capInput.value = photo.caption || '';

    modal.classList.add('active');

    if (focusField === 'caption') {
      setTimeout(() => capInput.focus(), 80);
    } else {
      setTimeout(() => tagInput.focus(), 80);
    }

    // Connect suggestion chips
    const chips = modal.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
      chip.onclick = () => {
        tagInput.value = chip.getAttribute('data-tag');
        tagInput.focus();
      };
    });

    function cleanup() {
      modal.classList.remove('active');
      saveBtn.onclick = null;
      closeBtn.onclick = null;
      modal.onclick = null;
    }

    closeBtn.onclick = cleanup;
    modal.onclick = (e) => {
      if (e.target === modal) cleanup();
    };

    saveBtn.onclick = async () => {
      photo.badge = tagInput.value.trim() || 'Bestie Masti ✨';
      photo.caption = capInput.value.trim() || 'Pyaara moment ✨';
      await savePhoto(photo);
      await renderGallery();
      launchConfettiBurst(25);
      cleanup();
    };
  }

  function openEditSimpleModal(title, currentValue, onSave) {
    const modal = document.getElementById('modal-edit-simple');
    if (!modal) return;

    const titleEl = document.getElementById('edit-simple-title');
    const input = document.getElementById('edit-simple-input');
    const saveBtn = document.getElementById('btn-save-simple');
    const closeBtn = document.getElementById('btn-close-simple-modal');

    titleEl.innerText = title;
    input.value = currentValue;
    modal.classList.add('active');

    function saveHandler() {
      const val = input.value.trim();
      if (val) onSave(val);
      cleanup();
    }
    function cleanup() {
      modal.classList.remove('active');
      saveBtn.removeEventListener('click', saveHandler);
      closeBtn.removeEventListener('click', cleanup);
    }

    saveBtn.addEventListener('click', saveHandler);
    closeBtn.addEventListener('click', cleanup);
  }

  function openModalNotification(title, message) {
    const modal = document.getElementById('modal-notification');
    if (!modal) return;

    const titleEl = document.getElementById('notif-title');
    const msgEl = document.getElementById('notif-msg');
    const closeBtn = document.getElementById('btn-close-notif');

    titleEl.innerText = title;
    msgEl.innerText = message;
    modal.classList.add('active');

    function close() {
      modal.classList.remove('active');
      closeBtn.removeEventListener('click', close);
    }
    closeBtn.addEventListener('click', close);
  }

  // ==========================================
  // 19. RESET WEBSITE TO DEFAULT
  // ==========================================
  function setupResetButton() {
    const resetBtn = document.getElementById('btn-reset-website');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Kya sach me website ko default respectful bestie template pe reset karna hai? Isse saari original photos aur text restore ho jayenge. 🌸')) {
          localStorage.clear();
          await saveLetterData(DEFAULT_LETTER);
          await saveTimelineData(DEFAULT_TIMELINE);
          await saveGifData(DEFAULT_GIF_URL, DEFAULT_GIF_CAPTION);
          localStorage.setItem(STORAGE_KEYS.HERO_WISH, "Aapko janamdin ki dher saari mubarakbaad aur badhaiyan! Rab kare aapka yeh saal bohot saari khushiyan, sukoon, hasi, aur success lekar aaye. Aap hamesha aise hi muskurate rahein aur jo bhi aap chahein wo sab aapko mile! 💖");
          localStorage.setItem(STORAGE_KEYS.INITIALIZED_RESPECT_V4, 'true');
          window.location.reload();
        }
      });
    }
  }

  function setupMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('show');
      });
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('show'));
      });
    }
  }


  // ==========================================
  // PASSCODE LOCK & SURPRISE VAULT SYSTEM
  // ==========================================
  async function setupPasscodeLockSystem() {
    const lockScreen = document.getElementById('passcode-lock-screen');
    const passcodeCard = document.getElementById('passcode-card-el');
    const passcodeInput = document.getElementById('input-secret-passcode');
    const toggleEyeBtn = document.getElementById('btn-toggle-passcode-visibility');
    const unlockBtn = document.getElementById('btn-unlock-surprise');
    const unlockForm = document.getElementById('form-passcode-unlock');
    const hintBox = document.getElementById('passcode-hint-box');
    const hintText = document.getElementById('passcode-hint-text');
    const errorMsg = document.getElementById('passcode-error-msg');
    const lockEmoji = document.getElementById('lock-icon-emoji');
    const lockCircle = document.getElementById('lock-icon-circle');

    // Admin Controls
    const btnSetupPasscode = document.getElementById('btn-setup-passcode');
    const adminPill = document.getElementById('admin-passcode-status-pill');
    const modalSetup = document.getElementById('modal-setup-passcode');
    const btnCloseModal = document.getElementById('btn-close-passcode-modal');
    const toggleEnabled = document.getElementById('toggle-passcode-enabled');
    const adminPassInput = document.getElementById('admin-passcode-input');
    const adminHintInput = document.getElementById('admin-passcode-hint');
    const btnSavePass = document.getElementById('btn-save-passcode-settings');
    const btnTestLock = document.getElementById('btn-test-lock-screen');

    let currentConfig = await getPasscodeConfig();

    function updateAdminUI(cfg) {
      if (adminPill) {
        if (cfg.enabled) {
          adminPill.textContent = cfg.passcode || '1311';
          adminPill.style.color = 'var(--color-pink-deep)';
        } else {
          adminPill.textContent = 'Off';
          adminPill.style.color = '#94A3B8';
        }
      }
    }

    updateAdminUI(currentConfig);

    // Check if session is already unlocked
    const isSessionUnlocked = sessionStorage.getItem('jm_bday_unlocked') === 'true';

    if (!currentConfig.enabled || isSessionUnlocked) {
      if (lockScreen) lockScreen.style.display = 'none';
    } else {
      if (lockScreen) {
        lockScreen.style.display = 'flex';
        if (currentConfig.hint && currentConfig.hint.trim()) {
          hintText.textContent = currentConfig.hint.trim();
          hintBox.style.display = 'flex';
        } else {
          hintBox.style.display = 'none';
        }
        setTimeout(() => { if (passcodeInput) passcodeInput.focus(); }, 150);
      }
    }

    // Toggle Eye (Password Visibility)
    if (toggleEyeBtn && passcodeInput) {
      toggleEyeBtn.addEventListener('click', () => {
        if (passcodeInput.type === 'password') {
          passcodeInput.type = 'text';
          toggleEyeBtn.textContent = '🙈';
        } else {
          passcodeInput.type = 'password';
          toggleEyeBtn.textContent = '👁️';
        }
        passcodeInput.focus();
      });
    }

    // Handle Unlock
    async function attemptUnlock() {
      if (!passcodeInput) return;
      const entered = passcodeInput.value.trim();
      currentConfig = await getPasscodeConfig();
      const expected = (currentConfig.passcode || '1311').toString().trim();

      if (!currentConfig.enabled || entered.toLowerCase() === expected.toLowerCase()) {
        // SUCCESS UNLOCK!
        if (errorMsg) errorMsg.style.display = 'none';
        passcodeInput.classList.remove('input-error');
        if (lockEmoji) lockEmoji.textContent = '🔓';
        if (lockCircle) lockCircle.classList.add('unlocked-glow');
        if (unlockBtn) {
          unlockBtn.innerHTML = '<span>Unlocked! Khul Gaya 💖</span>';
          unlockBtn.style.background = '#10B981';
        }

        launchConfettiBurst(80, window.innerWidth / 2, window.innerHeight / 2);
        playSparkleSound();
        sessionStorage.setItem('jm_bday_unlocked', 'true');

        setTimeout(() => {
          if (lockScreen) {
            lockScreen.classList.add('fade-out');
            setTimeout(() => {
              lockScreen.style.display = 'none';
              lockScreen.classList.remove('fade-out');
              if (unlockBtn) {
                unlockBtn.innerHTML = '<span>Surprise Unlock Kijiye</span> <span class="unlock-btn-icon">💖</span>';
                unlockBtn.style.background = '';
              }
              if (lockEmoji) lockEmoji.textContent = '🔒';
              if (lockCircle) lockCircle.classList.remove('unlocked-glow');
            }, 600);
          }
        }, 450);
      } else {
        // ERROR WRONG PASSCODE
        if (errorMsg) errorMsg.style.display = 'block';
        passcodeInput.classList.add('input-error');
        if (passcodeCard) {
          passcodeCard.classList.remove('shake-card');
          void passcodeCard.offsetWidth; // trigger reflow
          passcodeCard.classList.add('shake-card');
        }
        passcodeInput.select();
      }
    }

    if (unlockForm) {
      unlockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        attemptUnlock();
      });
    }
    if (unlockBtn) {
      unlockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        attemptUnlock();
      });
    }

    // Admin Modal Setup & Logic
    if (btnSetupPasscode && modalSetup) {
      btnSetupPasscode.addEventListener('click', async () => {
        currentConfig = await getPasscodeConfig();
        if (toggleEnabled) toggleEnabled.checked = currentConfig.enabled !== false;
        if (adminPassInput) adminPassInput.value = currentConfig.passcode || '1311';
        if (adminHintInput) adminHintInput.value = currentConfig.hint || '';
        modalSetup.classList.add('active');
      });
    }

    function closePasscodeModal() {
      if (modalSetup) modalSetup.classList.remove('active');
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closePasscodeModal);
    if (modalSetup) {
      modalSetup.addEventListener('click', (e) => {
        if (e.target === modalSetup) closePasscodeModal();
      });
    }

    if (btnSavePass) {
      btnSavePass.addEventListener('click', async () => {
        const newCfg = {
          enabled: toggleEnabled ? toggleEnabled.checked : true,
          passcode: (adminPassInput && adminPassInput.value.trim()) ? adminPassInput.value.trim() : '1311',
          hint: adminHintInput ? adminHintInput.value.trim() : ''
        };
        await savePasscodeConfig(newCfg);
        currentConfig = newCfg;
        updateAdminUI(newCfg);
        closePasscodeModal();
        launchConfettiBurst(40);
        openModalNotification('Passcode Settings Saved! 🔐💖',
          `Aapka Passcode Lock successfully update ho gaya hai!\n\nStatus: ${newCfg.enabled ? 'ACTIVE ✅' : 'OFF'}\nSecret Passcode: ${newCfg.passcode}\nHint: ${newCfg.hint || 'None'}\n\nBirthday Girl jab website kholegi toh unhe yeh secret passcode enter karna hoga!`);
      });
    }

    if (btnTestLock) {
      btnTestLock.addEventListener('click', async () => {
        closePasscodeModal();
        sessionStorage.removeItem('jm_bday_unlocked');
        currentConfig = await getPasscodeConfig();
        if (passcodeInput) {
          passcodeInput.value = '';
          passcodeInput.classList.remove('input-error');
        }
        if (errorMsg) errorMsg.style.display = 'none';
        if (lockEmoji) lockEmoji.textContent = '🔒';
        if (lockCircle) lockCircle.classList.remove('unlocked-glow');
        if (unlockBtn) {
          unlockBtn.innerHTML = '<span>Surprise Unlock Kijiye</span> <span class="unlock-btn-icon">💖</span>';
          unlockBtn.style.background = '';
        }

        if (lockScreen) {
          lockScreen.style.display = 'flex';
          if (currentConfig.hint && currentConfig.hint.trim()) {
            hintText.textContent = currentConfig.hint.trim();
            hintBox.style.display = 'flex';
          } else {
            hintBox.style.display = 'none';
          }
          setTimeout(() => { if (passcodeInput) passcodeInput.focus(); }, 150);
        }
      });
    }
  }

    // ==========================================
  // 20. INIT ON DOM CONTENT LOADED
  // ==========================================
  window.addEventListener('DOMContentLoaded', async () => {
    initViewMode();
    await setupPasscodeLockSystem();
    updateSupabaseStatusUI();
    await initSeedsIfNeeded();
    setupWelcomeScreen();
    setupBirthdayCake();
    await setupGifSection();
    await renderGallery();
    setupGalleryModal();
    await renderReasons();
    setupReasonsEditor();
    await setupLetterSection();
    await renderTimeline();
    setupTimelineActions();
    setupFinalSection();
    setupMusicPlayer();
    setupResetButton();
    setupMobileNav();
  });

})();
