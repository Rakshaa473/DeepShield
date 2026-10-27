
const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session
} = require("electron");

const path = require("path");

// Browser state
let win = null;
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// Do not change the toolbar height.
const TOOLBAR_HEIGHT = 100;

// Temporary in-memory history and download records.
const visitHistory = [];
const downloadHistory = [];

// ==================================================
// TAB HELPERS
// ==================================================

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function sendToToolbar(channel, data) {
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

function tabDetails(tab) {
  const contents = tab.view.webContents;
  const url = contents.getURL();

  return {
    id: tab.id,
    title:
      contents.getTitle() ||
      (url.startsWith("file://") ? "Start" : "New tab"),
    url,
    isStartPage: url.startsWith("file://"),
    active: tab.id === activeTabId
  };
}

function sendTabs() {
  sendToToolbar("browser:tabs", tabs.map(tabDetails));
}

function sendPageInfo(tab = activeTab()) {
  if (!tab || tab.view.webContents.isDestroyed()) return;

  const contents = tab.view.webContents;
  const url = contents.getURL();

  if (tab.id === activeTabId) {
    sendToToolbar("browser:page-info", {
      title: contents.getTitle() || "DeepShield",
      secure: url.startsWith("https://"),
      url
    });

    sendToToolbar("browser:address-change", url);
    sendToToolbar("browser:loading", contents.isLoading());
  }

  sendTabs();
}

// ==================================================
// SIDEBAR DATA
// ==================================================

function sendSidebarData(targetContents = null) {
  const history = visitHistory.slice(0, 100);
  const downloads = downloadHistory.slice(0, 100);

  sendToToolbar("sidebar:history", history);
  sendToToolbar("sidebar:downloads", downloads);

  const contents =
    targetContents || activeTab()?.view.webContents;

  if (contents && !contents.isDestroyed()) {
    contents.send("sidebar:history", history);
    contents.send("sidebar:downloads", downloads);
  }
}

// ==================================================
// BROWSER VIEW SIZE
// ==================================================

function resizeBrowser() {
  if (!win || win.isDestroyed()) return;

  const tab = activeTab();

  if (!tab || tab.view.webContents.isDestroyed()) return;

  const [width, height] = win.getContentSize();

  tab.view.setBounds({
    x: 0,
    y: TOOLBAR_HEIGHT,
    width,
    height: Math.max(100, height - TOOLBAR_HEIGHT)
  });

  tab.view.setAutoResize({
    width: true,
    height: true
  });
}

// ==================================================
// ADDRESS BAR NAVIGATION
// ==================================================

function navigate(value, tab = activeTab()) {
  const text = String(value || "").trim();

  if (!text || !tab) return;

  let target;

  if (/^https?:\/\//i.test(text)) {
    target = text;
  } else if (/^localhost(:\d+)?(\/.*)?$/i.test(text)) {
    target = "http://" + text;
  } else if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(text)) {
    target = "https://" + text;
  } else {
    target =
      "https://duckduckgo.com/?q=" +
      encodeURIComponent(text);
  }

  try {
    const parsed = new URL(target);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return;
    }

    tab.view.webContents.loadURL(parsed.href).catch((error) => {
      console.error("Navigation failed:", error.message);
    });
  } catch (error) {
    console.error("Invalid address:", error.message);
  }
}

// ==================================================
// ACTIVATE A TAB
// ==================================================

function activateTab(id) {
  const tab = tabs.find((item) => item.id === id);

  if (!tab || !win || win.isDestroyed()) return;

  activeTabId = id;

  win.setBrowserView(tab.view);

  resizeBrowser();
  sendTabs();
  sendPageInfo(tab);
  sendSidebarData(tab.view.webContents);
}

// ==================================================
// CREATE A TAB
// ==================================================

function createTab(url = null) {
  if (!win || win.isDestroyed()) return null;

  const id = nextTabId++;

  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const tab = { id, view };
  tabs.push(tab);

  const contents = view.webContents;

  contents.on("did-start-loading", () => {
    if (id === activeTabId) {
      sendToToolbar("browser:loading", true);
    }

    sendTabs();
  });

  contents.on("did-stop-loading", () => {
    if (id === activeTabId) {
      sendToToolbar("browser:loading", false);
    }

    sendPageInfo(tab);
  });

  contents.on("did-navigate", (_event, navigatedUrl) => {
    if (
      navigatedUrl &&
      !navigatedUrl.startsWith("file://")
    ) {
      visitHistory.unshift({
        url: navigatedUrl,
        title: contents.getTitle() || navigatedUrl,
        visitedAt: new Date().toLocaleString()
      });

      if (visitHistory.length > 100) {
        visitHistory.length = 100;
      }

      sendSidebarData(contents);
    }

    sendPageInfo(tab);
  });

  contents.on("did-navigate-in-page", () => {
    sendPageInfo(tab);
  });

  contents.on("page-title-updated", () => {
    sendPageInfo(tab);
  });

  contents.setWindowOpenHandler(({ url: targetUrl }) => {
    createTab(targetUrl);
    return { action: "deny" };
  });

  activateTab(id);

  const page = url
    ? contents.loadURL(url)
    : contents.loadFile(path.join(__dirname, "startpage.html"));

  page.catch((error) => {
    console.error("Could not open tab:", error.message);
  });

  return tab;
}

