"""
Smoke test: every Python analytics route module must import cleanly.

Vercel loads each file in api/analytics/ as a serverless function by path,
not by Python package name, so filenames like `learning-velocity.py` are
never `import`ed the normal way in production either — they have to be
loaded via importlib from their file path, same as this test does. This
catches syntax errors and unresolved imports across the whole directory
without needing a live MongoDB or WorkOS connection.
"""

import importlib.util
import os
import sys

ANALYTICS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ROUTE_MODULES = [
    "overview.py",
    "learning-velocity.py",
    "skill-distribution.py",
    "engagement.py",
]


def _load(filename):
    path = os.path.join(ANALYTICS_DIR, filename)
    module_name = f"_analytics_smoke_{filename.replace('-', '_').replace('.py', '')}"
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def setup_module(_module):
    if ANALYTICS_DIR not in sys.path:
        sys.path.insert(0, ANALYTICS_DIR)


def test_all_route_modules_import_without_error():
    for filename in ROUTE_MODULES:
        module = _load(filename)
        assert hasattr(module, "handler"), f"{filename} must define a `handler` class for Vercel's Python runtime"
