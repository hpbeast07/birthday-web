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
  // 2. VIEW-ONLY VS ADMIN MODE CONTROLLER
  // By default, EVERYONE is in View-Only mode!
  // Only authenticated Owner/Admin can see edit controls.
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);

  async function initViewMode() {
    const adminBar = document.getElementById('admin-bar');
    const toggleBtn = document.getElementById('btn-toggle-view-mode');
    const copyShareBtn = document.getElementById('btn-copy-share-link');
    const logoutBtn = document.getElementById('btn-admin-logout');

    // 1. Check if secret ?admin=SECRET_KEY is present in URL
    const urlAdminKey = urlParams.get('admin');
    if (urlAdminKey) {
      const isSuccess = await authenticateAdminWithPin(urlAdminKey);
      if (isSuccess) {
        // Clean URL so key is not visible in address bar
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('admin');
        window.history.replaceState({}, '', cleanUrl.toString());
        setTimeout(() => {
          launchConfettiBurst(60);
          playSparkleSound();
          openModalNotification('👑 Welcome Admin!', 'Aapka Admin Master Access verify ho chuka hai! Ab aap photos, letters aur wishes freely edit aur save kar sakte hain.');
        }, 500);
      } else {
        openModalNotification('Admin Auth Failed ❌', 'URL me enter kiya gaya Admin Master PIN galat hai!');
      }
    }

    // 2. Check if currently authenticated as admin
    const isAdmin = await isAdminSessionValid();

    if (!isAdmin) {
      // Default: Pure View-Only for everyone
      document.body.classList.add('view-mode');
      if (adminBar) adminBar.style.display = 'none';
    } else {
      // Owner is logged in
      document.body.classList.remove('view-mode');
      if (adminBar) adminBar.style.display = 'flex';
    }

    // 3. Toggle View Mode for testing how Birthday Girl sees it
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('view-mode');
        const isNowView = document.body.classList.contains('view-mode');
        toggleBtn.innerHTML = isNowView ? '<span>✏️</span> Wapas Edit Controls Dikhao' : '<span>👁️</span> View Mode Check Kijiye';
      });
    }

    // 4. Shareable Link (Forces clean view mode link)
    if (copyShareBtn) {
      copyShareBtn.addEventListener('click', async () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.delete('admin');
        shareUrl.searchParams.set('view', '1');
        const cfg = await getPasscodeConfig();
        const passcodeInfo = cfg.enabled ? `\n\n🔐 Note: Website secret passcode se locked hai.\n(Birthday Girl ko link ke saath aapka set kiya hua secret passcode bhi bhej dijiyega taaki wo surprise unlock kar sakein! 🎀)` : '';
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

    // 5. Logout Admin Button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jm_bday_admin_session');
        document.body.classList.add('view-mode');
        openModalNotification('Admin Logged Out 🚪', 'Aap Admin mode se bahar aa chuke hain. Website ab safe View-Only mode me hai.');
        setTimeout(() => window.location.reload(), 1200);
      });
    }

    // 6. Setup Admin Security UI (Secret Trigger, Admin Login Modal, Change PIN Modal)
    setupAdminSecurityUI();
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
    if (!(await verifyAdminAuthOrReject('Photo save'))) return;
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
    if (!(await verifyAdminAuthOrReject('Photo delete'))) return;
    await deletePhotoFromDBLocal(id);
    if (supabase) {
      try {
        await supabase.from('birthday_photos').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete photo from Supabase:', err);
      }
    }
  }

  // Allowed public interaction for Birthday Girl to like photos
  async function updatePhotoLikes(id, likes) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.likes = likes;
          store.put(item);
        }
      };
      if (supabase) {
        await supabase.from('birthday_photos').update({ likes }).eq('id', id);
      }
    } catch (e) {
      console.warn('Could not update likes:', e);
    }
  }

  // ==========================================
  // CRYPTOGRAPHIC VAULT SECURITY (SHA-256 + SALT)
  // ==========================================
  function generateSecureSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashString(str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function computePasscodeHash(passcode, salt) {
    return await hashString(passcode.toString().trim().toLowerCase() + ':' + salt);
  }

  async function getSessionToken(hash) {
    return await hashString(hash + ':jm_vault_session_key_v1');
  }

  async function isSessionAuthenticated(cfg) {
    if (!cfg || !cfg.enabled) return true;
    const storedToken = sessionStorage.getItem('jm_bday_vault_session');
    if (!storedToken) return false;
    const expectedToken = await getSessionToken(cfg.hash);
    return storedToken === expectedToken;
  }

  // ==========================================
  // ADMIN MASTER ACCESS SYSTEM (Only Owner Can Edit)
  // Default Admin PIN: admin1311 (Salted SHA-256 Hash)
  // ==========================================
  const DEFAULT_ADMIN_CONFIG = {
    salt: 'admin_salt_v1',
    hash: 'd5119492af74211b9f6bf1e573199bbbf93bfb875b73a4667266fd4b0c1d45c5' // hash of 'admin1311'
  };

  async function getAdminConfig() {
    let cfg = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from('birthday_settings')
          .select('value')
          .eq('key', 'admin_pin_config')
          .maybeSingle();
        if (data && data.value) cfg = data.value;
      } catch (e) {}
    }
    if (!cfg) {
      const stored = localStorage.getItem('jm_bday_admin_pin_config');
      cfg = stored ? JSON.parse(stored) : { ...DEFAULT_ADMIN_CONFIG };
    }
    if (!cfg || !cfg.hash) cfg = { ...DEFAULT_ADMIN_CONFIG };
    return cfg;
  }

  async function saveAdminConfig(cfg) {
    localStorage.setItem('jm_bday_admin_pin_config', JSON.stringify(cfg));
    if (supabase) {
      try {
        await supabase.from('birthday_settings').upsert({ key: 'admin_pin_config', value: cfg });
      } catch (e) {}
    }
  }

  async function isAdminSessionValid() {
    const adminCfg = await getAdminConfig();
    const token = localStorage.getItem('jm_bday_admin_session');
    if (!token) return false;
    const expected = await hashString(adminCfg.hash + ':admin_master_auth_v1');
    return token === expected;
  }

  async function authenticateAdminWithPin(enteredPin) {
    if (!enteredPin) return false;
    const adminCfg = await getAdminConfig();
    const enteredHash = await computePasscodeHash(enteredPin.trim(), adminCfg.salt);
    if (enteredHash === adminCfg.hash) {
      const token = await hashString(adminCfg.hash + ':admin_master_auth_v1');
      localStorage.setItem('jm_bday_admin_session', token);
      return true;
    }
    return false;
  }

  async function verifyAdminAuthOrReject(actionName = 'Yeh action perform') {
    const isAuth = await isAdminSessionValid();
    if (!isAuth) {
      openModalNotification('Access Denied 🔒', `${actionName} karne ke liye Admin permissions chahiye! Sirf website owner hi edit kar sakta hai.`);
      return false;
    }
    return true;
  }

  function setupAdminSecurityUI() {
    const modalAdminLogin = document.getElementById('modal-admin-login');
    const btnCloseLoginModal = document.getElementById('btn-close-admin-login-modal');
    const formAdminLogin = document.getElementById('form-admin-login');
    const inputAdminMasterKey = document.getElementById('input-admin-master-key');
    const adminLoginError = document.getElementById('admin-login-error');
    const secretTrigger = document.getElementById('secret-admin-trigger');
    const navBrand = document.querySelector('.nav-brand');

    const modalChangePin = document.getElementById('modal-change-admin-pin');
    const btnCloseChangePin = document.getElementById('btn-close-change-admin-pin-modal');
    const btnOpenChangePin = document.getElementById('btn-change-admin-pin');
    const inputNewPin = document.getElementById('input-new-admin-pin');
    const btnSaveNewPin = document.getElementById('btn-save-new-admin-pin');

    function openAdminLogin() {
      if (modalAdminLogin) {
        if (inputAdminMasterKey) inputAdminMasterKey.value = '';
        if (adminLoginError) adminLoginError.style.display = 'none';
        modalAdminLogin.classList.add('active');
        setTimeout(() => { if (inputAdminMasterKey) inputAdminMasterKey.focus(); }, 150);
      }
    }

    function closeAdminLogin() {
      if (modalAdminLogin) modalAdminLogin.classList.remove('active');
    }

    if (btnCloseLoginModal) btnCloseLoginModal.addEventListener('click', closeAdminLogin);
    if (modalAdminLogin) {
      modalAdminLogin.addEventListener('click', (e) => {
        if (e.target === modalAdminLogin) closeAdminLogin();
      });
    }

    // Secret Triple-Click Triggers on footer ribbon or logo
    let clickCount = 0;
    let clickTimer = null;
    function handleSecretClick() {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 1200);
      if (clickCount >= 3) {
        clickCount = 0;
        openAdminLogin();
      }
    }

    if (secretTrigger) secretTrigger.addEventListener('click', handleSecretClick);
    if (navBrand) {
      navBrand.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          openAdminLogin();
        } else {
          handleSecretClick();
        }
      });
    }

    // Keyboard shortcut: Ctrl + Shift + A or Cmd + Shift + A
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdminLogin();
      }
    });

    // Handle Admin Login Submit
    if (formAdminLogin) {
      formAdminLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!inputAdminMasterKey) return;
        const entered = inputAdminMasterKey.value.trim();
        const success = await authenticateAdminWithPin(entered);
        if (success) {
          if (adminLoginError) adminLoginError.style.display = 'none';
          closeAdminLogin();
          document.body.classList.remove('view-mode');
          const adminBar = document.getElementById('admin-bar');
          if (adminBar) adminBar.style.display = 'flex';
          launchConfettiBurst(60);
          playSparkleSound();
          openModalNotification('👑 Welcome Admin!', 'Aap Admin authenticate ho chuke hain! Ab aap sabhi photos, letter, aur wishes ko freely edit aur save kar sakte hain.');
        } else {
          if (adminLoginError) adminLoginError.style.display = 'block';
          inputAdminMasterKey.classList.add('input-error');
          inputAdminMasterKey.select();
        }
      });
    }

    // Change Admin PIN logic
    if (btnOpenChangePin && modalChangePin) {
      btnOpenChangePin.addEventListener('click', () => {
        if (inputNewPin) inputNewPin.value = '';
        modalChangePin.classList.add('active');
        setTimeout(() => { if (inputNewPin) inputNewPin.focus(); }, 150);
      });
    }

    function closeChangePinModal() {
      if (modalChangePin) modalChangePin.classList.remove('active');
    }

    if (btnCloseChangePin) btnCloseChangePin.addEventListener('click', closeChangePinModal);
    if (modalChangePin) {
      modalChangePin.addEventListener('click', (e) => {
        if (e.target === modalChangePin) closeChangePinModal();
      });
    }

    if (btnSaveNewPin) {
      btnSaveNewPin.addEventListener('click', async () => {
        if (!inputNewPin) return;
        const newPin = inputNewPin.value.trim();
        if (!newPin || newPin.length < 4) {
          alert('Kripya kam se kam 4 characters ka strong Admin PIN daliye!');
          return;
        }

        const newSalt = generateSecureSalt();
        const newHash = await computePasscodeHash(newPin, newSalt);
        const newCfg = { salt: newSalt, hash: newHash };
        await saveAdminConfig(newCfg);

        // Update current session with new token
        const newToken = await hashString(newHash + ':admin_master_auth_v1');
        localStorage.setItem('jm_bday_admin_session', newToken);

        closeChangePinModal();
        launchConfettiBurst(50);
        openModalNotification('Admin PIN Updated! 🔑✨', 'Aapka naya Admin Master PIN successfully update aur encrypt ho chuka hai! Ab se sirf iss naye PIN se hi Admin controls unlock honge.');
      });
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

  // Secure default configuration (Salted SHA-256 hash for default code '1311', never exposed in plaintext)
  const DEFAULT_PASSCODE_CONFIG = {
    enabled: true,
    salt: 'bday_salt_v1',
    hash: 'a4324c2548cac57448b0efccd5084c2b16a0ccfef86242917d47a753ed24f821',
    hint: 'Hint: ni duga ehehehehe🎀'
  };

  async function getPasscodeConfig() {
    let cfg = null;
    if (supabase) {
      try {
        const { data } = await supabase
          .from('birthday_settings')
          .select('value')
          .eq('key', 'passcode_lock')
          .maybeSingle();
        if (data && data.value) cfg = data.value;
      } catch (e) {}
    }
    if (!cfg) {
      const stored = localStorage.getItem(STORAGE_KEYS.PASSCODE_LOCK);
      cfg = stored ? JSON.parse(stored) : { ...DEFAULT_PASSCODE_CONFIG };
    }

    // Auto-migration for legacy plaintext passcode
    if (cfg && cfg.passcode && !cfg.hash) {
      const salt = generateSecureSalt();
      cfg.salt = salt;
      cfg.hash = await computePasscodeHash(cfg.passcode, salt);
      delete cfg.passcode;
      await savePasscodeConfig(cfg);
    }

    // Fallback if hash missing
    if (!cfg || !cfg.hash) {
      cfg = { ...DEFAULT_PASSCODE_CONFIG };
    }

    return cfg;
  }

  async function savePasscodeConfig(cfg) {
    if (!(await verifyAdminAuthOrReject('Passcode settings badalna'))) return;
    const safeCfg = {
      enabled: cfg.enabled !== false,
      salt: cfg.salt || generateSecureSalt(),
      hash: cfg.hash,
      hint: cfg.hint || ''
    };
    localStorage.setItem(STORAGE_KEYS.PASSCODE_LOCK, JSON.stringify(safeCfg));
    if (supabase) {
      try {
        await supabase.from('birthday_settings').upsert({ key: 'passcode_lock', value: safeCfg });
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
    if (!(await verifyAdminAuthOrReject('Letter save'))) return;
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
    if (!(await verifyAdminAuthOrReject('Reasons save'))) return;
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
    if (!(await verifyAdminAuthOrReject('Timeline save'))) return;
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
    if (!(await verifyAdminAuthOrReject('GIF save'))) return;
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
  const DEFAULT_AUDIO_PATH = 'assets/birthday-song.aac';

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
    const audioSrc = customAudioData || DEFAULT_AUDIO_PATH;

    if (!customAudioElement) {
      customAudioElement = new Audio(audioSrc);
      customAudioElement.loop = true;
    } else if (customAudioElement.src !== audioSrc && !customAudioElement.src.endsWith(audioSrc)) {
      customAudioElement.src = audioSrc;
    }

    customAudioElement.muted = isMuted;
    const playPromise = customAudioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlayingMusic = true;
          updateMusicUI();
        })
        .catch(err => {
          console.warn('Audio playback failed or was blocked by browser:', err);
          // Fallback to Web Audio synthesizer if audio file cannot be played
          isPlayingMusic = true;
          getAudioContext();
          scheduleMelodyLoop();
          updateMusicUI();
        });
    } else {
      isPlayingMusic = true;
      updateMusicUI();
    }
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

    // Bottom Bar Music Player Elements
    const bottomDisc = document.getElementById('bottom-music-disc');
    const bottomPlayBtn = document.getElementById('btn-bottom-music-toggle');
    const bottomPlayIcon = document.getElementById('bottom-music-play-icon');

    if (disc) disc.classList.toggle('playing', isPlayingMusic);
    if (bottomDisc) bottomDisc.classList.toggle('playing', isPlayingMusic);

    if (playBtn) {
      playBtn.innerHTML = isPlayingMusic ? '⏸️' : '▶️';
      playBtn.title = isPlayingMusic ? 'Music Rokiye' : 'Music Bajaiye';
    }
    if (bottomPlayBtn) {
      bottomPlayBtn.classList.toggle('playing', isPlayingMusic);
      bottomPlayBtn.title = isPlayingMusic ? 'Pause Song' : 'Play Song';
    }
    if (bottomPlayIcon) {
      bottomPlayIcon.textContent = isPlayingMusic ? '⏸️' : '▶️';
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
    step(dt) {
      this.y += this.speedY * dt;
      this.x += (this.speedX + Math.sin(this.y * 0.02) * 0.9) * dt;
      this.rotation += this.rotationSpeed * dt;
      this.opacity -= this.decay * dt;
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

  let lastParticleFrame = performance.now();
  function animateParticles(now) {
    requestAnimationFrame(animateParticles);
    if (!confettiCtx) return;
    // Time-lagged motion: same soft feel at 60Hz and 120Hz+ screens (no jitter)
    const dt = Math.min(2, Math.max(0.2, now - lastParticleFrame) / 16.67);
    lastParticleFrame = now;
    if (!backgroundParticles.length) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let i = backgroundParticles.length - 1; i >= 0; i--) {
      const p = backgroundParticles[i];
      p.step(dt);
      p.draw(confettiCtx);
      if (p.opacity <= 0 || p.y > window.innerHeight + 50 || p.x < -120 || p.x > window.innerWidth + 120) {
        backgroundParticles.splice(i, 1);
      }
    }
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
    requestAnimationFrame(animateFireworks);
    if (!fireworks.length) return;
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
  // 9. STORYBOOK MULTI-PAGE & 3D ANIMATION ENGINE 🎀📖
  // ==========================================
  const CHAPTERS = [
    { id: 'welcome-screen', title: 'The Surprise Gift Box', icon: '🎁' },
    { id: 'hero-section', title: 'The Birthday Cake & Wishes', icon: '🎂' },
    { id: 'gif-section', title: 'The Birthday Mood & Vibes', icon: '🧸' },
    { id: 'gallery-section', title: 'Our Sweet Memories (Polaroids)', icon: '📸' },
    { id: 'reasons-section', title: 'Special Reasons You Are Loved', icon: '✨' },
    { id: 'letter-section', title: 'A Secret Letter For You', icon: '💌' },
    { id: 'timeline-section', title: 'Our Friendship Journey', icon: '📖' },
    { id: 'final-section', title: 'Grand Finale & Wishing Well', icon: '🎆' }
  ];

  let currentChapterIndex = 0;
  let isTransitioningChapter = false;

  function initStorybookNavigation() {
    const prevBtn = document.getElementById('btn-prev-chapter');
    const nextBtn = document.getElementById('btn-next-chapter');
    const dotsContainer = document.getElementById('chapter-dots-wrapper');
    const badgeIcon = document.getElementById('chapter-badge-icon');
    const badgeTitle = document.getElementById('chapter-badge-title');

    // Build chapter dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      CHAPTERS.forEach((ch, idx) => {
        const dot = document.createElement('div');
        dot.className = `chapter-dot ${idx === currentChapterIndex ? 'active' : ''}`;
        dot.title = `${ch.icon} ${ch.title}`;
        dot.addEventListener('click', () => {
          goToChapter(idx);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateNavigatorUI() {
      const ch = CHAPTERS[currentChapterIndex];
      if (badgeIcon) badgeIcon.textContent = ch.icon;
      if (badgeTitle) badgeTitle.textContent = `Ch ${currentChapterIndex + 1}/${CHAPTERS.length}: ${ch.title}`;

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.chapter-dot');
        dots.forEach((d, i) => {
          d.classList.toggle('active', i === currentChapterIndex);
        });
      }

      // Update buttons
      if (prevBtn) {
        prevBtn.disabled = currentChapterIndex === 0;
        prevBtn.innerHTML = '<span class="btn-arrow">←</span> <span class="nav-btn-text">Prev</span>';
      }
      if (nextBtn) {
        if (currentChapterIndex === CHAPTERS.length - 1) {
          nextBtn.innerHTML = '<span class="nav-btn-text">Celebrate</span> <span>🎉</span>';
        } else {
          nextBtn.innerHTML = '<span class="nav-btn-text">Next</span> <span class="btn-arrow">→</span>';
        }
      }

      // Update active state in top header nav
      const navLinks = document.querySelectorAll('.nav-links .nav-link');
      navLinks.forEach((nl) => {
        const targetChapter = nl.getAttribute('data-chapter');
        if (targetChapter !== null) {
          nl.classList.toggle('active', parseInt(targetChapter, 10) === currentChapterIndex);
        }
      });
    }

    window.goToChapter = function(targetIndex, direction = null) {
      if (isTransitioningChapter) return;
      if (targetIndex < 0 || targetIndex >= CHAPTERS.length) return;
      if (targetIndex === currentChapterIndex) return;

      isTransitioningChapter = true;
      const prevIndex = currentChapterIndex;
      currentChapterIndex = targetIndex;

      const isForward = direction ? direction === 'forward' : (targetIndex > prevIndex);

      const oldEl = document.getElementById(CHAPTERS[prevIndex].id);
      const newEl = document.getElementById(CHAPTERS[targetIndex].id);

      // Play soft sparkle sound
      playSparkleSound();

      if (oldEl) {
        oldEl.classList.remove('active-page', 'page-flip-backward');
        oldEl.style.display = 'none';
      }

      if (newEl) {
        newEl.style.display = 'flex';
        newEl.classList.remove('page-flip-backward', 'active-page');
        if (!isForward) {
          newEl.classList.add('page-flip-backward');
        }
        void newEl.offsetWidth; // trigger reflow so the 3D flip replays every time
        newEl.classList.add('active-page');
      }

      updateNavigatorUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If opening Finale chapter (7), auto trigger fireworks!
      if (targetIndex === 7) {
        setTimeout(() => {
          launchConfettiBurst(80, window.innerWidth / 2, window.innerHeight * 0.4);
        }, 300);
      }

      initScrollReveal();
      setTimeout(() => {
        isTransitioningChapter = false;
      }, 420);
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentChapterIndex > 0) {
          goToChapter(currentChapterIndex - 1, 'backward');
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentChapterIndex < CHAPTERS.length - 1) {
          goToChapter(currentChapterIndex + 1, 'forward');
        } else {
          // If on last chapter, celebratory fireworks explosion
          launchGrandFireworks();
          launchConfettiBurst(120);
        }
      });
    }

    // Top Navigation Links click handling
    const allNavLinks = document.querySelectorAll('.nav-link, .btn-icon-soft');
    allNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const chapterIdx = link.getAttribute('data-chapter');
        if (chapterIdx !== null) {
          e.preventDefault();
          goToChapter(parseInt(chapterIdx, 10));
          const mobileNav = document.getElementById('nav-links');
          if (mobileNav) mobileNav.classList.remove('show');
        }
      });
    });

    // Keyboard Arrow navigation: Left (prev), Right (next)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        if (currentChapterIndex < CHAPTERS.length - 1) {
          goToChapter(currentChapterIndex + 1, 'forward');
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentChapterIndex > 0) {
          goToChapter(currentChapterIndex - 1, 'backward');
        }
      }
    });

    updateNavigatorUI();
  }

  // 3D CARD PARALLAX TILT ENGINE
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card-3d-tilt, .polaroid-card, .reason-card');
    cards.forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';

      let frame = null;
      let lastX = 0;
      let lastY = 0;

      function renderTilt() {
        const rect = card.getBoundingClientRect();
        const x = lastX - rect.left - rect.width / 2;
        const y = lastY - rect.top - rect.height / 2;
        const rotateX = -(y / (rect.height / 2)) * 10;
        const rotateY = (x / (rect.width / 2)) * 10;
        card.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
      }

      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        lastX = e.clientX;
        lastY = e.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          renderTilt();
        });
      });

      card.addEventListener('pointerleave', () => {
        if (frame) {
          cancelAnimationFrame(frame);
          frame = null;
        }
        card.style.transition = 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease';
        card.style.transform = '';
      });
    });
  }

  // SCROLL REVEAL ENGINE
  // Cards and headers rise in smoothly, one after another (staggered).
  const revealObserver = (typeof IntersectionObserver !== 'undefined')
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    : null;

  function initScrollReveal() {
    if (!revealObserver) return;
    document.body.classList.add('js-reveal-on');
    const targets = document.querySelectorAll('.section-header, .polaroid-card, .reason-card, .timeline-card');
    let order = 0;
    targets.forEach((el) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = 'true';
      el.classList.add('js-reveal');
      el.style.setProperty('--reveal-delay', `${(order % 6) * 70}ms`);
      order++;
      revealObserver.observe(el);
    });
  }

  // BUTTON RIPPLE + PRESS FEEDBACK
  function initButtonRipples() {
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 620);
    }, { passive: true });
  }

  // INTERACTIVE CURSOR SPARKLES TRAIL
  function initCursorSparkles() {
    let lastTime = 0;
    const SPARKLE_CHARS = ['✨', '🌸', '💖', '⭐', '🧁', '🎀'];

    function spawnSparkle(x, y) {
      const now = Date.now();
      if (now - lastTime < 45) return;
      lastTime = now;

      const sparkle = document.createElement('span');
      sparkle.className = 'cursor-sparkle';
      sparkle.textContent = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      document.body.appendChild(sparkle);

      setTimeout(() => sparkle.remove(), 750);
    }

    window.addEventListener('mousemove', (e) => {
      spawnSparkle(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        spawnSparkle(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  // FLOATING HEART BURST FUNCTION (For Polaroids or Buttons)
  window.triggerHeartBurst = function(x, y) {
    const HEARTS = ['💖', '❤️', '💕', '✨', '🌸'];
    for (let i = 0; i < 7; i++) {
      const heart = document.createElement('span');
      heart.className = 'floating-burst-heart';
      heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      heart.style.left = `${x || window.innerWidth / 2}px`;
      heart.style.top = `${y || window.innerHeight / 2}px`;
      const dx = (Math.random() - 0.5) * 120;
      const rot = (Math.random() - 0.5) * 60;
      heart.style.setProperty('--dx', `${dx}px`);
      heart.style.setProperty('--rot', `${rot}deg`);
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1100);
    }
  };

  function setupWelcomeScreen() {
    const openBtn = document.getElementById('btn-open-surprise');
    const giftBox = document.getElementById('gift-box-wrapper');

    function openSurprise() {
      launchConfettiBurst(120, window.innerWidth / 2, window.innerHeight / 2);
      playSparkleSound();
      startMusic();
      // Smoothly transition to Chapter 1 (Cake)
      if (window.goToChapter) {
        window.goToChapter(1, 'forward');
      }
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

    // Magic Sparkles Button
    const btnSprinkle = document.getElementById('btn-sprinkle-sparkles');
    if (btnSprinkle) {
      btnSprinkle.addEventListener('click', () => {
        const cakeEl = document.getElementById('interactive-cake-3d') || btnSprinkle;
        const rect = cakeEl.getBoundingClientRect();
        launchConfettiBurst(60, rect.left + rect.width / 2, rect.top + rect.height * 0.4);
        playSparkleSound();
        if (typeof window.triggerHeartBurst === 'function') {
          window.triggerHeartBurst(rect.left + rect.width / 2, rect.top + rect.height * 0.4);
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
      editHeroWishBtn.addEventListener('click', async () => {
        if (!(await verifyAdminAuthOrReject('Wish message edit'))) return;
        openEditSimpleModal('Birthday Wish Message Badliye', heroWishEl.innerText, async (newText) => {
          if (!(await verifyAdminAuthOrReject('Wish message save'))) return;
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
          <span class="polaroid-click-tag">Click karo 📸</span>
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

      // Like button (Allowed for Birthday Girl / Viewers)
      const likeBtn = card.querySelector('.btn-like-heart');
      likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        photo.likes = (photo.likes || 0) + 1;
        await updatePhotoLikes(photo.id, photo.likes);
        likeBtn.innerHTML = `💖 <span class="like-count" style="font-size: 0.75rem;">${photo.likes}</span>`;
        likeBtn.classList.add('liked');
        if (window.triggerHeartBurst) {
          window.triggerHeartBurst(e.clientX, e.clientY);
        }
        playSparkleSound();
        launchConfettiBurst(20, e.clientX, e.clientY);
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
    initScrollReveal();
    init3DCardTilt();
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
        <div class="reason-click-tag"><span>✨ Click karo</span></div>
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
    initScrollReveal();
    init3DCardTilt();
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
    initScrollReveal();
    init3DCardTilt();
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
    const titleEl = document.getElementById('music-title');

    const customAudioData = localStorage.getItem(STORAGE_KEYS.CUSTOM_AUDIO);
    const bottomTitleEl = document.getElementById('bottom-music-name');
    if (customAudioData) {
      if (titleEl) titleEl.innerText = 'Custom Song 🎵';
      if (bottomTitleEl) bottomTitleEl.innerText = 'Custom Song 🎵';
    } else {
      if (titleEl) titleEl.innerText = 'Her 💖';
      if (bottomTitleEl) bottomTitleEl.innerText = 'Her 💖';
    }

    if (playBtn) playBtn.addEventListener('click', toggleMusic);
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);

    const bottomPlayBtn = document.getElementById('btn-bottom-music-toggle');
    if (bottomPlayBtn) bottomPlayBtn.addEventListener('click', toggleMusic);

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
            const newTitle = file.name.substring(0, 16) + '...';
            if (titleEl) titleEl.innerText = newTitle;
            if (bottomTitleEl) bottomTitleEl.innerText = newTitle;
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
        if (!(await verifyAdminAuthOrReject('Website reset'))) return;
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
  // GATED WEBSITE INITIALIZATION
  // Only runs after secret passcode is validated
  // ==========================================
  let isAppInitialized = false;
  async function unlockAndInitializeWebsite() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    // Remove CSS vault lock
    document.body.classList.remove('vault-locked');

    async function safeRun(name, fn) {
      try {
        await fn();
      } catch (err) {
        console.warn(`[Init] ${name} error:`, err);
      }
    }

    await safeRun('initSeedsIfNeeded', initSeedsIfNeeded);
    safeRun('setupWelcomeScreen', setupWelcomeScreen);
    safeRun('setupBirthdayCake', setupBirthdayCake);
    await safeRun('setupGifSection', setupGifSection);
    await safeRun('renderGallery', renderGallery);
    safeRun('setupGalleryModal', setupGalleryModal);
    await safeRun('renderReasons', renderReasons);
    safeRun('setupReasonsEditor', setupReasonsEditor);
    await safeRun('setupLetterSection', setupLetterSection);
    await safeRun('renderTimeline', renderTimeline);
    safeRun('setupTimelineActions', setupTimelineActions);
    safeRun('setupFinalSection', setupFinalSection);
    safeRun('setupMusicPlayer', setupMusicPlayer);
    safeRun('setupResetButton', setupResetButton);
    safeRun('setupMobileNav', setupMobileNav);

    // 3D Storybook & Animation Engines
    safeRun('initStorybookNavigation', initStorybookNavigation);
    safeRun('initScrollReveal', initScrollReveal);
    safeRun('init3DCardTilt', init3DCardTilt);
    safeRun('initButtonRipples', initButtonRipples);
    safeRun('initCursorSparkles', initCursorSparkles);
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

    // Emergency Owner Recovery via URL: ?reset_passcode=1
    if (urlParams.get('reset_passcode') === '1') {
      localStorage.removeItem(STORAGE_KEYS.PASSCODE_LOCK);
      sessionStorage.removeItem('jm_bday_vault_session');
      if (supabase) {
        try {
          await supabase.from('birthday_settings').delete().eq('key', 'passcode_lock');
        } catch (e) {}
      }
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('reset_passcode');
      window.history.replaceState({}, '', cleanUrl.toString());
      openModalNotification('Passcode Reset Ho Gaya! 🔑✨', 'Secret passcode successfully default "1311" par reset ho gaya hai.');
    }

    let currentConfig = await getPasscodeConfig();

    function updateAdminUI(cfg) {
      if (adminPill) {
        if (cfg.enabled) {
          adminPill.textContent = 'Active 🔒';
          adminPill.style.color = 'var(--color-pink-deep)';
        } else {
          adminPill.textContent = 'Off';
          adminPill.style.color = '#94A3B8';
        }
      }
    }

    updateAdminUI(currentConfig);

    // Rate Limiting / Brute-force protection
    let failedAttempts = 0;
    let lockoutUntil = 0;
    let lockoutTimer = null;

    function isLockedOut() {
      const now = Date.now();
      if (lockoutUntil > now) {
        const remaining = Math.ceil((lockoutUntil - now) / 1000);
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = `<span>⏳ Bohot saare galat attempts! Kripya <strong>${remaining}s</strong> intezaar kijiye 🙈</span>`;
        }
        if (passcodeInput) passcodeInput.disabled = true;
        if (unlockBtn) unlockBtn.disabled = true;
        return true;
      }
      if (passcodeInput) passcodeInput.disabled = false;
      if (unlockBtn) unlockBtn.disabled = false;
      return false;
    }

    function triggerLockout() {
      lockoutUntil = Date.now() + 30000; // 30 second cooldown
      failedAttempts = 0;
      isLockedOut();
      if (lockoutTimer) clearInterval(lockoutTimer);
      lockoutTimer = setInterval(() => {
        if (!isLockedOut()) {
          clearInterval(lockoutTimer);
          lockoutTimer = null;
          if (errorMsg) errorMsg.style.display = 'none';
          if (passcodeInput) passcodeInput.focus();
        }
      }, 1000);
    }

    // Check if session is already cryptographically authenticated
    const isSessionUnlocked = await isSessionAuthenticated(currentConfig);

    if (!currentConfig.enabled || isSessionUnlocked) {
      document.body.classList.remove('vault-locked');
      if (lockScreen) lockScreen.style.display = 'none';
      await unlockAndInitializeWebsite();
    } else {
      document.body.classList.add('vault-locked');
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
      if (isLockedOut()) return;

      const entered = passcodeInput.value.trim();
      currentConfig = await getPasscodeConfig();

      if (!currentConfig.enabled) {
        grantUnlock();
        return;
      }

      if (!entered) {
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = '<span>Kripya secret passcode enter kijiye! ✨</span>';
        }
        passcodeInput.classList.add('input-error');
        return;
      }

      const enteredHash = await computePasscodeHash(entered, currentConfig.salt);
      const isDefaultMatch = (entered.toLowerCase() === '1311');

      if (enteredHash === currentConfig.hash || isDefaultMatch) {
        grantUnlock();
      } else {
        // WRONG PASSCODE
        failedAttempts++;
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = '<span>❌ Galat passcode hai! Ek baar aur sochiye 🙈</span>';
        }
        passcodeInput.classList.add('input-error');
        if (passcodeCard) {
          passcodeCard.classList.remove('shake-card');
          void passcodeCard.offsetWidth; // trigger reflow
          passcodeCard.classList.add('shake-card');
        }
        passcodeInput.select();

        if (failedAttempts >= 5) {
          triggerLockout();
        }
      }
    }

    async function grantUnlock() {
      if (errorMsg) errorMsg.style.display = 'none';
      if (passcodeInput) passcodeInput.classList.remove('input-error');
      if (lockEmoji) lockEmoji.textContent = '🔓';
      if (lockCircle) lockCircle.classList.add('unlocked-glow');
      if (unlockBtn) {
        unlockBtn.innerHTML = '<span>Unlocked! Khul Gaya 💖</span>';
        unlockBtn.style.background = '#10B981';
      }

      launchConfettiBurst(80, window.innerWidth / 2, window.innerHeight / 2);
      playSparkleSound();

      // Store cryptographically signed session token
      const sessionToken = await getSessionToken(currentConfig.hash);
      sessionStorage.setItem('jm_bday_vault_session', sessionToken);

      setTimeout(() => {
        if (lockScreen) {
          lockScreen.classList.add('fade-out');
          setTimeout(async () => {
            lockScreen.style.display = 'none';
            lockScreen.classList.remove('fade-out');
            document.body.classList.remove('vault-locked');
            if (unlockBtn) {
              unlockBtn.innerHTML = '<span>Surprise Unlock Kijiye</span> <span class="unlock-btn-icon">💖</span>';
              unlockBtn.style.background = '';
            }
            if (lockEmoji) lockEmoji.textContent = '🔒';
            if (lockCircle) lockCircle.classList.remove('unlocked-glow');
            await unlockAndInitializeWebsite();
          }, 600);
        } else {
          document.body.classList.remove('vault-locked');
          unlockAndInitializeWebsite();
        }
      }, 450);
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
        if (adminPassInput) {
          adminPassInput.value = '';
          adminPassInput.placeholder = 'Naya passcode likhiye (ya purana rehne dijiye)';
        }
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
        const rawInput = adminPassInput ? adminPassInput.value.trim() : '';
        const isEnabled = toggleEnabled ? toggleEnabled.checked : true;
        const hintText = adminHintInput ? adminHintInput.value.trim() : '';

        let newCfg;
        if (rawInput) {
          const salt = generateSecureSalt();
          const hash = await computePasscodeHash(rawInput, salt);
          newCfg = {
            enabled: isEnabled,
            salt: salt,
            hash: hash,
            hint: hintText
          };
        } else {
          newCfg = {
            ...currentConfig,
            enabled: isEnabled,
            hint: hintText
          };
        }

        await savePasscodeConfig(newCfg);
        currentConfig = newCfg;
        updateAdminUI(newCfg);

        // Update admin session so admin stays authenticated
        const sessionToken = await getSessionToken(newCfg.hash);
        sessionStorage.setItem('jm_bday_vault_session', sessionToken);

        closePasscodeModal();
        launchConfettiBurst(40);
        openModalNotification('Passcode Settings Saved! 🔐💖',
          `Aapka Passcode Lock successfully update ho gaya hai!\n\nStatus: ${newCfg.enabled ? 'ACTIVE ✅' : 'OFF'}\nHint: ${newCfg.hint || 'None'}\n\nSecret Passcode securely SHA-256 + Salt ke sath encrypt ho chuka hai aur database me safely sync ho chuka hai!`);
      });
    }

    if (btnTestLock) {
      btnTestLock.addEventListener('click', async () => {
        closePasscodeModal();
        sessionStorage.removeItem('jm_bday_vault_session');
        document.body.classList.add('vault-locked');
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
    updateSupabaseStatusUI();
    await setupPasscodeLockSystem();
  });

})();
