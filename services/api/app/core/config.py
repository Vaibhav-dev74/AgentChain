"""
Configuration module for AgentChain API
"""
import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # Database: defaults to SQLite async for seamless local testing, supports PostgreSQL
    DATABASE_URL: str = Field(
        default="sqlite:///./agentchain.db",
        description="SQLAlchemy database connection string",
    )

    # JWT Authentication
    JWT_SECRET: str = "agentchain-enterprise-super-secure-jwt-secret-key-32b-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 120

    # AI Agent / LLM Configuration
    LLM_PROVIDER: str = "gemini"  # "gemini", "openai", or "mock"
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = "gemini-1.5-flash"
    MAX_TOKENS: int = 2048
    TEMPERATURE: float = 0.2

    # Blockchain EVM Configuration
    ETHEREUM_RPC_URL: str = "http://127.0.0.1:8545"
    CHAIN_ID: int = 31337
    AGENT_REGISTRY_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    POLICY_MANAGER_ADDRESS: str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    ACTION_LEDGER_ADDRESS: str = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    REWARD_VAULT_ADDRESS: str = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
    DEPLOYER_PRIVATE_KEY: str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
