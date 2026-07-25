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
    fetch('/backgrounds.json')
      .then(function (response) {
        if (!response.ok) throw new Error('背景图片清单加载失败');
        return response.json();
      })
      .then(function (backgrounds) {
        if (!backgrounds.length) return;
        var selected = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        banner.style.backgroundImage = 'url("' + selected + '")';
        banner.style.backgroundPosition = 'center center';
        banner.style.backgroundSize = 'cover';
      })
      .catch(function (error) {
        console.error(error);
      });
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

    function renderAlgorithms() {
      var category = data.categories.find(function (item) { return item.id === activeCategory; });
      algorithmList.innerHTML = '';
      category.algorithms.forEach(function (algorithm) {
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
        text.textContent = algorithm.name;
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
  initArchive();
  initProblems();
})();
