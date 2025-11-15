#!/bin/bash

# FFmpeg自动安装脚本 for macOS Sequoia
# 当Homebrew不支持时使用

echo "🔧 FFmpeg自动安装工具"
echo "===================="
echo ""

# 检测操作系统
OS="$(uname -s)"
ARCH="$(uname -m)"

echo "系统信息:"
echo "  OS: $OS"
echo "  架构: $ARCH"
echo ""

# macOS特定处理
if [ "$OS" = "Darwin" ]; then
    echo "检测到macOS系统"
    echo ""

    # 方法1: 尝试更新Homebrew
    echo "方法1: 尝试更新Homebrew..."
    if command -v brew &> /dev/null; then
        echo "正在更新Homebrew..."
        brew update 2>&1 | head -5
        echo ""
        echo "尝试安装FFmpeg..."
        if brew install ffmpeg 2>&1 | grep -q "Error"; then
            echo "❌ Homebrew安装失败"
            echo ""
        else
            echo "✅ 通过Homebrew安装成功！"
            ffmpeg -version | head -1
            exit 0
        fi
    else
        echo "Homebrew未安装"
        echo ""
    fi

    # 方法2: 下载预编译的FFmpeg二进制文件
    echo "方法2: 下载预编译的FFmpeg二进制文件..."
    echo ""

    FFMPEG_DIR="$HOME/.local/bin"
    mkdir -p "$FFMPEG_DIR"

    # 根据架构选择下载链接
    if [ "$ARCH" = "arm64" ]; then
        echo "检测到Apple Silicon (M1/M2/M3)"
        DOWNLOAD_URL="https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
    else
        echo "检测到Intel处理器"
        DOWNLOAD_URL="https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
    fi

    echo "下载地址: $DOWNLOAD_URL"
    echo "安装目录: $FFMPEG_DIR"
    echo ""

    # 下载FFmpeg
    echo "开始下载FFmpeg..."
    TEMP_ZIP="/tmp/ffmpeg.zip"

    if command -v curl &> /dev/null; then
        curl -L -o "$TEMP_ZIP" "$DOWNLOAD_URL"
    elif command -v wget &> /dev/null; then
        wget -O "$TEMP_ZIP" "$DOWNLOAD_URL"
    else
        echo "❌ 错误: 系统没有curl或wget命令"
        echo "请手动下载FFmpeg"
        exit 1
    fi

    if [ ! -f "$TEMP_ZIP" ]; then
        echo "❌ 下载失败"
        exit 1
    fi

    echo "✓ 下载完成"
    echo ""

    # 解压
    echo "正在解压..."
    unzip -o "$TEMP_ZIP" -d "$FFMPEG_DIR"
    chmod +x "$FFMPEG_DIR/ffmpeg"

    # 清理
    rm "$TEMP_ZIP"

    echo "✓ 安装完成"
    echo ""

    # 添加到PATH（如果还没有）
    SHELL_RC="$HOME/.zshrc"
    if [ -f "$HOME/.bash_profile" ]; then
        SHELL_RC="$HOME/.bash_profile"
    fi

    if ! grep -q "$FFMPEG_DIR" "$SHELL_RC" 2>/dev/null; then
        echo "正在添加到PATH..."
        echo "" >> "$SHELL_RC"
        echo "# FFmpeg" >> "$SHELL_RC"
        echo "export PATH=\"$FFMPEG_DIR:\$PATH\"" >> "$SHELL_RC"
        echo "✓ 已添加到 $SHELL_RC"
        echo ""
        echo "⚠️  请运行以下命令使PATH生效:"
        echo "    source $SHELL_RC"
        echo ""
        echo "或者重新打开终端窗口"
    fi

    # 验证安装
    echo "===================="
    echo "验证安装..."
    if "$FFMPEG_DIR/ffmpeg" -version &> /dev/null; then
        echo "✅ FFmpeg安装成功！"
        echo ""
        "$FFMPEG_DIR/ffmpeg" -version | head -1
        echo ""
        echo "FFmpeg路径: $FFMPEG_DIR/ffmpeg"
    else
        echo "❌ 安装失败"
        exit 1
    fi

else
    echo "❌ 此脚本仅支持macOS"
    echo "对于其他系统，请访问: https://ffmpeg.org/download.html"
    exit 1
fi

echo ""
echo "===================="
echo "🎉 安装完成！"
echo ""
echo "现在可以运行转换脚本了："
echo "  node scripts/gif-to-split-mp4.js input.gif output.mp4"
