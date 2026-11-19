"""
Pytest configuration for AgentChain API tests.
Ensures services/api is added to sys.path regardless of execution working directory.
"""
import sys
import os

api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)
