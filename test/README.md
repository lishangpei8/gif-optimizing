# 兼容性测试说明

## 测试准备

### 1. 准备测试文件

将你的GIF文件转换为WebM和HEVC格式:

```bash
# 转换示例GIF
node scripts/gif-to-webm.js your-animation.gif test/assets/sample.webm
node scripts/gif-to-hevc.js your-animation.gif test/assets/sample.mp4

# 复制原始GIF
cp your-animation.gif test/assets/sample.gif
```

### 2. 启动测试服务器

```bash
npm install
npm run serve
```

服务器将在 http://localhost:8080 启动并自动打开浏览器。

## 测试流程

### Android设备测试 (WebM兼容性)

#### 测试设备建议

| 系统版本 | 测试目的 | 预期结果 |
|---------|---------|---------|
| Android 5.0 | 最低支持版本 | WebM应该能播放 |
| Android 4.4 | 不支持验证 | WebM不能播放,显示GIF fallback |
| Android 6.0+ | 标准支持 | WebM完美播放 |

#### 测试浏览器

- ✅ Chrome浏览器 (推荐)
- ✅ Firefox浏览器
- ✅ 微信内置浏览器
- ✅ QQ浏览器
- ✅ UC浏览器
- ✅ 系统默认浏览器

#### 测试步骤

1. 在Android设备上连接与电脑相同的WiFi网络
2. 打开浏览器,访问: `http://[电脑IP]:8080`
3. 查看测试页面显示的设备信息和兼容性测试结果
4. 观察WebM视频是否正常播放
5. 检查是否保留透明度(如果原GIF有透明度)
6. 记录测试结果

#### 如何查看电脑IP

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

### iOS设备测试 (HEVC兼容性)

#### 测试设备建议

| 系统版本 | 设备 | 测试目的 | 预期结果 |
|---------|------|---------|---------|
| iOS 11.0 | iPhone 7+ | 最低支持版本 | HEVC应该能播放 |
| iOS 10.x | iPhone 6s | 不支持验证 | HEVC不能播放,显示GIF fallback |
| iOS 14+ | 任意设备 | 标准支持 | HEVC完美播放 |

#### 测试浏览器

- ✅ Safari (推荐)
- ✅ Chrome (iOS)
- ✅ Firefox (iOS)
- ✅ 微信内置浏览器
- ✅ QQ浏览器

**注意**: iOS上所有浏览器都使用WebKit引擎,兼容性基本一致。

#### 测试步骤

1. 在iOS设备上连接与电脑相同的WiFi网络
2. 打开Safari或其他浏览器
3. 访问: `http://[电脑IP]:8080`
4. 查看测试页面显示的设备信息和兼容性测试结果
5. 观察HEVC视频是否正常播放
6. 检查是否保留透明度
7. 记录测试结果

### 使用二维码测试

生成二维码方便手机扫描:

```bash
# 使用在线工具生成
# http://[你的IP]:8080 的二维码
```

或使用Chrome的设备模拟功能快速预览。

## 测试检查项

### 功能检查

- [ ] 视频能否正常播放
- [ ] 视频是否自动播放
- [ ] 视频是否循环播放
- [ ] 透明度是否正确显示
- [ ] 动画帧率是否流畅
- [ ] 视频加载速度是否可接受

### 性能检查

- [ ] 页面加载速度
- [ ] 视频内存占用 (Chrome DevTools)
- [ ] CPU使用率 (是否过高)
- [ ] 电池消耗 (长时间播放测试)
- [ ] 发热情况

### 兼容性检查

- [ ] 设备信息是否正确检测
- [ ] WebM支持检测是否准确
- [ ] HEVC支持检测是否准确
- [ ] Fallback机制是否正常工作
- [ ] 推荐方案是否合理

## 测试结果记录模板

### Android测试记录

```
设备: [设备型号]
系统版本: Android [版本号]
浏览器: [浏览器名称] [版本号]

WebM播放: ✅ 成功 / ❌ 失败
透明度: ✅ 正常 / ❌ 丢失
性能: ✅ 流畅 / ⚠️ 一般 / ❌ 卡顿

备注:
[其他问题或说明]
```

### iOS测试记录

```
设备: [设备型号]
系统版本: iOS [版本号]
浏览器: [浏览器名称] [版本号]

HEVC播放: ✅ 成功 / ❌ 失败
透明度: ✅ 正常 / ❌ 丢失
性能: ✅ 流畅 / ⚠️ 一般 / ❌ 卡顿

备注:
[其他问题或说明]
```

## 常见问题

### Q: 视频不播放怎么办?

1. 检查文件是否正确放在 `test/assets/` 目录
2. 检查文件名是否为 `sample.gif`, `sample.webm`, `sample.mp4`
3. 打开浏览器控制台查看错误信息
4. 确认转换是否成功(检查转换脚本输出)

### Q: 只看到黑屏怎么办?

1. 可能是视频编码问题
2. 尝试调整CRF参数重新转换
3. 检查原始GIF是否正常
4. 查看浏览器控制台Network标签,确认文件已加载

### Q: 透明度丢失怎么办?

1. WebM: 确保使用了 `-pix_fmt yuva420p` 参数
2. HEVC: 确保提取了alpha通道
3. 检查原始GIF是否真的有透明度
4. 查看浏览器是否支持alpha通道

### Q: 测试页面无法访问?

1. 确认服务器是否启动 (`npm run serve`)
2. 确认防火墙未阻止端口8080
3. 确认设备在同一网络
4. 尝试使用 `http://localhost:8080` (电脑本地)

### Q: 如何在真实生产环境测试?

1. 将测试页面部署到HTTPS服务器
2. 使用真实域名访问
3. 在目标用户的实际设备上测试
4. 考虑网络条件(3G/4G/5G/WiFi)

## 高级测试

### 网络条件测试

使用Chrome DevTools模拟不同网络:

1. 打开DevTools (F12)
2. Network标签
3. Throttling选项选择: Slow 3G, Fast 3G, 4G等
4. 观察视频加载表现

### 自动化测试

可以使用以下工具进行自动化兼容性测试:

- **BrowserStack**: 真实设备云测试
- **Sauce Labs**: 多平台自动化测试
- **LambdaTest**: 在线跨浏览器测试

### 性能监控

```javascript
// 在测试页面的控制台运行
const video = document.getElementById('webm-video');

video.addEventListener('loadstart', () => console.log('开始加载'));
video.addEventListener('loadeddata', () => console.log('数据已加载'));
video.addEventListener('canplay', () => console.log('可以播放'));
video.addEventListener('playing', () => console.log('正在播放'));

// 检查内存使用 (Chrome)
if (performance.memory) {
  console.log('内存使用:', {
    总内存: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
    已使用: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB'
  });
}
```

## 测试完成后

### 分析结果

1. 汇总所有测试数据
2. 确定最低支持版本
3. 确认fallback方案是否有效
4. 评估性能和文件大小优势

### 做出决策

根据测试结果决定:
- ✅ 是否采用WebM格式
- ✅ 是否采用HEVC格式
- ✅ 如何实现fallback策略
- ✅ 是否需要针对特定浏览器优化

### 更新文档

将测试结果记录到项目文档中,供团队参考。

---

**祝测试顺利! 🎉**

如有问题,请查看主项目 README.md 或兼容性文档 docs/COMPATIBILITY.md。
