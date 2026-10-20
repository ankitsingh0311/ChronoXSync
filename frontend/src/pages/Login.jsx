// =============================================================================
// EduTrack 3D — Role-Adaptive AuthPortal (Login.jsx)
// =============================================================================
// SUBJECT 4 (Cloud Security) & SUBJECT 2 (System Design):
//   - Automatic Role Inference from email (.cr@, .hod@, .faculty@, .student@)
//   - Role-Tailored Interface & Form Sections for every designation:
//       • Faculty: Department + Subject Taught
//       • HOD: Department + Administrative Clearance
//       • Student: Course / Degree Program
//       • CR: Course / Enrolled Batch Section
//   - Strict 5-step backend verification against Institutional_Directory & DB
//   - 12-round bcrypt password hash at-rest, 5-strike brute-force lockout guard
//   - Role-specific post-auth routing: Student->/dashboard, CR->/cr-portal,
//     Faculty->/exams, HOD->/analytics.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { adminAPI, authAPI } from '../services/api';
import {
  Lock, Mail, User, Eye, EyeOff, ArrowRight, ShieldCheck,
  GraduationCap, Users, BookOpen, Crown, X,
  AlertTriangle, CheckCircle, RefreshCw, Zap,
  Building2, BookMarked, Sparkles, Compass, Check, Trash2, Calendar, Search
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

// ─────────────────────────────────────────────────────────────────────────────
// Role Definitions & Theming
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'Student',
    label: 'Student',
    tabName: 'Student',
    badge: 'Scholar',
    icon: GraduationCap,
    color: '#10b981',
    accentLight: '#34d399',
    glow: 'rgba(16,185,129,0.22)',
    border: '#10b981',
    headerTitle: 'Student Workload & Submission Portal',
    headerDesc: 'Track assignment timelines, submit coursework, and access AI panic assistance.',
    targetRoute: '/dashboard',
    courseLabel: 'Degree Program / Enrolled Course',
    coursePlaceholder: 'e.g. B.Tech Computer Science & Engineering',
  },
  {
    id: 'CR',
    label: 'Class Rep (CR)',
    tabName: 'CR Rep',
    badge: 'Coordinator',
    icon: Users,
    color: '#14b8a6',
    accentLight: '#2dd4bf',
    glow: 'rgba(20,184,166,0.22)',
    border: '#14b8a6',
    headerTitle: 'Class Representative (CR) Hub',
    headerDesc: 'Publish batch deadlines, coordinate lecture schedules, and resolve conflicts.',
    targetRoute: '/cr-portal',
    courseLabel: 'Assigned Batch / Section',
    coursePlaceholder: 'e.g. B.Tech CSE - Section A',
  },
  {
    id: 'Faculty',
    label: 'Faculty Member',
    tabName: 'Faculty',
    badge: 'Professor',
    icon: BookOpen,
    color: '#f59e0b',
    accentLight: '#fbbf24',
    glow: 'rgba(245,158,11,0.22)',
    border: '#f59e0b',
    headerTitle: 'Faculty Academic Console',
    headerDesc: 'Design lab milestones, configure midterms, and monitor student completion rates.',
    targetRoute: '/exams',
  },
  {
    id: 'HOD',
    label: 'Head of Dept (HOD)',
    tabName: 'HOD Executive',
    badge: 'Dean / HOD',
    icon: Crown,
    color: '#ec4899',
    accentLight: '#f472b6',
    glow: 'rgba(236,72,153,0.22)',
    border: '#ec4899',
    headerTitle: 'HOD Executive Leadership Suite',
    headerDesc: 'Branch-wide deadline analytics, faculty orchestration, and panic anomaly monitoring.',
    targetRoute: '/analytics',
  },
];

export const CATEGORIZED_DEPARTMENTS = [
  {
    name: 'Computing & Technology Schools',
    badge: 'Computing',
    items: [
      'School of Computer Science and Engineering',
      'School of Computing'
    ]
  },
  {
    name: 'Core Engineering Schools',
    badge: 'Engineering',
    items: [
      'School of Engineering'
    ]
  },
  {
    name: 'Business, Management & Law Schools',
    badge: 'Management & Law',
    items: [
      'School of Business',
      'School of Law'
    ]
  },
  {
    name: 'Pharmacy & Health Sciences Schools',
    badge: 'Health & Pharmacy',
    items: [
      'School of Pharmacy',
      'School of Health & Allied Sciences'
    ]
  },
  {
    name: 'Applied Sciences & Humanities Schools',
    badge: 'Sciences & Humanities',
    items: [
      'School of Basic & Applied Sciences',
      'School of Humanities & Social Sciences'
    ]
  }
];

export const DEPARTMENTS = CATEGORIZED_DEPARTMENTS.flatMap((c) => c.items);

export const CATEGORIZED_FACULTY_SUBJECTS = [
  {
    name: 'Core Computer Science',
    badge: 'Core CS',
    items: [
      'Database Management Systems (RDBMS & SQL)',
      'Advanced Database Systems (NoSQL, NewSQL & Distributed DB)',
      'Data Structures & Algorithms (DSA)',
      'Design & Analysis of Algorithms (DAA)',
      'Operating Systems & System Architecture',
      'Computer Networks & Protocols',
      'Object-Oriented Programming (Java / C++)',
      'Object-Oriented Programming with Python',
      'Software Engineering & Agile Methodologies',
      'Theory of Computation & Automata',
      'Compiler Design & Language Processors',
      'Computer Organization & Architecture',
      'System Programming & Linux Kernel Concepts',
      'Discrete Mathematics & Graph Theory'
    ]
  },
  {
    name: 'AI, ML & Data Science',
    badge: 'AI & Data',
    items: [
      'Artificial Intelligence & Machine Learning',
      'Deep Learning & Neural Networks',
      'Natural Language Processing (NLP)',
      'Large Language Models & Generative AI',
      'Computer Vision & Image Processing',
      'Big Data Analytics & Apache Spark',
      'Data Mining & Business Intelligence',
      'Reinforcement Learning & Autonomous Agents',
      'Data Science with Python & R Analytics',
      'AI Ethics, Governance & Model Safety'
    ]
  },
  {
    name: 'Cloud, Security & Systems',
    badge: 'Cloud & Sec',
    items: [
      'Cloud Computing & Distributed Systems',
      'Cyber Security, Cryptography & Defense',
      'DevOps, Docker & CI/CD Pipelines',
      'Ethical Hacking & Network Security',
      'Information Security & Digital Forensics',
      'Blockchain Technology & Smart Contracts',
      'High Performance Computing & Parallel Architectures',
      'Linux System Administration & Shell Scripting'
    ]
  },
  {
    name: 'Web & Mobile Development',
    badge: 'Web & App',
    items: [
      'Web Technologies & Full-Stack Development',
      'Modern Frontend Engineering (React, Next.js & TypeScript)',
      'Backend API Engineering (Node.js, FastAPI & GraphQL)',
      'Mobile Application Development (Flutter & Dart)',
      'Mobile App Development (React Native)',
      'Native Android Development (Kotlin)',
      'Human-Computer Interaction (HCI & UX Design)'
    ]
  },
  {
    name: 'Electronics & Hardware',
    badge: 'Hardware & IoT',
    items: [
      'Digital Electronics & Logic Design',
      'Microprocessors & Microcontrollers (ARM / 8086)',
      'VLSI Design & Semiconductor Devices',
      'Embedded Systems & Real-Time Operating Systems (RTOS)',
      'Digital Signal Processing (DSP)',
      'Internet of Things (IoT) & Smart Sensors',
      'Wireless & Mobile Communications',
      'Robotics, Kinematics & Mechatronics'
    ]
  },
  {
    name: 'Electrical, Mechanical & Civil',
    badge: 'Core Engg',
    items: [
      'Power Electronics & Electric Drives',
      'Control Systems & Automation',
      'Thermodynamics & Heat Transfer',
      'Fluid Mechanics & Hydraulics',
      'CAD/CAM, Finite Element Analysis (FEA) & Simulation',
      'Robotics, Mechatronics & CAD/CAM',
      'Structural Engineering & Mechanics of Solids',
      'Environmental Engineering & Sustainable Infrastructure'
    ]
  },
  {
    name: 'Mathematics & Governance',
    badge: 'Math & Admin',
    items: [
      'Engineering Mathematics & Statistics',
      'Probability, Statistics & Stochastic Processes',
      'Technology Management & Entrepreneurship',
      'Research Methodology, Academic Writing & IPR',
      'Technical Communication & Soft Skills',
      'Department Administration & Governance'
    ]
  }
];

