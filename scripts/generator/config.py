# CONST
LIMIT = 100
IMG_DIR = "src/images/"


# APIS
AUDIOS_API = "https://www.gcores.com/gapi/v1/radios?page[limit]={limit}&page[offset]={offset}&sort={sort_at}&include=category,user,djs"
DJS_API = "https://www.gcores.com/gapi/v1/users/{djs_id}"
AVATAR_PNG_URL = "https://image.gcores.com/{thumb}?x-oss-process=image/resize,limit_1,m_fill,w_72,h_72/quality,q_90/bright,-20"
AUDIO_INFO_URL = "https://www.gcores.com/gapi/v1/radios/{audio_id}?include=media"
