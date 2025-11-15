#!/usr/bin/env node

/**
 * 下载FFmpeg到项目目录
 * 适用于macOS Sequoia或其他Homebrew不支持的系统
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG_DIR = path.join(__dirname, 'bin');
const FFMPEG_PATH = path.join(FFMPEG_DIR, 'ffmpeg');

console.log('📦 FFmpeg下载工具\n');

// 创建bin目录
if (!fs.existsSync(FFMPEG_DIR)) {
  fs.mkdirSync(FFMPEG_DIR, { recursive: true });
}

// 检测系统
const platform = process.platform;
const arch = process.arch;

console.log(`系统: ${platform} ${arch}\n`);

if (platform !== 'darwin') {
  console.error('❌ 此工具目前仅支持macOS');
  console.error('请访问 https://ffmpeg.org/download.html 手动下载\n');
  process.exit(1);
}

// macOS下载链接（evermeet.cx提供预编译版本）
const DOWNLOAD_URL = 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip';

console.log('📥 正在下载FFmpeg...');
console.log(`来源: ${DOWNLOAD_URL}\n`);

const tempZip = path.join(__dirname, 'ffmpeg-temp.zip');

// 下载文件
const file = fs.createWriteStream(tempZip);

const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 302 || response.statusCode === 301) {
        console.log('重定向到:', response.headers.location);
        return downloadFile(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      let lastPercent = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = Math.floor((downloadedSize / totalSize) * 100);
        if (percent !== lastPercent && percent % 10 === 0) {
          process.stdout.write(`\r进度: ${percent}%`);
          lastPercent = percent;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n✓ 下载完成\n');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(tempZip, () => {});
      reject(err);
    });
  });
};

// 解压文件
const unzipFile = () => {
  console.log('📂 正在解压...');

  try {
    // 使用系统的unzip命令
    execSync(`unzip -o "${tempZip}" -d "${FFMPEG_DIR}"`, { stdio: 'pipe' });
    console.log('✓ 解压完成\n');

    // 添加执行权限
    fs.chmodSync(FFMPEG_PATH, 0o755);
    console.log('✓ 已添加执行权限\n');

    // 清理临时文件
    fs.unlinkSync(tempZip);

    return true;
  } catch (err) {
    console.error('❌ 解压失败:', err.message);
    return false;
  }
};

// 验证安装
const verifyInstall = () => {
  console.log('🔍 验证安装...');

  try {
    const output = execSync(`"${FFMPEG_PATH}" -version`, { encoding: 'utf8' });
    const version = output.split('\n')[0];
    console.log('✅ FFmpeg安装成功！\n');
    console.log(version);
    console.log(`\n路径: ${FFMPEG_PATH}\n`);
    return true;
  } catch (err) {
    console.error('❌ FFmpeg无法运行:', err.message);
    return false;
  }
};

// 主流程
(async () => {
  try {
    // 检查是否已经安装
    if (fs.existsSync(FFMPEG_PATH)) {
      console.log('⚠️  FFmpeg已存在，正在验证...\n');
      if (verifyInstall()) {
        console.log('现在可以运行转换脚本了！');
        process.exit(0);
      } else {
        console.log('重新下载...\n');
        fs.unlinkSync(FFMPEG_PATH);
      }
    }

    // 下载
    await downloadFile(DOWNLOAD_URL);

    // 解压
    if (!unzipFile()) {
      console.error('\n请手动解压下载的文件到 bin/ 目录');
      process.exit(1);
    }

    // 验证
    if (!verifyInstall()) {
      console.error('\n安装失败，请访问 https://ffmpeg.org/download.html 手动下载');
      process.exit(1);
    }

    console.log('🎉 全部完成！\n');
    console.log('现在可以运行转换脚本了：');
    console.log('  node scripts/gif-to-split-mp4.js input.gif output.mp4\n');

  } catch (err) {
    console.error('\n❌ 错误:', err.message);
    console.error('\n手动安装方法：');
    console.error('1. 访问: https://evermeet.cx/ffmpeg/');
    console.error('2. 下载 ffmpeg.zip');
    console.error('3. 解压到项目的 bin/ 目录');
    console.error('4. 运行: chmod +x bin/ffmpeg\n');
    process.exit(1);
  }
})();
