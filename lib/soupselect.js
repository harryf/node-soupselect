/**
Port of Simon Willison's Soup Select http://code.google.com/p/soupselect/
http://www.opensource.org/licenses/mit-license.php

Right now just a working prototype...
*/

var domUtils = require("htmlparser").DomUtils;
var sys = require('sys');

var tagRe = /^[a-z0-9]+$/

/*
 /^(\w+)?\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/
   \---/  \---/\-------------/    \-------/
     |      |         |               |
     |      |         |           The value
     |      |    ~,|,^,$,* or =
     |   Attribute 
    Tag
*/
var attrSelectRe = /^(\w+)?\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/;

/**
Takes an operator, attribute and optional value; returns a function that
will return True for elements that match that combination.
*/
function makeAttributeChecker(operator, attr, value) {
    value = typeof(value) == 'string' ? value : '';
    
    return operator ? {
        '=': function ( test_value ) { return test_value == value },
        // attribute includes value as one of a set of space separated tokens
        '~': function ( test_value ) { return test_value ? test_value.split(/\s+/).indexOf(value) != -1 : false },
        // attribute starts with value
        '^': function ( test_value ) { return test_value ? test_value.substr(0, value.length) == value : false },
        // attribute ends with value
        '$': function ( test_value ) { return test_value ? test_value.substr(-value.length) == value : false },
        // attribute contains value
        '*': function ( test_value ) { return test_value ? test_value.indexOf(value) != -1 : false },
        // attribute is either exactly value or starts with value-
        '|': function ( test_value ) { return test_value ? test_value == value ||
             test_value.substr(0, value.length + 1) == value + '-' : false },
        // default to just check attribute existence...
        }[operator] : function ( test_value ) { return test_value ? true : false };

}

exports.select = function(dom, selector) {
    var currentContext = [dom]
    
    var tokens = selector.split(/\s+/);
    
    if (typeof StopIteration == "undefined") {
        StopIteration = new Error("StopIteration");
    }
    
    try {
        tokens.forEach(function(token) {
            
            // Attribute selectors
            var match = attrSelectRe.exec(token);
            if ( match ) {
                var tag = match[1]; var attribute = match[2]; var operator = match[3]; var value = match[4];
                var options = {};
                options[attribute] = makeAttributeChecker(operator, attribute, value);
                
                var found = [];
                currentContext.forEach(function(context) {
                    found = found.concat(domUtils.getElements(options, context));
                });
                
                if ( tag ) {
                    found = domUtils.getElements({ 'tag_name': tag }, found);
                }
            
                currentContext = found
            
            } 
        
            // ID selector
            else if ( token.indexOf('#') != -1 ) {
                var found = [];
                
                var id_selector = token.split('#', 2)[1];
                
                // uglier construct but need to stop on the first id found (in bad HTML)
                // while avoiding additional StopIterations for efficiency
                var el = null;
                for ( var i = 0; i < currentContext.length; i++ ) {
                    
                    // the document has no child elements but tags do so we search children to avoid
                    // returning the current element via a false positive
                    if ( typeof currentContext[i].children != 'undefined' ) {
                        el = domUtils.getElementById(id_selector, currentContext[i].children);
                    } else {
                        el = domUtils.getElementById(id_selector, currentContext[i]);
                    }

                    if ( el ) {
                        found.push(el);
                        break;
                    }
                }
                
                if (! found[0]) {
                    currentContext = [];
                    throw StopIteration;
                }
                
                currentContext = found;
            }
            
            // Class selector
            else if ( token.indexOf('.') != -1 ) {
                var parts = token.split('.', 2);
                var tag = parts[0];
                var options = {};
                options['class'] = function (value) {
                    return (value && value.split(/\s+/).indexOf(parts[1]) > -1);
                };
                
                var found = [];
                currentContext.forEach(function(context) {
                    if ( tag.length > 0 ) {
                        context = domUtils.getElementsByTagName(tag, context);
                        // don't recurse in the case we have a tag or we get children we might not want
                        found = found.concat(domUtils.getElements(options, context, false));
                    } else {
                        found = found.concat(domUtils.getElements(options, context));
                    }
                    
                });
                
                currentContext = found
            }
            
            // Star selector
            else if ( token == '*' ) {
                // nothing to do right?
            }
            
            // Tag selector
            else {
                if (!tagRe.test(token)) {
                    currentContext = [];
                    throw StopIteration;
                }
                
                var found = []
                currentContext.forEach(function(context) {
                    // htmlparsers document itself has no child property - only nodes do...
                    if ( typeof context.children != 'undefined' ) {
                        found = found.concat(domUtils.getElementsByTagName(token, context.children));
                    } else {
                        found = found.concat(domUtils.getElementsByTagName(token, context));
                    }

                });
                
                currentContext = found;
            }
        });
        
    } catch (error) {
        if (error != StopIteration) throw error;
    };
    
    return currentContext;
}
