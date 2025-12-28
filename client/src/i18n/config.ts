import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app: {
        title: "Fake News Detector",
        subtitle: "Verify news authenticity instantly"
      },
      input: {
        placeholder: "Enter a news headline or URL...",
        button: "Check Authenticity",
        validation: {
          empty: "Please enter a headline or URL",
          invalid: "Please enter a valid URL or headline"
        }
      },
      sidebar: {
        title: "Recent Checks",
        empty: "No recent checks yet"
      },
      result: {
        real: "This news appears to be Real",
        fake: "This news appears to be Fake",
        confidence: "Confidence",
        analyzing: "Analyzing news..."
      },
      language: {
        switch: "Switch Language",
        english: "English",
        bangla: "বাংলা"
      },
      status: {
        real: "Real",
        fake: "Fake"
      }
    }
  },
  bn: {
    translation: {
      app: {
        title: "ভুয়া সংবাদ সনাক্তকারী",
        subtitle: "তাৎক্ষণিকভাবে সংবাদের সত্যতা যাচাই করুন"
      },
      input: {
        placeholder: "একটি সংবাদ শিরোনাম বা URL লিখুন...",
        button: "সত্যতা যাচাই করুন",
        validation: {
          empty: "অনুগ্রহ করে একটি শিরোনাম বা URL লিখুন",
          invalid: "অনুগ্রহ করে একটি বৈধ URL বা শিরোনাম লিখুন"
        }
      },
      sidebar: {
        title: "সাম্প্রতিক পরীক্ষা",
        empty: "এখনও কোন সাম্প্রতিক পরীক্ষা নেই"
      },
      result: {
        real: "এই সংবাদটি সত্য বলে মনে হচ্ছে",
        fake: "এই সংবাদটি ভুয়া বলে মনে হচ্ছে",
        confidence: "আত্মবিশ্বাস",
        analyzing: "সংবাদ বিশ্লেষণ করা হচ্ছে..."
      },
      language: {
        switch: "ভাষা পরিবর্তন করুন",
        english: "English",
        bangla: "বাংলা"
      },
      status: {
        real: "সত্য",
        fake: "ভুয়া"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
