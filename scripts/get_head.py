import requests

url = "https://image.gcores.com/f9d726e1-b4c7-4a04-b2c6-45309dc38420.jpg?x-oss-process=image/resize,limit_1,m_fill,w_72,h_72/quality,q_90/bright,-20"
response = requests.get(url)
if response.status_code == 200:
    with open("test.png", 'wb') as f:
        f.write(response.content)