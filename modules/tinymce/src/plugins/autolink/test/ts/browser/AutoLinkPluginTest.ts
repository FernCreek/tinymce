import { Log, Pipeline } from '@ephox/agar';
import { Assert, UnitTest } from '@ephox/bedrock-client';
import { LegacyUnit, TinyLoader } from '@ephox/mcagar';
import Editor from 'tinymce/core/api/Editor';
import Env from 'tinymce/core/api/Env';
import Plugin from 'tinymce/plugins/autolink/Plugin';
import Theme from 'tinymce/themes/silver/Theme';
import * as KeyUtils from '../module/test/KeyUtils';
import fc from 'fast-check';

UnitTest.asynctest('browser.tinymce.plugins.autolink.AutoLinkPluginTest', (success, failure) => {
  const suite = LegacyUnit.createSuite<Editor>();

  Theme();
  Plugin();

  const typeUrl = (editor: Editor, url: string): string => {
    editor.setContent('<p>' + url + '</p>');
    LegacyUnit.setSelection(editor, 'p', url.length);
    KeyUtils.type(editor, ' ');
    return editor.getContent();
  };

  const typeNewlineURL = (editor: Editor, url: string, expectedUrl?: string, withDotAtTheEnd?: boolean): void => {
    const dot = withDotAtTheEnd ? '.' : '';
    editor.setContent('<p>' + url + dot + '</p>');
    LegacyUnit.setSelection(editor, 'p', url.length);
    KeyUtils.type(editor, '\n');
    Assert.eq('Create link with newline', `<p><a href="${expectedUrl || url}">${url}</a></p><p>${withDotAtTheEnd ? '.' : '&nbsp;'}</p>`, editor.getContent());
  };

  const assertNoLink = (editor: Editor, input: string, text?: string): void => {
    Assert.eq('Should not convert to link', `<p>${text || input}&nbsp;</p>`, typeUrl(editor, input));
  };

  const assertIsLink = (editor: Editor, input: string, link: string, withDotAtTheEnd?: boolean, text?: string): void => {
    const dot = withDotAtTheEnd ? '.' : '';
    Assert.eq('Should be convert to link', `<p><a href="${link}">${text || input}</a>${dot}&nbsp;</p>`, typeUrl(editor, (input + dot)));
  };

  const test = (label: string, runTest: (editor: Editor) => void): void => {
    suite.test(label, (editor) => {
      editor.focus();
      runTest(editor);
    });
  };

  test('TestCase-TBA: AutoLink: Correct urls ended with space', (editor) => {
    assertIsLink(editor, 'http://www.domain.com', 'http://www.domain.com/');
    assertIsLink(editor, 'https://www.domain.com', 'https://www.domain.com/');
    assertIsLink(editor, 'ftp://www.domain.com', 'ftp://www.domain.com/');
    assertIsLink(editor, 'www.domain.com', 'http://www.domain.com/');
    assertIsLink(editor, 'www.domain.com', 'http://www.domain.com/', true);
    assertIsLink(editor, 'mailto:user@domain.com', 'mailto:user@domain.com');
  });

  test('TINY-4773: AutoLink: text which should not work', (editor) => {
    assertNoLink(editor, 'first-last@@domain@.@com'); // We only accept one @
    assertNoLink(editor, 'first-last@¶¶KJ@', 'first-last@&para;&para;KJ@'); // Anything goes after the @
    assertNoLink(editor, 'first-last@'); // We only accept one @
  });

  test('TINY-4773: AutoLink: multiple @ characters', (editor) => {
    fc.assert(fc.property(fc.hexaString(0, 30), fc.hexaString(0, 30), fc.hexaString(0, 30), (s1, s2, s3) => {
      assertNoLink(editor, `${s1}@@${s2}@.@${s3}`, `${s1}@@${s2}@.@${s3}`);
    }));
  });

  test('TINY-4773: AutoLink: ending in @ character', (editor) => {
    fc.assert(fc.property(fc.hexaString(0, 100), (s1) => {
      assertNoLink(editor, `${s1}@`, `${s1}@`);
    }));
  });

  test('TestCase-TBA: AutoLink: Urls ended with new line', (editor) => {
    typeNewlineURL(editor, 'http://www.domain.com', 'http://www.domain.com/');
    typeNewlineURL(editor, 'https://www.domain.com', 'https://www.domain.com/');
    typeNewlineURL(editor, 'ftp://www.domain.com', 'ftp://www.domain.com/');
    typeNewlineURL(editor, 'www.domain.com', 'http://www.domain.com/');
    typeNewlineURL(editor, 'www.domain.com', 'http://www.domain.com/', true);
  });

  test('TestCase-TBA: AutoLink: Url inside blank formatting wrapper', (editor) => {
    editor.focus();
    editor.setContent('<p><br></p>');
    editor.selection.setCursorLocation(editor.getBody().firstChild, 0);
    editor.execCommand('Bold');
    // inserting url via typeUrl() results in different behaviour, so lets simply type it in, char by char
    KeyUtils.typeString(editor, 'http://www.domain.com ');
    LegacyUnit.equal(
      editor.getContent(),
      '<p><strong><a href="http://www.domain.com/">http://www.domain.com</a>&nbsp;</strong></p>'
    );
  });

  test('AutoLink: Ending punctuation', (editor) => {
    Assert.eq('Should end with .', `<p><a href="http://www.domain.com/">http://www.domain.com</a>.&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com.'));
    Assert.eq('Should end with ?', `<p><a href="http://www.domain.com/">http://www.domain.com</a>?&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com?'));
    Assert.eq('Should end with !', `<p><a href="http://www.domain.com/">http://www.domain.com</a>!&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com!'));
    Assert.eq('Should end with ,', `<p><a href="http://www.domain.com/">http://www.domain.com</a>,&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com,'));
    Assert.eq('Should end with :', `<p><a href="http://www.domain.com/">http://www.domain.com</a>:&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com:'));
    Assert.eq('Should end with ;', `<p><a href="http://www.domain.com/">http://www.domain.com</a>;&nbsp;</p>`, typeUrl(editor, 'http://www.domain.com;'));
  });

  test('AutoLink: non-basic Urls', (editor) => {
    // Path
    assertIsLink(editor, 'http://domain.com/some/random/path', 'http://domain.com/some/random/path');
    assertIsLink(editor, 'http://domain.com/slash/', 'http://domain.com/slash/'); // // TODO_JA - New bug?

    // Hash
    assertIsLink(editor, 'http://domain.com#withHash', 'http://domain.com/#withHash');
    assertIsLink(editor, 'http://domain.com#!importantHash', 'http://domain.com/#!importantHash'); // TODO_JA - This fails, this is the Whitesource URL bug

    // Query string
    assertIsLink(editor, 'http://domain.com?q=a', 'http://domain.com/?q=a');
    assertIsLink(editor, 'http://domain.com?q=1,2', 'http://domain.com/?q=1,2');
    // Due to how we are verifying results, & characters are being escaped even in the href.
    // In a real editing scenario the & is correctly not being escaped.
    Assert.eq('Should support multiple query parameters.', `<p><a href="http://domain.com/?a=1&amp;b=2">http://domain.com?a=1&amp;b=2</a>&nbsp;</p>`, typeUrl(editor, 'http://domain.com?a=1&b=2'));

    // All at once
    assertIsLink(editor, 'http://domain.com/slash/#after', 'http://domain.com/slash/#after');
    assertIsLink(editor, 'http://domain.com/slash/?q=a', 'http://domain.com/slash/?q=a');
    assertIsLink(editor, 'http://domain.com?q=a#hash', 'http://domain.com/?q=a#hash');
    assertIsLink(editor, 'http://domain.com/slash?q=a#hash', 'http://domain.com/slash?q=a#hash');
  });

  test('AutoLink: Url inside grouping characters', (editor) => {
    Assert.eq('Should support url in \'', `<p>'<a href="http://www.domain.com/">http://www.domain.com</a>'&nbsp;</p>`, typeUrl(editor, '\'http://www.domain.com\''));
    Assert.eq('Should support url in "', `<p>"<a href="http://www.domain.com/">http://www.domain.com</a>"&nbsp;</p>`, typeUrl(editor, '"http://www.domain.com"'));
    Assert.eq('Should support url in (', `<p>(<a href="http://www.domain.com/">http://www.domain.com</a>)&nbsp;</p>`, typeUrl(editor, '(http://www.domain.com)'));
    Assert.eq('Should support url in [', `<p>[<a href="http://www.domain.com/">http://www.domain.com</a>]&nbsp;</p>`, typeUrl(editor, '[http://www.domain.com]'));
    Assert.eq('Should support url in {', `<p>{<a href="http://www.domain.com/">http://www.domain.com</a>}&nbsp;</p>`, typeUrl(editor, '{http://www.domain.com}'));
  });

  test('AutoLink: Url after other text', (editor) => {
    Assert.eq('Should support text before the url', `<p>This is an example: <a href="http://www.domain.com/">http://www.domain.com</a>&nbsp;</p>`, typeUrl(editor, 'This is an example: http://www.domain.com'));
  });

  test('AutoLink: Url after other text inside grouping characters', (editor) => {
    Assert.eq('Should support url in \' after text', `<p>This is an example: '<a href="http://www.domain.com/">http://www.domain.com</a>'&nbsp;</p>`, typeUrl(editor, 'This is an example: \'http://www.domain.com\''));
    Assert.eq('Should support url in " after text', `<p>This is an example: "<a href="http://www.domain.com/">http://www.domain.com</a>"&nbsp;</p>`, typeUrl(editor, 'This is an example: "http://www.domain.com"'));
    Assert.eq('Should support url in ` after text', `<p>This is an example: \`<a href="http://www.domain.com/">http://www.domain.com</a>\`&nbsp;</p>`, typeUrl(editor, 'This is an example: `http://www.domain.com`'));
    Assert.eq('Should support url in ( after text', `<p>This is an example: (<a href="http://www.domain.com/">http://www.domain.com</a>)&nbsp;</p>`, typeUrl(editor, 'This is an example: (http://www.domain.com)'));
    Assert.eq('Should support url in [ after text', `<p>This is an example: [<a href="http://www.domain.com/">http://www.domain.com</a>]&nbsp;</p>`, typeUrl(editor, 'This is an example: [http://www.domain.com]'));
    Assert.eq('Should support url in { after text', `<p>This is an example: {<a href="http://www.domain.com/">http://www.domain.com</a>}&nbsp;</p>`, typeUrl(editor, 'This is an example: {http://www.domain.com}'));
  });

  test('AutoLink: Url in grouping character with non-breaking space', (editor) => {
    // Use a unicode escape sequence to type a non-breaking space in a way that lets us set the range correctly in typeUrl
    Assert.eq('Should not include the quote', `<p>"<a href="http://www.domain.com/">http://www.domain.com</a>"&nbsp;&nbsp;</p>`, typeUrl(editor, '"http://www.domain.com"\u00A0'));
  });

  suite.test(`TestCase-TBA: AutoLink: default_link_target='_self'`, (editor) => {
    editor.settings.default_link_target = '_self';
    LegacyUnit.equal(
      typeUrl(editor, 'http://www.domain.com'),
      '<p><a href="http://www.domain.com/" target="_self">http://www.domain.com</a>&nbsp;</p>'
    );
    delete editor.settings.default_link_target;
  });

  TinyLoader.setupLight((editor, onSuccess, onFailure) => {
    const steps = Env.browser.isIE() || Env.browser.isEdge() ? [] : suite.toSteps(editor);
    Pipeline.async({}, Log.steps('TBA', 'AutoLink: Test autolink url inputs', steps), onSuccess, onFailure);
  }, {
    plugins: 'autolink',
    indent: false,
    base_url: '/project/tinymce/js/tinymce'
  }, success, failure);
});
