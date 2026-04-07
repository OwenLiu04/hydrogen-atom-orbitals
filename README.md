# Quantum Orbital Visualizer ⚛️ / 量子轨道可视化

[English](#english) | [中文版](#中文版)

---

<a id="english"></a>
## English

An interactive, browser-based 3D application designed to visualize hydrogen-like atomic orbitals. Built with React and Three.js, it provides a stunning and scientifically accurate representation of quantum states.

The entire application is bundled into a **single HTML file**, making it incredibly easy to share, host, or use completely offline without any server setup.

### ✨ Features

*   **Interactive 3D Visualization:** Explore atomic orbitals in full 3D with intuitive rotation and zoom controls.
*   **Dual View Modes:** Switch seamlessly between "Point Cloud" (representing electron probability density) and "Isosurface" (solid boundary representation) modes.
*   **Adjustable Quantum Numbers:** Freely adjust the Principal ($n$), Azimuthal ($l$), and Magnetic ($m$) quantum numbers to generate up to 140 different orbital states.
*   **High-Performance Computing:** Utilizes Web Workers for multi-threaded background pre-warming, ensuring instantaneous switching between complex orbital models without freezing the UI.
*   **Cinematic Rendering:** Features a visually appealing dark mode interface with smooth transitions and auto-rotation.

### 🚀 Getting Started

#### For Users (No installation required)
Simply download the latest `index.html` (or named release) file from the [Releases](../../releases) page and double-click it to open it in any modern web browser (Chrome, Edge, Safari, Firefox).

#### For Developers (Build from source)
1. Open a command-line tool (such as PowerShell or CMD) in the project folder.
2. Run the following command to install dependencies:
   ```bash
   npm install
   ```
3. Run the following command to build:
   ```bash
   npm run build
   ```
After the build is complete, you will find a file named `index.html` in the `dist` folder under the project directory.

This `index.html` is a single file containing all code and resources. You can double-click it to open it in your browser directly, without any local server environment, making it very convenient for sharing and offline use!

---

<a id="中文版"></a>
## 中文版

这是一个基于浏览器的交互式 3D 应用程序，旨在可视化类氢原子的电子轨道。该应用基于 React 和 Three.js 构建，提供了令人惊叹且科学准确的量子态展示。

整个应用程序被打包成一个**单 HTML 文件**，无需任何服务器配置，即可极其方便地分享、托管或完全离线使用。

### ✨ 功能特点

*   **交互式 3D 可视化：** 通过直观的旋转和缩放控制，在全 3D 环境中探索原子轨道。
*   **双重视图模式：** 在“点云”（表示电子概率密度）和“实体”（等值面边界表示）模式之间无缝切换。
*   **可调量子数：** 自由调整主量子数 ($n$)、角量子数 ($l$) 和磁量子数 ($m$)，可生成多达 140 种不同的轨道状态。
*   **高性能计算：** 利用 Web Workers 进行多线程后台预热计算，确保在复杂的轨道模型之间实现瞬时切换，而不会卡顿界面。
*   **电影级渲染：** 具有极具视觉吸引力的深色模式界面、流畅的过渡动画以及自动旋转功能。

### 🚀 快速开始

#### 面向普通用户（无需安装）
只需从 [Releases](../../releases) 页面下载最新的 `index.html` 文件，双击即可在任何现代网页浏览器（如 Chrome, Edge, Safari, Firefox）中直接打开使用。

#### 面向开发者（从源码构建）
1. 在源代码文件夹中打开命令行工具（如 PowerShell 或 CMD）。
2. 运行以下命令安装依赖：
   ```bash
   npm install
   ```
3. 运行以下命令进行构建：
   ```bash
   npm run build
   ```
构建完成后，您会在项目目录下的 `dist` 文件夹中找到一个名为 `index.html` 的文件。

这个 `index.html` 就是包含了所有代码和资源的单个文件。您可以直接双击在浏览器中打开它，无需任何本地服务器环境，非常方便分享和离线使用！
