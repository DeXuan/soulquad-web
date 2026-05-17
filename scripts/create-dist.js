// SoulQuad Distribution Creator
// Creates a distributable package with all dependencies

import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'release', 'SoulQuad');

console.log('===========================================');
console.log('  SoulQuad 打包脚本');
console.log('===========================================\n');

// Clean release directory
if (existsSync(distDir)) {
  console.log('[信息] 清理旧文件...');
  rmSync(distDir, { recursive: true });
}

console.log('[信息] 创建发布目录...');
mkdirSync(distDir, { recursive: true });

// Copy built frontend
console.log('[信息] 复制前端文件...');
const frontendDist = join(rootDir, 'dist');
copyDir(frontendDist, join(distDir, 'dist'));

// Copy server
console.log('[信息] 复制服务端文件...');
copyDir(join(rootDir, 'server'), join(distDir, 'server'));

// Copy package files
console.log('[信息] 复制配置文件...');
copyFileSync(join(rootDir, 'package.json'), join(distDir, 'package.json'));
copyFileSync(join(rootDir, '启动SoulQuad.bat'), join(distDir, '启动SoulQuad.bat'));

// Create node_modules links (we need to recreate it in target machine)
// For Windows distribution, we'll include package-lock to help npm ci
console.log('[信息] 复制依赖清单...');
copyFileSync(join(rootDir, 'package-lock.json'), join(distDir, 'package-lock.json'));

console.log('\n===========================================');
console.log('  打包完成！');
console.log('===========================================\n');
console.log('发布目录: release/SoulQuad');
console.log('\n在目标机器上运行:');
console.log('  1. 解压到目标文件夹');
console.log('  2. 双击运行 启动SoulQuad.bat');
console.log('  或运行: npm install && npm run server\n');

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}