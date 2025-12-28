import pickle
import os
from typing import Dict, Optional
from app.utils.text_cleaner import clean_text
import re


class MLDetectionService:

    _bn_model = None
    _en_model = None
    _bn_vectorizer = None
    _en_vectorizer = None
    _models_loaded = False

    @classmethod
    def load_models(cls, model_dir: Optional[str] = None):
        try:

            if model_dir is None:

                current_dir = os.path.dirname(os.path.abspath(__file__))

                project_root = os.path.dirname(os.path.dirname(current_dir))
                model_dir = os.path.join(project_root, '..', 'model')

            bn_model_path = os.path.join(model_dir, 'bn_model.pkl')
            en_model_path = os.path.join(model_dir, 'en_model.pkl')
            bn_vectorizer_path = os.path.join(model_dir, 'bn_vectorizer.pkl')
            en_vectorizer_path = os.path.join(model_dir, 'en_vectorizer.pkl')

            if not all(os.path.exists(p) for p in [bn_model_path, en_model_path, bn_vectorizer_path, en_vectorizer_path]):
                raise FileNotFoundError(
                    f"One or more model files not found in {model_dir}")

            with open(bn_model_path, 'rb') as f:
                cls._bn_model = pickle.load(f)

            with open(en_model_path, 'rb') as f:
                cls._en_model = pickle.load(f)

            with open(bn_vectorizer_path, 'rb') as f:
                cls._bn_vectorizer = pickle.load(f)

            with open(en_vectorizer_path, 'rb') as f:
                cls._en_vectorizer = pickle.load(f)

            cls._models_loaded = True
            print(f"ML models loaded successfully from {model_dir}")

        except Exception as e:
            print(f"Error loading ML models: {str(e)}")
            raise

    @classmethod
    def _detect_language(cls, text: str) -> str:

        bangla_chars = sum(1 for c in text if '\u0980' <= c <= '\u09FF')
        total_chars = len([c for c in text if c.isalpha()])

        if total_chars == 0:
            return 'en'

        bangla_ratio = bangla_chars / total_chars
        return 'bn' if bangla_ratio > 0.3 else 'en'

    @classmethod
    def detect(cls, headline: str) -> Dict:
        if not cls._models_loaded:
            raise RuntimeError("Models not loaded. Call load_models() first.")

        language = cls._detect_language(headline)

        cleaned_text = clean_text(headline)

        if language == 'bn':
            model = cls._bn_model
            vectorizer = cls._bn_vectorizer
        else:
            model = cls._en_model
            vectorizer = cls._en_vectorizer

        text_vector = vectorizer.transform([cleaned_text])

        prediction = model.predict(text_vector)[0]
        probabilities = model.predict_proba(text_vector)[0]

        return {
            'prediction': int(prediction),
            'probabilities': {
                'fake': round(float(probabilities[0]), 4),
                'authentic': round(float(probabilities[1]), 4)
            }
        }
