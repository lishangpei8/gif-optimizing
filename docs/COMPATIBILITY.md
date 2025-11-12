# 浏览器兼容性详细说明

## WebM (VP9 with Alpha)

### 完全支持

| 平台 | 浏览器 | 最低版本 | 备注 |
|------|--------|---------|------|
| Android | Chrome | 32+ (2014) | 原生支持,性能最佳 |
| Android | Firefox | 28+ (2014) | 原生支持 |
| Android | Edge | 79+ (2020) | 基于Chromium |
| Android | Opera | 19+ (2014) | 基于Chromium |
| Desktop | Chrome | 32+ | 全平台支持 |
| Desktop | Firefox | 28+ | 全平台支持 |
| Desktop | Edge | 79+ | 基于Chromium后支持 |
| Desktop | Opera | 19+ | 全平台支持 |

### 部分支持

| 平台 | 浏览器 | 版本 | 说明 |
|------|--------|------|------|
| Android | UC Browser | 12.0+ | 部分设备支持,建议测试 |
| Android | QQ Browser | 9.0+ | 部分设备支持,建议测试 |
| Android | 微信浏览器 | 7.0+ | 基于系统WebView,Android 5.0+支持 |
| Android | 百度浏览器 | 新版本 | 部分支持,建议提供fallback |

### 不支持

| 平台 | 浏览器 | 说明 |
|------|--------|------|
| iOS | 所有浏览器 | iOS不支持WebM格式 |
| Android | 系统浏览器 | Android 4.x及以下版本 |
| Desktop | Safari | macOS Safari不支持WebM |
| Desktop | IE | 所有版本不支持 |

### Android版本支持

- **Android 5.0+ (2014)**: 系统级WebM VP9支持
- **Android 4.4及以下**: 不支持
- **Android 6.0+**: 性能更好,推荐

### 测试方法

```javascript
// 检测WebM VP9支持
const video = document.createElement('video');
const webmSupport = video.canPlayType('video/webm; codecs="vp9"');
console.log('WebM VP9支持:', webmSupport); // 'probably', 'maybe', ''

// 检测Alpha通道支持
const webmAlphaSupport = video.canPlayType('video/webm; codecs="vp9,opus"');
console.log('WebM Alpha支持:', webmAlphaSupport);
```

---

## HEVC with Alpha (MP4)

### 完全支持

| 平台 | 浏览器 | 最低版本 | 备注 |
|------|--------|---------|------|
| iOS | Safari | iOS 11+ (2017) | 原生支持,性能最佳 |
| iOS | Chrome | iOS 11+ | 使用WKWebView,支持HEVC |
| iOS | Firefox | iOS 11+ | 使用WKWebView,支持HEVC |
| iOS | 微信浏览器 | iOS 11+ | 使用WKWebView,支持HEVC |
| iOS | 其他浏览器 | iOS 11+ | iOS所有浏览器都使用WebKit |
| macOS | Safari | 10.13+ (2017) | 原生支持 |

### 部分支持

| 平台 | 浏览器 | 说明 |
|------|--------|------|
| Windows | Edge | Windows 10+ 需要HEVC扩展 |
| Windows | Chrome | 需要系统支持HEVC解码器 |

### 不支持

| 平台 | 浏览器 | 说明 |
|------|--------|------|
| Android | 所有浏览器 | Android浏览器普遍不支持HEVC |
| Linux | 所有浏览器 | 许可证问题,不支持 |
| iOS | Safari | iOS 10及以下 |

### iOS版本支持

- **iOS 11+ (2017)**: 完全支持HEVC with Alpha
- **iOS 10及以下**: 不支持
- **iOS 14+**: 性能更好,推荐

### 设备要求

HEVC播放需要硬件支持:
- **iPhone**: iPhone 7及以上 (A10芯片)
- **iPad**: iPad (2017)及以上
- **Mac**: 2016年及以后的Mac

### 测试方法

```javascript
// 检测HEVC支持
const video = document.createElement('video');
const hevcSupport = video.canPlayType('video/mp4; codecs="hvc1"');
console.log('HEVC支持:', hevcSupport); // 'probably', 'maybe', ''

// 也可以尝试 hev1 编码
const hevcSupport2 = video.canPlayType('video/mp4; codecs="hev1"');
console.log('HEVC (hev1)支持:', hevcSupport2);
```

---

## 推荐策略

### 渐进式增强方案

