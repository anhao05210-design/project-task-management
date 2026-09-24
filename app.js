(() => {
  const STORAGE_KEY = "project-task-management-demo-v1";
  const STATUSES = [
    { id:"todo", label:"待开始", className:"todo" },
    { id:"started", label:"进行中", className:"started" },
    { id:"review", label:"待验收", className:"review" },
    { id:"done", label:"已完成", className:"done" }
  ];
  const PEOPLE = ["林晓", "陈婧", "王睿", "周宁", "未分配"];
  const CYCLE_ID = "cycle-08";

  function shiftDay(days) {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  const sampleBoard = {
    cycle:{id:CYCLE_ID,name:"第 08 期迭代",startDate:shiftDay(-5),endDate:shiftDay(9)},
    tasks:[
      {id:"ORB-128",title:"梳理移动端首次启动流程",description:"盘点首次打开 App 到完成注册的关键路径，标记高流失环节并形成流程图。",status:"todo",priority:"高",assignee:"林晓",labels:["用户体验"],cycleId:CYCLE_ID},
      {id:"ORB-129",title:"统一表单输入与错误提示样式",description:"对照设计系统，统一输入框状态、校验提示和辅助文案。",status:"todo",priority:"中",assignee:"陈婧",labels:["设计系统"],cycleId:CYCLE_ID},
      {id:"ORB-130",title:"优化首页卡片加载骨架屏",description:"弱网条件下先展示结构占位，降低页面空白带来的等待感。",status:"todo",priority:"低",assignee:"周宁",labels:["性能"],cycleId:CYCLE_ID},
      {id:"ORB-131",title:"增加订单列表快捷筛选",description:"支持按订单状态和时间范围快速筛选，减少查找步骤。",status:"started",priority:"高",assignee:"王睿",labels:["功能迭代"],cycleId:CYCLE_ID},
      {id:"ORB-132",title:"设计个人资料页新版布局",description:"重新组织头像、基本信息和偏好设置，让常用信息更容易找到。",status:"started",priority:"中",assignee:"陈婧",labels:["设计"],cycleId:CYCLE_ID},
      {id:"ORB-133",title:"补充空状态引导文案",description:"为空列表增加下一步操作提示和清晰的行动入口。",status:"started",priority:"低",assignee:"林晓",labels:["内容体验"],cycleId:CYCLE_ID},
      {id:"ORB-134",title:"检查 iOS 深色模式对比度",description:"逐页检查文字与交互控件的可读性，记录需调整的颜色令牌。",status:"review",priority:"中",assignee:"周宁",labels:["无障碍"],cycleId:CYCLE_ID},
      {id:"ORB-135",title:"埋点：首次搜索到结果点击",description:"补充搜索结果曝光、筛选和点击事件，便于分析搜索成功率。",status:"done",priority:"高",assignee:"王睿",labels:["数据分析"],cycleId:CYCLE_ID},
      {id:"ORB-136",title:"确认空页面插画与品牌规范",description:"完成资源审核，并与品牌团队确认插画尺寸及色彩使用。",status:"done",priority:"低",assignee:"陈婧",labels:["品牌"],cycleId:CYCLE_ID},
      {id:"ORB-137",title:"更新应用商店截图",description:"按新版界面重新制作商店截图和功能说明。",status:"todo",priority:"中",assignee:"未分配",labels:["发布准备"],cycleId:"cycle-09"}
    ]
  };

  const $ = (selector) => document.querySelector(selector);
  const els = {
    board:$("#board"), search:$("#task-search"), assigneeFilter:$("#assignee-filter"), clearFilters:$("#clear-filters"), mobileNav:$("#mobile-status-nav"),
    dialog:$("#task-dialog"), form:$("#task-form"), id:$("#task-id"), title:$("#task-title"), description:$("#task-description"), status:$("#task-status"), priority:$("#task-priority"), assignee:$("#task-assignee"), label:$("#task-label"), error:$("#form-error")
  };
  let boardData = loadBoard();
  let mobileStatus = "todo";
  let viewMode = "board";
  let editingTaskId = null;

  function validBoard(value) {
    return value && typeof value === "object" && !Array.isArray(value) &&
      value.cycle && typeof value.cycle.name === "string" && typeof value.cycle.id === "string" && typeof value.cycle.startDate === "string" && typeof value.cycle.endDate === "string" &&
      Array.isArray(value.tasks) && value.tasks.every((task) => task && typeof task.id === "string" && typeof task.title === "string" && typeof task.assignee === "string" && typeof task.cycleId === "string" && Array.isArray(task.labels) && STATUSES.some((status) => status.id === task.status));
  }
  function loadBoard() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return structuredClone(sampleBoard);
      const parsed = JSON.parse(saved);
      if (validBoard(parsed)) return parsed;
      const restored = structuredClone(sampleBoard);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      return restored;
    } catch {
      const restored = structuredClone(sampleBoard);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(restored)); } catch { /* Storage may be disabled. */ }
      return restored;
    }
  }
  function saveBoard() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(boardData)); }
    catch { window.alert("浏览器无法保存演示数据。请检查本地存储空间或隐私设置。"); }
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function statusInfo(id) { return STATUSES.find((status) => status.id === id) || STATUSES[0]; }
  function avatarClass(name) {
    return ({"林晓":"", "陈婧":"orange", "王睿":"green", "周宁":"blue"})[name] || "";
  }
  function formatDate(value) {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("zh-CN", {month:"short",day:"numeric"}).format(date);
  }
  function getCycleTasks() { return boardData.tasks.filter((task) => task.cycleId === boardData.cycle.id); }
  function renderCycle() {
    const cycle = boardData.cycle;
    const cycleTasks = getCycleTasks();
    const completed = cycleTasks.filter((task) => task.status === "done").length;
    const percent = cycleTasks.length ? Math.round(completed / cycleTasks.length * 100) : 0;
    const remaining = Math.max(0, Math.ceil((new Date(`${cycle.endDate}T23:59:59`) - new Date()) / 86400000));
    $("#cycle-name").textContent = cycle.name;
    $("#cycle-dates").textContent = `${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`;
    $("#progress-count").textContent = `${completed} / ${cycleTasks.length} 已完成`;
    $("#progress-percent").textContent = `${percent}%`;
    $("#progress-fill").style.width = `${percent}%`;
    $("#days-left").textContent = `${remaining} 天`;
  }
  function matchingTasks() {
    const query = els.search.value.trim().toLocaleLowerCase();
    const assignee = els.assigneeFilter.value;
    return boardData.tasks.filter((task) => {
      const content = `${task.id} ${task.title} ${task.description} ${task.assignee} ${(task.labels || []).join(" ")}`.toLocaleLowerCase();
      return (assignee === "all" || task.assignee === assignee) && (!query || content.includes(query));
    });
  }
  function renderCard(task) {
    const card = node("article", "task-card");
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `编辑 ${task.id} ${task.title}`);
    const tags = node("div", "task-tags");
    for (const label of task.labels || []) tags.append(node("span", "tag", label));
    const priority = node("span", `priority ${task.priority === "低" ? "low" : task.priority === "中" ? "medium" : ""}`, `◆ ${task.priority || "中"}优先级`);
    tags.append(priority);
    const title = node("h3", "", task.title);
    const description = node("p", "", task.description || "暂无描述");
    const footer = node("div", "task-card-footer");
    footer.append(node("span", "task-key", task.id));
    const assignee = node("span", "task-assignee");
    const avatar = node("span", `assignee-avatar ${avatarClass(task.assignee)}`, Array.from(task.assignee || "?")[0]);
    assignee.append(avatar, document.createTextNode(task.assignee || "未分配"));
    footer.append(assignee);
    card.append(tags, title, description, footer);
    card.addEventListener("click", () => openEditor(task));
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openEditor(task); } });
    return card;
  }
  function renderBoard() {
    const tasks = matchingTasks();
    const queryActive = Boolean(els.search.value.trim() || els.assigneeFilter.value !== "all");
    els.clearFilters.classList.toggle("hidden", !queryActive);
    els.board.classList.toggle("list-view", viewMode === "list");
    els.board.replaceChildren();
    els.mobileNav.replaceChildren();
    for (const status of STATUSES) {
      const count = tasks.filter((task) => task.status === status.id).length;
      const mobileButton = node("button", status.id === mobileStatus ? "active" : "", `${status.label} ${count}`);
      mobileButton.type = "button";
      mobileButton.addEventListener("click", () => { mobileStatus = status.id; renderBoard(); });
      els.mobileNav.append(mobileButton);

      const column = node("section", `board-column${status.id === mobileStatus ? " mobile-active" : ""}`);
      column.setAttribute("aria-label", status.label);
      const heading = node("div", "column-heading");
      const indicator = node("i", `column-indicator ${status.className}`);
      heading.append(indicator, node("strong", "", status.label), node("span", "column-count", String(count)));
      const addButton = node("button", "column-add", "+");
      addButton.type = "button"; addButton.setAttribute("aria-label", `在${status.label}中新建任务`);
      addButton.addEventListener("click", () => openEditor(null, status.id));
      heading.append(addButton);
      const stack = node("div", "task-stack");
      const statusTasks = tasks.filter((task) => task.status === status.id);
      if (statusTasks.length) statusTasks.forEach((task) => stack.append(renderCard(task)));
      else stack.append(node("div", "empty-column", queryActive ? "没有符合条件的任务" : "还没有任务，点击 + 添加"));
      column.append(heading, stack);
      els.board.append(column);
    }
  }
  function render() { renderCycle(); renderBoard(); }

  function fillOptions(select, values, selected) {
    select.replaceChildren();
    for (const value of values) {
      const option = node("option", "", value);
      option.value = value;
      select.append(option);
    }
    if (selected !== undefined) select.value = selected;
  }
  function openEditor(task = null, defaultStatus = "todo") {
    editingTaskId = task ? task.id : null;
    els.id.value = task ? task.id : "";
    els.title.value = task ? task.title : "";
    els.description.value = task ? task.description || "" : "";
    fillOptions(els.status, STATUSES.map((status) => status.id), task ? task.status : defaultStatus);
    fillOptions(els.assignee, PEOPLE, task ? task.assignee : PEOPLE[0]);
    els.priority.value = task ? task.priority || "中" : "中";
    els.label.value = task ? (task.labels || []).join(", ") : "";
    $("#dialog-title").textContent = task ? "编辑任务" : "新建任务";
    els.error.textContent = "";
    els.dialog.showModal();
    els.title.focus();
  }
  function generateId() {
    const max = boardData.tasks.reduce((value, task) => {
      const match = task.id.match(/^ORB-(\d+)$/);
      return match ? Math.max(value, Number(match[1])) : value;
    }, 127);
    return `ORB-${max + 1}`;
  }

  fillOptions(els.assigneeFilter, ["所有负责人", ...PEOPLE], "所有负责人");
  els.assigneeFilter.options[0].value = "all";
  document.querySelectorAll(".view-tab").forEach((tab, index) => tab.addEventListener("click", () => {
    viewMode = index === 1 ? "list" : "board";
    document.querySelectorAll(".view-tab").forEach((item, tabIndex) => item.classList.toggle("active", tabIndex === index));
    renderBoard();
  }));
  els.search.addEventListener("input", renderBoard);
  els.assigneeFilter.addEventListener("change", renderBoard);
  els.clearFilters.addEventListener("click", () => { els.search.value = ""; els.assigneeFilter.value = "all"; renderBoard(); });
  $("#add-task").addEventListener("click", () => openEditor());
  $("#close-dialog").addEventListener("click", () => els.dialog.close());
  $("#cancel-dialog").addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("click", (event) => { if (event.target === els.dialog) els.dialog.close(); });
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.title.value.trim();
    if (!title) { els.error.textContent = "请填写任务标题。"; els.title.focus(); return; }
    const labels = els.label.value.split(",").map((label) => label.trim()).filter(Boolean).slice(0, 5);
    const values = {title, description:els.description.value.trim(), status:els.status.value, priority:els.priority.value, assignee:els.assignee.value, labels, cycleId:CYCLE_ID};
    if (editingTaskId) {
      const existing = boardData.tasks.find((task) => task.id === editingTaskId);
      if (existing) Object.assign(existing, values);
    } else {
      boardData.tasks.push({id:generateId(), ...values});
    }
    saveBoard();
    els.dialog.close();
    render();
  });
  $("#reset-board").addEventListener("click", () => {
    if (!window.confirm("将当前浏览器里的任务和迭代恢复为初始示例数据？此操作无法撤销。")) return;
    boardData = structuredClone(sampleBoard);
    mobileStatus = "todo";
    viewMode = "board";
    els.search.value = ""; els.assigneeFilter.value = "all";
    document.querySelectorAll(".view-tab").forEach((tab, index) => tab.classList.toggle("active", index === 0));
    saveBoard(); render();
  });
  $("#new-project-hint").addEventListener("click", () => window.alert("这是单项目演示。你可以在当前项目中创建和管理任务。"));
  render();
})();
