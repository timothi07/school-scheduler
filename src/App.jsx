import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  Save, 
  CheckCircle2, 
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  X,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Printer,
  Menu,
  Loader2,
  Sparkles,
  RotateCcw,
  UserCheck,
  Copy,
  Check,
  Lock,
  Unlock,
  Info
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCnGYvKV5RM920W9MfVK0vE9_OFDh9qOt4",
  authDomain: "school-scheduler-be0ba.firebaseapp.com",
  projectId: "school-scheduler-be0ba",
  storageBucket: "school-scheduler-be0ba.firebasestorage.app",
  messagingSenderId: "293883160030",
  appId: "1:293883160030:web:96f28a8cdef6415a42294f",
  measurementId: "G-DQWDYSGX12"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "school-scheduler-v1";

// --- Constants & Security ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const ADMIN_PIN = "1234"; // 4-digit PIN required to edit timetables, classes, or Sync DB
const STORAGE_KEY = "ghss_pookkottur_sub_state_v1";
const ADMIN_SESSION_KEY = "ghss_pookkottur_admin_unlocked";

// --- DEFAULT DATA ---
const INITIAL_CLASSES = [
  { name: '8', divisions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] },
  { name: '9', divisions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] },
  { name: '10', divisions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
];

const INITIAL_TEACHERS = [
  {
    name: "CS",
    timetable: {
      "Monday": ["", "9D", "10A, 10H", "", "9I", "", "10G"],
      "Tuesday": ["", "8J", "", "10A, 10H", "", "9A", "10G"],
      "Wednesday": ["", "8H", "9A", "8A", "", "10A", "9D"],
      "Thursday": ["", "8A", "8J", "", "8H", "10A, 10H", "10F"],
      "Friday": ["", "10A, 10H", "10A", "10A", "", "10F", "9I"]
    }
  },
  {
    name: "HN",
    timetable: {
      "Monday": ["10B", "", "8I", "10H", "", "8C", "10B"],
      "Tuesday": ["10B", "8I", "10H", "", "", "8C", ""],
      "Wednesday": ["10B", "", "10B", "10B", "10H", "", ""],
      "Thursday": ["", "", "8C", "", "10H", "8I", "10B"],
      "Friday": ["10B", "", "8C", "8I", "", "", "10H"]
    }
  },
  {
    name: "SH",
    timetable: {
      "Monday": ["9A", "9E", "", "", "8J", "10C", "8I"],
      "Tuesday": ["8I", "", "8J", "9D", "10B", "", "10C"],
      "Wednesday": ["9A", "", "", "9D", "8G", "", "8H"],
      "Thursday": ["10C", "", "", "9E", "10D", "8H", ""],
      "Friday": ["10C", "", "10B", "10D", "", "8G", ""]
    }
  },
  {
    name: "SD",
    timetable: {
      "Monday": ["", "8D", "10C", "8G", "", "10E", "8A, 8G"],
      "Tuesday": ["", "8G", "8B", "", "8A, 8G", "10E", "8F"],
      "Wednesday": ["10D", "9H", "10C", "", "8F", "9F", ""],
      "Thursday": ["9C", "", "8D", "9H", "8A, 8G", "", ""],
      "Friday": ["8B", "", "9F", "9C", "8A, 8G", "", "10D"]
    }
  },
  {
    name: "LC",
    timetable: {
      "Monday": ["10E", "10H", "", "8E", "9H", "8E", ""],
      "Tuesday": ["10E", "", "", "9H", "10H", "10H", ""],
      "Wednesday": ["10E", "10H", "", "", "8E", "8E", "10H"],
      "Thursday": ["", "10H", "", "10E", "8E", "9H", ""],
      "Friday": ["10E", "9H", "", "9H", "10H", "10H", ""]
    }
  },
  {
    name: "SW",
    timetable: {
      "Monday": ["10F", "10C", "9A", "", "8I", "10D", ""],
      "Tuesday": ["10F", "9B", "", "9A", "", "10C", "8H"],
      "Wednesday": ["10F", "", "8I", "9F", "10D", "", ""],
      "Thursday": ["10F", "", "9F", "9F", "9B", "", "10D"],
      "Friday": ["10F", "10F", "", "8H", "", "", "10C"]
    }
  },
  {
    name: "SKK",
    timetable: {
      "Monday": ["10G", "", "8H", "8H", "10A", "", "9A"],
      "Tuesday": ["10G", "8B", "", "8H", "9A", "", "10A"],
      "Wednesday": ["10G", "", "", "9A", "", "8B", "10A"],
      "Thursday": ["10G", "8B", "", "10A", "9A", "", ""],
      "Friday": ["10G", "9A", "", "", "8B", "10A", ""]
    }
  },
  {
    name: "DDB",
    timetable: {
      "Monday": ["10H", "8C", "", "10A", "8H", "8H", ""],
      "Tuesday": ["10H", "", "8C", "", "10A", "8H", ""],
      "Wednesday": ["10H", "", "8H", "", "10A", "9I", "8C"],
      "Thursday": ["10H", "10A", "", "", "9I", "9I", "8C"],
      "Friday": ["10H", "", "8H", "", "10A", "8C", ""]
    }
  },
  {
    name: "SA",
    timetable: {
      "Monday": ["9B", "", "8F", "8D", "", "10H", "9H"],
      "Tuesday": ["", "9A", "", "10F", "9G", "", ""],
      "Wednesday": ["9B", "8D", "", "", "9I", "10F", "8F"],
      "Thursday": ["", "", "8E", "9A", "9H", "", "10A"],
      "Friday": ["10A", "9I", "", "10H", "8E", "9G", ""]
    }
  },
  {
    name: "NTK",
    timetable: {
      "Monday": ["9F", "", "", "", "9E", "8B", "9B"],
      "Tuesday": ["", "10H", "8F", "", "9B", "10G", "8B"],
      "Wednesday": ["9F", "8F", "", "10F", "9C", "8H", ""],
      "Thursday": ["", "8G", "8H", "9C", "", "10F", "10H"],
      "Friday": ["", "10G", "8G", "", "9E", "9E", ""]
    }
  },
  {
    name: "KK",
    timetable: {
      "Monday": ["9D", "", "10E", "8C", "", "9B", "9I"],
      "Tuesday": ["9D", "8C", "9I", "", "8H", "", "8G"],
      "Wednesday": ["", "8G", "9B", "8H", "", "10H", ""],
      "Thursday": ["9B", "", "10H", "8G", "", "10E", "8H"],
      "Friday": ["9D", "", "10H", "", "10E", "9I", "8C"]
    }
  },
  {
    name: "SJL",
    timetable: {
      "Monday": ["9I", "", "8G", "8I", "10C", "", "10F"],
      "Tuesday": ["9I", "10C", "10C", "", "10F", "8I", ""],
      "Wednesday": ["9I", "", "8G", "8G", "", "8I", "10F"],
      "Thursday": ["", "10F", "9I", "10C", "", "", "8I"],
      "Friday": ["9I", "", "", "10C", "8I", "", "10F"]
    }
  },
  {
    name: "PMD",
    timetable: {
      "Monday": ["9C", "10G", "", "8F", "10D", "", "8J"],
      "Tuesday": ["9C", "10G", "", "10D", "8F", "8J", ""],
      "Wednesday": ["9C", "10G", "", "8F", "8J", "", "10D"],
      "Thursday": ["10D", "10G", "8F", "", "8J", "", "10D"],
      "Friday": ["9C", "8F", "10G", "", "8J", "10D", ""]
    }
  },
  {
    name: "KAJ",
    timetable: {
      "Monday": ["", "8I", "10D", "", "9A", "10F", ""],
      "Tuesday": ["9G", "", "9A", "8I", "", "10D", "10F"],
      "Wednesday": ["9G", "10F", "", "10D", "9A", "", "8I"],
      "Thursday": ["9G", "", "10D", "10F", "8I", "", ""],
      "Friday": ["9G", "10D", "8I", "", "10F", "", "9A"]
    }
  },
  {
    name: "AV",
    timetable: {
      "Monday": ["10D", "10D", "10G", "", "10B", "8J", ""],
      "Tuesday": ["9H", "", "10G", "8J", "10D", "", "10B"],
      "Wednesday": ["9H", "", "8J", "", "10B", "", "10G"],
      "Thursday": ["9H", "", "10B", "8J", "", "10G", ""],
      "Friday": ["9H", "", "", "10B", "10G", "8J", ""]
    }
  },
  {
    name: "AMG",
    timetable: {
      "Monday": ["", "9I", "", "8J", "9C", "", ""],
      "Tuesday": ["9E", "", "8G", "", "9C", "9C", "10H"],
      "Wednesday": ["", "9I", "10H", "9B", "", "8J", "10E"],
      "Thursday": ["9E", "", "10E", "10H", "9D", "9D", ""],
      "Friday": ["9B", "9B", "", "8G", "", "9D", "10E"]
    }
  },
  {
    name: "RVV",
    timetable: {
      "Monday": ["10A", "", "9E", "10G", "", "8I", "9F"],
      "Tuesday": ["8A", "", "10D", "10G", "9E", "", ""],
      "Wednesday": ["8A", "10D", "", "10A", "8I", "9G", ""],
      "Thursday": ["10A", "10D", "10G", "", "9G", "", "9F"],
      "Friday": ["", "9F", "9E", "9G", "", "8I", "8A"]
    }
  },
  {
    name: "FJ",
    timetable: {
      "Monday": ["", "9A", "8J", "10F", "", "", "9C"],
      "Tuesday": ["", "10B", "10F", "", "9H", "8B", "9C"],
      "Wednesday": ["8B", "", "9H", "9C", "10C", "", "8J"],
      "Thursday": ["8B", "", "9H", "10B", "", "9A", "10C"],
      "Friday": ["9A", "8J", "", "10F", "10C", "", "10B"]
    }
  },
  {
    name: "FK",
    timetable: {
      "Monday": ["8C", "", "9C", "9D", "8A", "", ""],
      "Tuesday": ["", "9D", "10B", "9F", "", "9E", ""],
      "Wednesday": ["8C", "", "9C", "10G", "", "10E", "8B"],
      "Thursday": ["9A", "9A", "", "10G", "10E", "9E", ""],
      "Friday": ["8A", "8B", "", "9F", "9A", "10B", ""]
    }
  },
  {
    name: "AVK",
    timetable: {
      "Monday": ["8F", "", "9F", "10C", "", "10B", "8A, 8G"],
      "Tuesday": ["8F", "9F", "", "9B", "8A, 8G", "10B", ""],
      "Wednesday": ["", "9B", "", "", "9F", "10C", "10B"],
      "Thursday": ["10C", "10C", "", "8F", "8A, 8G", "9B", ""],
      "Friday": ["8F", "", "9B", "", "8A, 8G", "10C", "9F"]
    }
  },
  {
    name: "NVM",
    timetable: {
      "Monday": ["8E", "9G", "10A, 10H", "", "10G", "9A, 9I", ""],
      "Tuesday": ["", "9G", "8I", "10A, 10H", "", "8E", "9A, 9I"],
      "Wednesday": ["", "", "10G", "8I", "9G", "", "8E"],
      "Thursday": ["8E", "8I", "", "", "10G", "10A, 10H", "9A, 9I"],
      "Friday": ["8I", "10A, 10H", "9A, 9I", "", "9G", "10G", ""]
    }
  },
  {
    name: "SM",
    timetable: {
      "Monday": ["8J", "", "10F", "9I", "", "", ""],
      "Tuesday": ["8J", "8F", "", "", "9I", "10F", ""],
      "Wednesday": ["8J", "8J", "10F", "", "", "8F", "9I"],
      "Thursday": ["", "", "10F", "9I", "8F", "", "8J"],
      "Friday": ["8J", "", "10F", "9I", "8F", "", "8J"]
    }
  },
  {
    name: "PKP",
    timetable: {
      "Monday": ["8G", "9F", "9G", "", "8D", "", "8H"],
      "Tuesday": ["8G", "8D", "8H", "", "", "9G", "9F"],
      "Wednesday": ["8G", "9G", "8D", "", "8H", "", "9F"],
      "Thursday": ["8G", "9G", "", "8H", "9F", "8D", ""],
      "Friday": ["8G", "", "9G", "8D", "9F", "", "8H"]
    }
  },
  {
    name: "ASV",
    timetable: {
      "Monday": ["8H", "10E", "", "9G", "9B", "", "10C"],
      "Tuesday": ["10C", "", "9G", "", "10E", "9B", ""],
      "Wednesday": ["8H", "", "10E", "9G", "9B", "", "10C"],
      "Thursday": ["8H", "", "9G", "9B", "10C", "", "10E"],
      "Friday": ["8H", "10C", "", "10E", "9B", "", "9G"]
    }
  },
  {
    name: "STN",
    timetable: {
      "Monday": ["9G", "", "9I", "10E", "", "10A", ""],
      "Tuesday": ["", "9H", "8E", "9I", "", "8D", "8C"],
      "Wednesday": ["8I", "8A", "", "9H", "8D", "8C", ""],
      "Thursday": ["8I", "8J", "8A", "", "10A", "10D", ""],
      "Friday": ["", "9G", "10D", "8J", "", "10E", "8E"]
    }
  },
  {
    name: "RCK",
    timetable: {
      "Monday": ["", "8H", "", "", "10F", "9C", ""],
      "Tuesday": ["8H", "10F", "", "", "8D", "", ""],
      "Wednesday": ["8D", "9C", "", "", "10F", "", ""],
      "Thursday": ["8D", "8H", "", "", "10F", "9C", ""],
      "Friday": ["8D", "", "", "", "8H", "9C", ""]
    }
  },
  {
    name: "SV",
    timetable: {
      "Monday": ["8I", "10B", "", "9E", "10H", "9A, 9I", ""],
      "Tuesday": ["9B", "", "10A", "8C", "8I", "", "9A, 9I"],
      "Wednesday": ["10A", "", "9G", "10H", "", "", "9E"],
      "Thursday": ["", "8E", "9B", "9G", "", "10B", "9A, 9I"],
      "Friday": ["", "", "9A, 9I", "8E", "8C", "", ""]
    }
  },
  {
    name: "LH",
    timetable: {
      "Monday": ["", "8J", "10A, 10H", "10D", "", "9H", "9D"],
      "Tuesday": ["8B, 8C", "", "9D", "10A, 10H", "8J", "", "10D"],
      "Wednesday": ["", "8B, 8C", "", "8J", "9H", "10D", ""],
      "Thursday": ["8J", "9D", "", "8B, 8C", "", "10A, 10H", "9H"],
      "Friday": ["10D", "10A, 10H", "", "8B, 8C", "9H", "", "9D"]
    }
  },
  {
    name: "IK",
    timetable: {
      "Monday": ["9E", "", "", "", "10E", "", "8A, 8G"],
      "Tuesday": ["8B, 8C", "", "10E", "10E", "8A, 8G", "", "10E"],
      "Wednesday": ["9E", "8B, 8C", "", "", "10E", "", ""],
      "Thursday": ["10E", "9E", "", "8B, 8C", "8A, 8G", "8E", ""],
      "Friday": ["", "", "10E", "8B, 8C", "8A, 8G", "", "9E"]
    }
  },
  {
    name: "KAK",
    timetable: {
      "Monday": ["", "8G", "8E", "", "8F", "8F", "10E"],
      "Tuesday": ["", "10E", "", "8G", "8E", "9I", ""],
      "Wednesday": ["", "10E", "8E", "9I", "", "8G", ""],
      "Thursday": ["9I", "10E", "8G", "", "", "8F", "8E"],
      "Friday": ["", "10E", "", "", "9I", "8E", "8G"]
    }
  },
  {
    name: "KVJ",
    timetable: {
      "Monday": ["10C", "9C", "", "9B", "8B", "8A", ""],
      "Tuesday": ["", "9C", "", "10C", "8B", "8A", ""],
      "Wednesday": ["", "", "8A", "10C", "8B", "", "9B"],
      "Thursday": ["8A", "9C", "10C", "", "8B", "", "9B"],
      "Friday": ["", "8A", "10C", "", "9C", "9B", "8B"]
    }
  },
  {
    name: "MNP",
    timetable: {
      "Monday": ["9H", "8A", "", "", "8G", "9E", "10D"],
      "Tuesday": ["10D", "", "9H", "9E", "", "8G", "8A"],
      "Wednesday": ["", "", "10D", "9E", "", "9H", "8G"],
      "Thursday": ["", "9H", "9E", "10D", "", "8A", "8G"],
      "Friday": ["9E", "", "9H", "8A", "10D", "", ""]
    }
  },
  {
    name: "RKC",
    timetable: {
      "Monday": ["", "9H", "10B", "", "9G", "9G", "9G"],
      "Tuesday": ["", "8A", "", "9G", "10G", "10A", ""],
      "Wednesday": ["", "10A", "10A", "", "10G", "10G", "9H"],
      "Thursday": ["", "10G", "8B", "", "10B", "9G", ""],
      "Friday": ["", "10B", "8A", "10G", "", "8B", "10G"]
    }
  },
  {
    name: "SMR",
    timetable: {
      "Monday": ["8A", "", "9B", "9A", "8C", "", "8B"],
      "Tuesday": ["9A", "", "8A", "8B", "8C", "", "9B"],
      "Wednesday": ["", "9A", "8C", "8B", "", "9B", "8A"],
      "Thursday": ["", "9B", "9A", "8A", "", "8C", "8B"],
      "Friday": ["", "8C", "8B", "9A", "", "8A", "9B"]
    }
  },
  {
    name: "CPS",
    timetable: {
      "Monday": ["", "10A", "9D", "10B", "", "", "9E"],
      "Tuesday": ["10A", "10A", "", "10B", "", "9D", "9E"],
      "Wednesday": ["10C", "10C", "9E", "", "9D", "10B", ""],
      "Thursday": ["", "10B", "10A", "9D", "", "10C", "9E"],
      "Friday": ["", "9E", "9D", "", "10B", "", "10A"]
    }
  },
  {
    name: "SML",
    timetable: {
      "Monday": ["", "", "8A", "9F", "", "", ""],
      "Tuesday": ["", "8H", "9B", "8E", "", "8F", "8D"],
      "Wednesday": ["", "9E", "8B", "8C", "", "9A", "9G"],
      "Thursday": ["", "9I", "8I", "8I", "", "8G", "9C"],
      "Friday": ["", "8I", "8J", "", "9D", "9H", "8I"]
    }
  },
  {
    name: "KYA",
    timetable: {
      "Monday": ["", "9B", "8B", "", "", "8G", "8E"],
      "Tuesday": ["", "9I", "9E", "8A", "", "", "9G"],
      "Wednesday": ["", "8I", "9D", "", "8A", "8A", "9A"],
      "Thursday": ["", "9F", "", "", "8C", "8J", "8A"],
      "Friday": ["", "9C", "8D", "8F", "", "8H", "9H"]
    }
  },
  {
    name: "PET",
    timetable: {
      "Monday": ["", "10F", "8C, 8D", "8A, 8B", "", "10G", "10A"],
      "Tuesday": ["", "10D", "9F", "", "10C", "9H", "8I, 8J"],
      "Wednesday": ["", "10B", "9I", "10E", "", "9E", "9C"],
      "Thursday": ["", "", "9D", "10H", "", "", "9G"],
      "Friday": ["", "8G, 8H", "8E, 8F", "9B", "", "9A", ""]
    }
  },
  {
    name: "E6",
    timetable: {
      "Monday": ["", "8F", "9H", "9H", "", "9D", "8D"],
      "Tuesday": ["", "9E", "8D", "8F", "", "9F", "9H"],
      "Wednesday": ["8F", "9F", "", "8D", "9E", "9D", ""],
      "Thursday": ["9F", "", "8F", "8D", "9E", "", "9D"],
      "Friday": ["9F", "9D", "", "9E", "", "8F", "8D"]
    }
  },
  {
    name: "B4",
    timetable: {
      "Monday": ["8B", "8B", "", "", "9F", "8D", "8C"],
      "Tuesday": ["8E", "8E", "", "9C", "9F", "", "9D"],
      "Wednesday": ["9D", "8E", "8F", "", "8C", "8D", ""],
      "Thursday": ["8C", "8C", "", "", "8D", "8B", "8F"],
      "Friday": ["8C", "8E", "", "", "8D", "8D", "9C"]
    }
  },
  {
    name: "SS6",
    timetable: {
      "Monday": ["", "8E", "", "9C", "9D", "9F", ""],
      "Tuesday": ["9F", "", "9C", "8D", "9D", "", "8E"],
      "Wednesday": ["", "9D", "9F", "8E", "", "9C", "8D"],
      "Thursday": ["9D", "8D", "", "8E", "9C", "9F", ""],
      "Friday": ["", "8D", "9C", "9D", "", "9F", ""]
    }
  },
  {
    name: "H4",
    timetable: {
      "Monday": ["8D", "", "", "", "8E", "", "8F"],
      "Tuesday": ["8D", "", "", "", "", "", ""],
      "Wednesday": ["8E", "", "", "", "", "", ""],
      "Thursday": ["8F", "", "", "", "", "", "8D"],
      "Friday": ["8E", "", "", "", "", "", "8F"]
    }
  }
];

