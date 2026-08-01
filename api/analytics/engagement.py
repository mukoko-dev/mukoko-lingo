"""
User Engagement Analytics - Python + pymongo
Tracks retention, session patterns, and content engagement.

GET /api/analytics/engagement
Returns: retention cohorts, session patterns, popular categories
"""

import sys
import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _helpers import get_db, verify_admin, json_response, handle_options


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_GET(self):
        admin = verify_admin(self.headers)
        if not admin:
            return json_response(self, 401, {"error": "Unauthorized"})

        try:
            db = get_db()
            now = datetime.utcnow()
            thirty_days_ago = now - timedelta(days=30)
            thirty_days_ago_str = thirty_days_ago.strftime("%Y-%m-%d")

            # --- Weekly Retention Cohorts ---
            # For each signup week, what % came back in subsequent weeks.
            # No local `profiles` collection — created_at/last_active/
            # deleted_at live on lingo.learner_profiles (see overview.py).
            cohort_pipeline = [
                {"$match": {
                    "deleted_at": None,
                    "created_at": {"$gte": now - timedelta(days=56)},  # 8 weeks
                }},
                {"$project": {
                    "signup_week": {
                        "$dateToString": {
                            "format": "%Y-W%V",
                            "date": "$created_at"
                        }
                    },
                    "last_active_week": {
                        "$dateToString": {
                            "format": "%Y-W%V",
                            "date": "$last_active"
                        }
                    },
                    "days_retained": {
                        "$divide": [
                            {"$subtract": ["$last_active", "$created_at"]},
                            86400000,
                        ]
                    },
                }},
                {"$group": {
                    "_id": "$signup_week",
                    "cohort_size": {"$sum": 1},
                    "retained_1d": {
                        "$sum": {"$cond": [{"$gte": ["$days_retained", 1]}, 1, 0]}
                    },
                    "retained_7d": {
                        "$sum": {"$cond": [{"$gte": ["$days_retained", 7]}, 1, 0]}
                    },
                    "retained_14d": {
                        "$sum": {"$cond": [{"$gte": ["$days_retained", 14]}, 1, 0]}
                    },
                    "retained_30d": {
                        "$sum": {"$cond": [{"$gte": ["$days_retained", 30]}, 1, 0]}
                    },
                }},
                {"$project": {
                    "_id": 0,
                    "week": "$_id",
                    "cohort_size": 1,
                    "retention_1d_pct": {
                        "$round": [{"$multiply": [
                            {"$divide": ["$retained_1d", {"$max": ["$cohort_size", 1]}]}, 100
                        ]}, 1]
                    },
                    "retention_7d_pct": {
                        "$round": [{"$multiply": [
                            {"$divide": ["$retained_7d", {"$max": ["$cohort_size", 1]}]}, 100
                        ]}, 1]
                    },
                    "retention_14d_pct": {
                        "$round": [{"$multiply": [
                            {"$divide": ["$retained_14d", {"$max": ["$cohort_size", 1]}]}, 100
                        ]}, 1]
                    },
                    "retention_30d_pct": {
                        "$round": [{"$multiply": [
                            {"$divide": ["$retained_30d", {"$max": ["$cohort_size", 1]}]}, 100
                        ]}, 1]
                    },
                }},
                {"$sort": {"week": 1}},
            ]
            cohorts = list(db.learner_profiles.aggregate(cohort_pipeline))

            # --- Session Duration Distribution ---
            # session_date is a 'YYYY-MM-DD' string, not a Date (see overview.py).
            session_pipeline = [
                {"$match": {"session_date": {"$gte": thirty_days_ago_str}}},
                {"$bucket": {
                    "groupBy": "$time_spent_minutes",
                    "boundaries": [0, 5, 10, 15, 30, 60, 120, 999],
                    "default": "120+",
                    "output": {
                        "count": {"$sum": 1},
                        "avg_phrases": {"$avg": "$phrases_studied"},
                    },
                }},
                {"$project": {
                    "range": {
                        "$switch": {
                            "branches": [
                                {"case": {"$eq": ["$_id", 0]}, "then": "0-5 min"},
                                {"case": {"$eq": ["$_id", 5]}, "then": "5-10 min"},
                                {"case": {"$eq": ["$_id", 10]}, "then": "10-15 min"},
                                {"case": {"$eq": ["$_id", 15]}, "then": "15-30 min"},
                                {"case": {"$eq": ["$_id", 30]}, "then": "30-60 min"},
                                {"case": {"$eq": ["$_id", 60]}, "then": "1-2 hrs"},
                                {"case": {"$eq": ["$_id", 120]}, "then": "2+ hrs"},
                            ],
                            "default": "Unknown"
                        }
                    },
                    "count": 1,
                    "avg_phrases": {"$round": ["$avg_phrases", 1]},
                }},
            ]
            session_distribution = list(db.study_sessions.aggregate(session_pipeline))

            # --- Popular Categories Pipeline ---
            category_pipeline = [
                {"$match": {"viewed_at": {"$gte": thirty_days_ago}}},
                {"$lookup": {
                    "from": "phrases",
                    "localField": "phrase_id",
                    "foreignField": "_id",
                    "as": "phrase"
                }},
                {"$unwind": "$phrase"},
                {"$group": {
                    "_id": "$phrase.category",
                    "views": {"$sum": 1},
                    "unique_viewers": {"$addToSet": "$user_id"},
                }},
                {"$project": {
                    "_id": 0,
                    "category": "$_id",
                    "views": 1,
                    "unique_viewers": {"$size": "$unique_viewers"},
                }},
                {"$sort": {"views": -1}},
                {"$limit": 10},
            ]
            popular_categories = list(db.phrase_views.aggregate(category_pipeline))

            # --- AI Usage Stats ---
            # There is no local `ai_conversations` collection — Shamwari AI
            # chat lives in the shared shamwari.conversations collection
            # (own database, UUID ids, camelCase fields), not Lingo's. It's
            # a cross-app collection, so scope to Lingo's own conversations
            # via surfaceContext (see lib/db/conversation-shape.ts's
            # SURFACE_CONTEXT). Lingo's `type`/`languageId` fields live
            # nested under shamwari.conversationContext, not top-level.
            shamwari_db = get_db("shamwari")
            ai_pipeline = [
                {"$match": {"surfaceContext": "mukoko-lingo"}},
                {"$facet": {
                    "total_conversations": [{"$count": "count"}],
                    "recent_conversations": [
                        {"$match": {"createdAt": {"$gte": thirty_days_ago}}},
                        {"$count": "count"},
                    ],
                    "by_type": [
                        {"$group": {
                            "_id": "$shamwari.conversationContext.type",
                            "count": {"$sum": 1},
                        }},
                    ],
                    "by_language": [
                        {"$group": {
                            "_id": "$shamwari.conversationContext.languageId",
                            "count": {"$sum": 1},
                        }},
                    ],
                }}
            ]
            ai_result = list(shamwari_db.conversations.aggregate(ai_pipeline))
            ai_stats = ai_result[0] if ai_result else {}

            ai_usage = {
                "total_conversations": ai_stats.get("total_conversations", [{}])[0].get("count", 0) if ai_stats.get("total_conversations") else 0,
                "conversations_30d": ai_stats.get("recent_conversations", [{}])[0].get("count", 0) if ai_stats.get("recent_conversations") else 0,
                "by_type": [{"type": r["_id"], "count": r["count"]} for r in ai_stats.get("by_type", [])],
                "by_language": [{"language": r["_id"], "count": r["count"]} for r in ai_stats.get("by_language", [])],
            }

            return json_response(self, 200, {
                "data": {
                    "runtime": "python",
                    "retention_cohorts": cohorts,
                    "session_distribution": session_distribution,
                    "popular_categories": popular_categories,
                    "ai_usage": ai_usage,
                }
            })

        except Exception as e:
            return json_response(self, 500, {"error": str(e)})
