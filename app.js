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

const els = {
  templateSelect: document.getElementById("templateSelect"),
  beautifyBtn: document.getElementById("beautifyBtn"),
  beautifyPopover: document.getElementById("beautifyPopover"),
  densitySelect: document.getElementById("densitySelect"),
  fontScale: document.getElementById("fontScale"),
  bulletToggle: document.getElementById("bulletToggle"),
  toneOptions: document.getElementById("toneOptions"),
  smartFitBtn: document.getElementById("smartFitBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  exportBtn: document.getElementById("exportBtn"),
  printBtn: document.getElementById("printBtn"),
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
let formatToolbar = null;
let activeFormatTarget = null;

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
      setSaveStatus("已从本机 IndexedDB 读取");
    } else {
      await writeResume(resume);
      setSaveStatus("已创建本机 IndexedDB 简历");
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
  els.fontScale.value = String(preferences.fontScale);
  els.bulletToggle.checked = preferences.useBullets;
  renderToneOptions();
}

function renderToneOptions() {
  if (!els.toneOptions) return;
  const selectedTone = preferences.sectionTone || "black";
  els.toneOptions.querySelectorAll("[data-tone]").forEach((button) => {
    const active = button.dataset.tone === selectedTone;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function closeBeautifyPopover() {
  if (!els.beautifyPopover || els.beautifyPopover.hidden) return;
  els.beautifyPopover.hidden = true;
  els.beautifyBtn.setAttribute("aria-expanded", "false");
}

function wireEvents() {
  if (els.templateSelect) {
    els.templateSelect.addEventListener("change", () => {
      preferences.template = els.templateSelect.value;
      clearSmartLayout();
      savePreferences();
      applyPreferences();
      queuePreview();
    });
  }

  els.beautifyBtn.addEventListener("click", () => {
    const isOpen = els.beautifyPopover.hidden;
    els.beautifyPopover.hidden = !isOpen;
    els.beautifyBtn.setAttribute("aria-expanded", String(isOpen));
  });

  els.toneOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tone]");
    if (!button) return;
    const tone = SECTION_TONES.find((item) => item.id === button.dataset.tone) || SECTION_TONES[0];
    preferences.sectionTone = tone.id;
    clearSmartLayout();
    savePreferences();
    applyPreferences();
    renderToneOptions();
    queuePreview();
    setSaveStatus(`栏目名称已设为${tone.label}`);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBeautifyPopover();
  });

  document.addEventListener("mousedown", (event) => {
    if (els.beautifyPopover.hidden) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (els.beautifyPopover.contains(target) || els.beautifyBtn.contains(target)) return;
    closeBeautifyPopover();
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
    clearSmartLayout();
    savePreferences();
    applyPreferences();
    queuePreview();
  });

  els.fontScale.addEventListener("input", () => {
    preferences.fontScale = Number(els.fontScale.value);
    clearSmartLayout();
    savePreferences();
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
  els.importFile.addEventListener("change", importJson);
  els.exportBtn.addEventListener("click", exportJson);
  els.printBtn.addEventListener("click", () => window.print());

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
      if (!window.confirm("删除这个模块？内容会从当前简历中移除。")) return;
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

  els.previewPages.addEventListener("click", handlePreviewEdit);
  els.previewPages.addEventListener("keydown", (event) => {
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
      if (!window.confirm("删除这一条内容？")) return;
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
  document.addEventListener("mousedown", (event) => {
    if (!formatToolbar || formatToolbar.hidden || formatToolbar.contains(event.target)) return;
    const target = event.target;
    if (target instanceof Element && target.closest(".editor-panel")) return;
    hideFormatToolbar();
  });
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
    sectionHeading("编辑模块", `${SECTION_TYPES[section.type] || "自定义"} · 实时同步到右侧预览。`),
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

function handlePreviewEdit(event) {
  const node = event.target.closest("[data-edit-scope]");
  if (!node) return;
  event.preventDefault();
  focusEditorTarget({
    scope: node.dataset.editScope,
    sectionId: node.dataset.editSectionId || "",
    itemIndex: Number(node.dataset.editItemIndex),
    field: node.dataset.editField || "",
    detailIndex: Number(node.dataset.editDetailIndex),
  });
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

function applyTextFormat(action, color) {
  if (!activeFormatTarget) return;
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

  const contactParts = hasPhoto
    ? [
        { field: "phone", value: personal.phone, icon: "☎" },
        { field: "email", value: personal.email, icon: "@" },
        { field: "links", value: personal.links, icon: "↗" },
        { field: "city", value: personal.city, icon: "⌖" },
      ].filter((part) => part.value)
    : [
        { field: "phone", value: personal.phone },
        { field: "email", value: personal.email },
        { field: "city", value: personal.city },
        { field: "links", value: personal.links },
      ].filter((part) => part.value);

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
  if (!useIcon) {
    setRichContent(item, part.value);
    return withEditTarget(item, { scope: "personal", field: part.field });
  }

  item.className = "contact-item";
  const icon = document.createElement("span");
  icon.className = "contact-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = part.icon;
  const value = document.createElement("span");
  value.className = "contact-value";
  setRichContent(value, part.value);
  withEditTarget(value, { scope: "personal", field: part.field });
  item.append(icon, value);
  return item;
}

function buildResumeSection(section) {
  const visibleItems = section.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !isItemEmpty(section.type, item));
  if (!visibleItems.length) return null;

  const sectionNode = document.createElement("section");
  sectionNode.className = "resume-section";

  const title = document.createElement("h2");
  setRichContent(title, section.title || SECTION_TYPES[section.type] || "自定义模块");
  withEditTarget(title, { scope: "section", sectionId: section.id, field: "title" });
  sectionNode.append(title);

  const entries = div("entries");
  visibleItems.forEach(({ item, index }) => {
    const entry = buildResumeEntry(section, item, index);
    if (entry) entries.append(entry);
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
    row.append(category, text);
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
      setRichContent(line, point);
      withEditTarget(line, {
        scope: "item",
        sectionId,
        itemIndex: index,
        field: "details",
        detailIndex,
      });
      list.append(line);
    });
    entry.append(list);
  }

  return entry;
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

  blocks.filter(Boolean).forEach((block) => {
    const clone = block.cloneNode(true);
    measurePage.append(clone);

    if (measurePage.scrollHeight > pageHeight && measurePage.children.length > 1) {
      measurePage.removeChild(clone);
      current = [];
      pages.push(current);
      measurePage = div("measure-page");
      wrapper.replaceChildren(measurePage);
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
    line: baseDensity.line,
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
    line: density.line,
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
      useBullets: typeof raw.useBullets === "boolean" ? raw.useBullets : true,
      sectionTone: SECTION_TONES.some((item) => item.id === raw.sectionTone) ? raw.sectionTone : "black",
      smartLayout: normalizeSmartLayout(raw.smartLayout),
    };
  } catch {
    return {
      template: ACTIVE_TEMPLATE,
      density: "comfortable",
      fontScale: 1,
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
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `moben-resume-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function importJson() {
  const file = els.importFile.files?.[0];
  if (!file) return;

  let imported = null;
  try {
    const parsed = JSON.parse(await readJsonFile(file));
    imported = normalizeResume(getResumePayload(parsed));
  } catch (error) {
    window.alert("导入失败：请选择由本工具导出的简历 JSON，或包含 personal / sections 的有效 JSON。");
    console.error("Import parse failed:", error);
    els.importFile.value = "";
    return;
  }

  els.importFile.value = "";
  if (!window.confirm("导入 JSON 会替换当前简历内容。继续导入？")) return;

  resume = imported;
  resume.updatedAt = new Date().toISOString();
  selectedSectionId = resume.sections[0]?.id || "";
  renderAll();

  try {
    await writeResumeIfReady();
    setSaveStatus("已导入并保存到本机");
  } catch (error) {
    setSaveStatus("已导入到当前页面，但自动保存失败；可先导出 JSON 备份");
    console.error("Import save failed:", error);
  }
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

function getResumePayload(parsed) {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON payload");
  if (parsed.resume && typeof parsed.resume === "object") return parsed.resume;
  if (parsed.data && typeof parsed.data === "object" && (parsed.data.personal || parsed.data.sections)) return parsed.data;
  if (parsed.personal || parsed.sections) return parsed;
  throw new Error("JSON does not contain resume data");
}

async function writeResumeIfReady() {
  if (!db) return;
  await writeResume(resume);
}

function normalizeResume(input) {
  const fallback = makeDefaultResume();
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
  const tagPattern = /\[(\/?)(b|i|u|color)(?:=(blue|black))?\]/gi;
  const marks = { bold: 0, italic: 0, underline: 0, colors: [] };
  let lastIndex = 0;
  let match = tagPattern.exec(source);

  while (match) {
    appendRichText(fragment, source.slice(lastIndex, match.index), marks);
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const color = match[3];

    if (tag === "color") {
      if (closing) {
        marks.colors.pop();
      } else if (color) {
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
    parent.append(span);
  });
}

function withEditTarget(node, target) {
  node.classList.add("preview-editable");
  node.dataset.editScope = target.scope;
  node.dataset.editField = target.field;
  if (target.sectionId) node.dataset.editSectionId = target.sectionId;
  if (Number.isInteger(target.itemIndex)) node.dataset.editItemIndex = String(target.itemIndex);
  if (Number.isInteger(target.detailIndex)) node.dataset.editDetailIndex = String(target.detailIndex);
  node.tabIndex = 0;
  node.title = "点击编辑这段内容";
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

function stripRichTags(value) {
  return String(value || "")
    .replace(/\[(\/?)(b|i|u|color)(?:=(blue|black))?\]/gi, "")
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
