import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  FileText,
  LayoutDashboard,
  History,
  Settings,
  Newspaper,
  Cpu,
  MessageSquare,
  Bell,
  ExternalLink,
  BookOpen,
  HelpCircle,
  RefreshCw,
  UserCheck,
  Compass,
  Lock,
  Sliders,
  Globe,
  Languages,
  Radio,
  Video,
  Layers,
  ChevronRight,
  ChevronDown,
  Check,
  Share2,
  Trash2,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

// 9 Major Features Data
interface FeatureGuide {
  id: string;
  num: string;
  title: string;
  badge: string;
  category: 'getting-started' | 'detection' | 'feed' | 'account';
  summary: string;
  steps: string[];
  tips?: string;
  actionText: string;
  actionLink: string;
  actionIcon: any;
  highlight?: string;
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: 'account',
    num: '01',
    title: 'Create Your Account & Secure Login',
    badge: 'Account & Identity',
    category: 'getting-started',
    summary: 'Set up your personalized forensics profile in seconds to track analyses, store history, and customize your news recommendations.',
    steps: [
      'Click the "Sign Up" button on the top-right of any page or visit the registration portal.',
      'Fill in your Full Name, unique Username, Email address, and a secure password.',
      'Log in securely with your credentials. Your session is protected by cryptographic tokens and cookies.',
      'Access your Personal Dashboard anytime to view tailored misinformation feeds and audit statistics.',
      'Manage your profile, preferred language, and notification preferences from Account Settings.'
    ],
    tips: 'Logging in enables personalized recommendation rotation and saves every claim analysis for future audit reference.',
    actionText: 'Create Account / Log In',
    actionLink: '/signup',
    actionIcon: UserCheck
  },
  {
    id: 'analyze',
    num: '02',
    title: 'Analyze News & Viral Claims',
    badge: 'Core Detection',
    category: 'detection',
    summary: 'Verify any suspicious headline, WhatsApp rumor, social media forward, or news excerpt in seconds using multilingual linguistic pattern models.',
    steps: [
      'Navigate to the Fake News Detection workstation (Home page).',
      'Paste or type the news headline, social post, or claim statement into the text area.',
      'Select the supported language (English, Hindi, or Hinglish) for optimal vocabulary calibration.',
      'Click the prominent "Analyze Claim" button to start the multi-stage detection pipeline.',
      'Wait 1 to 2 seconds while SatyaCheck evaluates linguistic features and cross-references live news portals.',
      'Review your Authenticity Score, Classification Badge, and Explainable AI (XAI) feature signals.'
    ],
    tips: 'For the most accurate results, paste complete sentences or headlines rather than isolated single words.',
    actionText: 'Try Live Detector',
    actionLink: '/',
    actionIcon: Sparkles,
    highlight: 'Includes Explainable AI (XAI) showing exactly which words triggered the verdict.'
  },
  {
    id: 'feed',
    num: '03',
    title: 'Explore Live Fact-Check Feed',
    badge: 'Verified Debunks',
    category: 'feed',
    summary: 'Browse accredited fact-checks published by certified IFCN newsrooms (BOOM Live, Alt News, Newschecker, Vishwas News, Factly) with verified media images.',
    steps: [
      'Click "Live Fact-Check Feed" in the left navigation sidebar or visit /feed.',
      'Browse high-resolution news thumbnails, headlines, and debunking summaries.',
      'Understand the 4 verdict badges: False / Fake (Red), Misleading (Amber), Partly False (Orange), and Verified True (Emerald).',
      'Click "Official Source" on any card to read the original investigative report published by the fact-checking agency.',
      'Click the "Refresh" button at the top-right to rotate in fresh, unread fact-checks.',
      'Filter news claims by Verdict (All, False, Misleading, True), Language (EN, HI), or Region (Global, India).'
    ],
    tips: 'The feed auto-syncs periodically in the background so you stay informed about breaking viral rumors.',
    actionText: 'Explore Live Feed',
    actionLink: '/feed',
    actionIcon: Newspaper
  },
  {
    id: 'recommendations',
    num: '04',
    title: 'Personalized Recommendations',
    badge: 'Tailored Discovery',
    category: 'feed',
    summary: 'Train your feed to deliver fact-checks that matter directly to you by selecting your favorite topics and preferred reading languages.',
    steps: [
      'Select your interests from 10 diverse categories: Politics, Technology, Education, Health, Science, Sports, Entertainment, Finance, International, and Social Media Rumors.',
      'Choose your preferred reading language (English, Hindi, Hinglish, or All Languages).',
      'Visit your Dashboard to view curated fact-checks matching your interests.',
      'Click the "Refresh Feed" button to dynamically rotate recommendations without showing duplicates.',
      'Update your interest categories at any time from Profile Settings or the Onboarding modal.'
    ],
    tips: 'Selecting multiple interests gives you a balanced feed of trending debunks across politics, health, and tech.',
    actionText: 'View My Recommendations',
    actionLink: '/dashboard',
    actionIcon: Compass
  },
  {
    id: 'compare',
    num: '05',
    title: 'Analyze Recommended News (Comparison Mode)',
    badge: 'Dual Verification',
    category: 'detection',
    summary: 'Compare human investigative journalism with machine learning statistical inference to get a comprehensive 360-degree verification perspective.',
    steps: [
      'Open any card on the Live Fact-Check Feed or Recommended News shelf.',
      'Click the white "Analyze with SatyaCheck" button located at the bottom of the card.',
      'SatyaCheck sends the claim statement through the ML Classifier.',
      'The comparison modal displays the original Fact-Check verdict alongside SatyaCheck\'s ML linguistic prediction score.',
      'Compare both findings: Investigative journalists verify physical sources, while the ML model inspects clickbait and sensationalist language patterns.'
    ],
    tips: 'Investigative fact-checking and machine learning linguistics complement each other to uncover deep misinformation.',
    actionText: 'Open Live Feed to Compare',
    actionLink: '/feed',
    actionIcon: Layers
  },
  {
    id: 'dashboard',
    num: '06',
    title: 'Personal Dashboard & Analytics',
    badge: 'Forensic Analytics',
    category: 'account',
    summary: 'Monitor your misinformation defense statistics, track how many claims you have analyzed, and view authentic vs fake news ratios.',
    steps: [
      'Navigate to "User Dashboard" from the sidebar navigation or user menu.',
      'Review your key statistics: Total Analyses performed, Fake vs Real count distribution, and Latest Activity timestamp.',
      'Explore quick-access recommendation carousels highlighting viral claims related to your chosen interests.',
      'Review educational misinformation literacy tips that help you spot doctored photos and scam forwards.',
      'Quickly relaunch an analysis or jump back to previous investigations with a single click.'
    ],
    tips: 'Your dashboard updates immediately each time you run a news analysis on the workstation.',
    actionText: 'Open My Dashboard',
    actionLink: '/dashboard',
    actionIcon: LayoutDashboard
  },
  {
    id: 'history',
    num: '07',
    title: 'Prediction History & Audit Trail',
    badge: 'Audit Trail',
    category: 'account',
    summary: 'Maintain a complete personal audit log of every news analysis you conduct with full search, filtering, and privacy deletion controls.',
    steps: [
      'Click "Prediction History" in the sidebar navigation or visit /history.',
      'View your past analyses organized chronologically with timestamps and authenticity scores.',
      'Use the live search bar to find previous analyses by keywords or claimant names.',
      'Filter history by verdict label (Authentic, Fake, Suspicious) or sort by newest first.',
      'Click the trash icon on any record to delete it individually from your database.',
      'Use the "Clear All History" button with safety confirmation to permanently delete all your past records.'
    ],
    tips: 'Data is strictly isolated to your account. Other users cannot see or search your analysis history.',
    actionText: 'View Audit History',
    actionLink: '/history',
    actionIcon: History
  },
  {
    id: 'settings',
    num: '08',
    title: 'Profile Settings & Customization',
    badge: 'Preferences',
    category: 'account',
    summary: 'Manage your personal account credentials, change display languages, update interested topics, and reset tutorial guides.',
    steps: [
      'Go to "Account Settings" from the navigation sidebar or by clicking your user profile badge.',
      'Update your Full Name and Username to personalize your forensic workspace.',
      'Change your preferred content language to see headlines in English, Hindi, or Hinglish.',
      'Toggle topic interest pills to instantly retune your recommendation feed.',
      'Update your account password securely by confirming your current password.',
      'Click "Restart Tutorial" if you ever want to review the first-time onboarding walkthrough.'
    ],
    tips: 'Always save your changes after updating your username or password.',
    actionText: 'Manage Account Settings',
    actionLink: '/account',
    actionIcon: Settings
  },
  {
    id: 'deepfake',
    num: '09',
    title: 'Deepfake Media Forensics',
    badge: 'Experimental Forensics Lab',
    category: 'detection',
    summary: 'Analyze synthetic media, manipulated video faces, and AI-generated portraits using facial landmark tracking and biological consistency markers.',
    steps: [
      'On the Home workstation, switch the mode selector from "News Text" to "Deepfake Media".',
      'Upload supported media formats: MP4 / WebM video files or PNG / JPG face images (up to 50MB).',
      'Click "Run Forensic Analysis" to initiate facial mesh point tracking and spatial discontinuity scans.',
      'Observe the 68-point facial landmark grid overlaid on detected human faces.',
      'Inspect physiological indicators: Blinking frequency rates (normal: 0.3-0.5 Hz) and lip-sync synchronization cadence.',
      'Review the boundary consistency score to detect face-swap artifacts or synthetic generative borders.'
    ],
    tips: 'Status: Experimental Forensics Preview. Video deepfake detection is currently in active research testing with neural models being calibrated.',
    actionText: 'Open Forensics Workstation',
    actionLink: '/',
    actionIcon: Video,
    highlight: 'Advanced neural video classification is in active laboratory testing.'
  }
];

