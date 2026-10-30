# 初始设计（2026-10-30）

- domain：Shape / NumericShape / 六种类型与 Document，负责不变量和多态。
- application：Command、快照历史、Editor；一次成功编辑对应一个历史单元。
- ports：文件读写与 SVG 编解码接口。
- infrastructure：Node 文件系统和 SAX SVG 编解码。
- cli：双引号词法分析、命令注册分派和 REPL。
- composition：main.ts 装配，依赖朝向领域和接口。

决策：Command + Composite + Memento；先保证事务性，再加入命令和 IO。
图形类型工厂与命令注册表是两处按名字分派，后续阶段再改为 provider 插件注册。
测试目标：六种图形、树操作、错误原子性、撤销边界、SVG 往返和脚本。
