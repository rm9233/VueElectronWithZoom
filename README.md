Mac 打包<br />
第一步 ：修改  package-mac.json 为 package.json <br />
第二步： 安装 npm install <br />
第三步： npm run postinstallWithMac (copy zoom原生库到 nodemodule中)<br />
第四步： npm run dev:mac <br />

打包：     npm run build:mac

windows 打包<br />
第一步 ：修改  package-windows.json 为 package.json <br />
第二步： 安装 npm install <br />
第三步： copy static 到 dist/electron 文件目录下<br />
第四步： npm run dev:windows<br />

打包：    npm run build:windows<br />
