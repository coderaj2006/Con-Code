import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  FileText, 
  MapPin,
  ArrowLeft
} from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  status: 'active' | 'updating' | 'new';
  year: string;
  pros: string[];
  cons: string[];
  steps: string[];
  documents: string[];
  locations: string[];
  eligibility: {
    question: string;
    options: string[];
    correct: boolean[];
  }[];
}

const SCHEMES_DATA: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    tagline: 'Income Support for Farmers',
    year: '2026 Updated',
    status: 'active',
    summary: 'Provides ₹6000 directly to your bank account every year. The latest 22nd installment was successfully disbursed on March 13, 2026, benefiting over 9.32 crore farmers like you.',
    pros: ['Guaranteed cash transfer to bank account', 'No middlemen or commission involved', 'Direct benefit for landholding families'],
    cons: ['Mandatory e-KYC can be tricky for some', 'Land record mismatch leads to rejection', 'Limited to land-owning farmers only'],
    steps: [
      'Check if your Aadhaar is linked to your Bank Account',
      'Ensure your Land Records (RoR) are updated in your name',
      'Apply online or visit the nearest CSC',
      'Complete e-KYC via PM-KISAN portal or Face Authentication app'
    ],
    documents: ['Aadhaar Card', 'Updated Land Records (RoR)', 'Bank Passbook'],
    locations: ['CSC (Common Service Centre)', 'Bank', 'Krishi Bhavan'],
    eligibility: [
      {
        question: 'Do you own cultivable land in your name?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Are you or any family member a government employee?',
        options: ['Yes', 'No'],
        correct: [false, true]
      },
      {
        question: 'Is your Aadhaar linked to your bank account?',
        options: ['Yes', 'No'],
        correct: [true, false]
      }
    ]
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM',
    tagline: 'Solar Power for Agriculture',
    year: '2026 Extension',
    status: 'updating',
    summary: 'Helps you install solar water pumps on your farm with a big government subsidy. You can save on diesel/electricity and even sell extra solar power back to the grid.',
    pros: ['Significant reduction in irrigation costs', 'Reliable daytime power for farming', 'Earn income by selling surplus power'],
    cons: ['High initial cost (even after subsidy)', 'Limited slots per state each year', 'Technical maintenance of solar panels'],
    steps: [
      'Submit an application to your State Renewable Energy Agency',
      'Wait for project approval and slot allocation',
      'Contribute your share (10-40%) after approval',
      'Installation by authorized vendors'
    ],
    documents: ['Land ownership document', 'Aadhaar Card', 'Bank details', 'Passport photo'],
    locations: ['State DISCOM Office', 'Renewable Energy Agency (e.g., MEDA, HAREDA)', 'CSC'],
    eligibility: [
      {
        question: 'Do you have a firm land title?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Does your farm lack a grid connection or use diesel?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Can you pay 10-40% of the cost upfront?',
        options: ['Yes', 'No'],
        correct: [true, false]
      }
    ]
  },
  {
    id: 'pmfby',
    name: 'PMFBY',
    tagline: 'Smart Crop Insurance',
    year: '2026 Tech-Update',
    status: 'active',
    summary: 'Protects you against loss from natural disasters like floods, droughts, or pests. You pay a very small premium, and the government covers the rest to ensure you don\'t lose everything if crops fail.',
    pros: ['Very low premium (1.5% to 5%)', 'Coverage for various natural calamities', '12% interest payment to farmer for late claims (2026 update)'],
    cons: ['Complex claim verification process', 'Payouts often based on "area-wide" loss', 'Strict deadlines for registration'],
    steps: [
      'Register before the sowing season deadline',
      'Submit sowing certificate and land records',
      'In case of damage, report within 72 hours via the portal',
      'Track claim via Krishi Rakshak Portal'
    ],
    documents: ['Sowing Certificate', 'Land Records', 'Bank Passbook', 'Aadhaar Card'],
    locations: ['Bank', 'Insurance Company Office', 'Krishi Rakshak Portal'],
    eligibility: [
      {
        question: 'Will you sow the crop in the current season?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Is your crop on the list of insured crops for your area?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Are you a loanee or non-loanee farmer?',
        options: ['Loanee', 'Non-Loanee'],
        correct: [true, true] // Both are eligible
      }
    ]
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card',
    tagline: 'Flexible Low-Interest Credit',
    year: '2026 RBI Revamp',
    status: 'new',
    summary: 'A flexible credit card for farmers that gives you low-interest loans for seeds, fertilizers, and daily needs. If you pay back on time, the interest is as low as 4%, and you now get up to ₹5 lakh without collateral.',
    pros: ['Very low interest rate (4% with timely repay)', 'No collateral needed up to ₹5 Lakh (2026 limit)', 'Covers cultivation costs and household needs'],
    cons: ['Risk of debt cycle if crops fail', 'Bank visits required for annual renewal', 'Strict land verification criteria'],
    steps: [
      'Visit any public or private sector bank',
      'Fill out the KCC application form',
      'Submit land and ID proof for verification',
      'Receive KCC card and credit limit'
    ],
    documents: ['Aadhaar Card', 'Land holding documents', 'Passport size photo'],
    locations: ['Any Commercial Bank', 'Cooperative Bank', 'RRB (Regional Rural Bank)'],
    eligibility: [
      {
        question: 'Are you an active tiller or landowner?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Is your land record updated in your name?',
        options: ['Yes', 'No'],
        correct: [true, false]
      },
      {
        question: 'Do you have a clean repayment history?',
        options: ['Yes', 'No', 'First time loan'],
        correct: [true, false, true]
      }
    ]
  }
];

