import json
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase

from .database import get_database
from .environment import EnvVarConfig

from ..helpers import singleton

load_dotenv()


@singleton.singleton
class AppConfig:
    def __init__(self):
        self.env: EnvVarConfig = EnvVarConfig()
        self.db: AsyncIOMotorDatabase = get_database(self.env)


def get_config() -> AppConfig:
    return AppConfig()