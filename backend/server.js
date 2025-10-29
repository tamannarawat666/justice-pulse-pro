const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Folder to temporarily store uploaded PDFs
const upload = multer({ dest: 'uploads/' });

// Endpoint to upload and extract PDF
app.post('/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    const pdfBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(pdfBuffer);

    // Delete the PDF after reading
    fs.unlinkSync(req.file.path);

    res.json({ text: data.text });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error extracting PDF');
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('PDF Extractor Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
