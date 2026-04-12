from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Integer,
    create_engine,
    Boolean,
    DateTime,
    select,
)
from sqlalchemy.orm import relationship, sessionmaker, DeclarativeBase
from functools import wraps
import logging
from pydantic import EmailStr, BaseModel, field_validator
import bcrypt
import socket
import requests
import psutil
import platform
from datetime import datetime, timezone

format = "%(asctime)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.INFO, format=format)
logger = logging.getLogger(__name__)


def collect_device_info() -> dict[str, str]:
    return {
        "device": platform.platform(),
        "device_name": platform.node(),
        "machine": platform.machine(),
        "os": platform.system(),
        "hostname": socket.gethostname(),
        "memory": f"{round(psutil.virtual_memory().total / (1024**3),2)} GB",
    }


def fetch_network_info() -> dict[str, str]:
    try:
        data: dict = requests.get("https://ipinfo.io/json").json()
        return {
            "country": data.get("country", "unknown"),
            "city": data.get("city", "unknown"),
            "ip": data.get("ip", "unknown"),
        }
    except Exception as e:
        logger.warning(f"Could not fetch network info: {str(e)}")
        return {"country": "unknown", "city": "unknown", "ip": "unknown"}


class Base(DeclarativeBase):
    pass


class UserAlreadyExists(Exception):
    def __init__(self, username: str, *args: object) -> None:
        super().__init__(f"User {username} already exists - args=({args})")

class MovieAlreadyExists(Exception):
    def __init__(self,m ,*args: object) -> None:
        super().__init__(f"Movide {m.title} - {m.content[:20]}... already exists - args=({args})")
class UserScheme(BaseModel):
    username: str
    password: str
    email: EmailStr

    @field_validator("username")
    @classmethod
    def is_valid_username(cls, v):
        if len(v) < 5:
            raise ValueError("Username must be longer than 5 characters.")
        forbidden = set("@-.!'?*)(/{}%+^&")
        if forbidden & set(v):
            raise ValueError("Username shouldn't have ant special characters.")
        return v


class MovieScheme(BaseModel):
    title: str
    content: str

class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True)
    username    = Column(String, unique=True, nullable=False)
    password    = Column(String, nullable=False)
    email       = Column(String, unique=True, nullable=False)
    device      = Column(String, nullable=False)
    device_name = Column(String, nullable=False)
    machine     = Column(String, nullable=False)
    os          = Column(String, nullable=False)
    memory      = Column(String, nullable=False)
    hostname    = Column(String, nullable=False)
    country     = Column(String, nullable=False)
    city        = Column(String, nullable=False)
    ip          = Column(String, nullable=False)
    is_deleted  = Column(Boolean, nullable=False, default=False)
    created_at  = Column(
        String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat
    )
    last_seen   = Column(
        String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat
    )
    watched = relationship("Watched", back_populates="user")


class Watched(Base):
    __tablename__ = "watched_movies"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    title       = Column(String, nullable=True)
    content     = Column(String, nullable=True)
    user        = relationship("User", back_populates="watched")


class UserManager:
    def __init__(self, db_path: str, echo: bool = False):
        self.engine = create_engine(f"sqlite:///{db_path}", echo=echo)
        Base.metadata.create_all(bind=self.engine)
        self.session = sessionmaker(bind=self.engine)

    @staticmethod
    def catch_error(exceptions: tuple = (Exception,)):
        def decorator(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                try:
                    logger.info(f"Running function: {func.__name__}")
                    result = func(self, *args, **kwargs)
                    logger.info(f"Done function: {func.__name__}")
                    return result
                except exceptions as e:
                    logger.error(
                        f"Error in function: {func.__name__} - error: {str(e)}"
                    )
                    raise

            return wrapper

        return decorator

    @staticmethod
    def transaction(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            logger.info(f"Running function: {func.__name__}")
            with self.session() as session:
                try:
                    result = func(self, session, *args, **kwargs)
                    session.commit()
                    logger.info(f"Done function: {func.__name__}")
                    return result
                except Exception as e:
                    session.rollback()
                    logger.error(f"Error in function: {func.__name__} - {str(e)}")
                    raise

        return wrapper

    def user_exists(self, session, username: str) -> bool:
        stmd = select(User).where(User.username == username)
        user = session.execute(stmd).scalar_one_or_none()
        return user is not None

    @transaction
    def add_user(self, session, user: UserScheme) -> bool:
        hashed          = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
        network_data    = fetch_network_info()
        device_info     = collect_device_info()
        created_at      = datetime.now(timezone.utc).isoformat()

        user = User(
            username=user.username,
            password=hashed,
            email=user.email,
            device=device_info.get("device"),
            device_name=device_info.get("device_name"),
            machine=device_info.get("machine"),
            os=device_info.get("os"),
            memory=device_info.get("memory"),
            hostname=device_info.get("hostname"),
            country=network_data.get("country"),
            city=network_data.get("city"),
            ip=network_data.get("ip"),
            is_deleted=False,
            created_at=created_at,
            last_seen=created_at,
        )   #type: ignore

        is_user_exists = session.query(User).filter_by(username=user.username).first()
        if is_user_exists:
            logger.error(f"User already exists: {user.username}")
            raise UserAlreadyExists(user.username)
        session.add(user)
        logger.info(f"Added user: {user}")
        return True


class MovieManager:
    def __init__(self, db_path: str, echo: bool = False) -> None:
        self.engine = create_engine(f"sqlite:///{db_path}", echo=echo)
        self.session = sessionmaker(bind=self.engine)
    
    @staticmethod
    def transaction(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            logger.info(f"Running function: {func.__name__}")
            with self.session() as session:
                try:
                    result = func(self, session, *args, **kwargs)
                    session.commit()
                    logger.info(f"Done function: {func.__name__}")
                    return result
                except Exception as e:
                    session.rollback()
                    logger.error(f"Error in function: {func.__name__} - {str(e)}")
                    raise

        return wrapper

    @transaction
    def add_movie(self,session,username:str ,m:MovieScheme) -> bool:
        is_exist = session.query(Watched).filter_by(title=m.title,content=m.content).first()
        user = session.query(User).filter_by(username=username).first()
        if not user:
            logger.error(f"User not found: {username}")
            return False
        if is_exist:
            raise MovieAlreadyExists(m=m)
        new_movie = Watched(user_id=user.id,title=m.title,content=m.content)
        session.add(new_movie)
        return True

users = UserManager("database.db", echo=True)
movies = MovieManager("database.db", echo=True)
new_user  = UserScheme(username="enes121233", password="1234", email="a@gmail.com")
new_movie = MovieScheme(title="test123",content="test filmi bla bla")
#users.add_user(new_user)  # type: ignore
#movies.add_movie(username="enes121233",m=new_movie) #type:ignore

