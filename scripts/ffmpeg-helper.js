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
    // 方法1: 尝试使用项目本地的FFmpeg (bin/ffmpeg 或 bin/ffmpeg.exe)
    {
      name: '项目本地FFmpeg',
      check: () => {
        try {
          // Windows使用ffmpeg.exe，其他系统使用ffmpeg
          const ffmpegBinary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
          const localFFmpegPath = path.join(__dirname, '..', 'bin', ffmpegBinary);

          if (!fs.existsSync(localFFmpegPath)) {
            return { success: false, error: '项目bin目录中没有FFmpeg' };
          }

          // 检查执行权限
          try {
            fs.accessSync(localFFmpegPath, fs.constants.X_OK);
          } catch (permError) {
            try {
              fs.chmodSync(localFFmpegPath, 0o755);
              console.log('✓ 已自动添加FFmpeg执行权限');
            } catch (chmodError) {
              return { success: false, error: '无权限执行本地FFmpeg' };
            }
          }

          // 验证可执行
          try {
            execSync(`"${localFFmpegPath}" -version`, { stdio: 'pipe' });
            ffmpeg.setFfmpegPath(localFFmpegPath);
            return { success: true, path: localFFmpegPath };
          } catch (execError) {
            return { success: false, error: '本地FFmpeg无法执行' };
          }
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    },

    // 方法2: 尝试使用ffmpeg-static
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
  console.error('请按照以下步骤手动安装FFmpeg：\n');

  // 检测操作系统
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS
    console.error('macOS安装方法：\n');
    console.error('方法1: 手动下载到项目目录 (推荐，支持所有macOS版本)');
    console.error('  1. 访问: https://evermeet.cx/ffmpeg/');
    console.error('  2. 下载 ffmpeg.zip');
    console.error('  3. 解压到项目的 bin/ 目录');
    console.error('  4. 运行: chmod +x bin/ffmpeg\n');
    console.error('方法2: 使用Homebrew');
    console.error('  brew install ffmpeg');
    console.error('  (注意: macOS Sequoia可能不支持)\n');
  } else if (platform === 'win32') {
    // Windows
    console.error('Windows安装方法：\n');
    console.error('方法1: 手动下载到项目目录 (推荐)');
    console.error('  1. 访问: https://www.gyan.dev/ffmpeg/builds/');
    console.error('  2. 下载 ffmpeg-release-essentials.zip');
    console.error('  3. 解压后，将 bin/ffmpeg.exe 复制到项目的 bin/ 目录\n');
    console.error('方法2: 添加到系统PATH');
    console.error('  1. 访问: https://ffmpeg.org/download.html#build-windows');
    console.error('  2. 下载并解压');
    console.error('  3. 将 ffmpeg.exe 所在目录添加到系统 PATH\n');
  } else {
    // Linux等其他系统
    console.error('Linux安装方法：\n');
    console.error('使用包管理器安装:');
    console.error('  sudo apt-get install ffmpeg  # Ubuntu/Debian');
    console.error('  sudo yum install ffmpeg      # CentOS/RHEL');
    console.error('  sudo pacman -S ffmpeg        # Arch Linux\n');
  }

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
