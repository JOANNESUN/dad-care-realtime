// Shared English / Chinese strings for both pages.
//
// Record types are stored in the database in English and validated against
// that exact list in the Worker, so translation is display-only: the values
// never change, only the labels shown on screen.

(function () {
  const STRINGS = {
    en: {
      pageTitle: "Dad Care Log",
      editorPageTitle: "Dad Care Log — Editor",
      appTitle: "Dad Care Log",
      subtitle: "Shared live record for meals, medicines, IV treatment, temperature, sleep and symptoms.",

      connecting: "Connecting…",
      live: "Live",
      reconnecting: "Reconnecting…",

      familyAccess: "Family access",
      familyAccessDesc: "Everyone with the link and the family password can view and update this log. Changes appear for everyone instantly.",
      addDeleteRecords: "Add or delete records",
      signOut: "Sign out",

      today: "Today",
      week: "Week",
      month: "Month",

      sumFood: "Food / drink",
      sumMedicine: "Medicine",
      sumIv: "IV / treatment",
      sumTemp: "Temperature checks",

      temperatureTrend: "Temperature trend",
      noTemperature: "No temperature records in this period.",
      dailyActivity: "Daily activity",
      noActivity: "No activity recorded in this period.",

      timeline: "Timeline",
      timelineDesc: "Changes from other family members appear automatically.",
      filterAll: "All",
      filterFood: "Food",
      filterMedicine: "Medicine",
      filterIv: "IV",
      filterTemperature: "Temperature",
      noRecords: "No records in this period.",

      thDate: "Date",
      thFood: "Food",
      thMedicine: "Medicine",
      thIv: "IV",
      thTemp: "Temp",

      exportCsv: "Export CSV",
      footerNote: "This page is for personal record-keeping only and is not a substitute for medical advice.",
      amountDose: "Amount / dose:",

      editorSubtitle: "Family editor access",
      editorActive: "Editor access active",
      addRecord: "Add a record",
      labelDate: "Date",
      labelTime: "Time",
      labelType: "Record type",
      labelAmount: "Amount / dose / value (optional)",
      labelDetail: "What happened?",
      labelNotes: "Extra notes (optional)",
      addToTimeline: "Add to timeline",
      useCurrentTime: "Use current time",
      backToLog: "Back to the log",
      recentRecords: "Recent care records",
      noRecordsYet: "No records yet.",
      deleteBtn: "Delete",
      atTime: " at ",

      errLoad: "Could not load records",
      errSave: "Could not save",
      errDelete: "Could not delete record",
      confirmDelete: "Delete this record?",
      nothingToExport: "No records to export.",

      csvHeaders: ["Date", "Time", "Type", "Amount / Dose", "Details", "Notes", "Created At"],
      switchTo: "中文",
    },

    zh: {
      pageTitle: "爸爸照护记录",
      editorPageTitle: "爸爸照护记录 — 编辑",
      appTitle: "爸爸照护记录",
      subtitle: "共享实时记录：饮食、药物、输液、体温、睡眠与症状。",

      connecting: "连接中…",
      live: "实时",
      reconnecting: "重新连接中…",

      familyAccess: "家庭访问",
      familyAccessDesc: "拥有链接和家庭密码的人都可以查看和更新此记录。更改会立即显示给所有人。",
      addDeleteRecords: "添加或删除记录",
      signOut: "退出登录",

      today: "今天",
      week: "本周",
      month: "本月",

      sumFood: "饮食",
      sumMedicine: "药物",
      sumIv: "输液 / 治疗",
      sumTemp: "体温测量",

      temperatureTrend: "体温趋势",
      noTemperature: "此期间没有体温记录。",
      dailyActivity: "每日活动",
      noActivity: "此期间没有任何记录。",

      timeline: "时间线",
      timelineDesc: "其他家庭成员的更改会自动显示。",
      filterAll: "全部",
      filterFood: "饮食",
      filterMedicine: "药物",
      filterIv: "输液",
      filterTemperature: "体温",
      noRecords: "此期间没有记录。",

      thDate: "日期",
      thFood: "饮食",
      thMedicine: "药物",
      thIv: "输液",
      thTemp: "体温",

      exportCsv: "导出 CSV",
      footerNote: "此页面仅用于个人记录，不能替代医疗建议。",
      amountDose: "用量 / 剂量：",

      editorSubtitle: "家庭编辑权限",
      editorActive: "编辑权限已启用",
      addRecord: "添加记录",
      labelDate: "日期",
      labelTime: "时间",
      labelType: "记录类型",
      labelAmount: "用量 / 剂量 / 数值（可选）",
      labelDetail: "发生了什么？",
      labelNotes: "补充备注（可选）",
      addToTimeline: "添加到时间线",
      useCurrentTime: "使用当前时间",
      backToLog: "返回记录",
      recentRecords: "最近的照护记录",
      noRecordsYet: "暂无记录。",
      deleteBtn: "删除",
      atTime: " ",

      errLoad: "无法加载记录",
      errSave: "无法保存",
      errDelete: "无法删除记录",
      confirmDelete: "确定要删除这条记录吗？",
      nothingToExport: "没有可导出的记录。",

      csvHeaders: ["日期", "时间", "类型", "用量 / 剂量", "详情", "备注", "创建时间"],
      switchTo: "EN",
    },
  };

  // Keys are the values stored in the database — never translate these away.
  const TYPE_LABELS = {
    en: {
      "Food / Drink": "Food / Drink",
      "Medicine": "Medicine",
      "IV / Treatment": "IV / Treatment",
      "Temperature": "Temperature",
      "Sleep / Rest": "Sleep / Rest",
      "Symptoms": "Symptoms",
      "Other": "Other",
    },
    zh: {
      "Food / Drink": "饮食",
      "Medicine": "药物",
      "IV / Treatment": "输液 / 治疗",
      "Temperature": "体温",
      "Sleep / Rest": "睡眠 / 休息",
      "Symptoms": "症状",
      "Other": "其他",
    },
  };

  const PLACEHOLDERS = {
    en: {
      "Food / Drink": ["e.g. Ate 4 dumplings and tofu drink", "e.g. half bowl, 200 mL"],
      "Medicine": ["e.g. Took antibiotic and stomach medicine", "e.g. 1 tablet"],
      "IV / Treatment": ["e.g. IV fluids started", "e.g. 500 mL"],
      "Temperature": ["e.g. Fever has subsided", "e.g. 37.2°C"],
      "Sleep / Rest": ["e.g. Started afternoon nap", "e.g. slept 1 hour"],
      "Symptoms": ["e.g. Mild nausea, no vomiting", "e.g. mild / moderate"],
      "Other": ["e.g. Doctor visit or general observation", "optional"],
    },
    zh: {
      "Food / Drink": ["例如：吃了 4 个饺子和一杯豆浆", "例如：半碗、200 毫升"],
      "Medicine": ["例如：服用了抗生素和胃药", "例如：1 片"],
      "IV / Treatment": ["例如：开始输液", "例如：500 毫升"],
      "Temperature": ["例如：烧退了", "例如：37.2°C"],
      "Sleep / Rest": ["例如：开始午睡", "例如：睡了 1 小时"],
      "Symptoms": ["例如：轻微恶心，没有呕吐", "例如：轻度 / 中度"],
      "Other": ["例如：就诊或一般观察", "可选"],
    },
  };

  const STORAGE_KEY = "dcl_lang";

  function initialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "zh") return saved;
    } catch {}
    return String(navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  let lang = initialLang();

  const I18N = {
    get lang() {
      return lang;
    },

    t(key) {
      return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
    },

    typeLabel(storedType) {
      return TYPE_LABELS[lang][storedType] ?? storedType;
    },

    placeholders(storedType) {
      return (PLACEHOLDERS[lang][storedType] ?? PLACEHOLDERS.en[storedType]) || ["", ""];
    },

    locale() {
      return lang === "zh" ? "zh-CN" : "en-US";
    },

    // 3:05 pm in English, 下午 3:05 in Chinese.
    displayTime(time) {
      const [h, m] = String(time).split(":").map(Number);
      const mm = String(m).padStart(2, "0");
      if (lang === "zh") return `${h < 12 ? "上午" : "下午"} ${h % 12 || 12}:${mm}`;
      return `${h % 12 || 12}:${mm} ${h >= 12 ? "pm" : "am"}`;
    },

    // Compact form for chart axis labels.
    displayTimeShort(time) {
      const [h, m] = String(time).split(":").map(Number);
      if (lang === "zh") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`;
    },

    // Swap every element carrying a data-i18n* attribute.
    applyStatic() {
      document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

      document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = I18N.t(el.dataset.i18n);
      });

      document.querySelectorAll("[data-i18n-title]").forEach(el => {
        el.textContent = I18N.t(el.dataset.i18nTitle);
      });

      document.querySelectorAll("[data-i18n-type]").forEach(el => {
        el.textContent = I18N.typeLabel(el.dataset.i18nType);
      });

      const titleEl = document.querySelector("title");
      if (titleEl?.dataset.i18n) titleEl.textContent = I18N.t(titleEl.dataset.i18n);

      const toggle = document.getElementById("langToggle");
      if (toggle) toggle.textContent = I18N.t("switchTo");
    },

    setLang(next) {
      lang = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      I18N.applyStatic();
      if (typeof window.onLanguageChange === "function") window.onLanguageChange();
    },

    toggle() {
      I18N.setLang(lang === "en" ? "zh" : "en");
    },
  };

  window.I18N = I18N;
})();