// Helper: Count weekly periods for a teacher
const getWeeklyPeriodsCount = (timetable) => {
  if (!timetable) return 0;
  let count = 0;
  DAYS.forEach(day => {
    (timetable[day] || []).forEach(slot => {
      if (slot && slot.trim() !== '') count++;
    });
  });
  return count;
};

// Helper: Load persisted daily substitution state from localStorage
const loadPersistedSubState = () => {
  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayIdx = new Date().getDay();
  const defaultDay = DAYS[todayIdx - 1] || 'Monday';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === todayStr) {
        return {
          selectedDay: DAYS.includes(parsed.selectedDay) ? parsed.selectedDay : defaultDay,
          absentIds: Array.isArray(parsed.absentIds) ? parsed.absentIds : [],
          assignments: parsed.assignments && typeof parsed.assignments === 'object' ? parsed.assignments : {}
        };
      }
    }
  } catch (e) {
    console.warn("Could not read saved state from localStorage", e);
  }

  return {
    selectedDay: defaultDay,
    absentIds: [],
    assignments: {}
  };
};

// --- Components ---

// 0. Admin PIN Prompt Modal
const PinPromptModal = ({ isOpen, actionLabel, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Admin PIN Required</h3>
              <p className="text-[11px] text-slate-500">{actionLabel || 'Unlock database editing'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Enter 4-Digit Admin PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              placeholder="••••"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              className={`w-full px-3 py-2 text-center tracking-widest text-lg font-bold border rounded-lg outline-none focus:ring-2 ${
                error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-slate-300 focus:ring-blue-500'
              }`}
            />
            {error && (
              <p className="text-xs text-red-600 font-medium mt-1 text-center">
                Incorrect PIN. Please try again.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 font-medium text-xs hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Unlock &amp; Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 1. Class Directory Component
const ClassDirectory = ({ classes, onAddClass, onDeleteClass, onUpdateClass }) => {
  const [newClassName, setNewClassName] = useState('');
  const [newDivName, setNewDivName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const numA = parseInt(a.name) || 0;
      const numB = parseInt(b.name) || 0;
      return numA - numB || a.name.localeCompare(b.name);
    });
  }, [classes]);

  useEffect(() => {
    if (!selectedClassId && sortedClasses.length > 0) {
      setSelectedClassId(sortedClasses[0].id);
    }
  }, [sortedClasses, selectedClassId]);

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName.trim());
    setNewClassName('');
  };

  const handleAddDivision = async (e, classId, currentDivisions) => {
    e.preventDefault();
    if (!newDivName.trim()) return;
    const divUpper = newDivName.trim().toUpperCase();
    if ((currentDivisions || []).includes(divUpper)) {
      setNewDivName('');
      return;
    }
    const updatedDivisions = [...(currentDivisions || []), divUpper].sort();
    await onUpdateClass(classId, updatedDivisions);
    setNewDivName('');
  };

  const handleRemoveDivision = async (classId, currentDivisions, divToRemove) => {
    const updatedDivisions = currentDivisions.filter(d => d !== divToRemove);
    await onUpdateClass(classId, updatedDivisions);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full overflow-hidden print:hidden">
      {/* Class List */}
      <div className="md:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-xl shrink-0">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Class Standards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage grades and active divisions</p>
        </div>
        <div className="p-3 border-b border-slate-100 shrink-0">
          <form onSubmit={handleAddClass} className="flex gap-2">
            <input
              type="text"
              placeholder="Add Standard (e.g., 8, 9, 10)..."
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1.5 min-h-0">
          {sortedClasses.map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                selectedClassId === cls.id 
                  ? 'bg-blue-50/80 border-blue-200 ring-1 ring-blue-300' 
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                  selectedClassId === cls.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {cls.name}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">Standard {cls.name}</div>
                  <div className="text-xs text-slate-500">
                    {(cls.divisions || []).length} Divisions ({(cls.divisions || []).join(', ') || 'None'})
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteClass(cls.id); }}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                title="Delete Class"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Divisions Manager */}
      <div className="md:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-xl shrink-0">
          <h2 className="text-base font-bold text-slate-800">
            {selectedClass ? `Standard ${selectedClass.name} — Divisions` : 'Divisions'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedClass 
              ? `Add or remove divisions for Class ${selectedClass.name}` 
              : 'Select a class standard on the left to manage its divisions'}
          </p>
        </div>
        
        {selectedClass ? (
          <>
            <div className="p-3 border-b border-slate-100 shrink-0">
              <form 
                onSubmit={(e) => handleAddDivision(e, selectedClass.id, selectedClass.divisions)} 
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="New Division (e.g., A, B, C)..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase w-full"
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  maxLength={2}
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Division
                </button>
              </form>
            </div>
            <div className="p-5 flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedClass.divisions?.map((div, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-800 font-bold border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <span className="text-sm">{selectedClass.name}{div}</span>
                    <button 
                      onClick={() => handleRemoveDivision(selectedClass.id, selectedClass.divisions, div)}
                      className="w-5 h-5 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                      title={`Remove ${selectedClass.name}${div}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!selectedClass.divisions?.length) && (
                  <p className="col-span-full text-sm text-slate-400 italic py-8 text-center">
                    No divisions added for Standard {selectedClass.name} yet.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <ArrowRight className="w-8 h-8 opacity-20 mb-2" />
            <span className="text-sm">Select a class standard</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Teacher List & Add Component
const TeacherManager = ({ teachers, selectedTeacherId, onSelectTeacher, onDeleteTeacher, onAddTeacher }) => {
  const [newTeacherName, setNewTeacherName] = useState('');
  const [filter, setFilter] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    onAddTeacher(newTeacherName.trim().toUpperCase());
    setNewTeacherName('');
  };

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, filter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-xl shrink-0 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Staff Directory
        </h2>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {teachers.length}
        </span>
      </div>
      
      <div className="p-3 border-b border-slate-100 shrink-0 space-y-2.5">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add Teacher Code/Name..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all w-full"
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center justify-center shrink-0"
            title="Add Teacher"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search staff..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button 
              onClick={() => setFilter('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1 min-h-0">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No teachers found.
          </div>
        ) : (
          filteredTeachers.map(teacher => {
            const isSelected = teacher.id === selectedTeacherId;
            const weeklyPeriods = getWeeklyPeriodsCount(teacher.timetable);
            return (
              <div 
                key={teacher.id} 
                onClick={() => onSelectTeacher(teacher)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {teacher.name.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                      {teacher.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {weeklyPeriods} periods / week
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTeacher(teacher.id); }}
                  className="p-1.5 text-slate-400 opacity-70 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                  title="Delete Teacher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Helper: Multi-Select Modal
const ClassSelectorModal = ({ value, definedClasses, onClose, onSave }) => {
  const [selected, setSelected] = useState(new Set());
  const [customText, setCustomText] = useState('');

  const sortedClasses = useMemo(() => {
    return [...definedClasses].sort((a, b) => (parseInt(a.name) || 0) - (parseInt(b.name) || 0));
  }, [definedClasses]);

  useEffect(() => {
    const initialSet = new Set();
    if (value) {
      const parts = value.split(',').map(s => s.trim().toUpperCase());
      parts.forEach(p => {
        definedClasses.forEach(cls => {
          (cls.divisions || []).forEach(div => {
            const code = `${cls.name}${div}`.toUpperCase();
            const regex = new RegExp(`\\b${code}\\b`, 'i');
            if (regex.test(p)) {
              initialSet.add(code);
            }
          });
        });
      });
      
      let remaining = value;
      definedClasses.forEach(cls => {
        (cls.divisions || []).forEach(div => {
          const code = `${cls.name}${div}`;
          const regex = new RegExp(`\\b${code}\\b[, ]*`, 'gi');
          remaining = remaining.replace(regex, '');
        });
      });
      setCustomText(remaining.replace(/^[,\s]+|[,\s]+$/g, '')); 
    }
    setSelected(initialSet);
  }, [value, definedClasses]);

  const toggle = (code) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const handleSave = () => {
    let result = Array.from(selected).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB || a.localeCompare(b);
    }).join(', ');
    if (customText.trim()) {
      result = result ? `${result} ${customText.trim()}` : customText.trim();
    }
    onSave(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-base text-slate-800">Assign Class to Slot</h3>
            <p className="text-xs text-slate-500">Select one or more divisions for combined classes</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {sortedClasses.map(cls => (
            <div key={cls.id}>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 border-b border-slate-100 pb-1">
                Standard {cls.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(cls.divisions || []).length > 0 ? (
                  cls.divisions.map(div => {
                    const code = `${cls.name}${div}`.toUpperCase();
                    const isSelected = selected.has(code);
                    return (
                      <button
                        key={div}
                        type="button"
                        onClick={() => toggle(code)}
                        className={`
                          px-3.5 py-2 rounded-lg text-xs font-bold border transition-all
                          ${isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        {code}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No divisions configured.</span>
                )}
              </div>
            </div>
          ))}
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Optional Note / Subject Tag
            </label>
            <input 
              type="text" 
              placeholder="e.g., IT Lab, Mal II, PT..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button 
            type="button"
            onClick={() => { setSelected(new Set()); setCustomText(''); }}
            className="text-xs text-red-600 hover:underline font-medium"
          >
            Clear Slot
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg">
              Cancel
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 shadow-sm">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Timetable Editor Component
const TimetableEditor = ({ teacher, onUpdateTimetable, onClose, definedClasses }) => {
  const [schedule, setSchedule] = useState(teacher.timetable || {});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    const initialSchedule = {};
    DAYS.forEach(day => {
      initialSchedule[day] = teacher.timetable?.[day] ? [...teacher.timetable[day]] : Array(7).fill('');
    });
    setSchedule(initialSchedule);
    setHasChanges(false);
  }, [teacher]);

  const handleCellUpdate = (day, periodIndex, newValue) => {
    const newSchedule = { ...schedule };
    newSchedule[day] = [...(newSchedule[day] || Array(7).fill(''))];
    newSchedule[day][periodIndex] = newValue;
    setSchedule(newSchedule);
    setHasChanges(true);
    setEditingCell(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const savedOk = await onUpdateTimetable(teacher.id, schedule);
    if (savedOk !== false) {
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const totalWeeklyPeriods = getWeeklyPeriodsCount(schedule);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden print:hidden">
      <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/70 rounded-t-xl shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            title="Back to Staff List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">{teacher.name}&apos;s Timetable</h2>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {totalWeeklyPeriods} / 35 Periods
              </span>
            </div>
            <p className="text-xs text-slate-500">Click any period slot below to assign or modify classes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose} 
            className="hidden lg:inline-block px-3.5 py-2 text-slate-600 hover:bg-slate-200/70 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all ${
              hasChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> {hasChanges ? 'Save Changes' : 'Saved'}</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 min-h-0">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-2">
            <div className="font-bold text-slate-400 text-xs uppercase tracking-wider text-center self-center py-2">
              Day / Pd
            </div>
            {PERIODS.map(p => (
              <div key={p} className="text-center font-bold text-slate-700 bg-slate-100 py-2 rounded-lg text-xs uppercase tracking-wider">
                Period {p}
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={day} className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-2 items-stretch">
              <div className="font-bold text-slate-700 text-xs flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200/80">
                {day.substring(0, 3)}
              </div>
              {PERIODS.map((p, idx) => {
                const cellValue = (schedule[day] && schedule[day][idx]) || '';
                return (
                  <div 
                    key={`${day}-${p}`} 
                    onClick={() => setEditingCell({ day, idx, value: cellValue })}
                    className={`
                      relative w-full h-16 p-1.5 text-xs text-center border rounded-xl cursor-pointer transition-all flex items-center justify-center group
                      ${cellValue
                        ? 'bg-blue-50/90 border-blue-200 text-blue-900 font-bold hover:bg-blue-100 hover:border-blue-300 shadow-sm' 
                        : 'bg-white border-slate-200/80 text-slate-300 hover:border-blue-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="line-clamp-2 leading-tight px-1">
                      {cellValue || 'Free'}
                    </span>
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                      <Edit2 className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {editingCell && (
        <ClassSelectorModal
          value={editingCell.value}
          definedClasses={definedClasses}
          onClose={() => setEditingCell(null)}
          onSave={(val) => handleCellUpdate(editingCell.day, editingCell.idx, val)}
        />
      )}
    </div>
  );
};

// 4. Substitution Generator Component
const SubstitutionGenerator = ({ 
  teachers, 
  definedClasses, 
  PrintMode,
  selectedDay,
  setSelectedDay,
  absentIds,
  toggleAbsent,
  clearAbsent,
  assignments,
  setAssignments 
}) => {
  const [staffSearch, setStaffSearch] = useState('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const validClassCodes = useMemo(() => {
    const codes = new Set();
    definedClasses.forEach(cls => {
      (cls.divisions || []).forEach(div => {
        codes.add(`${cls.name}${div}`.toUpperCase());
      });
    });
    return codes;
  }, [definedClasses]);

  // Track both absent IDs and absent Teacher Names so an absent teacher is NEVER suggested or assigned
  const absentIdSet = useMemo(() => new Set(absentIds), [absentIds]);
  const absentNameSet = useMemo(() => {
    const names = new Set();
    absentIds.forEach(id => {
      const t = teachers.find(tr => tr.id === id);
      if (t?.name) names.add(t.name.trim().toUpperCase());
    });
    return names;
  }, [absentIds, teachers]);

  const isTeacherAbsent = (teacher) => {
    if (!teacher) return true;
    return absentIdSet.has(teacher.id) || absentNameSet.has((teacher.name || '').trim().toUpperCase());
  };

  const extractClassCodes = (entry) => {
    if (!entry) return [];
    const upperEntry = entry.toUpperCase();
    const found = [];
    for (const code of validClassCodes) {
      const regex = new RegExp(`\\b${code}\\b`, 'i');
      if (regex.test(upperEntry)) {
        found.push(code);
      }
    }
    return found;
  };

  const teacherTeachesAny = (teacher, targetCodes) => {
    if (!teacher.timetable || !targetCodes || targetCodes.length === 0) return false;

    for (const day of DAYS) {
      const dailySchedule = teacher.timetable[day];
      if (dailySchedule) {
        for (const cell of dailySchedule) {
          if (!cell) continue;
          const cellCodes = extractClassCodes(cell);
          if (cellCodes.some(c => targetCodes.includes(c))) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Count how many classes a teacher already has on selectedDay
  const getTeacherDailyLoad = (teacher) => {
    const sched = teacher.timetable?.[selectedDay] || [];
    return sched.filter(s => s && s.trim() !== '').length;
  };

  const substitutionData = useMemo(() => {
    if (absentIds.length === 0) return [];
    const results = [];

    absentIds.forEach(absentId => {
      const absentTeacher = teachers.find(t => t.id === absentId);
      if (!absentTeacher || !absentTeacher.timetable || !absentTeacher.timetable[selectedDay]) return;

      absentTeacher.timetable[selectedDay].forEach((subject, periodIndex) => {
        if (periodIndex < 7 && subject && subject.trim() !== '') {
          const targetCodes = extractClassCodes(subject);
          const strictMatches = [];
          const generalMatches = [];
          const presentCoTeachers = [];

          teachers.forEach(t => {
            if (t.id === absentId) return;

            const tSchedule = t.timetable?.[selectedDay];
            const tActivity = tSchedule?.[periodIndex];
            const isFree = !tActivity || tActivity.trim() === '';

            // Detect shared/combined class co-teachers who are present in the same period
            if (!isFree && !isTeacherAbsent(t)) {
              const otherCodes = extractClassCodes(tActivity);
              const sharesClass =
                (targetCodes.length > 0 && otherCodes.some(c => targetCodes.includes(c))) ||
                tActivity.trim().toUpperCase() === subject.trim().toUpperCase();
              if (sharesClass) {
                presentCoTeachers.push(t.name);
              }
            }

            // Strictly exclude any teacher who is marked absent (by ID or by Name)
            if (isTeacherAbsent(t)) return;
            
            if (isFree) {
              const dailyLoad = getTeacherDailyLoad(t);
              const freePeriodsToday = 7 - dailyLoad;
              const teacherObj = { ...t, dailyLoad, freePeriodsToday };
              if (targetCodes.length > 0 && teacherTeachesAny(t, targetCodes)) {
                strictMatches.push({ ...teacherObj, type: 'strict' });
              } else {
                generalMatches.push({ ...teacherObj, type: 'general' });
              }
            }
          });

          // Sort by most free periods today first, then alphabetically
          strictMatches.sort((a, b) => b.freePeriodsToday - a.freePeriodsToday || a.name.localeCompare(b.name));
          generalMatches.sort((a, b) => b.freePeriodsToday - a.freePeriodsToday || a.name.localeCompare(b.name));

          results.push({
            id: `${absentId}-${periodIndex}`, 
            period: periodIndex + 1,
            classInfo: subject,
            targetCodes,
            absentTeacherName: absentTeacher.name,
            absentTeacherId: absentId,
            presentCoTeachers: presentCoTeachers.sort(),
            replacements: [...strictMatches, ...generalMatches]
          });
        }
      });
    });

    return results.sort((a, b) => {
      if (a.period === b.period) {
        return a.absentTeacherName.localeCompare(b.absentTeacherName);
      }
      return a.period - b.period;
    });
  }, [selectedDay, absentIds, teachers, validClassCodes, absentIdSet, absentNameSet]);

  // Live count of how many substitutions each teacher is currently assigned today
  const assignedSubCounts = useMemo(() => {
    const counts = {};
    substitutionData.forEach(item => {
      const tid = assignments[item.id];
      if (tid && item.replacements.some(r => r.id === tid && !isTeacherAbsent(r))) {
        counts[tid] = (counts[tid] || 0) + 1;
      }
    });
    return counts;
  }, [assignments, substitutionData, absentIdSet, absentNameSet]);

  // Automatically purge any invalid or newly-absent teacher from assignments
  useEffect(() => {
    if (PrintMode) return;
    setAssignments(prev => {
      let changed = false;
      const next = { ...prev };

      Object.entries(next).forEach(([slotId, assignedTid]) => {
        const slotItem = substitutionData.find(d => d.id === slotId);
        const assignedTeacherObj = teachers.find(t => t.id === assignedTid);

        if (
          !slotItem ||
          !assignedTeacherObj ||
          isTeacherAbsent(assignedTeacherObj) ||
          !slotItem.replacements.some(r => r.id === assignedTid)
        ) {
          delete next[slotId];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [substitutionData, absentIds, teachers, PrintMode, setAssignments]);

  const isTeacherBookedInPeriod = (teacherId, period, currentSlotId) => {
    const targetTeacher = teachers.find(t => t.id === teacherId);
    const targetName = targetTeacher?.name?.trim().toUpperCase();

    for (const [slotId, assignedTeacherId] of Object.entries(assignments)) {
      if (slotId === currentSlotId || !assignedTeacherId) continue;
      const assignedItem = substitutionData.find(item => item.id === slotId);
      if (assignedItem && assignedItem.period === period) {
        if (assignedTeacherId === teacherId) return true;
        const assignedTeacher = teachers.find(t => t.id === assignedTeacherId);
        if (targetName && assignedTeacher?.name?.trim().toUpperCase() === targetName) {
          return true;
        }
      }
    }
    return false;
  };

  // Smart Auto-Assign Substitutes (Strictly excludes absent teachers & validates existing slots)
  const handleAutoAssign = () => {
    const nextAssignments = {};
    const subCountTracker = {};

    // 1. Keep only valid manual assignments where the teacher is NOT absent, IS free in that slot, and NOT double-booked
    substitutionData.forEach(item => {
      const existingTid = assignments[item.id];
      if (!existingTid) return;

      const existingTeacher = teachers.find(t => t.id === existingTid);
      const isValidReplacement = item.replacements.some(r => r.id === existingTid);

      if (existingTeacher && !isTeacherAbsent(existingTeacher) && isValidReplacement) {
        const hasPeriodConflict = Object.entries(nextAssignments).some(([otherSlotId, otherTid]) => {
          const otherItem = substitutionData.find(d => d.id === otherSlotId);
          return otherItem && otherItem.period === item.period && otherTid === existingTid;
        });

        if (!hasPeriodConflict) {
          nextAssignments[item.id] = existingTid;
          subCountTracker[existingTid] = (subCountTracker[existingTid] || 0) + 1;
        }
      }
    });

    // 2. Fill all remaining unassigned slots with non-absent, non-conflicting free teachers
    substitutionData.forEach(item => {
      if (nextAssignments[item.id]) return;

      const available = item.replacements.filter(cand => {
        if (isTeacherAbsent(cand)) return false;

        // Check period conflict in nextAssignments (by ID and Name)
        for (const [slotId, assignedTid] of Object.entries(nextAssignments)) {
          const otherItem = substitutionData.find(d => d.id === slotId);
          if (otherItem && otherItem.period === item.period) {
            if (assignedTid === cand.id) return false;
            const assignedTeacher = teachers.find(t => t.id === assignedTid);
            if (
              assignedTeacher?.name &&
              cand.name &&
              assignedTeacher.name.trim().toUpperCase() === cand.name.trim().toUpperCase()
            ) {
              return false;
            }
          }
        }
        return true;
      });

      if (available.length > 0) {
        // Prefer strict class matches, then fewer assigned substitutions today, then more free periods today
        available.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'strict' ? -1 : 1;
          const subsA = subCountTracker[a.id] || 0;
          const subsB = subCountTracker[b.id] || 0;
          if (subsA !== subsB) return subsA - subsB;
          return b.freePeriodsToday - a.freePeriodsToday || a.name.localeCompare(b.name);
        });

        const chosen = available[0];
        nextAssignments[item.id] = chosen.id;
        subCountTracker[chosen.id] = (subCountTracker[chosen.id] || 0) + 1;
      }
    });

    setAssignments(nextAssignments);
  };

  // Copy formatted substitution summary for WhatsApp
  const handleCopyWhatsApp = async () => {
    if (substitutionData.length === 0) return;
    const dateStr = new Date().toLocaleDateString('en-GB');
    const absentNames = [...absentIds]
      .map(id => teachers.find(t => t.id === id)?.name)
      .filter(Boolean)
      .sort()
      .join(', ');

    const lines = [
      `*GHSS POOKKOTTUR — SUBSTITUTION CHART*`,
      `📅 *${selectedDay.toUpperCase()}* (${dateStr})`,
      `🚫 *Absent Staff:* ${absentNames}`,
      `────────────────────`
    ];

    PERIODS.forEach(period => {
      const periodItems = substitutionData.filter(item => item.period === period);
      if (periodItems.length > 0) {
        lines.push(`\n*PERIOD ${period}*`);
        periodItems.forEach(item => {
          const assignedId = assignments[item.id];
          const rep = item.replacements.find(r => r.id === assignedId && !isTeacherAbsent(r));
          const subLabel = rep ? `*${rep.name}*` : `_Unassigned_`;
          lines.push(`• Class *${item.classInfo}*: ${subLabel} _(for ${item.absentTeacherName})_`);
        });
      }
    });

    const messageText = lines.join('\n');
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const filteredTeachers = useMemo(() => {
    return [...teachers]
      .filter(t => t.name.toLowerCase().includes(staffSearch.toLowerCase()))
      .sort((a, b) => {
        const aAbsent = absentIds.includes(a.id);
        const bAbsent = absentIds.includes(b.id);
        if (aAbsent !== bAbsent) return aAbsent ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [teachers, staffSearch, absentIds]);

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    document.title = `${dateStr}_Substitution_${selectedDay}`;

    // Temporarily widen mobile viewport so mobile print engines do not clip right-side columns
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalViewport = viewportMeta ? viewportMeta.getAttribute('content') : '';
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=1024');
    }

    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      if (viewportMeta && originalViewport) {
        viewportMeta.setAttribute('content', originalViewport);
      }
    }, 150);
  };

  const assignedCount = substitutionData.filter(item => {
    const tid = assignments[item.id];
    return tid && item.replacements.some(r => r.id === tid && !isTeacherAbsent(r));
  }).length;

  // Format option text with live assigned sub count
  const formatCandidateOption = (r, isBooked) => {
    const subCount = assignedSubCounts[r.id] || 0;
    const subTag = subCount > 0 ? ` • ${subCount} sub${subCount > 1 ? 's' : ''} assigned` : '';
    return `${r.name} (${r.freePeriodsToday} free today${subTag})${isBooked ? ' — [Busy]' : ''}`;
  };

  // Print Layout (Optimized for both Desktop and Mobile PDF generation)
  if (PrintMode) {
    return (
      <div className="print-only hidden bg-white text-black">
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            GHSS POOKKOTTUR — SUBSTITUTION CHART
          </h1>
          <h2 className="text-sm font-bold mt-0.5 uppercase">
            {selectedDay} — {new Date().toLocaleDateString('en-GB')}
          </h2>
        </div>
        
        <table className="print-table">
          <colgroup>
            <col style={{ width: '12.5%' }} />
            {PERIODS.map(p => (
              <col key={p} style={{ width: '12.5%' }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="bg-gray-100 font-bold">
                Absent Staff
              </th>
              {PERIODS.map(p => (
                <th key={p} className="bg-gray-100 font-bold">
                  Period {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...absentIds].sort((a, b) => {
              const nameA = teachers.find(t => t.id === a)?.name || "";
              const nameB = teachers.find(t => t.id === b)?.name || "";
              return nameA.localeCompare(nameB);
            }).map(absentId => {
              const teacher = teachers.find(t => t.id === absentId);
              if (!teacher) return null;
              
              return (
                <tr key={absentId}>
                  <td className="font-bold bg-white text-red-700 text-sm">
                    {teacher.name}
                  </td>
                  {PERIODS.map((p, index) => {
                    const slotId = `${absentId}-${index}`; 
                    const item = substitutionData.find(d => d.id === slotId);
                    
                    let content = "---";
                    let subName = "";
                    let subType = "";
                    
                    if (item) {
                      content = item.classInfo;
                      const assignedId = assignments[slotId];
                      const replacementInfo = item.replacements.find(r => r.id === assignedId && !isTeacherAbsent(r));
                      if (replacementInfo) {
                        subName = replacementInfo.name;
                        subType = replacementInfo.type;
                      }
                    }
                    
                    let colorClass = "text-black";
                    if (subType === 'strict') colorClass = "text-green-700";
                    else if (subType === 'general') colorClass = "text-orange-500";

                    return (
                      <td key={p}>
                        {item ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                            <span className="text-[11px] font-semibold text-gray-700 leading-tight">
                              {content}
                            </span>
                            {subName ? (
                              <span className={`font-bold text-sm leading-tight ${colorClass}`}>
                                {subName}
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-400 italic leading-tight">
                                Unassigned
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">---</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Screen Layout
  return (
    <div className="flex flex-col h-full w-full">
      <div className="screen-only flex-1 flex flex-col h-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Top Action Bar */}
        <div className="p-4 bg-slate-800 text-white shrink-0 flex flex-wrap justify-between items-center gap-3 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Substitution Generator</h2>
              <p className="text-slate-400 text-xs">Mark absent teachers and assign free staff</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {substitutionData.length > 0 && (
              <>
                <button 
                  onClick={handleAutoAssign}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg font-medium flex items-center gap-1.5 text-xs shadow-sm transition-all"
                  title="Automatically assign best available substitutes"
                >
                  <Sparkles className="w-4 h-4" /> Auto-Assign
                </button>
                <button 
                  onClick={handleCopyWhatsApp}
                  className={`px-3.5 py-2 rounded-lg font-medium flex items-center gap-1.5 text-xs shadow-sm transition-all ${
                    copiedWhatsApp 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  }`}
                  title="Copy formatted substitution chart for WhatsApp"
                >
                  {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedWhatsApp ? 'Copied!' : 'Copy WhatsApp'}
                </button>
                <button 
                  onClick={() => setAssignments({})}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 text-xs transition-all"
                  title="Reset selected substitutes"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Subs
                </button>
              </>
            )}
            <button 
              onClick={handlePrint}
              disabled={absentIds.length === 0}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs shadow-sm transition-all ${
                absentIds.length === 0 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar: Day & Absent Teacher Picker */}
          <div className="col-span-1 lg:col-span-4 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col overflow-hidden h-full min-h-0">
            <div className="mb-4 shrink-0">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                1. Select Day
              </label>
              <div className="grid grid-cols-5 gap-1 bg-slate-200/70 p-1 rounded-lg">
                {DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                      selectedDay === d 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2 shrink-0">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Absent Staff ({absentIds.length})
              </label>
              {absentIds.length > 0 && (
                <button 
                  onClick={clearAbsent}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="relative mb-2.5 shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter staff by code..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
              {staffSearch && (
                <button 
                  onClick={() => setStaffSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 min-h-0">
              {filteredTeachers.map(t => {
                const isAbsent = absentIds.includes(t.id);
                const todayClassesCount = getTeacherDailyLoad(t);
                const subCountToday = assignedSubCounts[t.id] || 0;
                return (
                  <label 
                    key={t.id} 
                    className={`
                      flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all
                      ${isAbsent 
                        ? 'bg-red-50 border-red-200 shadow-sm' 
                        : 'bg-white border-slate-200/80 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                        ${isAbsent ? 'bg-red-600 border-red-600' : 'border-slate-300 bg-white'}
                      `}>
                        {isAbsent && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isAbsent}
                        onChange={() => toggleAbsent(t.id)}
                      />
                      <span className={`font-bold text-sm ${isAbsent ? 'text-red-800' : 'text-slate-700'}`}>
                        {t.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isAbsent && subCountToday > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                          +{subCountToday} sub
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isAbsent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {todayClassesCount} pds today
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Substitution Slots */}
          <div className="col-span-1 lg:col-span-8 p-4 md:p-6 overflow-y-auto h-full min-h-0 bg-white">
            {absentIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                  <UserCheck className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-600">No Teachers Marked Absent</p>
                <p className="text-xs text-slate-400 mt-1">Select absent teachers from the left panel to generate substitutions.</p>
              </div>
            ) : substitutionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-emerald-600 py-12">
                <CheckCircle2 className="w-14 h-14 mb-3" />
                <p className="text-base font-bold">No Substitutions Needed</p>
                <p className="text-slate-500 text-xs mt-1">The selected absent staff have no scheduled classes on {selectedDay}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{selectedDay} Substitution Plan</h3>
                    <p className="text-xs text-slate-500">
                      Green options indicate teachers who already teach the target class
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                      Total: {substitutionData.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                      Assigned: {assignedCount}
                    </span>
                    {substitutionData.length - assignedCount > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                        Pending: {substitutionData.length - assignedCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Slot Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {substitutionData.map((item) => {
                    const rawAssignedId = assignments[item.id] || "";
                    const assignedRep = item.replacements.find(r => r.id === rawAssignedId && !isTeacherAbsent(r));
                    const assignedTeacherId = assignedRep ? rawAssignedId : "";

                    return (
                      <div 
                        key={item.id} 
                        className={`rounded-xl border transition-all overflow-hidden ${
                          assignedTeacherId 
                            ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' 
                            : 'border-slate-200 bg-white shadow-sm'
                        }`}
                      >
                        <div className="bg-slate-50/80 px-3.5 py-2.5 border-b border-slate-100 flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                              PD {item.period}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">
                              Class {item.classInfo}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            Absent: {item.absentTeacherName}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-2">
                          {item.presentCoTeachers && item.presentCoTeachers.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>
                                Shared Batch — Co-Teacher Present: <strong>{item.presentCoTeachers.join(', ')}</strong>
                              </span>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Substitute Teacher
                              </label>
                              {assignedRep && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  assignedRep.type === 'strict' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {assignedRep.type === 'strict' ? 'Class Teacher Match' : 'General Free Staff'}
                                </span>
                              )}
                            </div>
                            <select 
                              className={`w-full p-2 border rounded-lg text-sm font-medium outline-none transition-all ${
                                assignedTeacherId 
                                  ? 'border-emerald-300 bg-white text-slate-800 font-bold' 
                                  : 'border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500'
                              }`}
                              value={assignedTeacherId}
                              onChange={(e) => setAssignments(prev => ({ ...prev, [item.id]: e.target.value }))}
                            >
                              <option value="">-- Select Substitute --</option>
                              <optgroup label="★ Teaches This Class (Preferred)">
                                {item.replacements.filter(r => r.type === 'strict' && !isTeacherAbsent(r)).map(r => {
                                  const isBooked = isTeacherBookedInPeriod(r.id, item.period, item.id);
                                  return (
                                    <option key={r.id} value={r.id} disabled={isBooked}>
                                      {formatCandidateOption(r, isBooked)}
                                    </option>
                                  );
                                })}
                              </optgroup>
                              <optgroup label="Other Free Teachers">
                                {item.replacements.filter(r => r.type === 'general' && !isTeacherAbsent(r)).map(r => {
                                  const isBooked = isTeacherBookedInPeriod(r.id, item.period, item.id);
                                  return (
                                    <option key={r.id} value={r.id} disabled={isBooked}>
                                      {formatCandidateOption(r, isBooked)}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Shell ---
export default function App() {
  const [user, setUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('substitute'); 
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin PIN session state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pinModal, setPinModal] = useState({ isOpen: false, actionLabel: '', onConfirm: null });

  const requireAdminAuth = (actionLabel, callback) => {
    if (isAdminUnlocked) {
      return callback();
    }
    setPinModal({
      isOpen: true,
      actionLabel,
      onConfirm: () => {
        setIsAdminUnlocked(true);
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        } catch (e) {
          console.warn(e);
        }
        setPinModal({ isOpen: false, actionLabel: '', onConfirm: null });
        callback();
      }
    });
    return false;
  };

  const toggleAdminLock = () => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
      try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch (e) {
        console.warn(e);
      }
    } else {
      requireAdminAuth('Unlock Admin Mode for Timetable & Database Edits', () => {});
    }
  };

  // Hoisted state for substitution logic (persisted in localStorage for today)
  const initialPersisted = useMemo(() => loadPersistedSubState(), []);
  const [selectedDay, setSelectedDay] = useState(initialPersisted.selectedDay);
  const [absentIds, setAbsentIds] = useState(initialPersisted.absentIds);
  const [assignments, setAssignments] = useState(initialPersisted.assignments);

  // Persist substitution state to localStorage whenever it changes
  useEffect(() => {
    try {
      const todayStr = new Date().toLocaleDateString('en-GB');
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: todayStr,
          selectedDay,
          absentIds,
          assignments
        })
      );
    } catch (e) {
      console.warn("Could not save state to localStorage", e);
    }
  }, [selectedDay, absentIds, assignments]);

  // Set Clock Favicon and Page Title dynamically
  useEffect(() => {
    document.title = "GHSS Pookkottur — SchoolScheduler";
    const clockSvg = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%231e293b%22 stroke=%22%2338bdf8%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22/><polyline points=%2212 6 12 12 16 14%22/></svg>`;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = clockSvg;
  }, []);

  // Clean up assignments whenever a teacher is marked OR unmarked absent
  const toggleAbsent = (id) => {
    setAbsentIds(prev => {
      const exists = prev.includes(id);
      const nextAbsentIds = exists ? prev.filter(pid => pid !== id) : [...prev, id];
      const nextAbsentSet = new Set(nextAbsentIds);

      setAssignments(curr => {
        const next = { ...curr };
        Object.keys(next).forEach(key => {
          if (
            key.startsWith(`${id}-`) ||
            next[key] === id ||
            nextAbsentSet.has(next[key])
          ) {
            delete next[key];
          }
        });
        return next;
      });

      return nextAbsentIds;
    });
  };

  const clearAbsent = () => {
    setAbsentIds([]);
    setAssignments({});
  };

  // Switching the day resets day-specific substitute assignments
  const handleSelectDay = (day) => {
    if (day === selectedDay) return;
    setSelectedDay(day);
    setAssignments({});
  };

  // Auth & Initial Data Load
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            console.warn("Custom token failed, trying anonymous:", e);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed", err);
        setAuthError(err.message);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // AUTO-SEED Logic (Runs once if DB is empty)
  useEffect(() => {
    const seedDatabase = async () => {
      if (!user) return;
      
      try {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const batch = writeBatch(db);

          INITIAL_CLASSES.forEach(cls => {
            const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'));
            batch.set(ref, { ...cls, createdAt: serverTimestamp() });
          });

          INITIAL_TEACHERS.forEach(t => {
            const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'));
            batch.set(ref, { ...t, createdAt: serverTimestamp() });
          });

          await batch.commit();
        }
      } catch (e) {
        console.error("Auto-seed error", e);
      }
    };

    if (user && !loading) {
      seedDatabase();
    }
  }, [user, loading]);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    const qTeachers = query(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const loadedTeachers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(loadedTeachers);
      if (classes.length > 0 || snapshot.empty) setLoading(false); 
    });

    const qClasses = query(collection(db, 'artifacts', appId, 'public', 'data', 'classes'));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      const loadedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(loadedClasses);
      setLoading(false);
    });

    return () => {
      unsubTeachers();
      unsubClasses();
    };
  }, [user]);

  const selectedTeacher = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  // --- PROTECTED ACTIONS (Add, Update, Delete) ---
  const addTeacher = (name) => {
    if (!user) return;
    requireAdminAuth(`Add teacher "${name}"`, async () => {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'), {
        name,
        timetable: {},
        createdAt: serverTimestamp()
      });
      setSelectedTeacherId(docRef.id);
    });
  };

  const updateTimetable = (teacherId, newTimetable) => {
    if (!user) return false;
    return new Promise((resolve) => {
      if (isAdminUnlocked) {
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teachers', teacherId), { timetable: newTimetable })
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else {
        setPinModal({
          isOpen: true,
          actionLabel: 'Save timetable changes',
          onConfirm: async () => {
            setIsAdminUnlocked(true);
            try {
              sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
            } catch (e) {
              console.warn(e);
            }
            setPinModal({ isOpen: false, actionLabel: '', onConfirm: null });
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teachers', teacherId), { timetable: newTimetable });
            resolve(true);
          }
        });
      }
    });
  };

  const deleteTeacher = (teacherId) => {
    if (!user) return;
    requireAdminAuth('Delete teacher from directory', async () => {
      if (!confirm('Delete this teacher from the directory?')) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teachers', teacherId));
      if (selectedTeacherId === teacherId) setSelectedTeacherId(null);
    });
  };

  const addClass = (name) => {
    if (!user) return;
    if (classes.some(c => c.name === name)) return alert("Class already exists");
    requireAdminAuth(`Add Standard ${name}`, async () => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), {
        name,
        divisions: [],
        createdAt: serverTimestamp()
      });
    });
  };

  const updateClass = (classId, divisions) => {
    if (!user) return;
    requireAdminAuth('Modify class divisions', async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId), { divisions });
    });
  };

  const deleteClass = (classId) => {
    if (!user) return;
    requireAdminAuth('Delete class standard', async () => {
      if (!confirm('Delete this class standard?')) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId));
    });
  };

  // FORCE RELOAD Action (Protected by PIN)
  const handleForceReloadDefaults = () => {
    if (!user) {
      alert("Please wait for authentication to finish.");
      return;
    }
    requireAdminAuth('Sync database with default GHSS Pookkottur timetable', async () => {
      if (!confirm("Reset database to the new GHSS Pookkottur default timetable (42 teachers & classes 8-10)? This will replace outdated teachers and classes.")) return;
      
      setImporting(true);
      try {
        const batch = writeBatch(db);

        const existingClassesSnap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'classes')));
        existingClassesSnap.forEach(d => batch.delete(d.ref));

        const existingTeachersSnap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'teachers')));
        existingTeachersSnap.forEach(d => batch.delete(d.ref));

        for (const cls of INITIAL_CLASSES) {
          const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'));
          batch.set(ref, { name: cls.name, divisions: cls.divisions, createdAt: serverTimestamp() });
        }

        for (const t of INITIAL_TEACHERS) {
          const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'));
          batch.set(ref, { name: t.name, timetable: t.timetable, createdAt: serverTimestamp() });
        }

        await batch.commit();
        setSelectedTeacherId(null);
        clearAbsent();
        alert("Database successfully updated with the new GHSS Pookkottur classes and 42 teachers!");
      } catch (e) {
        console.error(e);
        alert("Error updating database: " + e.message);
      }
      setImporting(false);
    });
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Loading SchoolScheduler...</span>
    </div>
  );

  return (
    <div className="app-root-shell h-screen w-full flex flex-col overflow-hidden bg-slate-100 text-slate-800 font-sans print:h-auto print:overflow-visible">
      {/* Global Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          html, body, #root, .app-root-shell {
            height: auto !important;
            min-height: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            display: block !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
          }
          .print-table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #000000 !important;
            padding: 4px 2px !important;
            text-align: center !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            height: 48px !important;
          }
          .print-table th {
            background-color: #f3f4f6 !important;
            font-weight: 700 !important;
            height: 32px !important;
          }
          .print-table thead {
            display: table-header-group !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .text-orange-500 {
            color: #f97316 !important;
          }
          .text-green-700 {
            color: #15803d !important;
          }
        }
      `}</style>
      
      {/* --- SCREEN LAYOUT --- */}
      <div className="screen-only flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-slate-900 text-white shadow-md z-10 shrink-0">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight">SchoolScheduler</h1>
                  <span className="hidden sm:inline-block text-[11px] font-bold bg-slate-800 text-blue-400 px-2 py-0.5 rounded-md border border-slate-700">
                    GHSS POOKKOTTUR
                  </span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-slate-800 rounded-xl p-1 gap-1 items-center mr-2 border border-slate-700/70">
                <button 
                  onClick={() => setActiveTab('substitute')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'substitute' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Generate Subs
                </button>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'manage' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Timetables ({teachers.length})
                </button>
                <button 
                  onClick={() => setActiveTab('classes')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'classes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Classes ({classes.length})
                </button>
              </div>
              <button
                onClick={toggleAdminLock}
                className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border ${
                  isAdminUnlocked
                    ? 'bg-emerald-900/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={isAdminUnlocked ? 'Admin Unlocked (Click to Lock)' : 'Admin Locked (Click to Unlock with PIN)'}
              >
                {isAdminUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isAdminUnlocked ? 'Unlocked' : 'Locked'}</span>
              </button>
              <button 
                onClick={handleForceReloadDefaults}
                disabled={importing}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-700"
                title="Sync Database with Default GHSS Pookkottur Timetable"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                <span>Sync DB</span>
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-slate-800 p-4 space-y-2 border-t border-slate-700">
              <button 
                onClick={() => { setActiveTab('substitute'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold ${
                  activeTab === 'substitute' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                Generate Substitutions
              </button>
              <button 
                onClick={() => { setActiveTab('manage'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold ${
                  activeTab === 'manage' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                Staff Timetables ({teachers.length})
              </button>
              <button 
                onClick={() => { setActiveTab('classes'); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold ${
                  activeTab === 'classes' ? 'bg-blue-600 text-white' : 'text-slate-300'
                }`}
              >
                Class Directory ({classes.length})
              </button>
              <button 
                onClick={() => { toggleAdminLock(); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-amber-300 flex items-center gap-2 border-t border-slate-700 pt-3"
              >
                {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isAdminUnlocked ? 'Lock Admin Edits' : 'Unlock Admin Edits (PIN)'}
              </button>
              <button 
                onClick={() => { handleForceReloadDefaults(); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-blue-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Sync Default Timetable DB
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 p-2 md:p-4 overflow-hidden min-h-0 relative">
          {authError && (
            <div className="absolute top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Authentication Error</h3>
                <p className="text-sm mt-1 opacity-90">{authError}</p>
              </div>
              <button onClick={() => setAuthError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {activeTab === 'classes' && (
              <div className="h-full w-full">
                <ClassDirectory 
                  classes={classes} 
                  onAddClass={addClass}
                  onUpdateClass={updateClass}
                  onDeleteClass={deleteClass}
                />
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
                <div className={`col-span-1 lg:col-span-3 h-full min-h-0 ${selectedTeacher ? 'hidden lg:block' : 'block'}`}>
                  <TeacherManager 
                    teachers={teachers}
                    selectedTeacherId={selectedTeacherId}
                    onSelectTeacher={(t) => setSelectedTeacherId(t.id)}
                    onDeleteTeacher={deleteTeacher}
                    onAddTeacher={addTeacher}
                  />
                </div>
                <div className={`col-span-1 lg:col-span-9 h-full min-h-0 ${selectedTeacher ? 'block' : 'hidden lg:block'}`}>
                  {selectedTeacher ? (
                    <TimetableEditor 
                      teacher={selectedTeacher}
                      definedClasses={classes}
                      onUpdateTimetable={updateTimetable}
                      onClose={() => setSelectedTeacherId(null)}
                    />
                  ) : (
                    <div className="hidden lg:flex h-full bg-white rounded-xl border border-slate-200 border-dashed flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <Calendar className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-base font-bold text-slate-600 mb-1">Select a Staff Member</h3>
                      <p className="max-w-xs text-xs text-slate-400">
                        Choose a teacher from the directory on the left to view or edit their weekly schedule.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'substitute' && (
              <SubstitutionGenerator 
                teachers={teachers} 
                definedClasses={classes}
                selectedDay={selectedDay}
                setSelectedDay={handleSelectDay}
                absentIds={absentIds}
                toggleAbsent={toggleAbsent}
                clearAbsent={clearAbsent}
                assignments={assignments}
                setAssignments={setAssignments}
              />
            )}
          </div>
        </main>
      </div>
      
      {/* --- ADMIN PIN MODAL --- */}
      <PinPromptModal
        isOpen={pinModal.isOpen}
        actionLabel={pinModal.actionLabel}
        onClose={() => setPinModal({ isOpen: false, actionLabel: '', onConfirm: null })}
        onSuccess={() => pinModal.onConfirm && pinModal.onConfirm()}
      />

      {/* --- PRINT LAYOUT (ONLY VISIBLE WHEN PRINTING) --- */}
      {activeTab === 'substitute' && (
        <SubstitutionGenerator 
          PrintMode={true} 
          teachers={teachers} 
          definedClasses={classes}
          selectedDay={selectedDay}
          setSelectedDay={() => {}}
          absentIds={absentIds}
          toggleAbsent={() => {}}
          clearAbsent={() => {}}
          assignments={assignments}
          setAssignments={() => {}}
        />
      )}
    </div>
  );
}