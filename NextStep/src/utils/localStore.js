// Frontend-only persistence & authentication layer (localStorage + IndexedDB for binary files)

const KEYS = {
  USERS: "nexepUsers",
  CURRENT_USER: "nexepUser",
  JOBS: "nexepJobs",
  SKILLS: "nexepSkills",
  JOB_VIEWS: "nexepJobViews",
  SKILL_VIEWS: "nexepSkillViews",
  SENT_OFFERS: "nexepSentOffers",
  JOB_APPLICATIONS: "nexepJobApplications",
};

const DB_NAME = "nexepFilesDB";
const DB_VERSION = 1;
const FILE_STORE = "files";

// In-memory fallback if IndexedDB is unavailable in restricted contexts
const memoryFileStore = new Map();

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function toLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDays(range) {
  const match = String(range || "30d").match(/\d+/);
  const parsed = match ? parseInt(match[0], 10) : 30;
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(parsed, 365);
}

// ---------- Password Hashing (Web Crypto SHA-256 + pure-JS fallback) ----------

function generateSaltHex(bytes = 16) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let out = "";
  for (let i = 0; i < bytes * 2; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

// Pure-JS SHA-256 fallback for environments where crypto.subtle is unavailable (e.g. non-HTTPS non-localhost)
function sha256Fallback(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const words = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
  words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64);
    for (let t = 0; t < 16; t++) w[t] = words[i + t] || 0;
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }

  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

async function hashPassword(password, salt) {
  const input = `${salt}:${password}`;
  if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
    try {
      const encoded = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // fall through to JS fallback
    }
  }
  return sha256Fallback(input);
}

// ---------- IndexedDB Binary File Storage ----------

function openFilesDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveFileBlob(key, file) {
  if (!file) return;
  try {
    const db = await openFilesDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      tx.objectStore(FILE_STORE).put(file, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    memoryFileStore.set(key, file);
  }
}

export async function getSkillFileBlob(skillId, kind) {
  const key = `${kind}_${skillId}`;
  try {
    const db = await openFilesDB();
    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readonly");
      const req = tx.objectStore(FILE_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (blob) return blob;
  } catch {
    // fallback below
  }
  return memoryFileStore.get(key) || null;
}

async function deleteSkillFiles(skillId) {
  const keys = [`resume_${skillId}`, `video_${skillId}`];
  keys.forEach((k) => memoryFileStore.delete(k));
  try {
    const db = await openFilesDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      const store = tx.objectStore(FILE_STORE);
      keys.forEach((k) => store.delete(k));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore if unavailable
  }
}

// ---------- Auth Operations ----------

export function getCurrentUser() {
  return readJSON(KEYS.CURRENT_USER, null);
}

export async function signupUser({ username, password, role }) {
  const cleanUsername = (username || "").trim();
  if (!cleanUsername || !password) {
    return { ok: false, message: "Username and password are required." };
  }

  const users = readJSON(KEYS.USERS, []);
  if (users.some((u) => u.username === cleanUsername)) {
    return { ok: false, message: "Username already taken" };
  }

  const salt = generateSaltHex();
  const passwordHash = await hashPassword(password, salt);
  const newUser = {
    id: generateId(),
    username: cleanUsername,
    role: (role || "FRESHER").toUpperCase(),
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJSON(KEYS.USERS, users);
  return { ok: true, message: "Signup successful" };
}

export async function loginUser({ username, password }) {
  const cleanUsername = (username || "").trim();
  const users = readJSON(KEYS.USERS, []);
  const user = users.find((u) => u.username === cleanUsername);

  if (!user) {
    return { ok: false, message: "User not found" };
  }

  const candidateHash = await hashPassword(password || "", user.salt);
  if (candidateHash !== user.passwordHash) {
    return { ok: false, message: "Invalid password" };
  }

  const session = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  writeJSON(KEYS.CURRENT_USER, session);
  return { ok: true, user: session, message: "Login successful" };
}

// ---------- Jobs CRUD ----------

export function getStoredJobs() {
  return readJSON(KEYS.JOBS, []);
}

export function createStoredJob(jobPayload, userId) {
  const jobs = getStoredJobs();
  const currentUser = getCurrentUser() || {};
  const newJob = {
    ...jobPayload,
    id: generateId(),
    postedDate: new Date().toISOString(),
    user: {
      id: userId,
      username: currentUser.username || "",
      role: currentUser.role || "RECRUITER",
    },
  };
  const next = [...jobs, newJob];
  writeJSON(KEYS.JOBS, next);
  return newJob;
}

export function deleteStoredJob(jobId) {
  const jobs = getStoredJobs();
  const next = jobs.filter((j) => String(j.id ?? j._id) !== String(jobId));
  writeJSON(KEYS.JOBS, next);

  const views = readJSON(KEYS.JOB_VIEWS, []);
  writeJSON(
    KEYS.JOB_VIEWS,
    views.filter((v) => String(v.jobId) !== String(jobId))
  );
  return next;
}

// ---------- Skills / Candidates CRUD ----------

export function getStoredSkills() {
  return readJSON(KEYS.SKILLS, []);
}

export async function createStoredSkill(payload, { resume, video } = {}) {
  const skills = getStoredSkills();
  const id = generateId();
  const currentUser = getCurrentUser() || {};
  const ownerId = payload.userId ?? currentUser.id;

  if (resume) {
    await saveFileBlob(`resume_${id}`, resume);
  }
  if (video) {
    await saveFileBlob(`video_${id}`, video);
  }

  const record = {
    id,
    userId: ownerId,
    user: {
      id: ownerId,
      username: currentUser.username || payload.username || "",
      role: currentUser.role || "FRESHER",
    },
    username: payload.username,
    mobileno: payload.mobileno,
    uemail: payload.uemail,
    ustatus: payload.ustatus,
    applyingf: payload.applyingf,
    upassoutYear: payload.upassoutYear,
    usub: payload.usub || "",
    ubody: payload.ubody || "",
    uskills: Array.isArray(payload.uskills) ? payload.uskills : [],
    resumeName: resume ? resume.name : null,
    resumeType: resume ? resume.type || "application/pdf" : null,
    videoName: video ? video.name : null,
    videoType: video ? video.type || "video/mp4" : null,
    createdAt: new Date().toISOString(),
  };

  const next = [...skills, record];
  writeJSON(KEYS.SKILLS, next);
  return record;
}

export async function deleteStoredSkill(skillId) {
  const skills = getStoredSkills();
  const next = skills.filter((s) => String(s._id ?? s.id) !== String(skillId));
  writeJSON(KEYS.SKILLS, next);

  await deleteSkillFiles(skillId);

  const views = readJSON(KEYS.SKILL_VIEWS, []);
  writeJSON(
    KEYS.SKILL_VIEWS,
    views.filter((v) => String(v.skillId) !== String(skillId))
  );
  return next;
}

// ---------- Offer Letters & Job Applications ----------

export function sendOfferLocal({ candidateId, toEmail, subject, body, recruiterId }) {
  const offers = readJSON(KEYS.SENT_OFFERS, []);
  const entry = {
    id: generateId(),
    candidateId,
    toEmail,
    subject,
    body,
    recruiterId,
    sentAt: new Date().toISOString(),
  };
  offers.push(entry);
  writeJSON(KEYS.SENT_OFFERS, offers);
  return entry;
}

export function applyToJobLocal(jobId, userId) {
  const apps = readJSON(KEYS.JOB_APPLICATIONS, []);
  const exists = apps.some(
    (a) => String(a.jobId) === String(jobId) && String(a.userId) === String(userId)
  );
  if (!exists) {
    apps.push({
      id: generateId(),
      jobId,
      userId,
      appliedAt: new Date().toISOString(),
    });
    writeJSON(KEYS.JOB_APPLICATIONS, apps);
  }
  return true;
}

export function hasAppliedToJobLocal(jobId, userId) {
  if (!jobId || !userId) return false;
  const apps = readJSON(KEYS.JOB_APPLICATIONS, []);
  return apps.some(
    (a) => String(a.jobId) === String(jobId) && String(a.userId) === String(userId)
  );
}

// ---------- View Tracking ----------

export function recordJobViewLocal(jobId) {
  const user = getCurrentUser();
  if (!user?.id || user.role === "RECRUITER") return;

  const jobs = getStoredJobs();
  const targetJob = jobs.find((j) => String(j.id ?? j._id) === String(jobId));
  if (!targetJob) return;

  const ownerId = targetJob.user?.id ?? targetJob.user?._id;
  if (ownerId != null && String(ownerId) === String(user.id)) return;

  const today = toLocalDateStr();
  const views = readJSON(KEYS.JOB_VIEWS, []);
  const alreadyViewed = views.some(
    (v) =>
      String(v.jobId) === String(jobId) &&
      String(v.viewerId) === String(user.id) &&
      v.viewedOn === today
  );

  if (!alreadyViewed) {
    views.push({ jobId, viewerId: user.id, viewedOn: today });
    writeJSON(KEYS.JOB_VIEWS, views);
  }
}

export function recordSkillViewLocal(skillId) {
  const user = getCurrentUser();
  if (!user?.id || user.role !== "RECRUITER") return;

  const today = toLocalDateStr();
  const views = readJSON(KEYS.SKILL_VIEWS, []);
  const alreadyViewed = views.some(
    (v) =>
      String(v.skillId) === String(skillId) &&
      String(v.viewerId) === String(user.id) &&
      v.viewedOn === today
  );

  if (!alreadyViewed) {
    views.push({ skillId, viewerId: user.id, viewedOn: today });
    writeJSON(KEYS.SKILL_VIEWS, views);
  }
}

// ---------- Analytics ----------

export function getAnalyticsLocal(kind, userId, range = "30d") {
  const days = parseDays(range);
  const today = new Date();
  const sinceDate = new Date(today);
  sinceDate.setDate(today.getDate() - days);
  const sinceStr = toLocalDateStr(sinceDate);

  if (kind === "RECRUITER") {
    const jobs = getStoredJobs();
    const myJobs = jobs.filter((j) => {
      const ownerId = j.user?.id ?? j.user?._id;
      return ownerId != null && String(ownerId) === String(userId);
    });
    const myJobIds = new Set(myJobs.map((j) => String(j.id ?? j._id)));

    const allViews = readJSON(KEYS.JOB_VIEWS, []).filter(
      (v) => myJobIds.has(String(v.jobId)) && v.viewedOn >= sinceStr
    );

    const perJob = {};
    for (const v of allViews) {
      const k = String(v.jobId);
      perJob[k] = (perJob[k] || 0) + 1;
    }

    const postings = myJobs.map((j) => ({
      id: j.id ?? j._id,
      title: j.position,
      views: perJob[String(j.id ?? j._id)] || 0,
    }));

    return {
      jobs: { total: myJobs.length },
      funnel: { views: allViews.length },
      postings,
    };
  }

  // CANDIDATE
  const allSkills = getStoredSkills();
  const mySkills = allSkills.filter((s) => {
    const ownerId = s.userId ?? s.ownerId ?? s.user_id ?? s.user?.id ?? s.user?._id;
    return ownerId != null && String(ownerId) === String(userId);
  });

  const notBlank = (v) => v != null && String(v).trim().length > 0;
  let headline = false;
  let about = false;
  let video = false;
  let resume = false;
  let skillCount = 0;

  for (const s of mySkills) {
    headline ||= notBlank(s.usub);
    about ||= notBlank(s.ubody);
    video ||= notBlank(s.videoName);
    resume ||= notBlank(s.resumeName);
    if (Array.isArray(s.uskills)) skillCount += s.uskills.length;
  }

  const checklist = [
    { label: "Resume uploaded", done: resume },
    { label: "Video introduction", done: video },
    { label: "Skills listed", done: skillCount > 0 },
    { label: "About section written", done: about },
    { label: "Headline added", done: headline },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const profile = {
    exists: mySkills.length > 0,
    strength: Math.round((doneCount * 100) / checklist.length),
    skills: skillCount,
    checklist,
  };

  const mySkillIds = new Set(mySkills.map((s) => String(s.id ?? s._id)));
  const relevantViews = readJSON(KEYS.SKILL_VIEWS, []).filter(
    (v) => mySkillIds.has(String(v.skillId)) && v.viewedOn >= sinceStr
  );

  const perDay = {};
  const uniqueViewers = new Set();
  for (const v of relevantViews) {
    perDay[v.viewedOn] = (perDay[v.viewedOn] || 0) + 1;
    if (v.viewerId != null) uniqueViewers.add(String(v.viewerId));
  }

  const daily = [];
  const cursor = new Date(sinceDate);
  const todayStr = toLocalDateStr(today);
  while (toLocalDateStr(cursor) <= todayStr) {
    const dateStr = toLocalDateStr(cursor);
    daily.push({ date: dateStr, count: perDay[dateStr] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const allJobs = getStoredJobs();

  return {
    profile,
    views: {
      total: relevantViews.length,
      uniqueRecruiters: uniqueViewers.size,
      daily,
    },
    market: { openJobs: allJobs.length },
  };
}
