"use strict";

const assert = require("node:assert/strict");
const io = require("../pdf-io.js");
const pdfjs = require("../vendor/build/pdf.min.js");

function samplePdf(lines) {
  const escaped = lines.map((line) => line.replace(/[\\()]/g, "\\$&"));
  const stream = `BT /F1 14 Tf 50 780 Td ${escaped.map((line, index) => `${index ? "0 -22 Td " : ""}(${line}) Tj`).join(" ")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

async function main() {
  const buffer = samplePdf(["Sample Name", "Education", "Example University  2020.09 - 2024.06"]);
  const file = { arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
  const extracted = await io.extractPdfText(file, pdfjs);
  assert.equal(extracted.pageCount, 1);
  assert.match(extracted.text, /Sample Name/);
  assert.match(extracted.text, /Example University/);
  const imageOnly = samplePdf([]);
  await assert.rejects(
    io.extractPdfText({ arrayBuffer: async () => imageOnly.buffer.slice(imageOnly.byteOffset, imageOnly.byteOffset + imageOnly.byteLength) }, pdfjs),
    /OCR/,
  );

  const parsed = io.parsePdfResume([
    "陈示例",
    "13800000000 | resume@example.com",
    "教育经历",
    "示例大学  应用心理 | 硕士  2024.09 - 2027.06",
    "• 相关课程：高级心理测量",
    "工作经历",
    "示例科技  定量研究实习生  2025.07 - 2025.09",
    "• 参与调研执行与质控",
    "技能清单",
    "软件：Excel、Python",
  ].join("\n"), "陈示例_简历.pdf");
  assert.equal(parsed.personal.name, "陈示例");
  assert.equal(parsed.personal.email, "resume@example.com");
  assert.equal(parsed.sections.length, 3);
  assert.equal(parsed.sections[0].items[0].school, "示例大学");
  assert.equal(parsed.sections[1].items[0].role, "定量研究实习生");
  assert.equal(parsed.sections[2].items[0].category, "软件");
  const markdown = io.toMarkdown(parsed);
  assert.match(markdown, /^# 陈示例/m);
  assert.match(markdown, /## 教育经历/);
  assert.match(markdown, /- 参与调研执行与质控/);
  assert.match(io.toMarkdown({ personal: { name: "A" }, sections: [{ type: "custom", title: "链接", items: [{ heading: "[link=https%3A%2F%2Fexample.com]作品集[\/link]", details: [] }] }] }), /\[作品集\]\(https:\/\/example.com\)/);
  const fallback = io.parsePdfResume("李明\n研究经历与成果", "other.pdf");
  assert.equal(fallback.sections[0].type, "custom");
  assert.equal(fallback.sections[0].items[0].heading, "研究经历与成果");
  console.log("PDF extraction, mapping, and Markdown export: OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
