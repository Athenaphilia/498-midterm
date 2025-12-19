// modules/markdown.js
// Handles the comment markdown parsing, as well as cleaning
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

// config for marked
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false
});

// before sending comment to client, pass through this function.
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
