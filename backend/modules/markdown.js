// modules/markdown.js
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

function renderMarkdown(markdownText) {
  const rawHtml = marked.parse(markdownText || '');

  // sanitize html
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'pre', 'code'
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      code: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank'
      })
    }
  });

  return cleanHtml;
}

module.exports = { renderMarkdown };