// ==================================================
// CLOSE A TAB
// ==================================================

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);

  if (index === -1) return;

  const wasActive = id === activeTabId;
  const tab = tabs[index];

  tabs.splice(index, 1);

  if (wasActive) {
    activeTabId = null;

    if (tabs.length > 0) {
      const next = tabs[Math.max(0, index - 1)];
      activateTab(next.id);
    } else {
      createTab();
    }
  }

  if (!tab.view.webContents.isDestroyed()) {
    tab.view.webContents.close();
  }

  sendTabs();
}

// ==================================================
// CREATE MAIN WINDOW
// ==================================================

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "DeepShield Browser",
    backgroundColor: "#080d19",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.removeMenu();

  win.loadFile(path.join(__dirname, "home.html"));

  win.on("resize", resizeBrowser);

  win.webContents.on("did-finish-load", () => {
    sendTabs();
    sendPageInfo();
    sendSidebarData();
  });

  win.on("closed", () => {
    win = null;
    tabs = [];
    activeTabId = null;
  });

  createTab();
}

// ==================================================
// NAVIGATION IPC
// ==================================================

ipcMain.on("browser:navigate", (_event, address) => {
  navigate(address);
});

// Back: go to the previous page, or home if none exists.
ipcMain.on("browser:back", () => {
  console.log("BACK BUTTON EVENT RECEIVED");

  const tab = activeTab();

  if (!tab || tab.view.webContents.isDestroyed()) {
    console.log("No active tab found");
    return;
  }

  const contents = tab.view.webContents;

  console.log("Current URL:", contents.getURL());
  console.log("Can go back:", contents.canGoBack());

  if (contents.canGoBack()) {
    contents.goBack();
  } else {
    contents
      .loadFile(path.join(__dirname, "startpage.html"))
      .catch((error) => {
        console.error("Could not return home:", error.message);
      });
  }
});

ipcMain.on("browser:forward", () => {
  const contents = activeTab()?.view.webContents;

  if (contents && contents.canGoForward()) {
    contents.goForward();
  }
});

ipcMain.on("browser:reload", () => {
  activeTab()?.view.webContents.reload();
});

ipcMain.on("browser:home", () => {
  const tab = activeTab();

  if (!tab) return;

  tab.view.webContents
    .loadFile(path.join(__dirname, "startpage.html"))
    .catch((error) => {
      console.error("Could not open homepage:", error.message);
    });
});

// ==================================================
// TAB IPC
// ==================================================

ipcMain.on("browser:new-tab", () => {
  createTab();
});

ipcMain.on("browser:switch-tab", (_event, id) => {
  activateTab(Number(id));
});

ipcMain.on("browser:close-tab", (_event, id) => {
  closeTab(Number(id));
});

// ==================================================
// SIDEBAR IPC
// ==================================================

ipcMain.on("sidebar:get-data", (event) => {
  sendSidebarData(event.sender);
});

ipcMain.on("sidebar:clear-history", () => {
  visitHistory.length = 0;
  sendSidebarData();
});

// ==================================================
// DOWNLOAD TRACKING
// ==================================================

function setupDownloadTracking() {
  session.defaultSession.on("will-download", (_event, item) => {
    const record = {
      filename: item.getFilename(),
      url: item.getURL(),
      state: "In progress",
      receivedBytes: 0,
      totalBytes: item.getTotalBytes()
    };

    downloadHistory.unshift(record);

    if (downloadHistory.length > 100) {
      downloadHistory.length = 100;
    }

    item.on("updated", (_event, state) => {
      record.state =
        state === "progressing" ? "In progress" : state;

      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();

      sendSidebarData();
    });

    item.once("done", (_event, state) => {
      record.state = state;
      record.path = item.getSavePath();

      sendSidebarData();
    });

    sendSidebarData();
  });
}

// ==================================================
// START ELECTRON - ONLY ONCE
// ==================================================

app.whenReady().then(() => {
  setupDownloadTracking();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
