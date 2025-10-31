from flask import Flask, request, jsonify
import os
import pdfplumber
import docx
from transformers import pipeline

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Hugging Face summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def extract_text(file_path, filename):
    text = ""
    ext = filename.split('.')[-1].lower()
    if ext == "pdf":
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    elif ext in ["docx", "doc"]:
        doc = docx.Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type")
    return text

@app.route('/summarize', methods=['POST'])
def summarize():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        text = extract_text(file_path, file.filename)
        if len(text.strip()) == 0:
            return jsonify({'error': 'No text found in file'}), 400

        # Hugging Face summarization (split long text)
        max_chunk = 1000
        summaries = []
        for i in range(0, len(text), max_chunk):
            chunk = text[i:i+max_chunk]
            summary = summarizer(chunk, max_length=150, min_length=50, do_sample=False)
            summaries.append(summary[0]['summary_text'])

        final_summary = "\n".join(summaries)
        return jsonify({'summary': final_summary})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(file_path)

if __name__ == '__main__':
    app.run(port=8000)
