var soupselect = require('soupselect'),
    nodeunit = require('nodeunit'),
    htmlparser = require("htmlparser")
    sys = require('sys');
    
var select = soupselect.select;

var html = "<a class='y'>text a</a><b id='x'>text b</b><c class='y'>text c</c><d id='z' class='w'><e>text e</e></d><g>bogus</g><g class='g h i'>hhh</g><g class='h'>foo</g>";

var handler = new htmlparser.DefaultHandler(function(err, dom) {
    if (err) {
        sys.debug("Error: " + err);
    } else {
        sys.puts("a : " + sys.inspect(select(dom, 'a')));
        sys.puts("g : " + sys.inspect(select(dom, 'g')));
        sys.puts("g.h : " + sys.inspect(select(dom, 'g.h')));
        sys.puts("g[class=h] : " + sys.inspect(select(dom, 'g[class=h]'))); // ISSUES
        sys.puts("g[class~=h] : " + sys.inspect(select(dom, 'g[class~=h]'))); // ISSUES
        sys.puts("#x : " + sys.inspect(select(dom, '#x')));
        sys.puts("* : " + sys.inspect(select(dom, '*')));
        sys.puts("g* : " + sys.inspect(select(dom, 'g *')));
    }
});

var parser = new htmlparser.Parser(handler);
parser.parseComplete(html);