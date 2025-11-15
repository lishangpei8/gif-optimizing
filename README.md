# GIF Optimizing for H5 Pages

将GIF动画转换为WebM、HEVC with Alpha和RGB+Alpha拼接MP4格式，大幅减小文件体积，同时保留透明度信息。

## 功能特点

- ✅ GIF 转 WebM (VP9编码，支持透明度)
- ✅ GIF 转 HEVC with Alpha (支持透明度)
- ✅ **GIF 转 RGB+Alpha拼接MP4 (最佳兼容性)**
- ✅ 保留原始透明度信息
- ✅ 自动优化压缩比
- ✅ Canvas渲染器 (用于拼接MP4方案)
- ✅ H5兼容性测试页面

## 为什么需要转换?

| 格式 | 文件大小 | 透明度 | 浏览器兼容性 |
|-----|---------|--------|------------|
| GIF | 大 (基准) | ✅ | 所有浏览器 |
| WebM (VP9) | 小 (30-70%减少) | ✅ | Chrome 32+, Firefox 28+, Android 5.0+ |
| HEVC with Alpha | 小 (40-80%减少) | ✅ | iOS 11+, macOS 10.13+ (Safari) |
| **RGB+Alpha拼接MP4** | 小 (40-70%减少) | ✅ (通过Canvas) | **95%+所有H.264支持的浏览器** |

## 安装依赖

```bash
npm install
```

### FFmpeg安装选项

项目支持两种方式使用FFmpeg：

**选项1: 自动安装（推荐新手）**
- npm install会自动下载ffmpeg-static包
- 无需手动安装FFmpeg
- 如果下载失败，请使用选项2

**选项2: 使用系统FFmpeg（推荐）**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# 从 https://ffmpeg.org/download.html 下载并添加到PATH
```

安装完成后，只需安装核心依赖：
```bash
npm install --no-optional  # 跳过ffmpeg-static
```

> 💡 转换脚本会自动检测并使用可用的FFmpeg（优先ffmpeg-static，其次系统FFmpeg）

## 使用方法

### 1. 转换GIF到WebM

```bash
npm run convert:webm
```

或直接运行:

```bash
node scripts/gif-to-webm.js <input.gif> [output.webm]
```

### 2. 转换GIF到HEVC with Alpha

```bash
npm run convert:hevc
```

或直接运行:

```bash
node scripts/gif-to-hevc.js <input.gif> [output.mp4]
```

### 3. 转换GIF到RGB+Alpha拼接MP4 (推荐！)

```bash
node scripts/gif-to-split-mp4.js <input.gif> [output.mp4]
```

高级选项:

```bash
# 使用水平拼接 (默认, RGB在左, Alpha在右)
node scripts/gif-to-split-mp4.js input.gif output.mp4 --layout horizontal

# 使用垂直拼接 (RGB在上, Alpha在下)
node scripts/gif-to-split-mp4.js input.gif output.mp4 --layout vertical

# 自定义质量和编码预设
node scripts/gif-to-split-mp4.js input.gif output.mp4 --crf 20 --preset slow
```

在H5页面中使用:

```html
<!-- 引入渲染器 -->
<script src="scripts/alpha-video-renderer.js"></script>

<!-- 创建Canvas -->
<canvas id="myCanvas"></canvas>

<script>
  const renderer = new AlphaVideoRenderer({
    videoSrc: 'output.mp4',
    canvas: document.getElementById('myCanvas'),
    layout: 'horizontal',
    autoplay: true,
    loop: true
  });
  renderer.play();
</script>
```

查看完整演示: `test/split-mp4-demo.html`

### 4. 兼容性测试

启动测试服务器:

```bash
npm run serve
```

然后在不同设备/浏览器上访问:
- Android设备: 测试WebM兼容性
- iOS设备: 测试HEVC with Alpha兼容性

## 浏览器兼容性

### WebM (VP9 with Alpha)

| 浏览器 | 最低版本 | 说明 |
|-------|---------|------|
| Chrome (Android) | 32+ | 完全支持 |
| Firefox (Android) | 28+ | 完全支持 |
| UC Browser | 12.0+ | 部分支持 |
| QQ Browser | 9.0+ | 部分支持 |
| 微信浏览器 | 7.0+ | 基于系统WebView |

### HEVC with Alpha

| 浏览器 | 最低版本 | 说明 |
|-------|---------|------|
| Safari (iOS) | 11.0+ | 完全支持 |
| Safari (macOS) | 10.13+ | 完全支持 |
| 微信浏览器 (iOS) | iOS 11+ | 基于WKWebView,支持 |

### RGB+Alpha拼接MP4 (需配合Canvas渲染器)

| 平台 | 兼容性 | 说明 |
|-----|-------|------|
| Chrome (所有平台) | ✅ 完全支持 | 支持H.264和Canvas |
| Firefox (所有平台) | ✅ 完全支持 | 支持H.264和Canvas |
| Safari (iOS/macOS) | ✅ 完全支持 | 原生H.264硬件解码 |
| Edge | ✅ 完全支持 | 支持H.264和Canvas |
| 微信浏览器 (所有平台) | ✅ 完全支持 | 基于系统WebView |
| Android WebView | ✅ 完全支持 | Android 4.1+ |
| **总体兼容性** | **95%+** | 几乎所有现代浏览器 |

## 最佳实践

### 方案选择指南

**推荐顺序**:

1. **RGB+Alpha拼接MP4 (首选)** - 如果需要最佳兼容性
   - ✅ 适用于需要支持所有平台的项目
   - ✅ 只需维护一个视频文件
   - ✅ 兼容性最好 (95%+)
   - ⚠️ 需要引入Canvas渲染器

2. **WebM + HEVC双方案** - 如果追求极致压缩
   - ✅ 文件体积最小
   - ✅ 原生浏览器支持，无需额外代码
   - ⚠️ 需要维护两个格式的文件
   - ⚠️ 兼容性较低

3. **原始GIF** - 作为最终fallback

### 使用示例

**方案1: RGB+Alpha拼接MP4 (推荐)**
```html
<script src="scripts/alpha-video-renderer.js"></script>
<canvas id="animation"></canvas>
<script>
  new AlphaVideoRenderer({
    videoSrc: 'animation-split.mp4',
    canvas: document.getElementById('animation'),
    autoplay: true,
    loop: true
  }).play();
