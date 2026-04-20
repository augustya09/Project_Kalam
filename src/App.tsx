/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Search, 
  User, 
  FileText, 
  MessageSquare, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Database,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ExternalLink,
  Mic,
  Volume2,
  Languages,
  RotateCcw,
  FileDown,
  Menu,
  X,
  ArrowLeft,
  Zap,
  Loader2
} from 'lucide-react';

import { cn } from './lib/utils';
import { evaluateProfile, UserProfile, EvaluationResult, ADVERSARIAL_PROFILES, getUnifiedDocumentChecklist } from './lib/engine';
import { AMBIGUITY_MAP, WELFARE_SCHEMES } from './data/schemes';
import ReactMarkdown from 'react-markdown';
import architectureContent from '../ARCHITECTURE.md?raw';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- Constants ---

const VOICE_QUESTIONS = [
  { key: 'age', en: "How old are you?", hi: "आपकी उम्र क्या है?", type: 'number' },
  { key: 'gender', en: "What is your gender? Male, Female, or Other?", hi: "आपका लिंग क्या है? पुरुष, महिला, या अन्य?", type: 'choice', options: ['male', 'female', 'other'] },
  { key: 'state', en: "Which state do you live in?", hi: "आप किस राज्य में रहते हैं?", type: 'text' },
  { key: 'isUrban', en: "Do you live in an urban or rural area?", hi: "क्या आप शहरी क्षेत्र में रहते हैं या ग्रामीण?", type: 'boolean', trueVal: 'urban', falseVal: 'rural' },
  { key: 'income', en: "What is your annual family income?", hi: "आपकी वार्षिक पारिवारिक आय क्या है?", type: 'number' },
  { key: 'occupation', en: "What is your occupation? For example, farmer, street vendor, or student.", hi: "आपका व्यवसाय क्या है? उदाहरण के लिए, किसान, रेहड़ी-पटरी वाला, या छात्र।", type: 'text' },
  { key: 'isBPL', en: "Do you have a BPL card?", hi: "क्या आपके पास बीपीएल कार्ड है?", type: 'boolean' },
  { key: 'hasBankAccount', en: "Do you have a bank account?", hi: "क्या आपके पास बैंक खाता है?", type: 'boolean' },
  { key: 'caste', en: "What is your social category? General, OBC, SC, ST, or EWS?", hi: "आपकी सामाजिक श्रेणी क्या है? सामान्य, OBC, SC, ST, या EWS?", type: 'choice', options: ['general', 'obc', 'sc', 'st', 'ews'] },
  { key: 'willingToWork', en: "Are you willing to do manual labour work if needed?", hi: "क्या आप मजदूरी का काम करने के लिए तैयार हैं?", type: 'boolean' },
];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
];

// --- Sub-components ---

const ConfidenceRing = ({ score, size = 40, pulse = false }: { score: number, size?: number, pulse?: boolean }) => {
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  // Dynamic color based on score
  const ringColor = score >= 75 ? '#22C55E' : score >= 40 ? '#F5A623' : '#EF4444';

  return (
    <div className={cn("relative flex items-center justify-center score", pulse ? "animate-pulse" : "")} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-dark-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] text-slate-100">{Math.round(score)}</span>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, horizontalRule = true }: { title: string, subtitle?: string, horizontalRule?: boolean }) => (
  <div className="mb-12">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-5xl md:text-7xl font-display font-black uppercase tracking-tight text-white mb-4"
    >
      {title}
    </motion.h2>
    {horizontalRule && <div className="h-px bg-saffron w-24 mb-6" />}
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-slate-400 font-sans font-light text-lg max-w-2xl"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const CaseFileCard = ({ profile, onClick, outcome, index }: { profile: any, onClick: () => void, outcome?: string, index: number }) => {
  const dossierId = String(1000 + index).padStart(4, '0');

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "premium-card w-full text-left p-6 group relative overflow-hidden",
        outcome === 'eligible' ? "border-l-4 border-l-emerald-500" : 
        outcome === 'almost-eligible' ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-red-500"
      )}
    >
      <div className="font-mono text-[10px] text-muted mb-2 uppercase tracking-widest text-[#888]">Dossier #{dossierId}</div>
      <div className="font-display text-xl text-slate-100 font-bold mb-2 transition-colors group-hover:text-saffron uppercase">{profile.name || 'Anonymous'}</div>
      <div className="text-xs text-secondary italic font-sans text-slate-400">{profile.expectedIssue || 'Manual review required'}</div>
      <ChevronRight size={16} className="absolute bottom-4 right-4 text-dark-border group-hover:text-saffron transition-transform group-hover:translate-x-1" />
    </motion.button>
  );
};

