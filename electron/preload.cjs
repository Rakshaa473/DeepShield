
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deepShield", {
  // Navigation

  // Sidebar data
  getSidebarData: () => {
    ipcRenderer.send("sidebar:get-data");
  },

  clearHistory: () => {
    ipcRenderer.send("sidebar:clear-history");
  },

  onSidebarHistory: (callback) => {
    ipcRenderer.on("sidebar:history", (_event, items) => callback(items));
  },

  onSidebarDownloads: (callback) => {
    ipcRenderer.on("sidebar:downloads", (_event, items) => callback(items));
  },

  navigate: (address) => {
    ipcRenderer.send("browser:navigate", address);
  },

  back: () => {
    ipcRenderer.send("browser:back");
  },

  forward: () => {
    ipcRenderer.send("browser:forward");
  },

  reload: () => {
    ipcRenderer.send("browser:reload");
  },

  goHome: () => {
    ipcRenderer.send("browser:home");
  },

  // Tab controls
  newTab: () => {
    ipcRenderer.send("browser:new-tab");
  },

  switchTab: (id) => {
    ipcRenderer.send("browser:switch-tab", id);
  },

  closeTab: (id) => {
    ipcRenderer.send("browser:close-tab", id);
  },

  // Browser events
  onAddressChange: (callback) => {
    ipcRenderer.on("browser:address-change", (_, address) => {
      callback(address);
    });
  },

  onLoadingChange: (callback) => {
    ipcRenderer.on("browser:loading", (_, loading) => {
      callback(loading);
    });
  },

  onPageInfo: (callback) => {
    ipcRenderer.on("browser:page-info", (_, info) => {
      callback(info);
    });
  },

  onTabsChange: (callback) => {
    ipcRenderer.on("browser:tabs", (_, tabs) => {
      callback(tabs);
    });
  }
});