// Interactive Tutorial Walkthrough Steps
const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Paste or Type Your Claim',
    subtitle: 'Step 1 of 5: Input Claim Text',
    desc: 'Start by copying any viral WhatsApp forward, tweet, news headline, or text claim you want to verify and paste it directly into the SatyaCheck input box.',
    targetFeature: 'Live ML Detector',
    link: '/',
    mockup: {
      claim: 'RBI introduces new ₹1000 currency notes embedded with GPS satellite tracking chips from next month.',
      language: 'English',
      statusText: 'Ready for linguistic scan'
    }
  },
  {
    step: 2,
    title: 'Select Language & Run Scan',
    subtitle: 'Step 2 of 5: Multilingual Calibration',
    desc: 'Choose the language of your claim (English, Hindi, or Hinglish). SatyaCheck loads specialized vocabularies and stopword sets before clicking "Analyze Claim".',
    targetFeature: 'Language Calibration',
    link: '/',
    mockup: {
      claim: 'RBI introduces new ₹1000 currency notes embedded with GPS satellite tracking chips from next month.',
      language: 'English',
      statusText: 'Vectorizing unigrams & bigrams across 12,000 linguistic features...'
    }
  },
  {
    step: 3,
    title: 'Review Authenticity Score & Verdict',
    subtitle: 'Step 3 of 5: Prediction & Explainable AI',
    desc: 'The ML model calculates an Authenticity Score from 0% to 100%. View the verdict badge (Fake, Authentic, or Suspicious) and check which sensationalist keywords influenced the score.',
    targetFeature: 'Verdict & XAI Signals',
    link: '/',
    mockup: {
      verdict: 'Fake / Sensationalist',
      score: '8%',
      scoreLabel: 'Authenticity Score',
      topSignals: [
        { term: 'satellite chips', impact: 'fake', weight: -3.8 },
        { term: 'tracking', impact: 'fake', weight: -2.4 },
        { term: 'RBI introduces', impact: 'authentic', weight: +1.1 }
      ],
      crossRef: 'Cross-referenced 40+ news portals: No official RBI announcement found.'
    }
  },
  {
    step: 4,
    title: 'Explore Live Fact-Check Feed',
    subtitle: 'Step 4 of 5: Fact-Check Corroboration',
    desc: 'Visit the Live Fact-Check Feed to see how accredited IFCN journalists (BOOM Live, PIB Fact Check) have investigated similar claims, complete with photos and official rebuttals.',
    targetFeature: 'Live Fact-Check Feed',
    link: '/feed',
    mockup: {
      publisher: 'BOOM Live / PIB Fact Check',
      verdict: 'False / Hoax',
      headline: 'Viral WhatsApp forward claiming ₹1000 GPS notes is completely fabricated.',
      explanation: 'Reserve Bank of India has issued an official clarification confirming no ₹1000 notes or tracking chips are being developed.'
    }
  },
  {
    step: 5,
    title: 'Track Analytics & Audit History',
    subtitle: 'Step 5 of 5: Personal Dashboard & History',
    desc: 'All analyses are automatically logged in your Prediction History. Track your personal statistics on the Dashboard and receive tailored fact-checks based on your chosen interests.',
    targetFeature: 'User Dashboard',
    link: '/dashboard',
    mockup: {
      totalAnalyses: 14,
      fakeCount: 9,
      realCount: 5,
      lastActive: 'Today, 4:15 PM',
      recommendation: 'Politics & Social Media Rumors (Hindi & English)'
    }
  }
];

