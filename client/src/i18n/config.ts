import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        title: "SatyaCheck",
        tagline: "Understand the news. Question the claim. Check the evidence.",
        textMode: "Fake News Detection Mode",
        videoMode: "Deepfake Forensics Mode",
        liveAnalysis: "LIVE ANALYSIS",
        analyze: "Analyze News",
        deepfake: "Deepfake Forensics",
        howItWorks: "How It Works",
        about: "About",
        metrics: "Model Metrics",
        recentChecks: "Recent Checks"
      },
      hero: {
        badge: "AI-Powered Multilingual News & Deepfake Verification",
        headline: "Understand the News. Question the Claim. Check the Evidence.",
        subtitle: "Analyze news headlines, full articles, or URLs across English, Hindi, and Hinglish using machine learning classifiers cross-referenced with 40+ verified news portals.",
        ctaAnalyze: "Analyze News",
        ctaDeepfake: "Explore Deepfake Forensics",
        activeEngine: "ML Inference Engine Active",
        statAccuracy: "93.4% Baseline Accuracy",
        statPortals: "40+ Portals Cross-Referenced",
        statLanguages: "Multilingual: EN, HI, Hinglish"
      },
      input: {
        headlineTab: "Headline / Article Text",
        urlTab: "News Article URL",
        placeholder: "Paste a news headline, complete article paragraph, or social media claim to verify...",
        urlPlaceholder: "https://example.com/news/article-headline",
        button: "Run Forensic Check",
        analyzing: "Analyzing text & cross-referencing portals...",
        quickSamples: "Quick Test Claims:",
        clear: "Clear Input",
        charCount: "characters",
        validation: {
          empty: "Please enter a news headline, text, or valid URL",
          invalid: "Input must contain at least 10 characters for meaningful analysis"
        }
      },
      result: {
        real: "Verified Authentic News",
        fake: "Likely Fake / Misinformation",
        suspicious: "Suspicious / Unverified Content",
        authenticityScore: "Authenticity Score",
        confidence: "Model Confidence",
        detectedLang: "Detected Language",
        reasoningHeading: "AI Diagnostic Analysis",
        portalHeading: "Live News Portal Cross-Check",
        disclaimerTitle: "Academic & Forensic Advisory",
        disclaimerText: "Predictions are generated via TF-IDF statistical classification combined with real-time news search verification. They provide algorithmic assessments and should be evaluated alongside independent fact-checking.",
        credibilityBoost: "Authenticity boosted due to verified portal coverage",
        noPortals: "No matching reports found on trusted national or international news portals",
        sourcesFound: "reputable news portals reported this claim"
      },
      deepfake: {
        title: "Deepfake Video Forensic Inspector",
        subtitle: "Spatial-temporal neural analysis of facial landmarks and synthetic artifacts",
        inputLabel: "INPUT: VIDEO_102842.mp4",
        alertDetected: "DEEPFAKE DETECTED",
        alertScore: "87% FAKE",
        overlayTitle: "AI ANALYSIS OVERLAY",
        detectionResults: "DETECTION RESULTS",
        badgeFake: "FAKE",
        badgeAuthentic: "AUTHENTIC",
        lipSync: "Lip-Sync Inconsistency",
        lipSyncDetail: "91% mismatch",
        boundary: "Facial Boundary Artifacts",
        boundaryDetail: "Detected",
        blink: "Unnatural Blink Pattern",
        blinkDetail: "0.2 Hz (anomalous)",
        texture: "Texture/Noise Inconsistency",
        textureDetail: "84%",
        landmarkTitle: "FACIAL LANDMARK ANALYSIS",
        landmarksTracked: "Landmarks tracked: 68 points",
        stabilityScore: "Stability Score: 22% — Unstable",
        modelInfoTitle: "MODEL INFO",
        modelInfo: "Model: Detector v3.2 • Run time: 1.24s • Device: GPU RTX",
        analysisLogTitle: "ANALYSIS LOG",
        log1: "[00:41] Frame 1021: facial warp detected → suspicion +12%",
        log2: "[00:40] Audio/Video desync: +120ms",
        log3: "[00:39] Pixel-level artifact cluster detected",
        statusComplete: "Status: Analysis complete • Findings exported to report.pdf",
        exportReport: "Export Report",
        flagNews: "Flag as Fake News",
        tabOverview: "OVERVIEW",
        tabForensic: "FORENSIC DETAILS",
        tabFrame: "FRAME ANALYSIS",
        deepfakeScore: "DEEPFAKE SCORE",
        authenticity: "AUTHENTICITY",
        confidence: "CONFIDENCE"
      },
      sidebar: {
        title: "Recent Checks",
        empty: "No recent enquiries yet. Submitted queries will appear here.",
        clearAll: "Clear History",
        deleteQuery: "Delete"
      },
      language: {
        switch: "Language",
        english: "English",
        hindi: "हिंदी (Hindi)",
        hinglish: "Hinglish",
        bangla: "বাংলা (Bangla)"
      },
      auth: {
        login: "Log In",
        signup: "Sign Up",
        logout: "Log Out",
        dashboard: "Dashboard",
        history: "History",
        account: "Account Settings",
        welcome: "Welcome"
      }
    }
  },
  hi: {
    translation: {
      nav: {
        title: "सत्यचेक (SatyaCheck)",
        tagline: "समाचार को समझें। दावे पर सवाल करें। साक्ष्य की जांच करें।",
        textMode: "फेक न्यूज़ डिटेक्शन मोड",
        videoMode: "डीपफेक फोरेंसिक्स मोड",
        liveAnalysis: "लाइव विश्लेषण",
        analyze: "समाचार का विश्लेषण",
        deepfake: "डीपफेक फोरेंसिक्स",
        howItWorks: "यह कैसे काम करता है",
        about: "परियोजना के बारे में",
        metrics: "मॉडल मेट्रिक्स",
        recentChecks: "हालिया जांचें"
      },
      hero: {
        badge: "एआई-संचालित बहुभाषी समाचार एवं डीपफेक सत्यापन प्रणाली",
        headline: "समाचार को समझें। दावे पर सवाल करें। साक्ष्य की जांच करें।",
        subtitle: "अंग्रेजी, हिंदी और हिंग्लिश में समाचार शीर्षकों, पूर्ण लेखों या लिंक का मशीन लर्निंग और 40+ विश्वसनीय समाचार पोर्टलों के जरिए त्वरित सत्यापन करें।",
        ctaAnalyze: "समाचार का विश्लेषण करें",
        ctaDeepfake: "डीपफेक फोरेंसिक्स देखें",
        activeEngine: "एमएल इन्फरेंस इंजन सक्रिय",
        statAccuracy: "93.4% आधारभूत सटीकता",
        statPortals: "40+ पोर्टलों से क्रॉस-चेक",
        statLanguages: "बहुभाषी: अंग्रेजी, हिंदी, हिंग्लिश"
      },
      input: {
        headlineTab: "शीर्षक / लेख सामग्री",
        urlTab: "समाचार लेख URL",
        placeholder: "सत्यापन के लिए समाचार का शीर्षक, पूरा पैराग्राफ या सोशल मीडिया दावा यहां पेस्ट करें...",
        urlPlaceholder: "https://example.com/hindi/news-article",
        button: "फोरेंसिक जांच चलाएं",
        analyzing: "विश्लेषण जारी है और पोर्टलों से पुष्टि की जा रही है...",
        quickSamples: "परीक्षण हेतु उदाहरण:",
        clear: "साफ करें",
        charCount: "अक्षर",
        validation: {
          empty: "कृपया समाचार शीर्षक, लेख या वैध URL दर्ज करें",
          invalid: "सार्थक विश्लेषण के लिए इनपुट कम से कम 10 अक्षरों का होना चाहिए"
        }
      },
      result: {
        real: "प्रमाणित सत्य समाचार",
        fake: "संभावित फर्जी / भ्रामक समाचार",
        suspicious: "संदिग्ध / असत्यापित सामग्री",
        authenticityScore: "सत्यता स्कोर (Authenticity)",
        confidence: "मॉडल विश्वसनीयता (Confidence)",
        detectedLang: "पहचानी गई भाषा",
        reasoningHeading: "एआई नैदानिक विश्लेषण",
        portalHeading: "विश्वसनीय समाचार पोर्टल क्रॉस-चेक",
        disclaimerTitle: "शैक्षणिक एवं फोरेंसिक अस्वीकरण",
        disclaimerText: "यह भविष्यवाणी टीएफ-आईडीएफ सांख्यिकीय वर्गीकरण और लाइव समाचार पोर्टल खोज पर आधारित है। यह एक एल्गोरिदम आधारित मूल्यांकन है, जिसे स्वतंत्र पत्रकारों द्वारा भी परखा जाना चाहिए।",
        credibilityBoost: "विश्वसनीय समाचार पोर्टलों में पुष्टि मिलने पर सत्यता स्कोर बढ़ाया गया",
        noPortals: "शीर्ष राष्ट्रीय या अंतर्राष्ट्रीय समाचार पोर्टलों पर इस दावे की कोई पुष्टि नहीं मिली",
        sourcesFound: "विश्वसनीय समाचार पोर्टलों ने इस खबर की पुष्टि की"
      },
      deepfake: {
        title: "डीपफेक वीडियो फोरेंसिक विश्लेषक",
        subtitle: "चेहरे के लैंडमार्क और सिंथेटिक कलाकृतियों का न्यूरल विश्लेषण",
        inputLabel: "इनपुट: VIDEO_102842.mp4",
        alertDetected: "डीपफेक का पता चला",
        alertScore: "87% फर्जी (FAKE)",
        overlayTitle: "एआई विश्लेषण ओवरले",
        detectionResults: "पहचान परिणाम",
        badgeFake: "फर्जी (FAKE)",
        badgeAuthentic: "सत्य (REAL)",
        lipSync: "लिप-सिंक बेमेल (Lip-Sync Inconsistency)",
        lipSyncDetail: "91% बेमेल",
        boundary: "चेहरे की सीमा पर खराबी (Artifacts)",
        boundaryDetail: "पहचाना गया",
        blink: "असामान्य पलक झपकाना (Unnatural Blink)",
        blinkDetail: "0.2 Hz (असामान्य)",
        texture: "टेक्सचर/शोर विसंगति",
        textureDetail: "84%",
        landmarkTitle: "फेसियल लैंडमार्क विश्लेषण",
        landmarksTracked: "ट्रैक किए गए बिंदु: 68 लैंडमार्क",
        stabilityScore: "स्थिरता स्कोर: 22% — अस्थिर",
        modelInfoTitle: "मॉडल जानकारी",
        modelInfo: "मॉडल: डिटेक्टर v3.2 • रन टाइम: 1.24s • डिवाइस: GPU RTX",
        analysisLogTitle: "विश्लेषण लॉग (Telemetery Log)",
        log1: "[00:41] फ्रेम 1021: चेहरे में विरूपण देखा गया → संदेह +12%",
        log2: "[00:40] ऑडियो/वीडियो मिसमैच: +120ms",
        log3: "[00:39] पिक्सल स्तर पर विसंगतियां पाई गईं",
        statusComplete: "स्थिति: विश्लेषण पूरा हुआ • रिपोर्ट तैयार है",
        exportReport: "रिपोर्ट डाउनलोड करें",
        flagNews: "फेक न्यूज़ के रूप में चिह्नित करें",
        tabOverview: "अवलोकन",
        tabForensic: "फोरेंसिक विवरण",
        tabFrame: "फ्रेम विश्लेषण",
        deepfakeScore: "डीपफेक स्कोर",
        authenticity: "सत्यता",
        confidence: "विश्वास स्तर"
      },
      sidebar: {
        title: "हालिया जांचें",
        empty: "अभी तक कोई हालिया जांच नहीं है।",
        clearAll: "इतिहास मिटाएं",
        deleteQuery: "हटाएं"
      },
      language: {
        switch: "भाषा चुनें",
        english: "English",
        hindi: "हिंदी (Hindi)",
        hinglish: "Hinglish",
        bangla: "বাংলা (Bangla)"
      },
      auth: {
        login: "Log In",
        signup: "Sign Up",
        logout: "Log Out",
        dashboard: "Dashboard",
        history: "History",
        account: "Account Settings",
        welcome: "Welcome"
      }
    }
  },
  'hi-en': {
    translation: {
      nav: {
        title: "SatyaCheck",
        tagline: "News ko samjhein. Claim par sawaal karein. Evidence check karein.",
        textMode: "Fake News Detection Mode",
        videoMode: "Deepfake Forensics Mode",
        liveAnalysis: "LIVE ANALYSIS",
        analyze: "News Analyze Karo",
        deepfake: "Deepfake Lab",
        howItWorks: "Kaise Kaam Karta Hai",
        about: "Project Ke Baare Mein",
        metrics: "Model Metrics",
        recentChecks: "Recent Checks"
      },
      hero: {
        badge: "AI-Powered Multilingual News & Deepfake Verifier",
        headline: "News ko Samjhein. Claim par Sawaal Karein. Evidence Check Karein.",
        subtitle: "English, Hindi aur Hinglish headlines, full articles ya links ko real-time ML classifiers aur 40+ verified news portals ke through verify karein.",
        ctaAnalyze: "News Analyze Karo",
        ctaDeepfake: "Deepfake Forensics Dekhein",
        activeEngine: "ML Inference Engine Active",
        statAccuracy: "93.4% Baseline Accuracy",
        statPortals: "40+ Portals se Cross-Check",
        statLanguages: "Multilingual: EN, Hindi, Hinglish"
      },
      input: {
        headlineTab: "Headline / Article Text",
        urlTab: "News Article URL",
        placeholder: "Verification ke liye news headline, complete paragraph ya WhatsApp forward claim yahan paste karein...",
        urlPlaceholder: "https://example.com/news/article-link",
        button: "Forensic Check Run Karo",
        analyzing: "News analyze ho rahi hai aur portals se verify ho rahi hai...",
        quickSamples: "Quick Test Examples:",
        clear: "Clear Karo",
        charCount: "characters",
        validation: {
          empty: "Please koi headline, text ya valid URL enter karein",
          invalid: "Analysis ke liye input kam se kam 10 characters ka hona chahiye"
        }
      },
      result: {
        real: "Verified Authentic News Hai",
        fake: "Yeh News Fake / Misleading Lag Rahi Hai",
        suspicious: "Suspicious / Unverified Content",
        authenticityScore: "Authenticity Score",
        confidence: "Model Confidence",
        detectedLang: "Detected Language",
        reasoningHeading: "AI Diagnostic Analysis",
        portalHeading: "Live News Portal Cross-Check",
        disclaimerTitle: "Academic & Forensic Notice",
        disclaimerText: "Yeh prediction TF-IDF statistical classification aur live news search par based hai. Isko final decision lene se pehle verified news channels par bhi check karein.",
        credibilityBoost: "Reputable portals par coverage milne se score boost hua",
        noPortals: "Trusted news portals par is claim ka koi match nahi mila",
        sourcesFound: "reputable news portals ne is claim ko report kiya hai"
      },
      deepfake: {
        title: "Deepfake Video Forensic Inspector",
        subtitle: "Facial landmarks aur synthetic artifacts ka spatial-temporal neural analysis",
        inputLabel: "INPUT: VIDEO_102842.mp4",
        alertDetected: "DEEPFAKE DETECTED",
        alertScore: "87% FAKE",
        overlayTitle: "AI ANALYSIS OVERLAY",
        detectionResults: "DETECTION RESULTS",
        badgeFake: "FAKE",
        badgeAuthentic: "REAL",
        lipSync: "Lip-Sync Inconsistency",
        lipSyncDetail: "91% mismatch",
        boundary: "Facial Boundary Artifacts",
        boundaryDetail: "Detected",
        blink: "Unnatural Blink Pattern",
        blinkDetail: "0.2 Hz (anomalous)",
        texture: "Texture/Noise Inconsistency",
        textureDetail: "84%",
        landmarkTitle: "FACIAL LANDMARK ANALYSIS",
        landmarksTracked: "Landmarks tracked: 68 points",
        stabilityScore: "Stability Score: 22% — Unstable",
        modelInfoTitle: "MODEL INFO",
        modelInfo: "Model: Detector v3.2 • Run time: 1.24s • Device: GPU RTX",
        analysisLogTitle: "ANALYSIS LOG",
        log1: "[00:41] Frame 1021: facial warp detected → suspicion +12%",
        log2: "[00:40] Audio/Video desync: +120ms",
        log3: "[00:39] Pixel-level artifact cluster detected",
        statusComplete: "Status: Analysis complete • Report ready hai",
        exportReport: "Export Report",
        flagNews: "Flag as Fake News",
        tabOverview: "OVERVIEW",
        tabForensic: "FORENSIC DETAILS",
        tabFrame: "FRAME ANALYSIS",
        deepfakeScore: "DEEPFAKE SCORE",
        authenticity: "AUTHENTICITY",
        confidence: "CONFIDENCE"
      },
      sidebar: {
        title: "Recent Checks",
        empty: "Abhi tak koi recent enquiry nahi hai.",
        clearAll: "History Clear Karo",
        deleteQuery: "Delete"
      },
      language: {
        switch: "Language Chunein",
        english: "English",
        hindi: "हिंदी (Hindi)",
        hinglish: "Hinglish",
        bangla: "বাংলা (Bangla)"
      },
      auth: {
        login: "Log In",
        signup: "Sign Up",
        logout: "Log Out",
        dashboard: "Dashboard",
        history: "History",
        account: "Account Settings",
        welcome: "Welcome"
      }
    }
  },
  bn: {
    translation: {
      nav: {
        title: "সত্যচেক (SatyaCheck)",
        tagline: "সংবাদটি বুঝুন। দাবিটি প্রশ্ন করুন। প্রমাণটি যাচাই করুন।",
        textMode: "ভুয়া সংবাদ সনাক্তকরণ মোড",
        videoMode: "ডিপফেক ফরেনসিক মোড",
        liveAnalysis: "লাইভ বিশ্লেষণ",
        analyze: "সংবাদ বিশ্লেষণ",
        deepfake: "ডিপফেক ল্যাব",
        howItWorks: "কার্যপদ্ধতি",
        about: "পরিচিতি",
        metrics: "মডেল মেট্রিক্স",
        recentChecks: "সাম্প্রতিক অনুসন্ধান"
      },
      hero: {
        badge: "এআই-চালিত বহুভাষিক সংবাদ ও ডিপফেক যাচাইকরণ ব্যবস্থা",
        headline: "সংবাদটি বুঝুন। দাবিটি প্রশ্ন করুন। প্রমাণটি যাচাই করুন।",
        subtitle: "ইংরেজি, বাংলা এবং হিন্দিতে শিরোনাম বা খবরের সত্যতা দ্রুত যাচাই করুন।",
        ctaAnalyze: "সংবাদ বিশ্লেষণ করুন",
        ctaDeepfake: "ডিপফেক ফরেনসিক দেখুন",
        activeEngine: "মেশিন লার্নিং সক্রিয়",
        statAccuracy: "৯৩.৪% নির্ভুলতা",
        statPortals: "৪০+ সংবাদ পোর্টাল যাচাই",
        statLanguages: "বহুভাষিক: ইংরেজি, বাংলা, হিন্দি"
      },
      input: {
        headlineTab: "শিরোনাম / পূর্ণ সংবাদ",
        urlTab: "সংবাদ লিংক (URL)",
        placeholder: "একটি সংবাদ শিরোনাম, সম্পূর্ণ অনুচ্ছেদ বা সামাজিক মাধ্যমের দাবি এখানে পেস্ট করুন...",
        urlPlaceholder: "https://example.com/bangla/news-article",
        button: "সত্যতা যাচাই করুন",
        analyzing: "সংবাদ বিশ্লেষণ করা হচ্ছে...",
        quickSamples: "নমুনা পরীক্ষা:",
        clear: "পরিষ্কার করুন",
        charCount: "অক্ষর",
        validation: {
          empty: "অনুগ্রহ করে একটি শিরোনাম বা URL লিখুন",
          invalid: "অনুগ্রহ করে কমপক্ষে ১০ অক্ষরের একটি বৈধ ইনপুট দিন"
        }
      },
      result: {
        real: "এই সংবাদটি সত্য বলে প্রমাণিত",
        fake: "এই সংবাদটি ভুয়া বা বিভ্রান্তিকর বলে মনে হচ্ছে",
        suspicious: "সন্দেহজনক সংবাদ",
        authenticityScore: "সত্যতা স্কোর",
        confidence: "আত্মবিশ্বাস",
        detectedLang: "সনাক্তকৃত ভাষা",
        reasoningHeading: "এআই বিশ্লেষণ বিবরণ",
        portalHeading: "বিশ্বস্ত সংবাদ পোর্টাল যাচাই",
        disclaimerTitle: "একাডেমিক ও ফরেনসিক সতর্কতা",
        disclaimerText: "এই ফলাফলটি অ্যালগরিদম ভিত্তিক। চূড়ান্ত সিদ্ধান্তের জন্য বিশ্বস্ত সংবাদপত্রের সাথে মিলিয়ে নিন।",
        credibilityBoost: "বিশ্বস্ত সংবাদ মাধ্যমে প্রতিবেদন পাওয়ায় স্কোর বৃদ্ধি পেয়েছে",
        noPortals: "শীর্ষ সংবাদ পোর্টালে এই খবরের কোনো মিল পাওয়া যায়নি",
        sourcesFound: "টি বিশ্বস্ত সংবাদ পোর্টালে খবরটি পাওয়া গেছে"
      },
      deepfake: {
        title: "ডিপফেক ভিডিও ফরেনসিক ইনস্পেক্টর",
        subtitle: "মুখাবয়ব ও সিন্থেটিক ভিডিওর এআই বিশ্লেষণ",
        inputLabel: "ইনপুট: VIDEO_102842.mp4",
        alertDetected: "ডিপফেক সনাক্ত হয়েছে",
        alertScore: "৮৭% ভুয়া (FAKE)",
        overlayTitle: "এআই বিশ্লেষণ ওভারলে",
        detectionResults: "ফলাফল",
        badgeFake: "ভুয়া (FAKE)",
        badgeAuthentic: "সত্য (REAL)",
        lipSync: "লিপ-সিঙ্ক অসঙ্গতি",
        lipSyncDetail: "৯১% অসঙ্গতি",
        boundary: "মুখের সীমারেখায় ত্রুটি",
        boundaryDetail: "সনাক্ত হয়েছে",
        blink: "অস্বাভাবিক চোখের পলক",
        blinkDetail: "০.২ Hz",
        texture: "টেক্সচার অসঙ্গতি",
        textureDetail: "৮৪%",
        landmarkTitle: "ফেসিয়াল ল্যান্ডমার্ক বিশ্লেষণ",
        landmarksTracked: "ট্র্যাক করা পয়েন্ট: ৬৮",
        stabilityScore: "স্থায়িত্ব স্কোর: ২২%",
        modelInfoTitle: "মডেল তথ্য",
        modelInfo: "মডেল: ডিটেক্টর v3.2 • রান টাইম: ১.২৪s",
        analysisLogTitle: "বিশ্লেষণ লগ",
        log1: "[00:41] ফ্রেম ১০২১: মুখের গঠনে অস্বাভাবিকতা",
        log2: "[00:40] অডিও/ভিডিও ব্যবধান: +১২০ms",
        log3: "[00:39] পিক্সেল ক্লাস্টারে ত্রুটি পাওয়া গেছে",
        statusComplete: "অবস্থা: বিশ্লেষণ সম্পন্ন",
        exportReport: "রিপোর্ট ডাউনলোড করুন",
        flagNews: "ভুয়া চিহ্নিত করুন",
        tabOverview: "সারসংক্ষেপ",
        tabForensic: "ফরেনসিক তথ্য",
        tabFrame: "ফ্রেম বিশ্লেষণ",
        deepfakeScore: "ডিপফেক স্কোর",
        authenticity: "সত্যতা",
        confidence: "আত্মবিশ্বাস"
      },
      sidebar: {
        title: "সাম্প্রতিক পরীক্ষা",
        empty: "এখনও কোন সাম্প্রতিক পরীক্ষা নেই",
        clearAll: "মুছে ফেলুন",
        deleteQuery: "মুছুন"
      },
      language: {
        switch: "ভাষা পরিবর্তন",
        english: "English",
        hindi: "हिंदी (Hindi)",
        hinglish: "Hinglish",
        bangla: "বাংলা (Bangla)"
      }
    }
  }
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('satyacheck_lang') || 'en' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
