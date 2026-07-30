(function () {
  'use strict';

  function normalizePath(value) {
    try {
      var path = new URL(value, window.location.origin).pathname;
      return path.endsWith('/') ? path : path + '/';
    } catch (error) {
      return value;
    }
  }

  function initRandomBanner() {
    var banner = document.getElementById('banner');
    if (!banner) return;

    var storageKey = 'startale-banner-image';
    var remembered = '';
    try {
      remembered = window.localStorage.getItem(storageKey) || '';
    } catch (error) {
      // Storage can be unavailable in private browsing; the static fallback still works.
    }

    function applyWhenReady(imageUrl, remember) {
      if (!imageUrl) return;
      var image = new Image();
      image.onload = function () {
        banner.style.backgroundImage = 'url("' + imageUrl + '")';
        banner.style.backgroundPosition = 'center center';
        banner.style.backgroundSize = 'cover';
        if (remember) {
          try { window.localStorage.setItem(storageKey, imageUrl); } catch (error) { /* Ignore unavailable storage. */ }
        }
      };
      image.src = imageUrl;
    }

    applyWhenReady(remembered, false);
    fetch('/backgrounds.json')
      .then(function (response) {
        if (!response.ok) throw new Error('背景图片清单加载失败');
        return response.json();
      })
      .then(function (backgrounds) {
        if (!backgrounds.length) return;
        var selected = remembered && backgrounds.indexOf(remembered) !== -1 ? remembered : backgrounds[Math.floor(Math.random() * backgrounds.length)];
        applyWhenReady(selected, true);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function initBannerEffects() {
    var banner = document.getElementById('banner');
    if (!banner || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;

    var mask = banner.querySelector('.mask');
    if (!mask) return;
    var effects = document.createElement('div');
    effects.className = 'banner-effects';
    effects.setAttribute('aria-hidden', 'true');
    mask.insertBefore(effects, mask.firstChild);

    var canvas = document.createElement('canvas');
    canvas.className = 'banner-particles';
    canvas.setAttribute('aria-hidden', 'true');
    effects.appendChild(canvas);
    var context = canvas.getContext('2d');
    var particles = [];
    var pointer = { x: 0, y: 0 };
    var frame;

    function resize() {
      var bounds = banner.getBoundingClientRect();
      var scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * scale));
      canvas.height = Math.max(1, Math.round(bounds.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      particles = Array.from({ length: Math.min(42, Math.max(20, Math.round(bounds.width / 38))) }, function () {
        return { x: Math.random() * bounds.width, y: Math.random() * bounds.height, radius: 0.7 + Math.random() * 1.7, speed: 0.08 + Math.random() * 0.22, phase: Math.random() * Math.PI * 2 };
      });
    }

    function draw(time) {
      var bounds = banner.getBoundingClientRect();
      context.clearRect(0, 0, bounds.width, bounds.height);
      particles.forEach(function (particle) {
        particle.y -= particle.speed;
        if (particle.y < -4) particle.y = bounds.height + 4;
        var drift = Math.sin(time / 1800 + particle.phase) * 8;
        var distance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
        var alpha = distance < 105 ? 0.32 : 0.16;
        context.beginPath();
        context.fillStyle = 'rgba(219, 243, 255, ' + alpha + ')';
        context.arc(particle.x + drift, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      frame = window.requestAnimationFrame(draw);
    }

    banner.addEventListener('pointermove', function (event) {
      var bounds = banner.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      banner.style.setProperty('--banner-pointer-x', pointer.x + 'px');
      banner.style.setProperty('--banner-pointer-y', pointer.y + 'px');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) window.cancelAnimationFrame(frame);
      else frame = window.requestAnimationFrame(draw);
    });
    window.addEventListener('resize', resize, { passive: true });
    resize();
    frame = window.requestAnimationFrame(draw);
  }

  function initArchive() {
    if (!/^\/archives(?:\/|$)/.test(window.location.pathname)) return;

    var list = document.querySelector('.list-group');
    if (!list) return;

    var button = document.createElement('a');
    button.href = '/admin/';
    button.target = '_blank';
    button.rel = 'noopener';
    button.className = 'archive-add-button';
    button.innerHTML = '<span aria-hidden="true">＋</span><span>添加文章</span>';
    list.parentNode.insertBefore(button, list);

    fetch('/article-cards.json')
      .then(function (response) {
        if (!response.ok) throw new Error('文章索引加载失败');
        return response.json();
      })
      .then(function (articles) {
        var byPath = new Map(articles.map(function (article) {
          return [normalizePath(article.path), article];
        }));

        list.querySelectorAll('.list-group-item').forEach(function (item) {
          var article = byPath.get(normalizePath(item.href));
          if (!article) return;

          var title = item.querySelector('.list-group-item-title');
          var main = document.createElement('div');
          main.className = 'archive-card-main';
          title.parentNode.insertBefore(main, title);
          main.appendChild(title);

          var excerpt = document.createElement('div');
          excerpt.className = 'archive-card-excerpt';
          excerpt.textContent = article.excerpt || '暂无摘要';
          main.appendChild(excerpt);

          if (article.image) {
            var media = document.createElement('div');
            media.className = 'archive-card-media';
            var image = document.createElement('img');
            image.src = article.image;
            image.alt = article.title + ' 的封面';
            image.loading = 'lazy';
            media.appendChild(image);
            item.appendChild(media);
          } else {
            item.classList.add('archive-card-no-image');
          }
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function initProblems() {
    var root = document.getElementById('problem-library');
    if (!root) return;

    var searchInput = root.querySelector('#problem-search');
    var filterButton = root.querySelector('#open-problem-filter');
    var resultCount = root.querySelector('#problem-result-count');
    var selectedBar = root.querySelector('#problem-selected-tags');
    var list = root.querySelector('#problem-list');
    var empty = root.querySelector('#problem-empty');
    var modal = document.getElementById('problem-filter-modal');
    var categoryList = modal.querySelector('#algorithm-categories');
    var algorithmList = modal.querySelector('#algorithm-options');
    var algorithmSearch = modal.querySelector('#algorithm-search');
    var draftBar = modal.querySelector('#filter-selected-tags');
    var applyButton = modal.querySelector('#apply-problem-filter');
    var clearButton = modal.querySelector('#clear-problem-filter');
    var closeButtons = modal.querySelectorAll('[data-close-filter]');
    var data = null;
    var activeCategory = '';
    var selected = new Set();
    var draft = new Set();

    function algorithmMap() {
      var result = new Map();
      data.categories.forEach(function (category) {
        category.algorithms.forEach(function (algorithm) {
          result.set(algorithm.id, algorithm.name);
        });
      });
      return result;
    }

    function makeTag(id, removable, onRemove) {
      var names = algorithmMap();
      var tag = document.createElement(removable ? 'button' : 'span');
      tag.className = 'problem-tag' + (removable ? ' problem-tag-removable' : '');
      tag.textContent = names.get(id) || id;
      if (removable) {
        tag.type = 'button';
        tag.setAttribute('aria-label', '删除筛选条件 ' + tag.textContent);
        tag.title = '删除';
        tag.addEventListener('click', function () { onRemove(id); });
      }
      return tag;
    }

    function ratingOf(problem) {
      if (typeof problem.rating === 'number' && problem.rating >= 0 && problem.rating <= 6) {
        return Math.round(problem.rating * 2) / 2;
      }
      var hash = 0;
      for (var index = 0; index < problem.id.length; index += 1) {
        hash = ((hash * 31) + problem.id.charCodeAt(index)) >>> 0;
      }
      return ((hash % 12) + 1) / 2;
    }

    function makeRating(rating) {
      var element = document.createElement('span');
      element.className = 'problem-rating';
      element.setAttribute('aria-label', '靓仔度 ' + rating + ' / 6 星');
      element.title = '靓仔度 ' + rating + ' / 6 星';
      for (var star = 1; star <= 6; star += 1) {
        var fill = Math.max(0, Math.min(1, rating - star + 1));
        var item = document.createElement('span');
        item.className = 'problem-star' + (fill === 1 ? ' is-full' : fill === 0.5 ? ' is-half' : '');
        item.textContent = '★';
        element.appendChild(item);
      }
      return element;
    }

    function makeCommentTip(comment) {
      var tip = document.createElement('span');
      tip.className = 'problem-comment-tip';
      tip.tabIndex = 0;
      tip.setAttribute('role', 'note');
      tip.setAttribute('aria-label', '我的评价：' + comment);
      var icon = document.createElement('span');
      icon.className = 'problem-comment-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'i';
      var content = document.createElement('span');
      content.className = 'problem-comment-content';
      content.textContent = comment;
      tip.appendChild(icon);
      tip.appendChild(content);
      return tip;
    }

    function renderSelected() {
      selectedBar.innerHTML = '';
      selected.forEach(function (id) {
        selectedBar.appendChild(makeTag(id, true, function (removed) {
          selected.delete(removed);
          renderSelected();
          renderProblems();
        }));
      });
      selectedBar.hidden = selected.size === 0;
      filterButton.classList.toggle('is-active', selected.size > 0);
      filterButton.querySelector('.filter-count').textContent = selected.size ? String(selected.size) : '';
    }

    function renderProblems() {
      var query = searchInput.value.trim().toLocaleLowerCase();
      var results = data.problems.filter(function (problem) {
        var matchesQuery = !query || problem.id.toLocaleLowerCase().includes(query) ||
          problem.name.toLocaleLowerCase().includes(query);
        var matchesAlgorithms = Array.from(selected).every(function (id) {
          return problem.algorithms.includes(id);
        });
        return matchesQuery && matchesAlgorithms;
      });

      list.innerHTML = '';
      results.forEach(function (problem) {
        var row = document.createElement('article');
        row.className = 'problem-row';
        var identity = document.createElement('div');
        identity.className = 'problem-identity';
        identity.innerHTML = '<a class="problem-id" target="_blank" rel="noopener" href="' + problem.url + '">' +
          problem.id + '</a><a class="problem-name" target="_blank" rel="noopener" href="' + problem.url + '">' +
          problem.name + '</a>';
        var tags = document.createElement('div');
        tags.className = 'problem-tags';
        problem.algorithms.forEach(function (id) { tags.appendChild(makeTag(id, false)); });
        tags.appendChild(makeRating(ratingOf(problem)));
        if (typeof problem.comment === 'string' && problem.comment.trim()) {
          tags.appendChild(makeCommentTip(problem.comment.trim()));
        }
        row.appendChild(identity);
        row.appendChild(tags);
        list.appendChild(row);
      });

      resultCount.textContent = results.length + ' 道题目';
      empty.hidden = results.length > 0;
    }

    function renderDraft() {
      draftBar.innerHTML = '';
      draft.forEach(function (id) {
        draftBar.appendChild(makeTag(id, true, function (removed) {
          draft.delete(removed);
          renderDraft();
          renderAlgorithms();
        }));
      });
      var placeholder = modal.querySelector('.filter-selected-placeholder');
      placeholder.hidden = draft.size > 0;
    }

    function matchesAlgorithm(algorithm, query) {
      var source = (algorithm.id + ' ' + algorithm.name).toLocaleLowerCase();
      var normalized = source.replace(/[\s\-_*/]+/g, '');
      var keyword = query.toLocaleLowerCase().replace(/[\s\-_*/]+/g, '');
      if (!keyword || source.includes(query.toLocaleLowerCase()) || normalized.includes(keyword)) return true;
      var position = 0;
      for (var index = 0; index < keyword.length; index += 1) {
        position = normalized.indexOf(keyword[index], position);
        if (position < 0) return false;
        position += 1;
      }
      return true;
    }

    function renderAlgorithms() {
      var category = data.categories.find(function (item) { return item.id === activeCategory; });
      var query = algorithmSearch.value.trim();
      var algorithms = query ? data.categories.flatMap(function (item) {
        return item.algorithms.map(function (algorithm) {
          return { algorithm: algorithm, category: item.name };
        });
      }).filter(function (item) { return matchesAlgorithm(item.algorithm, query); }) :
        category.algorithms.map(function (algorithm) { return { algorithm: algorithm, category: '' }; });
      algorithmList.innerHTML = '';
      if (!algorithms.length) {
        algorithmList.innerHTML = '<div class="algorithm-search-empty">没有匹配的算法</div>';
        return;
      }
      algorithms.forEach(function (item) {
        var algorithm = item.algorithm;
        var label = document.createElement('label');
        label.className = 'algorithm-option';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = draft.has(algorithm.id);
        checkbox.addEventListener('change', function () {
          if (checkbox.checked) draft.add(algorithm.id);
          else draft.delete(algorithm.id);
          renderDraft();
        });
        var text = document.createElement('span');
        text.textContent = algorithm.name + (item.category ? ' · ' + item.category : '');
        label.appendChild(checkbox);
        label.appendChild(text);
        algorithmList.appendChild(label);
      });
    }

    function renderCategories() {
      categoryList.innerHTML = '';
      data.categories.forEach(function (category) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'algorithm-category';
        button.textContent = category.name;
        button.classList.toggle('is-active', category.id === activeCategory);
        button.addEventListener('click', function () {
          activeCategory = category.id;
          renderCategories();
          renderAlgorithms();
        });
        categoryList.appendChild(button);
      });
    }

    function openModal() {
      draft = new Set(selected);
      algorithmSearch.value = '';
      modal.hidden = false;
      document.body.classList.add('problem-modal-open');
      renderDraft();
      renderCategories();
      renderAlgorithms();
      modal.querySelector('.problem-filter-dialog').focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('problem-modal-open');
      filterButton.focus();
    }

    searchInput.addEventListener('input', renderProblems);
    algorithmSearch.addEventListener('input', renderAlgorithms);
    filterButton.addEventListener('click', openModal);
    closeButtons.forEach(function (button) { button.addEventListener('click', closeModal); });
    clearButton.addEventListener('click', function () {
      draft.clear();
      renderDraft();
      renderAlgorithms();
    });
    applyButton.addEventListener('click', function () {
      selected = new Set(draft);
      renderSelected();
      renderProblems();
      closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });

    fetch('/data/problems.json')
      .then(function (response) {
        if (!response.ok) throw new Error('题目数据加载失败');
        return response.json();
      })
      .then(function (payload) {
        data = payload;
        activeCategory = data.categories[0].id;
        renderSelected();
        renderProblems();
      })
      .catch(function (error) {
        console.error(error);
        empty.hidden = false;
        empty.textContent = '题目数据暂时无法加载';
      });
  }

  initRandomBanner();
  initBannerEffects();
  initArchive();
  initProblems();
})();