const AmbiguityEntry = ({ entry }: { entry: any }) => (
  <div className="premium-card bg-dark-card p-8 group">
    <div className="flex justify-between items-start mb-6">
      <div className={cn(
        "px-3 py-1 font-mono text-[10px] uppercase tracking-widest border",
        entry.type === 'Contradiction' ? "border-red-500/30 text-red-500 bg-red-500/5" :
        entry.type === 'Overlap' ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
        "border-indigo-500/30 text-indigo-500 bg-indigo-500/5"
      )}>
        {entry.type}
      </div>
    </div>
    <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-gold transition-colors">{entry.title}</h3>
    <p className="text-sm text-secondary leading-relaxed font-sans mb-6 text-slate-300">{entry.description}</p>
    <div className="flex flex-wrap gap-2">
      {entry.schemes.map((s: string) => (
        <span key={s} className="px-2 py-1 bg-dark-bg border border-dark-border text-muted text-[10px] rounded hover:text-white hover:border-slate-500 transition-colors cursor-default capitalize text-slate-400">
          {s}
        </span>
      ))}
    </div>
  </div>
);

// --- Voice Assistant ---

const VoiceAssistant = ({ profile, setProfile, lang, setLang, onComplete, onClose }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentQuestion = VOICE_QUESTIONS[currentStep];

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => startListening(), 500);
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.onstart = () => { setIsListening(true); setTranscript(''); };
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      handleResponse(result);
    };
    recognition.onend = () => setIsListening(false);
    try { recognition.start(); } catch (e) {}
  };

  const handleResponse = async (text: string) => {
    let value: any = text;
    if (currentQuestion.type === 'number') value = parseInt(text.match(/\d+/)?.[0] || '0');
    else if (currentQuestion.type === 'boolean') value = ['yes', 'yeah', 'ha', 'urban', 'rural', 'sahi', 'haan'].some(p => text.toLowerCase().includes(p));
    
    setProfile((prev: any) => ({ ...prev, [currentQuestion.key]: value }));
    
    setTimeout(() => {
      if (currentStep < VOICE_QUESTIONS.length - 1) setCurrentStep(prev => prev + 1);
      else onComplete();
    }, 1500);
  };

  useEffect(() => {
    if (currentQuestion) speak(lang === 'hi' ? currentQuestion.hi : currentQuestion.en);
    return () => window.speechSynthesis.cancel();
  }, [currentStep, lang]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-dark-bg/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      <div className="noise-overlay absolute inset-0" />
      
      {/* Top Controls */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
        <div className="flex bg-dark-surface p-1 border border-dark-border rounded-full">
          <button 
            onClick={() => setLang('en')}
            className={cn("px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all", lang === 'en' ? "bg-saffron text-white" : "text-muted hover:text-white")}
          >
            English
          </button>
          <button 
            onClick={() => setLang('hi')}
            className={cn("px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all", lang === 'hi' ? "bg-saffron text-white" : "text-muted hover:text-white")}
          >
            हिन्दी
          </button>
        </div>
        <button onClick={onClose} className="p-3 text-muted hover:text-white border border-dark-border rounded-full transition-colors bg-dark-surface">
          <X size={20} />
        </button>
      </div>

      {/* Central Orb */}
      <div className="relative mb-16 scale-150">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-48 h-48 bg-saffron/10 absolute rounded-full blur-[80px]"
        />
        <motion.div 
          animate={isListening ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
          className={cn(
            "w-32 h-32 rounded-full border border-saffron/50 flex items-center justify-center relative z-10 transition-colors shadow-[0_0_40px_rgba(255,107,0,0.1)]",
            isListening ? "bg-saffron/10" : "bg-dark-surface"
          )}
        >
          <Mic size={40} className={isListening ? "text-saffron" : "text-muted"} />
          
          {/* Animated rings */}
          {isListening && [1, 2, 3].map(i => (
            <motion.div 
              key={i}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
              className="absolute inset-0 border border-saffron/30 rounded-full"
            />
          ))}
        </motion.div>
      </div>

      <div className="text-center max-w-2xl relative z-10">
        <motion.p 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-medium text-white mb-8 tracking-tight"
        >
          {lang === 'hi' ? currentQuestion?.hi : currentQuestion?.en}
        </motion.p>
        
        <div className="flex flex-col items-center gap-4 min-h-[60px]">
          {transcript && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-saffron text-sm bg-saffron/5 px-4 py-2 border border-saffron/20 rounded inline-block"
            >
              <span className="opacity-50 mr-2 text-saffron">&gt;</span>
              {transcript}
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="absolute bottom-16 w-full max-w-sm px-8">
        <div className="flex justify-between font-mono text-[9px] text-muted uppercase tracking-[0.3em] mb-3">
          <span className="text-[#666]">Question {currentStep + 1}</span>
          <span className="text-[#666]">{Math.round(((currentStep + 1) / VOICE_QUESTIONS.length) * 100)}% Complete</span>
        </div>
        <div className="h-0.5 bg-dark-border w-full relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / VOICE_QUESTIONS.length) * 100}%` }}
            className="absolute h-full bg-saffron"
          />
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'results' | 'chat' | 'docs' | 'stress'>('profile');
  const [profile, setProfile] = useState<UserProfile>({
    age: 30,
    isRural: true,
    hasBankAccount: true,
    income: 50000,
    occupation: 'farmer',
    landOwnership: 1,
    gender: 'male',
    isTaxpayer: false,
    ownsPuccaHouse: false,
    housingStatus: 'kutcha-house',
    state: '',
    caste: ''
  });
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en' | 'hi'>('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [isCritiqueLoading, setIsCritiqueLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Parallax elements
  const { scrollYProgress } = useScroll();
  const heroGhostY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroGhostOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const res = evaluateProfile(profile);
    setResults(res);
  }, [profile]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const adversarialResults = useMemo(() => 
    ADVERSARIAL_PROFILES.map(ap => ({
      ...ap,
      outcome: evaluateProfile(ap.profile)[0]?.status
    })), 
  []);

  const ambiguityMapMemo = useMemo(() => AMBIGUITY_MAP, []);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const setLocation = (isUrban: boolean) => {
    handleProfileChange('isUrban', isUrban);
    handleProfileChange('isRural', !isUrban);
  };

  const selectedScheme = useMemo(() => 
    selectedSchemeId ? WELFARE_SCHEMES.find(s => s.id === selectedSchemeId) : null,
  [selectedSchemeId]);

  const selectedResult = useMemo(() => 
    results.find(r => r.schemeId === selectedSchemeId),
  [results, selectedSchemeId]);

  const runAnalysis = () => {
    setIsLoadingResults(true);
    setTimeout(() => {
      setIsLoadingResults(false);
      setIsCalculated(true);
      setActiveTab('results');
    }, 600);
  };

  const getClaudeCritique = async (res: EvaluationResult) => {
    setIsCritiqueLoading(true);
    setCritique(null);
    const summary = `Scheme: ${res.schemeName}\nStatus: ${res.status}\nConfidence: ${res.confidenceScore}%\nRules:\n${res.ruleEvaluations.map(re => `- [${re.passed === true ? 'PASS' : re.passed}] ${re.description}`).join('\n')}\nGaps:\n${res.gapAnalysis.join('\n')}`;
    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiOutput: summary }),
      });
      const data = await response.json();
      setCritique(data.critique || "Review unavailable.");
    } catch (error) { setCritique("Conn error."); } finally { setIsCritiqueLoading(false); }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: "The AI Assistant features have been removed from this version of Project Kalam. You can still use the Engine to evaluate eligibility structures manually." 
      }]);
      setIsChatLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-dark-bg transition-colors duration-700">
      <div className="noise-overlay fixed inset-0 z-0" />
      
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[80] transition-all duration-500 h-20 flex items-center",
        scrolled ? "nav-scrolled" : "bg-transparent border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('profile')}>
            <span className="font-display text-2xl font-black text-white uppercase tracking-tighter">KALAM</span>
            <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-pulse shadow-[0_0_10px_rgba(255,107,0,0.8)]" />
          </div>
          
          <div className="hidden md:flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            {[
              { id: 'profile', label: 'Engine' },
              { id: 'results', label: 'Matching' },
              { id: 'chat', label: 'Assistant' },
              { id: 'stress', label: 'Stress Test' },
              { id: 'docs', label: 'Blueprint' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn("hover:text-white transition-colors relative py-2", activeTab === item.id && "text-white")}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="nav-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron" />
                )}
              </button>
            ))}
          </div>

          <button className="md:hidden text-white bg-dark-surface p-2 rounded-full border border-dark-border" onClick={() => setIsMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            className="fixed inset-y-0 right-0 w-80 z-[100] bg-dark-surface flex flex-col p-12 border-l border-dark-border"
          >
             <button onClick={() => setIsMenuOpen(false)} className="self-end text-muted hover:text-white mb-12">
               <X size={24} />
             </button>
             <div className="space-y-8">
               {['profile', 'results', 'chat', 'stress', 'docs'].map(id => (
                 <button 
                   key={id}
                   onClick={() => { setActiveTab(id as any); setIsMenuOpen(false); }}
                   className={cn(
                     "block w-full text-left text-4xl font-display font-black uppercase tracking-tight",
                     activeTab === id ? "text-saffron" : "text-white"
                   )}
                 >
                   {id}
                 </button>
               ))}
             </div>
             <div className="mt-auto font-mono text-[10px] text-muted uppercase tracking-widest text-[#555]">
               Ver 1.0.4 // Project Kalam
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 relative z-10 pt-24 overflow-hidden">
        {/* Editorial Background Text */}
        <motion.div 
          style={{ y: heroGhostY, opacity: heroGhostOpacity }}
          className="hero-bg-text font-black"
        >
          KALAM
        </motion.div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="overflow-hidden mb-4">
            <motion.h1 
              initial={{ y: "150%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-[150px] font-display font-black leading-[0.82] text-white uppercase tracking-tighter"
            >
              Know What <br/> You're <br/> <span className="text-outline">Entitled</span> To
            </motion.h1>
          </div>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-1 bg-saffron mb-10"
          />
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="max-w-2xl text-slate-400 font-sans font-light text-xl md:text-2xl leading-relaxed mb-12"
          >
            Project Kalam uses structural intelligence to analyze India's welfare architectures. Zero guesswork. Just clarity for every citizen.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => {
                document.getElementById('engine-main')?.scrollIntoView({ behavior: 'smooth' });
                setActiveTab('profile');
              }}
              className="px-10 py-5 bg-saffron text-white font-display font-bold uppercase tracking-widest text-sm hover:bg-gold transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)]"
            >
              Analyze Profile
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className="px-10 py-5 bg-transparent border border-dark-border text-white font-display font-bold uppercase tracking-widest text-sm hover:border-white transition-colors"
            >
              Browse Structures
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div id="engine-main" className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Section 1: Form Engine */}
              <section className="bg-dark-surface py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-24">
                  <SectionHeader title="The Engine" subtitle="Configure your profile dossier to search for welfare eligibility structures." />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Age</label>
                          <input 
                            type="number" 
                            value={profile.age} 
                            onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Gender</label>
                          <select 
                            value={profile.gender} 
                            onChange={(e) => handleProfileChange('gender', e.target.value)}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors cursor-pointer appearance-none"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // State</label>
                          <select
                            value={profile.state || ''}
                            onChange={(e) => handleProfileChange('state', e.target.value)}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors cursor-pointer appearance-none"
                          >
                            <option value="">Select State</option>
                            {STATES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Category</label>
                          <select
                            value={profile.caste || ''}
                            onChange={(e) => handleProfileChange('caste', e.target.value)}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors cursor-pointer appearance-none"
                          >
                            <option value="">Select Category</option>
                            <option value="general">General</option>
                            <option value="obc">OBC</option>
                            <option value="sc">SC</option>
                            <option value="st">ST</option>
                            <option value="ews">EWS</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Income (INR)</label>
                          <input 
                            type="number" 
                            value={profile.income} 
                            onChange={(e) => handleProfileChange('income', parseInt(e.target.value))}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Occupation</label>
                          <select 
                            value={profile.occupation} 
                            onChange={(e) => handleProfileChange('occupation', e.target.value)}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors cursor-pointer appearance-none"
                          >
                            <option value="farmer">Farmer</option>
                            <option value="laborer">Laborer</option>
                            <option value="street-vendor">Street Vendor</option>
                            <option value="business-owner">Small Business Owner</option>
                            <option value="student">Student</option>
                            <option value="unemployed">Unemployed</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                           <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Land (Acres)</label>
                           <input 
                             type="number" 
                             step="0.1"
                             value={profile.landOwnership} 
                             onChange={(e) => handleProfileChange('landOwnership', parseFloat(e.target.value))}
                             className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors"
                           />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Housing</label>
                          <select 
                            value={profile.housingStatus} 
                            onChange={(e) => handleProfileChange('housingStatus', e.target.value)}
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors cursor-pointer appearance-none"
                          >
                             <option value="homeless">Homeless</option>
                             <option value="kutcha-house">Kutcha House</option>
                             <option value="pucca-house">Pucca House</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#666]">Field // Family Size</label>
                          <input
                            type="number"
                            min={1}
                            value={profile.familySize ?? ''}
                            onChange={(e) => handleProfileChange('familySize', parseInt(e.target.value))}
                            placeholder="Number of members"
                            className="premium-card w-full border-dark-border p-5 text-white focus:border-saffron outline-none font-sans font-light transition-colors"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted text-[#666]">Field // Region</label>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setLocation(false)}
                              className={cn("flex-1 p-5 border transition-all font-sans text-sm uppercase tracking-widest", profile.isRural ? "border-saffron bg-saffron/10 text-saffron" : "border-dark-border text-muted hover:text-white")}
                            >
                              Rural
                            </button>
                            <button 
                              onClick={() => setLocation(true)}
                              className={cn("flex-1 p-5 border transition-all font-sans text-sm uppercase tracking-widest", profile.isUrban ? "border-saffron bg-saffron/10 text-saffron" : "border-dark-border text-muted hover:text-white")}
                            >
                              Urban
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-10 border border-dark-border bg-dark-bg/50 rounded-lg">
                        <div className="flex items-center gap-4 mb-8">
                          <Zap size={20} className="text-gold" />
                          <h4 className="font-display font-bold uppercase text-white tracking-widest text-lg">Protocol Attributes</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {[
                            { key: 'isBPL', label: 'BPL Card Status' },
                            { key: 'hasBankAccount', label: 'Bank Account activity' },
                            { key: 'isTaxpayer', label: 'Income Tax Record' },
                            { key: 'ownsPuccaHouse', label: 'Pucca Ownership' },
                            { key: 'seccListed', label: 'SECC Listing' },
                            { key: 'hasTwoWheeler', label: 'Owns Two-Wheeler' }
                          ].map(attr => (
                            <label key={attr.key} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={(profile as any)[attr.key]} 
                                onChange={(e) => handleProfileChange(attr.key as any, e.target.checked)}
                                className="peer hidden"
                              />
                              <div className="w-5 h-5 border border-dark-border group-hover:border-saffron/50 peer-checked:bg-saffron peer-checked:border-saffron transition-all flex items-center justify-center text-white">
                                <CheckCircle2 size={12} className="opacity-0 peer-checked:opacity-100" />
                              </div>
                              <span className="font-sans text-xs text-muted group-hover:text-white transition-colors uppercase tracking-tight text-slate-400">{attr.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-center pt-8">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={runAnalysis}
                          className="px-16 py-6 bg-saffron text-white font-display font-black uppercase tracking-[0.2em] text-lg flex items-center gap-4 shadow-[0_0_40px_rgba(255,107,0,0.15)] group"
                        >
                          {isLoadingResults ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" />}
                          Initialize Analysis
                        </motion.button>
                      </div>
                    </div>

                    <div className="lg:col-span-4 space-y-12">
                      <div className="p-10 premium-card relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none -mr-4 -mt-4">
                          <Cpu size={120} />
                        </div>
                        <h3 className="text-3xl font-display font-black uppercase text-white mb-2 leading-tight">Neural <br/> Architecture</h3>
                        <p className="text-sm text-secondary font-sans font-light leading-relaxed mb-10 text-slate-400">
                          The Kalam algorithm evaluates thousands of sub-rules. Use voice mode for an AI-guided intake process.
                        </p>
                        <button 
                          onClick={() => setIsVoiceActive(true)}
                          className="w-full flex items-center justify-center gap-3 py-5 border border-saffron text-saffron font-display font-bold uppercase tracking-widest text-[10px] hover:bg-saffron hover:text-white transition-all shadow-[0_0_30px_rgba(255,107,0,0.1)]"
                        >
                          <Mic size={14} /> Guided Intake Mode
                        </button>
                      </div>

                      <div className="space-y-6 text-[#444]">
                        <h4 className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted mb-4 px-2">Stress Test dossiers</h4>
                        <div className="space-y-4">
                          {adversarialResults.map((ap, i) => (
                            <CaseFileCard key={ap.name} profile={ap} onClick={() => setProfile(ap.profile)} outcome={ap.outcome} index={i} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-saffron/30 to-transparent w-full" />

              {/* Section 2: Ambiguities */}
              <section className="bg-dark-bg py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-24">
                  <SectionHeader title="Structural Gaps" subtitle="Analyze contradictions and overlapping policies in the current Indian welfare stack." />
                  <div className="bg-dark-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px border border-dark-border overflow-hidden">
                    {ambiguityMapMemo.map((entry, i) => (
                      <AmbiguityEntry key={entry.title} entry={entry} />
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section className="py-32 px-6 bg-dark-bg min-h-[800px]">
                {isLoadingResults ? (
                  <div className="max-w-7xl mx-auto h-[700px] flex flex-col items-center justify-center text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="mb-8">
                      <Cpu size={64} className="text-saffron opacity-50" />
                    </motion.div>
                    <h3 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-4 animate-pulse">Processing Protocol</h3>
                    <p className="font-mono text-xs text-muted uppercase tracking-[0.5em]">Evaluating relational database // kalam.v1.2</p>
                  </div>
                ) : !isCalculated ? (
                  <div className="max-w-7xl mx-auto h-[600px] flex flex-col items-center justify-center text-center gap-8">
                    <ShieldCheck size={64} className="text-[#222]" />
                    <h3 className="text-5xl font-display font-black text-white uppercase tracking-tight">No Analysis Run</h3>
                    <p className="font-mono text-xs text-muted uppercase tracking-[0.4em]">Return to Engine // Initialize Profile First</p>
                    <button onClick={() => setActiveTab('profile')} className="px-10 py-5 bg-saffron text-white font-display font-bold uppercase tracking-widest text-sm hover:bg-gold transition-colors">
                      Go to Engine
                    </button>
                  </div>
                ) : (
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-12">
                      <SectionHeader title="Evaluation" subtitle="Matching results sorted by compliance confidence and eligibility status." />
                    </div>

                    <div className="lg:col-span-12 premium-card p-8 mb-8">
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#666] mb-6 flex items-center gap-3">
                        <FileDown size={14} className="text-saffron" /> Master Document Checklist // Priority Order
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {getUnifiedDocumentChecklist(results).map((doc, i) => (
                          <div key={doc} className="flex items-center gap-2 px-4 py-2 bg-dark-bg border border-dark-border">
                            <span className="font-mono text-[9px] text-saffron">{String(i + 1).padStart(2, '0')}</span>
                            <span className="font-mono text-[10px] text-slate-300 uppercase tracking-tight">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Left List */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted mb-8 px-2 flex justify-between text-[#666]">
                        <span>DETECTION LOG</span>
                        <span>{results.length} NODES</span>
                      </div>
                      <div className="relative group">
                        <div className="space-y-3 h-[750px] overflow-y-auto pr-3 custom-scrollbar">
                          {results.map((res, index) => (
                            <motion.button
                              key={res.schemeId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.04 }}
                              onClick={() => { setSelectedSchemeId(res.schemeId); setCritique(null); }}
                              whileHover={{ x: 5 }}
                              className={cn(
                                "premium-card w-full p-6 text-left transition-all flex justify-between items-center group/card",
                                selectedSchemeId === res.schemeId ? "border-saffron ring-1 ring-saffron/20 border-l-4 border-l-saffron" : "hover:border-slate-600"
                              )}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#555]">{WELFARE_SCHEMES.find(s => s.id === res.schemeId)?.category}</span>
                                </div>
                                <h4 className={cn("font-display font-medium text-lg leading-none uppercase transition-colors", selectedSchemeId === res.schemeId ? "text-saffron" : "text-slate-100 group-hover/card:text-white")}>{res.schemeName}</h4>
                              </div>
                              <ConfidenceRing score={res.confidenceScore} size={36} />
                            </motion.button>
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-bg to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                      </div>
                    </div>

                    {/* Right Detail */}
                    <div className="lg:col-span-8">
                      {selectedResult && selectedScheme ? (
                        <motion.div 
                          key={selectedResult.schemeId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="premium-card min-h-[750px] flex flex-col p-0 overflow-hidden"
                        >
                          <div className="p-12 border-b border-dark-border bg-dark-bg/40">
                            <div className="flex flex-wrap justify-between items-start gap-8 mb-10">
                              <div className="space-y-4">
                                <h3 className="text-5xl font-display font-black text-white uppercase tracking-tight leading-none">{selectedScheme.name}</h3>
                                <div className="flex items-center gap-4">
                                   <span className="font-mono text-[10px] uppercase text-gold tracking-widest">{selectedScheme.category} PROTOCOL</span>
                                   <div className="h-px w-8 bg-dark-border" />
                                   <div className={cn(
                                    "px-4 py-1 font-mono text-[10px] uppercase tracking-[0.2em] border flex items-center gap-2",
                                    selectedResult.status === 'eligible' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                                    selectedResult.status === 'uncertain' ? "border-indigo-500/30 text-indigo-500 bg-indigo-500/5" :
                                    selectedResult.status === 'almost-eligible' ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                                    "border-red-500/30 text-red-500 bg-red-500/5"
                                  )}>
                                    {selectedResult.status}
                                  </div>
                                </div>
                              </div>
                              <ConfidenceRing score={selectedResult.confidenceScore} size={72} />
                            </div>
                            <p className="text-slate-300 font-sans font-light text-lg leading-relaxed max-w-3xl">{selectedScheme.description}</p>
                          </div>

                          <div className="flex-1 p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="space-y-12">
                              {/* Terminal Aesthetic Rule Evaluation */}
                              <div className="space-y-6">
                                <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#666] mb-4">Verification Logs</h4>
                                <div className="font-mono text-[11px] p-6 bg-black border border-dark-border rounded-sm space-y-3 shadow-inner custom-scrollbar overflow-y-auto max-h-[300px]">
                                  <div className="text-[#444] mb-4 flex justify-between">
                                    <span>// RULE EVALUATION START</span>
                                    <span>v1.0.4</span>
                                  </div>
                                  {selectedResult.ruleEvaluations.map((re, idx) => (
                                    <motion.div 
                                      initial={{ opacity: 0, x: -5 }} 
                                      animate={{ opacity: 1, x: 0 }} 
                                      transition={{ delay: idx * 0.05 }}
                                      key={re.ruleId} 
                                      className={cn(
                                        "flex gap-3 leading-relaxed",
                                        re.passed === true ? "text-emerald-400" : 
                                        re.passed === 'uncertain' ? "text-indigo-400" : "text-red-400"
                                      )}
                                    >
                                      <span className="shrink-0">{re.passed === true ? '✓' : re.passed === 'uncertain' ? '?' : '✗'}</span>
                                      <span>{re.description}</span>
                                    </motion.div>
                                  ))}
                                  <div className="text-[#444] mt-4">// EOF</div>
                                </div>
                              </div>

                              {selectedResult.gapAnalysis.length > 0 && (
                                <div className="p-8 bg-red-950/10 border border-red-500/20">
                                  <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-500 mb-6 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Critical Gaps
                                  </h4>
                                  <div className="space-y-4">
                                    {selectedResult.gapAnalysis.map((gap, i) => (
                                      <div key={i} className="flex items-start gap-4 text-xs font-sans text-slate-300">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1" />
                                        {gap}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-12">
                              <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#666] mb-6">Filing Documentation</h4>
                                <div className="space-y-3">
                                  {selectedScheme.documents.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-dark-bg border border-dark-border hover:border-indigo-500/50 transition-all group/doc">
                                      <FileText size={16} className="text-[#333] group-hover/doc:text-indigo-400 transition-colors" />
                                      <span className="text-xs font-mono text-slate-400 uppercase tracking-tight">{doc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#666] mb-6">
                                  Application Sequence // Prerequisites
                                </h4>
                                <div className="space-y-3">
                                  {selectedScheme.applicationSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-dark-bg border border-dark-border">
                                      <span className="font-mono text-[10px] text-saffron shrink-0 mt-0.5">
                                        {String(i + 1).padStart(2, '0')}
                                      </span>
                                      <span className="text-xs font-sans text-slate-300 leading-relaxed">{step}</span>
                                    </div>
                                  ))}
                                  {selectedScheme.prerequisites.length > 0 && (
                                    <div className="p-4 border border-amber-500/20 bg-amber-950/10 mt-4">
                                      <p className="font-mono text-[10px] text-amber-500 uppercase tracking-widest mb-2 px-1">
                                        Relational Prerequisites
                                      </p>
                                      {selectedScheme.prerequisites.map(preId => {
                                        const pre = WELFARE_SCHEMES.find(s => s.id === preId);
                                        return (
                                          <p key={preId} className="text-xs font-sans text-slate-400 pl-1">
                                            → Require application for: {pre?.name || preId}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-6">
                                 <button 
                                   onClick={() => getClaudeCritique(selectedResult)}
                                   className="w-full py-5 bg-dark-surface border border-indigo-500/30 text-indigo-400 font-display font-bold uppercase tracking-widest text-[11px] hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3"
                                 >
                                    {isCritiqueLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    Audit Output Review
                                 </button>
                                 
                                 {critique && (
                                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 bg-indigo-950/20 border border-indigo-500/20 text-xs font-sans text-indigo-300 leading-relaxed italic rounded-sm">
                                      "{critique}"
                                   </motion.div>
                                 )}

                                 <a 
                                    href={selectedScheme.officialUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full py-5 bg-saffron text-white font-display font-bold uppercase tracking-widest text-[11px] hover:bg-gold transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,107,0,0.1)]"
                                 >
                                   Launch Official Filing <ExternalLink size={16} />
                                 </a>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="premium-card h-full flex flex-col items-center justify-center text-center p-24 opacity-40">
                          <Database size={80} className="mb-8 text-[#222]" />
                          <h3 className="text-4xl font-display font-black text-white uppercase mb-4 tracking-tight">Inspector</h3>
                          <p className="font-sans text-slate-500 max-w-sm text-lg font-light leading-relaxed underline underline-offset-8 decoration-dark-border">Select a node from the detected structures to initialize full analysis logs.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'stress' && (
            <motion.div 
              key="stress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section className="py-32 px-6 bg-dark-surface min-h-screen">
                <div className="max-w-7xl mx-auto">
                  <SectionHeader title="Failure Log" subtitle="Ten adversarial edge-case profiles with documented engine results." />
                  <div className="space-y-6">
                    {adversarialResults.map((ap, i) => {
                      const engineResults = evaluateProfile(ap.profile);
                      const topResult = engineResults[0];
                      return (
                        <div key={ap.name} className="premium-card p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="font-mono text-[9px] text-[#555] uppercase tracking-widest mb-2">
                                Case #{String(i + 1).padStart(2, '0')}
                              </div>
                              <h3 className="font-display text-2xl font-black text-white uppercase">{ap.name}</h3>
                            </div>
                            <div className={cn(
                              "px-3 py-1 font-mono text-[10px] uppercase tracking-widest border",
                              ap.outcome === 'eligible' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                              ap.outcome === 'almost-eligible' ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                              "border-red-500/30 text-red-500 bg-red-500/5"
                            )}>{ap.outcome}</div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                              <p className="font-mono text-[9px] text-[#555] uppercase tracking-widest mb-3">Expected Outcome / Issue</p>
                              <p className="text-sm font-sans text-amber-300 italic leading-relaxed">{ap.expectedIssue}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] text-[#555] uppercase tracking-widest mb-3">Engine Output // Top Match</p>
                              <div className="font-mono text-[11px] p-4 bg-black border border-dark-border space-y-2">
                                <div className="text-slate-300">{topResult?.schemeName}</div>
                                <div className="text-[#555]">Status: <span className={cn(
                                  topResult?.status === 'eligible' ? 'text-emerald-400' : 
                                  topResult?.status === 'ineligible' ? 'text-red-400' : 'text-amber-400'
                                )}>{topResult?.status}</span></div>
                                <div className="text-[#555]">Confidence: <span className="text-white">{topResult?.confidenceScore}%</span></div>
                                {topResult?.gapAnalysis.slice(0, 2).map((g, gi) => (
                                  <div key={gi} className="text-red-400 text-[10px]">✗ {g}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
            >
              <section className="py-32 px-6 bg-dark-bg">
                <div className="max-w-4xl mx-auto h-[750px] premium-card flex flex-col p-0">
                  <div className="p-10 border-b border-dark-border flex items-center justify-between bg-dark-bg/20">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-saffron rounded-sm flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,107,0,0.3)]">
                        <Cpu size={28} />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">KALAM ENGINE</h3>
                        <p className="text-[10px] font-mono text-muted uppercase tracking-[0.4em] text-[#666]">Neural Support Socket // v1.2</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest leading-none">Status: Primary</span>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center px-16 space-y-8">
                        <MessageSquare size={48} className="text-[#151515] mb-4" />
                        <p className="text-slate-400 font-sans font-light text-xl leading-relaxed">
                          Greetings. I am the neural interface for Project Kalam. Query me on relocation policies, land tenure, or BPL verification architectures.
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] p-8 text-sm leading-relaxed",
                          msg.role === 'user' ? "bg-saffron text-white rounded-l-2xl rounded-tr-sm" : "bg-dark-surface border border-dark-border text-slate-100 rounded-r-2xl rounded-tl-sm font-light text-base"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-dark-surface border border-dark-border p-6 rounded-r-2xl rounded-tl-sm">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex gap-2">
                              <div className="w-2 h-2 bg-saffron rounded-full" />
                              <div className="w-2 h-2 bg-saffron rounded-full" />
                              <div className="w-2 h-2 bg-saffron rounded-full" />
                            </motion.div>
                          </div>
                        </div>
                      )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleChatSubmit} className="p-10 border-t border-dark-border bg-dark-bg/40">
                    <div className="relative group">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="INPUT QUERY OR PARAMETER..."
                        className="w-full bg-black border border-dark-border p-6 pr-16 text-white font-mono text-xs focus:border-saffron outline-none transition-all tracking-[0.2em] group-hover:bg-dark-surface"
                      />
                      <button 
                        type="submit"
                        disabled={isChatLoading}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-saffron hover:text-gold transition-colors"
                      >
                        <ArrowRight size={24} />
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div 
              key="docs"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
            >
              <section className="py-32 px-6 bg-dark-bg">
                <div className="max-w-4xl mx-auto premium-card p-16">
                  <SectionHeader title="Blueprint" subtitle="Technical overview and architectural integrity report for Project Kalam Engine." />
                  <div className="prose prose-invert prose-saffron max-w-none font-sans font-light leading-relaxed text-slate-300">
                    <ReactMarkdown>{architectureContent}</ReactMarkdown>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="py-32 border-t border-dark-border relative z-10 bg-dark-bg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="font-display text-4xl font-black text-white uppercase tracking-tighter">KALAM</span>
              <span className="w-2 h-2 bg-saffron rounded-full" />
            </div>
            <p className="text-secondary font-sans font-light text-lg max-w-sm leading-relaxed text-slate-500">
              Empowering Indian citizens through structural intelligence. Built with dignity-first UI for measurable social impact.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-24 gap-y-12">
             <div className="space-y-4">
               <h5 className="font-mono text-[10px] uppercase tracking-[0.4em] text-white">Schemes</h5>
               <ul className="space-y-2 font-mono text-[9px] uppercase tracking-widest text-[#555]">
                 <li>{WELFARE_SCHEMES.length} Welfare Schemes Indexed</li>
                 <li>{AMBIGUITY_MAP.length} Ambiguities Mapped</li>
                 <li>10 Adversarial Profiles</li>
               </ul>
             </div>
             <div className="space-y-4">
               <h5 className="font-mono text-[10px] uppercase tracking-[0.4em] text-white">Stack</h5>
               <ul className="space-y-2 font-mono text-[9px] uppercase tracking-widest text-[#555]">
                 <li>React + TypeScript</li>
                 <li>Gemini 2.0 Flash</li>
                 <li>Deterministic Rule Engine</li>
               </ul>
             </div>
          </div>
        </div>
      </footer>

      {/* Voice Assistant Overlay */}
      <AnimatePresence>
        {isVoiceActive && (
          <VoiceAssistant 
            profile={profile}
            setProfile={setProfile}
            lang={voiceLang}
            setLang={setVoiceLang}
            onComplete={() => setIsVoiceActive(false)}
            onClose={() => setIsVoiceActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
