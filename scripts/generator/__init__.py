import sys
import time

import arrow  # type: ignore

# from sqlalchemy import func

from .db import Audio, init_db, update_or_create_audio
from .api import get_audios_page_data
from .config import LIMIT


class Generator:
    def __init__(self, db_path):
        self.session = init_db(db_path)

    def get_audios_data(self, offset, limit=LIMIT, sort=False):
        return get_audios_page_data(offset, LIMIT, sort)

    def get_all_audios_data(self):
        offset = 0
        result = []
        has_next = True
        while has_next:
            r = self.get_audios_data(offset=offset, limit=LIMIT, sort=True)
            if len(r["data"]) < LIMIT:
                has_next = False
            result.extend(r["data"])
            offset += 100
            # spider rule
            time.sleep(1)
        return result

    def sync(self, force):

        if force:
            audios_data = self.get_all_audios_data()
        else:
            audios_data = self.get_audios_data(0)["data"]

        for audio_data in audios_data:
            created = update_or_create_audio(self.session, audio_data)
            if created:
                sys.stdout.write("+")
            else:
                sys.stdout.write(".")
            sys.stdout.flush()
        self.session.commit()

    def load(self):
        audios = self.session.query(Audio).order_by(Audio.created_at)

        audios_list = []
        for audio in audios:
            audios_list.append(audio.to_dict())

        return audios_list