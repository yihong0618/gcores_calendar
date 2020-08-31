import requests
from .config import AUDIOS_API


def get_audios_page_data(offset, limit, sort):
    sort_at = "published-at"
    if sort:
        sort_at = "-published-at"
    r = requests.get(AUDIOS_API.format(limit=limit, offset=offset, sort_at=sort_at))
    if r.status_code >= 200:
        return r.json()
    raise Exception("Something wrong get data")
