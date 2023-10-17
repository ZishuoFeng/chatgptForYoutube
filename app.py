from flask import Flask, jsonify, request, json
from flask_cors import CORS, cross_origin
import requests
import openai
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled

app = Flask(__name__)
CORS(app)
info_response = None
openai.api_key = "Placeholder for OpenAI API"
messages=[{"role": "system", "content": "You are a YouTube video analyzer"}] # Use this "messages" to store the context information

# Wipe out the useless information to reduce the input token
def info_preprocess(info):
    info["snippet"].pop("thumbnails")
    return info

# Use this route to access Youtube API, get the information about the video, and feed it to chatGPT
@app.route('/get_video_info')
@cross_origin(origin='http://localhost:63342', headers=['Content-Type', 'Authorization'])
def get_video_info():
    videoId = request.args.get('videoId')
    caption = ""
    try:
        if videoId:
            API_KEY = "Placeholder for Youtube API"
            info_url = f"https://www.googleapis.com/youtube/v3/videos?id={videoId}&key={API_KEY}&part=snippet,contentDetails,statistics,status"
            info_response = requests.get(info_url)

            # caption_url = f"https://www.googleapis.com/youtube/v3/captions?videoId={videoId}&key={API_KEY}&part=snippet"
            # caption_response = requests.get(caption_url)
            # caption_result = caption_response.json()
            # print(caption_result)

            info_preprocess(info_response.json()['items'][0])
            try: # This API cannot get the caption from video whose caption isn't available on Youtube, so try-except is needed in case it cannot get the caption successfully
                results = YouTubeTranscriptApi.get_transcript(videoId)
                for item in results:
                    caption += item['text']
                messages.append({"role": "user",
                                 "content": "This is the caption of this video: "+ caption + "Please take a look. "})
            except TranscriptsDisabled:
                print(f"Subtitles are disabled for the video with ID {videoId}.")

            messages.append({"role": "user",
                             "content": "This is the information about the video your user are browsing: " + str(json.dumps(info_response.json()['items'][0])) + "Could you read it and only tell your user that you are ready for questions? Also, don't forget to say hi. "})
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=300 # limit the response to 300 token to prevent it to be too long
            )
            response = response.choices[0].message['content']
            messages.append({"role": "assistant", "content": response})
            print(response)
            response = {
                "response": response
            }
            return response
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}."}), 500

# Use this route to chat with chatGPT
@app.route('/access_gpt')
@cross_origin(origin='http://localhost:63342', headers=['Content-Type', 'Authorization'])
def access_gpt():
    # Get the question asked by users from frontend
    prompt = request.args.get('question')
    messages.append({"role": "user", "content": prompt})
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=300
    )
    response = response.choices[0].message['content']
    messages.append({"role": "assistant", "content": response})
    print(response)
    response = {
        "response": response
    }
    return response

if __name__ == '__main__':
    app.run()
