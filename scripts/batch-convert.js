#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { convertGifToWebM } = require('./gif-to-webm');
const { convertGifToHEVC } = require('./gif-to-hevc');

/**
 * 批量转换GIF文件
 * @param {string} inputDir - 输入目录
 * @param {string} outputDir - 输出目录
 * @param {object} options - 转换选项
 */
async function batchConvert(inputDir, outputDir, options = {}) {
  console.log('🚀 批量GIF转换工具');
  console.log('=====================================\n');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ 创建输出目录: ${outputDir}\n`);
  }

  // 查找所有GIF文件
  const files = fs.readdirSync(inputDir)
    .filter(file => file.toLowerCase().endsWith('.gif'))
    .map(file => path.join(inputDir, file));

  if (files.length === 0) {
    console.log(`❌ 在 ${inputDir} 中没有找到GIF文件`);
    return;
  }

  console.log(`📁 找到 ${files.length} 个GIF文件\n`);

  const results = {
    total: files.length,
    success: 0,
    failed: 0,
    totalInputSize: 0,
    totalWebMSize: 0,
    totalHEVCSize: 0,
    details: []
  };

  // 处理每个文件
  for (let i = 0; i < files.length; i++) {
    const inputPath = files[i];
    const filename = path.basename(inputPath, '.gif');

    console.log(`\n[${i + 1}/${files.length}] 处理: ${filename}.gif`);
    console.log('─────────────────────────────────────');

    try {
      const inputSize = fs.statSync(inputPath).size;
      results.totalInputSize += inputSize;

      const fileResult = {
        filename,
        inputSize,
        webm: null,
        hevc: null,
        success: false
      };

      // 转换为WebM
      if (options.formats.includes('webm')) {
        const webmPath = path.join(outputDir, `${filename}.webm`);
        try {
          const webmResult = await convertGifToWebM(inputPath, webmPath, options.webm || {});
          results.totalWebMSize += webmResult.outputSize;
          fileResult.webm = webmResult;
          console.log(`  ✅ WebM: ${formatBytes(webmResult.outputSize)} (减少 ${webmResult.reduction}%)`);
        } catch (err) {
          console.error(`  ❌ WebM转换失败: ${err.message}`);
        }
      }

      // 转换为HEVC
      if (options.formats.includes('hevc')) {
        const hevcPath = path.join(outputDir, `${filename}.mp4`);
        try {
          const hevcResult = await convertGifToHEVC(inputPath, hevcPath, options.hevc || {});
          results.totalHEVCSize += hevcResult.totalSize;
          fileResult.hevc = hevcResult;
          console.log(`  ✅ HEVC: ${formatBytes(hevcResult.totalSize)} (减少 ${hevcResult.reduction}%)`);
        } catch (err) {
          console.error(`  ❌ HEVC转换失败: ${err.message}`);
        }
      }

      if (fileResult.webm || fileResult.hevc) {
        results.success++;
        fileResult.success = true;
      } else {
        results.failed++;
      }

      results.details.push(fileResult);

    } catch (err) {
      console.error(`  ❌ 处理失败: ${err.message}`);
      results.failed++;
      results.details.push({
        filename,
        success: false,
        error: err.message
      });
    }
  }

  // 显示总结
  console.log('\n\n🎉 批量转换完成!');
  console.log('=====================================');
  console.log(`总文件数:   ${results.total}`);
  console.log(`成功:       ${results.success}`);
  console.log(`失败:       ${results.failed}`);
  console.log('');
  console.log('📊 总体统计:');
  console.log(`原始GIF总大小:  ${formatBytes(results.totalInputSize)}`);

  if (results.totalWebMSize > 0) {
    const webmReduction = ((1 - results.totalWebMSize / results.totalInputSize) * 100).toFixed(2);
    console.log(`WebM总大小:     ${formatBytes(results.totalWebMSize)} (减少 ${webmReduction}%)`);
  }

  if (results.totalHEVCSize > 0) {
    const hevcReduction = ((1 - results.totalHEVCSize / results.totalInputSize) * 100).toFixed(2);
    console.log(`HEVC总大小:     ${formatBytes(results.totalHEVCSize)} (减少 ${hevcReduction}%)`);
  }

  // 保存详细报告
  const reportPath = path.join(outputDir, 'conversion-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);

  return results;
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
    console.log('批量GIF转换工具');
    console.log('');
    console.log('使用方法:');
    console.log('  node batch-convert.js <input-dir> [output-dir] [options]');
    console.log('');
    console.log('选项:');
    console.log('  --formats <webm,hevc>   要转换的格式 (默认: webm,hevc)');
    console.log('  --webm-crf <number>     WebM质量 (默认: 35)');
    console.log('  --hevc-crf <number>     HEVC质量 (默认: 32)');
    console.log('  --width <number>        输出宽度');
    console.log('  --height <number>       输出高度');
    console.log('  --fps <number>          输出帧率');
    console.log('');
    console.log('示例:');
    console.log('  node batch-convert.js ./gifs ./output');
    console.log('  node batch-convert.js ./gifs ./output --formats webm');
    console.log('  node batch-convert.js ./gifs ./output --webm-crf 30 --hevc-crf 28');
    process.exit(1);
  }

  const inputDir = args[0];
  const outputDir = args[1] || './output';

  // 检查输入目录
  if (!fs.existsSync(inputDir)) {
    console.error(`❌ 输入目录不存在: ${inputDir}`);
    process.exit(1);
  }

  // 解析选项
  const options = {
    formats: ['webm', 'hevc'],
    webm: {},
    hevc: {}
  };

  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];

      if (key === 'formats' && value) {
        options.formats = value.split(',');
        i++;
      } else if (key === 'webm-crf' && value) {
        options.webm.crf = Number(value);
        i++;
      } else if (key === 'hevc-crf' && value) {
        options.hevc.crf = Number(value);
        i++;
      } else if (key === 'width' && value) {
        options.webm.width = Number(value);
        options.hevc.width = Number(value);
        i++;
      } else if (key === 'height' && value) {
        options.webm.height = Number(value);
        options.hevc.height = Number(value);
        i++;
      } else if (key === 'fps' && value) {
        options.webm.fps = Number(value);
        options.hevc.fps = Number(value);
        i++;
      }
    }
  }

  batchConvert(inputDir, outputDir, options)
    .then(() => {
      console.log('\n✨ 全部完成!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('批量转换失败:', err);
      process.exit(1);
    });
}

module.exports = { batchConvert };
