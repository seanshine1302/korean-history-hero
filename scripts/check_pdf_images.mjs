import fs from 'fs';
import path from 'path';

function extractJpegsFromPdf(pdfPath, outDir, prefix) {
  const buf = fs.readFileSync(pdfPath);
  fs.mkdirSync(outDir, { recursive: true });
  let pos = 0;
  let idx = 0;
  const saved = [];
  while (pos < buf.length) {
    const streamIdx = buf.indexOf('stream', pos, 'latin1');
    if (streamIdx === -1) break;
    const endIdx = buf.indexOf('endstream', streamIdx, 'latin1');
    if (endIdx === -1) break;
    const slice = buf.subarray(streamIdx, endIdx);
    const soi = slice.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
    if (soi !== -1) {
      const jpgBuf = slice.subarray(soi);
      // Trim trailing whitespace before endstream
      let lastByte = jpgBuf.length;
      while (lastByte > 0 && (jpgBuf[lastByte - 1] === 0x0a || jpgBuf[lastByte - 1] === 0x0d || jpgBuf[lastByte - 1] === 0x20)) {
        lastByte--;
      }
      const cleanJpg = jpgBuf.subarray(0, lastByte);
      if (cleanJpg.length > 8000) {
        idx++;
        const outPath = path.join(outDir, `${prefix}_${idx}.jpg`);
        fs.writeFileSync(outPath, cleanJpg);
        saved.push({ outPath, size: cleanJpg.length });
      }
    }
    pos = endIdx + 9;
  }
  return saved;
}

const s1 = extractJpegsFromPdf('raw_sources/pdfs/eh_r0020_0010.pdf', 'raw_sources/test_imgs', 'amsadong');
const s2 = extractJpegsFromPdf('raw_sources/pdfs/eh_r0092_0010.pdf', 'raw_sources/test_imgs', 'incense');
const s3 = extractJpegsFromPdf('raw_sources/pdfs/eh_r0140_0010.pdf', 'raw_sources/test_imgs', 'celadon');
console.log('Extracted:', { s1, s2, s3 });