export const DEPARTMENT_COURSES_MAP = {
  'School of Computer Science and Engineering': [
    {
      name: 'B.Tech Core & Sections',
      badge: 'B.Tech CSE',
      items: [
        'B.Tech Computer Science & Engineering',
        'B.Tech CSE - Section A',
        'B.Tech CSE - Section B',
        'B.Tech CSE - Section C',
        'B.Tech CSE - Section D'
      ]
    },
    {
      name: 'Advanced Specializations & Honors',
      badge: 'CSE Specialization',
      items: [
        'B.Tech CSE (Artificial Intelligence & Machine Learning)',
        'B.Tech CSE (Data Science & Analytics)',
        'B.Tech CSE (Cyber Security & Digital Forensics)',
        'B.Tech CSE (Cloud Computing & DevOps Architecture)',
        'B.Tech CSE (Internet of Things & Embedded Systems)',
        'B.Tech CSE (Software Engineering & Full Stack Development)'
      ]
    },
    {
      name: 'Postgraduate & Doctoral (M.Tech / Ph.D)',
      badge: 'M.Tech / Ph.D',
      items: [
        'M.Tech Computer Science & Engineering',
        'M.Tech Artificial Intelligence & Machine Learning',
        'M.Tech Cyber Security & Information Assurance',
        'M.Tech Data Science & Big Data Analytics',
        'Ph.D in Computer Science & Engineering'
      ]
    }
  ],

  'School of Computing': [
    {
      name: 'BCA Undergraduate Degrees',
      badge: 'BCA',
      items: [
        'Bachelor of Computer Applications (BCA Core)',
        'BCA Cloud Computing & Cybersecurity',
        'BCA Data Analytics & Artificial Intelligence',
        'BCA Mobile Application & Full Stack Web Development',
        'BCA Game Development & Interactive Media'
      ]
    },
    {
      name: 'MCA Postgraduate Degrees',
      badge: 'MCA',
      items: [
        'Master of Computer Applications (MCA Core)',
        'MCA Artificial Intelligence & Data Science',
        'MCA Cloud Architecture & DevOps Operations',
        'MCA Cyber Security & Threat Intelligence'
      ]
    },
    {
      name: 'Applied Computing & Data Sciences',
      badge: 'B.Sc / M.Sc IT',
      items: [
        'B.Sc Computer Science (Honours)',
        'B.Sc Information Technology (IT)',
        'B.Sc Data Science & Artificial Intelligence',
        'M.Sc Computer Science & Distributed Systems',
        'M.Sc Big Data & Business Analytics',
        'Ph.D in Computer Applications & Computing Sciences'
      ]
    }
  ],

  'School of Engineering': [
    {
      name: 'Mechanical & Aerospace Engineering',
      badge: 'Mechanical / Aero',
      items: [
        'B.Tech Mechanical Engineering',
        'B.Tech Aerospace Engineering',
        'B.Tech Robotics & Mechatronics Engineering',
        'M.Tech Thermal & Fluid Engineering',
        'M.Tech Computer Integrated Manufacturing (CIM)'
      ]
    },
    {
      name: 'Electronics & Electrical Engineering',
      badge: 'ECE / EEE',
      items: [
        'B.Tech Electronics & Communication Engineering (ECE)',
        'B.Tech Electrical & Electronics Engineering (EEE)',
        'B.Tech VLSI Design & Microelectronics',
        'M.Tech VLSI Design & Embedded Systems',
        'M.Tech Power Systems & EV Technologies'
      ]
    },
    {
      name: 'Civil, Infrastructure & Environmental',
      badge: 'Civil',
      items: [
        'B.Tech Civil & Infrastructure Engineering',
        'B.Tech Environmental Engineering & Sustainable Design',
        'M.Tech Structural & Earthquake Engineering',
        'M.Tech Construction Project Management'
      ]
    },
    {
      name: 'Chemical & Biotechnology Engineering',
      badge: 'Biotech / Chem',
      items: [
        'B.Tech Biotechnology',
        'B.Tech Biotechnology & Biochemical Engineering',
        'B.Tech Chemical Engineering',
        'M.Tech Chemical Process Design & Synthesis',
        'Ph.D in Engineering Sciences'
      ]
    }
  ],

  'School of Business': [
    {
      name: 'Undergraduate Management & Commerce',
      badge: 'BBA / B.Com',
      items: [
        'Bachelor of Business Administration (BBA Core)',
        'BBA Finance & Banking Analytics',
        'BBA Marketing & Digital Strategy',
        'BBA International Business & Logistics',
        'BBA Business Analytics & FinTech',
        'Bachelor of Commerce (B.Com Honours)'
      ]
    },
    {
      name: 'Postgraduate MBA Programs',
      badge: 'MBA',
      items: [
        'Master of Business Administration (MBA Core)',
        'MBA Business Analytics & Big Data Intelligence',
        'MBA Financial Technology & Investment Banking',
        'MBA Supply Chain & Operations Management',
        'MBA Digital Marketing & E-Commerce',
        'Executive MBA (EMBA - Working Professionals)'
      ]
    },
    {
      name: 'Commerce & Doctoral Studies',
      badge: 'M.Com / Ph.D',
      items: [
        'Master of Commerce (M.Com)',
        'Ph.D in Business Administration & Management'
      ]
    }
  ],

  'School of Pharmacy': [
    {
      name: 'Undergraduate Pharmacy',
      badge: 'B.Pharm',
      items: [
        'Bachelor of Pharmacy (B.Pharm Core)',
        'B.Pharm Practice & Clinical Research',
        'Diploma in Pharmacy (D.Pharm)'
      ]
    },
    {
      name: 'Postgraduate Pharmacy (M.Pharm)',
      badge: 'M.Pharm',
      items: [
        'Master of Pharmacy (M.Pharm Pharmaceutics)',
        'M.Pharm Pharmacology & Clinical Toxicology',
        'M.Pharm Pharmaceutical Chemistry & Drug Design',
        'M.Pharm Pharmaceutical Quality Assurance',
        'M.Pharm Pharmacognosy & Phytochemistry'
      ]
    },
    {
      name: 'Clinical Doctorate & Research',
      badge: 'Pharm.D / Ph.D',
      items: [
        'Doctor of Pharmacy (Pharm.D - 6 Year Integrated)',
        'Doctor of Pharmacy Post-Baccalaureate (Pharm.D PB)',
        'Ph.D in Pharmaceutical Sciences'
      ]
    }
  ],

  'School of Law': [
    {
      name: 'Integrated 5-Year Law Programs',
      badge: 'Integrated Law',
      items: [
        'B.A. LL.B (Honours) - Integrated 5 Year',
        'B.B.A. LL.B (Honours) - Integrated 5 Year',
        'B.Com. LL.B (Honours) - Integrated 5 Year'
      ]
    },
    {
      name: 'LL.B & Master of Laws (LL.M)',
      badge: 'LL.B / LL.M',
      items: [
        'Bachelor of Laws (LL.B - 3 Year)',
        'Master of Laws (LL.M Corporate & Commercial Law)',
        'LL.M Intellectual Property & Cyber Law',
        'LL.M Constitutional & Criminal Law',
        'Ph.D in Legal Studies'
      ]
    }
  ],

  'School of Health & Allied Sciences': [
    {
      name: 'Undergraduate Allied Health',
      badge: 'Allied Health',
      items: [
        'B.Sc Nursing (Basic & Post-Basic)',
        'B.Sc Medical Laboratory Technology (BMLT)',
        'B.Sc Radiology & Medical Imaging Technology',
        'Bachelor of Physiotherapy (BPT)',
        'Bachelor of Optometry (B.Optom)'
      ]
    },
    {
      name: 'Postgraduate Health Sciences',
      badge: 'MPT / MPH',
      items: [
        'Master of Physiotherapy (MPT Orthopedics & Neurology)',
        'Master of Public Health (MPH)',
        'M.Sc Medical Microbiology & Immunology',
        'Ph.D in Allied Health Sciences'
      ]
    }
  ],

  'School of Basic & Applied Sciences': [
    {
      name: 'Undergraduate Physical & Mathematical Sciences',
      badge: 'B.Sc Science',
      items: [
        'B.Sc Physics (Honours)',
        'B.Sc Mathematics & Computing',
        'B.Sc Chemistry (Honours)',
        'B.Sc Forensic Science & Criminology'
      ]
    },
    {
      name: 'Postgraduate & Research Sciences',
      badge: 'M.Sc / Ph.D',
      items: [
        'M.Sc Applied Mathematics & Scientific Computing',
        'M.Sc Physics & Materials Science',
        'M.Sc Organic & Analytical Chemistry',
        'M.Sc Forensic Science & Digital Ballistics',
        'Ph.D in Basic & Applied Sciences'
      ]
    }
  ],

  'School of Humanities & Social Sciences': [
    {
      name: 'Undergraduate Arts & Media',
      badge: 'B.A Arts',
      items: [
        'B.A Journalism & Mass Communication (BJMC)',
        'B.A Psychology & Behavioral Sciences',
        'B.A English Literature & Applied Linguistics',
        'B.A Economics & Public Policy Analysis'
      ]
    },
    {
      name: 'Postgraduate Arts & Media',
      badge: 'M.A / Ph.D',
      items: [
        'M.A Journalism & Digital Media',
        'M.A Clinical & Industrial Psychology',
        'M.A Economics & Public Policy Analysis',
        'Ph.D in Humanities & Social Sciences'
      ]
    }
  ]
};