```html
<!-- 推荐:使用video标签,多source -->
<video autoplay loop muted playsinline>
  <!-- 首选:iOS设备用HEVC -->
  <source src="animation.mp4" type='video/mp4; codecs="hvc1"'>
  <!-- 次选:Android/Desktop用WebM -->
  <source src="animation.webm" type="video/webm; codecs=vp9">
  <!-- Fallback:所有浏览器都支持的GIF -->
  <img src="animation.gif" alt="Animation">
</video>
```

### JavaScript动态选择

```javascript
function getOptimalVideoFormat() {
  const ua = navigator.userAgent;
  const video = document.createElement('video');

  // iOS设备优先使用HEVC
  if (/iPad|iPhone|iPod/.test(ua)) {
    const hevcSupport = video.canPlayType('video/mp4; codecs="hvc1"');
    if (hevcSupport) {
      return { format: 'mp4', codec: 'hvc1', source: 'animation.mp4' };
    }
  }

  // Android/Desktop优先使用WebM
  const webmSupport = video.canPlayType('video/webm; codecs="vp9"');
  if (webmSupport) {
    return { format: 'webm', codec: 'vp9', source: 'animation.webm' };
  }

  // Fallback到GIF
  return { format: 'gif', source: 'animation.gif' };
}

// 使用
const format = getOptimalVideoFormat();
console.log('使用格式:', format);
```

### 预加载优化

```javascript
// 根据设备预加载最合适的格式
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'video';
link.href = isIOS ? 'animation.mp4' : 'animation.webm';
document.head.appendChild(link);
```

---

## 文件大小对比

实测数据(以1MB GIF为基准):

| 格式 | 文件大小 | 减少比例 | 透明度 | 质量 |
|------|---------|---------|--------|------|
| 原始GIF | 1.0 MB | - | ✅ | 中等 |
| WebM (VP9, CRF 35) | 0.3-0.5 MB | 50-70% | ✅ | 高 |
| HEVC (CRF 32) | 0.2-0.4 MB | 60-80% | ✅ | 高 |

**注意**: 实际压缩率取决于GIF内容、帧数、分辨率等因素。

---

## 性能对比

| 格式 | CPU占用 | 内存占用 | 解码性能 | 电池消耗 |
|------|---------|---------|---------|---------|
| GIF | 高 | 高 | 软解码 | 高 |
| WebM | 中 | 中 | 软/硬解码 | 中 |
| HEVC | 低 | 低 | 硬解码 | 低 |

**HEVC优势**: iOS设备使用硬件解码,性能最佳,功耗最低。

**WebM优势**: 跨平台兼容性好,Android性能优秀。

---

## 测试建议

### 低版本Android测试

测试以下设备/系统:
- ✅ Android 5.0 (2014) - WebM支持的最低版本
- ✅ Android 4.4 - 确认不支持,验证fallback
- ✅ 微信浏览器 - 使用系统WebView
- ✅ UC浏览器 - 部分支持
- ✅ QQ浏览器 - 部分支持

### 低版本iOS测试

测试以下设备/系统:
- ✅ iOS 11 (2017) - HEVC支持的最低版本
- ✅ iOS 10 - 确认不支持,验证fallback
- ✅ iPhone 7 - 最早支持HEVC的设备
- ✅ 微信浏览器 - iOS 11+支持
- ✅ Safari - 完全支持

### 测试工具

1. **BrowserStack**: 在线测试真实设备
2. **本地设备**: 使用实际设备测试
3. **模拟器**: iOS Simulator, Android Emulator
4. **兼容性测试页面**: 使用本项目的test/index.html

---

## 常见问题

### Q: WebM在iOS上能用吗?
A: 不能。iOS不支持WebM,需要使用HEVC或GIF作为fallback。

### Q: HEVC在Android上能用吗?
A: 一般不能。大多数Android浏览器不支持HEVC。

### Q: 透明度会丢失吗?
A: 使用正确的编码参数不会丢失。WebM用yuva420p,HEVC用alpha layer。

### Q: 如何选择CRF值?
A: CRF越小质量越高文件越大。WebM推荐30-40,HEVC推荐28-35。

### Q: 低版本浏览器怎么办?
A: 使用video标签的多source + img fallback方案。

### Q: 微信浏览器支持吗?
A: iOS微信(iOS 11+)支持HEVC,Android微信(Android 5.0+)支持WebM。

---

## 更新日志

- **2024**: iOS 17+, Android 14+ 都很好地支持各自的优化格式
- **2017**: iOS 11引入HEVC支持
- **2014**: Android 5.0引入WebM VP9支持
