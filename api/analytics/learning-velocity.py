"""
Learning Velocity Analytics - Python + pymongo
Measures how fast users learn and progress through phrases.

GET /api/analytics/learning-velocity
Returns: mastery rates, time-to-mastery, daily averages
"""

import sys
import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _helpers import get_db, verify_admin, json_response, handle_options, get_phrase_text


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

            # --- Mastery Rate Pipeline ---
            # Distribution of phrase statuses across all users
            mastery_pipeline = [
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                }},
                {"$project": {
                    "_id": 0,
                    "status": "$_id",
                    "count": 1,
                    "user_count": {"$size": "$unique_users"},
                }},
            ]
            mastery_distribution = list(db.phrase_progress.aggregate(mastery_pipeline))

            # --- Time to Mastery Pipeline ---
            # Average time from first practice to mastery
            time_to_mastery_pipeline = [
                {"$match": {"status": "mastered"}},
                {"$project": {
                    "user_id": 1,
                    "phrase_id": 1,
                    "times_practiced": 1,
                    "days_to_master": {
                        "$divide": [
                            {"$subtract": ["$last_practiced_at", "$created_at"]},
                            86400000,  # milliseconds in a day
                        ]
                    },
                }},
                {"$group": {
                    "_id": None,
                    "avg_days_to_master": {"$avg": "$days_to_master"},
                    "avg_practices_to_master": {"$avg": "$times_practiced"},
                    "min_days": {"$min": "$days_to_master"},
                    "max_days": {"$max": "$days_to_master"},
                    "total_mastered": {"$sum": 1},
                }},
            ]
            ttm_result = list(db.phrase_progress.aggregate(time_to_mastery_pipeline))
            time_to_mastery = ttm_result[0] if ttm_result else {
                "avg_days_to_master": 0, "avg_practices_to_master": 0,
                "min_days": 0, "max_days": 0, "total_mastered": 0,
            }
            time_to_mastery.pop("_id", None)

            # Round float values
            for key in ["avg_days_to_master", "avg_practices_to_master", "min_days", "max_days"]:
                if key in time_to_mastery and time_to_mastery[key]:
                    time_to_mastery[key] = round(time_to_mastery[key], 1)

            # --- Daily Learning Velocity (last 30 days) ---
            velocity_pipeline = [
                {"$match": {"last_practiced_at": {"$gte": thirty_days_ago}}},
                {"$group": {
                    "_id": {
                        "date": {"$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$last_practiced_at"
                        }},
                    },
                    "phrases_practiced": {"$sum": 1},
                    "phrases_mastered": {
                        "$sum": {"$cond": [{"$eq": ["$status", "mastered"]}, 1, 0]}
                    },
                    "unique_learners": {"$addToSet": "$user_id"},
                }},
                {"$project": {
                    "_id": 0,
                    "date": "$_id.date",
                    "phrases_practiced": 1,
                    "phrases_mastered": 1,
                    "unique_learners": {"$size": "$unique_learners"},
                }},
                {"$sort": {"date": 1}},
            ]
            daily_velocity = list(db.phrase_progress.aggregate(velocity_pipeline))

            # --- Top Performing Phrases ---
            # Phrases with highest mastery rate
            top_phrases_pipeline = [
                {"$group": {
                    "_id": "$phrase_id",
                    "total": {"$sum": 1},
                    "mastered": {
                        "$sum": {"$cond": [{"$eq": ["$status", "mastered"]}, 1, 0]}
                    },
                }},
                {"$match": {"total": {"$gte": 3}}},  # At least 3 attempts
                {"$project": {
                    "_id": 0,
                    "phrase_id": "$_id",
                    "total": 1,
                    "mastered": 1,
                    "mastery_rate": {
                        "$round": [
                            {"$multiply": [
                                {"$divide": ["$mastered", "$total"]},
                                100
                            ]},
                            1
                        ]
                    },
                }},
                {"$sort": {"mastery_rate": -1}},
                {"$limit": 10},
            ]
            top_phrases = list(db.phrase_progress.aggregate(top_phrases_pipeline))

            # Enrich with phrase details.
            phrase_ids = [p["phrase_id"] for p in top_phrases]
            phrases_map = {}
            if phrase_ids:
                for phrase in db.phrases.find({"_id": {"$in": phrase_ids}}):
                    phrases_map[phrase["_id"]] = get_phrase_text(phrase, "en")

            for p in top_phrases:
                p["english"] = phrases_map.get(p["phrase_id"], "Unknown")

            return json_response(self, 200, {
                "data": {
                    "runtime": "python",
                    "mastery_distribution": mastery_distribution,
                    "time_to_mastery": time_to_mastery,
                    "daily_velocity": daily_velocity,
                    "top_phrases": top_phrases,
                }
            })

        except Exception as e:
            return json_response(self, 500, {"error": str(e)})
