var select = require('soupselect').select,
    htmlparser = require("htmlparser"),
    fs = require('fs'),
    sys = require('sys');

var html = fs.readFileSync('testdata/test.html', 'utf-8');

function runTest(test, callback) {
    var handler = new htmlparser.DefaultHandler(function(err, dom) {
        if (err) {
            sys.debug("Error: " + err);
        } else {
            callback(dom);
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
}

function assertSelects(test, dom, selector, expected_ids) {
    var el_ids = [];
    var els = select(dom, selector);
    els.forEach(function(el) {
        el_ids.push(el.attribs.id);
    });
    el_ids.sort();
    expected_ids.sort();
    test.deepEqual(
        expected_ids,
        el_ids,
        "Selector " + selector + ", expected " + sys.inspect(expected_ids)+ ", got " + sys.inspect(el_ids)
        );
}

function assertSelectMultiple(test, dom, specs) {
    specs.forEach(function(spec){
        assertSelects(test, dom, spec[0], spec[1]);
    });
}

exports.basicSelectors = {
    one_tag_one: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, 'title');
            test.equal(els.length, 1);
            test.equal(els[0].name, 'title');
            test.equal(els[0].children[0].raw, 'The title');
        });
        test.done();
    },
    
    one_tag_many: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, 'div');
            test.equal(els.length, 3);
            els.forEach(function(div) {
                test.equal(div.name, 'div');
            });
        });
        test.done();
    },
    
    tag_in_tag_one: function(test) {
        runTest(test, function(dom) {
            assertSelects(test, dom, 'div div', ['inner']);
        });
        test.done();
    },
    
    tag_in_tag_many: function(test) {
        ['html div', 'html body div', 'body div'].forEach(function(selector) {
            runTest(test, function(dom) {
                assertSelects(test, dom, selector, ['main', 'inner', 'footer']);
            });
        });
        test.done();
    },
    
    tag_no_match: function(test) {
        runTest(test, function(dom) {
            test.equal(select(dom, 'del').length, 0);
        });
        test.done();
    },
    
    tag_invalid_tag: function(test) {
        runTest(test, function(dom) {
            test.equal(select(dom, 'tag%t').length, 0);
        });
        test.done();
    },
    
    header_tags: function(test) {
        runTest(test, function(dom) {
            assertSelectMultiple(test, dom, [
                ['h1', ['header1']],
                ['h2', ['header2', 'header3']]
                ]);
        });
        test.done();
    },
    
    class_one: function(test) {
        runTest(test, function(dom) {
            ['.onep', 'p.onep', 'html p.onep'].forEach(function(selector) {
                var els = select(dom, selector);
                test.equal(els.length, 1);
                test.equal(els[0].name, 'p');
                test.equal(els[0].attribs.class, 'onep');
            });
        });
        test.done();
    },
    
    class_mismatched_tag: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, 'div.onep');
            test.equal(els.length, 0);
        });
        test.done();
    },
    
    one_id: function(test) {
        runTest(test, function(dom) {
            ['div#inner', '#inner', 'div div#inner'].forEach(function(selector) {
                assertSelects(test, dom, selector, ['inner']);
            });
        });
        test.done();
    },
    
    bad_id: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, '#doesnotexist');
            test.equal(els.length, 0);
        });
        test.done();
    },
    
    items_in_id: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, 'div#inner p');
            test.equal(els.length, 3);
            els.forEach(function(el) {
                test.equal(el.name, 'p');
            });
            test.equal(els[1].attribs.class, 'onep');
            
            // attribs not created when none around - checking there's not class attribute
            test.ok(typeof els[0].attribs == 'undefined');
            test.done();
        });
    },
    
    a_bunch_of_emptys: function(test) {
        runTest(test, function(dom) {
            ['div#main del', 'div#main div.oops', 'div div#main'].forEach(function(selector) {
                test.equal(select(dom, selector).length, 0);
            });
        });
        test.done();
    },
    
    multi_class_support: function(test) {
        runTest(test, function(dom) {
            ['.class1', 'p.class1', '.class2', 'p.class2', 
                '.class3', 'p.class3', 'html p.class2',
                    'div#inner .class2'].forEach(function(selector) {
                assertSelects(test, dom, selector, ['pmulti']);
            });
        });
        test.done();
    },
    
}
