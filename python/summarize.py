import sys, json
from transformers import pipeline
import mammoth
import pdfminer.high_level

file_path = sys.argv[1]

# Extract text from PDF/DOCX
if file_path.endswith(".pdf"):
    text = pdfminer.high_level.extract_text(file_path)
elif file_path.endswith(".docx"):
    with open(file_path, "rb") as f:
        text = mammoth.extract_raw_text(f).value
else:
    text = ""

# Clean text
text = " ".join(text.split())

# Load BART summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Split into chunks (~700 words per chunk)
words = text.split()
chunks = [" ".join(words[i:i+700]) for i in range(0, len(words), 700)]

# Summarize each chunk
summaries = []
for chunk in chunks:
    summary = summarizer(chunk, max_length=200, min_length=50, do_sample=False)
    summaries.append(summary[0]['summary_text'])

# Output as JSON
print(json.dumps(summaries))
