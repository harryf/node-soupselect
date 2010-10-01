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
    
    function hasAttribute(el, attr) {
        sys.debug(sys.inspect(el) + ", attr: " + attr);
        if ( el && el['attribs'] && el.attribs[attr] ) { return true; }
        return false;
    }
    
    return {
        '=': function ( el ) { return hasAttribute(el, attr) ? el.attribs[attr] == value : false },
        // attribute includes value as one of a set of space separated tokens
        '~': function ( el ) { return hasAttribute(el, attr) ? el.attribs[attr].split(/\s+/).indexOf(value) != -1 : false },
        // attribute starts with value
        '^': function ( el ) { return el.attribs[attr] ? el.attribs[attr].substr(0, value.length) == value : false },
        // attribute ends with value
        '$': function ( el ) { return el.attribs[attr] ? el.attribs[attr].substr(-value.length) == value : false },
        // attribute contains value
        '*': function ( el ) { return el.attribs[attr] ? el.attribs[attr].indexOf(value) != -1 : false },
        // attribute is either exactly value or starts with value-
        '|': function ( el ) { return el.attribs[attr] ? el.attribs[attr] == value ||
             el.attribs[attr].substr(0, value.length + 1) == value + '-' : false },
        }[operator];
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
                if ( tag ) { options['tag_name'] = tag; }
                options[attribute] = makeAttributeChecker(operator, attribute, value);
                
                var found = [];
                currentContext.forEach(function(context) {
                    found = found.concat(domUtils.getElements(options, context));
                });
            
                currentContext = found
            
            } 
        
            // ID selector
            else if ( token.indexOf('#') != -1 ) {
                var found = domUtils.getElementById(token.split('#', 2)[1], currentContext[0]);
                if (found[0] === null) {
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
                options['class'] = function (value) { return(value && value.split(/\s+/).indexOf(parts[1]) > -1); };
                
                var found = [];
                currentContext.forEach(function(context) {
                    if ( tag ) {
                        context = domUtils.getElementsByTagName(tag, context)
                    }
                    found = found.concat(domUtils.getElements(options, context));
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
