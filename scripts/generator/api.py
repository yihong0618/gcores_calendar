import requests
from .config import AUDIOS_API, DJS_API, AVATAR_PNG_URL


def get_audios_page_data(offset, limit, sort):
    sort_at = "published-at"
    if sort:
        sort_at = "-published-at"
    r = requests.get(AUDIOS_API.format(limit=limit, offset=offset, sort_at=sort_at))
    if r.status_code >= 200:
        return r.json()
    raise Exception("Something wrong get page data")


def get_djs_data(djs_id):
    url = DJS_API.format(djs_id=djs_id)
    r = requests.get(url)
    if r.status_code >= 200:
        return r.json()
    raise Exception("Something wrong get djs data")



def get_avatar(thumb, djs_id, file_path):
    """
    save flil name as djs id
    """
    try:
        url = AVATAR_PNG_URL.format(thumb=thumb)
        end =  "." + url.split("/")[3].split("?")[0].split(".")[-1]
        response = requests.get(url)
        if response.status_code == 200:
            with open(file_path + djs_id + end, 'wb') as f:
                f.write(response.content)
        return True
    except:
        return False
