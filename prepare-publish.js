// prepare-publish.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


// 读取原始 package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'npm-dist');
const LIB_DIR = path.join(__dirname, 'lib');
if (fs.existsSync(DIST_DIR)) {
	fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);

// 构造一个最小化的 package.json
const minimal = {
	...pkg
};
minimal.devDependencies = {};
minimal.scripts = {}

// 写入到 npm-dist/
fs.writeFileSync(
	'./npm-dist/package.json',
	JSON.stringify(minimal, null, 2),
	'utf-8'
);
// 复制文件
for (const file of ['README.md', 'LICENSE','.npmrc']) {
	const src = path.join(__dirname, file);
	const dest = path.join(DIST_DIR, file);
	if (fs.existsSync(src)) {
		fs.copyFileSync(src, dest);
	}
}
// 复制 lib 文件夹内容到 npm-dist/lib
const copyDir = (src, dest) => {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src)) {
		const srcPath = path.join(src, entry);
		const destPath = path.join(dest, entry);
		const stat = fs.statSync(srcPath);
		if (stat.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
};
copyDir(LIB_DIR, path.join(DIST_DIR, 'lib'));
