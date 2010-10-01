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
    }
}
