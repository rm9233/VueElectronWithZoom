Mac 打包
第一步 ：修改  package-mac.json 为 package.json 
第二步： 安装 npm install 
第三步： copy zoom原生库到 nodemodule中 npm run postinstallWithMac
第四步： npm run dev:mac 

打包：     npm run build:mac

windows 打包
第一步 ：修改  package-windows.json 为 package.json 
第二步： 安装 npm install 
第三步： copy static 到 dist/electron 文件目录下
第四步： npm run dev:windows

打包：    npm run build:windows