// Aliases for backward-compatibility with previously seeded database accounts
DEPARTMENT_COURSES_MAP['Computer Science & Engineering'] = DEPARTMENT_COURSES_MAP['School of Computer Science and Engineering'];
DEPARTMENT_COURSES_MAP['Computer Science'] = DEPARTMENT_COURSES_MAP['School of Computer Science and Engineering'];
DEPARTMENT_COURSES_MAP['Artificial Intelligence & Data Science'] = DEPARTMENT_COURSES_MAP['School of Computer Science and Engineering'];
DEPARTMENT_COURSES_MAP['Information Technology'] = DEPARTMENT_COURSES_MAP['School of Computing'];
DEPARTMENT_COURSES_MAP['Electronics & Communication Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Electrical & Electronics Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Mechanical Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Civil & Environmental Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Aerospace Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Chemical Engineering'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Biotechnology & Bioinformatics'] = DEPARTMENT_COURSES_MAP['School of Engineering'];
DEPARTMENT_COURSES_MAP['Management Studies (MBA / BBA)'] = DEPARTMENT_COURSES_MAP['School of Business'];
DEPARTMENT_COURSES_MAP['Mathematics & Computing'] = DEPARTMENT_COURSES_MAP['School of Basic & Applied Sciences'];
DEPARTMENT_COURSES_MAP['Applied Physics & Materials Science'] = DEPARTMENT_COURSES_MAP['School of Basic & Applied Sciences'];
DEPARTMENT_COURSES_MAP['Humanities & Social Sciences'] = DEPARTMENT_COURSES_MAP['School of Humanities & Social Sciences'];

export const CATEGORIZED_PROGRAMS = [
  {
    name: 'Computer Science & Engineering Programs',
    badge: 'B.Tech CSE',
    items: [
      'B.Tech Computer Science & Engineering',
      'B.Tech CSE - Section A',
      'B.Tech CSE - Section B',
      'B.Tech CSE - Section C',
      'B.Tech CSE - Section D',
      'B.Tech CSE (Artificial Intelligence & Machine Learning)',
      'B.Tech CSE (Data Science & Analytics)',
      'B.Tech CSE (Cyber Security & Digital Forensics)',
      'B.Tech CSE (Cloud Computing & DevOps Architecture)',
      'M.Tech Computer Science & Engineering',
      'M.Tech Artificial Intelligence & Machine Learning'
    ]
  },
  {
    name: 'Computing & Software Applications',
    badge: 'BCA / MCA',
    items: [
      'Bachelor of Computer Applications (BCA Core)',
      'BCA Cloud Computing & Cybersecurity',
      'BCA Data Analytics & Artificial Intelligence',
      'Master of Computer Applications (MCA Core)',
      'MCA Artificial Intelligence & Data Science',
      'B.Sc Computer Science (Honours)',
      'B.Sc Information Technology (IT)'
    ]
  },
  {
    name: 'Core Engineering Disciplines',
    badge: 'B.Tech Engg',
    items: [
      'B.Tech Mechanical Engineering',
      'B.Tech Aerospace Engineering',
      'B.Tech Electronics & Communication Engineering (ECE)',
      'B.Tech Electrical & Electronics Engineering (EEE)',
      'B.Tech Civil & Infrastructure Engineering',
      'B.Tech Chemical Engineering',
      'B.Tech Biotechnology',
      'B.Tech Biotechnology & Biochemical Engineering'
    ]
  },
  {
    name: 'Business, Management & Commerce',
    badge: 'BBA / MBA',
    items: [
      'Bachelor of Business Administration (BBA Core)',
      'BBA Finance & Banking Analytics',
      'BBA Business Analytics & FinTech',
      'Bachelor of Commerce (B.Com Honours)',
      'Master of Business Administration (MBA Core)',
      'MBA Business Analytics & Big Data Intelligence',
      'MBA Financial Technology & Investment Banking'
    ]
  },
  {
    name: 'Pharmacy & Health Sciences',
    badge: 'Pharma & Health',
    items: [
      'Bachelor of Pharmacy (B.Pharm Core)',
      'B.Pharm Practice & Clinical Research',
      'Master of Pharmacy (M.Pharm Pharmaceutics)',
      'Doctor of Pharmacy (Pharm.D - 6 Year Integrated)',
      'B.Sc Nursing (Basic & Post-Basic)',
      'Bachelor of Physiotherapy (BPT)'
    ]
  },
  {
    name: 'Law & Legal Studies',
    badge: 'Law / LL.B',
    items: [
      'B.A. LL.B (Honours) - Integrated 5 Year',
      'B.B.A. LL.B (Honours) - Integrated 5 Year',
      'Bachelor of Laws (LL.B - 3 Year)',
      'Master of Laws (LL.M Corporate & Commercial Law)'
    ]
  },
  {
    name: 'Basic Sciences & Humanities',
    badge: 'Sciences & Arts',
    items: [
      'B.Sc Mathematics & Computing',
      'B.Sc Physics (Honours)',
      'B.Sc Chemistry (Honours)',
      'B.A Journalism & Mass Communication (BJMC)',
      'B.A Psychology & Behavioral Sciences',
      'M.Sc Applied Mathematics & Scientific Computing'
    ]
  }
];

export const SEMESTER_PILLS = [
  { id: 'Semester 1', short: 'Sem 1', num: 1, year: '1st Year' },
  { id: 'Semester 2', short: 'Sem 2', num: 2, year: '1st Year' },
  { id: 'Semester 3', short: 'Sem 3', num: 3, year: '2nd Year' },
  { id: 'Semester 4', short: 'Sem 4', num: 4, year: '2nd Year' },
  { id: 'Semester 5', short: 'Sem 5', num: 5, year: '3rd Year' },
  { id: 'Semester 6', short: 'Sem 6', num: 6, year: '3rd Year' },
  { id: 'Semester 7', short: 'Sem 7', num: 7, year: '4th Year' },
  { id: 'Semester 8', short: 'Sem 8', num: 8, year: '4th Year' },
];

export const SEMESTER_OPTIONS = SEMESTER_PILLS.map((s) => s.id);

const STANDARD_FACULTY_SUBJECTS = CATEGORIZED_FACULTY_SUBJECTS.flatMap((c) => c.items);
export const PROGRAMS = Array.from(new Set([
  ...CATEGORIZED_PROGRAMS.flatMap((c) => c.items),
  ...Object.values(DEPARTMENT_COURSES_MAP).flatMap((cats) => (Array.isArray(cats) ? cats.flatMap((c) => c.items) : []))
]));
const STANDARD_COURSES = PROGRAMS;

// Pre-verified Viva demo accounts aligned with Schools
const VIVA_ACCOUNTS = [
  {
    role: 'HOD',
    name: 'Dr. Sanjay Desai',
    email: 'sanjay.hod@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    subjectOrCourse: 'School Leadership & Academic Governance',
    program: 'ALL',
    color: '#ec4899',
    desc: 'Pre-registered HOD (Entire School)'
  },
  {
    role: 'Faculty',
    name: 'Dr. Meena Iyer',
    email: 'meena.faculty@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    program: 'B.Tech Computer Science & Engineering',
    subjectOrCourse: 'Database Management Systems (RDBMS & SQL)',
    color: '#f59e0b',
    desc: 'Pre-registered Faculty (DBMS)'
  },
  {
    role: 'Faculty',
    name: 'Dr. Meena Iyer',
    email: 'meena.faculty@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    program: 'B.Tech Computer Science & Engineering',
    subjectOrCourse: 'Database Management Systems (RDBMS & SQL)',
    color: '#f59e0b',
    desc: 'Verified Faculty (DBMS)'
  },
  {
    role: 'CR',
    name: 'Neha Gupta',
    email: 'neha.cr@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    program: 'B.Tech CSE - Section A',
    subjectOrCourse: 'B.Tech CSE - Section A (Sem 3)',
    color: '#14b8a6',
    desc: 'Pre-registered CR (Sec A)'
  },
  {
    role: 'Student',
    name: 'Ankit Singh',
    email: 'ankit.student@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    program: 'B.Tech Computer Science & Engineering',
    subjectOrCourse: 'B.Tech Computer Science & Engineering (Sem 3)',
    color: '#10b981',
    desc: 'Pre-registered Student'
  },
  {
    role: 'Student',
    name: 'Rohan Mehta',
    email: 'rohan.student@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computing',
    program: 'Bachelor of Computer Applications (BCA Core)',
    subjectOrCourse: 'Bachelor of Computer Applications (BCA Core) (Sem 3)',
    color: '#10b981',
    regOnly: true,
    desc: 'Directory Roster (School of Computing)'
  },
  {
    role: 'Faculty',
    name: 'Dr. Kavita Rao',
    email: 'kavita.faculty@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computing',
    program: 'Master of Computer Applications (MCA Core)',
    subjectOrCourse: 'MCA Cloud Architecture & DevOps Operations',
    color: '#f59e0b',
    regOnly: true,
    desc: 'Directory Roster (School of Computing)'
  },
  {
    role: 'CR',
    name: 'Arjun Patel',
    email: 'arjun.cr@edutrack.ac',
    pw: 'EduTrack@2024',
    department: 'School of Computer Science and Engineering',
    program: 'B.Tech CSE - Section B',
    subjectOrCourse: 'B.Tech CSE - Section B (Sem 3)',
    color: '#14b8a6',
    regOnly: true,
    desc: 'Directory Roster (Sec B)'
  },
];

/**
 * Infer user role based on email pattern.
 * e.g. username.cr@... -> CR
 *      username.hod@... -> HOD
 *      username.faculty@... -> Faculty
 *      username.student@... -> Student
 */
export function detectRoleFromEmail(email) {
  if (!email) return null;
  const low = email.toLowerCase().trim();
  const local = low.split('@')[0] || low;

  if (low.includes('.cr@') || low.includes('_cr@') || low.includes('@cr.') || local.endsWith('.cr') || local.endsWith('_cr') || local === 'cr') {
    return 'CR';
  }
  if (low.includes('.hod@') || low.includes('_hod@') || low.includes('@hod.') || local.endsWith('.hod') || local.endsWith('_hod') || local === 'hod') {
    return 'HOD';
  }
  if (low.includes('.faculty@') || low.includes('_faculty@') || low.includes('@faculty.') || local.endsWith('.faculty') || local.endsWith('_faculty') || local.includes('faculty')) {
    return 'Faculty';
  }
  if (low.includes('.student@') || low.includes('_student@') || low.includes('@student.') || local.endsWith('.student') || local.endsWith('_student') || local.includes('student')) {
    return 'Student';
  }
  return null;
}

function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#334155' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { score: s, label: '', color: '#334155' },
    { score: s, label: 'Weak', color: '#ef4444' },
    { score: s, label: 'Fair', color: '#f59e0b' },
    { score: s, label: 'Good', color: '#6366f1' },
    { score: s, label: 'Strong', color: '#10b981' },
  ][s];
}

