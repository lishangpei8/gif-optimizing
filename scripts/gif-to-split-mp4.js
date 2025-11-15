#!/usr/bin/env node

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * 将GIF转换为拼接MP4格式 (RGB+Alpha水平拼接, 用于Canvas渲染)
 * @param {string} inputPath - 输入GIF文件路径
 * @param {string} outputPath - 输出MP4文件路径
 * @param {object} options - 转换选项
 */
function convertGifToSplitMP4(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    // 默认选项
    const defaultOptions = {
      crf: 23,          // 质量控制 (0-51, 数值越大文件越小质量越低)
      preset: 'medium', // 编码预设 (ultrafast, fast, medium, slow, veryslow)
      fps: null,        // 帧率 (可选,默认保持原始)
      layout: 'horizontal', // 拼接布局: horizontal(水平) 或 vertical(垂直)
      profile: 'high',  // H.264 profile (baseline, main, high)
    };

    const opts = { ...defaultOptions, ...options };

    console.log('🎬 开始转换GIF到拼接MP4...');
    console.log(`📁 输入: ${inputPath}`);
    console.log(`📁 输出: ${outputPath}`);
    console.log(`⚙️  配置: CRF=${opts.crf}, Preset=${opts.preset}, Layout=${opts.layout}`);

    // 检查输入文件
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`输入文件不存在: ${inputPath}`));
    }

    const command = ffmpeg(inputPath);

    // 构建filter_complex
    // 1. split: 将输入分成两路
    // 2. alphaextract: 从一路提取alpha通道
    // 3. hstack/vstack: 将RGB和Alpha水平或垂直拼接
    const stackFilter = opts.layout === 'vertical' ? 'vstack' : 'hstack';
    const filterComplex = `[0:v]split=2[rgb][alpha];[alpha]alphaextract[a];[rgb][a]${stackFilter}`;

    command
      .complexFilter(filterComplex)
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt', 'yuv420p',           // 标准像素格式,兼容性最好
        '-crf', String(opts.crf),
        '-preset', opts.preset,
        '-profile:v', opts.profile,      // H.264 profile
        '-movflags', '+faststart',       // 优化网络播放
      ]);

    // 可选参数
    if (opts.fps) {
      command.fps(opts.fps);
    }

    // 不需要音频
    command.noAudio();

    // 进度监控
    command
      .on('start', (commandLine) => {
        console.log('⚡ FFmpeg命令:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r⏳ 进度: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('\n✅ 转换完成!');

        // 显示文件大小对比
        const inputSize = fs.statSync(inputPath).size;
        const outputSize = fs.statSync(outputPath).size;
        const reduction = ((1 - outputSize / inputSize) * 100).toFixed(2);

        console.log('\n📊 文件大小对比:');
        console.log(`   原始GIF: ${formatBytes(inputSize)}`);
        console.log(`   拼接MP4: ${formatBytes(outputSize)}`);
        console.log(`   减少:    ${reduction}%`);
        console.log('\n💡 使用说明:');
        console.log(`   - 视频布局: ${opts.layout === 'horizontal' ? 'RGB在左, Alpha在右' : 'RGB在上, Alpha在下'}`);
        console.log('   - 需要配合Canvas渲染器使用');
        console.log('   - 兼容所有支持H.264的浏览器');

        resolve({
          inputSize,
          outputSize,
          reduction: parseFloat(reduction),
          outputPath,
          layout: opts.layout
        });
      })
      .on('error', (err) => {
        console.error('\n❌ 转换失败:', err.message);
        reject(err);
      });

    // 执行转换
    command.save(outputPath);
  });
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node gif-to-split-mp4.js <input.gif> [output.mp4] [options]');
    console.log('');
    console.log('选项:');
    console.log('  --crf <number>      质量控制 (0-51, 默认23)');
    console.log('  --preset <string>   编码预设 (ultrafast, fast, medium, slow, veryslow, 默认medium)');
    console.log('  --fps <number>      输出帧率');
    console.log('  --layout <string>   拼接布局 (horizontal, vertical, 默认horizontal)');
    console.log('  --profile <string>  H.264 profile (baseline, main, high, 默认high)');
    console.log('');
    console.log('示例:');
    console.log('  node gif-to-split-mp4.js input.gif');
    console.log('  node gif-to-split-mp4.js input.gif output.mp4');
    console.log('  node gif-to-split-mp4.js input.gif output.mp4 --crf 20 --preset slow');
    console.log('  node gif-to-split-mp4.js input.gif output.mp4 --layout vertical');
    console.log('');
    console.log('说明:');
    console.log('  该工具将GIF的RGB和Alpha通道拼接成一个MP4视频');
    console.log('  horizontal布局: RGB在左, Alpha在右 (视频宽度为原始2倍)');
    console.log('  vertical布局:   RGB在上, Alpha在下 (视频高度为原始2倍)');
    console.log('  输出的MP4需要配合Canvas渲染器使用，分离RGB和Alpha并合成显示');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.gif$/i, '-split.mp4');

  // 解析选项
  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        options[key.replace(/-/g, '')] = isNaN(value) ? value : Number(value);
        i++;
      }
    }
  }

  convertGifToSplitMP4(inputPath, outputPath, options)
    .then(() => {
      console.log('\n🎉 转换成功完成!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('转换失败:', err);
      process.exit(1);
    });
}

module.exports = { convertGifToSplitMP4 };
