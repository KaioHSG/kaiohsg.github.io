// sequential loader — preserves global scope and load order
(function() {
  var scripts = [
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js',
    'repo-tree/ui.js',
    'repo-tree/config.js',
    'repo-tree/utils.js',
    'repo-tree/renderer.js',
    'repo-tree/api.js',
    'repo-tree/app.js'
  ];
  var i = 0;
  function next() {
    if (i >= scripts.length) return;
    var s = document.createElement('script');
    s.src = scripts[i++];
    s.onload = next;
    document.body.appendChild(s);
  }
  next();
})();