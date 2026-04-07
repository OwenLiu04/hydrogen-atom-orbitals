const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "量子轨道可视化",
    autoHideMenuBar: true, // 隐藏菜单栏，更像原生应用
    icon: path.join(__dirname, '../public/icon.png') // 如果有图标的话
  });

  // 开发环境：加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools(); // 可选：打开开发者工具
  } else {
    // 生产环境：加载打包后的 index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
