(function() {
	module("tinymce.plugins.Autolink", {
		setupModule: function() {
			QUnit.stop();

			tinymce.init({
				selector: "textarea",
				add_unload_trigger: false,
				skin: false,
				plugins: 'autolink',
				autosave_ask_before_unload: false,
				indent: false,
				init_instance_callback: function(ed) {
					window.editor = ed;
					QUnit.start();
				}
			});
		},

		teardown: function() {
			delete editor.settings.default_link_target;
		}
	});

	function typeUrl(url) {
		editor.setContent('<p>' + url + '</p>');
		Utils.setSelection('p', url.length);
		Utils.type(' ');
		return editor.getContent();
	}

	function typeNewlineURL(url) {
		editor.setContent('<p>' + url + '</p>');
		Utils.setSelection('p', url.length);
		Utils.type('\n');
		return editor.getContent();
	}

	if (tinymce.Env.ie) {
		test("Skipped on IE since it has built in logic for autolink", function() {
			ok(true);
		});

		return;
	}

	test("Urls ended with space", function() {
		equal(typeUrl('http://www.domain.com'), '<p><a href="http://www.domain.com">http://www.domain.com</a></p>');
		equal(typeUrl('https://www.domain.com'), '<p><a href="https://www.domain.com">https://www.domain.com</a></p>');
		equal(typeUrl('ftp://www.domain.com'), '<p><a href="ftp://www.domain.com">ftp://www.domain.com</a></p>');
		equal(typeUrl('www.domain.com'), '<p><a href="http://www.domain.com">www.domain.com</a></p>');
		equal(typeUrl('www.domain.com.'), '<p><a href="http://www.domain.com">www.domain.com</a>.</p>');
		equal(typeUrl('mailto:user@domain.com'), '<p><a href="mailto:user@domain.com">mailto:user@domain.com</a></p>');
	});

	test("Urls ended with )", function() {
		equal(typeUrl('(http://www.domain.com)'), '<p>(<a href="http://www.domain.com">http://www.domain.com</a>)</p>');
		equal(typeUrl('(https://www.domain.com)'), '<p>(<a href="https://www.domain.com">https://www.domain.com</a>)</p>');
		equal(typeUrl('www.domain.com)'), '<p><a href="http://www.domain.com">www.domain.com</a>)</p>');
		equal(typeUrl('www.example.com/(test)'), '<p><a href="http://www.example.com/(test)">www.example.com/(test)</a></p>');
		equal(typeUrl('www.example.com/(first)/second)'), '<p><a href="http://www.example.com/(first)/second)">www.example.com/(first)/second)</a></p>');
		equal(typeUrl('(www.example.com/(first)/second)'), '<p>(<a href="http://www.example.com/(first)/second)">www.example.com/(first)/second)</a></p>');
		equal(typeUrl('www.example.com/(test))'), '<p><a href="http://www.example.com/(test)">www.example.com/(test)</a>)</p>');
		equal(typeUrl('(www.example.com/(test)'), '<p>(<a href="http://www.example.com/(test)">www.example.com/(test)</a></p>');
		equal(typeUrl('(www.example.com).'), '<p>(<a href="http://www.example.com">www.example.com</a>).</p>');
		equal(typeUrl('(www.example.com)!'), '<p>(<a href="http://www.example.com">www.example.com</a>)!</p>');
		equal(typeUrl('(www.example.com)?'), '<p>(<a href="http://www.example.com">www.example.com</a>)?</p>');
	});

	test("Urls ended with new line", function() {
		equal(typeNewlineURL('http://www.domain.com'), '<p><a href="http://www.domain.com">http://www.domain.com</a></p><p>&nbsp;</p>');
		equal(typeNewlineURL('https://www.domain.com'), '<p><a href="https://www.domain.com">https://www.domain.com</a></p><p>&nbsp;</p>');
		equal(typeNewlineURL('ftp://www.domain.com'), '<p><a href="ftp://www.domain.com">ftp://www.domain.com</a></p><p>&nbsp;</p>');
		equal(typeNewlineURL('www.domain.com'), '<p><a href="http://www.domain.com">www.domain.com</a></p><p>&nbsp;</p>');
		equal(typeNewlineURL('www.domain.com.'), '<p><a href="http://www.domain.com">www.domain.com</a>.</p><p>&nbsp;</p>');
	});

	test("Additional Url tests", function() {
		equal(typeUrl('http://example.com'), '<p><a href="http://example.com">http://example.com</a></p>');
		equal(typeUrl('http://WWW.example.com'), '<p><a href="http://WWW.example.com">http://WWW.example.com</a></p>');
		equal(typeUrl('http://www.example.com'), '<p><a href="http://www.example.com">http://www.example.com</a></p>');
		equal(typeUrl('http://example.com/subdir'), '<p><a href="http://example.com/subdir">http://example.com/subdir</a></p>');
		equal(typeUrl('http://sub-domain.example.com/subdir1/subdir2'), '<p><a href="http://sub-domain.example.com/subdir1/subdir2">http://sub-domain.example.com/subdir1/subdir2</a></p>');
		equal(typeUrl('http://localhost'), '<p><a href="http://localhost">http://localhost</a></p>');
		equal(typeUrl('http://127.0.0.1:99'), '<p><a href="http://127.0.0.1:99">http://127.0.0.1:99</a></p>');
		equal(typeUrl('http://example.com/subdir/index.php'), '<p><a href="http://example.com/subdir/index.php">http://example.com/subdir/index.php</a></p>');
		equal(typeUrl('http://example.gov/URI/archive/uri-archive.index.html'), '<p><a href="http://example.gov/URI/archive/uri-archive.index.html">http://example.gov/URI/archive/uri-archive.index.html</a></p>');
		equal(typeUrl('http://example.gov/URI/archive/uri-archive.index.htm'), '<p><a href="http://example.gov/URI/archive/uri-archive.index.htm">http://example.gov/URI/archive/uri-archive.index.htm</a></p>');
	});

	test("Urls with out a protocol", function () {
		equal(typeUrl('WWW.example.org'), '<p><a href="http://WWW.example.org">WWW.example.org</a></p>');
		equal(typeUrl('www.example.edu'), '<p><a href="http://www.example.edu">www.example.edu</a></p>');
		equal(typeUrl('www.example.ru'), '<p><a href="http://www.example.ru">www.example.ru</a></p>');
		equal(typeUrl('www2.example.com'), '<p><a href="http://www2.example.com">www2.example.com</a></p>');

	});
	test("Urls with punctuation at the end", function () {
		equal(typeUrl('www.google.com,'), '<p><a href="http://www.google.com">www.google.com</a>,</p>');
		equal(typeUrl('www.google.com.'), '<p><a href="http://www.google.com">www.google.com</a>.</p>');
		equal(typeUrl('www.google.com!'), '<p><a href="http://www.google.com">www.google.com</a>!</p>');
		equal(typeUrl('www.google.com?'), '<p><a href="http://www.google.com">www.google.com</a>?</p>');

	});
	test("Urls with other protocols", function () {
		equal(typeUrl('https://example.com'), '<p><a href="https://example.com">https://example.com</a></p>');
		equal(typeUrl('ftp://user:123@host.com/'), '<p><a href="ftp://user:123@host.com">ftp://user:123@host.com</a>/</p>');
		equal(typeUrl('ftp://host.com/'), '<p><a href="ftp://host.com">ftp://host.com</a>/</p>');
		equal(typeUrl('ftp://foo:@host.com/'), '<p><a href="ftp://foo:@host.com">ftp://foo:@host.com</a>/</p>');
		equal(typeUrl('ftp://myname@host.dom/%2Fetc/motd'), '<p><a href="ftp://myname@host.dom/%2Fetc/motd">ftp://myname@host.dom/%2Fetc/motd</a></p>');
		equal(typeUrl('ftp://myname@host.dom//etc/motd'), '<p><a href="ftp://myname@host.dom//etc/motd">ftp://myname@host.dom//etc/motd</a></p>');
		equal(typeUrl('ftp://username:@ftp.mcom.com/'), '<p><a href="ftp://username:@ftp.mcom.com">ftp://username:@ftp.mcom.com</a>/</p>');
		equal(typeUrl('file://vms.example.edu/disk$user/my/notes/note12345.txt'), '<p><a href="file://vms.example.edu/disk$user/my/notes/note12345.txt">file://vms.example.edu/disk$user/my/notes/note12345.txt</a></p>');
		equal(typeUrl('mailto:test.example.com'), '<p><a href="mailto:test.example.com">mailto:test.example.com</a></p>');
		equal(typeUrl('mailto:jsmith@example.com?subject=A%20Test&body=My%20idea%20is'), '<p><a href="mailto:jsmith@example.com?subject=A%20Test&amp;body=My%20idea%20is">mailto:jsmith@example.com?subject=A%20Test&amp;body=My%20idea%20is</a></p>');
		equal(typeUrl('news:news.example.com'), '<p><a href="news:news.example.com">news:news.example.com</a></p>');
		equal(typeUrl('news:*'), '<p><a href="news:*">news:*</a></p>');
		equal(typeUrl('nntp://localhost:99/newsgroup/35'), '<p><a href="nntp://localhost:99/newsgroup/35">nntp://localhost:99/newsgroup/35</a></p>');
		equal(typeUrl('telnet://hostname'), '<p><a href="telnet://hostname">telnet://hostname</a></p>');
		equal(typeUrl('ttstudio://server:4999/Test%20Project/Defects'), '<p><a href="ttstudio://server:4999/Test%20Project/Defects">ttstudio://server:4999/Test%20Project/Defects</a></p>');
		equal(typeUrl('ttstudio://server:4999/Test%20Project/Defects?RID=6521&DefectNum=4776'), '<p><a href="ttstudio://server:4999/Test%20Project/Defects?RID=6521&amp;DefectNum=4776">ttstudio://server:4999/Test%20Project/Defects?RID=6521&amp;DefectNum=4776</a></p>');
	});
})();
