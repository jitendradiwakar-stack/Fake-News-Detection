# SatyaCheck
### AI-Powered Multilingual News Verification & Digital Media Forensics

<p align="center">
  <strong>Understand the news. Question the claim. Verify the evidence.</strong>
</p>

<p align="center">
  An intelligent platform for analyzing misinformation, validating news claims, and investigating potentially manipulated digital media.
</p>

---

## Overview

**SatyaCheck** is a multilingual AI-powered verification platform designed to help users assess the credibility of online information and investigate potentially manipulated media.

The platform combines machine learning-based text classification, external news-source corroboration, and an interactive video forensics environment within a unified application.

Built to address the challenges of misinformation across multilingual digital ecosystems, SatyaCheck supports English, Hindi, Hinglish, and Bengali content analysis.

Rather than relying on a single verification signal, the system brings together automated predictions and external information retrieval to provide users with additional context for evaluating suspicious claims.

### Core Capabilities

| Capability | Description |
|---|---|
| Multilingual Analysis | Classifies news content across supported languages. |
| Claim Verification | Cross-references submitted claims with external news coverage. |
| Video Forensics | Provides visual inspection tools for potential deepfake indicators. |
| Secure Authentication | JWT-based authentication with protected user resources. |
| Personal Dashboard | Tracks individual analysis activity and statistics. |
| Prediction History | Search, filter, inspect, and manage previous analyses. |

---

## Product Modules

### 01. Multilingual Intelligence Engine

A language-aware text classification pipeline designed to identify patterns associated with misleading or fabricated news.

**Supported languages**
- English
- Hindi
- Hinglish
- Bengali

**Capabilities**
- Headline and article classification.
- URL-based content analysis.
- Automatic language identification.
- TF-IDF feature extraction.
- Logistic Regression inference.
- Authenticity scoring and prediction confidence.

### 02. News Credibility Verification

An external evidence retrieval layer that supplements machine learning predictions with relevant news coverage.

- DuckDuckGo-powered news discovery.
- Search across 40+ configured news portals.
- Relevant article retrieval.
- Supporting and conflicting coverage inspection.
- Additional context for submitted claims.

### 03. Deepfake Video Forensics

An interactive forensic inspection environment for examining potential visual manipulation indicators.

- Facial landmark visualization using a 68-point mesh.
- Facial movement inspection.
- Lip synchronization analysis interface.
- Blink-pattern monitoring.
- Frame-level telemetry visualization.

### 04. Identity & Access Management

A secure account management layer supporting personalized application experiences.

- Account registration and authentication.
- Email and username-based login.
- Password strength feedback.
- PBKDF2:SHA256 password hashing.
- Signed JWT access tokens.
- HttpOnly cookie authentication.
- User-level resource authorization.

### 05. Forensic Intelligence Dashboard

A personalized workspace for managing verification activity.

- Analysis statistics and classification distribution.
- Recent activity tracking.
- Detailed prediction inspection.
- Searchable prediction history.
- Classification-based filtering.
- Pagination and sorting.
- Individual and bulk history deletion.
- Profile and password management.

### 06. Internationalization

A multilingual interface powered by i18next.

- English
- Hindi
- Hinglish

Language preferences are maintained across sessions.

---

## System Design

SatyaCheck follows a modular client-server architecture that separates presentation, application logic, machine learning inference, external verification, and data persistence.

```text
                        CLIENT APPLICATION
                    React 18 / Vite / Tailwind
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
        Identity &        News Analysis      Deepfake
        Dashboard         & Verification      Forensics
             |                 |                 |
             +-----------------+-----------------+
                               |
                            REST API
                               |
                               v
                       FLASK APPLICATION
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
       Authentication    ML Inference       Evidence
          Services          Engine          Retrieval
             |                 |                 |
             |           +-----+-----+           |
             |           |     |     |           |
             |           v     v     v           |
             |          EN    HI    BN           |
             |           Models                  |
             |                                   |
             +-----------------+-----------------+
                               |
                               v
                         DATA LAYER
                               |
                       +-------+-------+
                       |               |
                       v               v
                    MongoDB          SQLite
```

### Architectural Principles

- **Separation of concerns:** Frontend, backend, ML, and persistence responsibilities are separated.
- **Modularity:** Individual services can evolve independently.
- **Authentication boundaries:** Protected resources require appropriate authorization.
- **Persistence flexibility:** MongoDB and SQLite support different deployment scenarios.
- **Extensibility:** New languages, models, and verification modules can be integrated.

---

## Machine Learning Pipeline

The text verification engine uses a traditional supervised machine learning architecture.

```text
        Raw Text / News Claim
                 |
                 v
        Input Normalization
                 |
                 v
        Language Identification
                 |
                 v
        Language-Specific Processing
                 |
                 v
          TF-IDF Vectorization
                 |
                 v
       Logistic Regression Model
                 |
                 v
        Classification Output
                 |
        +--------+--------+
        |        |        |
        v        v        v
     Authentic Suspicious Fake
                 |
                 v
       Prediction & Confidence
```

### Model Performance

| Language | Algorithm | Reported Accuracy |
|---|---|---:|
| English | Logistic Regression | 93.8% |
| Hindi | Logistic Regression | 99.7% |
| Bengali | Logistic Regression | 92.4% |

