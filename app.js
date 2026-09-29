"use strict";

const DB_NAME = "moben-resume-db";
const DB_VERSION = 1;
const STORE_NAME = "resumes";
const RESUME_ID = "default";
const PREF_KEY = "moben-resume-preferences";
const MAX_PHOTO_EDGE = 720;

const SECTION_TYPES = {
  education: "教育经历",
  experience: "工作经历",
  project: "项目经历",
  skills: "技能清单",
  custom: "自定义模块",
};

const TEMPLATES = [
  { id: "classic", label: "经典居中" },
  { id: "modern", label: "现代侧线" },
];
const ACTIVE_TEMPLATE = "classic";
const CONTACT_FIELDS = [
  { key: "phone", label: "电话", placeholder: "138 0000 0000" },
  { key: "email", label: "邮箱", placeholder: "name@example.com" },
  { key: "city", label: "城市", placeholder: "上海" },
  { key: "links", label: "链接", placeholder: "github.com/name / portfolio.example" },
];
const DEFAULT_CONTACT_ORDER = CONTACT_FIELDS.map((field) => field.key);

const SECTION_TONES = [
  { id: "black", label: "黑色", title: "#141817", rule: "#c9d2ce", swatch: "#151918" },
  { id: "blue", label: "蓝色", title: "#2f607f", rule: "#c8d6df", swatch: "#2f607f" },
  { id: "red", label: "红色", title: "#8a4644", rule: "#ddcdcb", swatch: "#8a4644" },
  { id: "green", label: "绿色", title: "#2f7166", rule: "#c3d9d3", swatch: "#2f7166" },
];

const DENSITIES = [
  {
    id: "compact",
    label: "紧凑",
    font: 13.2,
    line: 1.34,
    pageMargin: 48,
    sectionGap: 12,
    entryGap: 7,
  },
  {
    id: "comfortable",
    label: "舒展",
    font: 14,
    line: 1.42,
    pageMargin: 58,
    sectionGap: 16,
    entryGap: 10,
  },
  {
    id: "spacious",
    label: "宽松",
    font: 14.6,
    line: 1.52,
    pageMargin: 66,
    sectionGap: 20,
    entryGap: 13,
  },
];

const IMPORT_ALIASES = {
  wrappers: ["resume", "data", "content", "result", "payload", "cv", "resumeData", "profileData"],
  personalSources: [
    "personal",
    "personalInfo",
    "personal_info",
    "profile",
    "basics",
    "basic",
    "contact",
    "个人信息",
    "基本信息",
    "个人资料",
  ],
  sections: ["sections", "modules", "blocks", "resumeSections", "栏目", "模块", "区块"],
  education: ["education", "educations", "academic", "schools", "educationList", "教育", "教育经历", "教育背景", "学历"],
  experience: [
    "work",
    "works",
    "workExperience",
    "work_experience",
    "experience",
    "experiences",
    "professionalExperience",
    "professional_experience",
    "employment",
    "employmentHistory",
    "employment_history",
    "jobs",
    "positions",
    "internship",
    "internships",
    "internshipExperience",
    "internship_experience",
    "工作",
    "工作经历",
    "工作经验",
    "实习",
    "实习经历",
    "经历",
    "职业经历",
  ],
  research: ["research", "researches", "researchExperience", "research_experience", "科研", "科研经历", "研究", "研究经历"],
  project: ["project", "projects", "projectExperience", "project_experience", "项目", "项目经历", "项目经验"],
  skills: ["skill", "skills", "skillList", "技能", "技能清单", "专业技能", "技术栈"],
  name: ["name", "fullName", "username", "姓名", "名字"],
  role: ["role", "label", "title", "headline", "position", "jobTitle", "objective", "target", "求职方向", "目标岗位", "职位", "岗位"],
  phone: ["phone", "mobile", "tel", "telephone", "cell", "手机", "电话", "联系电话", "联系方式"],
  email: ["email", "mail", "e-mail", "邮箱", "电子邮箱"],
  city: ["city", "location", "address", "region", "currentLocation", "城市", "地点", "所在地", "居住地", "地址"],
  links: ["links", "link", "url", "website", "portfolio", "github", "homepage", "profiles", "链接", "个人网站", "作品集", "主页"],
  summary: ["summary", "profileSummary", "about", "intro", "description", "bio", "自我评价", "个人简介", "简介", "个人总结"],
  photo: ["photo", "image", "avatar", "picture", "portrait", "照片", "头像"],
  title: ["title", "name", "heading", "sectionTitle", "模块标题", "栏目标题", "标题", "名称"],
  items: ["items", "entries", "records", "list", "children", "content", "data", "details", "条目", "列表", "内容", "明细"],
  school: ["school", "institution", "university", "college", "academy", "name", "院校", "学校", "大学"],
  degree: ["degree", "studyType", "qualification", "educationLevel", "学历", "学位"],
  major: ["major", "area", "field", "fieldOfStudy", "discipline", "专业", "方向"],
  company: ["company", "name", "organization", "employer", "institution", "公司", "组织", "单位", "机构"],
  itemRole: ["role", "position", "type", "jobTitle", "职位", "岗位", "角色", "类型"],
  projectName: ["name", "project", "title", "项目", "项目名称", "名称"],
  link: ["link", "url", "website", "repo", "repository", "github", "链接", "网址", "仓库"],
  start: ["start", "startDate", "from", "begin", "开始", "开始时间", "起止时间起"],
  end: ["end", "endDate", "to", "until", "结束", "结束时间", "起止时间止"],
  detailText: [
    "details",
    "detail",
    "summary",
    "description",
    "highlights",
    "responsibilities",
    "achievements",
      "courses",
      "relevantCourses",
      "relevant_courses",
      "keywords",
      "tags",
      "items",
    "content",
    "text",
    "要点",
    "描述",
    "职责",
    "成果",
    "亮点",
    "课程",
    "内容",
  ],
  category: ["category", "name", "title", "分类", "类别", "技能"],
  skillItems: ["items", "keywords", "skills", "details", "content", "技能项", "关键词", "内容"],
};

const els = {
  templateSelect: document.getElementById("templateSelect"),
  densitySelect: document.getElementById("densitySelect"),
  topFontScale: document.getElementById("topFontScale"),
  fontScaleValue: document.getElementById("fontScaleValue"),
  lineScale: document.getElementById("lineScale"),
  lineScaleValue: document.getElementById("lineScaleValue"),
  topToneOptions: document.getElementById("topToneOptions"),
  manageBtn: document.getElementById("manageBtn"),
  closeManageBtn: document.getElementById("closeManageBtn"),
  bulletToggle: document.getElementById("bulletToggle"),
  smartFitBtn: document.getElementById("smartFitBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  exportBtn: document.getElementById("exportBtn"),
  exportMenu: document.getElementById("exportMenu"),
  exportOptions: document.getElementById("exportOptions"),
  importReview: document.getElementById("importReview"),
  importReviewSummary: document.getElementById("importReviewSummary"),
  importReviewText: document.getElementById("importReviewText"),
  cancelPdfImport: document.getElementById("cancelPdfImport"),
  confirmPdfImport: document.getElementById("confirmPdfImport"),
  personalSection: document.getElementById("personalSection"),
  newSectionType: document.getElementById("newSectionType"),
  addSectionBtn: document.getElementById("addSectionBtn"),
  sectionList: document.getElementById("sectionList"),
  moduleEditor: document.getElementById("moduleEditor"),
  previewPages: document.getElementById("previewPages"),
  measureArea: document.getElementById("measureArea"),
  saveStatus: document.getElementById("saveStatus"),
  pageCount: document.getElementById("pageCount"),
  editorPanel: document.querySelector(".editor-panel"),
};

let db = null;
let resume = makeDefaultResume();
let preferences = loadPreferences();
let selectedSectionId = "";
let saveTimer = 0;
let previewFrame = 0;
let draggedSectionId = "";
let draggedContactField = "";
let formatToolbar = null;
let activeFormatTarget = null;
let pendingPdfName = "";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  formatToolbar = createFormatToolbar();
  renderSelects();
  wireEvents();
  applyPreferences();

  try {
    db = await openDatabase();
    const stored = await readResume();
    if (stored) {
      resume = normalizeResume(stored);
      setSaveStatus("");
    } else {
      await writeResume(resume);
      setSaveStatus("");
    }
  } catch (error) {
    setSaveStatus("IndexedDB 不可用，当前编辑不会自动保存");
    console.warn("IndexedDB unavailable:", error);
  }

  selectedSectionId = resume.sections[0]?.id || "";
  renderAll();
}

function renderSelects() {
  if (els.templateSelect) setOptions(els.templateSelect, TEMPLATES, preferences.template);
  setOptions(els.densitySelect, DENSITIES, preferences.density);
  setOptions(
    els.newSectionType,
    Object.entries(SECTION_TYPES).map(([id, label]) => ({ id, label })),
    "experience",
  );
  els.topFontScale.value = String(preferences.fontScale);
  els.topToneOptions.replaceChildren(...SECTION_TONES.map((tone) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "tone-chip";
    option.dataset.tone = tone.id;
    option.title = `${tone.label}栏目标题`;
    option.setAttribute("aria-label", option.title);
    option.style.backgroundColor = tone.swatch;
    return option;
  }));
  syncTopControls();
  els.bulletToggle.checked = preferences.useBullets;
  renderToneOptions();
}

