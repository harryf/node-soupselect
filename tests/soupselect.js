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
    test.done();
}

function assertSelects(test, dom, selector, expected_ids) {
    var el_ids = [];
    select(dom, selector).forEach(function(el) {
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
    },
    
    one_tag_many: function(test) {
        runTest(test, function(dom) {
            var els = select(dom, 'div');
            test.equal(els.length, 3);
            els.forEach(function(div) {
                test.equal(div.name, 'div');
            });
        });
    },
    
    tag_in_tag_one: function(test) {
        runTest(test, function(dom) {
            assertSelects(test, dom, 'div div', ['inner']);
        });
    },
    
    tag_in_tag_many: function(test) {
        ['html div', 'html body div', 'body div'].forEach(function(selector) {
            runTest(test, function(dom) {
                assertSelects(test, dom, selector, ['main', 'inner', 'footer']);
            });
        });
    },
    
    tag_no_match: function(test) {
        runTest(test, function(dom) {
            test.equal(select(dom, 'del').length, 0);
        });
    },
    
    tag_invalid_tag: function(test) {
        runTest(test, function(dom) {
            test.equal(select(dom, 'tag%t').length, 0);
        });
    },
    
    header_tags: function(test) {
        runTest(test, function(dom) {
            assertSelectMultiple(test, dom, [
                ['h1', ['header1']],
                ['h2', ['header2', 'header3']]
                ]);
        });
    },
    
    // class_one: function(test) {
    //     runTest(test, function(dom) {
    //         ['.onep', 'p.onep', 'html p.onep'].forEach(function(selector) {
    //             var els = select(dom, selector);
    //             test.equal(els.length, 1);
    //             test.equal(els[0].name, 'p');
    //             test.equal(els[0].attribs.class, 'onep');
    //         });
    //     });
    // },
    
    class_mismatched_tag: function(test) {
        runTest(test, function(dom) {
            test.equal(select(dom, 'div.onep').length, 0);
        })
    },
    
    one_id: function(test) {
        runTest(test, function(dom) {
            ['div#inner', '#inner', 'div div#inner'].forEach(function(selector) {
                assertSelects(test, dom, selector, ['inner']);
            });
        });
    }
}
