import os
import sys
import csv
import json
import re
import pickle
import unicodedata
import requests
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dataset')
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(DATA_DIR, exist_ok=True)

STOPWORDS_URL = "https://raw.githubusercontent.com/Siddhartha15/Hindi-Fake-News-Detection/main/Data/final_stopwords.txt"
FAKE_URL = "https://raw.githubusercontent.com/Siddhartha15/Hindi-Fake-News-Detection/main/Data/fake_news.csv"
TRUE_URL = "https://raw.githubusercontent.com/Siddhartha15/Hindi-Fake-News-Detection/main/Data/true_news.csv"

def download_file(url, local_path):
    if not os.path.exists(local_path):
        print(f"Downloading {url} -> {local_path} ...")
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        with open(local_path, 'wb') as f:
            f.write(res.content)
        print(f"Saved {local_path} ({os.path.getsize(local_path)} bytes)")
    else:
        print(f"File already exists: {local_path}")

def clean_hindi_text(text):
    if not text:
        return ""
    text = unicodedata.normalize('NFKC', str(text))
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    text = re.sub(r'[।॥!?,;:"\'\(\)\[\]\{\}<>\/\\`~@#$%^&*+=_-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    print("=" * 60)
    print("SatyaCheck: Training Genuine Hindi & Hinglish Detection Model")
    print("=" * 60)

    stopwords_path = os.path.join(DATA_DIR, 'hi_stopwords.txt')
    fake_csv_path = os.path.join(DATA_DIR, 'raw_hi_fake.csv')
    true_csv_path = os.path.join(DATA_DIR, 'raw_hi_true.csv')

    download_file(STOPWORDS_URL, stopwords_path)
    download_file(FAKE_URL, fake_csv_path)
    download_file(TRUE_URL, true_csv_path)

    # Load Stopwords
    stopwords = set()
    with open(stopwords_path, 'r', encoding='utf-8') as f:
        for line in f:
            w = line.strip()
            if w:
                stopwords.add(w)
    print(f"Loaded {len(stopwords)} Hindi stopwords.")

    # Parse and combine records
    texts = []
    labels = []
    titles = []

    # Read Fake News (Label: 0)
    with open(fake_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('full_title', '') or ''
            desc = row.get('short_description', '') or ''
            content = row.get('long_description', '') or ''
            combined = f"{title} {desc} {content}".strip()
            if len(combined) > 15:
                cleaned = clean_hindi_text(combined)
                if len(cleaned) > 10:
                    texts.append(cleaned)
                    labels.append(0)
                    titles.append(title[:120])

    fake_count = len(texts)
    print(f"Loaded {fake_count} labeled Fake news samples.")

    # Read True News (Label: 1)
    with open(true_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('full_title', '') or ''
            desc = row.get('short_description', '') or ''
            content = row.get('long_description', '') or ''
            combined = f"{title} {desc} {content}".strip()
            if len(combined) > 15:
                cleaned = clean_hindi_text(combined)
                if len(cleaned) > 10:
                    texts.append(cleaned)
                    labels.append(1)
                    titles.append(title[:120])

    true_count = len(texts) - fake_count
    print(f"Loaded {true_count} labeled True news samples.")
    print(f"Total Combined Hindi/Hinglish Samples: {len(texts)}")

    # Save formatted unified hi.csv
    hi_csv_path = os.path.join(DATA_DIR, 'hi.csv')
    with open(hi_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['title', 'text', 'label'])
        for t, txt, lbl in zip(titles, texts, labels):
            writer.writerow([t, txt, lbl])
    print(f"Saved standardized {hi_csv_path} with {len(texts)} rows.")

    # Stratified Train/Test Split (80% Train, 20% Held-out Test)
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.20, random_state=42, stratify=labels
    )
    print(f"Split sizes: Train={len(X_train)}, Test={len(X_test)}")

    # TF-IDF Vectorizer with Subword & Word N-Grams (1, 2)
    # Allows robust detection of Devanagari words and Romanized Hindi terms
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=12000,
        sublinear_tf=True
    )

    print("Fitting TF-IDF Vectorizer...")
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print(f"Vocabulary feature matrix shape: {X_train_vec.shape}")

    # Train Logistic Regression Classifier
    print("Training Logistic Regression Model (C=1.5, max_iter=1000)...")
    clf = LogisticRegression(C=1.5, max_iter=1000, solver='lbfgs', random_state=42)
    clf.fit(X_train_vec, y_train)

    # Evaluation on Test Split
    y_pred = clf.predict(X_test_vec)
    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 60)
    print(f"TEST SET EVALUATION RESULTS (Hindi & Hinglish)")
    print("=" * 60)
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("\nConfusion Matrix [TN, FP; FN, TP]:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Fake (0)', 'Authentic (1)']))

    # Save Model Artifacts
    hi_model_path = os.path.join(MODEL_DIR, 'hi_model.pkl')
    hi_vec_path = os.path.join(MODEL_DIR, 'hi_vectorizer.pkl')

    with open(hi_model_path, 'wb') as f:
        pickle.dump(clf, f)
    with open(hi_vec_path, 'wb') as f:
        pickle.dump(vectorizer, f)

    print(f"Successfully saved {hi_model_path}")
    print(f"Successfully saved {hi_vec_path}")

    # Save metrics JSON for viva presentation
    metrics = {
        'model_name': 'SatyaCheck Hindi/Hinglish Logistic Classifier v1.0',
        'accuracy': round(float(acc), 4),
        'precision': round(float(prec), 4),
        'recall': round(float(rec), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': cm.tolist(),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'feature_count': 12000,
        'dataset_source': 'BoomLive & BBC Hindi Verified Research Corpus (Siddhartha15)'
    }
    with open(os.path.join(MODEL_DIR, 'hi_metrics.json'), 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)

    print("Metrics written to model/hi_metrics.json")
    print("=" * 60)

if __name__ == '__main__':
    main()
