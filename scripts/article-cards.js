'use strict';

function stripHtml(value) {
  return String(value || '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
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
