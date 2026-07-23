(function () {
  // 仅在文章(archives)页生效
  if (!/\/archives\/?$/.test(window.location.pathname)) return;

  // 注入样式
  var style = document.createElement('style');
  style.textContent = `
    .list-group { border: 1px solid #eaecef; border-radius: 8px; overflow: hidden; }
    .list-group-item {
      display: flex !important; align-items: center; gap: 16px;
      padding: 14px 20px !important; border-left: none !important; border-right: none !important;
      transition: background .2s;
    }
    .list-group-item:first-child { border-top: none !important; }
    .list-group-item:last-child { border-bottom: none !important; }
    .list-group-item:hover { background: #f8f9fa; }
    .list-group-item time {
      min-width: 50px; font-size: 14px; color: #718096; font-weight: 500;
    }
    .list-group-item .list-group-item-title {
      font-size: 15px; font-weight: 500; color: #2f4154;
    }
    .list-group-item:hover .list-group-item-title { color: #0366d6; }
    .list-group .h5 {
      padding: 12px 20px 4px; margin: 0; font-size: 16px; color: #2f4154;
    }
  `;
  document.head.appendChild(style);

  // 添加文章按钮
  var btn = document.createElement('a');
  btn.href = '/admin/';
  btn.target = '_blank';
  btn.className = 'btn btn-primary';
  btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-bottom:16px;padding:10px 22px;background:#2f4154;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500';
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z"/></svg> 添加文章';

  var list = document.querySelector('.list-group');
  if (list) {
    list.parentNode.insertBefore(btn, list);
  }
})();
