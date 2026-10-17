import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const pdfDir = path.resolve('raw_sources/pdfs');
const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf')).sort();

console.log(`Total PDF files: ${files.length}`);

async function main() {
  const summary = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(pdfDir, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const titleLine = lines.slice(0, 6).join(' | ');
      summary.push({ file, pages: data.numpages, titleLine, first300: data.text.replace(/\s+/g, ' ').slice(0, 300) });
    } catch (e) {
      summary.push({ file, error: e.message });
    }
  }
  fs.mkdirSync('raw_sources/extracted_json', { recursive: true });
  fs.writeFileSync('raw_sources/pdf_index.json', JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Done! Saved raw_sources/pdf_index.json');
  console.log('Sample first 15:', summary.slice(0, 15).map(s => `${s.file}: ${s.titleLine}`));
}

main();
