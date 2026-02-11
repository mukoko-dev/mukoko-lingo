"""
Platform Analytics Overview - Python + pymongo
Demonstrates aggregation pipelines for complex analytics.

GET /api/analytics/overview
Returns: growth rates, user funnel, activity trends
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
            seven_days_ago = now - timedelta(days=7)
            fourteen_days_ago = now - timedelta(days=14)
            thirty_days_ago = now - timedelta(days=30)

            # --- Growth Rate Pipeline ---
            # Compare this week vs last week for new users
            growth_pipeline = [
                {"$match": {"deleted_at": None}},
                {"$facet": {
                    "this_week": [
                        {"$match": {"created_at": {"$gte": seven_days_ago}}},
                        {"$count": "count"}
                    ],
                    "last_week": [
                        {"$match": {"created_at": {
                            "$gte": fourteen_days_ago,
                            "$lt": seven_days_ago
                        }}},
                        {"$count": "count"}
                    ],
                    "total": [{"$count": "count"}],
                    "active_this_week": [
                        {"$match": {"last_active": {"$gte": seven_days_ago}}},
                        {"$count": "count"}
                    ],
                }}
            ]
            growth_result = list(db.profiles.aggregate(growth_pipeline))
            growth = growth_result[0] if growth_result else {}

            this_week = growth.get("this_week", [{}])[0].get("count", 0) if growth.get("this_week") else 0
            last_week = growth.get("last_week", [{}])[0].get("count", 0) if growth.get("last_week") else 0
            total_users = growth.get("total", [{}])[0].get("count", 0) if growth.get("total") else 0
            active_users = growth.get("active_this_week", [{}])[0].get("count", 0) if growth.get("active_this_week") else 0

            growth_rate = ((this_week - last_week) / max(last_week, 1)) * 100

            # --- Learning Activity Pipeline ---
            # Daily study sessions over last 30 days
            activity_pipeline = [
                {"$match": {"session_date": {"$gte": thirty_days_ago}}},
                {"$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$session_date"}
                    },
                    "sessions": {"$sum": 1},
                    "phrases_studied": {"$sum": "$phrases_studied"},
                    "total_minutes": {"$sum": "$time_spent_minutes"},
                    "unique_users": {"$addToSet": "$user_id"},
                }},
                {"$project": {
                    "_id": 0,
                    "date": "$_id",
                    "sessions": 1,
                    "phrases_studied": 1,
                    "total_minutes": 1,
                    "unique_users": {"$size": "$unique_users"},
                }},
                {"$sort": {"date": 1}},
            ]
            daily_activity = list(db.study_sessions.aggregate(activity_pipeline))

            # --- User Funnel Pipeline ---
            # How many users reach each milestone
            funnel_pipeline = [
                {"$match": {"deleted_at": None}},
                {"$lookup": {
                    "from": "phrase_progress",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "progress"
                }},
                {"$lookup": {
                    "from": "bookmarks",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "bookmarks"
                }},
                {"$lookup": {
                    "from": "user_assessments",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "assessments"
                }},
                {"$project": {
                    "has_progress": {"$gt": [{"$size": "$progress"}, 0]},
                    "has_bookmarks": {"$gt": [{"$size": "$bookmarks"}, 0]},
                    "has_assessments": {"$gt": [{"$size": "$assessments"}, 0]},
                    "mastered_count": {
                        "$size": {
                            "$filter": {
                                "input": "$progress",
                                "cond": {"$eq": ["$$this.status", "mastered"]}
                            }
                        }
                    },
                }},
                {"$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "started_learning": {"$sum": {"$cond": ["$has_progress", 1, 0]}},
                    "bookmarked_phrases": {"$sum": {"$cond": ["$has_bookmarks", 1, 0]}},
                    "took_assessment": {"$sum": {"$cond": ["$has_assessments", 1, 0]}},
                    "mastered_any": {"$sum": {"$cond": [{"$gt": ["$mastered_count", 0]}, 1, 0]}},
                }},
            ]
            funnel_result = list(db.profiles.aggregate(funnel_pipeline))
            funnel = funnel_result[0] if funnel_result else {
                "total": 0, "started_learning": 0,
                "bookmarked_phrases": 0, "took_assessment": 0, "mastered_any": 0
            }
            funnel.pop("_id", None)

            # --- Content Stats ---
            total_phrases = db.phrases.count_documents({})
            total_bookmarks = db.bookmarks.count_documents({})
            total_views = db.phrase_views.count_documents({})
            pending_moderation = db.moderation_alerts.count_documents({"status": "pending"})

            return json_response(self, 200, {
                "data": {
                    "runtime": "python",
                    "generated_at": now.isoformat(),
                    "growth": {
                        "total_users": total_users,
                        "active_users_7d": active_users,
                        "new_users_this_week": this_week,
                        "new_users_last_week": last_week,
                        "growth_rate_pct": round(growth_rate, 1),
                    },
                    "content": {
                        "total_phrases": total_phrases,
                        "total_bookmarks": total_bookmarks,
                        "total_views": total_views,
                        "pending_moderation": pending_moderation,
                    },
                    "daily_activity": daily_activity,
                    "user_funnel": funnel,
                }
            })

        except Exception as e:
            return json_response(self, 500, {"error": str(e)})
