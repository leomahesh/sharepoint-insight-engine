import requests

url = "http://localhost:8000/api/v1/config/upload"
files = {'files': open('test_realtime.txt', 'rb')}

try:
    response = requests.post(url, files=files)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(e)
