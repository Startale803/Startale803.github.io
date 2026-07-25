'use strict';

const fs = require('fs');
const path = require('path');

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

hexo.extend.generator.register('photo-backgrounds', function () {
  const photoDirectory = path.join(hexo.base_dir, 'photos');
  if (!fs.existsSync(photoDirectory)) return [];

  const files = fs.readdirSync(photoDirectory)
    .filter(function (file) {
      const fullPath = path.join(photoDirectory, file);
      return fs.statSync(fullPath).isFile() && imageExtensions.has(path.extname(file).toLowerCase());
    })
    .sort();

  const routes = files.map(function (file) {
    const fullPath = path.join(photoDirectory, file);
    return {
      path: 'img/random/' + file,
      data: function () { return fs.createReadStream(fullPath); }
    };
  });

  routes.push({
    path: 'backgrounds.json',
    data: JSON.stringify(files.map(function (file) { return '/img/random/' + file; })),
    layout: false
  });

  return routes;
});