function renderToneOptions() {
  const selectedTone = preferences.sectionTone || "black";
  els.topToneOptions.querySelectorAll("[data-tone]").forEach((button) => {
    const active = button.dataset.tone === selectedTone;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function syncTopControls() {
  els.topFontScale.value = String(preferences.fontScale);
  const density = DENSITIES.find((item) => item.id === preferences.density) || DENSITIES[1];
  const line = preferences.smartLayout?.line || Number(preferences.lineScale) || density.line;
  els.lineScale.value = String(line);
  els.fontScaleValue.textContent = `${(preferences.smartLayout?.font || density.font * preferences.fontScale).toFixed(1)}px`;
  els.lineScaleValue.textContent = line.toFixed(2);
}

function wireEvents() {
  els.manageBtn.addEventListener("click", () => toggleManagePanel(els.editorPanel.hidden));
  els.closeManageBtn.addEventListener("click", () => toggleManagePanel(false));
  els.topToneOptions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-tone]");
    if (!option) return;
    preferences.sectionTone = option.dataset.tone;
    clearSmartLayout();
    savePreferences();
    renderToneOptions();
    queuePreview();
  });
  els.topFontScale.addEventListener("input", () => {
    preferences.fontScale = Number(els.topFontScale.value);
    clearSmartLayout();
    savePreferences();
    syncTopControls();
    queuePreview();
  });
  els.lineScale.addEventListener("input", () => {
    preferences.lineScale = Number(els.lineScale.value);
    clearSmartLayout();
    savePreferences();
    syncTopControls();
    queuePreview();
  });
  if (els.templateSelect) {
    els.templateSelect.addEventListener("change", () => {
      preferences.template = els.templateSelect.value;
      clearSmartLayout();
      savePreferences();
      applyPreferences();
      queuePreview();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeExportMenu();
      if (!els.editorPanel.hidden) toggleManagePanel(false);
    }
  });

  document.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!els.exportMenu.contains(target)) closeExportMenu();
  });

  /*
  els.templateSelect.addEventListener("change", () => {
    preferences.template = els.templateSelect.value;
    clearSmartLayout();
    savePreferences();
    applyPreferences();
    queuePreview();
  });
  */

  els.densitySelect.addEventListener("change", () => {
    preferences.density = els.densitySelect.value;
    preferences.lineScale = null;
    clearSmartLayout();
    savePreferences();
    syncTopControls();
    applyPreferences();
    queuePreview();
  });

  els.bulletToggle.addEventListener("change", () => {
    preferences.useBullets = els.bulletToggle.checked;
    clearSmartLayout();
    savePreferences();
    queuePreview();
  });

  els.smartFitBtn.addEventListener("click", fitResumeToOnePage);

  els.importBtn.addEventListener("click", () => {
    els.importFile.value = "";
    els.importFile.click();
  });
  els.importFile.addEventListener("change", importPdf);
  els.cancelPdfImport.addEventListener("click", () => els.importReview.close());
  els.confirmPdfImport.addEventListener("click", confirmPdfImport);
  els.exportBtn.addEventListener("click", openExportMenu);
  els.exportMenu.addEventListener("mouseenter", openExportMenu);
  els.exportMenu.addEventListener("mouseleave", closeExportMenu);
  els.exportMenu.addEventListener("focusin", openExportMenu);
  els.exportMenu.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!els.exportMenu.contains(document.activeElement)) closeExportMenu();
    }, 0);
  });
  els.exportOptions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-export]");
    if (!option) return;
    option.blur();
    closeExportMenu();
    if (option.dataset.export === "pdf") printResumePdf();
    if (option.dataset.export === "json") exportJson();
    if (option.dataset.export === "md") exportMarkdown();
  });

  els.personalSection.addEventListener("input", (event) => {
    const field = event.target.dataset.personalField;
    if (!field) return;
    resume.personal[field] = event.target.value;
    touchResume();
  });
  els.personalSection.addEventListener("change", handlePersonalPhotoChange);
  els.personalSection.addEventListener("click", handlePersonalPhotoClick);

  els.addSectionBtn.addEventListener("click", () => {
    const section = makeSection(els.newSectionType.value);
    resume.sections.push(section);
    selectedSectionId = section.id;
    renderSectionList();
    renderModuleEditor();
    touchResume();
  });

  els.sectionList.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const sectionId = button.dataset.sectionId;
    const index = resume.sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;

    if (button.dataset.action === "select-section") {
      selectedSectionId = sectionId;
      renderSectionList();
      renderModuleEditor();
      return;
    }

    if (button.dataset.action === "move-section-up" && index > 0) {
      moveItem(resume.sections, index, index - 1);
    }

    if (button.dataset.action === "move-section-down" && index < resume.sections.length - 1) {
      moveItem(resume.sections, index, index + 1);
    }

    if (button.dataset.action === "delete-section") {
      if (!window.confirm("确定删除这个模块及其中的所有内容？")) return;
      resume.sections.splice(index, 1);
      selectedSectionId = resume.sections[Math.min(index, resume.sections.length - 1)]?.id || "";
    }

    renderSectionList();
    renderModuleEditor();
    touchResume();
  });

  els.sectionList.addEventListener("dragstart", handleSectionDragStart);
  els.sectionList.addEventListener("dragover", handleSectionDragOver);
  els.sectionList.addEventListener("drop", handleSectionDrop);
  els.sectionList.addEventListener("dragend", handleSectionDragEnd);

  els.previewPages.addEventListener("dragstart", handleContactDragStart);
  els.previewPages.addEventListener("dragover", handleContactDragOver);
  els.previewPages.addEventListener("drop", handleContactDrop);
  els.previewPages.addEventListener("dragend", handleContactDragEnd);
  els.previewPages.addEventListener("click", handlePreviewEdit);
  els.previewPages.addEventListener("input", handleDirectInput);
  els.previewPages.addEventListener("focusout", handleDirectBlur);
  els.previewPages.addEventListener("paste", handleDirectPaste);
  els.previewPages.addEventListener("keydown", handleDirectKeydown);
  els.previewPages.addEventListener("keydown", (event) => {
    if (event.target.closest("[contenteditable='true']")) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!event.target.closest("[data-edit-scope]")) return;
    event.preventDefault();
    handlePreviewEdit(event);
  });

  els.moduleEditor.addEventListener("input", (event) => {
    const section = getSelectedSection();
    if (!section) return;

    if (event.target.dataset.sectionTitle === "true") {
      section.title = event.target.value;
      renderSectionList();
      touchResume();
      return;
    }

    const itemIndex = Number(event.target.dataset.itemIndex);
    const field = event.target.dataset.field;
    if (!Number.isInteger(itemIndex) || !field || !section.items[itemIndex]) return;

    if (field === "details") {
      section.items[itemIndex][field] = parseLines(event.target.value);
    } else {
      section.items[itemIndex][field] = event.target.value;
    }
    touchResume();
  });

  els.moduleEditor.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const section = getSelectedSection();
    if (!section) return;

    const itemIndex = Number(button.dataset.itemIndex);
    if (button.dataset.action === "add-item") {
      section.items.push(makeItem(section.type));
    }

    if (button.dataset.action === "move-item-up" && itemIndex > 0) {
      moveItem(section.items, itemIndex, itemIndex - 1);
    }

    if (button.dataset.action === "move-item-down" && itemIndex < section.items.length - 1) {
      moveItem(section.items, itemIndex, itemIndex + 1);
    }

    if (button.dataset.action === "delete-item") {
      if (!section.items[itemIndex]) return;
      if (!confirmItemDeletion(section.type)) return;
      section.items.splice(itemIndex, 1);
    }

    renderModuleEditor();
    touchResume();
  });

  els.editorPanel.addEventListener("mouseup", scheduleFormatToolbarUpdate);
  els.editorPanel.addEventListener("keyup", scheduleFormatToolbarUpdate);
  els.editorPanel.addEventListener("focusin", scheduleFormatToolbarUpdate);
  els.editorPanel.addEventListener("scroll", hideFormatToolbar, { passive: true });
  document.addEventListener("selectionchange", scheduleFormatToolbarUpdate);
  els.previewPages.addEventListener("mouseup", scheduleFormatToolbarUpdate);
  els.previewPages.addEventListener("keyup", scheduleFormatToolbarUpdate);
  document.addEventListener("mousedown", (event) => {
    if (!formatToolbar || formatToolbar.hidden || formatToolbar.contains(event.target)) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".editor-panel")) return;
    hideFormatToolbar();
  });
  window.addEventListener("resize", () => window.requestAnimationFrame(updateContactSeparators), { passive: true });
}

function openExportMenu() {
  els.exportMenu.classList.add("open");
  els.exportBtn.setAttribute("aria-expanded", "true");
}

function closeExportMenu() {
  els.exportMenu.classList.remove("open");
  els.exportBtn.setAttribute("aria-expanded", "false");
}

function toggleManagePanel(open) {
  els.editorPanel.hidden = !open;
  els.manageBtn.setAttribute("aria-expanded", String(open));
  if (open) els.closeManageBtn.focus();
  else els.manageBtn.focus();
}

function renderAll() {
  renderPersonalEditor();
  renderSectionList();
  renderModuleEditor();
  queuePreview();
}

function renderPersonalEditor() {
  els.personalSection.replaceChildren(
    sectionHeading("个人信息", "填写姓名、求职方向和联系方式。"),
    photoControl(resume.personal.photo),
    formGrid([
      fieldControl("姓名", resume.personal.name, {
        key: "name",
        personal: true,
        placeholder: "例如：林知远",
      }),
      fieldControl("求职方向", resume.personal.role, {
        key: "role",
        personal: true,
        placeholder: "例如：前端工程师",
      }),
      fieldControl("电话", resume.personal.phone, {
        key: "phone",
        personal: true,
        placeholder: "138 0000 0000",
      }),
      fieldControl("邮箱", resume.personal.email, {
        key: "email",
        personal: true,
        placeholder: "name@example.com",
      }),
      fieldControl("城市", resume.personal.city, {
        key: "city",
        personal: true,
        placeholder: "上海",
      }),
      fieldControl("链接", resume.personal.links, {
        key: "links",
        personal: true,
        placeholder: "github.com/name / portfolio.example",
      }),
      fieldControl("个人简介", resume.personal.summary, {
        key: "summary",
        personal: true,
        textarea: true,
        full: true,
        placeholder: "用 2-3 句话概括你的优势、方向和代表经验。",
      }),
    ]),
  );
}

function photoControl(photo) {
  const wrapper = div("photo-field field full");
  const labelText = document.createElement("span");
  labelText.textContent = "照片";
  const uploader = div("photo-uploader");
  const preview = div("photo-preview");

  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = "简历照片预览";
    preview.append(image);
  } else {
    preview.textContent = "未添加";
  }

  const actions = div("photo-actions");
  const picker = document.createElement("label");
  picker.className = "button photo-picker";
  picker.textContent = photo ? "更换照片" : "选择照片";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp";
  input.hidden = true;
  input.dataset.photoInput = "true";
  picker.append(input);
  actions.append(picker);

  if (photo) {
    const remove = document.createElement("button");
    remove.className = "button danger";
    remove.type = "button";
    remove.dataset.action = "remove-photo";
    remove.textContent = "删除照片";
    actions.append(remove);
  }

  uploader.append(preview, actions);
  wrapper.append(labelText, uploader);
  return wrapper;
}

async function handlePersonalPhotoChange(event) {
  const input = event.target;
  if (!input.dataset.photoInput) return;
  const file = input.files?.[0];
  if (!file) return;

  try {
    resume.personal.photo = await readPhotoFile(file);
    renderPersonalEditor();
    touchResume();
    setSaveStatus("照片已保存到本机简历");
  } catch (error) {
    window.alert("照片读取失败：请选择 PNG、JPG 或 WebP 图片。");
    console.error("Photo import failed:", error);
  } finally {
    input.value = "";
  }
}

function handlePersonalPhotoClick(event) {
  const button = event.target.closest("[data-action='remove-photo']");
  if (!button) return;
  if (!window.confirm("确定删除这张照片？")) return;
  resume.personal.photo = "";
  renderPersonalEditor();
  touchResume();
  setSaveStatus("照片已移除");
}

function readPhotoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Unsupported image type"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Photo read failed"));
    reader.onload = () => resizePhoto(String(reader.result || "")).then(resolve, reject);
    reader.readAsDataURL(file);
  });
}

function resizePhoto(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = Math.max(image.naturalWidth, image.naturalHeight);
      if (!maxSide) {
        resolve(dataUrl);
        return;
      }

      const ratio = Math.min(1, MAX_PHOTO_EDGE / maxSide);
      const width = Math.max(1, Math.round(image.naturalWidth * ratio));
      const height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    image.onerror = () => reject(new Error("Photo decode failed"));
    image.src = dataUrl;
  });
}

function renderSectionList() {
  if (!resume.sections.length) {
    els.sectionList.replaceChildren(emptyState("还没有模块。可以先添加教育、经历、项目或技能。"));
    return;
  }

  const rows = resume.sections.map((section, index) => {
    const row = div("module-row");
    row.draggable = true;
    row.setAttribute("draggable", "true");
    row.dataset.sectionId = section.id;
    if (section.id === selectedSectionId) row.classList.add("active");

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.title = "拖拽调整模块顺序";
    handle.setAttribute("aria-hidden", "true");
    handle.textContent = "⋮⋮";

    const selectButton = button("module-select", "select-section", section.id);
    selectButton.type = "button";
    selectButton.append(strong(section.title || SECTION_TYPES[section.type] || "未命名模块"));
    selectButton.append(span(`${SECTION_TYPES[section.type] || "自定义"} · ${section.items.length} 条`));

    const actions = div("row-actions");
    actions.append(
      iconButton("↑", "上移模块", "move-section-up", section.id, index === 0),
      iconButton("↓", "下移模块", "move-section-down", section.id, index === resume.sections.length - 1),
      iconButton("×", "删除模块", "delete-section", section.id, false, "danger"),
    );

    row.append(handle, selectButton, actions);
    return row;
  });

  els.sectionList.replaceChildren(...rows);
}

function renderModuleEditor() {
  const section = getSelectedSection();
  if (!section) {
    els.moduleEditor.replaceChildren(sectionHeading("模块编辑", "选择或添加一个模块后开始编辑。"));
    return;
  }

  const titleField = fieldControl("模块标题", section.title, {
    key: "title",
    sectionTitle: true,
    full: true,
  });

  const itemStack = div("item-stack");
  if (!section.items.length) {
    itemStack.append(emptyState("这个模块暂时没有条目。"));
  } else {
    section.items.forEach((item, index) => {
      itemStack.append(renderItemCard(section, item, index));
    });
  }

  const actions = div("module-editor-actions");
  const addButton = document.createElement("button");
  addButton.className = "button";
  addButton.type = "button";
  addButton.dataset.action = "add-item";
  addButton.textContent = "添加条目";
  actions.append(addButton);

  els.moduleEditor.replaceChildren(
    sectionHeading("编辑模块", `${SECTION_TYPES[section.type] || "自定义"}`),
    formGrid([titleField]),
    itemStack,
    actions,
  );
}

function renderItemCard(section, item, index) {
  const card = div("item-card");
  const header = div("item-card-header");
  header.append(strong(getItemLabel(section.type, item, index)));

  const actions = div("row-actions");
  actions.append(
    itemAction("↑", "上移条目", "move-item-up", index, index === 0),
    itemAction("↓", "下移条目", "move-item-down", index, index === section.items.length - 1),
    itemAction("×", "删除条目", "delete-item", index, false, "danger"),
  );
  header.append(actions);

  const controls = getFieldsForType(section.type).map((definition) => {
    const rawValue = definition.key === "details" ? linesToText(item.details) : item[definition.key] || "";
    return fieldControl(definition.label, rawValue, {
      key: definition.key,
      textarea: definition.textarea,
      full: definition.full,
      itemIndex: index,
      placeholder: definition.placeholder,
    });
  });

  card.append(header, formGrid(controls));
  return card;
}

