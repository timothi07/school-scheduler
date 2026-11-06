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
  AlertCircle, 
  CheckCircle2, 
  Search,
  ArrowRight,
  Clock,
  BookOpen,
  X,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Printer,
  Menu
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

// --- Constants ---
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

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
      "Wednesday": ["", "8H", "9A", "", "8A", "10A", "9D"],
      "Thursday": ["", "8A", "8H", "8J", "", "10A, 10H", "10F"],
      "Friday": ["", "10A, 10H", "10A", "", "", "10F", "9I"]
    }
  },
  {
    name: "HN",
    timetable: {
      "Monday": ["10B", "", "8I", "10H", "", "8C", "10B"],
      "Tuesday": ["10B", "8I", "10H", "", "", "8C", ""],
      "Wednesday": ["10B", "", "10B", "", "10H", "", ""],
      "Thursday": ["", "", "8C", "", "10H", "8I", "10B"],
      "Friday": ["10B", "", "8C", "8I", "", "", "10H"]
    }
  },
  {
    name: "SH",
    timetable: {
      "Monday": ["9A", "9E", "", "", "8J", "10C", "8I"],
      "Tuesday": ["8I", "", "8J", "9D", "10B", "8H", "10C"],
      "Wednesday": ["9A", "", "", "9D", "8G", "", "8H"],
      "Thursday": ["10C", "", "", "9E", "10D", "", ""],
      "Friday": ["10C", "", "10B", "10D", "", "8G", ""]
    }
  },
  {
    name: "SD",
    timetable: {
      "Monday": ["", "8D", "10C", "8G", "", "10E", "8A, 8G"],
      "Tuesday": ["8G", "", "8B", "", "8A, 8G", "10E", "8F"],
      "Wednesday": ["10D", "9H", "10C", "", "8F", "9F", ""],
      "Thursday": ["9C", "", "9H", "8D", "8A, 8G", "", ""],
      "Friday": ["8B", "", "9F", "9C", "8A, 8G", "", "10D"]
    }
  },
  {
    name: "LC",
    timetable: {
      "Monday": ["10E", "10H", "", "8E", "9H", "8E", ""],
      "Tuesday": ["10E", "", "", "9H", "10H", "", ""],
      "Wednesday": ["10E", "10H", "", "", "8E", "8E", "10H"],
      "Thursday": ["", "10H", "", "10E", "9H", "8E", ""],
      "Friday": ["10E", "9H", "", "9H", "10H", "10H", ""]
    }
  },
  {
    name: "SW",
    timetable: {
      "Monday": ["10F", "10C", "9A", "", "8I", "10D", ""],
      "Tuesday": ["9B", "10F", "9A", "9F", "10D", "10C", ""],
      "Wednesday": ["10F", "", "8I", "9F", "", "", "8H"],
      "Thursday": ["10F", "", "9F", "", "9B", "", "10D"],
      "Friday": ["10F", "", "8H", "", "", "", "10C"]
    }
  },
  {
    name: "SKK",
    timetable: {
      "Monday": ["10G", "", "8H", "", "10A", "", "9A"],
      "Tuesday": ["10G", "8B", "8H", "", "9A", "", "10A"],
      "Wednesday": ["10G", "", "", "9A", "", "8B", "10A"],
      "Thursday": ["10G", "8B", "10A", "", "9A", "", ""],
      "Friday": ["10G", "9A", "", "", "8B", "10A", ""]
    }
  },
  {
    name: "DDB",
    timetable: {
      "Monday": ["10H", "8C", "10A", "", "8H", "8H", ""],
      "Tuesday": ["10H", "", "8C", "", "10A", "8H", "9I"],
      "Wednesday": ["10H", "", "8H", "", "10A", "", "8C"],
      "Thursday": ["10H", "10A", "8H", "", "9I", "", "8C"],
      "Friday": ["10H", "", "", "", "10A", "8C", ""]
    }
  },
  {
    name: "SA",
    timetable: {
      "Monday": ["9B", "8F", "", "8D", "", "10H", "9H"],
      "Tuesday": ["", "9A", "", "10F", "9G", "", ""],
      "Wednesday": ["9B", "8D", "", "", "9I", "10F", "8F"],
      "Thursday": ["", "8E", "", "9A", "9H", "", "10A"],
      "Friday": ["10A", "9I", "", "10H", "8E", "9G", ""]
    }
  },
  {
    name: "NTK",
    timetable: {
      "Monday": ["9F", "", "", "", "9E", "8B", "9B"],
      "Tuesday": ["10H", "", "8F", "", "9B", "10G", "8B"],
      "Wednesday": ["9F", "8F", "8H", "9C", "9C", "8H", ""],
      "Thursday": ["8G", "", "", "", "10F", "10F", "10H"],
      "Friday": ["10G", "", "8G", "", "", "9E", ""]
    }
  },
  {
    name: "KK",
    timetable: {
      "Monday": ["9D", "", "10E", "8C", "", "9B", "9I"],
      "Tuesday": ["9D", "8C", "9I", "8H", "", "", "8G"],
      "Wednesday": ["", "8G", "9B", "", "8H", "10H", ""],
      "Thursday": ["9B", "", "10H", "8G", "", "10E", "8H"],
      "Friday": ["9D", "", "10H", "", "10E", "9I", "8C"]
    }
  },
  {
    name: "SJL",
    timetable: {
      "Monday": ["9I", "", "8I", "", "10C", "8I", "10F"],
      "Tuesday": ["9I", "10C", "8G", "", "10F", "", "10F"],
      "Wednesday": ["9I", "10F", "10C", "8G", "", "8I", ""],
      "Thursday": ["", "", "9I", "10C", "8I", "", "8I"],
      "Friday": ["9I", "", "10C", "", "", "", "10F"]
    }
  },
  {
    name: "PMD",
    timetable: {
      "Monday": ["9C", "", "10G", "8F", "10D", "8J", "8J"],
      "Tuesday": ["9C", "9C", "10G", "", "8F", "8J", ""],
      "Wednesday": ["9C", "10G", "8F", "10D", "8J", "", ""],
      "Thursday": ["10D", "10G", "8F", "", "8J", "", "10D"],
      "Friday": ["9C", "", "", "8F", "8J", "10D", "10G"]
    }
  },
  {
    name: "KAJ",
    timetable: {
      "Monday": ["", "8I", "10D", "", "9A", "10F", ""],
      "Tuesday": ["9G", "", "9A", "8I", "", "10D", "10F"],
      "Wednesday": ["9G", "10F", "10D", "10D", "9A", "", "8I"],
      "Thursday": ["9G", "", "", "10F", "8I", "", ""],
      "Friday": ["9G", "10D", "8I", "", "10F", "", "9A"]
    }
  },
  {
    name: "AV",
    timetable: {
      "Monday": ["10D", "", "10G", "", "10B", "8J", ""],
      "Tuesday": ["9H", "", "10G", "8J", "10D", "", "10B"],
      "Wednesday": ["9H", "", "8J", "", "10B", "", "10G"],
      "Thursday": ["9H", "", "8J", "10B", "10G", "10G", ""],
      "Friday": ["9H", "", "10B", "", "", "8J", ""]
    }
  },
  {
    name: "MN",
    timetable: {
      "Monday": ["", "9I", "", "8J", "9C", "", "10H"],
      "Tuesday": ["9E", "", "8G", "", "9C", "", "10H"],
      "Wednesday": ["9I", "", "10H", "9B", "9D", "", ""],
      "Thursday": ["9E", "", "10E", "", "", "8J", "10E"],
      "Friday": ["9B", "", "", "8G", "9D", "", "10E"]
    }
  },
  {
    name: "RVV",
    timetable: {
      "Monday": ["10A", "10D", "9E", "10G", "9E", "8I", "9F"],
      "Tuesday": ["8A", "", "10D", "10G", "8I", "9G", ""],
      "Wednesday": ["8A", "", "", "10A", "", "", ""],
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
      "Thursday": ["8B", "", "9H", "10B", "10C", "9A", "10C"],
      "Friday": ["9A", "", "8J", "10F", "", "", "10B"]
    }
  },
  {
    name: "FK",
    timetable: {
      "Monday": ["8C", "", "9C", "9D", "", "9E", "8B"],
      "Tuesday": ["8C", "", "10B", "9F", "10E", "10E", ""],
      "Wednesday": ["9D", "", "9C", "8A", "10G", "9E", ""],
      "Thursday": ["9A", "8B", "", "10G", "9A", "10B", ""],
      "Friday": ["8A", "", "", "9F", "", "", ""]
    }
  },
  {
    name: "AVK",
    timetable: {
      "Monday": ["", "8F", "9F", "10C", "", "10B", "8A, 8G"],
      "Tuesday": ["9F", "8F", "9B", "", "8A, 8G", "10B", ""],
      "Wednesday": ["", "9B", "", "", "9F", "10C", "10B"],
      "Thursday": ["10C", "", "8F", "", "8A, 8G", "9B", ""],
      "Friday": ["10B", "8F", "9B", "", "8A, 8G", "10C", "9F"]
    }
  },
  {
    name: "NVM",
    timetable: {
      "Monday": ["8E", "9G", "10A, 10H", "", "10G", "9A, 9I", ""],
      "Tuesday": ["", "9G", "8I", "10A, 10H", "", "8E", "9A, 9I"],
      "Wednesday": ["8E", "8I", "10G", "", "9G", "", "8E"],
      "Thursday": ["", "", "", "8I", "10G", "10A, 10H", "9A, 9I"],
      "Friday": ["8I", "10A, 10H", "9A, 9I", "", "9G", "10G", ""]
    }
  },
  {
    name: "SM",
    timetable: {
      "Monday": ["", "8J", "10F", "9I", "", "", ""],
      "Tuesday": ["8J", "8F", "", "", "9I", "10F", ""],
      "Wednesday": ["8J", "", "10F", "", "", "8F", "9I"],
      "Thursday": ["", "", "10F", "9I", "8F", "", "8J"],
      "Friday": ["", "8J", "10F", "9I", "8F", "", "8J"]
    }
  },
  {
    name: "PKP",
    timetable: {
      "Monday": ["8G", "9G", "9F", "", "8D", "", "8H"],
      "Tuesday": ["8G", "8H", "8D", "", "", "9G", "9F"],
      "Wednesday": ["8G", "9G", "8H", "8H", "", "9F", ""],
      "Thursday": ["8G", "8D", "9G", "9F", "", "", ""],
      "Friday": ["8G", "9G", "8D", "9F", "8D", "", "8H"]
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
      "Friday": ["", "10D", "9G", "8J", "", "10E", "8E"]
    }
  },
  {
    name: "RCK",
    timetable: {
      "Monday": ["", "", "8H", "", "10F", "9C", ""],
      "Tuesday": ["8H", "", "10F", "", "8D", "", ""],
      "Wednesday": ["8D", "9C", "", "", "10F", "", ""],
      "Thursday": ["8D", "", "8H", "", "10F", "9C", ""],
      "Friday": ["8D", "", "", "", "8H", "9C", ""]
    }
  },
  {
    name: "SV",
    timetable: {
      "Monday": ["8I", "10B", "", "9E", "10H", "9A, 9I", ""],
      "Tuesday": ["9B", "10A", "", "8C", "8I", "", "9A, 9I"],
      "Wednesday": ["10A", "9G", "", "10H", "", "", "9E"],
      "Thursday": ["", "9B", "9G", "8C", "", "10B", "9A, 9I"],
      "Friday": ["", "8E", "9A, 9I", "8E", "", "", ""]
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
      "Monday": ["9E", "10E", "", "", "10E", "8E", "8A, 8G"],
      "Tuesday": ["8B, 8C", "", "", "", "8A, 8G", "", "10E"],
      "Wednesday": ["9E", "8B, 8C", "", "", "10E", "", ""],
      "Thursday": ["10E", "9E", "", "8B, 8C", "8A, 8G", "", ""],
      "Friday": ["", "10E", "", "8B, 8C", "8A, 8G", "", "9E"]
    }
  },
  {
    name: "KAK",
    timetable: {
      "Monday": ["", "8G", "8E", "", "", "8F", "10E"],
      "Tuesday": ["", "10E", "8E", "8G", "8E", "9I", ""],
      "Wednesday": ["", "10E", "", "9I", "", "8G", ""],
      "Thursday": ["9I", "10E", "8G", "", "9I", "8F", "8E"],
      "Friday": ["", "10E", "", "", "", "8E", "8G"]
    }
  },
  {
    name: "KVJ",
    timetable: {
      "Monday": ["10C", "9C", "", "9B", "8B", "8A", ""],
      "Tuesday": ["9C", "", "8A", "10C", "8B", "", ""],
      "Wednesday": ["9C", "", "8A", "10C", "8B", "", "9B"],
      "Thursday": ["8A", "", "10C", "", "8B", "8A", "9B"],
      "Friday": ["", "8A", "10C", "", "9C", "9B", "8B"]
    }
  },
  {
    name: "MNP",
    timetable: {
      "Monday": ["9H", "8A", "", "8G", "9E", "", "10D"],
      "Tuesday": ["10D", "9H", "", "9E", "", "8G", "8A"],
      "Wednesday": ["", "10D", "", "9E", "", "9H", "8G"],
      "Thursday": ["", "9E", "9H", "10D", "", "8A", "8G"],
      "Friday": ["9E", "9H", "", "8A", "10D", "", ""]
    }
  },
  {
    name: "RKC",
    timetable: {
      "Monday": ["", "9H", "10B", "", "9G", "", "9G"],
      "Tuesday": ["", "8A", "10A", "9G", "10A", "", ""],
      "Wednesday": ["", "10A", "", "", "10G", "10G", "9H"],
      "Thursday": ["", "10G", "8B", "10G", "10B", "9G", "10G"],
      "Friday": ["", "10B", "8A", "", "8B", "", ""]
    }
  },
  {
    name: "SMR",
    timetable: {
      "Monday": ["8A", "", "9B", "9A", "8C", "", "8B"],
      "Tuesday": ["9A", "", "8A", "8B", "8C", "", "9B"],
      "Wednesday": ["", "9A", "8C", "8B", "", "9B", "8A"],
      "Thursday": ["9B", "", "9A", "8A", "", "8C", "8B"],
      "Friday": ["8C", "", "8B", "9A", "", "8A", "9B"]
    }
  },
  {
    name: "CPS",
    timetable: {
      "Monday": ["10A", "", "9D", "10B", "", "", "9E"],
      "Tuesday": ["10A", "10A", "", "10B", "", "9D", "9E"],
      "Wednesday": ["10C", "", "9E", "", "9D", "10B", ""],
      "Thursday": ["10B", "", "10A", "9D", "", "10C", "9E"],
      "Friday": ["9E", "", "9D", "", "10B", "", "10A"]
    }
  },
  {
    name: "SML",
    timetable: {
      "Monday": ["", "", "8A", "9F", "", "", ""],
      "Tuesday": ["", "8H", "9B", "8E", "", "8F", "8D"],
      "Wednesday": ["", "9E", "8B", "8C", "9D", "9A", "9G"],
      "Thursday": ["", "9I", "8I", "", "", "8G", "9C"],
      "Friday": ["", "8I", "", "8J", "", "9H", "8I"]
    }
  },
  {
    name: "KYA",
    timetable: {
      "Monday": ["", "9B", "8B", "", "8G", "", "8E"],
      "Tuesday": ["", "9I", "9E", "", "", "8A", "9G"],
      "Wednesday": ["", "8I", "9D", "", "", "8A", "9A"],
      "Thursday": ["", "9F", "", "8J", "8C", "", "8A"],
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
      "Monday": ["", "8F", "9H", "", "", "9D", "8D"],
      "Tuesday": ["8F", "9E", "8D", "8F", "9E", "9F", "9H"],
      "Wednesday": ["", "9F", "", "8D", "", "9D", ""],
      "Thursday": ["9F", "", "8F", "8D", "9E", "", "9D"],
      "Friday": ["9F", "9D", "", "9E", "", "8F", "8D"]
    }
  },
  {
    name: "B4",
    timetable: {
      "Monday": ["8B", "", "", "", "9F", "8D", "8C"],
      "Tuesday": ["8E", "", "", "9C", "9F", "", "9D"],
      "Wednesday": ["9D", "8E", "8F", "", "8D", "8C", ""],
      "Thursday": ["8C", "", "", "", "8B", "8D", "8F"],
      "Friday": ["8C", "8E", "", "", "8D", "", "9C"]
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

// --- Components ---

// 1. Class Directory Component
const ClassDirectory = ({ classes, onAddClass, onDeleteClass, onUpdateClass }) => {
  const [newClassName, setNewClassName] = useState('');
  const [newDivName, setNewDivName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName);
    setNewClassName('');
  };

  const handleAddDivision = async (classId, currentDivisions) => {
    if (!newDivName.trim()) return;
    const updatedDivisions = [...(currentDivisions || []), newDivName.trim().toUpperCase()].sort();
    await onUpdateClass(classId, updatedDivisions);
    setNewDivName('');
  };

  const handleRemoveDivision = async (classId, currentDivisions, divToRemove) => {
    const updatedDivisions = currentDivisions.filter(d => d !== divToRemove);
    await onUpdateClass(classId, updatedDivisions);
  };

  const sortedClasses = [...classes].sort((a, b) => {
    const numA = parseInt(a.name) || 0;
    const numB = parseInt(b.name) || 0;
    return numA - numB || a.name.localeCompare(b.name);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden print:hidden">
      {/* Class List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Class Standards
          </h2>
          <p className="text-xs text-slate-500 mt-1">Add grades (e.g., 8, 9, 10)</p>
        </div>
        <div className="p-4 border-b border-slate-100 shrink-0">
          <form onSubmit={handleAddClass} className="flex gap-2">
            <input
              type="text"
              placeholder="Class..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1 min-h-0">
          {sortedClasses.map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedClassId === cls.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-transparent hover:bg-slate-50'}`}
            >
              <span className="font-bold text-slate-700">Class {cls.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteClass(cls.id); }}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Divisions Manager */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Divisions</h2>
          <p className="text-xs text-slate-500 mt-1">
            {selectedClassId 
              ? `Divisions for Class ${classes.find(c => c.id === selectedClassId)?.name}` 
              : 'Select a class to manage divisions'}
          </p>
        </div>
        
        {selectedClassId ? (
          <>
            <div className="p-4 border-b border-slate-100 shrink-0">
               <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Div..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase w-full"
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  maxLength={2}
                />
                <button 
                  onClick={() => handleAddDivision(selectedClassId, classes.find(c => c.id === selectedClassId)?.divisions)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              <div className="flex flex-wrap gap-3">
                {classes.find(c => c.id === selectedClassId)?.divisions?.map((div, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {div}
                    <button 
                      onClick={() => handleRemoveDivision(selectedClassId, classes.find(c => c.id === selectedClassId)?.divisions, div)}
                      className="w-4 h-4 rounded-full bg-slate-300 text-white hover:bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {(!classes.find(c => c.id === selectedClassId)?.divisions?.length) && (
                  <p className="text-sm text-slate-400 italic">No divisions added yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
            <ArrowRight className="w-8 h-8 opacity-20" />
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Teacher List & Add Component
const TeacherManager = ({ teachers, onSelectTeacher, onDeleteTeacher, onAddTeacher }) => {
  const [newTeacherName, setNewTeacherName] = useState('');
  const [filter, setFilter] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    onAddTeacher(newTeacherName);
    setNewTeacherName('');
  };

  const filteredTeachers = teachers
    .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Staff Directory
        </h2>
      </div>
      
      <div className="p-4 border-b border-slate-100 shrink-0">
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Add Teacher..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all w-full"
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1 min-h-0">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No teachers found.
          </div>
        ) : (
          filteredTeachers.map(teacher => (
            <div 
              key={teacher.id} 
              onClick={() => onSelectTeacher(teacher)}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-slate-700 group-hover:text-blue-700 truncate">{teacher.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteTeacher(teacher.id); }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all z-10 shrink-0"
                title="Delete Teacher"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper: Multi-Select Modal
const ClassSelectorModal = ({ value, definedClasses, onClose, onSave }) => {
  const [selected, setSelected] = useState(new Set());
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    const initialSet = new Set();
    if (value) {
      const parts = value.split(',').map(s => s.trim().toUpperCase());
      parts.forEach(p => {
        let found = false;
        definedClasses.forEach(cls => {
          (cls.divisions || []).forEach(div => {
            const code = `${cls.name}${div}`.toUpperCase();
            if (p.includes(code)) {
              initialSet.add(code);
              found = true;
            }
          });
        });
      });
      
      let remaining = value;
      definedClasses.forEach(cls => {
          (cls.divisions || []).forEach(div => {
            const code = `${cls.name}${div}`;
            const regex = new RegExp(`${code}[, ]*`, 'gi');
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
    let result = Array.from(selected).sort().join(', ');
    if (customText) {
      result = result ? `${result} ${customText}` : customText;
    }
    onSave(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">Select Classes</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {definedClasses.map(cls => (
            <div key={cls.id}>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">
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
                        onClick={() => toggle(code)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-bold border transition-all
                          ${isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        {code}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No divisions added yet.</span>
                )}
              </div>
            </div>
          ))}
          
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Subject / Note</label>
             <input 
               type="text" 
               placeholder="e.g. Math, Eng, Library..."
               className="w-full p-2 border border-slate-300 rounded-lg text-sm"
               value={customText}
               onChange={e => setCustomText(e.target.value)}
             />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium text-sm hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 shadow-sm">Done</button>
        </div>
      </div>
    </div>
  );
};

// 3. Timetable Editor Component
const TimetableEditor = ({ teacher, onUpdateTimetable, onClose, definedClasses }) => {
  const [schedule, setSchedule] = useState(teacher.timetable || {});
  const [isSaving, setIsSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    const initialSchedule = teacher.timetable || {};
    DAYS.forEach(day => {
      if (!initialSchedule[day]) initialSchedule[day] = Array(7).fill('');
    });
    setSchedule(initialSchedule);
  }, [teacher]);

  const handleCellUpdate = (day, periodIndex, newValue) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) newSchedule[day] = Array(7).fill('');
    newSchedule[day][periodIndex] = newValue;
    setSchedule(newSchedule);
    setEditingCell(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateTimetable(teacher.id, schedule);
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden print:hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Master Timetable</h2>
          <p className="text-sm text-slate-500">Editing: <span className="font-medium text-blue-600">{teacher.name}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
            Close
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 min-h-0">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-2">
            <div className="font-bold text-slate-400 text-xs uppercase tracking-wider text-center self-end pb-2">Day</div>
            {PERIODS.map(p => (
              <div key={p} className="text-center font-bold text-slate-600 bg-slate-100 py-2 rounded-md text-sm">
                Pd {p}
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={day} className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-2 items-stretch">
              <div className="font-bold text-slate-700 text-sm flex items-center justify-center bg-slate-50 rounded-md border border-slate-100">
                {day.substring(0, 3)}
              </div>
              {PERIODS.map((p, idx) => {
                const cellValue = (schedule[day] && schedule[day][idx]) || '';
                return (
                  <div 
                    key={`${day}-${p}`} 
                    onClick={() => setEditingCell({ day, idx, value: cellValue })}
                    className={`
                      relative w-full h-16 p-1 text-xs text-center border rounded-md cursor-pointer transition-all flex items-center justify-center group
                      ${cellValue
                        ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold hover:bg-blue-100' 
                        : 'bg-white border-slate-200 text-slate-300 hover:border-blue-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="line-clamp-3 leading-tight px-1">
                       {cellValue || '-'}
                    </span>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-blue-400">
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
  assignments,
  setAssignments 
}) => {

  const validClassCodes = useMemo(() => {
    const codes = new Set();
    definedClasses.forEach(cls => {
      (cls.divisions || []).forEach(div => {
        codes.add(`${cls.name}${div}`.toUpperCase());
      });
    });
    return codes;
  }, [definedClasses]);

  const extractClassCodes = (entry) => {
    if (!entry) return [];
    const upperEntry = entry.toUpperCase();
    const found = [];
    for (const code of validClassCodes) {
       if (upperEntry.includes(code)) {
         found.push(code);
       }
    }
    return found;
  };

  const teacherTeachesAny = (teacher, targetCodes) => {
    if (!teacher.timetable) return false;
    if (!targetCodes || targetCodes.length === 0) return false;

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

          teachers.forEach(t => {
             if (t.id === absentId || absentIds.includes(t.id)) return;
             const tSchedule = t.timetable?.[selectedDay];
             const tActivity = tSchedule?.[periodIndex];
             const isFree = !tActivity || tActivity.trim() === '';
             
             if (isFree) {
                if (targetCodes.length > 0 && teacherTeachesAny(t, targetCodes)) {
                   strictMatches.push({ ...t, type: 'strict' });
                } else {
                   generalMatches.push({ ...t, type: 'general' });
                }
             }
          });

          const replacements = [...strictMatches, ...generalMatches];

          results.push({
            id: `${absentId}-${periodIndex}`, 
            period: periodIndex + 1,
            classInfo: subject,
            targetCodes: targetCodes,
            absentTeacherName: absentTeacher.name,
            absentTeacherId: absentId,
            replacements: replacements
          });
        }
      });
    });

    // Sort by Period (1-7) first, then by Absent Teacher Name
    return results.sort((a, b) => {
      if (a.period === b.period) {
         return a.absentTeacherName.localeCompare(b.absentTeacherName);
      }
      return a.period - b.period;
    });
  }, [selectedDay, absentIds, teachers, validClassCodes]);

  const isTeacherBookedInPeriod = (teacherId, period, currentSlotId) => {
    for (const [slotId, assignedTeacherId] of Object.entries(assignments)) {
      const assignedItem = substitutionData.find(item => item.id === slotId);
      if (assignedItem && assignedItem.period === period) {
         if (slotId !== currentSlotId && assignedTeacherId === teacherId) {
           return true;
         }
      }
    }
    return false;
  };

  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    document.title = `${dateStr}_Substitution`;
    window.print();
    document.title = originalTitle;
  };

  // Print Layout
  if (PrintMode) {
    return (
      <div className="print-only hidden bg-white text-black p-4">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1 uppercase">{selectedDay} - {new Date().toLocaleDateString('en-GB')}</h1>
        </div>
        
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2 w-24 bg-white text-center">Period</th>
              <th className="border border-black p-2 w-24 bg-white text-center"></th>
              {PERIODS.map(p => (
                <th key={p} className="border border-black p-2 bg-white font-bold text-center">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {absentIds.sort((a, b) => {
              const nameA = teachers.find(t => t.id === a)?.name || "";
              const nameB = teachers.find(t => t.id === b)?.name || "";
              return nameA.localeCompare(nameB);
            }).map(absentId => {
              const teacher = teachers.find(t => t.id === absentId);
              if (!teacher) return null;
              
              return (
                <tr key={absentId}>
                  <td colSpan={2} className="border border-black p-2 font-bold bg-white text-center align-middle text-red-600 text-lg">
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
                       const replacementInfo = item.replacements.find(r => r.id === assignedId);
                       if (replacementInfo) {
                         subName = replacementInfo.name;
                         subType = replacementInfo.type;
                       } else if (assignedId) {
                         const t = teachers.find(tr => tr.id === assignedId);
                         subName = t?.name || "";
                       }
                    }
                    
                    // Color Scheme
                    let colorClass = "text-black";
                    if (subType === 'strict') colorClass = "text-green-700";
                    else if (subType === 'general') colorClass = "text-amber-600";

                    return (
                      <td key={p} className="border border-black p-1 h-16 text-center align-middle">
                        {item ? (
                          <div className="flex flex-col justify-between h-full py-1">
                            <span className="text-sm font-medium">{content}</span>
                            {subName ? (
                              <span className={`font-bold text-base ${colorClass}`}>
                                {subName}
                              </span>
                            ) : (
                              <span className="text-xs text-red-300 italic">Required</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">---</span>
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
      {/* Style Injection for Print */}
      <style>{`
        @media print {
          @page { margin: 10mm; size: landscape; }
          body, html, #root { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* CRITICAL: Completely remove the screen UI from flow */
          .screen-only {
            display: none !important;
          }

          /* Show only print section */
          .print-only {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          /* Grid Table Styles */
          table { width: 100%; border-collapse: collapse; border: 2px solid black; }
          th, td { border: 1px solid black; padding: 8px; text-align: center; vertical-align: top; height: 60px; }
          th { background-color: #f3f4f6; font-weight: bold; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="screen-only flex-1 flex flex-col h-full overflow-hidden bg-slate-100 text-slate-800 font-sans">
        <div className="p-5 bg-slate-800 text-white shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400" />
              Substitution Generator
            </h2>
            <p className="text-slate-400 text-sm mt-1">Select substitutes for each class.</p>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" /> Download / Print PDF
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-full overflow-hidden min-h-0">
          <div className="col-span-1 lg:col-span-4 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-y-auto h-full min-h-0">
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Day</label>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mark Absent Staff</label>
              <div className="space-y-2">
                {sortedTeachers.map(t => (
                  <label key={t.id} className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${absentIds.includes(t.id) 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-blue-300'
                    }
                  `}>
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center shrink-0
                      ${absentIds.includes(t.id) ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}
                    `}>
                      {absentIds.includes(t.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={absentIds.includes(t.id)}
                      onChange={() => toggleAbsent(t.id)}
                    />
                    <span className={`font-medium text-sm ${absentIds.includes(t.id) ? 'text-red-700' : 'text-slate-700'}`}>
                      {t.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-8 p-6 overflow-y-auto h-full min-h-0 bg-white">
            {absentIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="w-16 h-16 mb-4 text-slate-200" />
                <p className="text-lg font-medium">No teachers marked absent.</p>
              </div>
            ) : substitutionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-green-600">
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <p className="text-lg font-bold">No Substitutions Needed</p>
                <p className="text-slate-500 text-sm">Absent teachers have no classes today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b pb-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Substitution Plan</h3>
                    <p className="text-slate-500 text-sm mt-1">For <span className="font-medium text-blue-600">{selectedDay}</span></p>
                  </div>
                </div>

                {substitutionData.map((item, idx) => {
                  const assignedTeacherId = assignments[item.id] || "";
                  return (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                         <div className="flex items-center gap-3">
                           <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">PERIOD {item.period}</span>
                           <span className="font-bold text-slate-700 text-lg">{item.classInfo}</span>
                         </div>
                         <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                           Absent: {item.absentTeacherName}
                         </span>
                      </div>
                      <div className="p-4 bg-white">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Substitute</label>
                        <select 
                          className="w-full p-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={assignedTeacherId}
                          onChange={(e) => setAssignments(prev => ({ ...prev, [item.id]: e.target.value }))}
                        >
                          <option value="">-- Select Teacher --</option>
                          <optgroup label="Subject Teachers (Preferred)">
                            {item.replacements.filter(r => r.type === 'strict').map(r => {
                              const isBooked = isTeacherBookedInPeriod(r.id, item.period, item.id);
                              return (
                                <option key={r.id} value={r.id} disabled={isBooked} className={isBooked ? "text-slate-300" : "text-green-700 font-bold"}>
                                  {r.name} {isBooked ? "(Busy)" : ""}
                                </option>
                              );
                            })}
                          </optgroup>
                          <optgroup label="Other Available Teachers">
                            {item.replacements.filter(r => r.type === 'general').map(r => {
                              const isBooked = isTeacherBookedInPeriod(r.id, item.period, item.id);
                              return (
                                <option key={r.id} value={r.id} disabled={isBooked} className={isBooked ? "text-slate-300" : "text-slate-700"}>
                                  {r.name} {isBooked ? "(Busy)" : ""}
                                </option>
                              );
                            })}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  );
                })}
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
  const [activeTab, setActiveTab] = useState('manage'); 
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State

  // Hoisted state for substitution logic
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [absentIds, setAbsentIds] = useState([]);
  const [assignments, setAssignments] = useState({});

  // Helper to pass down
  const toggleAbsent = (id) => {
    setAbsentIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    // Clear assignments for this teacher to avoid stale state
    // Ideally, filter out assignments keys that start with `id-`
    // For simplicity, keeping current assignment logic is fine, or reset:
    // setAssignments({}); 
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
          console.log("Seeding database...");
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
          console.log("Database seeded successfully");
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
      if(classes.length > 0 || snapshot.empty) setLoading(false); 
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

  // --- ACTIONS (Add, Update, Delete) ---
  const addTeacher = async (name) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'), {
      name,
      timetable: {},
      createdAt: serverTimestamp()
    });
  };

  const updateTimetable = async (teacherId, newTimetable) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teachers', teacherId), { timetable: newTimetable });
  };

  const deleteTeacher = async (teacherId) => {
    if (!user) return;
    if (!confirm('Delete teacher?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teachers', teacherId));
    if (selectedTeacher?.id === teacherId) setSelectedTeacher(null);
  };

  const addClass = async (name) => {
    if (!user) return;
    if(classes.some(c => c.name === name)) return alert("Class exists");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), {
      name,
      divisions: [],
      createdAt: serverTimestamp()
    });
  };

  const updateClass = async (classId, divisions) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId), { divisions });
  };

  const deleteClass = async (classId) => {
    if (!user) return;
    if (!confirm('Delete this class standard?')) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId));
  };

  // FORCE RELOAD Action
  const handleForceReloadDefaults = async () => {
    if (!user) {
      alert("Please wait for authentication to finish.");
      return;
    }
    if (!confirm("Force reload default teachers? This will overwrite their schedules. Continue?")) return;
    
    setImporting(true);
    try {
      const batch = writeBatch(db);
      let operationCount = 0;

      const existingClassNames = classes.map(c => c.name);
      for (const cls of INITIAL_CLASSES) {
        if (!existingClassNames.includes(cls.name)) {
          const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'));
          batch.set(ref, { name: cls.name, divisions: cls.divisions, createdAt: serverTimestamp() });
          operationCount++;
        }
      }

      const teacherMap = new Map(teachers.map(t => [t.name, t.id]));
      for (const t of INITIAL_TEACHERS) {
        if (teacherMap.has(t.name)) {
          const existingId = teacherMap.get(t.name);
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'teachers', existingId);
          batch.update(ref, { timetable: t.timetable });
          operationCount++;
        } else {
           const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'teachers'));
           batch.set(ref, { name: t.name, timetable: t.timetable, createdAt: serverTimestamp() });
           operationCount++;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
        alert(`Updated ${operationCount} records.`);
      } else {
        alert("All data is up to date.");
      }

    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
    setImporting(false);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-100 text-slate-800 font-sans print:h-auto print:overflow-visible">
      
      {/* --- SCREEN LAYOUT --- */}
      <div className="screen-only flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-slate-800 text-white shadow-md z-10 shrink-0">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <h1 className="font-bold text-xl tracking-tight hidden md:block">SchoolScheduler</h1>
              <h1 className="font-bold text-xl tracking-tight md:hidden">SS</h1>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-slate-700 rounded-lg p-1 gap-1 items-center mr-2">
                <button 
                  onClick={() => { setActiveTab('classes'); setSelectedTeacher(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'classes' ? 'bg-white text-slate-800 shadow' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                  Directory
                </button>
                <button 
                  onClick={() => { setActiveTab('manage'); setSelectedTeacher(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-white text-slate-800 shadow' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                  Timetables
                </button>
                <button 
                  onClick={() => setActiveTab('substitute')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'substitute' ? 'bg-white text-slate-800 shadow' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                  Generate Subs
                </button>
              </div>
              <button 
                onClick={handleForceReloadDefaults}
                disabled={importing}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
                title="Reload Default Teachers"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-slate-700 p-4 space-y-2 border-t border-slate-600">
              <button 
                  onClick={() => { setActiveTab('classes'); setSelectedTeacher(null); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'classes' ? 'bg-white text-slate-800' : 'text-slate-300'}`}
                >
                  Class Directory
                </button>
                <button 
                  onClick={() => { setActiveTab('manage'); setSelectedTeacher(null); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'manage' ? 'bg-white text-slate-800' : 'text-slate-300'}`}
                >
                  Timetables
                </button>
                <button 
                  onClick={() => { setActiveTab('substitute'); setMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'substitute' ? 'bg-white text-slate-800' : 'text-slate-300'}`}
                >
                  Generate Subs
                </button>
                <button 
                onClick={handleForceReloadDefaults}
                className="block w-full text-left px-4 py-2 rounded-md text-sm font-medium text-slate-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reload Defaults
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
                <div className="col-span-1 lg:col-span-3 h-[40vh] lg:h-full min-h-0">
                  <TeacherManager 
                    teachers={teachers}
                    onSelectTeacher={setSelectedTeacher}
                    onDeleteTeacher={deleteTeacher}
                    onAddTeacher={addTeacher}
                  />
                </div>
                <div className="col-span-1 lg:col-span-9 h-full min-h-0">
                  {selectedTeacher ? (
                    <TimetableEditor 
                      teacher={selectedTeacher}
                      definedClasses={classes}
                      onUpdateTimetable={updateTimetable}
                      onClose={() => setSelectedTeacher(null)}
                    />
                  ) : (
                    <div className="hidden lg:flex h-full bg-white rounded-xl border border-slate-200 border-dashed flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ArrowRight className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">Select a teacher</h3>
                      <p className="max-w-sm text-sm opacity-75">Click a name from the list to edit their timetable.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render SubstitutionGenerator passing props. 
                We pass PrintMode=false (implied) to render the Screen UI.
            */}
            {activeTab === 'substitute' && (
              <SubstitutionGenerator 
                teachers={teachers} 
                definedClasses={classes}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                absentIds={absentIds}
                toggleAbsent={toggleAbsent}
                assignments={assignments}
                setAssignments={setAssignments}
              />
            )}
          </div>
        </main>
      </div>
      
      {/* --- PRINT LAYOUT (ONLY VISIBLE WHEN PRINTING) --- */}
      {/* This section uses 'display: none' by default via the 'print-only' class logic 
          defined in the style tag. We ensure it gets the SAME state as the screen. */}
      {activeTab === 'substitute' && (
         <SubstitutionGenerator 
           PrintMode={true} 
           teachers={teachers} 
           definedClasses={classes}
           selectedDay={selectedDay}
           // setters not needed for print
           absentIds={absentIds}
           toggleAbsent={() => {}}
           assignments={assignments}
           setAssignments={() => {}}
         />
      )}
      
    </div>
  );
}
