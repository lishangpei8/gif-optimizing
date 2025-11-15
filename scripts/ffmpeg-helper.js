/**
 * FFmpeg辅助工具 - 智能检测并配置FFmpeg
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 检测并设置可用的FFmpeg
 * @param {Object} ffmpeg - fluent-ffmpeg实例
 * @returns {Object} - { success: boolean, method: string, path: string }
 */
function setupFFmpeg(ffmpeg) {
  const methods = [
    // 方法1: 尝试使用ffmpeg-static
    {
      name: 'ffmpeg-static',
      check: () => {
        try {
          const ffmpegPath = require('ffmpeg-static');

          // 检查文件是否存在
          if (!fs.existsSync(ffmpegPath)) {
            return { success: false, error: 'FFmpeg文件不存在' };
          }

          // 检查文件权限
          try {
            fs.accessSync(ffmpegPath, fs.constants.X_OK);
          } catch (permError) {
            // 尝试添加执行权限
            try {
              fs.chmodSync(ffmpegPath, 0o755);
              console.log('✓ 已自动添加FFmpeg执行权限');
            } catch (chmodError) {
              return {
                success: false,
                error: `无权限执行: ${ffmpegPath}\n请运行: chmod +x ${ffmpegPath}`
              };
            }
          }

          // 尝试执行FFmpeg验证
          try {
            execSync(`"${ffmpegPath}" -version`, { stdio: 'pipe' });
            ffmpeg.setFfmpegPath(ffmpegPath);
            return { success: true, path: ffmpegPath };
          } catch (execError) {
            return {
              success: false,
              error: `FFmpeg无法执行: ${execError.message}`
            };
          }
        } catch (e) {
          return { success: false, error: 'ffmpeg-static未安装' };
        }
      }
    },

    // 方法2: 尝试使用系统FFmpeg
    {
      name: '系统FFmpeg',
      check: () => {
        try {
          // 尝试执行系统FFmpeg
          const output = execSync('ffmpeg -version', {
            stdio: 'pipe',
            encoding: 'utf8'
          });

          // 成功！使用系统FFmpeg（fluent-ffmpeg默认行为）
          return { success: true, path: 'ffmpeg (系统)' };
        } catch (e) {
          return { success: false, error: '系统FFmpeg未安装或不在PATH中' };
        }
      }
    },

    // 方法3: 尝试使用常见的FFmpeg安装路径
    {
      name: 'Homebrew FFmpeg (macOS)',
      check: () => {
        const commonPaths = [
          '/usr/local/bin/ffmpeg',
          '/opt/homebrew/bin/ffmpeg',
          '/usr/bin/ffmpeg',
          '/opt/local/bin/ffmpeg'
        ];

        for (const ffmpegPath of commonPaths) {
          try {
            if (fs.existsSync(ffmpegPath)) {
              execSync(`"${ffmpegPath}" -version`, { stdio: 'pipe' });
              ffmpeg.setFfmpegPath(ffmpegPath);
              return { success: true, path: ffmpegPath };
            }
          } catch (e) {
            // 继续尝试下一个路径
          }
        }

        return { success: false, error: '未找到Homebrew安装的FFmpeg' };
      }
    }
  ];

  // 依次尝试各种方法
  for (const method of methods) {
    const result = method.check();
    if (result.success) {
      console.log(`✓ 使用 ${method.name}: ${result.path}`);
      return { success: true, method: method.name, path: result.path };
    }
  }

  // 所有方法都失败了
  console.error('\n❌ 无法找到可用的FFmpeg！\n');
  console.error('请选择以下任一方式安装FFmpeg：\n');
  console.error('方法1: 使用Homebrew (macOS推荐)');
  console.error('  brew install ffmpeg\n');
  console.error('方法2: 重新安装ffmpeg-static');
  console.error('  npm install ffmpeg-static --force\n');
  console.error('方法3: 手动下载FFmpeg');
  console.error('  访问: https://ffmpeg.org/download.html\n');

  return {
    success: false,
    error: '未找到可用的FFmpeg'
  };
}

/**
 * 验证FFmpeg是否可用
 * @returns {boolean}
 */
function verifyFFmpeg() {
  const { execSync } = require('child_process');

  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    try {
      const ffmpegPath = require('ffmpeg-static');
      execSync(`"${ffmpegPath}" -version`, { stdio: 'pipe' });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

module.exports = {
  setupFFmpeg,
  verifyFFmpeg
};
