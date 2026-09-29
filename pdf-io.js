"use strict";

(function (root) {
  const HEADINGS = [
    { pattern: /^(教育经历|教育背景|教育信息|学历背景|education)$/i, type: "education" },
    { pattern: /^(工作经历|工作经验|实习经历|实习经验|职业经历|校园经历|work experience|professional experience|internships?)$/i, type: "experience" },
    { pattern: /^(项目经历|项目经验|个人项目|project experience|projects?)$/i, type: "project" },
    { pattern: /^(技能清单|专业技能|个人技能|技能|技术栈|skills?|technical skills)$/i, type: "skills" },
    { pattern: /^(个人简介|自我评价|获奖经历|荣誉奖项|奖项荣誉|证书|语言能力|其他信息|兴趣爱好|summary|awards?|certifications?)$/i, type: "custom" },
  ];
  const DATE_PATTERN = /(?:19|20)\d{2}(?:\s*[年./-]\s*\d{1,2}\s*月?)?/g;
  const BULLET_PATTERN = /^[\s•●·▪◦*-]+/;

  async function extractPdfText(file, pdfjsLib) {
    if (!pdfjsLib?.getDocument) throw new Error("PDF 解析器未加载，请刷新页面重试。");
    pdfjsLib.GlobalWorkerOptions.workerSrc = typeof document === "object"
      ? new URL("./vendor/build/pdf.worker.min.js", document.baseURI).href
      : require.resolve("./vendor/build/pdf.worker.min.js");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const task = pdfjsLib.getDocument({ data: bytes, useWorkerFetch: false, useSystemFonts: true, isEvalSupported: false });
    try {
      const pdf = await task.promise;
      const pages = [];
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        pages.push(joinPageLines(content.items));
        page.cleanup();
      }
      const text = pages.filter(Boolean).join("\n\n").trim();
      if (!/[\p{L}\p{N}]/u.test(text)) {
        throw new Error("PDF 中没有可提取文字。扫描图片 PDF 请先进行 OCR 文字识别。");
      }
      return { text, pageCount: pdf.numPages };
    } finally {
      await task.destroy();
    }
  }

  function joinPageLines(items) {
    const pieces = items
      .filter((item) => typeof item.str === "string" && item.str.trim())
      .map((item) => ({
        text: item.str.replace(/\s+/g, " ").trim(),
        x: Number(item.transform?.[4]) || 0,
        y: Number(item.transform?.[5]) || 0,
        width: Number(item.width) || 0,
        height: Math.max(8, Number(item.height) || 0),
      }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const piece of pieces) {
      const line = lines.find((candidate) => Math.abs(candidate.y - piece.y) < Math.max(2, Math.min(candidate.height, piece.height) * 0.3));
      if (line) line.parts.push(piece);
      else lines.push({ y: piece.y, height: piece.height, parts: [piece] });
    }
    return lines
      .sort((a, b) => b.y - a.y)
      .map((line) => {
        const parts = line.parts.sort((a, b) => a.x - b.x);
        let text = "";
        let previous = null;
        for (const part of parts) {
          if (previous) {
            const gap = part.x - previous.x - previous.width;
            if (gap > Math.max(4, previous.height * 0.45)) text += "  ";
            else if (gap > 1 && /[A-Za-z0-9]$/.test(previous.text) && /^[A-Za-z0-9]/.test(part.text)) text += " ";
          }
          text += part.text;
          previous = part;
        }
        return text.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  function parsePdfResume(text, fileName = "") {
    const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) throw new Error("没有可导入的文字。");
    const prelude = [];
    const groups = [];
    let current = null;
    for (const line of lines) {
      const heading = detectHeading(line);
      if (heading) {
        current = { title: heading.title, type: heading.type, lines: [] };
        groups.push(current);
      } else if (current) current.lines.push(line);
      else prelude.push(line);
    }
    const personal = parsePersonal(prelude, lines, fileName);
    const sections = groups.map((group) => ({
      type: group.type,
      title: group.title,
      items: parseSectionItems(group),
    })).filter((section) => section.items.length);
    if (!sections.length) {
      const remaining = lines.filter((line) => line !== personal.name && !isContactLine(line));
      sections.push({
        type: "custom",
        title: "PDF 内容",
        items: [{ heading: remaining[0] || "内容", subtitle: "", meta: "", details: remaining.slice(1) }],
      });
    }
    return { schemaVersion: 1, updatedAt: new Date().toISOString(), personal, sections };
  }

  function detectHeading(line) {
    const cleaned = line
      .replace(/^[一二三四五六七八九十\d]+[.、)）]\s*/, "")
      .replace(/[—─━_\s]+$/g, "")
      .trim();
    if (cleaned.length > 36) return null;
    const match = HEADINGS.find((entry) => entry.pattern.test(cleaned));
    return match ? { type: match.type, title: cleaned } : null;
  }

  function parsePersonal(prelude, allLines, fileName) {
    const fullText = allLines.join("\n");
    const email = fullText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
    const phone = fullText.match(/(?:\+?86[\s-]?)?1[3-9]\d{9}/)?.[0] ||
      prelude.find((line) => /(?:电话|手机|phone|mobile)\s*[:：]/i.test(line))?.replace(/^.*?[:：]\s*/, "") || "";
    const links = fullText.match(/(?:https?:\/\/|www\.|github\.com\/)[^\s，,|｜]+/gi)?.join(" · ") || "";
    const city = prelude.find((line) => /(?:城市|现居|所在地|居住地)\s*[:：]/.test(line))?.replace(/^.*?[:：]\s*/, "") || "";
    const candidates = prelude.filter((line) => !/^(个人简历|简历|resume|curriculum vitae)$/i.test(line) && !isContactLine(line));
    const named = candidates.find((line) => /^(?:姓名|name)\s*[:：]/i.test(line));
    const name = (named ? named.replace(/^(?:姓名|name)\s*[:：]\s*/i, "") : candidates[0] || "")
      .split(/\s{2,}|[|｜]/)[0].trim() || fileName.replace(/\.pdf$/i, "").replace(/[_-]?(?:简历|resume).*$/i, "").trim();
    const role = candidates.find((line) => line !== named && line !== candidates[0] && line.length <= 35 &&
      /工程师|设计师|研究员|分析师|经理|助理|实习生|负责人|开发者|顾问|求职|engineer|designer|analyst|manager|developer/i.test(line)) || "";
    const summary = candidates.filter((line) => line !== named && line !== candidates[0] && line !== role).join(" ");
    return { name, role, phone, email, city, links, summary, photo: "" };
  }

  function isContactLine(line) {
    return /@|(?:https?:\/\/|www\.|github\.com\/)|(?:电话|手机|邮箱|email|phone|mobile)\s*[:：]|(?:\+?86[\s-]?)?1[3-9]\d{9}/i.test(line);
  }

  function parseSectionItems(group) {
    if (group.type === "skills") return parseSkills(group.lines);
    if (group.type === "custom") return group.lines.map((line) => ({ heading: cleanBullet(line), subtitle: "", meta: "", details: [] }));
    const records = [];
    for (const line of group.lines) {
      if (!records.length || looksLikeEntryStart(line, group.type, records[records.length - 1])) records.push([line]);
      else records[records.length - 1].push(line);
    }
    return records.map((record) => parseEntry(record, group.type));
  }

  function looksLikeEntryStart(line, type, current) {
    if (BULLET_PATTERN.test(line) || line.length > 90) return false;
    const dates = line.match(DATE_PATTERN) || [];
    if (dates.length >= 2) return true;
    if (dates.length && /\s{2,}/.test(line)) return true;
    if (current.length < 2) return false;
    if (type === "education") return /大学|学院|学校|university|college/i.test(line) && line.length < 55;
    if (type === "experience") return /公司|集团|事务所|研究院|科技|有限公司|inc\.|ltd\./i.test(line) && line.length < 55;
    return /项目|系统|平台|project/i.test(line) && line.length < 55;
  }

  function parseEntry(record, type) {
    const header = record[0];
    const dates = header.match(DATE_PATTERN) || [];
    const end = dates[1] || (/至今|现在|present|current/i.test(header) ? "至今" : "");
    const withoutDates = header.replace(DATE_PATTERN, "").replace(/\s*[-–—~至]\s*(?:至今|现在|present|current)?\s*$/i, "").trim();
    const parts = withoutDates.split(/\s{2,}|\s*[|｜]\s*/).map((part) => part.trim()).filter(Boolean);
    const details = record.slice(1).map(cleanBullet).filter(Boolean);
    if (type === "education") {
      return { school: parts[0] || header, major: parts[1] || "", degree: parts[2] || "", location: parts.slice(3).join(" | "), start: dates[0] || "", end, details };
    }
    if (type === "experience") {
      return { company: parts[0] || header, role: parts[1] || "", location: parts.slice(2).join(" | "), start: dates[0] || "", end, details };
    }
    return { name: parts[0] || header, role: parts[1] || "", link: parts.slice(2).join(" | "), start: dates[0] || "", end, details };
  }

  function parseSkills(lines) {
    const items = [];
    const other = [];
    for (const line of lines) {
      const clean = cleanBullet(line);
      const match = clean.match(/^([^:：]{1,24})[:：]\s*(.+)$/);
      if (match) items.push({ category: match[1].trim(), items: match[2].trim() });
      else if (clean) other.push(clean);
    }
    if (other.length) items.push({ category: "技能", items: other.join("、") });
    return items;
  }

  function cleanBullet(line) {
    return String(line).replace(BULLET_PATTERN, "").trim();
  }

  function toMarkdown(resume) {
    const personal = resume.personal || {};
    const output = [`# ${richText(personal.name) || "简历"}`];
    if (personal.role) output.push("", richText(personal.role));
    const contact = [personal.phone, personal.email, personal.city, personal.links].filter(Boolean).map(richText);
    if (contact.length) output.push("", contact.join(" · "));
    if (personal.summary) output.push("", richText(personal.summary));
    for (const section of resume.sections || []) {
      output.push("", `## ${richText(section.title)}`);
      for (const item of section.items || []) {
        if (section.type === "skills") {
          output.push(`- **${richText(item.category)}**：${richText(item.items)}`);
          continue;
        }
        const heading = section.type === "education" ? [item.school, item.major, item.degree] :
          section.type === "experience" ? [item.company, item.role] :
          section.type === "project" ? [item.name, item.role] : [item.heading, item.subtitle];
        output.push("", `### ${heading.filter(Boolean).map(richText).join(" | ")}`);
        const meta = [item.start && [item.start, item.end].filter(Boolean).join(" - "), item.location, item.meta, item.link]
          .filter(Boolean).map(richText);
        if (meta.length) output.push(meta.join(" · "));
        for (const detail of item.details || []) {
          if (detail.trim() && detail !== "\u200b") output.push(`- ${richText(detail)}`);
        }
      }
    }
    return `${output.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
  }

  function richText(value) {
    return String(value || "")
      .replace(/\[link=([^\]]+)\]([\s\S]*?)\[\/link\]/gi, (_, encoded, label) => {
        try {
          const url = decodeURIComponent(encoded);
          return /^https?:\/\/|^mailto:/i.test(url) ? `[${label}](${url})` : label;
        } catch { return label; }
      })
      .replace(/\[b\]/gi, "**").replace(/\[\/b\]/gi, "**")
      .replace(/\[i\]/gi, "*").replace(/\[\/i\]/gi, "*")
      .replace(/\[(\/?)(?:u|color)(?:=[^\]]+)?\]/gi, "")
      .replace(/\u200b/g, "");
  }

  const api = { extractPdfText, joinPageLines, parsePdfResume, toMarkdown };
  root.ResumeFileIO = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
