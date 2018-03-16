import { Pipeline } from '@ephox/agar';
import { LegacyUnit, TinyLoader } from '@ephox/mcagar';
import Env from 'tinymce/core/api/Env';
import Plugin from 'tinymce/plugins/autolink/Plugin';
import KeyUtils from '../module/test/KeyUtils';
import Theme from 'tinymce/themes/modern/Theme';
import { UnitTest } from '@ephox/bedrock';

UnitTest.asynctest('browser.tinymce.plugins.autolink.AutoLinkPluginTest', function () {
  const success = arguments[arguments.length - 2];
  const failure = arguments[arguments.length - 1];
  const suite = LegacyUnit.createSuite();

  Theme();
  Plugin();

  const typeUrl = function (editor, url) {
    editor.setContent('<p>' + url + '</p>');
    LegacyUnit.setSelection(editor, 'p', url.length);
    KeyUtils.type(editor, ' ');
    return editor.getContent();
  };

  const typeNewlineURL = function (editor, url) {
    editor.setContent('<p>' + url + '</p>');
    LegacyUnit.setSelection(editor, 'p', url.length);
    KeyUtils.type(editor, '\n');
    return editor.getContent();
  };

  suite.test('Urls ended with space', function (editor) {
    editor.focus();
    LegacyUnit.equal(typeUrl(editor, '(http://www.domain.com)'), '<p>(<a href="http://www.domain.com">http://www.domain.com</a>)</p>');
    LegacyUnit.equal(typeUrl(editor, 'http://www.domain.com'), '<p><a href="http://www.domain.com">http://www.domain.com</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'https://www.domain.com'), '<p><a href="https://www.domain.com">https://www.domain.com</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'ftp://www.domain.com'), '<p><a href="ftp://www.domain.com">ftp://www.domain.com</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'www.domain.com'), '<p><a href="http://www.domain.com">www.domain.com</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'www.domain.com.'), '<p><a href="http://www.domain.com">www.domain.com</a>.</p>');
    LegacyUnit.equal(typeUrl(editor, 'mailto:user@domain.com'), '<p><a href="mailto:user@domain.com">mailto:user@domain.com</a></p>');
  });

  suite.test('Urls ended with )', function (editor) {
    LegacyUnit.equal(typeUrl(editor, '(http://www.domain.com)'), '<p>(<a href="http://www.domain.com">http://www.domain.com</a>)</p>');
    LegacyUnit.equal(typeUrl(editor, '(https://www.domain.com)'), '<p>(<a href="https://www.domain.com">https://www.domain.com</a>)</p>');
    LegacyUnit.equal(typeUrl(editor, 'www.domain.com)'), '<p><a href="http://www.domain.com">www.domain.com</a>)</p>');
    LegacyUnit.equal(typeUrl(editor, 'www.example.com/(test)'), '<p><a href="http://www.example.com/(test)">www.example.com/(test)</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'www.example.com/(first)/second)'), '<p><a href="http://www.example.com/(first)/second)">www.example.com/(first)/second)</a></p>');
    LegacyUnit.equal(typeUrl(editor, '(www.example.com/(first)/second)'), '<p>(<a href="http://www.example.com/(first)/second)">www.example.com/(first)/second)</a></p>');
    LegacyUnit.equal(typeUrl(editor, 'www.example.com/(test))'), '<p><a href="http://www.example.com/(test)">www.example.com/(test)</a>)</p>');
    LegacyUnit.equal(typeUrl(editor, '(www.example.com/(test)'), '<p>(<a href="http://www.example.com/(test)">www.example.com/(test)</a></p>');
    LegacyUnit.equal(typeUrl(editor, '(www.example.com).'), '<p>(<a href="http://www.example.com">www.example.com</a>).</p>');
    LegacyUnit.equal(typeUrl(editor, '(www.example.com)!'), '<p>(<a href="http://www.example.com">www.example.com</a>)!</p>');
    LegacyUnit.equal(typeUrl(editor, '(www.example.com)?'), '<p>(<a href="http://www.example.com">www.example.com</a>)?</p>');
  });

  suite.test('Urls ended with new line', function (editor) {
    LegacyUnit.equal(
      typeNewlineURL(editor, 'http://www.domain.com'),
      '<p><a href="http://www.domain.com">http://www.domain.com</a></p><p>&nbsp;</p>'
    );
    LegacyUnit.equal(
      typeNewlineURL(editor, 'https://www.domain.com'),
      '<p><a href="https://www.domain.com">https://www.domain.com</a></p><p>&nbsp;</p>'
    );
    LegacyUnit.equal(
      typeNewlineURL(editor, 'ftp://www.domain.com'),
      '<p><a href="ftp://www.domain.com">ftp://www.domain.com</a></p><p>&nbsp;</p>'
    );
    LegacyUnit.equal(
      typeNewlineURL(editor, 'www.domain.com'),
      '<p><a href="http://www.domain.com">www.domain.com</a></p><p>&nbsp;</p>'
    );
    LegacyUnit.equal(
      typeNewlineURL(editor, 'www.domain.com.'),
      '<p><a href="http://www.domain.com">www.domain.com</a>.</p><p>&nbsp;</p>'
    );
  });

  suite.test('Url inside blank formatting wrapper', function (editor) {
    editor.focus();
    editor.setContent('<p><br></p>');
    editor.selection.setCursorLocation(editor.getBody().firstChild, 0);
    editor.execCommand('Bold');
    // inserting url via typeUrl() results in different behaviour, so lets simply type it in, char by char
    KeyUtils.typeString(editor, 'http://www.domain.com ');
    LegacyUnit.equal(
      editor.getContent(),
      '<p><strong><a href="http://www.domain.com">http://www.domain.com</a> </strong></p>'
    );
  });

  suite.test('Additional Url tests', function (editor) {
    const mkUrl = (url) => typeUrl(editor, url);
    const equal = LegacyUnit.equal;
    equal(mkUrl('http://example.com'), '<p><a href="http://example.com">http://example.com</a></p>');
    equal(mkUrl('http://WWW.example.com'), '<p><a href="http://WWW.example.com">http://WWW.example.com</a></p>');
    equal(mkUrl('http://www.example.com'), '<p><a href="http://www.example.com">http://www.example.com</a></p>');
    equal(mkUrl('http://example.com/subdir'), '<p><a href="http://example.com/subdir">http://example.com/subdir</a></p>');
    equal(mkUrl('http://sub-domain.example.com/subdir1/subdir2'), '<p><a href="http://sub-domain.example.com/subdir1/subdir2">http://sub-domain.example.com/subdir1/subdir2</a></p>');
    // Depending on the web server used this might turn into a local URL
    // equal(mkUrl('http://localhost'), '<p><a href="http://localhost">http://localhost</a></p>');
    equal(mkUrl('http://someotherhost'), '<p><a href="http://someotherhost">http://someotherhost</a></p>');
    equal(mkUrl('http://127.0.0.1:99'), '<p><a href="http://127.0.0.1:99">http://127.0.0.1:99</a></p>');
    equal(mkUrl('http://example.com/subdir/index.php'), '<p><a href="http://example.com/subdir/index.php">http://example.com/subdir/index.php</a></p>');
    equal(mkUrl('http://example.gov/URI/archive/uri-archive.index.html'), '<p><a href="http://example.gov/URI/archive/uri-archive.index.html">http://example.gov/URI/archive/uri-archive.index.html</a></p>');
    equal(mkUrl('http://example.gov/URI/archive/uri-archive.index.htm'), '<p><a href="http://example.gov/URI/archive/uri-archive.index.htm">http://example.gov/URI/archive/uri-archive.index.htm</a></p>');
  });
  suite.test('Urls with out a protocol', function (editor) {
    const mkUrl = (url) => typeUrl(editor, url);
    const equal = LegacyUnit.equal;
    equal(mkUrl('WWW.example.org'), '<p><a href="http://WWW.example.org">WWW.example.org</a></p>');
    equal(mkUrl('www.example.edu'), '<p><a href="http://www.example.edu">www.example.edu</a></p>');
    equal(mkUrl('www.example.ru'), '<p><a href="http://www.example.ru">www.example.ru</a></p>');
    equal(mkUrl('www2.example.com'), '<p><a href="http://www2.example.com">www2.example.com</a></p>');

  });
  suite.test('Urls with punctuation at the end', function (editor) {
    const mkUrl = (url) => typeUrl(editor, url);
    const equal = LegacyUnit.equal;
    equal(mkUrl('www.google.com,'), '<p><a href="http://www.google.com">www.google.com</a>,</p>');
    equal(mkUrl('www.google.com.'), '<p><a href="http://www.google.com">www.google.com</a>.</p>');
    equal(mkUrl('www.google.com!'), '<p><a href="http://www.google.com">www.google.com</a>!</p>');
    equal(mkUrl('www.google.com?'), '<p><a href="http://www.google.com">www.google.com</a>?</p>');

  });
  suite.test('Urls with other protocols', function (editor) {
    const mkUrl = (url) => typeUrl(editor, url);
    const equal = LegacyUnit.equal;
    equal(mkUrl('https://example.com'), '<p><a href="https://example.com">https://example.com</a></p>');
    equal(mkUrl('ftp://user:123@host.com/'), '<p><a href="ftp://user:123@host.com">ftp://user:123@host.com</a>/</p>');
    equal(mkUrl('ftp://host.com/'), '<p><a href="ftp://host.com">ftp://host.com</a>/</p>');
    equal(mkUrl('ftp://foo:@host.com/'), '<p><a href="ftp://foo:@host.com">ftp://foo:@host.com</a>/</p>');
    equal(mkUrl('ftp://myname@host.dom/%2Fetc/motd'), '<p><a href="ftp://myname@host.dom/%2Fetc/motd">ftp://myname@host.dom/%2Fetc/motd</a></p>');
    equal(mkUrl('ftp://myname@host.dom//etc/motd'), '<p><a href="ftp://myname@host.dom//etc/motd">ftp://myname@host.dom//etc/motd</a></p>');
    equal(mkUrl('ftp://username:@ftp.mcom.com/'), '<p><a href="ftp://username:@ftp.mcom.com">ftp://username:@ftp.mcom.com</a>/</p>');
    equal(mkUrl('file://vms.example.edu/disk$user/my/notes/note12345.txt'), '<p><a href="file://vms.example.edu/disk$user/my/notes/note12345.txt">file://vms.example.edu/disk$user/my/notes/note12345.txt</a></p>');
    equal(mkUrl('mailto:test.example.com'), '<p><a href="mailto:test.example.com">mailto:test.example.com</a></p>');
    equal(mkUrl('mailto:jsmith@example.com?subject=A%20Test&body=My%20idea%20is'), '<p><a href="mailto:jsmith@example.com?subject=A%20Test&amp;body=My%20idea%20is">mailto:jsmith@example.com?subject=A%20Test&amp;body=My%20idea%20is</a></p>');
    equal(mkUrl('news:news.example.com'), '<p><a href="news:news.example.com">news:news.example.com</a></p>');
    equal(mkUrl('news:*'), '<p><a href="news:*">news:*</a></p>');
    equal(mkUrl('nntp://localhost:99/newsgroup/35'), '<p><a href="nntp://localhost:99/newsgroup/35">nntp://localhost:99/newsgroup/35</a></p>');
    equal(mkUrl('telnet://hostname'), '<p><a href="telnet://hostname">telnet://hostname</a></p>');
    equal(mkUrl('ttstudio://server:4999/Test%20Project/Defects'), '<p><a href="ttstudio://server:4999/Test%20Project/Defects">ttstudio://server:4999/Test%20Project/Defects</a></p>');
    equal(mkUrl('ttstudio://server:4999/Test%20Project/Defects?RID=6521&DefectNum=4776'), '<p><a href="ttstudio://server:4999/Test%20Project/Defects?RID=6521&amp;DefectNum=4776">ttstudio://server:4999/Test%20Project/Defects?RID=6521&amp;DefectNum=4776</a></p>');
  });

  suite.test('Don\'t add protocol to field code href', function (editor) {
    const addProtocolIfNeeded = (url) => editor.plugins.autolink.addProtocolIfNeeded(url);
    LegacyUnit.equal(addProtocolIfNeeded('test.com'), 'http://test.com');
    LegacyUnit.equal(addProtocolIfNeeded('%TTSTUDIOURL%'), '%TTSTUDIOURL%');
  });

  TinyLoader.setup(function (editor, onSuccess, onFailure) {
    const steps = Env.ie ? [] : suite.toSteps(editor);
    Pipeline.async({}, steps, onSuccess, onFailure);
  }, {
    plugins: 'autolink',
    indent: false,
    skin_url: '/project/js/tinymce/skins/lightgray'
  }, success, failure);
});
