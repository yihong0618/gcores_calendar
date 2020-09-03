import sys
import time
from typing import Set

import arrow  # type: ignore

# from sqlalchemy import func

from .db import Audio, Djs, init_db, update_or_create_audio 
from .api import get_audios_page_data, get_djs_data, get_avatar
from .config import LIMIT


class Generator:
    def __init__(self, db_path, file_path):
        self.session = init_db(db_path)
        self.djs_set = set() 
        self.file_path = file_path

    def get_audios_data(self, offset, limit=LIMIT, sort=False):
        return get_audios_page_data(offset, limit, sort)

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

            # for test
            # if offset == 200:
            #     break
            # spider rule
            time.sleep(1)
        return result

    def sync(self, force):

        if force:
            audios_data = self.get_all_audios_data()
        else:
            audios_data = self.get_audios_data(0, 100, True)["data"]

        for audio_data in audios_data:
            created, djs = update_or_create_audio(self.session, audio_data)
            if created:
                for d in djs:
                    self.djs_set.add(d)
                sys.stdout.write("+")
            else:
                sys.stdout.write(".")
            sys.stdout.flush()
        self.session.commit()
        # add djs
        self._add_djs()


    def load(self):
        audios = self.session.query(Audio).order_by(Audio.created_at)

        audios_list = []
        for audio in audios:
            audios_list.append(audio.to_dict())

        return audios_list

    def _add_djs(self):
        djs_ids = self.session.query(Djs.user_id).all()
        djs_ids = set([str(i[0]) for i in djs_ids])
        new_djs_ids = self.djs_set - djs_ids
        if not self.djs_set:
            return
        for djs_id in new_djs_ids:
            r = get_djs_data(djs_id)
            attributes = r["data"]["attributes"]
            thumb = attributes["thumb"] 

            # download thumb
            get_avatar(thumb, djs_id, self.file_path)
            
            djs = Djs(
                user_id = djs_id,
                nickname = attributes["nickname"],
                created_at = attributes["created-at"],
                thumb = thumb,
                intro = attributes["intro"] or ""
            )
            # ignore the djs already in database short fool solution 
            try:
                self.session.add(djs)
                self.session.commit()
            except:
                pass