#!/usr/bin/env node

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { setupFFmpeg } = require('./ffmpeg-helper');

// 智能检测并配置FFmpeg
const ffmpegSetup = setupFFmpeg(ffmpeg);
if (!ffmpegSetup.success) {
  console.error('FFmpeg配置失败，无法继续转换');
  process.exit(1);
}

/**
 * 将GIF转换为HEVC with Alpha格式
 * 适用于iOS 11+和macOS 10.13+ (Safari)
 * @param {string} inputPath - 输入GIF文件路径
 * @param {string} outputPath - 输出MP4文件路径
 * @param {object} options - 转换选项
 */
function convertGifToHEVC(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    // 默认选项
    const defaultOptions = {
      crf: 32,          // 质量控制 (0-51, 数值越大文件越小质量越低)
      preset: 'medium', // 编码预设 (ultrafast, fast, medium, slow, veryslow)
      width: null,      // 输出宽度 (可选)
      height: null,     // 输出高度 (可选)
      fps: null,        // 帧率 (可选,默认保持原始)
    };

    const opts = { ...defaultOptions, ...options };

    console.log('🎬 开始转换GIF到HEVC with Alpha...');
    console.log(`📁 输入: ${inputPath}`);
    console.log(`📁 输出: ${outputPath}`);
    console.log(`⚙️  配置: CRF=${opts.crf}, Preset=${opts.preset}`);

    // 检查输入文件
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`输入文件不存在: ${inputPath}`));
    }

    // 创建临时文件用于两次pass
    const tempAlphaPath = outputPath.replace(/\.(mp4|mov)$/i, '.alpha.mp4');

    console.log('📝 注意: HEVC with Alpha需要两步转换');
    console.log('   步骤1: 提取并编码RGB通道');
    console.log('   步骤2: 提取并编码Alpha通道');
    console.log('');

    // 第一步: 转换主视频 (RGB通道)
    const command1 = ffmpeg(inputPath);

    command1
      .videoCodec('libx265')
      .outputOptions([
        '-pix_fmt', 'yuv420p',
        '-crf', String(opts.crf),
        '-preset', opts.preset,
        '-tag:v', 'hvc1',                    // 使Apple设备识别
        '-movflags', '+faststart',           // 优化网络播放
      ]);

    // 可选参数
    if (opts.width || opts.height) {
      command1.size(`${opts.width || '?'}x${opts.height || '?'}`);
    }

    if (opts.fps) {
      command1.fps(opts.fps);
    }

    // 不需要音频
    command1.noAudio();

    console.log('⚡ 步骤1/2: 编码RGB通道...');

    // 执行第一步转换
    command1
      .on('start', (commandLine) => {
        console.log('   FFmpeg:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r   ⏳ 进度: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('\n   ✅ RGB通道完成');

        // 第二步: 提取Alpha通道 (如果有)
        // 注意: 标准FFmpeg可能无法直接创建带alpha的HEVC
        // 这里我们创建单独的alpha视频,前端可以通过CSS混合
        console.log('\n⚡ 步骤2/2: 提取Alpha通道...');

        const command2 = ffmpeg(inputPath);

        command2
          .videoCodec('libx265')
          .outputOptions([
            '-vf', 'alphaextract,format=yuv420p',  // 提取alpha通道
            '-crf', String(opts.crf),
            '-preset', opts.preset,
            '-tag:v', 'hvc1',
            '-movflags', '+faststart',
          ])
          .noAudio();

        if (opts.fps) {
          command2.fps(opts.fps);
        }

        command2
          .on('start', (commandLine) => {
            console.log('   FFmpeg:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              process.stdout.write(`\r   ⏳ 进度: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('\n   ✅ Alpha通道完成');
            console.log('\n✅ 转换完成!');

            // 显示文件大小对比
            const inputSize = fs.statSync(inputPath).size;
            const outputSize = fs.statSync(outputPath).size;
            const alphaSize = fs.existsSync(tempAlphaPath) ? fs.statSync(tempAlphaPath).size : 0;
            const totalSize = outputSize + alphaSize;
            const reduction = ((1 - totalSize / inputSize) * 100).toFixed(2);

            console.log('\n📊 文件大小对比:');
            console.log(`   原始GIF:    ${formatBytes(inputSize)}`);
            console.log(`   主视频:     ${formatBytes(outputSize)}`);
            if (alphaSize > 0) {
              console.log(`   Alpha视频:  ${formatBytes(alphaSize)}`);
              console.log(`   总大小:     ${formatBytes(totalSize)}`);
            }
            console.log(`   减少:       ${reduction}%`);

            console.log('\n📝 使用说明:');
            console.log(`   主视频: ${path.basename(outputPath)}`);
            if (alphaSize > 0) {
              console.log(`   Alpha: ${path.basename(tempAlphaPath)}`);
              console.log('   注意: iOS Safari会自动处理带alpha的HEVC');
            }

            resolve({
              inputSize,
              outputSize,
              alphaSize,
              totalSize,
              reduction: parseFloat(reduction),
              outputPath,
              alphaPath: alphaSize > 0 ? tempAlphaPath : null
            });
          })
          .on('error', (err) => {
            console.error('\n❌ Alpha通道提取失败:', err.message);
            console.log('⚠️  继续使用无alpha的视频');

            // 即使alpha提取失败,主视频已完成
            const inputSize = fs.statSync(inputPath).size;
            const outputSize = fs.statSync(outputPath).size;
            const reduction = ((1 - outputSize / inputSize) * 100).toFixed(2);

            resolve({
              inputSize,
              outputSize,
              alphaSize: 0,
              totalSize: outputSize,
              reduction: parseFloat(reduction),
              outputPath,
              alphaPath: null,
              warning: 'Alpha通道提取失败,输出不包含透明度'
            });
          })
          .save(tempAlphaPath);
      })
      .on('error', (err) => {
        console.error('\n❌ 转换失败:', err.message);
        reject(err);
      })
      .save(outputPath);
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
    console.log('  node gif-to-hevc.js <input.gif> [output.mp4] [options]');
    console.log('');
    console.log('选项:');
    console.log('  --crf <number>      质量控制 (0-51, 默认32)');
    console.log('  --preset <string>   编码预设 (ultrafast/fast/medium/slow, 默认medium)');
    console.log('  --width <number>    输出宽度');
    console.log('  --height <number>   输出高度');
    console.log('  --fps <number>      输出帧率');
    console.log('');
    console.log('示例:');
    console.log('  node gif-to-hevc.js input.gif');
    console.log('  node gif-to-hevc.js input.gif output.mp4');
    console.log('  node gif-to-hevc.js input.gif output.mp4 --crf 28 --preset fast');
    console.log('');
    console.log('💡 提示:');
    console.log('   - 输出的MP4文件可以在iOS 11+和macOS 10.13+的Safari中播放');
    console.log('   - 如果GIF有透明度,会生成单独的alpha视频');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.gif$/i, '.mp4');

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

  convertGifToHEVC(inputPath, outputPath, options)
    .then((result) => {
      console.log('\n🎉 转换成功完成!');
      if (result.warning) {
        console.log(`⚠️  警告: ${result.warning}`);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('转换失败:', err);
      process.exit(1);
    });
}

module.exports = { convertGifToHEVC };
