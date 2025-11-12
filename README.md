# GIF Optimizing for H5 Pages

将GIF动画转换为WebM和HEVC with Alpha格式，大幅减小文件体积，同时保留透明度信息。

## 功能特点

- ✅ GIF 转 WebM (VP9编码，支持透明度)
- ✅ GIF 转 HEVC with Alpha (支持透明度)
- ✅ 保留原始透明度信息
- ✅ 自动优化压缩比
- ✅ H5兼容性测试页面

## 为什么需要转换?

| 格式 | 文件大小 | 透明度 | 浏览器兼容性 |
|-----|---------|--------|------------|
| GIF | 大 (基准) | ✅ | 所有浏览器 |
| WebM (VP9) | 小 (30-70%减少) | ✅ | Chrome 32+, Firefox 28+, Android 5.0+ |
| HEVC with Alpha | 小 (40-80%减少) | ✅ | iOS 11+, macOS 10.13+ (Safari) |

## 安装依赖

```bash
npm install
```

系统需要安装FFmpeg (通过ffmpeg-static自动安装)

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

### 3. 兼容性测试

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

## 最佳实践

1. **渐进式增强策略**:
   ```html
   <video autoplay loop muted playsinline>
     <source src="animation.webm" type="video/webm">
     <source src="animation.mp4" type="video/mp4">
     <img src="fallback.gif" alt="Animation">
   </video>
   ```

2. **根据平台加载**:
   ```javascript
   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
   const videoSrc = isIOS ? 'animation.mp4' : 'animation.webm';
   ```

3. **文件大小比较**:
   - 总是保留原始GIF作为最终fallback
   - 优先使用WebM (更好的浏览器支持)
   - iOS设备使用HEVC

## 项目结构

```
gif-optimizing/
├── scripts/
│   ├── gif-to-webm.js      # WebM转换脚本
│   └── gif-to-hevc.js      # HEVC转换脚本
├── test/
│   ├── index.html          # 兼容性测试页面
│   └── assets/             # 测试资源文件夹
├── output/                 # 输出文件夹
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

## 常见问题

**Q: 转换后透明度丢失了?**
A: 确保使用了正确的像素格式 (yuva420p for WebM, alpha layer for HEVC)

**Q: Android低版本不支持WebM怎么办?**
A: 使用fallback机制,提供GIF作为备选方案

**Q: 文件太大如何优化?**
A: 调整CRF值(增加数值会减小文件大小但降低质量)

## License

MIT
