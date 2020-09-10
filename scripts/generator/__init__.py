import sys
import os
import subprocess
import time

from mutagen import mp3

from .db import Audio, Djs, init_db, update_or_create_audio 
from .api import get_audios_page_data, get_djs_data, get_avatar, get_single_audio_info
from .config import LIMIT, IMG_DIR


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
        
        djs = self.session.query(Djs).order_by(Djs.created_at)
        djs_list = []
        for d in djs:
            djs_list.append(d.to_dict())

        return audios_list, djs_list
    
    def add_missing_djs_icon(self):
        djs_ids = self.session.query(Djs.user_id).all()
        djs_ids = set([str(i[0]) for i in djs_ids])
        imgs = os.listdir(IMG_DIR)
        dir_djs_ids = [i.split(".")[0] for i in imgs if i.split(".")[0].isdigit()]
        missing_ids = djs_ids - set(dir_djs_ids)
        for d in missing_ids:
            self.get_thumb_and_download(d)
    
    def add_missing_duration(self):
        missing_audios = list(self.session.query(Audio).filter_by(duration=0).all())
        print(len(missing_audios))
        for audio in missing_audios:
            audio_id = audio.audio_id
            print(audio_id)
            audio_info = get_single_audio_info(audio_id)
            try:
                mp3_url = audio_info["included"][0]["attributes"]["audio"]
            except:
                mp3_url = ""

            p = subprocess.Popen(['node', 'scripts/get_duration.js', mp3_url], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            try:
                new_duration = int(out.decode())
            except:
                new_duration = 0
            print(new_duration)
            audio.duration = new_duration
            self.session.add(audio)
        self.session.commit()


    def get_thumb_and_download(self, djs_id):
        r = get_djs_data(djs_id)
        attributes = r["data"]["attributes"]
        thumb = attributes["thumb"] 
        # download thumb
        get_avatar(thumb, djs_id, self.file_path)
        return attributes
        
    def _add_djs(self):
        djs_ids = self.session.query(Djs.user_id).all()
        djs_ids = set([str(i[0]) for i in djs_ids])
        new_djs_ids = self.djs_set - djs_ids
        if not self.djs_set:
            return
        for djs_id in new_djs_ids:
            attributes = self.get_attributes_and_download()
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