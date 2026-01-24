import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000/summarize'; // Python summarizer server

export async function summarizeFile(filePath, filename) {
  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), filename);

    const response = await fetch(PYTHON_SERVER_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Python summarizer error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    console.error('Error in summarizeFile:', err.message);
    throw err;
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Failed to delete uploaded file:', filePath);
    }
  }
}
