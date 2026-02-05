#!/usr/bin/env node
/**
 * 小程序 CI 脚本
 * 
 * 用法:
 *   node scripts/ci.mjs preview [--desc "描述"]
 *   node scripts/ci.mjs upload <version> [--desc "描述"]
 *   node scripts/ci.mjs pack-npm
 * 
 * 或通过 npm scripts:
 *   npm run ci:preview
 *   npm run ci:upload 1.0.0
 *   npm run ci:pack-npm
 */

import ci from 'miniprogram-ci';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectPath = join(__dirname, '..');

// 配置路径
const CONFIG_PATH = join(projectPath, '.pie-miniprogram/config.json');
const PROJECT_CONFIG_PATH = join(projectPath, 'project.config.json');
const PRIVATE_KEY_PATH = join(projectPath, '.pie-miniprogram/keys/private.key');

// 颜色输出
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
};

// 检查配置
function checkConfig() {
  const errors = [];

  if (!existsSync(PROJECT_CONFIG_PATH)) {
    errors.push('未找到 project.config.json');
  }

  if (!existsSync(CONFIG_PATH)) {
    errors.push('未找到 .pie-miniprogram/config.json');
  }

  if (!existsSync(PRIVATE_KEY_PATH)) {
    errors.push('未找到私钥文件 .pie-miniprogram/keys/private.key');
    errors.push('请从微信公众平台下载代码上传密钥');
  }

  if (errors.length > 0) {
    console.error(colors.red('❌ 配置检查失败:\n'));
    errors.forEach(err => console.error(colors.red(`   - ${err}`)));
    console.error('\n' + colors.gray('提示: 运行 mp_setup 或参考 README.md 配置'));
    process.exit(1);
  }
}

// 读取配置
function loadConfig() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  const projectConfig = JSON.parse(readFileSync(PROJECT_CONFIG_PATH, 'utf-8'));

  return {
    appid: projectConfig.appid,
    robot: config.robot || 1,
    projectName: projectConfig.projectname,
  };
}

// 创建项目实例
function createProject(appid) {
  return new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath,
    privateKeyPath: PRIVATE_KEY_PATH,
  });
}

// 解析命令行参数
function parseArgs(args) {
  const result = { _: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] || true;
      i++;
    } else {
      result._.push(args[i]);
    }
  }
  return result;
}

// 格式化大小
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 命令: preview
async function cmdPreview(args) {
  const config = loadConfig();
  const project = createProject(config.appid);
  const desc = args.desc || `Preview at ${new Date().toLocaleString()}`;

  console.log(colors.blue('🔍 正在生成预览二维码...\n'));

  const result = await ci.preview({
    project,
    version: '0.0.0-preview',
    desc,
    robot: config.robot,
    qrcodeFormat: 'terminal',
    qrcodeOutputDest: join(projectPath, 'preview-qr.png'),
    onProgressUpdate: (info) => {
      if (info._status === 'done') {
        console.log(colors.gray(`   ${info._msg}`));
      }
    },
  });

  console.log('\n' + colors.green('✅ 预览二维码已生成'));
  console.log(colors.gray(`   描述: ${desc}`));
  console.log(colors.gray(`   机器人: #${config.robot}`));
  
  if (result.subPackageInfo) {
    const total = result.subPackageInfo.find(p => p.name === '__FULL__');
    if (total) {
      console.log(colors.gray(`   总大小: ${formatSize(total.size)}`));
    }
  }

  console.log('\n' + colors.yellow('📱 请使用微信扫描上方二维码进行真机测试'));
}

// 命令: upload
async function cmdUpload(args) {
  const version = args._[0];
  
  if (!version) {
    console.error(colors.red('❌ 请提供版本号'));
    console.error(colors.gray('\n用法: npm run ci:upload <version>'));
    console.error(colors.gray('示例: npm run ci:upload 1.0.0'));
    process.exit(1);
  }

  const config = loadConfig();
  const project = createProject(config.appid);
  const desc = args.desc || `Version ${version}`;

  console.log(colors.blue(`📤 正在上传版本 ${version}...\n`));

  const result = await ci.upload({
    project,
    version,
    desc,
    robot: config.robot,
    onProgressUpdate: (info) => {
      if (info._status === 'done') {
        console.log(colors.gray(`   ${info._msg}`));
      }
    },
  });

  console.log('\n' + colors.green('✅ 上传成功'));
  console.log(colors.gray(`   版本: ${version}`));
  console.log(colors.gray(`   描述: ${desc}`));
  console.log(colors.gray(`   机器人: #${config.robot}`));

  if (result.subPackageInfo) {
    const total = result.subPackageInfo.find(p => p.name === '__FULL__');
    const main = result.subPackageInfo.find(p => p.name === '__APP__');
    if (total) console.log(colors.gray(`   总大小: ${formatSize(total.size)}`));
    if (main) console.log(colors.gray(`   主包大小: ${formatSize(main.size)}`));
  }

  console.log('\n' + colors.yellow('🌐 请访问 mp.weixin.qq.com 提交审核'));
}

// 命令: pack-npm
async function cmdPackNpm() {
  const config = loadConfig();
  const project = createProject(config.appid);

  console.log(colors.blue('📦 正在构建 npm...\n'));

  const warnings = await ci.packNpm(project, {});

  if (warnings && warnings.length > 0) {
    console.log(colors.yellow(`⚠️  构建完成，有 ${warnings.length} 个警告:\n`));
    warnings.forEach(w => {
      console.log(colors.yellow(`   - ${w.msg}`));
      if (w.jsPath) {
        console.log(colors.gray(`     ${w.jsPath}:${w.startLine || ''}`));
      }
    });
  } else {
    console.log(colors.green('✅ npm 构建完成，无警告'));
  }
}

// 命令: help
function cmdHelp() {
  console.log(`
${colors.blue('小程序 CI 工具')}

${colors.yellow('用法:')}
  node scripts/ci.mjs <command> [options]

${colors.yellow('命令:')}
  preview [--desc "描述"]     生成预览二维码
  upload <version> [--desc]   上传代码到微信平台
  pack-npm                    构建 npm 依赖
  help                        显示帮助信息

${colors.yellow('npm scripts:')}
  npm run ci:preview          生成预览二维码
  npm run ci:upload 1.0.0     上传版本 1.0.0
  npm run ci:pack-npm         构建 npm

${colors.yellow('配置:')}
  配置文件: .pie-miniprogram/config.json
  私钥文件: .pie-miniprogram/keys/private.key
`);
}

// 主函数
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  args._.shift(); // 移除命令名

  try {
    switch (command) {
      case 'preview':
        checkConfig();
        await cmdPreview(args);
        break;
      case 'upload':
        checkConfig();
        await cmdUpload(args);
        break;
      case 'pack-npm':
        checkConfig();
        await cmdPackNpm();
        break;
      case 'help':
      case '--help':
      case '-h':
        cmdHelp();
        break;
      default:
        if (command) {
          console.error(colors.red(`❌ 未知命令: ${command}\n`));
        }
        cmdHelp();
        process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error(colors.red(`\n❌ 执行失败: ${error.message}`));
    if (error.message.includes('privateKey')) {
      console.error(colors.gray('\n提示: 请确认私钥文件存在且格式正确'));
    }
    process.exit(1);
  }
}

main();
