#!/usr/bin/env node

/**
 * 修复ffmpeg-static的执行权限问题
 * 适用于macOS/Linux系统
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 正在修复FFmpeg权限...\n');

try {
  // 尝试找到ffmpeg-static的路径
  const ffmpegPath = require('ffmpeg-static');

  console.log(`📍 FFmpeg路径: ${ffmpegPath}`);

  // 检查文件是否存在
  if (!fs.existsSync(ffmpegPath)) {
    console.error('❌ FFmpeg文件不存在！');
    console.log('\n请尝试重新安装：');
    console.log('  npm install ffmpeg-static --force');
    process.exit(1);
  }

  // 获取当前权限
  const stats = fs.statSync(ffmpegPath);
  const currentMode = stats.mode.toString(8).slice(-3);
  console.log(`📋 当前权限: ${currentMode}`);

  // 添加执行权限 (chmod +x)
  // 0o755 = rwxr-xr-x (所有者可读写执行，组和其他人可读执行)
  fs.chmodSync(ffmpegPath, 0o755);

  // 验证权限
  const newStats = fs.statSync(ffmpegPath);
  const newMode = newStats.mode.toString(8).slice(-3);
  console.log(`✅ 新权限: ${newMode}`);

  console.log('\n✨ 权限修复完成！');
  console.log('现在可以运行转换脚本了。\n');

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('❌ ffmpeg-static未安装');
    console.log('\n两种解决方案：');
    console.log('\n方案1: 安装ffmpeg-static');
    console.log('  npm install');
    console.log('\n方案2: 使用系统FFmpeg（推荐）');
    console.log('  brew install ffmpeg        # macOS');
    console.log('  npm install --no-optional  # 只安装必需依赖');
    console.log('\n然后直接运行转换脚本即可。');
  } else {
    console.error('❌ 修复失败:', error.message);
    console.log('\n请手动修复：');
    console.log('  chmod +x node_modules/ffmpeg-static/ffmpeg');
  }
  process.exit(1);
}
