/**
 * AlphaVideoRenderer - Canvas渲染器，用于显示拼接的RGB+Alpha视频
 *
 * 使用方法:
 * ```javascript
 * const renderer = new AlphaVideoRenderer({
 *   videoSrc: 'path/to/split-video.mp4',
 *   canvas: document.getElementById('myCanvas'),
 *   layout: 'horizontal' // 或 'vertical'
 * });
 *
 * renderer.play();
 * ```
 */
class AlphaVideoRenderer {
  /**
   * @param {Object} options - 配置选项
   * @param {string} options.videoSrc - 拼接视频的URL
   * @param {HTMLCanvasElement} options.canvas - 目标Canvas元素
   * @param {string} [options.layout='horizontal'] - 视频布局 ('horizontal' 或 'vertical')
   * @param {boolean} [options.autoplay=true] - 是否自动播放
   * @param {boolean} [options.loop=true] - 是否循环播放
   * @param {boolean} [options.muted=true] - 是否静音
   * @param {number} [options.playbackRate=1.0] - 播放速度
   */
  constructor(options) {
    this.options = {
      layout: 'horizontal',
      autoplay: true,
      loop: true,
      muted: true,
      playbackRate: 1.0,
      ...options
    };

    if (!this.options.videoSrc) {
      throw new Error('videoSrc is required');
    }

    if (!this.options.canvas) {
      throw new Error('canvas element is required');
    }

    this.canvas = this.options.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.video = null;
    this.animationId = null;
    this.isPlaying = false;

    this._init();
  }

  /**
   * 初始化视频元素
   * @private
   */
  _init() {
    // 创建隐藏的video元素
    this.video = document.createElement('video');
    this.video.src = this.options.videoSrc;
    this.video.loop = this.options.loop;
    this.video.muted = this.options.muted;
    this.video.playbackRate = this.options.playbackRate;
    this.video.playsInline = true; // iOS兼容
    this.video.style.display = 'none';

    // 添加到DOM（某些浏览器需要）
    document.body.appendChild(this.video);

    // 视频加载完成后的处理
    this.video.addEventListener('loadedmetadata', () => {
      this._setupCanvas();

      if (this.options.autoplay) {
        this.play();
      }
    });

    // 错误处理
    this.video.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      this._onError(e);
    });
  }

  /**
   * 设置Canvas尺寸
   * @private
   */
  _setupCanvas() {
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    if (this.options.layout === 'horizontal') {
      // 水平布局: RGB在左, Alpha在右
      // 原始尺寸是视频宽度的一半
      this.originalWidth = videoWidth / 2;
      this.originalHeight = videoHeight;
    } else {
      // 垂直布局: RGB在上, Alpha在下
      // 原始尺寸是视频高度的一半
      this.originalWidth = videoWidth;
      this.originalHeight = videoHeight / 2;
    }

    // 设置Canvas尺寸为原始尺寸
    this.canvas.width = this.originalWidth;
    this.canvas.height = this.originalHeight;
  }

  /**
   * 渲染单帧
   * @private
   */
  _renderFrame() {
    if (!this.isPlaying || this.video.paused || this.video.ended) {
      return;
    }

    const width = this.originalWidth;
    const height = this.originalHeight;

    // 创建临时canvas用于处理
    if (!this.tempCanvas) {
      this.tempCanvas = document.createElement('canvas');
      this.tempCtx = this.tempCanvas.getContext('2d');
    }

    this.tempCanvas.width = width;
    this.tempCanvas.height = height;

    // 绘制RGB部分
    if (this.options.layout === 'horizontal') {
      // 水平布局: 取左半部分作为RGB
      this.tempCtx.drawImage(
        this.video,
        0, 0, width, height,           // 源区域 (左半部分)
        0, 0, width, height            // 目标区域
      );
    } else {
      // 垂直布局: 取上半部分作为RGB
      this.tempCtx.drawImage(
        this.video,
        0, 0, width, height,           // 源区域 (上半部分)
        0, 0, width, height            // 目标区域
      );
    }

    // 获取RGB图像数据
    const imageData = this.tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 绘制Alpha部分到临时canvas
    if (this.options.layout === 'horizontal') {
      // 水平布局: 取右半部分作为Alpha
      this.tempCtx.drawImage(
        this.video,
        width, 0, width, height,       // 源区域 (右半部分)
        0, 0, width, height            // 目标区域
      );
    } else {
      // 垂直布局: 取下半部分作为Alpha
      this.tempCtx.drawImage(
        this.video,
        0, height, width, height,      // 源区域 (下半部分)
        0, 0, width, height            // 目标区域
      );
    }

    // 获取Alpha图像数据
    const alphaData = this.tempCtx.getImageData(0, 0, width, height);
    const alphaPixels = alphaData.data;

    // 将Alpha通道合并到RGB数据中
    // Alpha视频的R通道(灰度值)作为最终图像的Alpha通道
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = alphaPixels[i]; // 使用Alpha图像的R通道作为透明度
    }

    // 清空canvas并绘制合成后的图像
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.putImageData(imageData, 0, 0);

    // 请求下一帧
    this.animationId = requestAnimationFrame(() => this._renderFrame());
  }

  /**
   * 播放视频
   */
  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;

    const playPromise = this.video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this._renderFrame();
          this._onPlay();
        })
        .catch(err => {
          console.error('Play error:', err);
          this.isPlaying = false;
          this._onError(err);
        });
    } else {
      this._renderFrame();
      this._onPlay();
    }
  }

  /**
   * 暂停视频
   */
  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.video.pause();

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this._onPause();
  }

  /**
   * 停止视频并重置
   */
  stop() {
    this.pause();
    this.video.currentTime = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 设置播放速度
   * @param {number} rate - 播放速度 (0.5 = 慢速, 1.0 = 正常, 2.0 = 快速)
   */
  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
    this.options.playbackRate = rate;
  }

  /**
   * 跳转到指定时间
   * @param {number} time - 时间(秒)
   */
  seekTo(time) {
    this.video.currentTime = time;
  }

  /**
   * 获取当前播放时间
   * @returns {number} 当前时间(秒)
   */
  getCurrentTime() {
    return this.video.currentTime;
  }

  /**
   * 获取视频总时长
   * @returns {number} 总时长(秒)
   */
  getDuration() {
    return this.video.duration;
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    this.stop();

    if (this.video) {
      this.video.remove();
      this.video = null;
    }

    if (this.tempCanvas) {
      this.tempCanvas = null;
      this.tempCtx = null;
    }

    this.ctx = null;
    this.canvas = null;
  }

  /**
   * 事件回调 - 可以被覆盖
   */
  _onPlay() {
    // console.log('Video playing');
  }

  _onPause() {
    // console.log('Video paused');
  }

  _onError(error) {
    console.error('AlphaVideoRenderer error:', error);
  }
}

// 支持CommonJS和ES6模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlphaVideoRenderer;
}

// 支持浏览器全局变量
if (typeof window !== 'undefined') {
  window.AlphaVideoRenderer = AlphaVideoRenderer;
}