function queuePreview() {
  window.cancelAnimationFrame(previewFrame);
  previewFrame = window.requestAnimationFrame(renderPreview);
}

function renderPreview() {
  applyPreferences();
  syncTopControls();
  const blocks = buildResumeBlocks();
  const pages = paginateBlocks(blocks);

  const pageNodes = pages.map((pageBlocks, index) => {
    const page = div(`paper-page template-${preferences.template}`);
    const content = div("page-content");
    pageBlocks.forEach((block) => content.append(block.cloneNode(true)));
    const pageNumber = div("page-number");
    pageNumber.textContent = `${index + 1} / ${pages.length}`;
    page.append(content, pageNumber);
    return page;
  });

  els.previewPages.replaceChildren(...pageNodes);
  els.pageCount.textContent = `${pages.length} 页 A4`;
  window.requestAnimationFrame(updateContactSeparators);
}

function updateContactSeparators() {
  els.previewPages.querySelectorAll(".contact-line").forEach((line) => {
    const items = Array.from(line.querySelectorAll(".contact-item"));
    items.forEach((item) => item.classList.remove("no-separator"));
    items.forEach((item, index) => {
      const next = items[index + 1];
      if (!next) return;
      const nextWrapped = next.offsetTop > item.offsetTop + 1;
      if (nextWrapped) item.classList.add("no-separator");
    });
  });
}

function handleSectionDragStart(event) {
  const row = event.target.closest(".module-row");
  if (!row) return;
  draggedSectionId = row.dataset.sectionId || "";
  row.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedSectionId);
}

function handleSectionDragOver(event) {
  const row = event.target.closest(".module-row");
  if (!row || !draggedSectionId || row.dataset.sectionId === draggedSectionId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  clearDragOver();
  row.classList.add("drag-over");
}

function handleSectionDrop(event) {
  const row = event.target.closest(".module-row");
  if (!row) return;
  event.preventDefault();

  const sourceId = draggedSectionId || event.dataTransfer.getData("text/plain");
  const targetId = row.dataset.sectionId;
  const rect = row.getBoundingClientRect();
  const placeAfter = event.clientY > rect.top + rect.height / 2;

  if (moveSectionToDropTarget(sourceId, targetId, placeAfter)) {
    selectedSectionId = sourceId;
    renderSectionList();
    renderModuleEditor();
    touchResume();
  }

  clearDragOver();
  draggedSectionId = "";
}

function handleSectionDragEnd() {
  clearDragOver();
  draggedSectionId = "";
  document.querySelectorAll(".module-row.dragging").forEach((row) => row.classList.remove("dragging"));
}

function handleContactDragStart(event) {
  if (!event.target.closest(".contact-drag-handle")) return;
  const item = event.target.closest(".contact-item[data-contact-field]");
  if (!item) return;
  draggedContactField = item.dataset.contactField || "";
  item.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedContactField);
}

function handleContactDragOver(event) {
  const item = event.target.closest(".contact-item[data-contact-field]");
  if (!item || !draggedContactField || item.dataset.contactField === draggedContactField) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  clearContactDragOver();
  item.classList.add("drag-over");
}

function handleContactDrop(event) {
  const item = event.target.closest(".contact-item[data-contact-field]");
  if (!item) return;
  event.preventDefault();

  const sourceKey = draggedContactField || event.dataTransfer.getData("text/plain");
  const targetKey = item.dataset.contactField;
  const rect = item.getBoundingClientRect();
  const placeAfter = event.clientX > rect.left + rect.width / 2;

  if (moveContactToDropTarget(sourceKey, targetKey, placeAfter)) {
    touchResume();
  }

  clearContactDragOver();
  draggedContactField = "";
}

function handleContactDragEnd() {
  clearContactDragOver();
  draggedContactField = "";
  document.querySelectorAll(".contact-item.dragging").forEach((item) => item.classList.remove("dragging"));
}

function moveSectionToDropTarget(sourceId, targetId, placeAfter) {
  if (!sourceId || !targetId || sourceId === targetId) return false;
  const sourceIndex = resume.sections.findIndex((section) => section.id === sourceId);
  const targetIndex = resume.sections.findIndex((section) => section.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return false;

  const [section] = resume.sections.splice(sourceIndex, 1);
  let nextIndex = resume.sections.findIndex((item) => item.id === targetId);
  if (placeAfter) nextIndex += 1;
  resume.sections.splice(nextIndex, 0, section);
  return true;
}

function clearDragOver() {
  document.querySelectorAll(".module-row.drag-over").forEach((row) => row.classList.remove("drag-over"));
}

function clearContactDragOver() {
  document.querySelectorAll(".contact-item.drag-over").forEach((item) => item.classList.remove("drag-over"));
}

function moveContactToDropTarget(sourceKey, targetKey, placeAfter) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) return false;
  const order = getContactOrder();
  const sourceIndex = order.indexOf(sourceKey);
  const targetIndex = order.indexOf(targetKey);
  if (sourceIndex < 0 || targetIndex < 0) return false;

  order.splice(sourceIndex, 1);
  let nextIndex = order.indexOf(targetKey);
  if (placeAfter) nextIndex += 1;
  order.splice(nextIndex, 0, sourceKey);
  resume.personal.contactOrder = order;
  return true;
}

function handlePreviewEdit(event) {
  const action = event.target.closest("[data-preview-action]");
  if (action) {
    performPreviewAction(action);
    return;
  }
  const node = event.target.closest("[data-edit-scope]");
  if (!node) return;
  if (event.target.closest("a")) event.preventDefault();
  if (node !== document.activeElement) node.focus();
}

function directTarget(node) {
  return {
    scope: node.dataset.editScope,
    sectionId: node.dataset.editSectionId || "",
    itemIndex: Number(node.dataset.editItemIndex),
    field: node.dataset.editField || "",
    detailIndex: Number(node.dataset.editDetailIndex),
  };
}

function saveDirectField(node) {
  const target = directTarget(node);
  const value = serializeRichContent(node).trim();
  if (target.scope === "personal") resume.personal[target.field] = value;
  if (target.scope === "section") {
    const section = resume.sections.find((item) => item.id === target.sectionId);
    if (section) section.title = value;
  }
  if (target.scope === "item") {
    const section = resume.sections.find((item) => item.id === target.sectionId);
    const item = section?.items[target.itemIndex];
    if (!item) return;
    if (target.field === "details") item.details[target.detailIndex] = value || "\u200b";
    else item[target.field] = value;
  }
  resume.updatedAt = new Date().toISOString();
  scheduleSave();
}

function handleDirectInput(event) {
  const node = event.target.closest("[data-edit-scope]");
  if (!node || !els.previewPages.contains(node)) return;
  if (node.textContent) {
    delete node.dataset.placeholder;
    delete node.parentElement?.dataset.emptyDetail;
  }
  saveDirectField(node);
}

function handleDirectBlur(event) {
  const node = event.target.closest("[data-edit-scope]");
  if (!node || !els.previewPages.contains(node)) return;
  saveDirectField(node);
  window.setTimeout(() => {
    if (!els.previewPages.contains(document.activeElement)) queuePreview();
    else if (!document.activeElement.matches("[contenteditable='true']")) queuePreview();
  }, 0);
}

function handleDirectPaste(event) {
  const node = event.target.closest("[data-edit-scope]");
  if (!node) return;
  event.preventDefault();
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.startContainer) || !node.contains(range.endContainer)) return;
  const text = event.clipboardData.getData("text/plain").replace(/\r?\n/g, " ");
  range.deleteContents();
  const inserted = document.createTextNode(text);
  range.insertNode(inserted);
  range.setStartAfter(inserted);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  saveDirectField(node);
}

function handleDirectKeydown(event) {
  const node = event.target.closest("[data-edit-scope]");
  if (!node) return;
  if (event.key === "Escape") {
    node.blur();
    return;
  }
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveDirectField(node);
  if (node.dataset.editField === "details") {
    const target = directTarget(node);
    const item = resume.sections.find((section) => section.id === target.sectionId)?.items[target.itemIndex];
    if (item) {
      item.details.splice(target.detailIndex + 1, 0, "\u200b");
      touchResume();
      focusDirectField({ ...target, detailIndex: target.detailIndex + 1 });
    }
  } else {
    node.blur();
  }
}

function focusDirectField(target) {
  window.requestAnimationFrame(() => {
    const fields = Array.from(els.previewPages.querySelectorAll("[data-edit-scope]"));
    const node = fields.find((candidate) => {
      const data = directTarget(candidate);
      return data.scope === target.scope && data.sectionId === target.sectionId &&
        data.itemIndex === target.itemIndex && data.field === target.field &&
        data.detailIndex === target.detailIndex;
    });
    node?.focus();
  });
}

function performPreviewAction(button) {
  const sectionId = button.dataset.sectionId;
  const section = resume.sections.find((item) => item.id === sectionId);
  if (!section) return;
  const index = Number(button.dataset.itemIndex);
  const action = button.dataset.previewAction;
  if (action === "add-detail" && section.items[index]) {
    section.items[index].details.push("\u200b");
  }
  if (action === "move-item-up" && index > 0) moveItem(section.items, index, index - 1);
  if (action === "move-item-down" && index < section.items.length - 1) moveItem(section.items, index, index + 1);
  if (action === "delete-item") {
    if (!section.items[index] || !confirmItemDeletion(section.type)) return;
    section.items.splice(index, 1);
  }
  if (action === "delete-detail" && section.items[index]) {
    const detailIndex = Number(button.dataset.detailIndex);
    if (!Number.isInteger(detailIndex) || detailIndex < 0 || detailIndex >= section.items[index].details.length) return;
    if (!window.confirm("确定删除这个要点？")) return;
    section.items[index].details.splice(detailIndex, 1);
  }
  if (action === "add-section-item") section.items.push(makeItem(section.type));
  touchResume();
  if (action === "add-detail") {
    focusDirectField({ scope: "item", sectionId, itemIndex: index, field: "details", detailIndex: section.items[index].details.length - 1 });
  }
}

function focusEditorTarget(target) {
  let input = null;

  if (target.scope === "personal") {
    input = els.personalSection.querySelector(`[data-personal-field="${escapeAttr(target.field)}"]`);
  }

  if (target.scope === "section") {
    selectedSectionId = target.sectionId;
    renderSectionList();
    renderModuleEditor();
    input = els.moduleEditor.querySelector("[data-section-title='true']");
  }

  if (target.scope === "item") {
    selectedSectionId = target.sectionId;
    renderSectionList();
    renderModuleEditor();
    input = els.moduleEditor.querySelector(
      `[data-item-index="${target.itemIndex}"][data-field="${escapeAttr(target.field)}"]`,
    );
  }

  if (!input) return;

  input.focus({ preventScroll: true });
  if (target.field === "details" && input.tagName === "TEXTAREA" && Number.isInteger(target.detailIndex)) {
    selectTextareaLine(input, target.detailIndex);
  } else {
    input.select?.();
  }

  input.scrollIntoView({ behavior: "smooth", block: "center" });
  flashEditable(input);
  setSaveStatus("已定位到左侧对应字段，可直接修改");
}

function flashEditable(input) {
  const field = input.closest(".field") || input;
  field.classList.remove("field-flash");
  window.requestAnimationFrame(() => {
    field.classList.add("field-flash");
    window.setTimeout(() => field.classList.remove("field-flash"), 900);
  });
}

function selectTextareaLine(textarea, lineIndex) {
  const lines = textarea.value.split(/\r?\n/);
  const safeIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
  let start = 0;
  for (let index = 0; index < safeIndex; index += 1) {
    start += lines[index].length + 1;
  }
  textarea.setSelectionRange(start, start + lines[safeIndex].length);
}

function createFormatToolbar() {
  const toolbar = div("format-toolbar");
  toolbar.hidden = true;
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "文本格式工具");

  toolbar.append(
    formatButton("B", "加粗", "bold", "format-bold"),
    formatButton("I", "斜体", "italic", "format-italic"),
    formatButton("U", "下划线", "underline", "format-underline"),
    formatButton("↗", "添加超链接", "link", "format-link"),
    colorButton("blue", "蓝色"),
    colorButton("black", "黑色"),
  );

  toolbar.addEventListener("mousedown", (event) => event.preventDefault());
  toolbar.addEventListener("click", (event) => {
    const buttonNode = event.target.closest("button");
    if (!buttonNode) return;
    event.preventDefault();
    applyTextFormat(buttonNode.dataset.formatAction, buttonNode.dataset.color || "");
  });

  document.body.append(toolbar);
  return toolbar;
}

