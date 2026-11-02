import os
import sqlite3
import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

# Environment configuration
MONGO_URI = os.environ.get('MONGO_URI', '')
DB_NAME = os.environ.get('DB_NAME', 'satyacheck_db')

class DatabaseManager:
    """
    Unified database manager for SatyaCheck.
    Supports MongoDB via PyMongo when configured/reachable,
    with an automatic fallback to local SQLite (satyacheck.db)
    to ensure 100% zero-configuration standalone reliability.
    """
    def __init__(self):
        self.use_mongo = False
        self.mongo_client = None
        self.db = None
        self.sqlite_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'instance',
            'satyacheck.db'
        )
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        self._init_connection()

    def _init_connection(self):
        # 1. Attempt MongoDB connection if configured or default
        target_uri = MONGO_URI.strip()
        if target_uri:
            try:
                import pymongo
                self.mongo_client = pymongo.MongoClient(target_uri, serverSelectionTimeoutMS=2000)
                self.mongo_client.server_info()  # Check server connection
                self.db = self.mongo_client[DB_NAME]
                self.use_mongo = True
                self._setup_mongo_indexes()
                print(f"SatyaCheck: Connected successfully to MongoDB [{DB_NAME}]")
                return
            except Exception as e:
                print(f"SatyaCheck: MongoDB connection failed ({str(e)}). Falling back to SQLite.")

        # 2. SQLite Fallback Initialization
        self.use_mongo = False
        self._init_sqlite()
        print(f"SatyaCheck: Initialized SQLite storage at [{self.sqlite_path}]")

    def _setup_mongo_indexes(self):
        """Create unique indexes for email and username in MongoDB"""
        try:
            self.db.users.create_index('email', unique=True)
            self.db.users.create_index('username', unique=True)
            self.db.predictions.create_index([('user_id', 1), ('created_at', -1)])
            self.db.fact_checks.create_index('external_id', unique=True)
            self.db.fact_checks.create_index([('review_date', -1)])
            self.db.fact_checks.create_index('normalized_verdict')
            self.db.fact_checks.create_index('language')
            self.db.fact_checks.create_index('category')
            self.db.user_interactions.create_index([('user_id', 1), ('article_id', 1)])
            self.db.user_interactions.create_index([('user_id', 1), ('interaction_type', 1)])
        except Exception as e:
            print(f"Warning setting Mongo indexes: {e}")

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_sqlite_conn() as conn:
            cursor = conn.cursor()
            # Users Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    last_login TEXT,
                    preferred_language TEXT DEFAULT 'all',
                    selected_interests TEXT DEFAULT '[]',
                    onboarding_completed INTEGER DEFAULT 0
                )
            ''')
            # Check for existing users table columns (schema migration)
            cursor.execute('PRAGMA table_info(users)')
            existing_cols = [row['name'] for row in cursor.fetchall()]
            if 'preferred_language' not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'all'")
            if 'selected_interests' not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN selected_interests TEXT DEFAULT '[]'")
            if 'onboarding_completed' not in existing_cols:
                cursor.execute("ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0")

            # User Interactions Table (Tracking viewed, saved, dismissed)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_interactions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    article_id TEXT NOT NULL,
                    interaction_type TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id, article_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(user_id, interaction_type)')
            # Predictions History Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    input_text TEXT NOT NULL,
                    input_type TEXT NOT NULL,
                    predicted_label TEXT NOT NULL,
                    prediction_code INTEGER NOT NULL,
                    authenticity_score REAL NOT NULL,
                    confidence REAL NOT NULL,
                    detected_language TEXT,
                    headline TEXT,
                    model_version TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ''')
            # Fact Checks Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fact_checks (
                    id TEXT PRIMARY KEY,
                    external_id TEXT UNIQUE NOT NULL,
                    claim_text TEXT NOT NULL,
                    claimant TEXT,
                    fact_check_publisher TEXT NOT NULL,
                    publisher_rating TEXT NOT NULL,
                    normalized_verdict TEXT NOT NULL,
                    fact_check_url TEXT NOT NULL,
                    review_date TEXT NOT NULL,
                    language TEXT DEFAULT 'en',
                    category TEXT DEFAULT 'India',
                    country TEXT DEFAULT 'India',
                    source_api TEXT NOT NULL,
                    explanation TEXT,
                    image_url TEXT,
                    image_source TEXT,
                    image_caption TEXT,
                    first_seen_at TEXT NOT NULL,
                    last_synced_at TEXT NOT NULL
                )
            ''')
            # Fact Check Sync Status Table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fact_check_sync (
                    id TEXT PRIMARY KEY,
                    last_synced_at TEXT,
                    last_sync_status TEXT,
                    records_count INTEGER DEFAULT 0,
                    last_error TEXT,
                    is_syncing INTEGER DEFAULT 0
                )
            ''')
            # Indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id, created_at DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_fc_review_date ON fact_checks(review_date DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_fc_external_id ON fact_checks(external_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_fc_verdict ON fact_checks(normalized_verdict)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_fc_lang ON fact_checks(language)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_fc_cat ON fact_checks(category)')

            # Dynamic column check for fact_checks image fields
            cursor.execute("PRAGMA table_info(fact_checks)")
            existing_cols = [row['name'] if isinstance(row, dict) else row[1] for row in cursor.fetchall()]
            if 'image_url' not in existing_cols:
                cursor.execute("ALTER TABLE fact_checks ADD COLUMN image_url TEXT")
            if 'image_source' not in existing_cols:
                cursor.execute("ALTER TABLE fact_checks ADD COLUMN image_source TEXT")
            if 'image_caption' not in existing_cols:
                cursor.execute("ALTER TABLE fact_checks ADD COLUMN image_caption TEXT")

            conn.commit()

    # ==================== User Repository Methods ====================

    def create_user(self, full_name: str, username: str, email: str, password_hash: str) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        clean_email = email.strip().lower()
        clean_username = username.strip().lower()

        if self.use_mongo:
            user_doc = {
                '_id': user_id,
                'id': user_id,
                'full_name': full_name.strip(),
                'username': clean_username,
                'email': clean_email,
                'password_hash': password_hash,
                'created_at': now,
                'updated_at': now,
                'last_login': now,
                'preferred_language': 'all',
                'selected_interests': [],
                'onboarding_completed': False
            }
            self.db.users.insert_one(user_doc)
            return self._clean_user_dict(user_doc)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO users (id, full_name, username, email, password_hash, created_at, updated_at, last_login, preferred_language, selected_interests, onboarding_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (user_id, full_name.strip(), clean_username, clean_email, password_hash, now, now, now, 'all', '[]', 0))
                conn.commit()
            return {
                'id': user_id,
                'full_name': full_name.strip(),
                'username': clean_username,
                'email': clean_email,
                'created_at': now,
                'updated_at': now,
                'last_login': now,
                'preferred_language': 'all',
                'selected_interests': [],
                'onboarding_completed': False
            }

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        if self.use_mongo:
            doc = self.db.users.find_one({'email': clean_email})
            return self._clean_user_dict(doc) if doc else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM users WHERE email = ?', (clean_email,))
                row = cursor.fetchone()
                return self._clean_user_dict(dict(row)) if row else None

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        clean_username = username.strip().lower()
        if self.use_mongo:
            doc = self.db.users.find_one({'username': clean_username})
            return self._clean_user_dict(doc) if doc else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM users WHERE username = ?', (clean_username,))
                row = cursor.fetchone()
                return self._clean_user_dict(dict(row)) if row else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.use_mongo:
            doc = self.db.users.find_one({'_id': user_id})
            return self._clean_user_dict(doc) if doc else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
                row = cursor.fetchone()
                return self._clean_user_dict(dict(row)) if row else None

    def update_user_last_login(self, user_id: str):
        now = datetime.now(timezone.utc).isoformat()
        if self.use_mongo:
            self.db.users.update_one({'_id': user_id}, {'$set': {'last_login': now, 'updated_at': now}})
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?', (now, now, user_id))
                conn.commit()

    def update_user_profile(self, user_id: str, full_name: Optional[str] = None,
                            username: Optional[str] = None, email: Optional[str] = None,
                            password_hash: Optional[str] = None) -> bool:
        clean_email = email.strip().lower() if email else None
        clean_username = username.strip().lower() if username else None
        clean_name = full_name.strip() if full_name else None

        # Enforce email uniqueness
        if clean_email:
            existing = self.get_user_by_email(clean_email)
            if existing and existing['id'] != user_id:
                raise ValueError("Email address is already in use by another account.")

        # Enforce username uniqueness
        if clean_username:
            existing = self.get_user_by_username(clean_username)
            if existing and existing['id'] != user_id:
                raise ValueError("Username is already taken by another account.")

        now = datetime.now(timezone.utc).isoformat()
        if self.use_mongo:
            updates = {'updated_at': now}
            if clean_name:
                updates['full_name'] = clean_name
            if clean_username:
                updates['username'] = clean_username
            if clean_email:
                updates['email'] = clean_email
            if password_hash:
                updates['password_hash'] = password_hash
            res = self.db.users.update_one({'_id': user_id}, {'$set': updates})
            return res.modified_count > 0
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                fields = ['updated_at = ?']
                params = [now]
                if clean_name:
                    fields.append('full_name = ?')
                    params.append(clean_name)
                if clean_username:
                    fields.append('username = ?')
                    params.append(clean_username)
                if clean_email:
                    fields.append('email = ?')
                    params.append(clean_email)
                if password_hash:
                    fields.append('password_hash = ?')
                    params.append(password_hash)

                params.append(user_id)
                query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount > 0

    def update_user_preferences(self, user_id: str,
                                preferred_language: Optional[str] = None,
                                selected_interests: Optional[List[str]] = None) -> bool:
        """Updates user's preferred content language and topic interests"""
        now = datetime.now(timezone.utc).isoformat()
        if self.use_mongo:
            updates = {'updated_at': now}
            if preferred_language is not None:
                updates['preferred_language'] = preferred_language
            if selected_interests is not None:
                updates['selected_interests'] = selected_interests
            res = self.db.users.update_one({'_id': user_id}, {'$set': updates})
            return res.modified_count > 0
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                fields = ['updated_at = ?']
                params = [now]
                if preferred_language is not None:
                    fields.append('preferred_language = ?')
                    params.append(preferred_language)
                if selected_interests is not None:
                    fields.append('selected_interests = ?')
                    params.append(json.dumps(selected_interests))
                params.append(user_id)
                query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount > 0

    def set_user_onboarding_status(self, user_id: str, completed: bool) -> bool:
        """Sets the onboarding_completed flag for the user"""
        now = datetime.now(timezone.utc).isoformat()
        val = bool(completed)
        if self.use_mongo:
            res = self.db.users.update_one(
                {'_id': user_id},
                {'$set': {'onboarding_completed': val, 'updated_at': now}}
            )
            return res.modified_count > 0
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE users SET onboarding_completed = ?, updated_at = ? WHERE id = ?',
                    (1 if val else 0, now, user_id)
                )
                conn.commit()
                return cursor.rowcount > 0

    def record_user_interaction(self, user_id: str, article_id: str, interaction_type: str) -> bool:
        """Records user interaction with a fact-check article ('viewed', 'saved', 'dismissed', 'displayed')"""
        now = datetime.now(timezone.utc).isoformat()
        interact_id = str(uuid.uuid4())
        clean_type = interaction_type.strip().lower()
        if clean_type not in ('viewed', 'saved', 'dismissed', 'displayed'):
            raise ValueError("Interaction type must be 'viewed', 'saved', 'dismissed', or 'displayed'.")

        if self.use_mongo:
            self.db.user_interactions.update_one(
                {'user_id': user_id, 'article_id': article_id, 'interaction_type': clean_type},
                {'$set': {'created_at': now}, '$setOnInsert': {'_id': interact_id, 'id': interact_id}},
                upsert=True
            )
            return True
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO user_interactions (id, user_id, article_id, interaction_type, created_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (interact_id, user_id, article_id, clean_type, now))
                conn.commit()
                return True

    def record_batch_impressions(self, user_id: str, article_ids: List[str]):
        """Records displayed impressions for a batch of articles to support recommendation rotation"""
        if not user_id or not article_ids:
            return
        now = datetime.now(timezone.utc).isoformat()
        if self.use_mongo:
            docs = [{
                '_id': str(uuid.uuid4()),
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'article_id': aid,
                'interaction_type': 'displayed',
                'created_at': now
            } for aid in article_ids]
            try:
                self.db.user_interactions.insert_many(docs, ordered=False)
            except Exception:
                pass
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.executemany('''
                    INSERT INTO user_interactions (id, user_id, article_id, interaction_type, created_at)
                    VALUES (?, ?, ?, 'displayed', ?)
                ''', [(str(uuid.uuid4()), user_id, aid, now) for aid in article_ids])
                conn.commit()

    def get_recently_displayed_articles(self, user_id: str, minutes: int = 45) -> List[str]:
        """Returns list of article_ids displayed to the user within the last N minutes"""
        if not user_id:
            return []
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
        if self.use_mongo:
            cursor = self.db.user_interactions.find({
                'user_id': user_id,
                'interaction_type': 'displayed',
                'created_at': {'$gte': cutoff}
            })
            return list(set(doc['article_id'] for doc in cursor))
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT DISTINCT article_id FROM user_interactions
                    WHERE user_id = ? AND interaction_type = 'displayed' AND created_at >= ?
                ''', (user_id, cutoff))
                return [row['article_id'] for row in cursor.fetchall()]

    def reset_user_displayed_history(self, user_id: str):
        """Resets recent displayed impressions so user can cycle fresh through all eligible recommendations"""
        if not user_id:
            return
        if self.use_mongo:
            self.db.user_interactions.delete_many({'user_id': user_id, 'interaction_type': 'displayed'})
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM user_interactions WHERE user_id = ? AND interaction_type = "displayed"', (user_id,))
                conn.commit()

    def get_user_dismissed_articles(self, user_id: str) -> List[str]:
        """Returns list of article_ids dismissed by user"""
        if self.use_mongo:
            cursor = self.db.user_interactions.find({'user_id': user_id, 'interaction_type': 'dismissed'})
            return [doc['article_id'] for doc in cursor]
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT article_id FROM user_interactions WHERE user_id = ? AND interaction_type = "dismissed"', (user_id,))
                return [row['article_id'] for row in cursor.fetchall()]

    def get_user_saved_articles(self, user_id: str) -> List[str]:
        """Returns list of article_ids saved by user"""
        if self.use_mongo:
            cursor = self.db.user_interactions.find({'user_id': user_id, 'interaction_type': 'saved'})
            return [doc['article_id'] for doc in cursor]
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT article_id FROM user_interactions WHERE user_id = ? AND interaction_type = "saved"', (user_id,))
                return [row['article_id'] for row in cursor.fetchall()]

    # ==================== Prediction History Repository ====================

    def save_prediction(self, user_id: str, input_text: str, input_type: str,
                        predicted_label: str, prediction_code: int,
                        authenticity_score: float, confidence: float,
                        detected_language: str = 'en', headline: str = '') -> Dict[str, Any]:
        pred_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        model_version = 'SatyaCheck v2.0 Multilingual'

        record = {
            'id': pred_id,
            'user_id': user_id,
            'input_text': input_text,
            'input_type': input_type,
            'predicted_label': predicted_label,
            'prediction_code': prediction_code,
            'authenticity_score': round(float(authenticity_score), 4),
            'confidence': round(float(confidence), 1),
            'detected_language': detected_language,
            'headline': headline or input_text[:120],
            'model_version': model_version,
            'created_at': now
        }

        if self.use_mongo:
            mongo_doc = dict(record)
            mongo_doc['_id'] = pred_id
            self.db.predictions.insert_one(mongo_doc)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO predictions (
                        id, user_id, input_text, input_type, predicted_label,
                        prediction_code, authenticity_score, confidence,
                        detected_language, headline, model_version, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    pred_id, user_id, input_text, input_type, predicted_label,
                    prediction_code, authenticity_score, confidence,
                    detected_language, headline or input_text[:120], model_version, now
                ))
                conn.commit()

        return record

    def get_user_history(self, user_id: str, search: Optional[str] = None,
                         label_filter: Optional[str] = None,
                         sort: str = 'newest',
                         limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        sort_direction = -1 if sort == 'newest' else 1
        if self.use_mongo:
            query = {'user_id': user_id}
            if label_filter and label_filter in ('fake', 'suspicious', 'authentic'):
                query['predicted_label'] = label_filter
            if search:
                query['$or'] = [
                    {'headline': {'$regex': search, '$options': 'i'}},
                    {'input_text': {'$regex': search, '$options': 'i'}}
                ]
            cursor = self.db.predictions.find(query).sort('created_at', sort_direction).skip(offset).limit(limit)
            return [self._clean_mongo_id(doc) for doc in cursor]
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                sql = 'SELECT * FROM predictions WHERE user_id = ?'
                params = [user_id]

                if label_filter and label_filter in ('fake', 'suspicious', 'authentic'):
                    sql += ' AND predicted_label = ?'
                    params.append(label_filter)

                if search:
                    sql += ' AND (headline LIKE ? OR input_text LIKE ?)'
                    params.extend([f'%{search}%', f'%{search}%'])

                order = 'DESC' if sort == 'newest' else 'ASC'
                sql += f' ORDER BY created_at {order} LIMIT ? OFFSET ?'
                params.extend([limit, offset])

                cursor.execute(sql, params)
                return [dict(row) for row in cursor.fetchall()]

    def get_user_history_count(self, user_id: str, search: Optional[str] = None,
                               label_filter: Optional[str] = None) -> int:
        if self.use_mongo:
            query = {'user_id': user_id}
            if label_filter and label_filter in ('fake', 'suspicious', 'authentic'):
                query['predicted_label'] = label_filter
            if search:
                query['$or'] = [
                    {'headline': {'$regex': search, '$options': 'i'}},
                    {'input_text': {'$regex': search, '$options': 'i'}}
                ]
            return self.db.predictions.count_documents(query)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                sql = 'SELECT COUNT(*) as count FROM predictions WHERE user_id = ?'
                params = [user_id]

                if label_filter and label_filter in ('fake', 'suspicious', 'authentic'):
                    sql += ' AND predicted_label = ?'
                    params.append(label_filter)

                if search:
                    sql += ' AND (headline LIKE ? OR input_text LIKE ?)'
                    params.extend([f'%{search}%', f'%{search}%'])

                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row['count'] if row else 0

    def get_prediction_by_id(self, pred_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if self.use_mongo:
            doc = self.db.predictions.find_one({'_id': pred_id, 'user_id': user_id})
            return self._clean_mongo_id(doc) if doc else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM predictions WHERE id = ? AND user_id = ?', (pred_id, user_id))
                row = cursor.fetchone()
                return dict(row) if row else None

    def delete_prediction(self, pred_id: str, user_id: str) -> bool:
        if self.use_mongo:
            res = self.db.predictions.delete_one({'_id': pred_id, 'user_id': user_id})
            return res.deleted_count > 0
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM predictions WHERE id = ? AND user_id = ?', (pred_id, user_id))
                conn.commit()
                return cursor.rowcount > 0

    def clear_user_history(self, user_id: str) -> int:
        if self.use_mongo:
            res = self.db.predictions.delete_many({'user_id': user_id})
            return res.deleted_count
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM predictions WHERE user_id = ?', (user_id,))
                conn.commit()
                return cursor.rowcount

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Calculates authentic, suspicious, and fake counts for the authenticated user"""
        if self.use_mongo:
            total = self.db.predictions.count_documents({'user_id': user_id})
            fake_count = self.db.predictions.count_documents({'user_id': user_id, 'predicted_label': 'fake'})
            suspicious_count = self.db.predictions.count_documents({'user_id': user_id, 'predicted_label': 'suspicious'})
            authentic_count = self.db.predictions.count_documents({'user_id': user_id, 'predicted_label': 'authentic'})
            recent_docs = list(self.db.predictions.find({'user_id': user_id}).sort('created_at', -1).limit(1))
            recent_activity = recent_docs[0]['created_at'] if recent_docs else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT COUNT(*) as total FROM predictions WHERE user_id = ?', (user_id,))
                total = cursor.fetchone()['total']

                cursor.execute("SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND predicted_label = 'fake'", (user_id,))
                fake_count = cursor.fetchone()['count']

                cursor.execute("SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND predicted_label = 'suspicious'", (user_id,))
                suspicious_count = cursor.fetchone()['count']

                cursor.execute("SELECT COUNT(*) as count FROM predictions WHERE user_id = ? AND predicted_label = 'authentic'", (user_id,))
                authentic_count = cursor.fetchone()['count']

                cursor.execute('SELECT created_at FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (user_id,))
                recent_row = cursor.fetchone()
                recent_activity = recent_row['created_at'] if recent_row else None

        return {
            'total_analyses': total,
            'fake_count': fake_count,
            'suspicious_count': suspicious_count,
            'authentic_count': authentic_count,
            'recent_activity': recent_activity,
            'fake_percentage': round((fake_count / total * 100), 1) if total > 0 else 0,
            'authentic_percentage': round((authentic_count / total * 100), 1) if total > 0 else 0
        }

    # ==================== Fact-Checked News Feed Repository ====================

    def upsert_fact_check(self, record: Dict[str, Any]) -> bool:
        """
        Inserts or updates a fact check record by external_id.
        Returns True if newly inserted, False if updated.
        """
        now = datetime.now(timezone.utc).isoformat()
        external_id = record['external_id']
        fc_id = record.get('id') or str(uuid.uuid4())
        
        claim_text = record.get('claim_text', '').strip()
        claimant = record.get('claimant', '').strip() if record.get('claimant') else None
        publisher = record.get('fact_check_publisher', 'Unknown').strip()
        publisher_rating = record.get('publisher_rating', 'Unrated').strip()
        normalized_verdict = record.get('normalized_verdict', 'Other')
        fact_check_url = record.get('fact_check_url', '').strip()
        review_date = record.get('review_date') or now
        language = record.get('language', 'en')
        category = record.get('category', 'India')
        country = record.get('country', 'India')
        source_api = record.get('source_api', 'external')
        explanation = record.get('explanation', '').strip()
        image_url = record.get('image_url')
        image_source = record.get('image_source')
        image_caption = record.get('image_caption')

        if self.use_mongo:
            existing = self.db.fact_checks.find_one({'external_id': external_id})
            if existing:
                self.db.fact_checks.update_one(
                    {'external_id': external_id},
                    {'$set': {
                        'claim_text': claim_text,
                        'claimant': claimant,
                        'fact_check_publisher': publisher,
                        'publisher_rating': publisher_rating,
                        'normalized_verdict': normalized_verdict,
                        'fact_check_url': fact_check_url,
                        'review_date': review_date,
                        'language': language,
                        'category': category,
                        'country': country,
                        'explanation': explanation,
                        'image_url': image_url,
                        'image_source': image_source,
                        'image_caption': image_caption,
                        'last_synced_at': now
                    }}
                )
                return False
            else:
                doc = {
                    '_id': fc_id,
                    'id': fc_id,
                    'external_id': external_id,
                    'claim_text': claim_text,
                    'claimant': claimant,
                    'fact_check_publisher': publisher,
                    'publisher_rating': publisher_rating,
                    'normalized_verdict': normalized_verdict,
                    'fact_check_url': fact_check_url,
                    'review_date': review_date,
                    'language': language,
                    'category': category,
                    'country': country,
                    'source_api': source_api,
                    'explanation': explanation,
                    'image_url': image_url,
                    'image_source': image_source,
                    'image_caption': image_caption,
                    'first_seen_at': now,
                    'last_synced_at': now
                }
                self.db.fact_checks.insert_one(doc)
                return True
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT id FROM fact_checks WHERE external_id = ?', (external_id,))
                existing = cursor.fetchone()
                if existing:
                    cursor.execute('''
                        UPDATE fact_checks SET
                            claim_text = ?,
                            claimant = ?,
                            fact_check_publisher = ?,
                            publisher_rating = ?,
                            normalized_verdict = ?,
                            fact_check_url = ?,
                            review_date = ?,
                            language = ?,
                            category = ?,
                            country = ?,
                            explanation = ?,
                            image_url = ?,
                            image_source = ?,
                            image_caption = ?,
                            last_synced_at = ?
                        WHERE external_id = ?
                    ''', (
                        claim_text, claimant, publisher, publisher_rating,
                        normalized_verdict, fact_check_url, review_date,
                        language, category, country, explanation,
                        image_url, image_source, image_caption,
                        now, external_id
                    ))
                    conn.commit()
                    return False
                else:
                    cursor.execute('''
                        INSERT INTO fact_checks (
                            id, external_id, claim_text, claimant, fact_check_publisher,
                            publisher_rating, normalized_verdict, fact_check_url,
                            review_date, language, category, country, source_api,
                            explanation, image_url, image_source, image_caption,
                            first_seen_at, last_synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        fc_id, external_id, claim_text, claimant, publisher,
                        publisher_rating, normalized_verdict, fact_check_url,
                        review_date, language, category, country, source_api,
                        explanation, image_url, image_source, image_caption,
                        now, now
                    ))
                    conn.commit()
                    return True

    def get_fact_checks(self, search: Optional[str] = None,
                         language: Optional[str] = None,
                         category: Optional[str] = None,
                         verdict: Optional[str] = None,
                         sort: str = 'newest',
                         limit: int = 12, offset: int = 0,
                         exclude_ids: Optional[List[str]] = None,
                         is_refresh: bool = False,
                         seed: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.use_mongo:
            query = {}
            if language and language != 'all':
                query['language'] = language
            if category and category != 'all':
                query['category'] = category
            if verdict and verdict != 'all':
                query['normalized_verdict'] = verdict
            if exclude_ids:
                query['id'] = {'$nin': exclude_ids}
            if search:
                terms = search.strip().split()
                if terms:
                    query['$and'] = [
                        {'$or': [
                            {'claim_text': {'$regex': t, '$options': 'i'}},
                            {'fact_check_publisher': {'$regex': t, '$options': 'i'}},
                            {'claimant': {'$regex': t, '$options': 'i'}}
                        ]} for t in terms
                    ]
            if is_refresh:
                pipeline = []
                if query:
                    pipeline.append({'$match': query})
                pipeline.append({'$sample': {'size': limit}})
                cursor = self.db.fact_checks.aggregate(pipeline)
                mongo_results = [self._clean_mongo_id(doc) for doc in cursor]
            else:
                sort_dir = -1 if sort == 'newest' else 1
                cursor = self.db.fact_checks.find(query).sort('review_date', sort_dir).skip(offset).limit(limit)
                mongo_results = [self._clean_mongo_id(doc) for doc in cursor]
            if not mongo_results and exclude_ids:
                return self.get_fact_checks(search=search, language=language, category=category, verdict=verdict, sort=sort, limit=limit, offset=0, exclude_ids=None, is_refresh=is_refresh, seed=seed)
            return mongo_results
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                sql = 'SELECT * FROM fact_checks WHERE 1=1'
                params = []

                if language and language != 'all':
                    sql += ' AND language = ?'
                    params.append(language)
                if category and category != 'all':
                    sql += ' AND category = ?'
                    params.append(category)
                if verdict and verdict != 'all':
                    sql += ' AND normalized_verdict = ?'
                    params.append(verdict)
                if exclude_ids:
                    sql += ' AND id NOT IN (SELECT value FROM json_each(?))'
                    params.append(json.dumps(exclude_ids))
                if search:
                    terms = search.strip().split()
                    for t in terms:
                        sql += ' AND (claim_text LIKE ? OR fact_check_publisher LIKE ? OR claimant LIKE ?)'
                        params.extend([f'%{t}%', f'%{t}%', f'%{t}%'])

                if is_refresh:
                    sql += ' ORDER BY RANDOM() LIMIT ?'
                    params.append(limit)
                else:
                    order = 'DESC' if sort == 'newest' else 'ASC'
                    sql += f' ORDER BY review_date {order}, first_seen_at DESC LIMIT ? OFFSET ?'
                    params.extend([limit, offset])

                cursor.execute(sql, params)
                sql_results = [dict(row) for row in cursor.fetchall()]
                if not sql_results and exclude_ids:
                    return self.get_fact_checks(search=search, language=language, category=category, verdict=verdict, sort=sort, limit=limit, offset=0, exclude_ids=None, is_refresh=is_refresh, seed=seed)
                return sql_results

    def get_fact_checks_count(self, search: Optional[str] = None,
                               language: Optional[str] = None,
                               category: Optional[str] = None,
                               verdict: Optional[str] = None) -> int:
        if self.use_mongo:
            query = {}
            if language and language != 'all':
                query['language'] = language
            if category and category != 'all':
                query['category'] = category
            if verdict and verdict != 'all':
                query['normalized_verdict'] = verdict
            if search:
                terms = search.strip().split()
                if terms:
                    query['$and'] = [
                        {'$or': [
                            {'claim_text': {'$regex': t, '$options': 'i'}},
                            {'fact_check_publisher': {'$regex': t, '$options': 'i'}},
                            {'claimant': {'$regex': t, '$options': 'i'}}
                        ]} for t in terms
                    ]
            return self.db.fact_checks.count_documents(query)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                sql = 'SELECT COUNT(*) as count FROM fact_checks WHERE 1=1'
                params = []

                if language and language != 'all':
                    sql += ' AND language = ?'
                    params.append(language)
                if category and category != 'all':
                    sql += ' AND category = ?'
                    params.append(category)
                if verdict and verdict != 'all':
                    sql += ' AND normalized_verdict = ?'
                    params.append(verdict)
                if search:
                    terms = search.strip().split()
                    for t in terms:
                        sql += ' AND (claim_text LIKE ? OR fact_check_publisher LIKE ? OR claimant LIKE ?)'
                        params.extend([f'%{t}%', f'%{t}%', f'%{t}%'])

                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row['count'] if row else 0

    def get_fact_check_by_id(self, fc_id: str) -> Optional[Dict[str, Any]]:
        if self.use_mongo:
            doc = self.db.fact_checks.find_one({'_id': fc_id})
            return self._clean_mongo_id(doc) if doc else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM fact_checks WHERE id = ?', (fc_id,))
                row = cursor.fetchone()
                return dict(row) if row else None

    def get_latest_fact_checks(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.get_fact_checks(limit=limit, offset=0, sort='newest')

    def get_sync_status(self) -> Dict[str, Any]:
        default_status = {
            'last_synced_at': None,
            'last_sync_status': 'never_run',
            'records_count': 0,
            'last_error': None,
            'is_syncing': False
        }
        if self.use_mongo:
            doc = self.db.fact_check_sync.find_one({'_id': 'singleton'})
            if doc:
                res = self._clean_mongo_id(doc)
                res['records_count'] = self.db.fact_checks.count_documents({})
                res['is_syncing'] = bool(res.get('is_syncing', 0))
                return res
            return default_status
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM fact_check_sync WHERE id = "singleton"')
                row = cursor.fetchone()
                cursor.execute('SELECT COUNT(*) as total FROM fact_checks')
                total_row = cursor.fetchone()
                total = total_row['total'] if total_row else 0
                if row:
                    res = dict(row)
                    res['records_count'] = total
                    res['is_syncing'] = bool(res.get('is_syncing', 0))
                    return res
                else:
                    default_status['records_count'] = total
                    return default_status

    def update_sync_status(self, status: str, records_added: int = 0,
                           error: Optional[str] = None, is_syncing: bool = False):
        now = datetime.now(timezone.utc).isoformat()
        is_syncing_val = 1 if is_syncing else 0
        if self.use_mongo:
            self.db.fact_check_sync.update_one(
                {'_id': 'singleton'},
                {'$set': {
                    'id': 'singleton',
                    'last_synced_at': now,
                    'last_sync_status': status,
                    'last_error': error,
                    'is_syncing': is_syncing_val
                }},
                upsert=True
            )
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO fact_check_sync (id, last_synced_at, last_sync_status, records_count, last_error, is_syncing)
                    VALUES ("singleton", ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        last_synced_at = excluded.last_synced_at,
                        last_sync_status = excluded.last_sync_status,
                        last_error = excluded.last_error,
                        is_syncing = excluded.is_syncing
                ''', (now, status, records_added, error, is_syncing_val))
                conn.commit()

    # ==================== Helpers ====================

    @staticmethod
    def _clean_user_dict(doc: Optional[Any]) -> Optional[Dict]:
        if not doc:
            return None
        d = dict(doc)
        d.pop('_id', None)
        # Parse selected_interests to Python list
        raw_interests = d.get('selected_interests')
        if isinstance(raw_interests, str):
            try:
                d['selected_interests'] = json.loads(raw_interests)
            except Exception:
                d['selected_interests'] = []
        elif isinstance(raw_interests, list):
            d['selected_interests'] = raw_interests
        else:
            d['selected_interests'] = []

        d['onboarding_completed'] = bool(d.get('onboarding_completed', 0))
        d['preferred_language'] = d.get('preferred_language') or 'all'
        return d

    @staticmethod
    def _clean_mongo_id(doc: Optional[Dict]) -> Optional[Dict]:
        if not doc:
            return None
        d = dict(doc)
        d.pop('_id', None)
        return d

# Global Database Singleton
db_manager = DatabaseManager()