*Reported experimental results. Performance should be interpreted alongside dataset quality, test methodology, class distribution, and independent evaluation.*

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Build Tool | Vite |
| UI Styling | Tailwind CSS |
| Internationalization | i18next |
| Backend | Python / Flask |
| Machine Learning | Scikit-learn |
| Feature Engineering | TF-IDF |
| Classification | Logistic Regression |
| Database | MongoDB / SQLite |
| Database Integration | PyMongo |
| Authentication | JWT |
| Password Security | PBKDF2:SHA256 |
| External Search | DuckDuckGo |
| Model Persistence | Joblib |

---

## Data Architecture

The application maintains two primary data entities.

### User Entity

Stores account identity, authentication information, and account lifecycle metadata.

| Field | Description |
|---|---|
| id | Unique user identifier |
| full_name | Display name |
| username | Unique username |
| email | Normalized email address |
| password_hash | Hashed authentication credential |
| created_at | Account creation time |
| updated_at | Last profile modification |
| last_login | Most recent login |

### Prediction Entity

Stores verification results associated with individual users.

| Field | Description |
|---|---|
| id | Unique prediction identifier |
| user_id | Associated account |
| input_text | Submitted content or URL |
| input_type | Input classification |
| predicted_label | Model output |
| prediction_code | Numeric classification |
| authenticity_score | Calculated authenticity score |
| confidence | Prediction confidence |
| detected_language | Identified language |
| headline | Extracted claim or headline |
| model_version | Inference model identifier |
| created_at | Analysis timestamp |

### Persistence Strategy

The application supports:

- **MongoDB:** Primary configurable persistence backend.
- **SQLite:** Local fallback for standalone execution.

Database-level uniqueness constraints and user-specific prediction indexes support data integrity and efficient history retrieval.

---

## API Reference

All application APIs use the `/api` namespace.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/logout` | End the authenticated session |
| GET | `/api/auth/me` | Retrieve current user |

### Detection & Verification

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/detector` | Execute text or URL analysis |
| POST | `/api/credibility-check` | Retrieve external news coverage |

### Dashboard & History

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/stats` | Retrieve dashboard metrics |
| GET | `/api/history` | Retrieve prediction records |
| GET | `/api/history/:id` | Retrieve prediction details |
| DELETE | `/api/history/:id` | Delete a prediction |
| DELETE | `/api/history` | Clear prediction history |

### Account Management

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/account` | Retrieve account information |
| PATCH | `/api/account` | Update profile or password |

**History filtering parameters**

```http
GET /api/history?q=election&label=fake&page=1&limit=10&sort=newest
```

---

## Repository Structure

```text
SatyaCheck/
│
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   └── assets/
│   └── package.json
│
├── server/                  # Flask backend
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── ml_models/
│   ├── database/
│   ├── instance/
│   ├── run.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## Local Development

### Requirements

- Python 3.10+
- Node.js and npm
- Git
- MongoDB (optional)

### 1. Clone

```bash
git clone <YOUR_REPOSITORY_URL>
cd SatyaCheck
```

### 2. Configure Backend

```powershell
cd server

python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Create a `.env` file:

```env
FLASK_SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
MONGO_URI=your_mongodb_uri
```

Start the backend:

```bash
python run.py
```

Backend: `http://127.0.0.1:5000`

### 3. Configure Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:8080`

*Ensure the frontend port matches your Vite configuration.*

---

## Security & Data Protection

Security controls are implemented across authentication, authorization, and data persistence.

| Area | Implementation |
|---|---|
| Credential Storage | PBKDF2:SHA256 hashing |
| Session Authentication | Signed JWT |
| Token Lifetime | 7 days |
| Cookie Protection | HttpOnly |
| Resource Authorization | Ownership validation |
| Account Integrity | Unique email and username constraints |
| Data Isolation | User-scoped prediction queries |

**Security considerations:** Production deployment should additionally enforce HTTPS, secure cookie settings, CSRF protection where applicable, rate limiting, input validation, secret rotation, and appropriate token revocation strategies.

---

## Known Limitations

- Text classification is dependent on the training dataset and language coverage.
- Model confidence is not equivalent to factual certainty.
- External news search cannot guarantee comprehensive evidence retrieval.
- Visual forensic indicators are not conclusive proof of deepfake generation.
- The current text classification models do not replace human fact-checking.
- Production-grade video classification requires a separately validated temporal deepfake detection model.

---

## Roadmap

| Priority | Planned Enhancement |
|---|---|
| High | Transformer-based multilingual classification |
| High | Explainable AI and prediction reasoning |
| High | Evidence-backed claim verification |
| Medium | Screenshot and OCR analysis |
| Medium | Audio deepfake detection |
| Medium | Neural video manipulation detection |
| Medium | Automated forensic report generation |
| Future | Browser extension |
| Future | Mobile application |

---

## Responsible AI

SatyaCheck is designed to assist information verification, not replace independent judgment.

Its predictions should be treated as investigative signals. Users should consult primary sources, reliable reporting, and verifiable evidence before making decisions or sharing potentially misleading content.

---

## Project Philosophy

> Information travels fast. Verification should travel faster.

SatyaCheck aims to make digital information verification more accessible through multilingual intelligence, evidence retrieval, and media forensics.

**Question the claim. Investigate the evidence. Think before you share.**