import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  RefreshCw,
  Timer,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Upload,
  Download,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Award,
  Target,
  FolderOpen,
  CheckSquare,
  Square,
  Sparkles,
  Sun,
  Moon,
  Eye,
  X,
  Menu,
  Video,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Sliders,
  ArrowLeft,
  Save
} from 'lucide-react';

// ============================================================================
// UTILITY FUNCTIONS & DATE HELPERS (Asia/Kolkata Timezone & DD MMM YYYY)
// ============================================================================

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getTodayISO = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value || '2026';
    const m = parts.find((p) => p.type === 'month')?.value || '11';
    const d = parts.find((p) => p.type === 'day')?.value || '16';
    return `${y}-${m}-${d}`;
  } catch {
    return '2026-11-16';
  }
};

const formatDateDDMMMYYYY = (isoStr) => {
  if (!isoStr) return '-';
  if (isoStr === 'Recorded') return 'Recorded';
  const parts = String(isoStr).split('-');
  if (parts.length !== 3) return isoStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  return `${day} ${MONTHS_SHORT[monthIdx] || 'Jan'} ${year}`;
};

const addDaysISO = (isoStr, daysToAdd) => {
  const base = isoStr && isoStr !== 'Recorded' ? new Date(`${isoStr}T00:00:00Z`) : new Date();
  base.setUTCDate(base.getUTCDate() + Number(daysToAdd || 0));
  return base.toISOString().slice(0, 10);
};

// ============================================================================
// INDEXED-DB PERSISTENT FILE STORAGE FOR PDFS & HANDWRITTEN NOTES IMAGES
// ============================================================================

const DB_NAME = 'CAFoundationSampurnaDB';
const STORE_NAME = 'files';

const openFileDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const saveFileBlobToDB = async (id, dataUrl, fileName, fileType) => {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ id, dataUrl, fileName, fileType, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Error saving file to IndexedDB:', e);
    return false;
  }
};

const getFileBlobFromDB = async (id) => {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Error reading file from IndexedDB:', e);
    return null;
  }
};

// ============================================================================
// OFFICIAL SUBJECTS & 50 CHAPTERS (EXACTLY MATCHING UPLOADED PDF PLANNERS)
// ============================================================================

const SUBJECTS = [
  {
    id: 'accounting',
    code: 'Paper 1',
    name: 'Accounting',
    faculty: 'Recorded + Live Faculty',
    defaultTiming: 'Live / Recorded'
  },
  {
    id: 'laws',
    code: 'Paper 2',
    name: 'Business Laws',
    faculty: 'Chaitanya Jain Sir',
    defaultTiming: '8:30am - 10:30am'
  },
  {
    id: 'qa',
    code: 'Paper 3',
    name: 'Quantitative Aptitude',
    faculty: 'Anurag Chauhan Sir',
    defaultTiming: '6:00pm - 7:30pm'
  },
  {
    id: 'economics',
    code: 'Paper 4',
    name: 'Business Economics',
    faculty: 'Love Kaushik Sir',
    defaultTiming: '12:00pm - 1:30pm'
  }
];

const INITIAL_CHAPTERS = [
  // 1. ACCOUNTING (13 Units, 110 Lectures)
  { id: 'acc-1', subjectId: 'accounting', number: 1, name: 'Accounts: Basics' },
  { id: 'acc-2', subjectId: 'accounting', number: 2, name: 'Accounting Process' },
  { id: 'acc-3', subjectId: 'accounting', number: 3, name: 'Depreciation & Amortisation' },
  { id: 'acc-4', subjectId: 'accounting', number: 4, name: 'Bills of Exchange & Promissory Notes' },
  { id: 'acc-5', subjectId: 'accounting', number: 5, name: 'Bank Reconciliation Statement (BRS)' },
  { id: 'acc-6', subjectId: 'accounting', number: 6, name: 'Final Accounts of Sole Proprietors' },
  { id: 'acc-7', subjectId: 'accounting', number: 7, name: 'Rectification of Errors' },
  { id: 'acc-8', subjectId: 'accounting', number: 8, name: 'Accounts from Incomplete Records' },
  { id: 'acc-9', subjectId: 'accounting', number: 9, name: 'Inventories' },
  { id: 'acc-10', subjectId: 'accounting', number: 10, name: 'Partnership Accounts' },
  { id: 'acc-11', subjectId: 'accounting', number: 11, name: 'Non-Profit Organisation' },
  { id: 'acc-12', subjectId: 'accounting', number: 12, name: 'Company Accounts' },
  { id: 'acc-13', subjectId: 'accounting', number: 13, name: 'Theoretical Framework' },

  // 2. BUSINESS LAWS (8 Chapters, 106 Lectures)
  { id: 'law-1', subjectId: 'laws', number: 1, name: 'Introduction of the Subject' },
  { id: 'law-2', subjectId: 'laws', number: 2, name: 'Indian Regulatory Framework' },
  { id: 'law-3', subjectId: 'laws', number: 3, name: 'The Indian Partnership Act, 1932' },
  { id: 'law-4', subjectId: 'laws', number: 4, name: 'The Sale of Good Act, 1930' },
  { id: 'law-5', subjectId: 'laws', number: 5, name: 'The Companies Act, 2013' },
  { id: 'law-6', subjectId: 'laws', number: 6, name: 'The Negotiable Instruments Act, 1881' },
  { id: 'law-7', subjectId: 'laws', number: 7, name: 'The Limited Liability Partnership Act, 2008' },
  { id: 'law-8', subjectId: 'laws', number: 8, name: 'The Indian Contract Act, 1872' },

  // 3. QUANTITATIVE APTITUDE (19 Chapters, 96 Lectures)
  { id: 'qa-1', subjectId: 'qa', number: 1, name: 'Mathematics of Finance' },
  { id: 'qa-2', subjectId: 'qa', number: 2, name: 'Ratio and Proportion, Indices, Logarithm' },
  { id: 'qa-3', subjectId: 'qa', number: 3, name: 'Measures of Central Tendency and Dispersion' },
  { id: 'qa-4', subjectId: 'qa', number: 4, name: 'Correlation and Regression' },
  { id: 'qa-5', subjectId: 'qa', number: 5, name: 'Number Series, Coding Decoding and Odd Man Out Series' },
  { id: 'qa-6', subjectId: 'qa', number: 6, name: 'Direction Test' },
  { id: 'qa-7', subjectId: 'qa', number: 7, name: 'Blood Relation' },
  { id: 'qa-8', subjectId: 'qa', number: 8, name: 'Seating Arrangement' },
  { id: 'qa-9', subjectId: 'qa', number: 9, name: 'Index Number' },
  { id: 'qa-10', subjectId: 'qa', number: 10, name: 'Statistical Description of Data' },
  { id: 'qa-11', subjectId: 'qa', number: 11, name: 'Equations' },
  { id: 'qa-12', subjectId: 'qa', number: 12, name: 'Inequalities' },
  { id: 'qa-13', subjectId: 'qa', number: 13, name: 'Permutation and Combination' },
  { id: 'qa-14', subjectId: 'qa', number: 14, name: 'Sequence and Series' },
  { id: 'qa-15', subjectId: 'qa', number: 15, name: 'Sets, Relation and Functions' },
  { id: 'qa-16', subjectId: 'qa', number: 16, name: 'Probability' },
  { id: 'qa-17', subjectId: 'qa', number: 17, name: 'Theoretical Distributions' },
  { id: 'qa-18', subjectId: 'qa', number: 18, name: 'Sampling' },
  { id: 'qa-19', subjectId: 'qa', number: 19, name: 'Basic Concepts of Differential and Integral Calculus' },

  // 4. BUSINESS ECONOMICS (10 Chapters, 90 Lectures)
  { id: 'eco-1', subjectId: 'economics', number: 1, name: 'Nature and Scope of Business Economics' },
  { id: 'eco-2', subjectId: 'economics', number: 2, name: 'Business Cycles' },
  { id: 'eco-3', subjectId: 'economics', number: 3, name: 'Theory of Demand and Supply' },
  { id: 'eco-4', subjectId: 'economics', number: 4, name: 'Theory of Production and Cost' },
  { id: 'eco-5', subjectId: 'economics', number: 5, name: 'Price Determination in Different Markets' },
  { id: 'eco-6', subjectId: 'economics', number: 6, name: 'Determination of National Income' },
  { id: 'eco-7', subjectId: 'economics', number: 7, name: 'Public Finance' },
  { id: 'eco-8', subjectId: 'economics', number: 8, name: 'Money Market' },
  { id: 'eco-9', subjectId: 'economics', number: 9, name: 'International Trade' },
  { id: 'eco-10', subjectId: 'economics', number: 10, name: 'Indian Economy' }
];

// ============================================================================
// COMPLETE 402-LECTURE PLANNER BUILDER (EXACT PDF EXTRACTION)
// ============================================================================