// ─── Alert Component ──────────────────────────────────────────────────────────
function Alert({ type, message, onClose }) {
  const cfg = {
    success: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', icon: CheckCircle, color: '#10b981' },
    error: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', icon: AlertTriangle, color: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', icon: AlertTriangle, color: '#f59e0b' },
  }[type] || {};
  const Icon = cfg.icon || AlertTriangle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 14px', borderRadius: '10px',
        background: cfg.bg, border: `1px solid ${cfg.border}44`, marginBottom: '16px'
      }}
    >
      <Icon size={15} color={cfg.color} style={{ marginTop: '2px', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: cfg.color, lineHeight: 1.5, flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <X size={13} color={cfg.color} />
        </button>
      )}
    </motion.div>
  );
}

// ─── Viva Demo Drawer ─────────────────────────────────────────────────────────
function VivaDrawer({ open, onToggle, onFill, rosterData, onRefresh, loadingRoster }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, acc) => {
    e.stopPropagation();
    if (!acc.user_id) {
      alert("Cannot delete this pre-set template account.");
      return;
    }
    const confirmed = window.confirm(
      `Delete "${acc.name}" (${acc.email}) permanently from database?\n\n• Role: ${acc.role}\n• Department: ${acc.department}\n\nThis will remove their account and all related database records.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(acc.user_id);
      await authAPI.deleteUser(acc.user_id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Only use dynamically loaded DB users from SQLite database Users table
  const registeredUsers = rosterData?.registered_users || [];

  // Search & Role filtering
  const filteredRegistered = registeredUsers.filter(acc => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      acc.name?.toLowerCase().includes(q) || 
      acc.email?.toLowerCase().includes(q) ||
      acc.department?.toLowerCase().includes(q) ||
      acc.role?.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'ALL' || acc.role?.toUpperCase() === selectedRoleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  const roleFilters = ['ALL', 'HOD', 'Faculty', 'CR', 'Student'];

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            style={{
              position: 'absolute', bottom: '52px', right: 0, width: '360px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'rgba(10,13,22,0.98)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px',
              padding: '16px', boxShadow: '0 16px 50px rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', maxHeight: '560px'
            }}
          >
            {/* Header with Title, Count, Refresh, and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#818cf8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  ⚡ Quick Test Roster
                </span>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  background: 'rgba(99,102,241,0.2)',
                  color: '#a5b4fc',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  border: '1px solid rgba(99,102,241,0.3)'
                }}>
                  {registeredUsers.length} in DB
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  title="Refresh Roster from Database"
                  onClick={onRefresh}
                  disabled={loadingRoster}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '4px',
                    cursor: 'pointer',
                    color: loadingRoster ? '#818cf8' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RefreshCw size={12} style={{ animation: loadingRoster ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <button
                  onClick={onToggle}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 26px',
                  borderRadius: '7px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Role Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
              {roleFilters.map(rf => {
                const isSelected = selectedRoleFilter === rf;
                return (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => setSelectedRoleFilter(rf)}
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#e0e7ff' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {rf}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Accounts List */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {/* Section 1: Enrolled / Registered Accounts in DB */}
              <div style={{
                fontSize: '9px',
                color: '#10b981',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0'
              }}>
                <span>✓ Enrolled Accounts ({filteredRegistered.length})</span>
                <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'none' }}>Live in SQLite DB</span>
              </div>

              {filteredRegistered.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                  No accounts match current filter.
                </div>
              ) : (
                filteredRegistered.map((acc) => (
                  <motion.button
                    key={acc.email}
                    type="button"
                    whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.07)' }}
                    onClick={() => onFill(acc)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '7px 9px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {acc.name}
                        </span>
                        {acc.is_registered && (
                          <span style={{ fontSize: '7.5px', color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                            DB
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.email}
                      </div>
                      <div style={{ fontSize: '8.5px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {acc.department}{acc.program && acc.program !== 'ALL' ? ` · ${acc.program}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '8.5px',
                        color: acc.color,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: `${acc.color}18`,
                      }}>
                        {acc.role}
                      </span>

                      {acc.is_registered && acc.user_id && (
                        <button
                          type="button"
                          title={`Delete ${acc.name} permanently from database`}
                          disabled={deletingId === acc.user_id}
                          onClick={(e) => handleDelete(e, acc)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '5px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            color: '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                            e.currentTarget.style.color = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.color = '#f87171';
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer with note */}
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: '9px', color: '#64748b', textAlign: 'center' }}>
              Standard test password: <span style={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 600 }}>EduTrack@2024</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '9px 16px', borderRadius: '40px',
          background: open ? '#6366f1' : 'rgba(99,102,241,0.16)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
          boxShadow: open ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <Zap size={13} color="#818cf8" /> Quick Test Roster
        {registeredUsers.length > 0 && (
          <span style={{
            fontSize: '10px',
            background: '#6366f1',
            color: '#fff',
            borderRadius: '10px',
            padding: '1px 6px',
            marginLeft: '4px',
            fontWeight: 700
          }}>
            {registeredUsers.length}
          </span>
        )}
      </motion.button>
    </div>
  );
}