// FAQ List
interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'How does SatyaCheck detect fake news?',
    a: 'SatyaCheck utilizes multi-layered natural language processing (NLP) models trained on verified datasets of authentic journalism and debunked disinformation. It analyzes linguistic markers, clickbait sentence structures, emotional hyperbole, and vocabulary patterns, while simultaneously searching 40+ accredited news publications in real time to verify empirical coverage.',
    category: 'Detection'
  },
  {
    q: 'Can I analyze Hindi and Hinglish news?',
    a: 'Yes! SatyaCheck features dedicated multilingual models supporting standard English, Devanagari Hindi, and Romanized Hindi (Hinglish). The model uses language-specific tokenizers, stopword dictionaries, and phonetic soundex mapping to ensure high accuracy across Indian linguistic contexts.',
    category: 'Languages'
  },
  {
    q: 'What does "Verified True" mean on the feed?',
    a: 'A "Verified True" badge indicates that an accredited fact-checking organization (such as PIB Fact Check, BOOM Live, Reuters, or Newschecker) has conducted an empirical investigation, reviewed primary records or video evidence, and verified that the headline or claim is accurate.',
    category: 'Feed'
  },
  {
    q: 'Is every ML prediction 100% accurate?',
    a: 'No automated AI algorithm is 100% infallible. SatyaCheck computes a statistical probability based on linguistic markers and available digital coverage. It is designed as an analytical aid to be used alongside critical thinking and primary sources. That is why we provide Explainable AI (XAI) feature signals so you can see why a decision was reached.',
    category: 'Accuracy'
  },
  {
    q: 'Where can I find my previous analyses?',
    a: 'All past analyses are saved to your account in the Prediction History page (/history). You can browse previous analyses, search by keywords, filter by verdict labels, or review full prediction details at any time.',
    category: 'History'
  },
  {
    q: 'How do I refresh recommendations in my feed?',
    a: 'On both the Live Fact-Check Feed (/feed) and your User Dashboard (/dashboard), you will find a prominent "Refresh" button at the top-right of the feed section. Clicking it triggers our dynamic recommendation rotation, displaying fresh eligible articles matching your interests while prioritizing unread content.',
    category: 'Feed'
  },
  {
    q: 'Can I delete my prediction history?',
    a: 'Yes, absolutely. SatyaCheck respects user privacy. In Prediction History (/history), you can delete individual records with a single click or clear your entire analysis history using the "Clear All History" button with confirmation.',
    category: 'Privacy'
  },
  {
    q: 'How can I report an incorrect result or contest a verdict?',
    a: 'You can submit feedback at any time by clicking the "Forensic Feedback" button (the message bubble icon in the navigation rail or the "Feedback" link on any news card). This opens our reporting dialog where you can enter the disputed claim, submit official evidence URLs, and send notes directly to our verification team.',
    category: 'Feedback'
  }
];

