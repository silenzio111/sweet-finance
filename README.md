# SweetFinance

一个以手机体验为中心的本地记账应用。它把收入、支出、储蓄和年度目标放在同一个轻量账本里，支持精简视图、明细视图、分类管理、备份与恢复。

## 特性

- 自定义收入、支出与储蓄分类，按年度查看收支
- 概览、分类和项目层级的拖拽排序
- 汇率、预算与储蓄率计算
- 变动记录、撤销/重做与操作确认
- 导入、导出与本地备份
- React Web 版本与 Capacitor Android 封装

## 开发

需要 Node.js 20 或更新版本。

    npm install
    npm run dev

构建 Web 版本：

    npm run build

同步并运行 Android 工程：

    npm run android:run

## 数据与隐私

账本数据默认保存在设备本地。导出和导入由用户主动触发；请自行妥善保管导出的备份文件。

## 许可证

本项目采用 [MIT License](LICENSE)。