// ─── Main AuthPortal Component ────────────────────────────────────────────────
export default function AuthPortal() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [role, setRole] = useState('Student'); // 'Student' | 'CR' | 'Faculty' | 'HOD'
  const [autoDetected, setAutoDetected] = useState(null); // String or null

  // Form Fields
  const [fullName, setFullName] = useState('Ankit Singh');
  const [email, setEmail] = useState('ankit.student@edutrack.ac');
  const [password, setPassword] = useState('EduTrack@2024');
  const [confirmPassword, setConfirmPassword] = useState('EduTrack@2024');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role-Specific Fields
  const [department, setDepartment] = useState('School of Computer Science and Engineering');
  const [subjectTaught, setSubjectTaught] = useState('Database Management Systems (RDBMS & SQL)');
  const [courseName, setCourseName] = useState('B.Tech Computer Science & Engineering');
  const [semester, setSemester] = useState('Semester 3');

  // Dynamic degree programs & courses according to selected department
  const currentDepartmentCategories = useMemo(() => {
    return DEPARTMENT_COURSES_MAP[department] || CATEGORIZED_PROGRAMS;
  }, [department]);

  // Alerts & Submission status
  const [alert, setAlert] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vivaOpen, setVivaOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Live Database Roster State
  const [rosterData, setRosterData] = useState({ registered_users: [], directory_accounts: [], total_registered: 0 });
  const [loadingRoster, setLoadingRoster] = useState(false);

  const fetchRoster = async () => {
    try {
      setLoadingRoster(true);
      const res = await authAPI.getRoster();
      if (res.data?.status === 'success') {
        setRosterData({
          registered_users: res.data.registered_users || [],
          directory_accounts: res.data.directory_accounts || [],
          total_registered: res.data.total_registered || 0
        });
      }
    } catch (err) {
      console.warn('Failed to fetch live roster from API, falling back to static roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const handleResetDb = async () => {
    try {
      setResetLoading(true);
      await adminAPI.resetDb('clean_slate');
      setShowResetModal(false);
      await fetchRoster();
      setSuccess('✓ Database wiped & reset to Clean Slate! All pre-existing dummy records have been removed. You can now create fresh, live accounts and test relational isolation.');
      setAlert(null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to reset database: ' + (err.response?.data?.detail || err.message) });
    } finally {
      setResetLoading(false);
    }
  };

  // 3D Card Tilt
  const cardRef = useRef(null);
  const rX = useMotionValue(0);
  const rY = useMotionValue(0);

  const onMove = useCallback((e) => {
    const c = cardRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    rX.set(-((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 5);
    rY.set(((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 5);
  }, [rX, rY]);

  const onLeave = useCallback(() => {
    rX.set(0);
    rY.set(0);
  }, [rX, rY]);

  // Current active role configuration
  const currentRoleConfig = useMemo(() => {
    return ROLES.find(r => r.id === role) || ROLES[0];
  }, [role]);

  // Live Email Change with Role Auto-Detection
  const handleEmailInput = (val) => {
    setEmail(val);
    const inferred = detectRoleFromEmail(val);
    if (inferred) {
      if (inferred !== role) {
        setRole(inferred);
      }
      setAutoDetected(inferred);
    } else {
      setAutoDetected(null);
    }
  };

  // Reset alerts when switching mode without wiping user-typed data
  useEffect(() => {
    setAlert(null);
    setSuccess(null);
  }, [mode]);

  // When user clicks a role tab manually, update active role state
  const handleRoleSelect = (rId) => {
    setRole(rId);
    setAlert(null);
  };

  // Quick fill from Viva demo drawer
  const handleFill = (acc) => {
    let cleanCourse = acc.subjectOrCourse || acc.program || '';
    let detectedSem = acc.semester || 'Semester 3';
    const semMatch = cleanCourse.match(/\((?:Sem(?:ester)?\s*(\d))\)/i);
    if (semMatch) {
      detectedSem = `Semester ${semMatch[1]}`;
      cleanCourse = cleanCourse.replace(/\s*\((?:Sem(?:ester)?\s*\d)\)/i, '').trim();
    }
    setSemester(detectedSem);

    if (acc.regFill) {
      setMode('register');
      setRole(acc.role);
      setFullName(acc.name);
      setEmail(acc.email);
      setPassword('EduTrack@2024');
      setConfirmPassword('EduTrack@2024');
      setDepartment(acc.department || 'School of Computer Science and Engineering');
      if (acc.role === 'Faculty') {
        setSubjectTaught(acc.subjectOrCourse || 'Database Management Systems (RDBMS & SQL)');
        setCourseName(acc.program || 'B.Tech Computer Science & Engineering');
      } else {
        setCourseName(cleanCourse || acc.program || 'B.Tech Computer Science & Engineering');
      }
    } else {
      setMode('signin');
      setRole(acc.role);
      setFullName(acc.name);
      setEmail(acc.email);
      setPassword(acc.pw || 'EduTrack@2024');
      setConfirmPassword(acc.pw || 'EduTrack@2024');
      setDepartment(acc.department || 'School of Computer Science and Engineering');
      if (acc.role === 'Faculty') {
        setSubjectTaught(acc.subjectOrCourse || 'Database Management Systems (RDBMS & SQL)');
        setCourseName(acc.program || 'B.Tech Computer Science & Engineering');
      } else {
        setCourseName(cleanCourse || acc.program || 'B.Tech Computer Science & Engineering');
      }
    }
    setAutoDetected(acc.role);
    setVivaOpen(false);
    setAlert(null);
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      const detectedRole = detectRoleFromEmail(email);
      const effectiveRole = detectedRole || role;

      const formattedCourseName = (effectiveRole === 'Student' || effectiveRole === 'CR')
        ? (courseName && courseName.includes('Sem') ? courseName : `${courseName || 'Core CSE'} (${semester || 'Semester 3'})`)
        : undefined;

      const payload = {
        email: email.trim().toLowerCase(),
        password: password,
        selected_role: effectiveRole,
        department: department || 'School of Computer Science and Engineering',
        program: (effectiveRole === 'HOD') ? 'ALL' : (courseName || 'B.Tech Computer Science & Engineering'),
        semester: (effectiveRole === 'Student' || effectiveRole === 'CR') ? (semester || 'Semester 3') : undefined,
        subject_taught: effectiveRole === 'Faculty' ? subjectTaught : undefined,
        course_name: formattedCourseName,
      };

      const u = await login(payload);

      setSuccess(`✓ Authenticated! JWT Issued. Welcome, ${u.full_name} (${u.role_name}). Redirecting to your dashboard...`);
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      const s = err.response?.status;
      const d = err.response?.data?.detail || err.message;
      if (s === 429) setAlert({ type: 'warning', message: `Account Locked: ${d}` });
      else if (s === 403) setAlert({ type: 'error', message: `403 Mismatch: ${d}` });
      else if (!err.response) setAlert({ type: 'error', message: 'Cannot connect to backend server. Ensure FastAPI is running on port 8000.' });
      else setAlert({ type: 'error', message: d });
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Password confirmation check
    if (password !== confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match! Please verify your password confirmation.' });
      return;
    }

    // Mandatory field check for Faculty (Both School/Department and Program and Subject are mandatory)
    const detectedRoleForCheck = detectRoleFromEmail(email);
    const effectiveRoleForCheck = detectedRoleForCheck || role;
    if (effectiveRoleForCheck === 'Faculty') {
      if (!department || !department.trim()) {
        setAlert({ type: 'warning', message: 'School / Department is mandatory for Faculty.' });
        return;
      }
      if (!courseName || !courseName.trim()) {
        setAlert({ type: 'warning', message: 'Teaching Program is mandatory for Faculty.' });
        return;
      }
      if (!subjectTaught || !subjectTaught.trim()) {
        setAlert({ type: 'warning', message: 'Subject Taught is mandatory for Faculty.' });
        return;
      }
    }

    setLoading(true);

    try {
      const detectedRole = detectRoleFromEmail(email);
      const effectiveRole = detectedRole || role;

      const formattedCourseName = (effectiveRole === 'Student' || effectiveRole === 'CR')
        ? (courseName && courseName.includes('Sem') ? courseName : `${courseName || 'Core CSE'} (${semester || 'Semester 3'})`)
        : undefined;

      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        selected_role: effectiveRole,
        department: department || 'School of Computer Science and Engineering',
        program: (effectiveRole === 'HOD') ? 'ALL' : (courseName || 'B.Tech Computer Science & Engineering'),
        semester: (effectiveRole === 'Student' || effectiveRole === 'CR') ? (semester || 'Semester 3') : undefined,
        subject_taught: effectiveRole === 'Faculty' ? subjectTaught : undefined,
        course_name: formattedCourseName,
      };

      const u = await register(payload);
      fetchRoster();

      setSuccess(`✓ Registration saved to SQL database! Welcome, ${u.full_name} (${u.role_name}). Redirecting to your dashboard...`);
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      const s = err.response?.status;
      const d = err.response?.data?.detail || err.message;
      if (s === 403) setAlert({ type: 'error', message: `403 Access Denied: ${d}` });
      else if (s === 409) setAlert({ type: 'warning', message: d });
      else if (!err.response) setAlert({ type: 'error', message: 'Cannot connect to backend server. Ensure FastAPI is running on port 8000.' });
      else setAlert({ type: 'error', message: d });
    } finally {
      setLoading(false);
    }
  };

  const strength = pwStrength(password);

  const inputStyle = (focused) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${focused ? '#f54e00' : 'rgba(255,255,255,0.1)'}`,
    background: '#141311',
    color: '#f7f7f4',
    fontSize: '13px',
    outline: 'none',
    boxShadow: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#141311',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Clean Auth Card per DESIGN.md */}
      <motion.div
        style={{
          width: '100%',
          maxWidth: '540px',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div
          style={{
            background: '#1b1a17',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '34px 30px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
          }}
        >
          {/* Main Top Header: ChronoSync Interactive Luxury Brand */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <motion.div
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.985 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                padding: '10px 18px',
                borderRadius: '16px',
                background: isLogoHovered
                  ? 'linear-gradient(135deg, rgba(245,78,0,0.12) 0%, rgba(255,255,255,0.03) 100%)'
                  : 'rgba(255,255,255,0.02)',
                border: isLogoHovered
                  ? '1px solid rgba(245,78,0,0.35)'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: isLogoHovered
                  ? '0 12px 36px rgba(245,78,0,0.2), inset 0 0 20px rgba(245,78,0,0.08)'
                  : '0 2px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                marginBottom: '8px',
                position: 'relative',
              }}
            >
              {/* Interactive Chrono-Orb Luxury Mark */}
              <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {/* Ambient Radial Backlight */}
                <motion.div
                  animate={{
                    scale: isLogoHovered ? [1, 1.3, 1.1] : 1,
                    opacity: isLogoHovered ? 0.85 : 0.35,
                  }}
                  transition={{ duration: 1.6, repeat: isLogoHovered ? Infinity : 0, repeatType: 'reverse' }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,78,0,0.65) 0%, rgba(251,191,36,0.3) 50%, transparent 75%)',
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Rotating Outer Chrono Dial Ring */}
                <motion.svg
                  animate={{ rotate: isLogoHovered ? 360 : [0, 360] }}
                  transition={{
                    duration: isLogoHovered ? 4 : 24,
                    repeat: Infinity,
                    ease: isLogoHovered ? 'easeInOut' : 'linear',
                  }}
                  viewBox="0 0 44 44"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                  {/* Outer Orbital Dotted Track */}
                  <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(245,78,0,0.28)" strokeWidth="1.4" strokeDasharray="3 3" />
                  {/* Celestial Sync Satellites */}
                  <circle cx="22" cy="3" r="2.2" fill="#fbbf24" />
                  <circle cx="41" cy="22" r="1.6" fill="#f54e00" />
                  <circle cx="3" cy="22" r="1.6" fill="#38bdf8" />
                </motion.svg>

                {/* Core Jewel Badge with Chrono Glyphs */}
                <motion.div
                  animate={{ rotate: isLogoHovered ? -360 : 0 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #f54e00 0%, #c43800 65%, #181512 100%)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    boxShadow: '0 4px 14px rgba(245,78,0,0.45), inset 0 1px 2px rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="10 4" />
                    <path
                      d="M12 7v5l3 2"
                      stroke="#fef08a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="1.8" fill="#ffffff" />
                  </svg>
                </motion.div>
              </div>

              {/* Brand Typography */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      margin: 0,
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span>Chrono</span>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #f54e00 0%, #ff7a18 50%, #facc15 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: isLogoHovered ? 'drop-shadow(0 0 14px rgba(245,78,0,0.6))' : 'drop-shadow(0 0 4px rgba(245,78,0,0.25))',
                        transition: 'filter 0.3s ease',
                      }}
                    >
                      Sync
                    </span>
                  </h1>

                  {/* High-tech Status Pill */}
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      background: 'rgba(245,78,0,0.12)',
                      color: '#f54e00',
                      border: '1px solid rgba(245,78,0,0.3)',
                      fontFamily: "'JetBrains Mono', monospace",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                        display: 'inline-block',
                      }}
                    />
                    3D
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '9.5px',
                    color: isLogoHovered ? '#f54e00' : '#807d72',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: '3px',
                    fontWeight: 600,
                    transition: 'color 0.25s',
                  }}
                >
                  Academic Temporal Synchronizer
                </span>
              </div>
            </motion.div>

            <p style={{ fontSize: '12px', color: '#807d72', margin: 0, letterSpacing: '-0.01em' }}>
              Institutional Single Sign-On & Role-Verified Temporal Gateway
            </p>
          </div>

          {/* Mode Switcher: Sign In vs Create Account */}
          <div
            style={{
              display: 'flex', gap: '4px', padding: '3px',
              background: '#141311', borderRadius: '8px',
              marginBottom: '18px', border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {[
              ['signin', 'Sign In to Portal'],
              ['register', 'Create Account (Register)']
            ].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: mode === m ? '#26251e' : 'transparent',
                  color: mode === m ? '#f7f7f4' : '#807d72',
                  fontSize: '12px', fontWeight: mode === m ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Role Persona Switcher Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10.5px', color: '#807d72', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontFamily: 'monospace' }}>
                Academic Designation / Role
              </span>
              {autoDetected && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '10px', color: '#dfa88f',
                    background: 'rgba(223, 168, 143, 0.12)',
                    padding: '2px 8px', borderRadius: '9999px',
                    border: '1px solid rgba(223, 168, 143, 0.25)',
                    fontWeight: 500,
                    fontFamily: 'monospace'
                  }}
                >
                  <Sparkles size={10} /> Auto-Inferred from Email
                </motion.div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#f54e00' : 'rgba(255,255,255,0.06)'}`,
                      background: isSelected ? 'rgba(245, 78, 0, 0.08)' : '#141311',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={14} color={isSelected ? '#f54e00' : '#807d72'} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#f7f7f4' : '#807d72',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.tabName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Role Banner Card */}
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${currentRoleConfig.color}14, rgba(255,255,255,0.02))`,
              border: `1px solid ${currentRoleConfig.color}33`,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${currentRoleConfig.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              {React.createElement(currentRoleConfig.icon, { size: 16, color: currentRoleConfig.color })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc' }}>
                {currentRoleConfig.headerTitle}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                {currentRoleConfig.headerDesc}
              </div>
            </div>
          </motion.div>

          {/* Feedback Banners */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.4)',
                  color: '#10b981', fontSize: '12px', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={mode === 'signin' ? handleLoginSubmit : handleRegisterSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Full Name (Registration only) */}
              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ankit Singh"
                      style={{ ...inputStyle(false), paddingLeft: '38px' }}
                    />
                  </div>
                </div>
              )}

              {/* Institutional Email with Live Role Detection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Institutional Email
                  </label>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>
                    supports .student@, .cr@, .faculty@, .hod@
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailInput(e.target.value)}
                    placeholder="username.role@edutrack.ac"
                    style={{ ...inputStyle(false), paddingLeft: '38px' }}
                  />
                  {autoDetected && (
                    <div
                      style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: `${currentRoleConfig.color}25`,
                        padding: '2px 8px', borderRadius: '12px',
                        fontSize: '9px', fontWeight: 700, color: currentRoleConfig.color,
                      }}
                    >
                      <Check size={10} /> {autoDetected}
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...inputStyle(false), paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b'
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {mode === 'register' && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s ease',
                          }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <div style={{ fontSize: '9.5px', color: strength.color, textAlign: 'right', fontWeight: 600 }}>
                        {strength.label}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password (Registration only) */}
              {mode === 'register' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Confirm Password
                    </label>
                    {confirmPassword && (
                      <span style={{ fontSize: '9.5px', fontWeight: 600, color: password === confirmPassword ? '#10b981' : '#ef4444' }}>
                        {password === confirmPassword ? '✓ Passwords Match' : '✗ Does not match'}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: password === confirmPassword ? '#10b981' : '#64748b' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      style={{ ...inputStyle(false), paddingLeft: '38px', paddingRight: '40px', borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : undefined }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* ROLE-SPECIFIC SECTIONS (for BOTH Login & Register) */}
              {/* ============================================================ */}

              {/* 1. FACULTY: School + Teaching Program + Subject Taught (All Mandatory) */}
              {role === 'Faculty' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '14px', borderRadius: '12px',
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Faculty Academic Appointment & Program
                  </div>

                  {/* School / Department (Interactive Searchable Select) */}
                  <SearchableSelect
                    label="School / Department *"
                    value={department}
                    onChange={(newDept) => {
                      setDepartment(newDept);
                      const deptPrograms = DEPARTMENT_COURSES_MAP[newDept];
                      if (deptPrograms && deptPrograms[0]?.items) {
                        const allDeptItems = deptPrograms.flatMap(c => c.items);
                        if (!allDeptItems.includes(courseName)) {
                          setCourseName(deptPrograms[0].items[0]);
                        }
                      }
                    }}
                    placeholder="Search or select school / department..."
                    icon={Building2}
                    accentColor="#f59e0b"
                    categories={CATEGORIZED_DEPARTMENTS}
                    flatOptions={DEPARTMENTS}
                    helperText="Select your affiliated academic School."
                    emptyMessage="No matching schools found"
                  />

                  {/* Degree Program in School (Mandatory for Faculty) */}
                  <SearchableSelect
                    label={`Teaching Program in ${department} *`}
                    value={courseName}
                    onChange={(val) => setCourseName(val)}
                    placeholder={`Search or select teaching program in ${department}...`}
                    icon={Compass}
                    accentColor="#f59e0b"
                    categories={currentDepartmentCategories}
                    helperText={`Select the specific academic degree program you instruct in ${department}.`}
                    emptyMessage={`No matching degree programs found for ${department}`}
                  />

                  {/* Subject Taught (Interactive Searchable Select with Categories & Live Search) */}
                  <SearchableSelect
                    label="Subject Taught *"
                    value={subjectTaught}
                    onChange={(val) => setSubjectTaught(val)}
                    placeholder="Search or select subject taught (e.g. Database Systems)..."
                    icon={BookMarked}
                    accentColor="#f59e0b"
                    categories={CATEGORIZED_FACULTY_SUBJECTS}
                    helperText="Select or search the syllabus/course code managed by your faculty profile. You can also write-in a custom subject."
                    emptyMessage="No matching subjects found"
                  />
                </motion.div>
              )}

              {/* 2. HOD: School Leadership (Entire School Oversight) */}
              {role === 'HOD' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '14px', borderRadius: '12px',
                    background: 'rgba(236,72,153,0.05)',
                    border: '1px solid rgba(236,72,153,0.2)',
                    display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    School Leadership Oversight
                  </div>

                  {/* Overseeing School (Interactive Searchable Select) */}
                  <SearchableSelect
                    label="Overseeing School *"
                    value={department}
                    onChange={(newDept) => {
                      setDepartment(newDept);
                      const deptPrograms = DEPARTMENT_COURSES_MAP[newDept];
                      if (deptPrograms && deptPrograms[0]?.items) {
                        const allDeptItems = deptPrograms.flatMap(c => c.items);
                        if (!allDeptItems.includes(courseName)) {
                          setCourseName(deptPrograms[0].items[0]);
                        }
                      }
                    }}
                    placeholder="Search or select school under leadership..."
                    icon={Building2}
                    accentColor="#ec4899"
                    categories={CATEGORIZED_DEPARTMENTS}
                    flatOptions={DEPARTMENTS}
                    helperText="HOD holds academic and governance oversight across all degree programs and faculty within this School."
                    emptyMessage="No matching schools found"
                  />

                  <div
                    style={{
                      fontSize: '9.5px', color: '#cbd5e1', lineHeight: 1.4,
                      background: 'rgba(236,72,153,0.1)', padding: '8px 10px', borderRadius: '8px',
                      border: '1px dashed rgba(236,72,153,0.3)',
                    }}
                  >
                    👑 <strong>School-Wide Authority:</strong> Oversees all constituent degree programs, faculty teaching assignments, centralized exam schedules, and panic grievances for this School.
                  </div>
                </motion.div>
              )}

              {/* 3. STUDENT & CR: School + Enrolled Degree Program */}
              {(role === 'Student' || role === 'CR') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '14px', borderRadius: '12px',
                    background: role === 'CR' ? 'rgba(20,184,166,0.05)' : 'rgba(16,185,129,0.05)',
                    border: `1px solid ${currentRoleConfig.color}33`,
                    display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  <div style={{ fontSize: '10px', color: currentRoleConfig.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {role === 'CR' ? 'Class Representative Section' : 'Student Academic Enrollment'}
                  </div>

                  {/* 1. Academic School (Searchable Select with Search Bar & Categories) */}
                  <SearchableSelect
                    label="School / Department *"
                    value={department}
                    onChange={(newDept) => {
                      setDepartment(newDept);
                      const deptPrograms = DEPARTMENT_COURSES_MAP[newDept];
                      if (deptPrograms && deptPrograms[0]?.items) {
                        const allDeptItems = deptPrograms.flatMap(c => c.items);
                        if (!allDeptItems.includes(courseName)) {
                          setCourseName(deptPrograms[0].items[0]);
                        }
                      }
                    }}
                    placeholder="Search or select your school (e.g. School of Computer Science & Engineering)..."
                    icon={Building2}
                    accentColor={currentRoleConfig.color}
                    categories={CATEGORIZED_DEPARTMENTS}
                    flatOptions={DEPARTMENTS}
                    helperText="Select or search your affiliated School."
                    emptyMessage="No matching schools found"
                  />

                  {/* 2. Degree Program (Program only) filtered by selected School */}
                  <SearchableSelect
                    label={`Degree Program in ${department} *`}
                    value={courseName}
                    onChange={(val) => setCourseName(val)}
                    placeholder={`Search or select degree program in ${department}...`}
                    icon={Compass}
                    accentColor={currentRoleConfig.color}
                    categories={currentDepartmentCategories}
                    helperText={
                      role === 'CR'
                        ? `Degree program you represent for ${department} coordination. You can also write-in a custom program.`
                        : `Your degree program in ${department}. You can also write-in a custom degree program.`
                    }
                    emptyMessage={`No matching degree programs found for ${department}`}
                  />

                  {/* 3. Academic Semester (Dedicated Section) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>
                        <Calendar size={13} color={currentRoleConfig.color} />
                        Academic Semester *
                      </label>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: `${currentRoleConfig.color}22`,
                          color: currentRoleConfig.color,
                          border: `1px solid ${currentRoleConfig.color}44`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {semester}
                      </span>
                    </div>

                    {/* 8-Grid Quick Semester Selector */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                      }}
                    >
                      {SEMESTER_PILLS.map((sem) => {
                        const isSelected = semester === sem.id;
                        return (
                          <motion.button
                            key={sem.id}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSemester(sem.id)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '8px',
                              border: isSelected
                                ? `1.5px solid ${currentRoleConfig.color}`
                                : '1px solid rgba(255,255,255,0.08)',
                              background: isSelected
                                ? `${currentRoleConfig.color}1a`
                                : '#141311',
                              color: isSelected ? '#ffffff' : '#94a3b8',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? `0 0 12px ${currentRoleConfig.color}33` : 'none',
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                              {sem.short}
                            </span>
                            <span style={{ fontSize: '9px', color: isSelected ? currentRoleConfig.color : '#64748b', fontWeight: 500 }}>
                              {sem.year}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.4 }}>
                      Enrolled academic term. Courses, assignment submissions, and exam rosters are calibrated to this semester.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button per DESIGN.md */}
              <motion.button
                type="submit"
                disabled={loading || !!success}
                whileHover={!loading ? { scale: 1.005 } : {}}
                whileTap={!loading ? { scale: 0.995 } : {}}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading ? '#807d72' : '#f54e00',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'none',
                  marginTop: '6px',
                  transition: 'background 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    {mode === 'signin' ? 'Verifying Identity & Credentials...' : 'Checking Institutional ERP Roster...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin'
                      ? `Authenticate as ${currentRoleConfig.label}`
                      : `Register as ${currentRoleConfig.label}`}
                    <ArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Security Features Tag Bar */}
          <div
            style={{
              marginTop: '18px', paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center'
            }}
          >
            {[
              'Email Role Auto-Detection',
              'Role-Specific Custom Forms',
              'bcrypt rounds=12',
              '5-Strike Account Lockout',
              'FastAPI + SQLite ACID',
            ].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '9.5px', color: '#807d72',
                  padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'monospace',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Viva Examiner Drawer */}
      <VivaDrawer
        open={vivaOpen}
        onToggle={() => setVivaOpen(!vivaOpen)}
        onFill={handleFill}
        rosterData={rosterData}
        onRefresh={fetchRoster}
        loadingRoster={loadingRoster}
      />

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #475569; }
        input { color-scheme: dark; }
        select { color-scheme: dark; }
      `}</style>
    </div>
  );
}
