'use strict';

function stripHtml(value) {
  var withoutNonPreviewContent = String(value || '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/(?<!\\)\$[^$\n]+\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ');

  // Decode all named and numeric entities without maintaining a partial entity table.
  return withoutNonPreviewContent
    .replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, function (entity, code) {
      if (code.charAt(0) !== '#') return entity;
      var value = code.charAt(1).toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      try { return String.fromCodePoint(value); } catch (error) { return entity; }
    })
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstImage(post) {
  if (post.cover) return post.cover;
  if (post.index_img) return post.index_img;
  var match = String(post.content || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

hexo.extend.generator.register('article-cards', function (locals) {
  var articles = locals.posts.sort('-date').map(function (post) {
    var excerpt = post.description || post.excerpt || post.content;
    return {
      path: '/' + post.path.replace(/^\/+/, ''),
      title: post.title,
      excerpt: stripHtml(excerpt).slice(0, 240),
      image: firstImage(post)
    };
  });

  return {
    path: 'article-cards.json',
    data: JSON.stringify(articles),
    layout: false
  };
});
