'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const bannerSections = ['index', 'post', 'archive', 'category', 'tag', 'about', 'page', 'page404'];

function getPhotos() {
  const photoDirectory = path.join(hexo.base_dir, 'photos');
  if (!fs.existsSync(photoDirectory)) return [];

  return fs.readdirSync(photoDirectory)
    .filter(function (file) {
      const fullPath = path.join(photoDirectory, file);
      return fs.statSync(fullPath).isFile() && imageExtensions.has(path.extname(file).toLowerCase());
    })
    .sort()
    .map(function (file) {
      const extension = path.extname(file).toLowerCase();
      const id = crypto.createHash('sha1').update(file).digest('hex').slice(0, 12);
      return {
        source: path.join(photoDirectory, file),
        publicName: 'photo-' + id + extension
      };
    });
}

hexo.extend.filter.register('before_generate', function () {
  const photos = getPhotos();
  if (!photos.length || !hexo.theme || !hexo.theme.config) return;

  const fallback = '/img/random/' + photos[0].publicName;
  bannerSections.forEach(function (section) {
    if (hexo.theme.config[section]) hexo.theme.config[section].banner_img = fallback;
  });
});

hexo.extend.generator.register('photo-backgrounds', function () {
  const photos = getPhotos();
  const routes = photos.map(function (photo) {
    return {
      path: 'img/random/' + photo.publicName,
      data: function () { return fs.createReadStream(photo.source); }
    };
  });

  routes.push({
    path: 'backgrounds.json',
    data: JSON.stringify(photos.map(function (photo) { return '/img/random/' + photo.publicName; })),
    layout: false
  });

  return routes;
});
