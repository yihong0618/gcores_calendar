from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

AUDIO_KEYS = [
    "audio_id",
    "title",
    "desc",
    "duration",
    "created_at",
    "likes_count",
    "bookmarks_count",
    "comments_count",
    "djs",
    "category_id",
    "is_free"
]


class Audio(Base):
    __tablename__ = "audio"

    audio_id = Column(Integer, primary_key=True)
    title = Column(String)
    desc = Column(String)
    duration = Column(Integer)
    created_at = Column(String)
    likes_count = Column(Integer)
    bookmarks_count = Column(Integer)
    comments_count = Column(Integer)
    djs = Column(String)
    category_id = Column(String)
    thumb = Column(String)
    is_free = Column(Boolean)

    def to_dict(self):
        out = {}
        for key in AUDIO_KEYS:
            attr = getattr(self, key)
            out[key] = attr
        return out


class Djs(Base):
    __tablename__ = "djs"

    user_id = Column(Integer, primary_key=True)
    nickname = Column(String)
    created_at = Column(String)
    thumb = Column(String)
    intro = Column(String)


class Category(Base):
    __tablename__ = "category"

    category_id = Column(Integer, primary_key=True)
    logo = Column(String)
    name = Column(String)
    subscriptions_count = Column(Integer)


def get_djs(relationships_data):
    djs_users = relationships_data["djs"].get("data")
    print(djs_users)
    if not djs_users:
        return []
    return [i["id"] for i in djs_users]


def get_category_id(relationships_data):
    category_data = relationships_data["category"].get("data")
    if not category_data:
        return ""
    return category_data.get("id", "")


def update_or_create_audio(session, audio_data):
    created = False
    try:
        audio_id = int(audio_data["id"])
        attributes = audio_data["attributes"]
        relationships_data = audio_data["relationships"]
    except:
        return
    audio = session.query(Audio).filter_by(audio_id=audio_id).first()

    if not audio:
        audio = Audio(
            audio_id=audio_id,
            title=attributes["title"],
            desc=attributes["desc"],
            duration=int(attributes["duration"]),
            created_at=attributes["created-at"],
            likes_count=attributes["likes-count"],
            bookmarks_count=attributes["bookmarks-count"],
            comments_count=attributes["comments-count"],
            djs=str(get_djs(relationships_data)),
            category_id=get_category_id(relationships_data),
            thumb=attributes["thumb"],
            is_free=attributes["is-free"],
        )
        created = True
    else:
        audio.likes_count = attributes["likes-count"]
        audio.comments_count = attributes["comments-count"]
        audio.bookmarks_count = attributes["bookmarks-count"]

    session.add(audio)
    return created


def add_to_djs(user_id, djs_data):
    pass


def add_to_category(user_id, djs_data):
    pass


def init_db(db_path):
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)
    return session()
