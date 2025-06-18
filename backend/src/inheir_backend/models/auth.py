from pydantic import BaseModel, EmailStr, field_validator
import re


class SignUpRequest(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    role: str = "User"

    @field_validator('username')
    def validate_username(cls, value):
        if not re.match(r"^\w+$", value):
            raise ValueError(
                'Username must have only alphabets, digits and underscores')
        return value

    @field_validator('full_name')
    def validate_full_name(cls, value):
        if not re.match("^([A-Za-z ])+$", value):
            raise ValueError(
                'Full name must have only alphabets, digits and underscores')
        return value.title()

    @field_validator('password')
    def validate_password(cls, value):
        if len(value) < 8 and len(value) > 12:
            raise ValueError('Password must be between 8-12 characters')
        return value

    class Config:
        str_min_length = 1


class SignInRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    token: str | None