</script>
```

**方案2: 渐进式增强策略**
```html
<video autoplay loop muted playsinline>
  <source src="animation.webm" type="video/webm">
  <source src="animation.mp4" type="video/mp4">
  <img src="fallback.gif" alt="Animation">
</video>
```

**方案3: 根据平台加载**
```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const videoSrc = isIOS ? 'animation.mp4' : 'animation.webm';
```

### 文件大小优化建议

- 总是保留原始GIF作为最终fallback
- **优先使用RGB+Alpha拼接MP4** (最佳兼容性)
- 如果文件体积是首要考虑，使用WebM/HEVC双方案
- iOS设备可单独使用HEVC获得最小体积

## 项目结构

```
gif-optimizing/
├── scripts/
│   ├── gif-to-webm.js           # WebM转换脚本
│   ├── gif-to-hevc.js           # HEVC转换脚本
│   ├── gif-to-split-mp4.js      # RGB+Alpha拼接MP4转换脚本 (新)
│   ├── alpha-video-renderer.js  # Canvas渲染器类 (新)
│   └── batch-convert.js         # 批量转换工具
├── test/
│   ├── index.html               # WebM/HEVC兼容性测试页面
│   ├── split-mp4-demo.html      # RGB+Alpha拼接方案演示 (新)
│   └── assets/                  # 测试资源文件夹
├── docs/
│   └── COMPATIBILITY.md         # 浏览器兼容性详细文档
├── output/                      # 输出文件夹
├── package.json
└── README.md
```

## 技术细节

### WebM转换参数

- 编码器: VP9 (libvpx-vp9)
- 像素格式: yuva420p (支持alpha通道)
- 质量控制: CRF 30-40 (可调节)
- 速度: cpu-used=2 (平衡质量和速度)

### HEVC转换参数

- 编码器: HEVC (libx265)
- 像素格式: yuv420p + alpha通道
- 容器格式: MP4
- 质量控制: CRF 28-35 (可调节)

### RGB+Alpha拼接MP4转换参数

- 编码器: H.264 (libx264)
- 像素格式: yuv420p (标准格式，最佳兼容性)
- 容器格式: MP4
- 质量控制: CRF 20-28 (可调节)
- 拼接方式:
  - 水平拼接: RGB在左，Alpha在右 (视频宽度为原始2倍)
  - 垂直拼接: RGB在上，Alpha在下 (视频高度为原始2倍)
- FFmpeg滤镜: `split + alphaextract + hstack/vstack`

### Canvas渲染原理

1. 视频解码由浏览器原生完成（硬件加速）
2. 使用`requestAnimationFrame`同步渲染
3. 从视频帧中分离RGB和Alpha部分
4. 通过`getImageData`和`putImageData`合成透明图像
5. 渲染到Canvas显示

## 常见问题

### FFmpeg相关问题

**Q: 遇到 "spawn ffmpeg EACCES" 错误怎么办?**
A: 这是FFmpeg没有执行权限的问题，运行以下命令修复：
```bash
npm run fix-ffmpeg
```
或手动修复：
```bash
chmod +x node_modules/ffmpeg-static/ffmpeg
```

如果仍有问题，推荐使用系统FFmpeg：
```bash
# macOS
brew install ffmpeg

# 然后使用系统FFmpeg
npm install --no-optional
```

**Q: npm install 一直卡住不动?**
A: 这通常是因为下载ffmpeg-static包太慢。解决方案：
1. 取消安装 (Ctrl+C)
2. 安装系统FFmpeg（见上面说明）
3. 只安装必需依赖：`npm install --no-optional`

### 转换相关问题

**Q: 转换后透明度丢失了?**
A: 确保使用了正确的像素格式 (yuva420p for WebM, alpha layer for HEVC)

**Q: Android低版本不支持WebM怎么办?**
A: 使用fallback机制,提供GIF作为备选方案，或使用RGB+Alpha拼接MP4方案（兼容性最好）

**Q: 文件太大如何优化?**
A: 调整CRF值(增加数值会减小文件大小但降低质量)

**Q: RGB+Alpha拼接方案性能如何?**
A: 性能优秀。视频解码由浏览器底层硬件加速，Canvas操作在现代浏览器中也有GPU加速，实际测试中可流畅播放60fps的视频。

**Q: 哪种方案兼容性最好?**
A: **RGB+Alpha拼接MP4方案**兼容性最好(95%+)，因为它只依赖H.264视频解码和Canvas API，这两者在几乎所有现代浏览器中都被支持。

**Q: 我应该选择哪种方案?**
A:
- 追求兼容性和易维护: **RGB+Alpha拼接MP4** (推荐)
- 追求极致压缩: WebM + HEVC双方案
- 简单场景: 直接用GIF

**Q: Canvas渲染器会影响性能吗?**
A: 影响很小。渲染器使用了requestAnimationFrame和临时Canvas复用等优化技术，在移动设备上也能流畅运行。

**Q: 可以同时使用多个AlphaVideoRenderer吗?**
A: 可以。每个实例独立管理自己的Canvas和视频，可以同时渲染多个透明视频。

## License

MIT
