import fs from 'fs';
import path from 'path';

function extractJpegs(pdfFile, prefix) {
  const buf = fs.readFileSync(`raw_sources/pdfs/${pdfFile}`);
  fs.mkdirSync('raw_sources/test_imgs', { recursive: true });
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
      let lastByte = jpgBuf.length;
      while (lastByte > 0 && (jpgBuf[lastByte - 1] === 0x0a || jpgBuf[lastByte - 1] === 0x0d || jpgBuf[lastByte - 1] === 0x20)) {
        lastByte--;
      }
      const cleanJpg = jpgBuf.subarray(0, lastByte);
      if (cleanJpg.length > 8000) {
        idx++;
        const outPath = path.join('raw_sources/test_imgs', `${prefix}_${idx}.jpg`);
        fs.writeFileSync(outPath, cleanJpg);
        saved.push({ outPath, size: cleanJpg.length });
      }
    }
    pos = endIdx + 9;
  }
  return saved;
}

const targets = [
  ['eh_r0030_0010.pdf', 'handaxe'],      // 주먹도끼
  ['eh_r0040_0010.pdf', 'bangudae'],     // 반구대 암각화
  ['eh_r0010_0010.pdf', 'dolmen'],       // 고인돌
  ['eh_r0011_0010.pdf', 'bronze'],       // 비파형동검/청동기
  ['eh_r0012_0010.pdf', 'songgungni'],   // 반달돌칼/송국리
  ['eh_n0010_0010.pdf', 'chamseongdan'], // 마니산 참성단
  ['eh_r0080_0010.pdf', 'silla'],        // 신라 금관/첨성대
  ['eh_r0050_0010.pdf', 'mural'],        // 고구려 고분벽화
  ['eh_r0070_0010.pdf', 'bulguksa'],     // 불국사/석굴암/무구정광대다라니경
  ['eh_r0114_0010.pdf', 'emille'],       // 성덕대왕신종
  ['eh_r0117_0010.pdf', 'balhae'],       // 발해 석등/이불병좌상
  ['eh_r0150_0010.pdf', 'tripitaka'],    // 팔만대장경
  ['eh_r0160_0010.pdf', 'jikji'],        // 직지심체요절
  ['eh_r0230_0010.pdf', 'hunmin'],       // 훈민정음
  ['eh_r0260_0010.pdf', 'science'],      // 자격루/측우기/앙부일구
  ['eh_n0470_0010.pdf', 'turtleship'],   // 거북선
  ['eh_r0293_0010.pdf', 'donguibogam'],  // 동의보감
  ['eh_r0310_0010.pdf', 'hwaseong'],     // 수원 화성/거중기
  ['eh_n0620_0010.pdf', 'daedong'],      // 대동여지도
  ['eh_r0271_0010.pdf', 'sangpyeong'],   // 상평통보
  ['eh_n0685_0010.pdf', 'dongnip'],      // 독립신문/독립문
  ['eh_r0331_0010.pdf', 'deoksugung'],   // 덕수궁
  ['eh_r0320_0010.pdf', 'samil'],        // 3.1운동 태극기/독립선언서
  ['eh_r0340_0010.pdf', 'imjeong'],      // 임시정부
];

for (const [pdfFile, prefix] of targets) {
  const res = extractJpegs(pdfFile, prefix);
  console.log(prefix, res.length);
}