function formatButton(text, label, action, className) {
  const node = document.createElement("button");
  node.className = `format-tool ${className}`;
  node.type = "button";
  node.dataset.formatAction = action;
  node.title = label;
  node.setAttribute("aria-label", label);
  node.textContent = text;
  return node;
}

function colorButton(color, label) {
  const node = document.createElement("button");
  node.className = "format-tool color-tool";
  node.type = "button";
  node.dataset.formatAction = "color";
  node.dataset.color = color;
  node.title = label;
  node.setAttribute("aria-label", label);
  const swatch = document.createElement("span");
  swatch.className = `color-swatch swatch-${color}`;
  node.append(swatch);
  return node;
}

function scheduleFormatToolbarUpdate() {
  window.setTimeout(updateFormatToolbar, 0);
}

function updateFormatToolbar() {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount) {
    const range = selection.getRangeAt(0);
    const start = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
    const node = start?.closest?.("[data-edit-scope]");
    if (node && els.previewPages.contains(node) && node.contains(range.endContainer)) {
      activeFormatTarget = { node, range: range.cloneRange() };
      showFormatToolbar(range.getBoundingClientRect());
      return;
    }
  }
  const input = document.activeElement;
  if (!isEditableTextInput(input) || !els.editorPanel.contains(input)) {
    hideFormatToolbar();
    return;
  }

  const start = input.selectionStart;
  const end = input.selectionEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start === end) {
    hideFormatToolbar();
    return;
  }

  activeFormatTarget = { input, start, end };
  formatToolbar.hidden = false;
  formatToolbar.style.visibility = "hidden";
  const rect = input.getBoundingClientRect();
  const toolbarRect = formatToolbar.getBoundingClientRect();
  const top = Math.max(8, rect.top + window.scrollY - toolbarRect.height - 8);
  const left = Math.min(
    window.scrollX + window.innerWidth - toolbarRect.width - 8,
    Math.max(8, rect.left + window.scrollX + rect.width / 2 - toolbarRect.width / 2),
  );

  formatToolbar.style.top = `${top}px`;
  formatToolbar.style.left = `${left}px`;
  formatToolbar.style.visibility = "";
}

function hideFormatToolbar() {
  if (formatToolbar) formatToolbar.hidden = true;
}

function showFormatToolbar(rect) {
  formatToolbar.hidden = false;
  formatToolbar.style.visibility = "hidden";
  const size = formatToolbar.getBoundingClientRect();
  formatToolbar.style.top = `${Math.max(8, rect.top - size.height - 8)}px`;
  formatToolbar.style.left = `${Math.min(window.innerWidth - size.width - 8, Math.max(8, rect.left + rect.width / 2 - size.width / 2))}px`;
  formatToolbar.style.visibility = "";
}

function applyTextFormat(action, color) {
  if (!activeFormatTarget) return;
  if (activeFormatTarget.node) {
    applyDirectFormat(action, color);
    return;
  }
  const { input, start, end } = activeFormatTarget;
  if (!isEditableTextInput(input) || start === end) return;

  const selected = input.value.slice(start, end);
  const tags = getFormatTags(action, color);
  if (!tags) return;

  input.value = `${input.value.slice(0, start)}${tags.open}${selected}${tags.close}${input.value.slice(end)}`;
  const nextStart = start + tags.open.length;
  const nextEnd = nextStart + selected.length;
  input.focus({ preventScroll: true });
  input.setSelectionRange(nextStart, nextEnd);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  activeFormatTarget = { input, start: nextStart, end: nextEnd };
  updateFormatToolbar();
}

function applyDirectFormat(action, color) {
  const { node, range } = activeFormatTarget;
  if (!els.previewPages.contains(node) || range.collapsed) return;
  let wrapper;
  if (action === "link") {
    const raw = window.prompt("链接地址（https:// 或 mailto:）", "https://");
    if (raw === null) return;
    const href = safeLink(raw);
    if (!href) {
      window.alert("请输入有效的 https://、http:// 或 mailto: 链接。");
      return;
    }
    wrapper = document.createElement("a");
    wrapper.href = href;
  } else {
    wrapper = document.createElement("span");
    const className = action === "bold" ? "rt-bold" : action === "italic" ? "rt-italic" :
      action === "underline" ? "rt-underline" : action === "color" && ["blue", "black"].includes(color) ? `rt-${color}` : "";
    if (!className) return;
    wrapper.className = className;
  }
  wrapper.append(range.extractContents());
  range.insertNode(wrapper);
  const next = document.createRange();
  next.selectNodeContents(wrapper);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(next);
  saveDirectField(node);
  activeFormatTarget = { node, range: next.cloneRange() };
  showFormatToolbar(next.getBoundingClientRect());
}

