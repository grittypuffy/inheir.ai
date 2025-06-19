from pydantic import BaseModel
from typing import Literal

class Report(BaseModel):
    full_name: str
    address: str
    location: str
    message: str
    verdict: Literal["Pending", "Verified", "Not Verified"] = "Pending"
