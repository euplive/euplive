/**
 * 图标生成脚本
 * 运行: node scripts/generate-icons.js
 *
 * 需要先安装依赖: npm install sharp
 * 或直接使用在线工具: https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

// 这里只是一个占位脚本
// 推荐使用 https://realfavicongenerator.net/ 在线生成
// 上传一张 512x512 的图片即可生成所有尺寸的图标

console.log('请使用在线工具生成图标:');
console.log('1. 访问 https://realfavicongenerator.net/');
console.log('2. 上传一张 512x512 的图片');
console.log('3. 下载生成的文件');
console.log('4. 解压到 public/icons/ 目录');
console.log('');
console.log('需要的图标尺寸:');
console.log('- 72x72 (Android)');
console.log('- 96x96');
console.log('- 128x128');
console.log('- 144x144 (Android)');
console.log('- 152x152 (iPad)');
console.log('- 192x192 (Android)');
console.log('- 384x384');
console.log('- 512x512 (主要)');
console.log('- apple-touch-icon.png (180x180 for iOS)');