const buildOfficialLectures = () => {
  const list = [];
  const pushLectures = (subjectId, chapterId, entries, defaultFaculty, defaultTiming) => {
    entries.forEach((entry, idx) => {
      const isRecorded = entry.date === 'Recorded';
      list.push({
        id: `${chapterId}-lec-${idx + 1}`,
        subjectId,
        chapterId,
        lectureNumber: entry.lecNo || idx + 1,
        topic: entry.topic || `Part ${idx + 1}`,
        date: entry.date,
        faculty: entry.faculty || defaultFaculty,
        timing: isRecorded ? 'Recorded' : entry.timing || defaultTiming,
        isRecorded,
        status: 'Pending'
      });
    });
  };

  // ---------------- 1. ACCOUNTING (110 LECTURES) ----------------
  pushLectures('accounting', 'acc-1', [
    { lecNo: 1, topic: 'Introduction to Course & Basics of Accounts', date: '2026-11-16' },
    { lecNo: 2, topic: 'Basics of Accounts', date: 'Recorded' }
  ], '-', 'Live / Recorded');

  pushLectures('accounting', 'acc-2', [
    { lecNo: 1, topic: 'Accounting Process: Journal (1)', date: 'Recorded' },
    { lecNo: 2, topic: 'Accounting Process: Journal (2)', date: 'Recorded' },
    { lecNo: 3, topic: 'Accounting Process: Journal (3)', date: 'Recorded' },
    { lecNo: 4, topic: 'Accounting Process: Journal (4)', date: 'Recorded' },
    { lecNo: 5, topic: 'Accounting Process: Journal (5)', date: 'Recorded' },
    { lecNo: 6, topic: 'Accounting Process: Ledger', date: 'Recorded' },
    { lecNo: 7, topic: 'Accounting Process: Trial Balance', date: 'Recorded' },
    { lecNo: 8, topic: 'Accounting Process: Subsidiary Books', date: 'Recorded' },
    { lecNo: 9, topic: 'Accounting Process: Cash Book (1)', date: 'Recorded' },
    { lecNo: 10, topic: 'Accounting Process: Cash Book (2)', date: 'Recorded' }
  ], '-', 'Recorded');

  pushLectures('accounting', 'acc-3', [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    lecNo: n, topic: `Depreciation & Amortisation (Lec ${n})`, date: 'Recorded'
  })), '-', 'Recorded');

  pushLectures('accounting', 'acc-4', [1, 2, 3, 4, 5, 6].map((n) => ({
    lecNo: n, topic: `Bills of Exchange & Promissory Notes (Lec ${n})`, date: 'Recorded'
  })), '-', 'Recorded');

  pushLectures('accounting', 'acc-5', [1, 2, 3, 4, 5].map((n) => ({
    lecNo: n, topic: `Bank Reconciliation Statement (BRS) (Lec ${n})`, date: 'Recorded'
  })), '-', 'Recorded');

  pushLectures('accounting', 'acc-6', [
    '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-25',
    '2026-12-26', '2026-12-28', '2026-12-29', '2026-12-30'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Final Accounts of Sole Proprietors (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  pushLectures('accounting', 'acc-7', [
    '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-04', '2027-01-05'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Rectification of Errors (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  pushLectures('accounting', 'acc-8', [
    '2027-01-06', '2027-01-07', '2027-01-08', '2027-01-09',
    '2027-01-11', '2027-01-12', '2027-01-13', '2027-01-14'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Accounts from Incomplete Records (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  pushLectures('accounting', 'acc-9', [
    '2027-01-15', '2027-01-16', '2027-01-18', '2027-01-19', '2027-01-20'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Inventories (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  pushLectures('accounting', 'acc-10', [
    { lecNo: 1, topic: 'Introduction of Partnership Accounts (1)', date: '2027-01-21' },
    { lecNo: 2, topic: 'Introduction of Partnership Accounts (2)', date: '2027-01-22' },
    { lecNo: 3, topic: 'Introduction of Partnership Accounts (3)', date: '2027-01-23' },
    { lecNo: 4, topic: 'Treatment of Goodwill (1)', date: '2027-01-25' },
    { lecNo: 5, topic: 'Treatment of Goodwill (2)', date: '2027-01-27' },
    { lecNo: 6, topic: 'Admission of New Partner (1)', date: '2027-01-28' },
    { lecNo: 7, topic: 'Admission of New Partner (2)', date: '2027-01-29' },
    { lecNo: 8, topic: 'Admission of New Partner (3)', date: '2027-01-30' },
    { lecNo: 9, topic: 'Admission of New Partner (4)', date: '2027-02-01' },
    { lecNo: 10, topic: 'Retirement & Death of Partner (1)', date: '2027-02-02' },
    { lecNo: 11, topic: 'Retirement & Death of Partner (2)', date: '2027-02-03' },
    { lecNo: 12, topic: 'Retirement & Death of Partner (3)', date: '2027-02-04' },
    { lecNo: 13, topic: 'Retirement & Death of Partner (4)', date: '2027-02-05' },
    { lecNo: 14, topic: 'Retirement & Death of Partner (5)', date: '2027-02-06' },
    { lecNo: 15, topic: 'Retirement & Death of Partner (6)', date: '2027-02-08' },
    { lecNo: 16, topic: 'Retirement & Death of Partner (7)', date: '2027-02-09' },
    { lecNo: 17, topic: 'Retirement & Death of Partner (8)', date: '2027-02-10' },
    { lecNo: 18, topic: 'Dissolution of Firm (1)', date: '2027-02-11' },
    { lecNo: 19, topic: 'Dissolution of Firm (2)', date: '2027-02-12' },
    { lecNo: 20, topic: 'Dissolution of Firm (3)', date: '2027-02-13' },
    { lecNo: 21, topic: 'Dissolution of Firm (4)', date: '2027-02-15' },
    { lecNo: 22, topic: 'Dissolution of Firm (5)', date: '2027-02-16' }
  ], '-', 'Live Session');

  pushLectures('accounting', 'acc-11', [
    '2027-02-17', '2027-02-18', '2027-02-19', '2027-02-20',
    '2027-02-22', '2027-02-23', '2027-02-24', '2027-02-25', '2027-02-26'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Financial Statements of NPO (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  pushLectures('accounting', 'acc-12', [
    { lecNo: 1, topic: 'Issue, Forfeiture and Reissue (1)', date: '2027-02-27' },
    { lecNo: 2, topic: 'Issue, Forfeiture and Reissue (2)', date: '2027-03-01' },
    { lecNo: 3, topic: 'Issue, Forfeiture and Reissue (3)', date: '2027-03-02' },
    { lecNo: 4, topic: 'Issue, Forfeiture and Reissue (4)', date: '2027-03-03' },
    { lecNo: 5, topic: 'Issue, Forfeiture and Reissue (5)', date: '2027-03-04' },
    { lecNo: 6, topic: 'Issue, Forfeiture and Reissue (6)', date: '2027-03-05' },
    { lecNo: 7, topic: 'Issue of Debentures (1)', date: '2027-03-06' },
    { lecNo: 8, topic: 'Issue of Debentures (2)', date: '2027-03-08' },
    { lecNo: 9, topic: 'Issue of Debentures (3)', date: '2027-03-09' },
    { lecNo: 10, topic: 'Bonus & Right Issue (1)', date: '2027-03-10' },
    { lecNo: 11, topic: 'Bonus & Right Issue (2)', date: '2027-03-11' },
    { lecNo: 12, topic: 'Bonus & Right Issue (3)', date: '2027-03-12' },
    { lecNo: 13, topic: 'Redemption of Preference Shares (1)', date: '2027-03-13' },
    { lecNo: 14, topic: 'Redemption of Preference Shares (2)', date: '2027-03-15' },
    { lecNo: 15, topic: 'Redemption of Preference Shares (3)', date: '2027-03-16' },
    { lecNo: 16, topic: 'Redemption of Debentures (1)', date: '2027-03-17' },
    { lecNo: 17, topic: 'Redemption of Debentures (2)', date: '2027-03-18' },
    { lecNo: 18, topic: 'Redemption of Debentures (3)', date: '2027-03-19' }
  ], '-', 'Live Session');

  pushLectures('accounting', 'acc-13', [
    '2027-03-20', '2027-03-22', '2027-03-23', '2027-03-24'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Theoretical Framework (Lec ${i + 1})`, date: d })), '-', 'Live Session');

  // ---------------- 2. BUSINESS LAWS (106 LECTURES) ----------------
  const lawFac = 'Chaitanya Jain Sir';
  const lawTime = '8:30am - 10:30am';

  pushLectures('laws', 'law-1', [{ lecNo: 1, topic: 'Part 1', date: '2026-11-16' }], lawFac, lawTime);

  pushLectures('laws', 'law-2', [
    '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-3', [
    '2026-11-21', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26',
    '2026-11-27', '2026-11-28', '2026-11-30', '2026-12-01', '2026-12-02',
    '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-07', '2026-12-08',
    '2026-12-09', '2026-12-10'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-4', [
    '2026-12-11', '2026-12-12', '2026-12-14', '2026-12-15', '2026-12-16',
    '2026-12-17', '2026-12-18', '2026-12-19', '2026-12-21', '2026-12-22',
    '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-28', '2026-12-29'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-5', [
    '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-04',
    '2027-01-05', '2027-01-06', '2027-01-07', '2027-01-08', '2027-01-09',
    '2027-01-11', '2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15',
    '2027-01-16', '2027-01-18', '2027-01-19'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-6', [
    '2027-01-20', '2027-01-21', '2027-01-22', '2027-01-23',
    '2027-01-25', '2027-01-27', '2027-01-28', '2027-01-29'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-7', [
    '2027-01-30', '2027-02-01', '2027-02-02', '2027-02-03'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  pushLectures('laws', 'law-8', [
    '2027-02-04', '2027-02-05', '2027-02-06', '2027-02-08', '2027-02-09',
    '2027-02-10', '2027-02-11', '2027-02-12', '2027-02-13', '2027-02-15',
    '2027-02-16', '2027-02-17', '2027-02-18', '2027-02-19', '2027-02-20',
    '2027-02-22', '2027-02-23', '2027-02-24', '2027-02-25', '2027-02-26',
    '2027-02-27', '2027-03-01', '2027-03-02', '2027-03-03', '2027-03-04',
    '2027-03-05', '2027-03-06', '2027-03-08', '2027-03-09', '2027-03-10',
    '2027-03-11', '2027-03-12', '2027-03-13', '2027-03-15', '2027-03-16',
    '2027-03-17', '2027-03-18', '2027-03-19'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), lawFac, lawTime);

  // ---------------- 3. QUANTITATIVE APTITUDE (96 LECTURES) ----------------
  const qaFac = 'Anurag Chauhan Sir';
  const qaTime = '6:00pm - 7:30pm';

  pushLectures('qa', 'qa-1', [
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20',
    '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27',
    '2026-11-30', '2026-12-01', '2026-12-02'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);

  pushLectures('qa', 'qa-2', [
    '2026-12-03', '2026-12-04', '2026-12-07', '2026-12-08', '2026-12-09',
    '2026-12-10', '2026-12-11', '2026-12-14', '2026-12-15', '2026-12-16'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);

  pushLectures('qa', 'qa-3', [
    '2026-12-17', '2026-12-18', '2026-12-21', '2026-12-22', '2026-12-23',
    '2026-12-24', '2026-12-25', '2026-12-28', '2026-12-29', '2026-12-30',
    '2026-12-31', '2027-01-01'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);

  pushLectures('qa', 'qa-4', [
    '2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07',
    '2027-01-08', '2027-01-11', '2027-01-12'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);

  pushLectures('qa', 'qa-5', ['2027-01-13', '2027-01-14'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-6', ['2027-01-15', '2027-01-18', '2027-01-19'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-7', ['2027-01-20', '2027-01-21'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-8', ['2027-01-22', '2027-01-25'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-9', ['2027-01-26', '2027-01-27', '2027-01-28', '2027-01-29', '2027-02-01'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-10', ['2027-02-02', '2027-02-03', '2027-02-04', '2027-02-05'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-11', ['2027-02-08', '2027-02-09', '2027-02-10', '2027-02-11', '2027-02-12', '2027-02-15'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-12', ['2027-02-16', '2027-02-17'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-13', ['2027-02-18', '2027-02-19', '2027-02-22', '2027-02-23', '2027-02-24', '2027-02-25'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-14', ['2027-02-26', '2027-03-01', '2027-03-02'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-15', ['2027-03-03', '2027-03-04', '2027-03-05', '2027-03-08', '2027-03-09'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-16', ['2027-03-10', '2027-03-11', '2027-03-12', '2027-03-15'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-17', ['2027-03-16', '2027-03-17', '2027-03-18'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-18', ['2027-03-19', '2027-03-22', '2027-03-23'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);
  pushLectures('qa', 'qa-19', ['2027-03-24', '2027-03-25', '2027-03-26', '2027-03-29'].map((d, i) => ({ lecNo: i + 1, topic: `Part ${i + 1}`, date: d })), qaFac, qaTime);

  // ---------------- 4. BUSINESS ECONOMICS (90 LECTURES) ----------------
  const ecoFac = 'Love Kaushik Sir';
  const ecoTime = '12:00pm - 1:30pm';

  pushLectures('economics', 'eco-1', [
    { lecNo: 1, topic: 'Pre-independent period', date: '2026-11-16' },
    { lecNo: 2, topic: 'Post-independent period', date: '2026-11-17' },
    { lecNo: 3, topic: 'Economic reforms of 1991', date: '2026-11-18' },
    { lecNo: 4, topic: 'NITI Aayog', date: '2026-11-19' },
    { lecNo: 5, topic: 'Current state of Indian economy', date: '2026-11-23' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-2', [
    { lecNo: 1, topic: 'Fiscal functions (1)', date: '2026-11-24' },
    { lecNo: 2, topic: 'Fiscal functions (2)', date: '2026-11-25' },
    { lecNo: 3, topic: 'Fiscal functions (3)', date: '2026-11-26' },
    { lecNo: 4, topic: 'Market failure', date: '2026-11-30' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-3', [
    { lecNo: 1, topic: 'Market failure (1)', date: '2026-12-01' },
    { lecNo: 2, topic: 'Market failure (2)', date: '2026-12-02' },
    { lecNo: 3, topic: 'Process of budget making (1)', date: '2026-12-03' },
    { lecNo: 4, topic: 'Process of budget making (2)', date: '2026-12-07' },
    { lecNo: 5, topic: 'Process of budget making (3)', date: '2026-12-08' },
    { lecNo: 6, topic: 'Fiscal policy', date: '2026-12-09' },
    { lecNo: 7, topic: 'Concept of Money Demand: Theories-1', date: '2026-12-10' },
    { lecNo: 8, topic: 'Concept of Money Demand: Theories-2', date: '2026-12-14' },
    { lecNo: 9, topic: 'Concept of Money Supply-1', date: '2026-12-15' },
    { lecNo: 10, topic: 'Concept of Money Supply-2', date: '2026-12-16' },
    { lecNo: 11, topic: 'Concept of Money Supply-3', date: '2026-12-17' },
    { lecNo: 12, topic: 'Concept of Money Supply-4', date: '2026-12-21' },
    { lecNo: 13, topic: 'Theories of International Trade', date: '2026-12-22' },
    { lecNo: 14, topic: 'Instruments of Trade Policy', date: '2026-12-23' },
    { lecNo: 15, topic: 'Trade Negotiations', date: '2026-12-24' },
    { lecNo: 16, topic: 'Exchange rate and its effects', date: '2026-12-28' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-4', [
    { lecNo: 1, topic: 'International capital movements, FDI, FPI (1)', date: '2026-12-29' },
    { lecNo: 2, topic: 'International capital movements, FDI, FPI (2)', date: '2026-12-30' },
    { lecNo: 3, topic: 'International capital movements, FDI, FPI (3)', date: '2026-12-31' },
    { lecNo: 4, topic: 'International capital movements, FDI, FPI (4)', date: '2027-01-04' },
    { lecNo: 5, topic: 'International capital movements, FDI, FPI (5)', date: '2027-01-05' },
    { lecNo: 6, topic: 'National Income Accounting (1)', date: '2027-01-06' },
    { lecNo: 7, topic: 'National Income Accounting (2)', date: '2027-01-07' },
    { lecNo: 8, topic: 'National Income Accounting (3)', date: '2027-01-11' },
    { lecNo: 9, topic: 'National Income Accounting (4)', date: '2027-01-12' },
    { lecNo: 10, topic: 'National Income Accounting (5)', date: '2027-01-13' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-5', [
    '2027-01-14', '2027-01-18', '2027-01-19', '2027-01-20', '2027-01-21',
    '2027-01-25', '2027-01-26', '2027-01-27', '2027-01-28'
  ].map((d, i) => ({ lecNo: i + 1, topic: `Keynesian Theory & National Income (${i + 1})`, date: d })), ecoFac, ecoTime);

  pushLectures('economics', 'eco-6', [
    { lecNo: 1, topic: 'Meaning of Business Economics (1)', date: '2027-02-01' },
    { lecNo: 2, topic: 'Meaning of Business Economics (2)', date: '2027-02-02' },
    { lecNo: 3, topic: 'Nature and Scope of Business Economics', date: '2027-02-03' },
    { lecNo: 4, topic: 'Basic Problems of an Economy', date: '2027-02-04' },
    { lecNo: 5, topic: 'Types of Economic System (1)', date: '2027-02-08' },
    { lecNo: 6, topic: 'Types of Economic System (2)', date: '2027-02-09' },
    { lecNo: 7, topic: 'Types of Goods, Determinants of Demand', date: '2027-02-10' },
    { lecNo: 8, topic: 'Law of Demand, Exceptions & Reasons', date: '2027-02-11' },
    { lecNo: 9, topic: 'Movement Along & Shift of Demand Curve', date: '2027-02-12' },
    { lecNo: 10, topic: 'Price Elasticity of Demand (1)', date: '2027-02-15' },
    { lecNo: 11, topic: 'Price Elasticity of Demand (2)', date: '2027-02-16' },
    { lecNo: 12, topic: 'Cross & Advertisement Elasticity', date: '2027-02-17' },
    { lecNo: 13, topic: 'Income Elasticity of Demand', date: '2027-02-18' },
    { lecNo: 14, topic: 'Utility, MU, TU & Diminishing MU', date: '2027-02-19' },
    { lecNo: 15, topic: 'Consumer Surplus', date: '2027-02-22' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-7', [
    { lecNo: 1, topic: 'Indifference Curve', date: '2027-02-23' },
    { lecNo: 2, topic: 'Budget Line', date: '2027-02-24' },
    { lecNo: 3, topic: 'Consumer Equilibrium through IC', date: '2027-02-25' },
    { lecNo: 4, topic: 'Law of Supply & Determinants', date: '2027-02-26' },
    { lecNo: 5, topic: 'Movements & Shift in Supply Curve', date: '2027-03-01' },
    { lecNo: 6, topic: 'Factors of Production', date: '2027-03-02' },
    { lecNo: 7, topic: 'Production Function, Capital Formation', date: '2027-03-03' },
    { lecNo: 8, topic: 'Returns to Scale & Variable Proportions', date: '2027-03-04' },
    { lecNo: 9, topic: 'Meaning and Types of Cost', date: '2027-03-05' },
    { lecNo: 10, topic: 'Cost Curves (1)', date: '2027-03-08' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-8', [
    { lecNo: 1, topic: 'Cost Curves (2)', date: '2027-03-09' },
    { lecNo: 2, topic: 'Cost Curves (3)', date: '2027-03-10' },
    { lecNo: 3, topic: 'Cost Curves (4)', date: '2027-03-11' },
    { lecNo: 4, topic: 'Long Run Average Cost Curve', date: '2027-03-12' },
    { lecNo: 5, topic: 'Economies and Diseconomies of Scale', date: '2027-03-15' },
    { lecNo: 6, topic: 'Types of Market', date: '2027-03-16' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-9', [
    { lecNo: 1, topic: 'Concept of Revenue', date: '2027-03-17' },
    { lecNo: 2, topic: 'Price Determination in Markets (1)', date: '2027-03-18' },
    { lecNo: 3, topic: 'Price Determination in Markets (2)', date: '2027-03-19' },
    { lecNo: 4, topic: 'Monopoly', date: '2027-03-22' },
    { lecNo: 5, topic: 'Equilibrium in Monopoly', date: '2027-03-23' },
    { lecNo: 6, topic: 'Monopolistic Competition', date: '2027-03-24' },
    { lecNo: 7, topic: 'Oligopoly', date: '2027-03-25' },
    { lecNo: 8, topic: 'Perfect Competition', date: '2027-03-26' },
    { lecNo: 9, topic: 'Meaning & Phases of Business Cycles', date: '2027-03-29' },
    { lecNo: 10, topic: 'Features & Causes of Business Cycles', date: '2027-03-30' }
  ], ecoFac, ecoTime);

  pushLectures('economics', 'eco-10', [
    { lecNo: 1, topic: 'Indian Economy Part 1', date: '2027-03-31' },
    { lecNo: 2, topic: 'Indian Economy Part 2', date: '2027-04-01' },
    { lecNo: 3, topic: 'Indian Economy Part 3', date: '2027-04-02' },
    { lecNo: 4, topic: 'Indian Economy Part 4', date: '2027-04-03' },
    { lecNo: 5, topic: 'Indian Economy Part 5', date: '2027-04-04' }
  ], ecoFac, ecoTime);

  return list;
};

// ============================================================================
// EXTRACTED LIFELONG LEARNER (https://www.lifelonglearner.in/free-resource)
// CA FOUNDATION RTP, MTP & PYQ MATRIX (4 SUBJECTS × 6 ATTEMPTS × 6 SLOTS)
// ============================================================================

const RESOURCE_ATTEMPTS = ['Sep 26', 'May 26', 'Jan 26', 'Sep 25', 'May 25', 'Jan 25'];

const RESOURCE_COLUMNS = [
  { key: 'pyq', label: 'PYQ', fullName: 'Previous Year Question Paper', type: 'PYQ' },
  { key: 'rtp', label: 'RTP', fullName: 'Revision Test Paper (ICAI BoS)', type: 'RTP' },
  { key: 'mtp1Q', label: 'MTP 1 Q', fullName: 'Mock Test Paper Series 1 - Question', type: 'MTP' },
  { key: 'mtp1Ans', label: 'MTP 1 Ans', fullName: 'Mock Test Paper Series 1 - Answers', type: 'MTP' },
  { key: 'mtp2Q', label: 'MTP 2 Q', fullName: 'Mock Test Paper Series 2 - Question', type: 'MTP' },
  { key: 'mtp2Ans', label: 'MTP 2 Ans', fullName: 'Mock Test Paper Series 2 - Answers', type: 'MTP' }
];

const buildDefaultPortalMatrix = () => {
  const matrix = {};
  SUBJECTS.forEach((subj) => {
    matrix[subj.id] = {};
    RESOURCE_ATTEMPTS.forEach((attempt) => {
      matrix[subj.id][attempt] = {};
      RESOURCE_COLUMNS.forEach((col) => {
        matrix[subj.id][attempt][col.key] = {
          id: `portal-${subj.id}-${attempt.replace(/\s+/g, '')}-${col.key}`,
          subjectId: subj.id,
          subjectName: subj.name,
          attempt,
          colKey: col.key,
          colLabel: col.label,
          fullName: `${subj.name} - ${attempt} ${col.label}`,
          type: col.type,
          portalUrl: 'https://www.lifelonglearner.in/free-resource',
          customPdfUrl: '',
          fileId: null,
          fileName: null,
          completed: false,
          marksObtained: null,
          maxMarks: 100,
          completedAt: null
        };
      });
    });
  });
  return matrix;
};

const INITIAL_FLASHCARDS = [
  {
    id: 'card-1',
    subjectId: 'accounting',
    chapterId: 'acc-1',
    concept: 'Golden Rules of Accounting',
    explanation: 'Personal: Debit the receiver, Credit the giver. Real: Debit what comes in, Credit what goes out. Nominal: Debit all expenses/losses, Credit all incomes/gains.',
    points: 'Applies to traditional classification of accounts in Journal & Ledger.',
    formulaOrSection: 'Entity Concept & Money Measurement Concept',
    question: 'Classify "Prepaid Insurance Account" under Traditional and Modern approaches.',
    revised: false
  },
  {
    id: 'card-2',
    subjectId: 'laws',
    chapterId: 'law-3',
    concept: 'Essential Elements of Partnership',
    explanation: 'An association of two or more persons based on an agreement to carry on business and share profits with mutual agency.',
    points: 'Mutual agency (cardinal principle): Every partner is both an agent and a principal.',
    formulaOrSection: 'Section 4 & Section 6 of Indian Partnership Act, 1932',
    question: 'Is sharing of profits conclusive evidence of partnership? Explain with Cox v. Hickman.',
    revised: false
  },
  {
    id: 'card-3',
    subjectId: 'qa',
    chapterId: 'qa-1',
    concept: 'Effective Rate of Interest & Future Value of Annuity',
    explanation: 'Effective rate measures actual annual interest when compounding occurs more than once a year.',
    points: 'Used heavily in Capital Budgeting, Sinking Fund, and Leasing problems.',
    formulaOrSection: 'E = (1 + i/m)^m - 1 | FV = A * [((1 + i)^n - 1) / i]',
    question: 'Find the effective rate of interest equivalent to 12% p.a. compounded quarterly.',
    revised: false
  },
  {
    id: 'card-4',
    subjectId: 'economics',
    chapterId: 'eco-3',
    concept: 'Price Elasticity of Demand (Arc & Point)',
    explanation: 'Responsiveness of quantity demanded of a good to a change in its price, ceteris paribus.',
    points: 'Mid-point (Arc) formula avoids base selection bias when price changes are large.',
    formulaOrSection: 'Ep = (ΔQ / ΔP) × (P1 + P2) / (Q1 + Q2)',
    question: 'When price falls from ₹20 to ₹16, quantity demanded rises from 100 to 140 units. Calculate Arc Elasticity.',
    revised: false
  }
];

const buildInitialData = () => {
  const lectures = buildOfficialLectures();
  const chapters = INITIAL_CHAPTERS.map((ch) => ({
    ...ch,
    completedManual: false,
    completedAt: null
  }));

  return {
    chapters,
    lectures,
    notes: [],
    dpps: [],
    exercises: [],
    customMaterials: [],
    revisionTasks: [],
    flashcards: INITIAL_FLASHCARDS,
    focusSessions: [],
    mockTests: [],
    dailyTasks: [
      { id: 'dt-1', text: 'Complete 2 Accounting lectures', completed: false },
      { id: 'dt-2', text: 'Solve 1 Business Laws DPP', completed: false },
      { id: 'dt-3', text: 'Practise 30 Quantitative Aptitude questions', completed: false },
      { id: 'dt-4', text: 'Revise 1 Business Economics chapter', completed: false }
    ],
    portalMatrix: buildDefaultPortalMatrix(),
    settings: {
      examDate: '2027-05-15',
      dailyTargetHours: 6,
      theme: 'dark',
      studentName: 'Aspirant'
    }
  };
};

// ============================================================================
// SINGLE-USER PERMANENT STORAGE KEYS & SAFE MERGE HYDRATION
// ============================================================================

const PRIMARY_STORAGE_KEY = 'ca_foundation_sampurna_may_2027_permanent_v1';
const LEGACY_KEYS = [
  'ca_sampurna_2027_v3_complete',
  'ca_sampurna_2027_v3_complete_user_aspirant'
];
const UNIFIED_SILENT_MEET_KEY = 'ca_sampurna_2027_unified_silent_meet_v1';

const loadPermanentPlannerData = () => {
  const defaults = buildInitialData();
  try {
    let raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        const legacyRaw = localStorage.getItem(k);
        if (legacyRaw) {
          raw = legacyRaw;
          break;
        }
      }
    }
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    // Preserve all 402 official lectures while merging saved statuses & custom personal lectures
    const savedLecturesMap = new Map(
      Array.isArray(parsed.lectures) ? parsed.lectures.map((l) => [l.id, l]) : []
    );
    const mergedLectures = defaults.lectures.map((defLec) => {
      const savedLec = savedLecturesMap.get(defLec.id);
      return savedLec ? { ...defLec, ...savedLec } : defLec;
    });
    const customLectures = Array.isArray(parsed.lectures)
      ? parsed.lectures.filter((l) => String(l.id).startsWith('custom-lec-'))
      : [];

    // Preserve all 50 official chapters while merging completion status
    const savedChaptersMap = new Map(
      Array.isArray(parsed.chapters) ? parsed.chapters.map((c) => [c.id, c]) : []
    );
    const mergedChapters = defaults.chapters.map((defCh) => {
      const savedCh = savedChaptersMap.get(defCh.id);
      return savedCh ? { ...defCh, ...savedCh } : defCh;
    });

    return {
      ...defaults,
      ...parsed,
      chapters: mergedChapters,
      lectures: [...mergedLectures, ...customLectures],
      notes: Array.isArray(parsed.notes) ? parsed.notes : defaults.notes,
      dpps: Array.isArray(parsed.dpps) ? parsed.dpps : defaults.dpps,
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : defaults.exercises,
      customMaterials: Array.isArray(parsed.customMaterials) ? parsed.customMaterials : [],
      revisionTasks: Array.isArray(parsed.revisionTasks) ? parsed.revisionTasks : [],
      flashcards:
        Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0
          ? parsed.flashcards
          : defaults.flashcards,
      focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
      mockTests: Array.isArray(parsed.mockTests) ? parsed.mockTests : [],
      dailyTasks:
        Array.isArray(parsed.dailyTasks) && parsed.dailyTasks.length > 0
          ? parsed.dailyTasks
          : defaults.dailyTasks,
      portalMatrix: parsed.portalMatrix || defaults.portalMatrix,
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
        studentName: String(parsed?.settings?.studentName || 'Aspirant')
          .replace(/^CA\.?\s*/i, '')
          .trim() || 'Aspirant'
      }
    };
  } catch (e) {
    console.error('Error hydrating permanent planner data:', e);
    return defaults;
  }
};

const INITIAL_UNIFIED_SILENT_MEET = {
  meetUrl: 'https://meet.google.com/landing',
  hostName: 'CA. Beeresh'
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const [appData, setAppData] = useState(() => loadPermanentPlannerData());
  const [lastSavedAt, setLastSavedAt] = useState(() =>
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date())
  );

  // Single Unified 24x7 Silent Google Meet Virtual Library
  const [unifiedSilentMeet, setUnifiedSilentMeet] = useState(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_SILENT_MEET_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.meetUrl) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_UNIFIED_SILENT_MEET;
  });

  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_SILENT_MEET_KEY, JSON.stringify(unifiedSilentMeet));
    } catch (e) {
      console.error(e);
    }
  }, [unifiedSilentMeet]);

  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeSubjectId, setActiveSubjectId] = useState('accounting');
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const todayISO = getTodayISO();
  const [selectedDashboardDate, setSelectedDashboardDate] = useState('2026-11-16');
  const [simulatedPacePerDay, setSimulatedPacePerDay] = useState(3);
  const [referenceDateISO, setReferenceDateISO] = useState(todayISO);

  // Automatically save all planner state permanently on every change
  useEffect(() => {
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(appData));
      setLastSavedAt(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(new Date())
      );
    } catch (e) {
      console.error('Error saving permanent planner state:', e);
    }
  }, [appData]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Live Exam Countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(`${appData.settings.examDate}T09:00:00+05:30`).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [appData.settings.examDate]);

  // ============================================================================
  // AUTOMATIC CASCADING PROGRESS & AI RISK PREDICTOR CALCULATIONS
  // ============================================================================

  const stats = useMemo(() => {
    const chapterStatsMap = {};
    appData.chapters.forEach((ch) => {
      const chLecs = appData.lectures.filter((l) => l.chapterId === ch.id);
      const totalLectures = chLecs.length;
      const completedLectures = chLecs.filter((l) => l.status === 'Completed').length;
      const lecturePct =
        totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
      const isCompleted =
        ch.completedManual || (totalLectures > 0 && completedLectures === totalLectures);
      const progressPct = isCompleted ? 100 : lecturePct;

      const chNotes = appData.notes.filter((n) => n.chapterId === ch.id);
      const chDpps = appData.dpps.filter((d) => d.chapterId === ch.id);
      const chEx = appData.exercises.filter((e) => e.chapterId === ch.id);

      chapterStatsMap[ch.id] = {
        ...ch,
        totalLectures,
        completedLectures,
        pendingLectures: Math.max(0, totalLectures - completedLectures),
        totalNotes: chNotes.length,
        totalDpps: chDpps.length,
        completedDpps: chDpps.filter((d) => d.completed).length,
        totalExercises: chEx.length,
        isCompleted,
        progressPct
      };
    });

    const subjectStatsMap = {};
    SUBJECTS.forEach((subj) => {
      const subjChs = appData.chapters
        .filter((c) => c.subjectId === subj.id)
        .map((c) => chapterStatsMap[c.id]);
      const totalChapters = subjChs.length;
      const completedChapters = subjChs.filter((c) => c.isCompleted).length;
      const pendingChapters = totalChapters - completedChapters;

      const subjLecs = appData.lectures.filter((l) => l.subjectId === subj.id);
      const totalLectures = subjLecs.length;
      const completedLectures = subjLecs.filter((l) => l.status === 'Completed').length;
      const completionPct =
        totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

      // Expected lectures due on or before referenceDateISO
      const datedDue = subjLecs.filter(
        (l) => l.date !== 'Recorded' && l.date <= referenceDateISO
      ).length;
      const recordedTotal = subjLecs.filter((l) => l.date === 'Recorded').length;
      const daysSinceCourseStart = Math.max(
        1,
        Math.min(
          45,
          Math.floor(
            (new Date(referenceDateISO).getTime() - new Date('2026-11-16').getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      );
      const expectedRecordedDue =
        referenceDateISO >= '2026-11-16'
          ? Math.round((daysSinceCourseStart / 45) * recordedTotal)
          : 0;
      const expectedLecturesDue = Math.min(totalLectures, datedDue + expectedRecordedDue);
      const backlogLectures = Math.max(0, expectedLecturesDue - completedLectures);
      const paceRatio =
        expectedLecturesDue > 0 ? Math.round((completedLectures / expectedLecturesDue) * 100) : 100;

      let riskStatus = 'SAFE';
      if (expectedLecturesDue > 0) {
        if (paceRatio < 65 || backlogLectures >= 8) riskStatus = 'AT RISK';
        else if (paceRatio < 88 || backlogLectures >= 3) riskStatus = 'MODERATE RISK';
      }

      subjectStatsMap[subj.id] = {
        ...subj,
        totalChapters,
        completedChapters,
        pendingChapters,
        totalLectures,
        completedLectures,
        pendingLectures: totalLectures - completedLectures,
        completionPct,
        expectedLecturesDue,
        backlogLectures,
        paceRatio,
        riskStatus
      };
    });

    const totalChapters = appData.chapters.length;
    const completedChapters = Object.values(chapterStatsMap).filter((c) => c.isCompleted).length;
    const pendingChapters = totalChapters - completedChapters;
    const totalLectures = appData.lectures.length;
    const completedLectures = appData.lectures.filter((l) => l.status === 'Completed').length;
    const pendingLectures = totalLectures - completedLectures;
    const overallPct =
      totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    const totalExpectedDue = Object.values(subjectStatsMap).reduce(
      (acc, s) => acc + s.expectedLecturesDue,
      0
    );
    const totalBacklogDue = Math.max(0, totalExpectedDue - completedLectures);
    const overallPaceRatio =
      totalExpectedDue > 0 ? Math.round((completedLectures / totalExpectedDue) * 100) : 100;

    let overallRisk = 'SAFE';
    if (totalExpectedDue > 0) {
      if (overallPaceRatio < 65 || totalBacklogDue >= 15) overallRisk = 'AT RISK';
      else if (overallPaceRatio < 88 || totalBacklogDue >= 6) overallRisk = 'MODERATE RISK';
    }

    const daysLeftToExam = Math.max(
      1,
      Math.ceil(
        (new Date(appData.settings.examDate).getTime() - new Date(referenceDateISO).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const requiredDailyVelocity = (pendingLectures / daysLeftToExam).toFixed(1);
    const daysNeededAtSimulatedPace = Math.ceil(
      pendingLectures / Math.max(0.5, simulatedPacePerDay)
    );
    const projectedCompletionDate = addDaysISO(referenceDateISO, daysNeededAtSimulatedPace);

    return {
      chapterStatsMap,
      subjectStatsMap,
      totalChapters,
      completedChapters,
      pendingChapters,
      totalLectures,
      completedLectures,
      pendingLectures,
      overallPct,
      totalExpectedDue,
      totalBacklogDue,
      overallPaceRatio,
      overallRisk,
      daysLeftToExam,
      requiredDailyVelocity,
      projectedCompletionDate
    };
  }, [appData, referenceDateISO, simulatedPacePerDay]);

  // ============================================================================
  // LECTURE & CHAPTER MUTATION HANDLERS
  // ============================================================================

  const createRevisionStagesForChapter = (chapterId, existingRevisions) => {
    const alreadyExists = existingRevisions.some((r) => r.chapterId === chapterId);
    if (alreadyExists) return existingRevisions;
    const baseDate = todayISO;
    return [
      ...existingRevisions,
      {
        id: `rev-${chapterId}-1`,
        chapterId,
        stage: 1,
        label: 'Revision 1 (After 1 Day)',
        dueDate: addDaysISO(baseDate, 1),
        completed: false
      },
      {
        id: `rev-${chapterId}-2`,
        chapterId,
        stage: 2,
        label: 'Revision 2 (After 7 Days)',
        dueDate: addDaysISO(baseDate, 7),
        completed: false
      },
      {
        id: `rev-${chapterId}-3`,
        chapterId,
        stage: 3,
        label: 'Revision 3 (After 30 Days)',
        dueDate: addDaysISO(baseDate, 30),
        completed: false
      }
    ];
  };

  const toggleLectureStatus = (lectureId, nextStatus = null) => {
    setAppData((prev) => {
      const targetLec = prev.lectures.find((l) => l.id === lectureId);
      if (!targetLec) return prev;
      const resolvedStatus =
        nextStatus || (targetLec.status === 'Completed' ? 'Pending' : 'Completed');

      const updatedLectures = prev.lectures.map((l) =>
        l.id === lectureId ? { ...l, status: resolvedStatus } : l
      );

      const chLectures = updatedLectures.filter((l) => l.chapterId === targetLec.chapterId);
      const allChDone =
        chLectures.length > 0 && chLectures.every((l) => l.status === 'Completed');

      const updatedChapters = prev.chapters.map((c) =>
        c.id === targetLec.chapterId
          ? {
              ...c,
              completedManual: allChDone ? true : c.completedManual,
              completedAt: allChDone ? todayISO : c.completedAt
            }
          : c
      );

      const updatedRevisions = allChDone
        ? createRevisionStagesForChapter(targetLec.chapterId, prev.revisionTasks)
        : prev.revisionTasks;

      return {
        ...prev,
        lectures: updatedLectures,
        chapters: updatedChapters,
        revisionTasks: updatedRevisions
      };
    });
  };

  const toggleChapterCompleteManual = (chapterId) => {
    setAppData((prev) => {
      const ch = prev.chapters.find((c) => c.id === chapterId);
      if (!ch) return prev;
      const nextDone = !ch.completedManual;

      const updatedChapters = prev.chapters.map((c) =>
        c.id === chapterId
          ? { ...c, completedManual: nextDone, completedAt: nextDone ? todayISO : null }
          : c
      );

      const updatedLectures = prev.lectures.map((l) =>
        l.chapterId === chapterId
          ? { ...l, status: nextDone ? 'Completed' : 'Pending' }
          : l
      );

      const updatedRevisions = nextDone
        ? createRevisionStagesForChapter(chapterId, prev.revisionTasks)
        : prev.revisionTasks;

      return {
        ...prev,
        chapters: updatedChapters,
        lectures: updatedLectures,
        revisionTasks: updatedRevisions
      };
    });
    showToast('Chapter progress updated & saved!');
  };

  const openSubjectDashboard = (subjectId) => {
    setActiveSubjectId(subjectId);
    setActiveChapterId(null);
    setActiveNav(`subject-${subjectId}`);
    setMobileMenuOpen(false);
  };

  const openChapterWorkspace = (chapterId) => {
    const ch = appData.chapters.find((c) => c.id === chapterId);
    if (ch) setActiveSubjectId(ch.subjectId);
    setActiveChapterId(chapterId);
    setActiveNav('chapter-workspace');
    setMobileMenuOpen(false);
  };

  const isDark = appData.settings.theme !== 'light';
  const cleanStudentName = String(appData.settings.studentName || 'Aspirant')
    .replace(/^CA\.?\s*/i, '')
    .trim();

  // ============================================================================
  // SIDEBAR NAVIGATION ITEMS
  // ============================================================================

  const navItems = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: '2. Lecture Schedule', icon: Calendar },
    { id: 'tracker', label: '3. Syllabus Tracker', icon: CheckCircle2 },
    {
      id: 'subjects-group',
      label: '4. Subjects',
      icon: BookOpen,
      children: SUBJECTS.map((s) => ({
        id: `subject-${s.id}`,
        subjectId: s.id,
        label: s.name
      }))
    },
    { id: 'materials', label: '5. Study Materials', icon: FolderOpen },
    { id: 'revision', label: '6. Revision Centre', icon: RefreshCw },
    { id: 'timer', label: '7. Focus Timer', icon: Timer },
    { id: 'mtp-rtp', label: '8. MTP & RTP', icon: Award },
    { id: 'backlog', label: '9. Backlog Manager', icon: AlertTriangle },
    { id: 'analytics', label: '10. Analytics', icon: BarChart3 },
    { id: 'silent-meet', label: '11. Silent Study Meet', icon: Video },
    { id: 'settings', label: '12. Settings', icon: Settings }
  ];

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? 'bg-[#0b0b0e] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      } font-sans selection:bg-purple-600 selection:text-white`}
    >
      <style>{`
        @keyframes viewEnter {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-view-enter {
          animation: viewEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glow-emerald {
          box-shadow: 0 0 35px -8px rgba(16, 185, 129, 0.25);
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-purple-400/30 animate-view-enter">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200 ${
          isDark ? 'bg-[#111116] border-[#23232c]' : 'bg-white border-zinc-200'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'} ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-[#23232c]">
          {!sidebarCollapsed && (
            <div className="truncate">
              <div className="text-xs font-black tracking-wider text-purple-400 uppercase">
                CA FOUNDATION
              </div>
              <div className="text-sm font-extrabold text-white truncate">
                SAMPURNA MAY 2027
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hidden lg:inline-flex"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              return (
                <div key={item.id} className="pt-2 pb-1">
                  {!sidebarCollapsed && (
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.label}</span>
                    </div>
                  )}
                  <div className="mt-1 space-y-1">
                    {item.children.map((sub) => {
                      const isSubActive =
                        activeNav === sub.id ||
                        (activeNav === 'chapter-workspace' && activeSubjectId === sub.subjectId);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => openSubjectDashboard(sub.subjectId)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isSubActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                              : 'text-zinc-400 hover:bg-[#1b1b24] hover:text-zinc-200'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{sub.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                    : 'text-zinc-400 hover:bg-[#1b1b24] hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3 m-3 rounded-xl bg-[#16161d] border border-[#262632] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-zinc-400">Overall Syllabus</span>
              <span className="text-purple-400">{stats.overallPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${stats.overallPct}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-500">
              {stats.completedLectures} / {stats.totalLectures} Lectures Done
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header
          className={`sticky top-0 z-30 px-4 sm:px-6 py-3.5 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-3 ${
            isDark
              ? 'bg-[#0b0b0e]/90 border-[#22222b]'
              : 'bg-white/90 border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-[#181820] border border-[#2a2a36] text-zinc-300 lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-white">
                  CA FOUNDATION – SAMPURNA MAY 2027
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Save className="w-3 h-3" /> Auto-Saved ({lastSavedAt})
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Plan Smart. Study Consistently. Become a CA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-[#16161f] border border-[#292936] text-xs font-bold text-purple-300">
              CA. {cleanStudentName}
            </div>
            <button
              onClick={() =>
                setAppData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    theme: prev.settings.theme === 'light' ? 'dark' : 'light'
                  }
                }))
              }
              className="p-2 rounded-xl bg-[#16161f] border border-[#292936] text-zinc-300 hover:text-white"
              title="Toggle Dark / Light Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Active View Switcher */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              appData={appData}
              setAppData={setAppData}
              stats={stats}
              countdown={countdown}
              todayISO={todayISO}
              selectedDashboardDate={selectedDashboardDate}
              setSelectedDashboardDate={setSelectedDashboardDate}
              referenceDateISO={referenceDateISO}
              setReferenceDateISO={setReferenceDateISO}
              simulatedPacePerDay={simulatedPacePerDay}
              setSimulatedPacePerDay={setSimulatedPacePerDay}
              openSubjectDashboard={openSubjectDashboard}
              setActiveNav={setActiveNav}
              toggleLectureStatus={toggleLectureStatus}
              showToast={showToast}
            />
          )}

          {activeNav.startsWith('subject-') && (
            <SubjectDashboardView
              subjectId={activeNav.replace('subject-', '')}
              stats={stats}
              openChapterWorkspace={openChapterWorkspace}
              toggleChapterCompleteManual={toggleChapterCompleteManual}
            />
          )}

          {activeNav === 'chapter-workspace' && activeChapterId && (
            <ChapterWorkspaceView
              chapterId={activeChapterId}
              appData={appData}
              setAppData={setAppData}
              stats={stats}
              toggleLectureStatus={toggleLectureStatus}
              toggleChapterCompleteManual={toggleChapterCompleteManual}
              openSubjectDashboard={openSubjectDashboard}
              showToast={showToast}
            />
          )}

          {activeNav === 'schedule' && (
            <LectureScheduleView
              appData={appData}
              setAppData={setAppData}
              toggleLectureStatus={toggleLectureStatus}
              showToast={showToast}
            />
          )}

          {activeNav === 'tracker' && <SyllabusTrackerView stats={stats} />}

          {activeNav === 'materials' && (
            <StudyMaterialsView
              appData={appData}
              setAppData={setAppData}
              showToast={showToast}
            />
          )}

          {activeNav === 'revision' && (
            <RevisionCentreView
              appData={appData}
              setAppData={setAppData}
              showToast={showToast}
            />
          )}

          {activeNav === 'timer' && (
            <FocusTimerView
              appData={appData}
              setAppData={setAppData}
              todayISO={todayISO}
              showToast={showToast}
            />
          )}

          {activeNav === 'mtp-rtp' && (
            <MtpRtpView
              appData={appData}
              setAppData={setAppData}
              showToast={showToast}
            />
          )}

          {activeNav === 'backlog' && (
            <BacklogManagerView
              appData={appData}
              setAppData={setAppData}
              referenceDateISO={referenceDateISO}
              toggleLectureStatus={toggleLectureStatus}
              showToast={showToast}
            />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsView appData={appData} stats={stats} todayISO={todayISO} />
          )}

          {activeNav === 'silent-meet' && (
            <GoogleMeetRoomView
              unifiedSilentMeet={unifiedSilentMeet}
              setUnifiedSilentMeet={setUnifiedSilentMeet}
              showToast={showToast}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              appData={appData}
              setAppData={setAppData}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// 1. MAIN DASHBOARD VIEW (WITH AI PREPARATION RISK PREDICTOR)
// ============================================================================

function DashboardView({
  appData,
  setAppData,
  stats,
  countdown,
  todayISO,
  selectedDashboardDate,
  setSelectedDashboardDate,
  referenceDateISO,
  setReferenceDateISO,
  simulatedPacePerDay,
  setSimulatedPacePerDay,
  openSubjectDashboard,
  setActiveNav,
  toggleLectureStatus,
  showToast
}) {
  const [newTaskText, setNewTaskText] = useState('');

  const cleanName = String(appData.settings.studentName || 'Aspirant')
    .replace(/^CA\.?\s*/i, '')
    .trim();

  const todaysLectures = appData.lectures.filter((l) => l.date === selectedDashboardDate);
  const pendingDpps = appData.dpps.filter((d) => !d.completed);
  const dueRevisions = appData.revisionTasks.filter((r) => !r.completed);

  const completedDailyTasks = appData.dailyTasks.filter((t) => t.completed).length;
  const dailyMissionPct =
    appData.dailyTasks.length > 0
      ? Math.round((completedDailyTasks / appData.dailyTasks.length) * 100)
      : 0;

  const handleAddDailyTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setAppData((prev) => ({
      ...prev,
      dailyTasks: [
        ...prev.dailyTasks,
        { id: `dt-${Date.now()}`, text: newTaskText.trim(), completed: false }
      ]
    }));
    setNewTaskText('');
    showToast('Daily mission task added!');
  };

  const riskBadgeStyle =
    stats.overallRisk === 'SAFE'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
      : stats.overallRisk === 'MODERATE RISK'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/40';

  return (
    <div className="space-y-6 animate-view-enter">
      {/* Top Section: Welcome & Exam Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#141418] border border-[#272730] flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <span>Today: {formatDateDDMMMYYYY(todayISO)}</span>
              <span>•</span>
              <span>Daily Study Target: {appData.settings.dailyTargetHours} Hours</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Welcome back, <span className="text-purple-400">CA. {cleanName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              CA Foundation Sampurna May 2027 • Stay consistent with your daily lectures, DPPs, and spaced revisions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: 'Lecture Schedule', nav: 'schedule', icon: Calendar },
              { label: 'Focus Timer', nav: 'timer', icon: Timer },
              { label: 'Revision Centre', nav: 'revision', icon: RefreshCw },
              { label: 'Study Materials', nav: 'materials', icon: FolderOpen }
            ].map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.nav}
                  onClick={() => setActiveNav(q.nav)}
                  className="p-3 rounded-xl bg-[#1c1c23] hover:bg-purple-600/20 border border-[#2b2b36] hover:border-purple-500/50 flex items-center gap-2.5 text-xs font-bold text-zinc-200 transition-all"
                >
                  <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Countdown Widget */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-purple-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
              May 2027 Exam Countdown
            </span>
            <span className="text-[11px] text-zinc-400">
              {formatDateDDMMMYYYY(appData.settings.examDate)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 my-4 text-center">
            {[
              { label: 'Days', val: countdown.days },
              { label: 'Hours', val: countdown.hours },
              { label: 'Mins', val: countdown.minutes },
              { label: 'Secs', val: countdown.seconds }
            ].map((item) => (
              <div
                key={item.label}
                className="p-2.5 rounded-xl bg-[#1c1c24] border border-[#2c2c38]"
              >
                <div className="text-xl sm:text-2xl font-black text-white">{item.val}</div>
                <div className="text-[10px] font-bold uppercase text-zinc-400">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-emerald-400 font-semibold text-center">
            "Small daily discipline compounds into Chartered Accountancy success."
          </p>
        </div>
      </div>

      {/* Preparation Overview: 4 Subject Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Subject Preparation Overview (Click a Card to Open Chapter Dashboard)
          </h2>
          <span className="text-xs font-bold text-purple-400">
            Overall Completion: {stats.overallPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBJECTS.map((subj) => {
            const sStat = stats.subjectStatsMap[subj.id];
            return (
              <div
                key={subj.id}
                onClick={() => openSubjectDashboard(subj.id)}
                className="cursor-pointer p-5 rounded-2xl bg-[#141418] hover:bg-[#191920] border border-[#272732] hover:border-purple-500/60 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-600/20 text-purple-300">
                    {subj.code}
                  </span>
                  <span className="text-sm font-black text-purple-400">
                    {sStat.completionPct}%
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white">{subj.name}</h3>

                <div className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>
                    Chapters: <strong className="text-white">{sStat.completedChapters}</strong> /{' '}
                    {sStat.totalChapters}
                  </span>
                  <span>
                    Lectures: <strong className="text-white">{sStat.completedLectures}</strong> /{' '}
                    {sStat.totalLectures}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${sStat.completionPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preparation Pace & Risk Predictor ("Safe or At Risk" Engine) */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#282834] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.overallRisk === 'SAFE' ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Preparation Pace & Risk Predictor
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black border ${riskBadgeStyle}`}
                >
                  {stats.overallRisk}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Compares your {stats.completedLectures} completed lectures against{' '}
                {stats.totalExpectedDue} scheduled lectures due by{' '}
                {formatDateDDMMMYYYY(referenceDateISO)}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Check Status As Of:</span>
            <input
              type="date"
              value={referenceDateISO}
              onChange={(e) => setReferenceDateISO(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUBJECTS.map((subj) => {
            const st = stats.subjectStatsMap[subj.id];
            const badge =
              st.riskStatus === 'SAFE'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : st.riskStatus === 'MODERATE RISK'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
            return (
              <div
                key={subj.id}
                className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{subj.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badge}`}>
                    {st.riskStatus}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Done: <strong className="text-white">{st.completedLectures}</strong> | Expected Due:{' '}
                  <strong className="text-purple-300">{st.expectedLecturesDue}</strong>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Backlog: <strong className="text-rose-400">{st.backlogLectures} lectures</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* What-If Pace Simulator */}
        <div className="pt-3 border-t border-[#252530] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-zinc-300 font-semibold">
              What-If Pace Simulator: If I complete{' '}
              <strong className="text-purple-400">{simulatedPacePerDay} lectures/day</strong>:
            </span>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={simulatedPacePerDay}
              onChange={(e) => setSimulatedPacePerDay(Number(e.target.value))}
              className="w-28 accent-purple-500"
            />
          </div>
          <div className="text-zinc-300">
            Projected Finish:{' '}
            <strong className="text-emerald-400">
              {formatDateDDMMMYYYY(stats.projectedCompletionDate)}
            </strong>{' '}
            (Required Velocity: <strong className="text-white">{stats.requiredDailyVelocity}</strong>{' '}
            lecs/day)
          </div>
        </div>
      </div>

      {/* Today's Tasks & Daily Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Scheduled Lectures */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white">Today's Scheduled Lectures</h3>
              <p className="text-xs text-zinc-400">
                Showing schedule for {formatDateDDMMMYYYY(selectedDashboardDate)}
              </p>
            </div>
            <input
              type="date"
              value={selectedDashboardDate}
              onChange={(e) => setSelectedDashboardDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
          </div>

          {todaysLectures.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#1b1b22] border border-[#292934] text-xs text-zinc-400">
              No live lectures scheduled on {formatDateDDMMMYYYY(selectedDashboardDate)}. Select{' '}
              <button
                onClick={() => setSelectedDashboardDate('2026-11-16')}
                className="text-purple-400 underline font-bold"
              >
                16 Nov 2026
              </button>{' '}
              or another batch date to view scheduled classes.
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysLectures.map((lec) => {
                const subj = SUBJECTS.find((s) => s.id === lec.subjectId);
                const ch = appData.chapters.find((c) => c.id === lec.chapterId);
                const isDone = lec.status === 'Completed';
                return (
                  <div
                    key={lec.id}
                    className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-purple-400 uppercase">
                        {subj?.name} • {lec.timing} • {lec.faculty}
                      </div>
                      <div className="text-xs font-extrabold text-white truncate">
                        {ch?.name} — Lec {lec.lectureNumber} ({lec.topic})
                      </div>
                    </div>
                    <button
                      onClick={() => toggleLectureStatus(lec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#252530] hover:bg-purple-600 text-zinc-200'
                      }`}
                    >
                      {isDone ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            <div className="p-3 rounded-xl bg-[#1b1b22] border border-[#292934]">
              <div className="text-lg font-black text-purple-400">{stats.pendingLectures}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Pending Lectures</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1b1b22] border border-[#292934]">
              <div className="text-lg font-black text-amber-400">{pendingDpps.length}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Pending DPPs</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1b1b22] border border-[#292934]">
              <div className="text-lg font-black text-emerald-400">{dueRevisions.length}</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Revision Tasks</div>
            </div>
          </div>
        </div>

        {/* 11. Daily Mission Target System */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Daily Mission</h3>
              <p className="text-xs text-zinc-400">Your daily study targets & checklist</p>
            </div>
            <span className="text-sm font-black text-emerald-400">{dailyMissionPct}% Done</span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${dailyMissionPct}%` }}
            />
          </div>

          <form onSubmit={handleAddDailyTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add task e.g. Complete 2 Accounting lectures..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {appData.dailyTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex items-center justify-between gap-2"
              >
                <button
                  onClick={() =>
                    setAppData((prev) => ({
                      ...prev,
                      dailyTasks: prev.dailyTasks.map((t) =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      )
                    }))
                  }
                  className="flex items-center gap-2.5 text-left flex-1"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                    }`}
                  >
                    {task.text}
                  </span>
                </button>
                <button
                  onClick={() =>
                    setAppData((prev) => ({
                      ...prev,
                      dailyTasks: prev.dailyTasks.filter((t) => t.id !== task.id)
                    }))
                  }
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. SUBJECT-WISE CHAPTER DASHBOARD (4 CARDS PER ROW DESKTOP, DARK & PURPLE)
// ============================================================================

function SubjectDashboardView({
  subjectId,
  stats,
  openChapterWorkspace,
  toggleChapterCompleteManual
}) {
  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const sStat = stats.subjectStatsMap[subject.id];
  const chapters = Object.values(stats.chapterStatsMap).filter(
    (c) => c.subjectId === subject.id
  );

  return (
    <div className="space-y-6 animate-view-enter">
      {/* Subject Header Banner */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
            {subject.code} • {subject.faculty} ({subject.defaultTiming})
          </div>
          <h1 className="text-2xl font-black text-white mt-1">{subject.name} — Chapter Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {sStat.completedChapters} of {sStat.totalChapters} Chapters Completed •{' '}
            {sStat.completedLectures} of {sStat.totalLectures} Lectures Completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-purple-400">{sStat.completionPct}%</div>
          <div className="text-[11px] text-zinc-400">Subject Completion</div>
        </div>
      </div>

      {/* Responsive Chapter Cards Grid: 4 Desktop, 2 Tablet, 1 Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chapters.map((ch) => (
          <div
            key={ch.id}
            onClick={() => openChapterWorkspace(ch.id)}
            className="cursor-pointer p-5 rounded-2xl bg-[#121216] hover:bg-[#17171d] border border-[#262630] hover:border-purple-500/60 transition-all flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-600/20 text-purple-300">
                  Chapter {ch.number}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChapterCompleteManual(ch.id);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    ch.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  {ch.isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-wide leading-snug">
                {ch.name}
              </h3>

              {/* Purple Resource Statistics Line */}
              <div className="text-[11px] font-bold text-purple-400 pt-1">
                {ch.totalLectures} Lectures | {ch.totalNotes} Notes | {ch.totalDpps} DPP |{' '}
                {ch.totalExercises} Exercises
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-zinc-400">Progress</span>
                <span className="text-white">{ch.progressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${ch.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 2B. INDIVIDUAL CHAPTER WORKSPACE (5 TABS: LECTURES, NOTES, DPP, EXERCISES, REVISION)
// ============================================================================

function ChapterWorkspaceView({
  chapterId,
  appData,
  setAppData,
  stats,
  toggleLectureStatus,
  toggleChapterCompleteManual,
  openSubjectDashboard,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('lectures');
  const chStat = stats.chapterStatsMap[chapterId];
  const subject = SUBJECTS.find((s) => s.id === chStat?.subjectId);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [dppTitle, setDppTitle] = useState('');
  const [dppMarks, setDppMarks] = useState('');
  const [exTitle, setExTitle] = useState('');
  const [exAttempted, setExAttempted] = useState('');
  const [exCorrect, setExCorrect] = useState('');

  if (!chStat) return null;

  const chLectures = appData.lectures.filter((l) => l.chapterId === chapterId);
  const chNotes = appData.notes.filter((n) => n.chapterId === chapterId);
  const chDpps = appData.dpps.filter((d) => d.chapterId === chapterId);
  const chExercises = appData.exercises.filter((e) => e.chapterId === chapterId);
  const chRevisions = appData.revisionTasks.filter((r) => r.chapterId === chapterId);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      subjectId: chStat.subjectId,
      chapterId,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: getTodayISO()
    };
    setAppData((prev) => ({ ...prev, notes: [...prev.notes, newNote] }));
    setNoteTitle('');
    setNoteContent('');
    showToast('Chapter note saved!');
  };

  const handleAddDpp = (e) => {
    e.preventDefault();
    if (!dppTitle.trim()) return;
    const newDpp = {
      id: `dpp-${Date.now()}`,
      subjectId: chStat.subjectId,
      chapterId,
      title: dppTitle.trim(),
      marks: dppMarks || '-',
      completed: false
    };
    setAppData((prev) => ({ ...prev, dpps: [...prev.dpps, newDpp] }));
    setDppTitle('');
    setDppMarks('');
    showToast('DPP added to chapter!');
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exTitle.trim()) return;
    const att = Number(exAttempted) || 0;
    const corr = Number(exCorrect) || 0;
    const newEx = {
      id: `ex-${Date.now()}`,
      subjectId: chStat.subjectId,
      chapterId,
      title: exTitle.trim(),
      attempted: att,
      correct: corr,
      completed: true
    };
    setAppData((prev) => ({ ...prev, exercises: [...prev.exercises, newEx] }));
    setExTitle('');
    setExAttempted('');
    setExCorrect('');
    showToast('Practice exercise recorded!');
  };

  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => openSubjectDashboard(chStat.subjectId)}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {subject?.name}
          </button>

          <button
            onClick={() => toggleChapterCompleteManual(chapterId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              chStat.isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {chStat.isCompleted ? 'Chapter Completed ✓' : 'Mark Entire Chapter Completed'}
          </button>
        </div>

        <div>
          <div className="text-xs font-bold text-purple-400 uppercase">
            {subject?.name} • Chapter {chStat.number}
          </div>
          <h1 className="text-2xl font-black text-white mt-0.5">{chStat.name}</h1>
          <div className="text-xs text-zinc-400 mt-1">
            {chStat.completedLectures} / {chStat.totalLectures} Lectures Completed ({chStat.progressPct}%)
          </div>
        </div>

        {/* 5 Workspace Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#252530]">
          {[
            { id: 'lectures', label: `1. Lectures (${chLectures.length})` },
            { id: 'notes', label: `2. Notes (${chNotes.length})` },
            { id: 'dpp', label: `3. DPP (${chDpps.length})` },
            { id: 'exercises', label: `4. Exercises (${chExercises.length})` },
            { id: 'revision', label: `5. Revision (${chRevisions.length})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1c1c24] text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Lectures */}
      {activeTab === 'lectures' && (
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-3">
          {chLectures.map((lec) => {
            const isDone = lec.status === 'Completed';
            return (
              <div
                key={lec.id}
                className="p-4 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-extrabold text-white">
                    Lecture {lec.lectureNumber}: {lec.topic}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Date: <span className="text-purple-300">{formatDateDDMMMYYYY(lec.date)}</span> •
                    Timing: {lec.timing} • Faculty: {lec.faculty}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={lec.status}
                    onChange={(e) => toggleLectureStatus(lec.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs font-bold text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Missed">Missed</option>
                    <option value="Recorded">Recorded</option>
                  </select>
                  <button
                    onClick={() => toggleLectureStatus(lec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {isDone ? 'Completed ✓' : 'Complete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Notes */}
      {activeTab === 'notes' && (
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
          <form onSubmit={handleAddNote} className="space-y-3">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note Title (e.g., Summary of Accounting Standards)"
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write personal notes, key points, or paste PDF link..."
              className="w-full px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              + Save Chapter Note
            </button>
          </form>

          <div className="space-y-2.5">
            {chNotes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-[#1b1b22] border border-[#2b2b36]">
                <div className="text-xs font-bold text-white">{n.title}</div>
                <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: DPP */}
      {activeTab === 'dpp' && (
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
          <form onSubmit={handleAddDpp} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={dppTitle}
              onChange={(e) => setDppTitle(e.target.value)}
              placeholder="DPP Name (e.g., DPP #1)"
              className="flex-1 px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <input
              type="text"
              value={dppMarks}
              onChange={(e) => setDppMarks(e.target.value)}
              placeholder="Marks (e.g., 18/20)"
              className="w-36 px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              + Add DPP
            </button>
          </form>

          <div className="space-y-2">
            {chDpps.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{d.title}</div>
                  <div className="text-[11px] text-zinc-400">Marks: {d.marks}</div>
                </div>
                <button
                  onClick={() =>
                    setAppData((prev) => ({
                      ...prev,
                      dpps: prev.dpps.map((item) =>
                        item.id === d.id ? { ...item, completed: !item.completed } : item
                      )
                    }))
                  }
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    d.completed ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {d.completed ? 'Completed' : 'Pending'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Exercises */}
      {activeTab === 'exercises' && (
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
          <form onSubmit={handleAddExercise} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={exTitle}
              onChange={(e) => setExTitle(e.target.value)}
              placeholder="Exercise Set Name"
              className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <input
              type="number"
              value={exAttempted}
              onChange={(e) => setExAttempted(e.target.value)}
              placeholder="Questions Attempted"
              className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <input
              type="number"
              value={exCorrect}
              onChange={(e) => setExCorrect(e.target.value)}
              placeholder="Correct Answers"
              className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              + Log Practice Set
            </button>
          </form>

          <div className="space-y-2">
            {chExercises.map((ex) => {
              const acc = ex.attempted > 0 ? Math.round((ex.correct / ex.attempted) * 100) : 0;
              return (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex items-center justify-between"
                >
                  <div className="text-xs font-bold text-white">{ex.title}</div>
                  <div className="text-xs text-purple-300 font-bold">
                    {ex.correct}/{ex.attempted} Correct ({acc}% Accuracy)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Revision */}
      {activeTab === 'revision' && (
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-3">
          {chRevisions.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Complete all lectures or mark the chapter completed to automatically generate 1-Day, 7-Day, and 30-Day revision stages.
            </p>
          ) : (
            chRevisions.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{r.label}</div>
                  <div className="text-[11px] text-zinc-400">
                    Scheduled: {formatDateDDMMMYYYY(r.dueDate)}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setAppData((prev) => ({
                      ...prev,
                      revisionTasks: prev.revisionTasks.map((item) =>
                        item.id === r.id ? { ...item, completed: !item.completed } : item
                      )
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    r.completed ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                  }`}
                >
                  {r.completed ? 'Revised ✓' : 'Mark Revised'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. LECTURE SCHEDULE TIMETABLE (402 OFFICIAL LECTURES + FILTERS & PERSONAL ADD)
// ============================================================================

function LectureScheduleView({ appData, setAppData, toggleLectureStatus, showToast }) {
  const [viewMode, setViewMode] = useState('daily');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-11-16');

  const [newLecSubject, setNewLecSubject] = useState('accounting');
  const [newLecChapter, setNewLecChapter] = useState('acc-1');
  const [newLecTopic, setNewLecTopic] = useState('');
  const [newLecDate, setNewLecDate] = useState('2026-11-16');

  const filteredLectures = useMemo(() => {
    return appData.lectures.filter((lec) => {
      if (subjectFilter !== 'all' && lec.subjectId !== subjectFilter) return false;
      if (statusFilter !== 'all' && lec.status !== statusFilter) return false;
      if (viewMode === 'daily' && selectedDate && lec.date !== selectedDate) return false;
      if (searchQuery.trim()) {
        const ch = appData.chapters.find((c) => c.id === lec.chapterId);
        const q = searchQuery.toLowerCase();
        const matchTopic = lec.topic.toLowerCase().includes(q);
        const matchCh = ch?.name.toLowerCase().includes(q);
        if (!matchTopic && !matchCh) return false;
      }
      return true;
    });
  }, [appData.lectures, appData.chapters, subjectFilter, statusFilter, viewMode, selectedDate, searchQuery]);

  const handleAddPersonalLecture = (e) => {
    e.preventDefault();
    if (!newLecTopic.trim()) return;
    const subj = SUBJECTS.find((s) => s.id === newLecSubject);
    const customLec = {
      id: `custom-lec-${Date.now()}`,
      subjectId: newLecSubject,
      chapterId: newLecChapter,
      lectureNumber: 99,
      topic: newLecTopic.trim(),
      date: newLecDate || 'Recorded',
      faculty: subj?.faculty || 'Self Study',
      timing: subj?.defaultTiming || 'Custom',
      isRecorded: false,
      status: 'Pending'
    };
    setAppData((prev) => ({ ...prev, lectures: [...prev.lectures, customLec] }));
    setNewLecTopic('');
    showToast('Personal lecture added to schedule!');
  };

  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white">Complete Official Lecture Schedule</h1>
            <p className="text-xs text-zinc-400">
              All 402 lectures imported from Accounting, Business Laws, Quantitative Aptitude & Business Economics PDFs
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'daily', label: 'Daily Schedule' },
              { id: 'weekly', label: 'All / Weekly List' },
              { id: 'monthly', label: 'Recorded Lectures' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setViewMode(v.id);
                  if (v.id === 'monthly') setSelectedDate('Recorded');
                  else if (selectedDate === 'Recorded') setSelectedDate('2026-11-16');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                  viewMode === v.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1c1c24] text-zinc-400 hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapter or lecture topic..."
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          >
            <option value="all">All 4 Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Missed">Missed</option>
            <option value="Recorded">Recorded</option>
          </select>

          {viewMode === 'daily' && (
            <input
              type="date"
              value={selectedDate === 'Recorded' ? '2026-11-16' : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
            />
          )}
        </div>

        {/* Add Personal Lecture */}
        <form
          onSubmit={handleAddPersonalLecture}
          className="pt-3 border-t border-[#252530] grid grid-cols-1 sm:grid-cols-5 gap-2"
        >
          <select
            value={newLecSubject}
            onChange={(e) => {
              setNewLecSubject(e.target.value);
              const firstCh = appData.chapters.find((c) => c.subjectId === e.target.value);
              if (firstCh) setNewLecChapter(firstCh.id);
            }}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={newLecChapter}
            onChange={(e) => setNewLecChapter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          >
            {appData.chapters
              .filter((c) => c.subjectId === newLecSubject)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Ch {c.number}: {c.name}
                </option>
              ))}
          </select>

          <input
            type="text"
            value={newLecTopic}
            onChange={(e) => setNewLecTopic(e.target.value)}
            placeholder="Personal lecture topic..."
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />

          <input
            type="date"
            value={newLecDate}
            onChange={(e) => setNewLecDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            + Add Personal Lecture
          </button>
        </form>
      </div>

      {/* Lecture List */}
      <div className="space-y-2.5">
        {filteredLectures.slice(0, 120).map((lec) => {
          const subj = SUBJECTS.find((s) => s.id === lec.subjectId);
          const ch = appData.chapters.find((c) => c.id === lec.chapterId);
          const isDone = lec.status === 'Completed';
          return (
            <div
              key={lec.id}
              className="p-4 rounded-2xl bg-[#141418] border border-[#272730] flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-purple-400">
                  {subj?.name} • {ch?.name} • Lecture #{lec.lectureNumber}
                </div>
                <div className="text-sm font-extrabold text-white">{lec.topic}</div>
                <div className="text-xs text-zinc-400">
                  Date: <strong className="text-zinc-200">{formatDateDDMMMYYYY(lec.date)}</strong> •
                  Timing: {lec.timing} • Faculty: {lec.faculty}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={lec.status}
                  onChange={(e) => toggleLectureStatus(lec.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs font-bold text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Missed">Missed</option>
                  <option value="Recorded">Recorded</option>
                </select>
                <button
                  onClick={() => toggleLectureStatus(lec.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                    isDone ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                  }`}
                >
                  {isDone ? 'Completed ✓' : 'Mark Completed'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. SYLLABUS COMPLETION TRACKER
// ============================================================================

function SyllabusTrackerView({ stats }) {
  return (
    <div className="space-y-6 animate-view-enter">
      {/* Section B: Overall Syllabus Progress */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Overall Syllabus Completion Tracker</h1>
            <p className="text-xs text-zinc-400">
              Automatic cascading calculations across all 50 chapters and 402 lectures
            </p>
          </div>
          <div className="text-3xl font-black text-purple-400">{stats.overallPct}%</div>
        </div>

        <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${stats.overallPct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[
            { label: 'Total Chapters', val: stats.totalChapters },
            { label: 'Completed Chapters', val: stats.completedChapters },
            { label: 'Pending Chapters', val: stats.pendingChapters },
            { label: 'Completed Lectures', val: stats.completedLectures },
            { label: 'Pending Lectures', val: stats.pendingLectures }
          ].map((box) => (
            <div
              key={box.label}
              className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#2b2b36] text-center"
            >
              <div className="text-xl font-black text-white">{box.val}</div>
              <div className="text-[11px] text-zinc-400 font-bold">{box.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section A: Individual Subject Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUBJECTS.map((subj) => {
          const st = stats.subjectStatsMap[subj.id];
          return (
            <div
              key={subj.id}
              className="p-5 rounded-2xl bg-[#141418] border border-[#272730] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">{subj.name}</h3>
                <span className="text-lg font-black text-purple-400">{st.completionPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${st.completionPct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-[#1b1b22]">
                  <div className="font-black text-emerald-400">{st.completedChapters}</div>
                  <div className="text-[10px] text-zinc-400">Completed Ch</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1b1b22]">
                  <div className="font-black text-amber-400">{st.pendingChapters}</div>
                  <div className="text-[10px] text-zinc-400">Pending Ch</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#1b1b22]">
                  <div className="font-black text-purple-300">
                    {st.completedLectures}/{st.totalLectures}
                  </div>
                  <div className="text-[10px] text-zinc-400">Lectures</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 5. STUDY MATERIALS HUB (+ ADD CUSTOM STUDY MATERIAL BUTTON & MODAL)
// ============================================================================

function StudyMaterialsView({ appData, setAppData, showToast }) {
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [matTitle, setMatTitle] = useState('');
  const [matSubject, setMatSubject] = useState('accounting');
  const [matCategory, setMatCategory] = useState('Notes');
  const [matUrl, setMatUrl] = useState('');
  const [matNotes, setMatNotes] = useState('');

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    const item = {
      id: `mat-${Date.now()}`,
      title: matTitle.trim(),
      subjectId: matSubject,
      category: matCategory,
      url: matUrl.trim(),
      notes: matNotes.trim(),
      addedAt: getTodayISO()
    };
    setAppData((prev) => ({
      ...prev,
      customMaterials: [item, ...(prev.customMaterials || [])]
    }));
    setMatTitle('');
    setMatUrl('');
    setMatNotes('');
    setShowAddModal(false);
    showToast('Study material saved permanently!');
  };

  const filteredMaterials = (appData.customMaterials || []).filter(
    (m) => subjectFilter === 'all' || m.subjectId === subjectFilter
  );

  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Central Study Materials Hub</h1>
          <p className="text-xs text-zinc-400">
            Organize your DPPs, PDF Notes, Handwritten Notes, Practice Sets & Favourite Resources
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          >
            <option value="all">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Study Material
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="p-6 rounded-2xl bg-[#16161d] border border-purple-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">Add Custom Study Material</h3>
            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddMaterial} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              placeholder="Material Title (e.g., Partnership Master Chart)"
              className="px-3 py-2 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs text-white"
            />
            <select
              value={matSubject}
              onChange={(e) => setMatSubject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs text-white"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={matCategory}
              onChange={(e) => setMatCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs text-white"
            >
              <option value="Notes">PDF / Handwritten Notes</option>
              <option value="DPP">DPP</option>
              <option value="Practice">Practice Set / Mistake Notebook</option>
              <option value="Formula / Section Sheet">Formula / Section Sheet</option>
            </select>
            <input
              type="url"
              value={matUrl}
              onChange={(e) => setMatUrl(e.target.value)}
              placeholder="Optional Google Drive / PDF URL"
              className="px-3 py-2 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs text-white"
            />
            <textarea
              rows={2}
              value={matNotes}
              onChange={(e) => setMatNotes(e.target.value)}
              placeholder="Key summary or notes..."
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#121217] border border-[#2e2e3a] text-xs text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Save Material to Hub
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((m) => {
          const subj = SUBJECTS.find((s) => s.id === m.subjectId);
          return (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-[#141418] border border-[#272730] space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-300">
                    {subj?.name} • {m.category}
                  </span>
                  <span className="text-zinc-500">{formatDateDDMMMYYYY(m.addedAt)}</span>
                </div>
                <h3 className="text-sm font-black text-white">{m.title}</h3>
                {m.notes && <p className="text-xs text-zinc-400">{m.notes}</p>}
              </div>
              <div className="pt-2 flex items-center justify-between">
                {m.url ? (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Open Resource <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-zinc-500">Saved Note</span>
                )}
                <button
                  onClick={() =>
                    setAppData((prev) => ({
                      ...prev,
                      customMaterials: prev.customMaterials.filter((x) => x.id !== m.id)
                    }))
                  }
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 6. REVISION CENTRE (3-STAGE REMINDERS + DIGITAL REVISION SLIDE CARDS)
// ============================================================================

function RevisionCentreView({ appData, setAppData, showToast }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [formulaOrSection, setFormulaOrSection] = useState('');
  const [question, setQuestion] = useState('');

  const cards = appData.flashcards || [];
  const activeCard = cards[cardIndex] || cards[0];

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!concept.trim()) return;
    const newCard = {
      id: `card-${Date.now()}`,
      subjectId: 'accounting',
      chapterId: 'acc-1',
      concept: concept.trim(),
      explanation: explanation.trim(),
      points: 'Important exam concept',
      formulaOrSection: formulaOrSection.trim(),
      question: question.trim(),
      revised: false
    };
    setAppData((prev) => ({ ...prev, flashcards: [...prev.flashcards, newCard] }));
    setConcept('');
    setExplanation('');
    setFormulaOrSection('');
    setQuestion('');
    showToast('New revision flashcard created!');
  };

  return (
    <div className="space-y-6 animate-view-enter">
      {/* Digital Revision Slide Feature */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-purple-500/40 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Digital Revision Slide Deck</h1>
          <span className="text-xs font-bold text-purple-400">
            Card {cards.length > 0 ? cardIndex + 1 : 0} of {cards.length}
          </span>
        </div>

        {activeCard && (
          <div className="p-6 rounded-2xl bg-[#1b1b22] border border-[#2d2d39] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase">
                Important Concept Slide
              </span>
              {activeCard.revised && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  Revised ✓
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-white">{activeCard.concept}</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">{activeCard.explanation}</p>
            <div className="p-3 rounded-xl bg-[#121217] border border-[#262632] text-xs text-purple-300 font-mono">
              Formula / Section: {activeCard.formulaOrSection || '-'}
            </div>
            <div className="text-xs text-emerald-300 font-semibold">
              Practice Q: {activeCard.question || '-'}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCardIndex((i) => (i > 0 ? i - 1 : cards.length - 1))}
              className="px-4 py-2 rounded-xl bg-[#1c1c24] text-xs font-bold text-white"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCardIndex((i) => (i + 1) % Math.max(1, cards.length))}
              className="px-4 py-2 rounded-xl bg-[#1c1c24] text-xs font-bold text-white"
            >
              Next →
            </button>
          </div>

          {activeCard && (
            <button
              onClick={() =>
                setAppData((prev) => ({
                  ...prev,
                  flashcards: prev.flashcards.map((c) =>
                    c.id === activeCard.id ? { ...c, revised: !c.revised } : c
                  )
                }))
              }
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              {activeCard.revised ? 'Revised ✓' : 'Mark as Revised'}
            </button>
          )}
        </div>
      </div>

      {/* Create New Revision Card */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-3">
        <h3 className="text-sm font-black text-white">Create New Revision Card</h3>
        <form onSubmit={handleAddCard} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Important Concept Title"
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />
          <input
            type="text"
            value={formulaOrSection}
            onChange={(e) => setFormulaOrSection(e.target.value)}
            placeholder="Formula or Legal Section"
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />
          <input
            type="text"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Short Explanation"
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Practice Question"
            className="px-3 py-2 rounded-xl bg-[#1c1c24] border border-[#2e2e3a] text-xs text-white"
          />
          <button
            type="submit"
            className="sm:col-span-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            + Add Revision Flashcard
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 7. FOCUS TIMER (POMODORO 25 / 50 / 90 MINS + AUTO SESSION LOGGING)
// ============================================================================

function FocusTimerView({ appData, setAppData, todayISO, showToast }) {
  const [durationMins, setDurationMins] = useState(50);
  const [secondsLeft, setSecondsLeft] = useState(50 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('accounting');

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          const session = {
            id: `focus-${Date.now()}`,
            subjectId: selectedSubject,
            minutes: durationMins,
            date: todayISO
          };
          setAppData((old) => ({
            ...old,
            focusSessions: [session, ...old.focusSessions]
          }));
          showToast(`Focus session (${durationMins}m) completed & recorded!`);
          return durationMins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, durationMins, selectedSubject, todayISO, setAppData, showToast]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const todayMinutes = appData.focusSessions
    .filter((s) => s.date === todayISO)
    .reduce((acc, s) => acc + Number(s.minutes || 0), 0);
  const totalMinutes = appData.focusSessions.reduce(
    (acc, s) => acc + Number(s.minutes || 0),
    0
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-view-enter">
      <div className="p-8 rounded-2xl bg-[#141418] border border-[#272730] text-center space-y-6">
        <h1 className="text-xl font-black text-white">Pomodoro Focus Timer</h1>

        <div className="flex flex-wrap justify-center gap-2">
          {[25, 50, 90].map((m) => (
            <button
              key={m}
              onClick={() => {
                setIsRunning(false);
                setDurationMins(m);
                setSecondsLeft(m * 60);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                durationMins === m ? 'bg-purple-600 text-white' : 'bg-[#1c1c24] text-zinc-400'
              }`}
            >
              {m} Minutes
            </button>
          ))}
        </div>

        <div className="text-6xl font-black text-white font-mono tracking-wider">
          {mins}:{secs}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
          >
            {isRunning ? 'Pause' : 'Start Focus'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(durationMins * 60);
            }}
            className="px-6 py-3 rounded-xl bg-[#1c1c24] text-zinc-300 text-xs font-bold"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#252530]">
          <div className="p-3 rounded-xl bg-[#1b1b22]">
            <div className="text-lg font-black text-purple-400">
              {(todayMinutes / 60).toFixed(1)}h
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Today's Study</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1b1b22]">
            <div className="text-lg font-black text-emerald-400">
              {(totalMinutes / 60).toFixed(1)}h
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Logged</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1b1b22]">
            <div className="text-lg font-black text-white">{appData.focusSessions.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Sessions Done</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MTP & RTP SECTION (EXTRACTED LIFELONGLEARNER.IN RESOURCE MATRIX)
// ============================================================================

function MtpRtpView({ appData, setAppData, showToast }) {
  const [selectedSubject, setSelectedSubject] = useState('accounting');

  const toggleSlotDone = (attempt, colKey) => {
    setAppData((prev) => {
      const matrix = { ...(prev.portalMatrix || {}) };
      const subjMatrix = { ...(matrix[selectedSubject] || {}) };
      const row = { ...(subjMatrix[attempt] || {}) };
      const current = row[colKey] || {};
      row[colKey] = { ...current, completed: !current.completed };
      subjMatrix[attempt] = row;
      matrix[selectedSubject] = subjMatrix;
      return { ...prev, portalMatrix: matrix };
    });
    showToast('Updated paper completion status!');
  };

  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">
            MTP, RTP & PYQ Resource Portal (Lifelong Learner Matrix)
          </h1>
          <p className="text-xs text-zinc-400">
            Direct integration with{' '}
            <a
              href="https://www.lifelonglearner.in/free-resource"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 underline font-bold"
            >
              https://www.lifelonglearner.in/free-resource
            </a>{' '}
            for all 4 CA Foundation Subjects
          </p>
        </div>

        <a
          href="https://www.lifelonglearner.in/free-resource"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2"
        >
          Open Lifelong Learner PDF Portal <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSubject(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              selectedSubject === s.id
                ? 'bg-purple-600 text-white'
                : 'bg-[#141418] text-zinc-400 border border-[#272730]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Attempts Matrix Table */}
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#272730] text-zinc-400">
              <th className="py-3 px-3 font-extrabold">Attempt</th>
              {RESOURCE_COLUMNS.map((col) => (
                <th key={col.key} className="py-3 px-3 font-extrabold text-center">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESOURCE_ATTEMPTS.map((attempt) => (
              <tr key={attempt} className="border-b border-[#1f1f28]">
                <td className="py-3 px-3 font-black text-white">{attempt}</td>
                {RESOURCE_COLUMNS.map((col) => {
                  const cell =
                    appData.portalMatrix?.[selectedSubject]?.[attempt]?.[col.key] || {};
                  return (
                    <td key={col.key} className="py-2.5 px-2 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href="https://www.lifelonglearner.in/free-resource"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#1c1c24] hover:bg-purple-600/30 text-purple-300 font-bold"
                        >
                          PDF
                        </a>
                        <button
                          onClick={() => toggleSlotDone(attempt, col.key)}
                          className={`px-2 py-1 rounded-lg font-bold ${
                            cell.completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cell.completed ? '✓' : 'Done'}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 9. BACKLOG MANAGER
// ============================================================================

function BacklogManagerView({ appData, referenceDateISO, toggleLectureStatus }) {
  const overdueLectures = appData.lectures.filter(
    (l) =>
      l.status !== 'Completed' &&
      l.date !== 'Recorded' &&
      l.date < referenceDateISO
  );

  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730]">
        <h1 className="text-xl font-black text-white">Backlog Manager</h1>
        <p className="text-xs text-zinc-400">
          Automatically identifies missed or overdue lectures prior to{' '}
          {formatDateDDMMMYYYY(referenceDateISO)} ({overdueLectures.length} items)
        </p>
      </div>

      <div className="space-y-2.5">
        {overdueLectures.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] text-xs text-emerald-400 font-bold">
            Zero overdue lectures! You are completely caught up with the schedule.
          </div>
        ) : (
          overdueLectures.map((lec) => {
            const subj = SUBJECTS.find((s) => s.id === lec.subjectId);
            const ch = appData.chapters.find((c) => c.id === lec.chapterId);
            return (
              <div
                key={lec.id}
                className="p-4 rounded-2xl bg-[#141418] border border-rose-500/30 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-rose-400">
                    {subj?.name} • Due {formatDateDDMMMYYYY(lec.date)}
                  </div>
                  <div className="text-sm font-black text-white">
                    {ch?.name} — Lec {lec.lectureNumber} ({lec.topic})
                  </div>
                </div>
                <button
                  onClick={() => toggleLectureStatus(lec.id, 'Completed')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Clear Backlog ✓
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 10. SIMPLE ANALYTICS
// ============================================================================

function AnalyticsView({ stats }) {
  return (
    <div className="space-y-6 animate-view-enter">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
        <h1 className="text-xl font-black text-white">Preparation Analytics</h1>
        <div className="space-y-4">
          {SUBJECTS.map((subj) => {
            const st = stats.subjectStatsMap[subj.id];
            return (
              <div key={subj.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">{subj.name}</span>
                  <span className="text-purple-400">
                    {st.completedLectures}/{st.totalLectures} Lectures ({st.completionPct}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${st.completionPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. ONE UNIFIED SILENT GOOGLE MEET VIRTUAL LIBRARY (HOST: CA. BEERESH)
// ============================================================================

function GoogleMeetRoomView({
  unifiedSilentMeet,
  setUnifiedSilentMeet,
  showToast
}) {
  const [editUrlMode, setEditUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(
    unifiedSilentMeet?.meetUrl || 'https://meet.google.com/landing'
  );

  const currentMeetUrl = unifiedSilentMeet?.meetUrl || 'https://meet.google.com/landing';

  const handleJoinSingleSilentMeet = () => {
    window.open(currentMeetUrl, '_blank', 'noopener,noreferrer');
    showToast('Opening the Official Silent Study Google Meet hosted by CA. Beeresh...');
  };

  const handleHostCreateNewMeet = () => {
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
    setEditUrlMode(true);
    showToast('Creating a valid Google Meet room for CA. Beeresh — paste the room link below!');
  };

  const handleCopyUnifiedLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentMeetUrl);
      showToast('Copied the Official Google Meet link!');
    }
  };

  const handleSavePermanentLink = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('https://meet.google.com/')) {
      showToast('Please enter a valid https://meet.google.com/... link');
      return;
    }
    setUnifiedSilentMeet({
      meetUrl: trimmed,
      hostName: 'CA. Beeresh'
    });
    setEditUrlMode(false);
    showToast('Official Google Meet link updated by Host CA. Beeresh and saved permanently!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-view-enter">
      {/* Main Unified Silent Google Meet Card (Single Link, Hosted by CA. Beeresh) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#141418] border border-emerald-500/40 glow-emerald space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Official 24×7 Silent Study Meet • Host: CA. Beeresh</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CA SAMPURNA MAY 2027 — SILENT GOOGLE MEET
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Hosted by <strong className="text-purple-400">CA. Beeresh</strong>. There is only{' '}
              <strong className="text-emerald-400">one single Google Meet link</strong> for everyone.
              No discussion, no talking — simply join with your microphone muted and study silently alongside serious aspirants.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-extrabold">
                Meeting Host: CA. Beeresh
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#1c1c24] border border-[#2d2d39] text-zinc-300 font-semibold">
                Mic Muted • Camera / Desk View Only
              </span>
            </div>
          </div>

          {/* Single One-Click Join Card */}
          <div className="p-5 rounded-2xl bg-[#0d0d11] border border-[#282834] flex flex-col items-center text-center gap-3.5 min-w-[280px]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
              Host: <span className="text-white">CA. Beeresh</span>
            </div>

            <div className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-[#181820] border border-[#2c2c38] text-emerald-300 truncate">
              {currentMeetUrl}
            </div>

            <button
              onClick={handleJoinSingleSilentMeet}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all transform hover:scale-[1.02]"
            >
              <Video className="w-4 h-4" />
              <span>Join Silent Google Meet</span>
            </button>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleCopyUnifiedLink}
                className="flex-1 py-2 rounded-xl bg-[#1c1c24] hover:bg-zinc-800 border border-[#2e2e3a] text-zinc-300 text-[11px] font-bold"
              >
                Copy Meet Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput(currentMeetUrl);
                  setEditUrlMode(!editUrlMode);
                }}
                className="py-2 px-3 rounded-xl bg-[#1c1c24] hover:bg-zinc-800 border border-[#2e2e3a] text-purple-300 text-[11px] font-bold"
              >
                {editUrlMode ? 'Close' : 'Host Controls'}
              </button>
            </div>
          </div>
        </div>

        {/* Host Controls for CA. Beeresh to generate & save the valid Google Meet link */}
        {editUrlMode && (
          <div className="p-4 rounded-xl bg-[#1b1b22] border border-purple-500/40 space-y-3 animate-view-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-white">
                Host Panel (CA. Beeresh) — Generate or Update the Single Valid Google Meet Link
              </div>
              <button
                type="button"
                onClick={handleHostCreateNewMeet}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" /> 1. Launch Valid Meet (meet.google.com/new)
              </button>
            </div>

            <form
              onSubmit={handleSavePermanentLink}
              className="flex flex-col sm:flex-row items-center gap-2.5"
            >
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="2. Paste valid link e.g. https://meet.google.com/abc-defg-hij"
                className="flex-1 px-3 py-2 rounded-xl bg-[#121216] border border-[#2e2e3a] text-xs text-white w-full"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
              >
                Save Permanent Link
              </button>
            </form>
          </div>
        )}

        {/* Strict Silent Study Rules Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#252530]">
          {[
            {
              title: '1. Hosted by CA. Beeresh',
              desc: 'One single official Google Meet room for all serious CA Foundation May 2027 aspirants.'
            },
            {
              title: '2. Zero Discussion Policy',
              desc: 'Microphones remain muted at all times. No talking or chatting — pure silent focus.'
            },
            {
              title: '3. Camera ON Accountability',
              desc: 'See others studying silently to maintain discipline during long study sessions.'
            }
          ].map((rule) => (
            <div
              key={rule.title}
              className="p-3.5 rounded-xl bg-[#101014] border border-[#24242f] space-y-1"
            >
              <div className="text-xs font-extrabold text-purple-400">{rule.title}</div>
              <p className="text-[11px] text-zinc-400">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. SETTINGS VIEW
// ============================================================================
// 12. SETTINGS VIEW (SINGLE-USER PROFILE + JSON BACKUP & RESTORE)
// ============================================================================

function SettingsView({ appData, setAppData, showToast }) {
  const cleanName = String(appData.settings.studentName || 'Aspirant')
    .replace(/^CA\.?\s*/i, '')
    .trim();

  const handleExportBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `CA_Foundation_Sampurna_May2027_Backup_${getTodayISO()}.json`;
    a.click();
    showToast('Complete planner backup downloaded!');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && parsed.chapters && parsed.lectures) {
          setAppData(parsed);
          showToast('Planner backup restored and saved permanently!');
        }
      } catch {
        showToast('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="p-6 rounded-2xl bg-[#141418] border border-[#272730] space-y-4">
        <h1 className="text-xl font-black text-white">Personal Planner Settings & Backup</h1>
        <p className="text-xs text-zinc-400">
          All changes are automatically saved to your device's permanent storage (`localStorage` & `IndexedDB`).
        </p>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Your Name (Fixed <strong className="text-purple-400">CA.</strong> Prefix)
          </label>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-2 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-300 font-black text-xs">
              CA.
            </span>
            <input
              type="text"
              value={cleanName}
              onChange={(e) =>
                setAppData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    studentName: e.target.value.replace(/^CA\.?\s*/i, '')
                  }
                }))
              }
              className="flex-1 px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2e2e3a] text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">May 2027 Examination Date</label>
          <input
            type="date"
            value={appData.settings.examDate}
            onChange={(e) =>
              setAppData((prev) => ({
                ...prev,
                settings: { ...prev.settings, examDate: e.target.value }
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2e2e3a] text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Daily Study Target (Hours)</label>
          <input
            type="number"
            min={1}
            max={16}
            value={appData.settings.dailyTargetHours}
            onChange={(e) =>
              setAppData((prev) => ({
                ...prev,
                settings: { ...prev.settings, dailyTargetHours: Number(e.target.value) || 6 }
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-[#1c1c22] border border-[#2e2e3a] text-xs text-white"
          />
        </div>

        <div className="pt-3 border-t border-[#252530] flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Planner Backup (.json)
          </button>

          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#1c1c22] border border-[#2e2e3a] text-zinc-200 text-xs font-bold inline-flex items-center gap-2">
            <Upload className="w-4 h-4" /> Restore Backup (.json)
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}