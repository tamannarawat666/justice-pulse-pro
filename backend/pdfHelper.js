const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Folder to temporarily store uploaded PDFs
const upload = multer({ dest: 'uploads/' });

// Function to extract PDF text
async function extractPDF(filePath) {
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(pdfBuffer);

    // Delete the PDF after reading
    fs.unlinkSync(filePath);

    return data.text;
}

module.exports = { extractPDF, upload };