interface SchemeMitraProps {
  isSunlightMode?: boolean;
}

export const SchemeMitra: React.FC<SchemeMitraProps> = ({ isSunlightMode }) => {
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [eligibilityStep, setEligibilityStep] = useState<number>(-1);
  const [eligibilityAnswers, setEligibilityAnswers] = useState<number[]>([]);

  const handleStartEligibility = () => {
    setEligibilityStep(0);
    setEligibilityAnswers([]);
  };

  const handleAnswer = (index: number) => {
    const nextAnswers = [...eligibilityAnswers, index];
    setEligibilityAnswers(nextAnswers);
    if (selectedScheme && eligibilityStep < selectedScheme.eligibility.length - 1) {
      setEligibilityStep(eligibilityStep + 1);
    } else {
      setEligibilityStep(999); // Completed
    }
  };

  const isEligible = () => {
    if (!selectedScheme) return false;
    return eligibilityAnswers.every((ans, idx) => selectedScheme.eligibility[idx].correct[ans]);
  };

  return (
    <div className={`space-y-6 ${isSunlightMode ? 'text-white' : 'text-zinc-300'}`}>
      <header className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isSunlightMode ? 'bg-black border border-neon-agri' : 'bg-emerald-500/10 text-emerald-500'}`}>
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-xl font-black italic tracking-tight ${isSunlightMode ? 'text-white' : 'text-zinc-50'}`}>SCHEME MITRA</h2>
          <p className="text-xs text-zinc-500 font-medium">Your Policy Expert for Indian Agriculture</p>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!selectedScheme ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-4"
          >
            {SCHEMES_DATA.map((scheme) => (
              <motion.button
                key={scheme.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedScheme(scheme)}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                  isSunlightMode 
                    ? 'bg-black border-white' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    scheme.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                    scheme.status === 'updating' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {scheme.status}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500">{scheme.year}</span>
                </div>
                <h3 className={`text-lg font-black italic mb-1 ${isSunlightMode ? 'text-white' : 'text-zinc-50'}`}>
                  {scheme.name}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mb-4">{scheme.tagline}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  Detailed Analysis <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-16 -translate-y-16" />
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-24"
          >
            <button 
              onClick={() => {
                setSelectedScheme(null);
                setEligibilityStep(-1);
              }}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Schemes
            </button>

            {/* HIGH-CONTRAST DISCLAIMER */}
            <div className={`p-4 rounded-2xl border-2 animate-pulse ${
              isSunlightMode 
                ? 'bg-red-600 border-white text-white' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Action Required</span>
              </div>
              <p className="text-xs font-bold italic leading-tight">
                VERIFY LOCALLY: Rules may vary by state. Contact your Gram Panchayat or nearest CSC for latest local mandates.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className={`text-3xl font-black italic tracking-tighter ${isSunlightMode ? 'text-white' : 'text-zinc-50'}`}>
                {selectedScheme.name}
              </h2>
              <p className="text-sm font-medium text-zinc-500">{selectedScheme.tagline}</p>
            </div>

            {/* SECTION: SUMMARY */}
            <div className={`p-6 rounded-3xl border ${isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-800'}`}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Simplified Summary</h4>
              <p className={`text-sm leading-relaxed font-bold ${isSunlightMode ? 'text-white' : 'text-zinc-100'}`}>
                {selectedScheme.summary}
              </p>
            </div>

            {/* SECTION: PROS & CONS */}
            <div className="grid grid-cols-1 gap-4">
              <div className={`p-6 rounded-3xl border min-h-[160px] ${isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Benefits
                </h4>
                <ul className="space-y-3">
                  {selectedScheme.pros.map((pro, i) => (
                    <li key={i} className="flex gap-2 text-xs font-bold">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`p-6 rounded-3xl border min-h-[160px] ${isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Hurdles
                </h4>
                <ul className="space-y-3">
                  {selectedScheme.cons.map((con, i) => (
                    <li key={i} className="flex gap-2 text-xs font-bold text-zinc-400">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SECTION: ELIGIBILITY CHECKER */}
            <div className={`p-6 rounded-3xl border ${
              isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">Eligibility Check</h4>
              
              {eligibilityStep === -1 ? (
                <div className="text-center py-4">
                  <ShieldCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-xs text-zinc-500 font-bold mb-6">Answer 3 simple questions to see if you qualify.</p>
                  <button 
                    onClick={handleStartEligibility}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      isSunlightMode ? 'bg-white text-black' : 'bg-emerald-500 text-black hover:bg-emerald-400'
                    }`}
                  >
                    Start Check
                  </button>
                </div>
              ) : eligibilityStep === 999 ? (
                <div className="text-center py-4">
                  {isEligible() ? (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h5 className="text-xl font-black italic mb-2">Likely Eligible!</h5>
                      <p className="text-xs text-zinc-500 font-bold mb-6">You seem to meet the primary criteria. Follow the steps below to apply.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h5 className="text-xl font-black italic mb-2">Not Eligible</h5>
                      <p className="text-xs text-zinc-500 font-bold mb-6">Based on your answers, you may not qualify for this specific scheme.</p>
                    </>
                  )}
                  <button 
                    onClick={handleStartEligibility}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 underline"
                  >
                    Check Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Question {eligibilityStep + 1} of 3</span>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className={`h-1 w-4 rounded-full ${i <= eligibilityStep ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                  </div>
                  <h5 className="text-sm font-black italic">{selectedScheme.eligibility[eligibilityStep].question}</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedScheme.eligibility[eligibilityStep].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`p-4 rounded-xl text-left text-xs font-bold border transition-all ${
                          isSunlightMode ? 'hover:bg-white hover:text-black border-zinc-800' : 'bg-zinc-800/50 border-zinc-700 hover:border-emerald-500'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: HOW TO AVAIL */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 pl-2">How to Avail</h4>
              
              <div className={`p-6 rounded-3xl border ${isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                  <FileText className="w-3 h-3" /> Required Documents
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.documents.map((doc, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                      isSunlightMode ? 'border-white bg-black' : 'border-zinc-800 bg-zinc-900'
                    }`}>
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                  <MapPin className="w-3 h-3" /> Nearest Physical Location
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedScheme.locations.map((loc, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">Step-by-Step Guide</span>
                {selectedScheme.steps.map((step, i) => (
                  <div key={i} className={`flex gap-4 p-4 rounded-2xl border ${
                    isSunlightMode ? 'bg-black border-white' : 'bg-zinc-900/40 border-zinc-800'
                  }`}>
                    <span className="text-lg font-black italic text-emerald-500/50">{i + 1}</span>
                    <p className="text-xs font-bold leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              Source: Ministry of Agriculture & Farmers Welfare (PIB Update 2026)
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
