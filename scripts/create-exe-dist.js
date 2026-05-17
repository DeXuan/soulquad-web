// SoulQuad EXE Distribution Creator
// Creates a distributable package with standalone EXE

import { copyFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'release', 'SoulQuad-EXE');

console.log('===========================================');
console.log('  SoulQuad EXE 打包脚本');
console.log('===========================================\n');

// Clean release directory
if (existsSync(distDir)) {
  console.log('[信息] 清理旧文件...');
  rmSync(distDir, { recursive: true });
}

console.log('[信息] 创建发布目录...');
mkdirSync(distDir, { recursive: true });

// Copy the standalone EXE
console.log('[信息] 复制可执行文件...');
const exePath = join(rootDir, 'release', 'soulquad.exe');
if (existsSync(exePath)) {
  copyFileSync(exePath, join(distDir, 'soulquad.exe'));
} else {
  console.log('[警告] 未找到 soulquad.exe，请先运行 npx pkg dist-server/index.js');
}

// Copy built frontend
console.log('[信息] 复制前端文件...');
const frontendDist = join(rootDir, 'dist');
if (existsSync(frontendDist)) {
  cpSync(frontendDist, join(distDir, 'dist'), { recursive: true });
}

// Copy database (if exists)
console.log('[信息] 复制数据库...');
const dbPath = join(rootDir, 'server', 'db');
if (existsSync(dbPath)) {
  cpSync(dbPath, join(distDir, 'server', 'db'), { recursive: true });
}

// Copy launcher scripts
console.log('[信息] 复制启动脚本...');
copyFileSync(join(rootDir, '启动SoulQuad.bat'), join(distDir, '启动SoulQuad.bat'));

console.log('\n===========================================');
console.log('  打包完成！');
console.log('===========================================\n');
console.log('发布目录: release/SoulQuad-EXE');
console.log('\n使用方法:');
console.log('  1. 双击 soulquad.exe');
console.log('  2. 或双击 启动SoulQuad.bat');
console.log('  3. 浏览器访问 http://localhost:3001\n');