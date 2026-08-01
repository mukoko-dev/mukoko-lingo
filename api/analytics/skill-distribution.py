"""
Skill Distribution Analytics - Python + pymongo
Analyzes proficiency distribution across the platform.

GET /api/analytics/skill-distribution
Returns: skill averages, level distribution, weakest/strongest skills
"""

import sys
import os
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

            # --- Skill Proficiency Distribution ---
            # Average score per skill with level breakdown
            skill_pipeline = [
                {"$lookup": {
                    "from": "skills",
                    "localField": "skill_id",
                    "foreignField": "_id",
                    "as": "skill"
                }},
                {"$unwind": {"path": "$skill", "preserveNullAndEmptyArrays": True}},
                {"$group": {
                    "_id": {
                        "skill_id": "$skill_id",
                        "skill_name": "$skill.name",
                    },
                    "avg_score": {"$avg": "$current_score"},
                    "max_score": {"$max": "$current_score"},
                    "min_score": {"$min": "$current_score"},
                    "total_learners": {"$sum": 1},
                    "level_counts": {"$push": "$current_level"},
                }},
                {"$project": {
                    "_id": 0,
                    "skill_id": "$_id.skill_id",
                    "skill_name": "$_id.skill_name",
                    "avg_score": {"$round": ["$avg_score", 1]},
                    "max_score": 1,
                    "min_score": 1,
                    "total_learners": 1,
                    "level_counts": 1,
                }},
                {"$sort": {"avg_score": -1}},
            ]
            skill_stats = list(db.user_skills.aggregate(skill_pipeline))

            # Post-process level counts into a distribution
            for stat in skill_stats:
                levels = stat.pop("level_counts", [])
                distribution = {}
                for level in levels:
                    distribution[level] = distribution.get(level, 0) + 1
                stat["level_distribution"] = distribution

            # --- Assessment Performance Pipeline ---
            # Pass rates and average scores per skill
            assessment_pipeline = [
                {"$lookup": {
                    "from": "skills",
                    "localField": "skill_id",
                    "foreignField": "_id",
                    "as": "skill"
                }},
                {"$unwind": {"path": "$skill", "preserveNullAndEmptyArrays": True}},
                {"$group": {
                    "_id": {
                        "skill_id": "$skill_id",
                        "skill_name": "$skill.name",
                    },
                    "total_attempts": {"$sum": 1},
                    "total_passed": {"$sum": {"$cond": ["$passed", 1, 0]}},
                    "avg_score": {"$avg": "$score"},
                    "avg_time": {"$avg": "$time_taken"},
                }},
                {"$project": {
                    "_id": 0,
                    "skill_name": "$_id.skill_name",
                    "total_attempts": 1,
                    "total_passed": 1,
                    "pass_rate": {
                        "$round": [
                            {"$multiply": [
                                {"$divide": ["$total_passed", {"$max": ["$total_attempts", 1]}]},
                                100
                            ]},
                            1
                        ]
                    },
                    "avg_score": {"$round": ["$avg_score", 1]},
                    "avg_time_seconds": {"$round": [{"$ifNull": ["$avg_time", 0]}, 0]},
                }},
                {"$sort": {"pass_rate": -1}},
            ]
            assessment_stats = list(db.user_assessments.aggregate(assessment_pipeline))

            # --- Overall Platform Proficiency ---
            overall_pipeline = [
                {"$group": {
                    "_id": None,
                    "avg_proficiency": {"$avg": "$current_score"},
                    "total_skill_entries": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                }},
                {"$project": {
                    "_id": 0,
                    "avg_proficiency": {"$round": ["$avg_proficiency", 1]},
                    "total_skill_entries": 1,
                    "unique_users_with_skills": {"$size": "$unique_users"},
                }},
            ]
            overall_result = list(db.user_skills.aggregate(overall_pipeline))
            overall = overall_result[0] if overall_result else {
                "avg_proficiency": 0, "total_skill_entries": 0, "unique_users_with_skills": 0
            }

            return json_response(self, 200, {
                "data": {
                    "runtime": "python",
                    "overall": overall,
                    "skills": skill_stats,
                    "assessment_performance": assessment_stats,
                }
            })

        except Exception as e:
            return json_response(self, 500, {"error": str(e)})
