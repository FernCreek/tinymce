configure({
  configs: [
    './prod.js'
  ],
  sources: [
    source('amd', 'tinymce.nativemodern.Demo', '../../src/demo/js', mapper.hierarchical)
  ]
});
