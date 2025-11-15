#!/usr/bin/env node

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// 尝试使用ffmpeg-static，如果不存在则使用系统FFmpeg
try {
  const ffmpegPath = require('ffmpeg-static');
  ffmpeg.setFfmpegPath(ffmpegPath);
} catch (e) {
  // 使用系统FFmpeg
  console.log('✓ 使用系统FFmpeg (请确保已安装)');
}

/**
 * 将GIF转换为WebM格式 (VP9编码,支持透明度)
 * @param {string} inputPath - 输入GIF文件路径
 * @param {string} outputPath - 输出WebM文件路径
 * @param {object} options - 转换选项
 */
function convertGifToWebM(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    // 默认选项
    const defaultOptions = {
      crf: 35,          // 质量控制 (15-50, 数值越大文件越小质量越低)
      cpuUsed: 2,       // 编码速度 (0-5, 数值越大速度越快质量越低)
      bitrate: null,    // 比特率 (可选,如 '1000k')
      width: null,      // 输出宽度 (可选)
      height: null,     // 输出高度 (可选)
      fps: null,        // 帧率 (可选,默认保持原始)
      autoAlt: true,    // 自动生成png格式作为替代 (alpha可能更好)
    };

    const opts = { ...defaultOptions, ...options };

    console.log('🎬 开始转换GIF到WebM...');
    console.log(`📁 输入: ${inputPath}`);
    console.log(`📁 输出: ${outputPath}`);
    console.log(`⚙️  配置: CRF=${opts.crf}, CPU-USED=${opts.cpuUsed}`);

    // 检查输入文件
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`输入文件不存在: ${inputPath}`));
    }

    const command = ffmpeg(inputPath);

    // 视频编码设置 - VP9支持Alpha通道
    command
      .videoCodec('libvpx-vp9')
      .outputOptions([
        '-pix_fmt', 'yuva420p',              // 支持alpha通道的像素格式
        '-c:v', 'libvpx-vp9',
        '-crf', String(opts.crf),
        '-b:v', '0',                          // 使用CRF模式
        `-cpu-used`, String(opts.cpuUsed),
        '-row-mt', '1',                       // 多线程编码
        '-auto-alt-ref', '1',
        '-lag-in-frames', '25',
        '-metadata:s:v:0', 'alpha_mode="1"'  // 标记alpha通道
      ]);

    // 可选参数
    if (opts.width || opts.height) {
      command.size(`${opts.width || '?'}x${opts.height || '?'}`);
    }

    if (opts.fps) {
      command.fps(opts.fps);
    }

    if (opts.bitrate) {
      command.videoBitrate(opts.bitrate);
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
        console.log(`   WebM:    ${formatBytes(outputSize)}`);
        console.log(`   减少:    ${reduction}%`);

        resolve({
          inputSize,
          outputSize,
          reduction: parseFloat(reduction),
          outputPath
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
    console.log('  node gif-to-webm.js <input.gif> [output.webm] [options]');
    console.log('');
    console.log('选项:');
    console.log('  --crf <number>      质量控制 (15-50, 默认35)');
    console.log('  --cpu-used <number> 编码速度 (0-5, 默认2)');
    console.log('  --width <number>    输出宽度');
    console.log('  --height <number>   输出高度');
    console.log('  --fps <number>      输出帧率');
    console.log('');
    console.log('示例:');
    console.log('  node gif-to-webm.js input.gif');
    console.log('  node gif-to-webm.js input.gif output.webm');
    console.log('  node gif-to-webm.js input.gif output.webm --crf 30 --fps 30');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.gif$/i, '.webm');

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

  convertGifToWebM(inputPath, outputPath, options)
    .then(() => {
      console.log('\n🎉 转换成功完成!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('转换失败:', err);
      process.exit(1);
    });
}

module.exports = { convertGifToWebM };
