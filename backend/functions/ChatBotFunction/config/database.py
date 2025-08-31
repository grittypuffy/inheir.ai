from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .environment import EnvVarConfig, get_env_config


def get_database(config: EnvVarConfig) -> AsyncIOMotorDatabase:
    client: AsyncIOMotorClient = AsyncIOMotorClient(config.mongodb_uri)
    database: AsyncIOMotorDatabase = client[config.mongodb_db_name]
    return database