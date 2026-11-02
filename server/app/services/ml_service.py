import pickle
import os
import re
from typing import Dict, Optional
from app.utils.text_cleaner import clean_text


class MLDetectionService:

    _bn_model = None
    _en_model = None
    _hi_model = None
    _bn_vectorizer = None
    _en_vectorizer = None
    _hi_vectorizer = None
    _models_loaded = False

    # Common Romanized Hindi / Hinglish indicator tokens
    HINGLISH_KEYWORDS = {
        'sach', 'jhooth', 'khabar', 'sarkar', 'modi', 'viral', 'video', 'news', 'fake',
        'asli', 'nakli', 'paisa', 'bank', 'ailaan', 'daawa', 'sachha', 'jhootha',
        'forward', 'message', 'share', 'karein', 'karo', 'dekho', 'suno', 'kal',
        'aaj', 'bharat', 'desh', 'pradhanmantri', 'yojana', 'muft', 'sabhi', 'rupees',
        'gaya', 'gayi', 'hoga', 'hogi', 'kya', 'yeh', 'vo', 'kaun', 'kahan', 'kyu',
        'kaise', 'logon', 'bol', 'rahe', 'bataya', 'mana', 'kiya', 'police', 'arrest',
        'chori', 'dhokha', 'bhi', 'nahi', 'raha', 'rahi', 'wale', 'wali', 'bada', 'badi'
    }

    @classmethod
    def load_models(cls, model_dir: Optional[str] = None):
        try:
            if model_dir is None:
                env_model_dir = os.getenv('MODEL_DIR')
                if env_model_dir and os.path.exists(env_model_dir):
                    model_dir = env_model_dir
                else:
                    current_dir = os.path.dirname(os.path.abspath(__file__))
                    project_root = os.path.dirname(os.path.dirname(current_dir))
                    model_dir = os.path.join(project_root, '..', 'model')

            bn_model_path = os.path.join(model_dir, 'bn_model.pkl')
            en_model_path = os.path.join(model_dir, 'en_model.pkl')
            hi_model_path = os.path.join(model_dir, 'hi_model.pkl')
            bn_vectorizer_path = os.path.join(model_dir, 'bn_vectorizer.pkl')
            en_vectorizer_path = os.path.join(model_dir, 'en_vectorizer.pkl')
            hi_vectorizer_path = os.path.join(model_dir, 'hi_vectorizer.pkl')

            # Ensure English and Hindi models exist
            if not os.path.exists(en_model_path) or not os.path.exists(en_vectorizer_path):
                raise FileNotFoundError(f"English model files not found in {model_dir}")

            with open(en_model_path, 'rb') as f:
                cls._en_model = pickle.load(f)
            with open(en_vectorizer_path, 'rb') as f:
                cls._en_vectorizer = pickle.load(f)

            # Load Bangla model if available
            if os.path.exists(bn_model_path) and os.path.exists(bn_vectorizer_path):
                with open(bn_model_path, 'rb') as f:
                    cls._bn_model = pickle.load(f)
                with open(bn_vectorizer_path, 'rb') as f:
                    cls._bn_vectorizer = pickle.load(f)

            # Load Hindi model if available
            if os.path.exists(hi_model_path) and os.path.exists(hi_vectorizer_path):
                with open(hi_model_path, 'rb') as f:
                    cls._hi_model = pickle.load(f)
                with open(hi_vectorizer_path, 'rb') as f:
                    cls._hi_vectorizer = pickle.load(f)

            cls._models_loaded = True
            print(f"SatyaCheck: Multilingual ML models loaded successfully from {model_dir}")

        except Exception as e:
            print(f"Error loading ML models: {str(e)}")
            raise

    @classmethod
    def _detect_language(cls, text: str) -> str:
        """
        Multilingual Language Detection:
        1. Bengali: Devanagari Unicode range U+0980 to U+09FF
        2. Hindi: Devanagari Unicode range U+0900 to U+097F
        3. Hinglish: Latin script with high density of Romanized Hindi tokens
        4. English: Latin script default
        """
        if not text:
            return 'en'

        # Count script occurrences
        bangla_chars = sum(1 for c in text if '\u0980' <= c <= '\u09FF')
        hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        total_letters = sum(1 for c in text if c.isalpha())

        if total_letters == 0:
            return 'en'

        bangla_ratio = bangla_chars / total_letters
        hindi_ratio = hindi_chars / total_letters

        if bangla_ratio > 0.25:
            return 'bn'
        if hindi_ratio > 0.20:
            return 'hi'

        # Check Romanized Hindi / Hinglish lexical match
        words = re.findall(r'[a-zA-Z]+', text.lower())
        if words:
            matched_keywords = sum(1 for w in words if w in cls.HINGLISH_KEYWORDS)
            if matched_keywords >= 2 or (len(words) > 0 and matched_keywords / len(words) >= 0.15):
                return 'hi-en'

        return 'en'

    @classmethod
    def detect(cls, headline: str) -> Dict:
        if not cls._models_loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")

        language = cls._detect_language(headline)
        cleaned_text = clean_text(headline)

        if not cleaned_text:
            cleaned_text = headline

        # Select corresponding model and vectorizer
        if language in ('hi', 'hi-en') and cls._hi_model is not None and cls._hi_vectorizer is not None:
            model = cls._hi_model
            vectorizer = cls._hi_vectorizer
        elif language == 'bn' and cls._bn_model is not None and cls._bn_vectorizer is not None:
            model = cls._bn_model
            vectorizer = cls._bn_vectorizer
        else:
            model = cls._en_model
            vectorizer = cls._en_vectorizer

        text_vector = vectorizer.transform([cleaned_text])

        prediction = model.predict(text_vector)[0]
        probabilities = model.predict_proba(text_vector)[0]

        # Extract top discriminative n-gram tokens (Explainable AI / XAI)
        top_signals = []
        try:
            feature_names = vectorizer.get_feature_names_out()
            if hasattr(text_vector, 'indices') and hasattr(model, 'coef_'):
                for idx, val in zip(text_vector.indices, text_vector.data):
                    w = float(model.coef_[0][idx] * val)
                    top_signals.append({
                        'term': str(feature_names[idx]),
                        'weight': round(w, 3),
                        'impact': 'authentic' if w > 0 else 'fake'
                    })
                top_signals.sort(key=lambda x: abs(x['weight']), reverse=True)
                top_signals = top_signals[:6]
        except Exception as e:
            print(f"Warning: Could not compute feature weights: {e}")

        language_labels = {
            'en': 'English',
            'hi': 'Hindi (Devanagari)',
            'hi-en': 'Hinglish (Roman Hindi)',
            'bn': 'Bengali'
        }

        return {
            'prediction': int(prediction),
            'probabilities': {
                'fake': round(float(probabilities[0]), 4),
                'authentic': round(float(probabilities[1]), 4)
            },
            'detected_language': language,
            'language_name': language_labels.get(language, 'English'),
            'top_signals': top_signals
        }