export const HowToUse: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'getting-started' | 'detection' | 'feed' | 'account'>('all');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Filter features
  const filteredFeatures = FEATURE_GUIDES.filter((f) => {
    if (activeTab === 'all') return true;
    return f.category === activeTab;
  });

  // Filter FAQs
  const filteredFaqs = FAQS.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q) || faq.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 selection:bg-zinc-800 selection:text-white pb-20">
      
      {/* ==================== Top Sticky Header (#141414) ==================== */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#141414]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2B2B2B] bg-[#1C1C1C]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">SatyaCheck</span>
                <span className="ml-2 rounded border border-[#2B2B2B] bg-[#181818] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  User Guide
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-mono text-zinc-300 hover:text-white hover:bg-[#222222]">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to Detector</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>

            <Link to="/feed">
              <Button variant="outline" size="sm" className="gap-1.5 border-[#333333] bg-[#1E1E1E] text-xs font-mono text-zinc-200 hover:bg-[#282828] hover:text-white">
                <Newspaper className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Live Feed</span>
              </Button>
            </Link>

            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* ==================== Hero Section ==================== */}
      <section className="relative overflow-hidden border-b border-[#262626] bg-gradient-to-b from-[#181818] to-[#121212] py-14 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Complete Beginner-Friendly User Manual</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            How to Use SatyaCheck
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-300 leading-relaxed font-sans">
            Your simple guide to detecting misinformation, exploring fact-checks, and staying informed.
          </p>

          {/* Quick Stat Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#181818] px-3 py-1.5 text-zinc-300">
              <Languages className="h-3.5 w-3.5 text-emerald-400" />
              <span>English, Hindi &amp; Hinglish</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#181818] px-3 py-1.5 text-zinc-300">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span>IFCN Verified Sources</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#181818] px-3 py-1.5 text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Explainable AI Signals</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#2B2B2B] bg-[#181818] px-3 py-1.5 text-zinc-300">
              <Lock className="h-3.5 w-3.5 text-rose-400" />
              <span>Private Audit History</span>
            </div>
          </div>

          {/* Jump to Sections Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="#interactive-tutorial"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-mono text-xs font-bold text-zinc-950 transition-all hover:bg-zinc-200 shadow-md"
            >
              <Compass className="h-4 w-4 text-zinc-950" />
              <span>Start Interactive Tutorial</span>
            </a>

            <a
              href="#all-features"
              className="inline-flex items-center gap-2 rounded-lg border border-[#333333] bg-[#202020] px-5 py-2.5 font-mono text-xs font-semibold text-white transition-all hover:bg-[#282828]"
            >
              <Layers className="h-4 w-4 text-zinc-400" />
              <span>Browse All 9 Features</span>
            </a>

            <a
              href="#faqs"
              className="inline-flex items-center gap-2 rounded-lg border border-[#333333] bg-[#202020] px-5 py-2.5 font-mono text-xs font-semibold text-zinc-300 transition-all hover:bg-[#282828] hover:text-white"
            >
              <HelpCircle className="h-4 w-4 text-zinc-400" />
              <span>Read FAQs</span>
            </a>
          </div>
        </div>
      </section>

      {/* ==================== Section 1: Interactive Tutorial Stepper ==================== */}
      <section id="interactive-tutorial" className="py-16 border-b border-[#262626]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-0.5 font-mono text-[11px] text-amber-300">
              <Compass className="h-3 w-3" />
              <span>Hands-On Walkthrough</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Interactive Step-by-Step Tutorial
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Follow this 5-step visual guide to learn how to analyze a claim, inspect evidence, and monitor your personal dashboard.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#181818] p-4 sm:p-6 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-950 font-mono text-xs font-bold">
                  {currentStep.step}
                </span>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">{currentStep.title}</h3>
                  <div className="text-[11px] font-mono text-zinc-400">{currentStep.subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className="h-8 gap-1 border-[#333333] bg-[#202020] text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Prev</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentStepIndex((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1))}
                  disabled={currentStepIndex === TUTORIAL_STEPS.length - 1}
                  className="h-8 gap-1 border-[#333333] bg-[#202020] text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="grid grid-cols-5 gap-2">
              {TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex flex-col gap-1 text-left rounded-lg p-2.5 transition-all ${
                    idx === currentStepIndex
                      ? 'border border-emerald-500/50 bg-[#222222] shadow-sm'
                      : 'border border-[#262626] bg-[#141414] hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className={`font-mono text-[11px] font-bold ${idx === currentStepIndex ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    0{s.step}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-300 truncate hidden sm:inline">
                    {s.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Step Content & Realistic UI Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
              
              {/* Left Column: Description & Action */}
              <div className="lg:col-span-5 space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                  {currentStep.desc}
                </p>

                <div className="rounded-xl border border-[#2B2B2B] bg-[#141414] p-3 text-xs font-mono text-zinc-400 space-y-1.5">
                  <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Quick Tip:</span>
                  </div>
                  <p>You can paste full WhatsApp forward headers or web claims. SatyaCheck normalizes punctuation and script noise automatically.</p>
                </div>

                <div className="pt-2">
                  <Link to={currentStep.link}>
                    <Button className="w-full sm:w-auto gap-2 bg-emerald-500 text-zinc-950 font-mono text-xs font-bold hover:bg-emerald-400 shadow-sm">
                      <span>Try This Feature: {currentStep.targetFeature}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: High-Fidelity UI Illustration */}
              <div className="lg:col-span-7">
                <div className="rounded-xl border border-[#2B2B2B] bg-[#121212] p-5 shadow-inner space-y-4">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-xs font-mono">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      SatyaCheck Interactive Preview
                    </span>
                    <span className="rounded bg-[#1E1E1E] px-2 py-0.5 text-[10px] text-zinc-400">
                      Step {currentStep.step} of 5
                    </span>
                  </div>

                  {/* Step 1 & 2 Mockup */}
                  {currentStep.step === 1 && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-[#333333] bg-[#181818] p-3 text-xs font-mono text-zinc-200">
                        <span className="text-zinc-500 select-none block mb-1">Claim Statement:</span>
                        "{currentStep.mockup.claim}"
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">Language: <strong className="text-emerald-400">English (Calibrated)</strong></span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] text-emerald-300">
                          Ready to Analyze
                        </span>
                      </div>
                    </div>
                  )}

                  {currentStep.step === 2 && (
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                        <span>Vectorizing input across 12,000 TF-IDF n-grams...</span>
                      </div>
                      <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full w-2/3 animate-pulse rounded-full" />
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Querying DuckDuckGo across 40+ trusted national &amp; global news publications...
                      </div>
                    </div>
                  )}

                  {/* Step 3 Mockup */}
                  {currentStep.step === 3 && (
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{currentStep.mockup.verdict}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-zinc-400">{currentStep.mockup.scoreLabel}</div>
                          <div className="text-sm font-extrabold text-red-400">{currentStep.mockup.score}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[11px] text-zinc-400">Top Linguistic Weight Triggers (XAI):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentStep.mockup.topSignals?.map((sig: any, idx: number) => (
                            <span
                              key={idx}
                              className={`rounded border px-2 py-0.5 text-[10px] ${
                                sig.impact === 'authentic'
                                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                                  : 'border-red-500/30 bg-red-950/40 text-red-300'
                              }`}
                            >
                              {sig.term} ({sig.weight > 0 ? `+${sig.weight}` : sig.weight})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-2.5 text-[11px] text-zinc-400 leading-relaxed">
                        {currentStep.mockup.crossRef}
                      </div>
                    </div>
                  )}

                  {/* Step 4 Mockup */}
                  {currentStep.step === 4 && (
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                        <span className="rounded border border-[#2B2B2B] bg-[#181818] px-2 py-0.5 text-[11px] font-bold text-zinc-200">
                          {currentStep.mockup.publisher}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          <XCircle className="h-3 w-3" />
                          <span>{currentStep.mockup.verdict}</span>
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white font-sans">
                        {currentStep.mockup.headline}
                      </div>
                      <div className="rounded-lg border border-[#262626] bg-[#141414] p-2.5 text-[11px] text-zinc-400 font-sans leading-relaxed">
                        {currentStep.mockup.explanation}
                      </div>
                    </div>
                  )}

                  {/* Step 5 Mockup */}
                  {currentStep.step === 5 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-center">
                      <div className="rounded-lg border border-[#2B2B2B] bg-[#161616] p-3">
                        <div className="text-xl font-extrabold text-white">{currentStep.mockup.totalAnalyses}</div>
                        <div className="text-[10px] text-zinc-400">Total Scans</div>
                      </div>
                      <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                        <div className="text-xl font-extrabold text-red-400">{currentStep.mockup.fakeCount}</div>
                        <div className="text-[10px] text-red-300">Fake Claims</div>
                      </div>
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 col-span-2 sm:col-span-1">
                        <div className="text-xl font-extrabold text-emerald-400">{currentStep.mockup.realCount}</div>
                        <div className="text-[10px] text-emerald-300">Authentic</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==================== Section 2: All 9 Major Features ==================== */}
      <section id="all-features" className="py-16 border-b border-[#262626]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2B2B2B] bg-[#181818] px-3 py-0.5 font-mono text-[11px] text-zinc-400">
                <Layers className="h-3 w-3 text-zinc-400" />
                <span>Feature Index</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Explore All 9 Major Features
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Comprehensive step-by-step guides for every tool in the SatyaCheck misinformation defense ecosystem.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {[
                { id: 'all', label: 'All Features' },
                { id: 'getting-started', label: 'Getting Started' },
                { id: 'detection', label: 'Detection' },
                { id: 'feed', label: 'Feed & Recommendations' },
                { id: 'account', label: 'Dashboard & Privacy' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveTab(pill.id as any)}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    activeTab === pill.id
                      ? 'border border-[#333333] bg-[#2A2A2A] text-white font-bold'
                      : 'border border-[#262626] bg-[#161616] text-zinc-400 hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feat) => {
              const ActionIcon = feat.actionIcon;
              return (
                <div
                  key={feat.id}
                  id={`feature-${feat.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-[#2B2B2B] bg-[#181818] p-6 shadow-sm transition-all duration-200 hover:border-zinc-500/80 hover:bg-[#1A1A1A]"
                >
                  <div className="space-y-4">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#222222] font-mono text-sm font-bold text-white border border-[#2B2B2B]">
                          {feat.num}
                        </span>
                        <span className="rounded bg-[#1E1E1E] border border-[#2B2B2B] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                          {feat.badge}
                        </span>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white font-sans tracking-tight">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {feat.summary}
                      </p>
                    </div>

                    {/* Numbered Steps */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                        How to use:
                      </div>
                      <ol className="space-y-2 text-xs text-zinc-300 font-sans">
                        {feat.steps.map((st, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#242424] text-[10px] font-mono text-zinc-400 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips or Special Highlight */}
                    {feat.tips && (
                      <div className="rounded-lg border border-[#262626] bg-[#141414] p-3 text-xs text-zinc-400 leading-relaxed flex items-start gap-2">
                        <Info className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat.tips}</span>
                      </div>
                    )}

                    {feat.highlight && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-300 font-mono leading-relaxed">
                        ★ {feat.highlight}
                      </div>
                    )}

                  </div>

                  {/* Card Action Link */}
                  <div className="pt-6 border-t border-[#262626] mt-6">
                    <Link to={feat.actionLink}>
                      <Button
                        size="sm"
                        className="w-full gap-2 border border-[#333333] bg-[#222222] hover:bg-[#2A2A2A] text-white font-mono text-xs font-semibold shadow-sm"
                      >
                        <ActionIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{feat.actionText}</span>
                      </Button>
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==================== Section 3: Frequently Asked Questions (Accordion) ==================== */}
      <section id="faqs" className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2B2B2B] bg-[#181818] px-3 py-0.5 font-mono text-[11px] text-zinc-400">
              <HelpCircle className="h-3 w-3 text-zinc-400" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Everything you need to know about SatyaCheck's detection models, data privacy, and recommendation feed.
            </p>
          </div>

          {/* FAQ Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. Hindi, accurate, refresh, delete history, report)..."
              className="pl-10 h-11 border-[#2B2B2B] bg-[#181818] text-xs font-mono text-white placeholder:text-zinc-500 rounded-xl"
            />
          </div>

          {/* FAQ Accordion List */}
          <div className="rounded-2xl border border-[#2B2B2B] bg-[#161616] p-4 sm:p-6 shadow-sm">
            {filteredFaqs.length === 0 ? (
              <div className="py-10 text-center text-xs font-mono text-zinc-400">
                No matching answers found for "{searchQuery}". Try searching for another topic.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-3">
                {filteredFaqs.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border border-[#262626] rounded-xl px-4 bg-[#181818] transition-colors hover:border-zinc-700"
                  >
                    <AccordionTrigger className="text-left font-mono text-sm font-semibold text-white hover:no-underline py-4">
                      <span className="flex items-center gap-2.5">
                        <span className="text-emerald-400 text-xs">Q:</span>
                        <span>{faq.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-zinc-300 font-sans leading-relaxed pb-4 pt-1">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Forensic Feedback Assistance Callout */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Need help or want to contest a classification?</span>
              </h4>
              <p className="text-xs text-zinc-400">
                Our forensic feedback system is always available. Report disputed claims or submit official sources anytime.
              </p>
            </div>
            <Link to="/">
              <Button size="sm" className="bg-emerald-500 text-zinc-950 font-mono text-xs font-bold hover:bg-emerald-400 flex-shrink-0">
                <span>Open Workstation</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ==================== Footer Navigation (#141414) ==================== */}
      <footer className="mt-12 border-t border-[#262626] bg-[#0E0E0E] py-8 text-xs font-mono text-zinc-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>SatyaCheck — Multilingual Fake News Forensics</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white transition-colors">Detector</Link>
            <Link to="/feed" className="hover:text-white transition-colors">Live Feed</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/history" className="hover:text-white transition-colors">History</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HowToUse;