function safeLink(value) {
  try {
    const url = new URL(value.trim());
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function getFormatTags(action, color) {
  if (action === "bold") return { open: "[b]", close: "[/b]" };
  if (action === "italic") return { open: "[i]", close: "[/i]" };
  if (action === "underline") return { open: "[u]", close: "[/u]" };
  if (action === "color" && (color === "blue" || color === "black")) {
    return { open: `[color=${color}]`, close: "[/color]" };
  }
  return null;
}

function isEditableTextInput(node) {
  return node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;
}

function buildResumeBlocks() {
  const blocks = [buildResumeHeader()];

  resume.sections.forEach((section) => {
    const sectionNode = buildResumeSection(section);
    if (sectionNode) blocks.push(sectionNode);
  });

  return blocks;
}

function buildResumeHeader() {
  const personal = resume.personal;
  const header = div("resume-header");
  const hasPhoto = Boolean(personal.photo);
  if (hasPhoto) header.classList.add("has-photo");
  const main = div("resume-main");
  const name = document.createElement("h1");
  name.className = "resume-name";
  setRichContent(name, personal.name || "未命名");
  withEditTarget(name, { scope: "personal", field: "name" });
  main.append(name);

  if (personal.role) {
    const role = div("resume-role");
    setRichContent(role, personal.role);
    withEditTarget(role, { scope: "personal", field: "role" });
    main.append(role);
  }

  const contactIcons = {
    phone: "☎",
    email: "@",
    links: "↗",
    city: "⌖",
  };
  const contactParts = getContactOrder()
    .map((field) => ({
      field,
      value: personal[field],
      icon: contactIcons[field],
    }))
    .filter((part) => part.value);

  const contact = div("contact-line");
  contactParts.forEach((part) => {
    contact.append(buildContactItem(part, hasPhoto));
  });

  if (contactParts.length) main.append(contact);

  if (personal.summary) {
    const summary = document.createElement("p");
    summary.className = "summary";
    setRichContent(summary, personal.summary);
    withEditTarget(summary, { scope: "personal", field: "summary" });
    if (hasPhoto) {
      main.append(summary);
    } else {
      header.append(summary);
    }
  }

  header.prepend(main);

  if (hasPhoto) {
    const photo = document.createElement("img");
    photo.className = "resume-photo";
    photo.src = personal.photo;
    photo.alt = `${stripRichTags(personal.name) || "简历"}照片`;
    header.append(photo);
  }

  return header;
}

function buildContactItem(part, useIcon) {
  const item = document.createElement("span");
  item.className = "contact-item";
  item.dataset.contactField = part.field;
  const handle = document.createElement("span");
  handle.className = "contact-drag-handle";
  handle.draggable = true;
  handle.title = "拖拽调整联系方式顺序";
  handle.setAttribute("aria-hidden", "true");
  handle.textContent = "⋮";

  if (!useIcon) {
    const value = document.createElement("span");
    setRichContent(value, part.value);
    withEditTarget(value, { scope: "personal", field: part.field });
    item.append(value, handle);
    return item;
  }

  const icon = document.createElement("span");
  icon.className = "contact-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = part.icon;
  const value = document.createElement("span");
  value.className = "contact-value";
  setRichContent(value, part.value);
  item.append(icon, value, handle);
  withEditTarget(value, { scope: "personal", field: part.field });
  return item;
}

function buildResumeSection(section) {
  const visibleItems = section.items.map((item, index) => ({ item, index }));

  const sectionNode = document.createElement("section");
  sectionNode.className = "resume-section";
  if (!visibleItems.some(({ item }) => !isItemEmpty(section.type, item))) sectionNode.classList.add("empty-section");

  const title = document.createElement("h2");
  setRichContent(title, section.title || SECTION_TYPES[section.type] || "自定义模块");
  withEditTarget(title, { scope: "section", sectionId: section.id, field: "title" });
  const heading = div("resume-section-heading");
  heading.append(title, previewAction("+", "添加条目", "add-section-item", section.id));
  sectionNode.append(heading);

  const entries = div("entries");
  visibleItems.forEach(({ item, index }) => {
    const entry = buildResumeEntry(section, item, index);
    if (entry) {
      if (isItemEmpty(section.type, item)) entry.classList.add("empty-entry");
      entries.append(entry);
    }
  });
  sectionNode.append(entries);
  return sectionNode;
}

function buildResumeEntry(section, item, index) {
  const type = section.type;
  const sectionId = section.id;

  if (type === "skills") {
    const row = div("resume-entry skill-row");
    const category = document.createElement("h3");
    setRichContent(category, item.category || "技能");
    withEditTarget(category, { scope: "item", sectionId, itemIndex: index, field: "category" });
    const text = document.createElement("p");
    setRichContent(text, item.items || "");
    withEditTarget(text, { scope: "item", sectionId, itemIndex: index, field: "items" });
    row.append(category, text, entryActions(sectionId, index, section.items.length, false));
    return row;
  }

  const entry = div("resume-entry");
  const topLine = div("entry-topline");
  const title = document.createElement("h3");
  title.className = "entry-title";
  const meta = div("entry-meta");

  if (type === "education") {
    topLine.classList.add("entry-three-col");
    appendEditablePart(title, item.school || "院校", { scope: "item", sectionId, itemIndex: index, field: "school" });
    appendParenthetical(title, item.location, { scope: "item", sectionId, itemIndex: index, field: "location" });
    const center = div("entry-center");
    appendEditablePart(center, item.major, { scope: "item", sectionId, itemIndex: index, field: "major" });
    appendEditablePart(center, item.degree, { scope: "item", sectionId, itemIndex: index, field: "degree" }, " | ");
    appendDateRange(meta, item, sectionId, index);
    topLine.append(title, center, meta);
    entry.append(topLine);
  } else if (type === "experience") {
    topLine.classList.add("entry-three-col");
    appendEditablePart(title, item.company || "公司 / 组织", { scope: "item", sectionId, itemIndex: index, field: "company" });
    appendParenthetical(title, item.location, { scope: "item", sectionId, itemIndex: index, field: "location" });
    const center = div("entry-center");
    appendEditablePart(center, item.role || "岗位", { scope: "item", sectionId, itemIndex: index, field: "role" });
    appendDateRange(meta, item, sectionId, index);
    topLine.append(title, center, meta);
    entry.append(topLine);
  } else if (type === "project") {
    appendEditablePart(title, item.name || "项目", { scope: "item", sectionId, itemIndex: index, field: "name" });
    appendDateRange(meta, item, sectionId, index);
    const subtitle = div("entry-subtitle");
    appendEditablePart(subtitle, item.role, { scope: "item", sectionId, itemIndex: index, field: "role" });
    appendEditablePart(subtitle, item.link, { scope: "item", sectionId, itemIndex: index, field: "link" }, " · ");
    topLine.append(title, meta);
    entry.append(topLine);
    if (subtitle.textContent.trim()) entry.append(subtitle);
  } else {
    appendEditablePart(title, item.heading || "条目", { scope: "item", sectionId, itemIndex: index, field: "heading" });
    appendEditablePart(meta, item.meta, { scope: "item", sectionId, itemIndex: index, field: "meta" });
    const subtitle = div("entry-subtitle");
    appendEditablePart(subtitle, item.subtitle, { scope: "item", sectionId, itemIndex: index, field: "subtitle" });
    topLine.append(title, meta);
    entry.append(topLine);
    if (subtitle.textContent.trim()) entry.append(subtitle);
  }

  const points = parseLines(item.details);
  if (points.length) {
    const list = document.createElement(preferences.useBullets ? "ul" : "div");
    list.className = preferences.useBullets ? "entry-details" : "entry-details entry-detail-lines";
    points.forEach((point, detailIndex) => {
      const line = document.createElement(preferences.useBullets ? "li" : "p");
      const content = document.createElement("span");
      setRichContent(content, point === "\u200b" ? "" : point);
      if (point === "\u200b") {
        content.dataset.placeholder = "填写要点";
        line.dataset.emptyDetail = "true";
      }
      withEditTarget(content, {
        scope: "item",
        sectionId,
        itemIndex: index,
        field: "details",
        detailIndex,
      });
      line.append(content, previewAction("×", "删除要点", "delete-detail", sectionId, index, detailIndex));
      list.append(line);
    });
    entry.append(list);
  }

  entry.append(entryActions(sectionId, index, section.items.length, true));
  return entry;
}

function previewAction(symbol, label, action, sectionId, itemIndex, detailIndex) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "preview-action";
  node.textContent = symbol;
  node.title = label;
  node.setAttribute("aria-label", label);
  node.dataset.previewAction = action;
  node.dataset.sectionId = sectionId;
  if (Number.isInteger(itemIndex)) node.dataset.itemIndex = String(itemIndex);
  if (Number.isInteger(detailIndex)) node.dataset.detailIndex = String(detailIndex);
  return node;
}

function entryActions(sectionId, index, count, canAddDetail) {
  const actions = div("entry-actions");
  if (canAddDetail) actions.append(previewAction("+", "添加要点", "add-detail", sectionId, index));
  if (index > 0) actions.append(previewAction("↑", "上移条目", "move-item-up", sectionId, index));
  if (index < count - 1) actions.append(previewAction("↓", "下移条目", "move-item-down", sectionId, index));
  actions.append(previewAction("×", "删除条目", "delete-item", sectionId, index));
  return actions;
}

function paginateBlocks(blocks) {
  els.measureArea.replaceChildren();
  const wrapper = div(`template-${preferences.template}`);
  els.measureArea.append(wrapper);
  let measurePage = div("measure-page");
  wrapper.append(measurePage);

  const pageHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--paper-height")) || 1123;
  const pages = [[]];
  let current = pages[0];

  function nextPage() {
    current = [];
    pages.push(current);
    measurePage = div("measure-page");
    wrapper.replaceChildren(measurePage);
  }

  function newSectionChunk(section) {
    const chunk = section.cloneNode(true);
    chunk.querySelector(".entries").replaceChildren();
    measurePage.append(chunk);
    current.push(chunk);
    return chunk;
  }

  blocks.filter(Boolean).forEach((block) => {
    if (block.classList.contains("resume-section")) {
      let chunk = newSectionChunk(block);
      if (measurePage.scrollHeight > pageHeight && current.length > 1) {
        measurePage.removeChild(chunk);
        current.pop();
        nextPage();
        chunk = newSectionChunk(block);
      }
      const entries = Array.from(block.querySelector(".entries").children);
      entries.forEach((entry) => {
        const child = entry.cloneNode(true);
        chunk.querySelector(".entries").append(child);
        if (measurePage.scrollHeight <= pageHeight) return;
        const entryCount = chunk.querySelector(".entries").children.length;
        if (entryCount === 1 && current.length === 1) return;
        child.remove();
        if (entryCount === 1) {
          chunk.remove();
          current.pop();
        }
        nextPage();
        chunk = newSectionChunk(block);
        chunk.querySelector(".entries").append(entry.cloneNode(true));
      });
      return;
    }
    const clone = block.cloneNode(true);
    measurePage.append(clone);

    if (measurePage.scrollHeight > pageHeight && measurePage.children.length > 1) {
      measurePage.removeChild(clone);
      nextPage();
      measurePage.append(block.cloneNode(true));
    }

    current.push(block);
  });

  if (!pages[0].length) {
    pages[0].push(buildResumeHeader());
  }

  return pages;
}

function fitResumeToOnePage() {
  const baseDensity = DENSITIES.find((item) => item.id === preferences.density) || DENSITIES[1];
  const baseScale = Number(preferences.fontScale) || 1;
  const baseLayout = {
    font: baseDensity.font * baseScale,
    line: Number(preferences.lineScale) || baseDensity.line,
    pageMargin: baseDensity.pageMargin,
    sectionGap: baseDensity.sectionGap,
    entryGap: baseDensity.entryGap,
  };
  const targetLayout = {
    font: Math.max(12.2, baseLayout.font - 1),
    line: 1.12,
    pageMargin: 36,
    sectionGap: 6,
    entryGap: 3,
  };
  const previousSmartLayout = preferences.smartLayout;
  const attempts = 32;

  for (let step = 0; step <= attempts; step += 1) {
    const ratio = step / attempts;
    preferences.smartLayout = interpolateLayout(baseLayout, targetLayout, ratio);
    applyPreferences();
    const pages = paginateBlocks(buildResumeBlocks());
    if (pages.length <= 1) {
      savePreferences();
      renderPreview();
      setSaveStatus(`智能一页已完成 · 行距 ${preferences.smartLayout.line.toFixed(2)}`);
      return;
    }
  }

  preferences.smartLayout = targetLayout;
  applyPreferences();
  const finalPages = paginateBlocks(buildResumeBlocks()).length;
  if (finalPages <= 1) {
    savePreferences();
    renderPreview();
    setSaveStatus(`智能一页已完成 · 行距 ${preferences.smartLayout.line.toFixed(2)}`);
    return;
  }

  preferences.smartLayout = previousSmartLayout;
  applyPreferences();
  renderPreview();
  setSaveStatus("内容超过一页，已保留当前排版。可删减内容或关闭分点符后再试。");
}

function interpolateLayout(from, to, ratio) {
  return {
    font: roundLayout(from.font + (to.font - from.font) * ratio),
    line: roundLayout(from.line + (to.line - from.line) * ratio),
    pageMargin: roundLayout(from.pageMargin + (to.pageMargin - from.pageMargin) * ratio),
    sectionGap: roundLayout(from.sectionGap + (to.sectionGap - from.sectionGap) * ratio),
    entryGap: roundLayout(from.entryGap + (to.entryGap - from.entryGap) * ratio),
  };
}

function roundLayout(value) {
  return Math.round(value * 100) / 100;
}

function clearSmartLayout() {
  preferences.smartLayout = null;
}

function normalizeSmartLayout(layout) {
  if (!layout || typeof layout !== "object") return null;
  const next = {
    font: Number(layout.font),
    line: Number(layout.line),
    pageMargin: Number(layout.pageMargin),
    sectionGap: Number(layout.sectionGap),
    entryGap: Number(layout.entryGap),
  };
  const valid = Object.values(next).every((value) => Number.isFinite(value) && value > 0);
  return valid ? next : null;
}

function touchResume() {
  resume.updatedAt = new Date().toISOString();
  queuePreview();
  scheduleSave();
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    if (!db) {
      setSaveStatus("IndexedDB 不可用，尚未自动保存");
      return;
    }
    try {
      await writeResume(resume);
      setSaveStatus(`已保存到本机 · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setSaveStatus("保存失败，可先导出 JSON 备份");
      console.error("Save failed:", error);
    }
  }, 350);
}

function applyPreferences() {
  const density = DENSITIES.find((item) => item.id === preferences.density) || DENSITIES[1];
  const scale = Number(preferences.fontScale) || 1;
  const tone = getSectionTone(preferences.sectionTone);
  const layout = preferences.smartLayout || {
    font: density.font * scale,
    line: Number(preferences.lineScale) || density.line,
    pageMargin: density.pageMargin,
    sectionGap: density.sectionGap,
    entryGap: density.entryGap,
  };
  document.documentElement.style.setProperty("--resume-font", `${layout.font}px`);
  document.documentElement.style.setProperty("--resume-line", String(layout.line));
  document.documentElement.style.setProperty("--page-margin", `${layout.pageMargin}px`);
  document.documentElement.style.setProperty("--section-gap", `${layout.sectionGap}px`);
  document.documentElement.style.setProperty("--entry-gap", `${layout.entryGap}px`);
  document.documentElement.style.setProperty("--section-title-color", tone.title);
  document.documentElement.style.setProperty("--section-rule-color", tone.rule);
}

function getSectionTone(id) {
  return SECTION_TONES.find((item) => item.id === id) || SECTION_TONES[0];
}

function loadPreferences() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    return {
      template: ACTIVE_TEMPLATE,
      density: DENSITIES.some((item) => item.id === raw.density) ? raw.density : "comfortable",
      fontScale: Number.isFinite(Number(raw.fontScale)) ? Number(raw.fontScale) : 1,
      lineScale: Number.isFinite(Number(raw.lineScale)) && Number(raw.lineScale) >= 1.1 ? Number(raw.lineScale) : null,
      useBullets: typeof raw.useBullets === "boolean" ? raw.useBullets : true,
      sectionTone: SECTION_TONES.some((item) => item.id === raw.sectionTone) ? raw.sectionTone : "black",
      smartLayout: normalizeSmartLayout(raw.smartLayout),
    };
  } catch {
    return {
      template: ACTIVE_TEMPLATE,
      density: "comfortable",
      fontScale: 1,
      lineScale: null,
      useBullets: true,
      sectionTone: "black",
      smartLayout: null,
    };
  }
}

function savePreferences() {
  localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readResume() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(RESUME_ID);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

function writeResume(data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put({
      id: RESUME_ID,
      updatedAt: new Date().toISOString(),
      data: clone(data),
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function exportJson() {
  const payload = {
    app: "moben-resume",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    privacy: "Data is exported locally from this browser; no upload is performed.",
    resume,
  };
  downloadText(JSON.stringify(payload, null, 2), "json", "application/json");
}

function exportMarkdown() {
  downloadText(window.ResumeFileIO.toMarkdown(resume), "md", "text/markdown;charset=utf-8");
}

function downloadText(content, extension, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resumeFileName()}.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resumeFileName() {
  return (stripRichTags(resume.personal.name) || "简历")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/[. ]+$/g, "")
    .slice(0, 80) || "简历";
}

function printResumePdf() {
  const previousTitle = document.title;
  document.title = resumeFileName();
  const restore = () => { document.title = previousTitle; };
  window.addEventListener("afterprint", restore, { once: true });
  window.setTimeout(restore, 120000);
  window.print();
}

async function importPdf() {
  const file = els.importFile.files?.[0];
  if (!file) return;
  els.importFile.value = "";
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    window.alert("请选择 PDF 文件。");
    return;
  }
  els.importBtn.disabled = true;
  setSaveStatus("正在读取 PDF…");
  try {
    const result = await window.ResumeFileIO.extractPdfText(file, window.pdfjsLib);
    const draft = window.ResumeFileIO.parsePdfResume(result.text, file.name);
    pendingPdfName = file.name;
    els.importReviewText.value = result.text;
    els.importReviewSummary.textContent = `${result.pageCount} 页 · ${draft.personal.name || "未识别姓名"} · 栏目：${draft.sections.map((section) => section.title).join("、")}。请检查文字顺序及内容。`;
    els.importReview.showModal();
    setSaveStatus("");
  } catch (error) {
    window.alert(`导入失败：${error.message || "无法读取此 PDF"}`);
    setSaveStatus("PDF 导入失败，当前简历未改变");
    console.error("PDF import failed:", error);
  } finally {
    els.importBtn.disabled = false;
  }
}

async function confirmPdfImport() {
  let imported;
  try {
    imported = normalizeResume(
      window.ResumeFileIO.parsePdfResume(els.importReviewText.value, pendingPdfName),
      makeBlankResume(),
    );
  } catch (error) {
    window.alert(`无法导入：${error.message}`);
    return;
  }
  els.confirmPdfImport.disabled = true;
  try {
    if (db) await writeResume(imported);
    resume = imported;
    selectedSectionId = resume.sections[0]?.id || "";
    renderAll();
    els.importReview.close();
    setSaveStatus(db ? "已从 PDF 导入并保存到本机" : "已导入当前页面；本地自动保存不可用");
  } catch (error) {
    window.alert("保存失败，当前简历未改变。请检查浏览器存储空间。");
    console.error("PDF import save failed:", error);
  } finally {
    els.confirmPdfImport.disabled = false;
  }
}

function summarizeImportedResume(data) {
  const labels = data.sections.map((section) => `${section.title || SECTION_TYPES[section.type] || "模块"}${section.items.length}条`);
  const prefix = data.personal.name ? "个人信息" : "未识别姓名";
  return [prefix, ...labels].join("，");
}

async function readJsonFile(file) {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsText(file, "utf-8");
  });
}

function normalizeImportedResume(parsed) {
  const nativePayload = getResumePayload(parsed);
  if (nativePayload && isNativeResumePayload(nativePayload)) return normalizeResume(nativePayload, makeBlankResume());
  return normalizeLooseResume(nativePayload || parsed);
}

function getResumePayload(parsed) {
  if (!isImportContainer(parsed)) return null;
  if (isImportContainer(parsed.resume)) return parsed.resume;
  if (isImportContainer(parsed.data) && hasResumeLikeMarker(parsed.data)) return parsed.data;
  if (isImportContainer(parsed.content) && hasResumeLikeMarker(parsed.content)) return parsed.content;
  if (isImportContainer(parsed.result) && hasResumeLikeMarker(parsed.result)) return parsed.result;
  if (hasResumeLikeMarker(parsed)) return parsed;
  return null;
}

function isNativeResumePayload(value) {
  if (!isPlainObject(value) || !Array.isArray(value.sections)) return false;
  if (!isNativeResumeMarker(value)) return false;
  return value.sections.every((section) => {
    if (!isPlainObject(section)) return false;
    if (!SECTION_TYPES[section.type] || !Array.isArray(section.items)) return false;
    return section.items.every((item) => isPlainObject(item) && hasNativeItemField(section.type, item));
  });
}

function isNativeResumeMarker(value) {
  if (value.schemaVersion === 1 || value.app === "moben-resume") return true;
  if (!isPlainObject(value.personal)) return false;
  return ["name", "role", "phone", "email", "city", "links", "summary", "photo"].some((key) => key in value.personal);
}

function hasNativeItemField(type, item) {
  const nativeKeys = Object.keys(makeItem(type));
  return nativeKeys.some((key) => key in item);
}

function normalizeLooseResume(input) {
  const root = unwrapImportedRoot(input);
  const resumeData = makeBlankResume();
  fillLoosePersonal(resumeData.personal, root);
  resumeData.sections = buildLooseSections(root);

  if (!resumeData.sections.length) {
    resumeData.sections.push(makeRawJsonSection(input));
  }

  return resumeData;
}

function unwrapImportedRoot(input) {
  let current = input;
  for (let step = 0; step < 4; step += 1) {
    if (!isPlainObject(current) || hasResumeLikeMarker(current)) break;
    const wrapperKey = IMPORT_ALIASES.wrappers.find((key) => isImportContainer(current[key]));
    if (!wrapperKey) break;
    current = current[wrapperKey];
  }
  return current;
}

function hasResumeLikeMarker(value) {
  if (!isPlainObject(value)) return Array.isArray(value);
  const aliases = [
    ...IMPORT_ALIASES.personalSources,
    ...IMPORT_ALIASES.sections,
    ...IMPORT_ALIASES.education,
    ...IMPORT_ALIASES.experience,
    ...IMPORT_ALIASES.project,
    ...IMPORT_ALIASES.skills,
    ...IMPORT_ALIASES.name,
    ...IMPORT_ALIASES.email,
    ...IMPORT_ALIASES.phone,
  ];
  return Object.keys(value).some((key) => aliasMatches(key, aliases));
}

function fillLoosePersonal(personal, root) {
  const personalSource = findObjectByAliases(root, IMPORT_ALIASES.personalSources);
  const basics = isPlainObject(root?.basics) ? root.basics : null;
  const sources = [personalSource, basics, isPlainObject(root) ? root : null].filter(Boolean);

  personal.name = pickText(sources, IMPORT_ALIASES.name);
  personal.role = pickText(sources, IMPORT_ALIASES.role);
  personal.phone = pickText(sources, IMPORT_ALIASES.phone);
  personal.email = pickText(sources, IMPORT_ALIASES.email);
  personal.city = pickLocationText(sources);
  personal.links = pickLinksText(sources);
  personal.summary = pickText(sources, IMPORT_ALIASES.summary);
  personal.photo = photoDataValue(
    String(
      findValueByAliases(personalSource || {}, IMPORT_ALIASES.photo)
        || findValueByAliases(basics || {}, IMPORT_ALIASES.photo)
        || findValueByAliases(isPlainObject(root) ? root : {}, IMPORT_ALIASES.photo)
        || "",
    ),
    "",
  );
}

function buildLooseSections(root) {
  const sections = [];
  const explicitSections = findValueByAliases(root, IMPORT_ALIASES.sections);

  if (Array.isArray(explicitSections)) {
    sections.push(...explicitSections.map(convertLooseSection).filter(Boolean));
  }

  addLooseSection(sections, root, "education", "教育经历", IMPORT_ALIASES.education);
  addLooseSection(sections, root, "experience", "工作经历", IMPORT_ALIASES.experience);
  addLooseSection(sections, root, "project", "研究经历", IMPORT_ALIASES.research);
  addLooseSection(sections, root, "project", "项目经历", IMPORT_ALIASES.project);
  addLooseSection(sections, root, "skills", "技能清单", IMPORT_ALIASES.skills);

  addCustomLooseSection(sections, root, ["awards", "honors", "奖项", "荣誉"], "奖项荣誉");
  addCustomLooseSection(sections, root, ["certificates", "certifications", "证书", "认证"], "证书认证");
  addCustomLooseSection(sections, root, ["languages", "language", "语言", "语言能力"], "语言能力");
  addCustomLooseSection(sections, root, ["publications", "publication", "论文", "发表"], "论文发表");

  if (!sections.length && Array.isArray(root)) {
    const arraySections = root.map(convertLooseSection).filter(Boolean);
    if (arraySections.length) sections.push(...arraySections);
  }

  return sections.filter((section) => section.items.some((item) => !isItemEmpty(section.type, item)));
}

function addLooseSection(sections, root, type, title, aliases) {
  const value = findValueByAliases(root, aliases);
  if (value == null) return;
  const section = makeLooseSection(type, title, value);
  if (section) sections.push(section);
}

function addCustomLooseSection(sections, root, aliases, title) {
  const value = findValueByAliases(root, aliases);
  if (value == null) return;
  const section = makeLooseSection("custom", title, value);
  if (section) sections.push(section);
}

function convertLooseSection(section) {
  if (!isPlainObject(section)) return makeLooseSection("custom", "导入资料", section);
  const title = pickText([section], IMPORT_ALIASES.title) || "导入资料";
  const type = inferSectionType(`${section.type || ""} ${title}`);
  const items = findValueByAliases(section, IMPORT_ALIASES.items);
  return makeLooseSection(type, SECTION_TYPES[type] || title, items ?? section, title);
}

function makeLooseSection(type, fallbackTitle, value, explicitTitle = "") {
  const title = explicitTitle || fallbackTitle || SECTION_TYPES[type] || "导入资料";
  const rawItems = extractLooseItems(value, type);
  const items = rawItems.map((item) => convertLooseItem(type, item)).filter(Boolean);
  if (!items.length && value != null) items.push(convertLooseItem(type, value));
  if (!items.length) return null;
  return {
    id: createId("section"),
    type,
    title,
    items,
  };
}

function extractLooseItems(value, type = "custom") {
  if (Array.isArray(value)) return value;
  if (isPlainObject(value)) {
    const nested = findValueByAliases(value, IMPORT_ALIASES.items);
    if (Array.isArray(nested)) return nested;
    if (isPlainObject(nested)) return Object.entries(nested).map(([key, itemValue]) => ({ title: key, value: itemValue }));
    if (type === "skills") {
      return Object.entries(value).map(([category, items]) => ({
        category: humanizeImportKey(category),
        items,
      }));
    }
  }
  return value == null ? [] : [value];
}

function convertLooseItem(type, item) {
  if (type === "education") return convertLooseEducation(item);
  if (type === "experience") return convertLooseExperience(item);
  if (type === "project") return convertLooseProject(item);
  if (type === "skills") return convertLooseSkill(item);
  return convertLooseCustom(item);
}

function convertLooseEducation(item) {
  if (!isPlainObject(item)) {
    return { ...makeItem("education"), details: valueToLines(item) };
  }
  return {
    school: pickText([item], IMPORT_ALIASES.school),
    degree: pickText([item], IMPORT_ALIASES.degree),
    major: pickText([item], IMPORT_ALIASES.major),
    location: pickLocationText([item]),
    start: pickText([item], IMPORT_ALIASES.start),
    end: pickText([item], IMPORT_ALIASES.end),
    details: collectEducationDetails(item),
  };
}

function convertLooseExperience(item) {
  if (!isPlainObject(item)) {
    return { ...makeItem("experience"), details: valueToLines(item) };
  }
  return {
    company: pickText([item], IMPORT_ALIASES.company),
    role: pickText([item], IMPORT_ALIASES.itemRole),
    location: pickLocationText([item]),
    start: pickText([item], IMPORT_ALIASES.start),
    end: pickText([item], IMPORT_ALIASES.end),
    details: collectExperienceDetails(item),
  };
}

function convertLooseProject(item) {
  if (!isPlainObject(item)) {
    return { ...makeItem("project"), details: valueToLines(item) };
  }
  return {
    name: pickText([item], IMPORT_ALIASES.projectName),
    role: pickText([item], IMPORT_ALIASES.itemRole),
    link: joinParts([pickText([item], IMPORT_ALIASES.link), pickText([item], IMPORT_ALIASES.skills)], " / "),
    start: pickText([item], IMPORT_ALIASES.start),
    end: pickText([item], IMPORT_ALIASES.end),
    details: collectLooseDetails(item, IMPORT_ALIASES.detailText),
  };
}

function convertLooseSkill(item) {
  if (!isPlainObject(item)) {
    return { category: "", items: valueToText(item) };
  }
  const nestedValue = item.value ?? findValueByAliases(item, IMPORT_ALIASES.skillItems);
  return {
    category: pickText([item], IMPORT_ALIASES.category),
    items: formatSkillItems(nestedValue) || pickText([item], IMPORT_ALIASES.skillItems),
  };
}

function convertLooseCustom(item) {
  if (!isPlainObject(item)) {
    return { heading: "导入条目", subtitle: "", meta: "", details: valueToLines(item) };
  }
  const title = pickText([item], IMPORT_ALIASES.title) || pickText([item], IMPORT_ALIASES.category) || "导入条目";
  return {
    heading: title,
    subtitle: pickText([item], ["subtitle", "issuer", "organization", "company", "副标题", "机构", "单位"]),
    meta: joinParts([pickText([item], IMPORT_ALIASES.start), pickText([item], IMPORT_ALIASES.end)], " - "),
    details: collectLooseDetails(item, IMPORT_ALIASES.detailText),
  };
}

function collectEducationDetails(item) {
  const lines = [];
  pushJoinedDetail(lines, "相关课程", getImportLines(item, ["relevantCourses", "relevant_courses", "courses", "coreCourses", "核心课程", "相关课程"]));
  pushJoinedDetail(lines, "荣誉奖项", getImportLines(item, ["awards", "honors", "award", "honor", "奖项", "荣誉"]), "；");
  pushJoinedDetail(lines, "成绩排名", getImportLines(item, ["score", "gpa", "GPA", "rank", "ranking", "成绩", "绩点", "排名"]), "；");
  pushJoinedDetail(lines, "院校标签", getImportLines(item, ["schoolTags", "school_tags", "tags", "labels", "标签", "院校标签"]), " / ");
  lines.push(
    ...collectUnhandledDetails(item, [
      ...IMPORT_ALIASES.school,
      ...IMPORT_ALIASES.degree,
      ...IMPORT_ALIASES.major,
      ...IMPORT_ALIASES.city,
      ...IMPORT_ALIASES.start,
      ...IMPORT_ALIASES.end,
      "relevantCourses",
      "relevant_courses",
      "courses",
      "coreCourses",
      "awards",
      "honors",
      "award",
      "honor",
      "score",
      "gpa",
      "GPA",
      "rank",
      "ranking",
      "schoolTags",
      "school_tags",
      "tags",
      "labels",
    ]),
  );
  return uniqueLines(lines);
}

function collectExperienceDetails(item) {
  const highlightValue = findValueByAliases(item, [
    "highlight",
    "highlights",
    "achievement",
    "achievements",
    "responsibility",
    "responsibilities",
    "亮点",
    "成果",
    "职责",
  ]);
  const lines = formatHighlightLines(highlightValue);

  if (!lines.length) {
    lines.push(...collectLooseDetails(item, IMPORT_ALIASES.detailText));
  }

  lines.push(
    ...collectUnhandledDetails(item, [
      ...IMPORT_ALIASES.company,
      ...IMPORT_ALIASES.itemRole,
      ...IMPORT_ALIASES.city,
      ...IMPORT_ALIASES.start,
      ...IMPORT_ALIASES.end,
      ...IMPORT_ALIASES.detailText,
    ]),
  );
  return uniqueLines(lines);
}

function getImportLines(item, aliases) {
  const value = findValueByAliases(item, aliases);
  return valueToLines(value);
}

function pushJoinedDetail(target, label, values, separator = "、") {
  const lines = uniqueLines(values);
  if (lines.length) target.push(`${label}：${lines.join(separator)}`);
}

function formatHighlightLines(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return uniqueLines(value.flatMap(formatHighlightLines));
  if (!isPlainObject(value)) return valueToLines(value);

  const title = pickText([value], ["title", "name", "heading", "主题", "标题"]);
  const description = pickText([value], ["description", "detail", "details", "summary", "content", "text", "描述", "内容"]);
  if (title && description) return [`${title}：${description}`];
  if (description) return [description];
  if (title) return [title];
  return valueToLines(value);
}

function formatSkillItems(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(formatSkillEntry).filter(Boolean).join("、");
  if (isPlainObject(value)) return formatSkillEntry(value);
  return uniqueLines(valueToLines(value)).join("、");
}

function formatSkillEntry(value) {
  if (value == null || value === "") return "";
  if (!isPlainObject(value)) return uniqueLines(valueToLines(value)).join("、");

  const name = pickText([value], ["name", "skill", "language", "title", "技能", "语言", "名称"]);
  const qualification = pickText([value], ["qualification", "level", "proficiency", "certificate", "等级", "熟练度", "证书"]);
  const details = uniqueLines(
    valueToLines(findValueByAliases(value, ["details", "detail", "description", "keywords", "items", "内容", "说明", "关键词"])),
  );
  const suffix = [qualification, details.join("、")].filter(Boolean).join("；");
  if (name && suffix) return `${name}（${suffix}）`;
  if (name) return name;
  if (suffix) return suffix;
  return uniqueLines(valueToLines(value)).join("、");
}

function collectUnhandledDetails(item, excludedAliases) {
  const lines = [];
  Object.entries(item).forEach(([key, value]) => {
    if (aliasMatches(key, excludedAliases)) return;
    if (value == null || value === "") return;
    valueToLines(value, key).forEach((line) => lines.push(line));
  });
  return uniqueLines(lines);
}

function collectLooseDetails(item, aliases) {
  const lines = [];
  aliases.forEach((alias) => {
    const value = findValueByAliases(item, [alias]);
    if (value != null) lines.push(...valueToLines(value));
  });

  if (lines.length) return uniqueLines(lines);

  Object.entries(item).forEach(([key, value]) => {
    if (aliasMatches(key, [...IMPORT_ALIASES.title, ...IMPORT_ALIASES.start, ...IMPORT_ALIASES.end])) return;
    if (value == null || value === "") return;
    valueToLines(value, key).forEach((line) => lines.push(line));
  });
  return uniqueLines(lines);
}

function makeRawJsonSection(input) {
  const lines = valueToLines(input).slice(0, 80);
  return {
    id: createId("section"),
    type: "custom",
    title: "导入资料",
    items: [
      {
        heading: "原始 JSON",
        subtitle: "未识别为标准简历结构，已保留文本内容",
        meta: "",
        details: lines.length ? lines : ["空 JSON"],
      },
    ],
  };
}

function makeBlankResume() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    personal: {
      name: "",
      role: "",
      phone: "",
      email: "",
      city: "",
      links: "",
      photo: "",
      summary: "",
      contactOrder: [...DEFAULT_CONTACT_ORDER],
    },
    sections: [],
  };
}

function inferSectionType(text) {
  const value = normalizeImportKey(text);
  if (["education", "educations", "academic", "schools", "jiaoyu", "xueli"].some((key) => value.includes(key)) || /教育|学历/.test(text)) return "education";
  if (["work", "experience", "employment", "jobs", "internship"].some((key) => value.includes(key)) || /工作|实习|经历|职业/.test(text)) return "experience";
  if (["project", "projects"].some((key) => value.includes(key)) || /项目/.test(text)) return "project";
  if (["skill", "skills"].some((key) => value.includes(key)) || /技能|技术栈/.test(text)) return "skills";
  return "custom";
}

function pickText(sources, aliases) {
  for (const source of sources) {
    const value = findValueByAliases(source, aliases);
    const text = valueToText(value);
    if (text) return text;
  }
  return "";
}

function pickLocationText(sources) {
  for (const source of sources) {
    const direct = valueToText(findValueByAliases(source, IMPORT_ALIASES.city));
    if (direct) return direct;
    const location = findValueByAliases(source, ["location", "address", "地点", "地址"]);
    if (isPlainObject(location)) {
      const text = joinParts(
        [
          pickText([location], ["city", "城市"]),
          pickText([location], ["region", "province", "state", "省份", "地区"]),
          pickText([location], ["country", "countryCode", "国家"]),
        ],
        " · ",
      );
      if (text) return text;
    }
  }
  return "";
}

function pickLinksText(sources) {
  const links = [];
  sources.forEach((source) => {
    const direct = findValueByAliases(source, IMPORT_ALIASES.links);
    if (Array.isArray(direct)) {
      direct.forEach((item) => {
        const text = isPlainObject(item)
          ? joinParts([pickText([item], ["network", "type", "平台"]), pickText([item], ["username", "name", "用户名"]), pickText([item], IMPORT_ALIASES.link)], " ")
          : valueToText(item);
        if (text) links.push(text);
      });
    } else {
      const text = valueToText(direct);
      if (text) links.push(text);
    }
  });
  return uniqueLines(links).join(" · ");
}

function findObjectByAliases(source, aliases) {
  const value = findValueByAliases(source, aliases);
  return isPlainObject(value) ? value : null;
}

function findValueByAliases(source, aliases) {
  if (!isPlainObject(source)) return undefined;
  const entry = Object.entries(source).find(([key]) => aliasMatches(key, aliases));
  return entry ? entry[1] : undefined;
}

function aliasMatches(key, aliases) {
  const normalizedKey = normalizeImportKey(key);
  return aliases.some((alias) => normalizedKey === normalizeImportKey(alias));
}

function normalizeImportKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[\s_\-.\/:：()（）[\]【】]/g, "");
}

function humanizeImportKey(key) {
  const raw = String(key || "").trim();
  const known = {
    research_methods: "研究方法",
    researchMethods: "研究方法",
    software: "软件工具",
    tools: "工具",
    languages: "语言能力",
    language: "语言能力",
  };
  if (known[raw]) return known[raw];
  return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valueToText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(" · ");
  if (isPlainObject(value)) {
    const preferred = pickText([value], ["name", "title", "label", "value", "text", "url", "名称", "标题", "内容"]);
    if (preferred) return preferred;
  }
  return "";
}

function valueToLines(value, prefix = "") {
  const label = prefix ? `${prefix}: ` : "";
  if (value == null || value === "") return [];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    if (/^data:image\//i.test(text)) return [`${label}本地图片数据`];
    return parseLines(`${label}${clipImportText(text)}`);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => valueToLines(item)).filter(Boolean);
  }
  if (isPlainObject(value)) {
    return Object.entries(value)
      .flatMap(([key, itemValue]) => valueToLines(itemValue, key))
      .filter(Boolean);
  }
  return [];
}

function clipImportText(text) {
  const value = String(text || "").trim();
  return value.length > 220 ? `${value.slice(0, 220)}...` : value;
}

function uniqueLines(lines) {
  const seen = new Set();
  return lines
    .map((line) => String(line || "").trim())
    .filter((line) => {
      if (!line || seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function isImportContainer(value) {
  return isPlainObject(value) || Array.isArray(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function writeResumeIfReady() {
  if (!db) return;
  await writeResume(resume);
}

function normalizeResume(input, fallback = makeDefaultResume()) {
  const source = input && typeof input === "object" ? input : fallback;
  const sections = Array.isArray(source.sections) ? source.sections : fallback.sections;

  return {
    schemaVersion: 1,
    updatedAt: source.updatedAt || new Date().toISOString(),
    personal: {
      name: stringValue(source.personal?.name, fallback.personal.name),
      role: stringValue(source.personal?.role, fallback.personal.role),
      phone: stringValue(source.personal?.phone, fallback.personal.phone),
      email: stringValue(source.personal?.email, fallback.personal.email),
      city: stringValue(source.personal?.city, fallback.personal.city),
      links: stringValue(source.personal?.links, fallback.personal.links),
      summary: stringValue(source.personal?.summary, fallback.personal.summary),
      photo: photoDataValue(source.personal?.photo, fallback.personal.photo),
      contactOrder: normalizeContactOrder(source.personal?.contactOrder || fallback.personal.contactOrder),
    },
    sections: sections.map(normalizeSection).filter(Boolean),
  };
}

function normalizeSection(section) {
  if (!section || typeof section !== "object") return null;
  const type = SECTION_TYPES[section.type] ? section.type : "custom";
  const items = Array.isArray(section.items) ? section.items : [];
  return {
    id: stringValue(section.id, createId("section")),
    type,
    title: stringValue(section.title, SECTION_TYPES[type]),
    items: items.map((item) => normalizeItem(type, item)),
  };
}

function normalizeItem(type, item) {
  const base = makeItem(type);
  const source = item && typeof item === "object" ? item : {};
  Object.keys(base).forEach((key) => {
    if (key === "details") {
      base.details = parseLines(source.details);
    } else {
      base[key] = stringValue(source[key], base[key]);
    }
  });
  return base;
}

function makeDefaultResume() {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    personal: {
      name: "林知远",
      role: "前端工程师 / 产品型开发者",
      phone: "138 0000 0000",
      email: "lin@example.com",
      city: "上海",
      links: "github.com/linzy · portfolio.example",
      photo: "",
      summary:
        "5 年前端与产品协作经验，擅长把复杂业务流程转化为清晰、稳定、易维护的 Web 工具。关注性能、可访问性和数据隐私，习惯用可验证的交付推动团队迭代。",
      contactOrder: [...DEFAULT_CONTACT_ORDER],
    },
    sections: [
      {
        id: createId("section"),
        type: "experience",
        title: "工作经历",
        items: [
          {
            company: "星河科技",
            role: "高级前端工程师",
            location: "上海",
            start: "2023.04",
            end: "至今",
            details: [
              "负责招聘 SaaS 的简历解析、候选人看板和权限组件，支撑 20+ 企业客户日常使用。",
              "重构表单状态与预览渲染链路，将核心页面首屏渲染时间降低约 35%。",
              "推动设计系统落地，沉淀 40+ 可复用组件，减少跨团队重复实现。",
            ],
          },
          {
            company: "青舟网络",
            role: "前端工程师",
            location: "杭州",
            start: "2020.07",
            end: "2023.03",
            details: [
              "参与搭建低代码运营后台，覆盖活动配置、数据校验、发布回滚等核心流程。",
              "与产品、设计和后端共同梳理复杂表格交互，提升运营配置效率。",
            ],
          },
        ],
      },
      {
        id: createId("section"),
        type: "project",
        title: "项目经历",
        items: [
          {
            name: "本地优先简历制作器",
            role: "独立设计与开发",
            link: "IndexedDB / A4 Preview / JSON Backup",
            start: "2026.08",
            end: "",
            details: [
              "实现结构化编辑、实时预览、模板切换、A4 分页和打印导出 PDF。",
              "采用纯前端本地存储，不接入后端、统计脚本、外部字体或 CDN。",
            ],
          },
        ],
      },
      {
        id: createId("section"),
        type: "education",
        title: "教育经历",
        items: [
          {
            school: "浙江大学",
            degree: "本科",
            major: "软件工程",
            location: "杭州",
            start: "2016.09",
            end: "2020.06",
            details: ["主修数据结构、计算机网络、人机交互与 Web 工程。"],
          },
        ],
      },
      {
        id: createId("section"),
        type: "skills",
        title: "技能清单",
        items: [
          { category: "前端", items: "JavaScript, TypeScript, React, Vue, HTML/CSS, 可访问性" },
          { category: "工程", items: "Vite, Git, 测试自动化, 性能优化, 组件库建设" },
          { category: "协作", items: "需求拆解, 原型评审, 跨职能沟通, 文档沉淀" },
        ],
      },
    ],
  };
}

function makeSection(type) {
  const safeType = SECTION_TYPES[type] ? type : "custom";
  return {
    id: createId("section"),
    type: safeType,
    title: SECTION_TYPES[safeType],
    items: [makeItem(safeType)],
  };
}

function makeItem(type) {
  if (type === "education") {
    return { school: "", degree: "", major: "", location: "", start: "", end: "", details: [] };
  }
  if (type === "experience") {
    return { company: "", role: "", location: "", start: "", end: "", details: [] };
  }
  if (type === "project") {
    return { name: "", role: "", link: "", start: "", end: "", details: [] };
  }
  if (type === "skills") {
    return { category: "", items: "" };
  }
  return { heading: "", subtitle: "", meta: "", details: [] };
}

function getFieldsForType(type) {
  if (type === "education") {
    return [
      { key: "school", label: "院校", placeholder: "学校名称" },
      { key: "degree", label: "学位", placeholder: "本科 / 硕士" },
      { key: "major", label: "专业", placeholder: "专业方向" },
      { key: "location", label: "地点", placeholder: "城市" },
      { key: "start", label: "开始", placeholder: "2020.09" },
      { key: "end", label: "结束", placeholder: "2024.06" },
      { key: "details", label: "要点", textarea: true, full: true, placeholder: "每行一条，例如：GPA / 奖项 / 课程" },
    ];
  }
  if (type === "experience") {
    return [
      { key: "company", label: "公司 / 组织", placeholder: "公司名称" },
      { key: "role", label: "职位", placeholder: "岗位名称" },
      { key: "location", label: "地点", placeholder: "城市 / 远程" },
      { key: "start", label: "开始", placeholder: "2022.03" },
      { key: "end", label: "结束", placeholder: "至今" },
      { key: "details", label: "要点", textarea: true, full: true, placeholder: "每行一条，尽量使用动作 + 结果" },
    ];
  }
  if (type === "project") {
    return [
      { key: "name", label: "项目名称", placeholder: "项目 / 产品名称" },
      { key: "role", label: "角色", placeholder: "负责人 / 开发者" },
      { key: "link", label: "链接 / 技术", placeholder: "链接、技术栈或关键词" },
      { key: "start", label: "开始", placeholder: "2024.01" },
      { key: "end", label: "结束", placeholder: "2024.06" },
      { key: "details", label: "要点", textarea: true, full: true, placeholder: "每行一条，突出目标、行动和成果" },
    ];
  }
  if (type === "skills") {
    return [
      { key: "category", label: "分类", placeholder: "前端 / 数据 / 语言" },
      { key: "items", label: "技能项", textarea: true, full: true, placeholder: "用逗号或顿号分隔技能" },
    ];
  }
  return [
    { key: "heading", label: "标题", placeholder: "证书 / 语言 / 奖项" },
    { key: "subtitle", label: "副标题", placeholder: "补充信息" },
    { key: "meta", label: "时间 / 地点", placeholder: "2026 / 上海" },
    { key: "details", label: "要点", textarea: true, full: true, placeholder: "每行一条" },
  ];
}

function getItemLabel(type, item, index) {
  if (type === "education") return stripRichTags(item.school) || `教育条目 ${index + 1}`;
  if (type === "experience") return stripRichTags(item.company) || stripRichTags(item.role) || `经历条目 ${index + 1}`;
  if (type === "project") return stripRichTags(item.name) || `项目条目 ${index + 1}`;
  if (type === "skills") return stripRichTags(item.category) || `技能条目 ${index + 1}`;
  return stripRichTags(item.heading) || `自定义条目 ${index + 1}`;
}

function confirmItemDeletion(type) {
  const label = type === "skills" ? "这条技能" : type === "custom" ? "这个条目" : "这段经历";
  return window.confirm(`确定删除${label}？`);
}

function getSelectedSection() {
  return resume.sections.find((section) => section.id === selectedSectionId) || null;
}

function setOptions(select, options, selected) {
  select.replaceChildren(
    ...options.map((option) => {
      const node = document.createElement("option");
      node.value = option.id;
      node.textContent = option.label;
      node.selected = option.id === selected;
      return node;
    }),
  );
}

function appendDateAndLocation(parent, item, sectionId, itemIndex) {
  appendDateRange(parent, item, sectionId, itemIndex);
  appendEditablePart(parent, item.location, {
    scope: "item",
    sectionId,
    itemIndex,
    field: "location",
  }, " · ");
}

function appendParenthetical(parent, text, target) {
  const value = String(text || "").trim();
  if (!value) return;
  parent.append(document.createTextNode("（"));
  parent.append(editableInline(value, target));
  parent.append(document.createTextNode("）"));
}

function appendDateRange(parent, item, sectionId, itemIndex) {
  appendEditablePart(parent, item.start, {
    scope: "item",
    sectionId,
    itemIndex,
    field: "start",
  });
  appendEditablePart(parent, item.end, {
    scope: "item",
    sectionId,
    itemIndex,
    field: "end",
  }, " - ");
}

function appendEditablePart(parent, text, target, separator = "") {
  const value = String(text || "").trim();
  if (!value) return;
  if (separator && parent.textContent.trim()) {
    parent.append(document.createTextNode(separator));
  }
  parent.append(editableInline(value, target));
}

function editableInline(text, target) {
  const node = document.createElement("span");
  setRichContent(node, text);
  return withEditTarget(node, target);
}

function setRichContent(node, value) {
  node.replaceChildren(createRichFragment(value));
}

function createRichFragment(value) {
  const fragment = document.createDocumentFragment();
  const source = String(value || "");
  const tagPattern = /\[(\/?)(b|i|u|color|link)(?:=([^\]]+))?\]/gi;
  const marks = { bold: 0, italic: 0, underline: 0, colors: [], links: [] };
  let lastIndex = 0;
  let match = tagPattern.exec(source);

  while (match) {
    appendRichText(fragment, source.slice(lastIndex, match.index), marks);
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const color = match[3];

    if (tag === "link") {
      if (closing) marks.links.pop();
      else {
        let href = "";
        try { href = safeLink(decodeURIComponent(color || "")); } catch { href = ""; }
        marks.links.push(href);
      }
    } else if (tag === "color") {
      if (closing) {
        marks.colors.pop();
      } else if (color === "blue" || color === "black") {
        marks.colors.push(color);
      }
    } else if (closing) {
      marks[tag === "b" ? "bold" : tag === "i" ? "italic" : "underline"] = Math.max(
        0,
        marks[tag === "b" ? "bold" : tag === "i" ? "italic" : "underline"] - 1,
      );
    } else {
      marks[tag === "b" ? "bold" : tag === "i" ? "italic" : "underline"] += 1;
    }

    lastIndex = tagPattern.lastIndex;
    match = tagPattern.exec(source);
  }

  appendRichText(fragment, source.slice(lastIndex), marks);
  return fragment;
}

function appendRichText(parent, text, marks) {
  if (!text) return;
  const pieces = text.split("\n");
  pieces.forEach((piece, index) => {
    if (index > 0) parent.append(document.createElement("br"));
    if (!piece) return;
    const span = document.createElement("span");
    span.textContent = piece;
    if (marks.bold) span.classList.add("rt-bold");
    if (marks.italic) span.classList.add("rt-italic");
    if (marks.underline) span.classList.add("rt-underline");
    const color = marks.colors[marks.colors.length - 1];
    if (color === "blue") span.classList.add("rt-blue");
    if (color === "black") span.classList.add("rt-black");
    const href = marks.links[marks.links.length - 1];
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(span);
      parent.append(link);
    } else {
      parent.append(span);
    }
  });
}

function serializeRichContent(root) {
  function serialize(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.tagName === "BR") return "\n";
    let content = Array.from(node.childNodes).map(serialize).join("");
    const tags = [];
    if (node.tagName === "B" || node.tagName === "STRONG" || node.classList.contains("rt-bold")) tags.push("b");
    if (node.tagName === "I" || node.tagName === "EM" || node.classList.contains("rt-italic")) tags.push("i");
    if (node.tagName === "U" || node.classList.contains("rt-underline")) tags.push("u");
    if (node.classList.contains("rt-blue")) tags.push("color=blue");
    if (node.classList.contains("rt-black")) tags.push("color=black");
    if (node.tagName === "A" && safeLink(node.getAttribute("href") || "")) tags.push(`link=${encodeURIComponent(node.getAttribute("href"))}`);
    for (const tag of tags) content = `[${tag}]${content}[/${tag.split("=")[0]}]`;
    return content;
  }
  return Array.from(root.childNodes).map(serialize).join("");
}

function withEditTarget(node, target) {
  node.classList.add("preview-editable");
  node.dataset.editScope = target.scope;
  node.dataset.editField = target.field;
  if (target.sectionId) node.dataset.editSectionId = target.sectionId;
  if (Number.isInteger(target.itemIndex)) node.dataset.editItemIndex = String(target.itemIndex);
  if (Number.isInteger(target.detailIndex)) node.dataset.editDetailIndex = String(target.detailIndex);
  node.tabIndex = 0;
  node.contentEditable = "true";
  node.spellcheck = false;
  node.title = "点击直接编辑";
  return node;
}

function sectionHeading(title, description) {
  const heading = div("section-heading");
  const text = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.textContent = title;
  const p = document.createElement("p");
  p.textContent = description;
  text.append(h2, p);
  heading.append(text);
  return heading;
}

function formGrid(children) {
  const grid = div("form-grid");
  grid.append(...children);
  return grid;
}

function button(className, action, sectionId) {
  const node = document.createElement("button");
  node.className = className;
  node.dataset.action = action;
  node.dataset.sectionId = sectionId;
  return node;
}

function fieldControl(label, value, options) {
  const wrapper = document.createElement("label");
  wrapper.className = `field${options.full ? " full" : ""}`;
  const labelText = document.createElement("span");
  labelText.textContent = label;
  const input = options.textarea ? document.createElement("textarea") : document.createElement("input");
  input.value = value || "";
  input.placeholder = options.placeholder || "";

  if (options.personal) input.dataset.personalField = options.key;
  if (options.sectionTitle) input.dataset.sectionTitle = "true";
  if (Number.isInteger(options.itemIndex)) input.dataset.itemIndex = String(options.itemIndex);
  if (options.key) input.dataset.field = options.key;

  wrapper.append(labelText, input);
  return wrapper;
}

function iconButton(text, title, action, sectionId, disabled, extraClass = "") {
  const node = document.createElement("button");
  node.className = `icon-button ${extraClass}`.trim();
  node.type = "button";
  node.title = title;
  node.setAttribute("aria-label", title);
  node.dataset.action = action;
  node.dataset.sectionId = sectionId;
  node.disabled = disabled;
  node.textContent = text;
  return node;
}

function itemAction(text, title, action, itemIndex, disabled, extraClass = "") {
  const node = document.createElement("button");
  node.className = `icon-button ${extraClass}`.trim();
  node.type = "button";
  node.title = title;
  node.setAttribute("aria-label", title);
  node.dataset.action = action;
  node.dataset.itemIndex = String(itemIndex);
  node.disabled = disabled;
  node.textContent = text;
  return node;
}

function emptyState(text) {
  const node = document.createElement("p");
  node.className = "empty-state";
  node.textContent = text;
  return node;
}

function div(className) {
  const node = document.createElement("div");
  node.className = className;
  return node;
}

function escapeAttr(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function strong(text) {
  const node = document.createElement("strong");
  node.textContent = text;
  return node;
}

function span(text) {
  const node = document.createElement("span");
  node.textContent = text;
  return node;
}

function parseLines(value) {
  if (Array.isArray(value)) return value.map(String).map((line) => line.trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getContactOrder() {
  const order = normalizeContactOrder(resume.personal?.contactOrder);
  resume.personal.contactOrder = order;
  return order;
}

function normalizeContactOrder(value) {
  const input = Array.isArray(value) ? value : [];
  const known = new Set(DEFAULT_CONTACT_ORDER);
  const order = input.filter((key) => known.has(key));
  DEFAULT_CONTACT_ORDER.forEach((key) => {
    if (!order.includes(key)) order.push(key);
  });
  return order;
}

function stripRichTags(value) {
  return String(value || "")
    .replace(/\[(\/?)(b|i|u|color|link)(?:=([^\]]+))?\]/gi, "")
    .replace(/\u200b/g, "")
    .trim();
}

function linesToText(value) {
  return parseLines(value).join("\n");
}

function dateRange(start, end) {
  return joinParts([start, end], " - ");
}

function joinParts(parts, separator) {
  return parts.map((part) => String(part || "").trim()).filter(Boolean).join(separator);
}

function isItemEmpty(type, item) {
  const plain = (parts) => parts.map(stripRichTags).join("");
  if (type === "skills") return !plain([item.category, item.items]);
  if (type === "education") return !plain([item.school, item.degree, item.major, item.location, item.start, item.end, linesToText(item.details)]);
  if (type === "experience") return !plain([item.company, item.role, item.location, item.start, item.end, linesToText(item.details)]);
  if (type === "project") return !plain([item.name, item.role, item.link, item.start, item.end, linesToText(item.details)]);
  return !plain([item.heading, item.subtitle, item.meta, linesToText(item.details)]);
}

function moveItem(items, from, to) {
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
}

function stringValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function photoDataValue(value, fallback = "") {
  const text = stringValue(value, fallback).trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(text)) return text;
  return "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function setSaveStatus(text) {
  els.saveStatus.textContent = text;
}
