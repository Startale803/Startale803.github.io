---
title: 题们
subtitle: 题们
layout: page
comments: false
---

<div id="problem-library" class="problem-library">
  <div class="problem-toolbar">
    <label class="problem-search" for="problem-search">
      <i class="iconfont icon-search" aria-hidden="true"></i>
      <input id="problem-search" type="search" autocomplete="off" placeholder="搜索题目编号或名称" aria-label="搜索题目编号或名称">
    </label>
    <button id="open-problem-filter" class="problem-filter-button" type="button">
      <i class="iconfont icon-category" aria-hidden="true"></i>
      <span>算法筛选</span>
      <span class="filter-count" aria-hidden="true"></span>
    </button>
    <a class="problem-manage-button" href="/addproblem/">
      <i class="iconfont icon-edit" aria-hidden="true"></i>
      <span>添加 / 管理题目</span>
    </a>
  </div>
  <div id="problem-selected-tags" class="problem-selected-tags" hidden></div>
  <div class="problem-list-heading">
    <span>题目</span>
    <span id="problem-result-count">正在加载...</span>
  </div>
  <div id="problem-list" class="problem-list"></div>
  <div id="problem-empty" class="problem-empty" hidden>没有符合条件的题目</div>
</div>

<div id="problem-filter-modal" class="problem-filter-modal" hidden>
  <button class="problem-filter-backdrop" type="button" data-close-filter aria-label="关闭筛选"></button>
  <section class="problem-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="problem-filter-title" tabindex="-1">
    <header class="problem-filter-header">
      <h2 id="problem-filter-title">算法筛选</h2>
      <button class="problem-filter-close" type="button" data-close-filter aria-label="关闭" title="关闭">×</button>
    </header>
    <div class="algorithm-search-box">
      <input id="algorithm-search" type="search" autocomplete="off" placeholder="搜索算法，例如 构造 或 FT" aria-label="搜索算法">
    </div>
    <div class="filter-selected-section">
      <div class="filter-selected-label">已选算法</div>
      <span class="filter-selected-placeholder">尚未选择</span>
      <div id="filter-selected-tags" class="filter-selected-tags"></div>
    </div>
    <div class="problem-filter-body">
      <nav id="algorithm-categories" class="algorithm-categories" aria-label="算法大类"></nav>
      <div id="algorithm-options" class="algorithm-options"></div>
    </div>
    <footer class="problem-filter-footer">
      <button id="clear-problem-filter" class="problem-filter-clear" type="button">清空</button>
      <button id="apply-problem-filter" class="problem-filter-apply" type="button">确定</button>
    </footer>
  </section>
</div>
