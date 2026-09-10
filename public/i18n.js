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

      connecting: "Connecting…",
      live: "Live",
      reconnecting: "Reconnecting…",

      familyAccess: "Family access",
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
      thSleep: "Slept",

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
      backToLog: "Record log",
      recentRecords: "Recent care records",
      noRecordsYet: "No records yet.",
      deleteBtn: "Delete",
      atTime: " at ",

      errLoad: "Could not load records",
      errSave: "Could not save",
      errDelete: "Could not delete record",
      confirmDelete: "Delete this record?",
      nothingToExport: "No records to export.",

      statusHome: "At home",
      statusHospital: "In hospital",
      statusUnknown: "Location not recorded yet",
      statusSince: "since",
      wellnessTrend: "How he is feeling",
      noWellness: "No wellness check-ins in this period.",
      wellnessLabel: "Overall wellness",
      locationLabel: "Where is he?",
      notesTitle: "Important notes",
      notesMore: "Show earlier notes",
      notesFewer: "Show fewer",
      foldOpen: "Expand",
      foldClose: "Close",
      noteReadAll: "Read all",
      noteReadLess: "Show less",
      labelTemperature: "Temperature",
      labelSleepHow: "How long did he sleep?",
      sleepLess: "Fifteen minutes less",
      sleepMore: "Fifteen minutes more",
      tempLower: "Lower by 0.1 \u00b0C",
      tempRaise: "Raise by 0.1 \u00b0C",
      tempLow: "Below normal",
      tempNormal: "Normal",
      tempMild: "Slight fever",
      tempFever: "Fever",
      tempHigh: "High fever",
      w5: "Very good", w4: "Good", w3: "Okay", w2: "Not great", w1: "Poor",
      sumWellness: "Wellness check-ins",
      csvHeaders: ["Date", "Time", "Type", "Amount / Dose", "Details", "Notes", "Created At"],
    },

    zh: {
      pageTitle: "爸爸照護記錄",
      editorPageTitle: "爸爸照護記錄 — 編輯",
      appTitle: "爸爸照護記錄",

      connecting: "連線中…",
      live: "即時",
      reconnecting: "重新連線中…",

      familyAccess: "家人權限",
      addDeleteRecords: "新增或刪除記錄",
      signOut: "登出",

      today: "今天",
      week: "本週",
      month: "本月",

      sumFood: "飲食",
      sumMedicine: "藥物",
      sumIv: "點滴 / 治療",
      sumTemp: "體溫測量",

      temperatureTrend: "體溫趨勢",
      noTemperature: "這段期間沒有體溫記錄。",
      dailyActivity: "每日活動",
      noActivity: "這段期間沒有任何記錄。",

      timeline: "時間軸",
      timelineDesc: "其他家人的更動會自動顯示。",
      filterAll: "全部",
      filterFood: "飲食",
      filterMedicine: "藥物",
      filterIv: "點滴",
      filterTemperature: "體溫",
      noRecords: "這段期間沒有記錄。",

      thDate: "日期",
      thFood: "飲食",
      thMedicine: "藥物",
      thIv: "點滴",
      thTemp: "體溫",
      thSleep: "睡眠",

      exportCsv: "匯出 CSV",
      footerNote: "此頁面僅供個人記錄，不能取代醫療建議。",

      editorSubtitle: "家人編輯權限",
      editorActive: "編輯權限已啟用",
      addRecord: "新增記錄",
      labelDate: "日期",
      labelTime: "時間",
      labelType: "記錄類型",
      labelDetail: "發生了什麼？",
      addToTimeline: "加入時間軸",
      useCurrentTime: "使用目前時間",
      backToLog: "照護記錄",
      recentRecords: "最近的照護記錄",
      noRecordsYet: "尚無記錄。",
      deleteBtn: "刪除",
      atTime: " ",

      errLoad: "無法載入記錄",
      errSave: "無法儲存",
      errDelete: "無法刪除記錄",
      confirmDelete: "確定要刪除這筆記錄嗎？",
      nothingToExport: "沒有可匯出的記錄。",

      statusHome: "在家",
      statusHospital: "在醫院",
      statusUnknown: "尚未記錄所在位置",
      statusSince: "自",
      wellnessTrend: "整體狀態",
      noWellness: "這段期間沒有狀態記錄。",
      wellnessLabel: "整體狀態",
      locationLabel: "現在在哪裡？",
      notesTitle: "重要記事",
      notesMore: "顯示先前的記事",
      notesFewer: "收合",
      foldOpen: "展開",
      foldClose: "收合",
      noteReadAll: "顯示全文",
      noteReadLess: "收合",
      labelTemperature: "體溫",
      labelSleepHow: "他睡了多久？",
      sleepLess: "減少 15 分鐘",
      sleepMore: "增加 15 分鐘",
      tempLower: "降低 0.1 \u00b0C",
      tempRaise: "升高 0.1 \u00b0C",
      tempLow: "偏低",
      tempNormal: "正常",
      tempMild: "低燒",
      tempFever: "發燒",
      tempHigh: "高燒",
      w5: "很好", w4: "還好", w3: "普通", w2: "不太好", w1: "很不好",
      sumWellness: "狀態記錄",
      csvHeaders: ["日期", "時間", "類型", "用量 / 劑量", "詳情", "備註", "建立時間"],
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
      "Location": "Location",
      "Wellness": "Wellness",
      "Note": "Doctor's note / important note",
      "Other": "Other",
    },
    zh: {
      "Food / Drink": "飲食",
      "Medicine": "藥物",
      "IV / Treatment": "點滴 / 治療",
      "Temperature": "體溫",
      "Sleep / Rest": "睡眠 / 休息",
      "Symptoms": "症狀",
      "Location": "位置",
      "Wellness": "狀態",
      "Note": "醫囑 / 重要記事",
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
      "Location": ["e.g. Admitted for observation", ""],
      "Wellness": ["e.g. Tired but comfortable, ate well", ""],
      "Note": ["e.g. Dr Wang: fever under 36 for two days and he can go home", ""],
      "Other": ["e.g. Doctor visit or general observation", "optional"],
    },
    zh: {
      "Food / Drink": ["例如：吃了 4 顆水餃和一杯豆漿", ""],
      "Medicine": ["例如：吃了抗生素和胃藥 1 顆", ""],
      "IV / Treatment": ["例如：開始打點滴 500 毫升", ""],
      "Temperature": ["例如：燒退了", ""],
      "Sleep / Rest": ["例如：下午小睡", ""],
      "Symptoms": ["例如：輕微噁心，沒有嘔吐", ""],
      "Location": ["例如：入院觀察", ""],
      "Wellness": ["例如：有點累但還算舒服，吃得不錯", ""],
      "Note": ["例如：王醫生說燒退到 36 度滿兩天就可以出院", ""],
      "Other": ["例如：回診或一般觀察", ""],
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

    wellnessEmoji(score) {
      return { "5": "\u{1F604}", "4": "\u{1F642}", "3": "\u{1F610}", "2": "\u{1F615}", "1": "\u{1F623}" }[String(score)] || "";
    },

    wellnessLabel(score) {
      return I18N.t("w" + String(score));
    },

    typeEmoji(storedType) {
      return {
        "Food / Drink": "\u{1F35A}",
        "Medicine": "\u{1F48A}",
        "IV / Treatment": "\u{1F489}",
        "Temperature": "\u{1F321}\uFE0F",
        "Sleep / Rest": "\u{1F634}",
        "Symptoms": "\u{1F912}",
        "Location": "\u{1F4CD}",
        "Wellness": "\u{1F642}",
        "Note": "\u{1F4CC}",
        "Other": "\u{1F4DD}",
      }[storedType] || "\u{1F4DD}";
    },

    locationEmoji(place) {
      return place === "Hospital" ? "\u{1F3E5}" : "\u{1F3E0}";
    },

    locationLabel(place) {
      return I18N.t(place === "Hospital" ? "statusHospital" : "statusHome");
    },

    locale() {
      return lang === "zh" ? "zh-TW" : "en-US";
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
      document.documentElement.lang = lang === "zh" ? "zh-TW" : "en";

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

      document.querySelectorAll(".lang-tab").forEach(el => {
        const selected = el.dataset.lang === lang;
        el.classList.toggle("active", selected);
        el.setAttribute("aria-pressed", String(selected));
      });
    },

    setLang(next) {
      if (next === lang) return;
      lang = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      I18N.applyStatic();
      if (typeof window.onLanguageChange === "function") window.onLanguageChange();
    },
  };

  window.I18N = I18N;
})();
