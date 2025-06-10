from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from ..helpers import singleton

load_dotenv()


@singleton.singleton
class EnvVarConfig(BaseSettings):
    environment: str
    cookie_domain: str
    api_domain: str
    frontend_url: str

    class EnvVarConfig:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_env_config():
    return EnvVarConfig()