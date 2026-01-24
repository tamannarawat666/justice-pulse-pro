from flask import Flask, request, jsonify
from flask_cors import CORS
from pdfminer.high_level import extract_text
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:8080"])   # VERY IMPORTANT — Fixes "Failed to fetch"

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
MODEL = "facebook/bart-large-cnn"


def summarize_text(text):
    response = requests.post(
        f"https://api-inference.huggingface.co/models/{MODEL}",
        headers={"Authorization": f"Bearer {HF_API_KEY}"},
        json={"inputs": text, "parameters": {"max_length": 250}}
    )

    try:
        return response.json()[0]["summary_text"]
    except Exception as e:
        print("Error:", e)
        return None


@app.route("/summarize", methods=["POST"])
def summarize_api():
    print("🔥 Request received")

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    uploaded_file = request.files["file"]

    temp_path = f"temp_{uploaded_file.filename}"
    uploaded_file.save(temp_path)

    try:
        text = extract_text(temp_path)
    except Exception:
        os.remove(temp_path)
        return jsonify({"status": "error", "message": "Could not extract PDF text"}), 500

    os.remove(temp_path)

    if len(text.strip()) < 20:
        return jsonify({"status": "error", "message": "Document contains too little text"}), 400

    summary = summarize_text(text)

    if summary is None:
        return jsonify({"status": "error", "message": "Summarization failed"}), 500

    return jsonify({
        "status": "success",
        "summary": summary
    }), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000)
