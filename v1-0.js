/*
    Copyright 2005-2008 Jeff Watkins <http://coherentjs.org>

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
    
    
    NWMatcher Copyright (c) 2007 Diego Perini <http://www.iport.it>
    All rights reserved.
*/

if ("undefined"!==typeof(coherent))
    throw new Error("Library module (coherent) already defined");

/**
 *  @namespace
 */
var coherent= {
    version: "1.0.0",
    revision: "",
    generateUid: (function(){
            var uid= 0;
            return function()
            {
                return ++uid;
            };
        })()
};

/** Boolean flags to indicate which browser is currently running. Purists will
 *  tell you that browser sniffing is passÃ©, but sometimes there's really no
 *  other way...
 *  
 *  @namespace
 */
coherent.Browser= {
    /** Is the browser IE? **/
    IE: !!(window.attachEvent && !window.opera),
    /** Is the browser some variant of Safari? **/
    Safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    /** Is the browser Safari 2, which has some pecular bugs **/
    Safari2: (function(){
            var safariVersionRegex= /AppleWebKit\/(\d+(?:\.\d+)?)/;
            var match= safariVersionRegex.exec(navigator.userAgent);
            return (match && parseInt(match[1],10)<420);
        })(),
    /** Is the browser some variant of Mozilla? **/
    Mozilla:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
    /** Is the browser Mobile Safari (iPhone or iPod Touch) **/
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
};

/** Boolean flags to indicate various language & DOM support options. This is
 *  in lieu of simply sniffing the browser, because sometimes that works better.
 *  
 *  @namespace
 */
coherent.Support= {
    /** Does the browser support JavaScript getters & setters? **/
    Properties: ('__defineGetter__' in Object.prototype),
    QuerySelector: ('querySelector' in document)
};

if (coherent.Browser.IE || coherent.Browser.Safari2)
    Array.from= function(obj, startIndex)
    {
        var len= obj.length;
        var result= [];
        
        for (var i=(startIndex||0); i<len; ++i) {
            result.push(obj[i]);
        }
        return result;
    }
else
    Array.from= function(obj, startIndex)
    {
        return Array.prototype.slice.call(obj, startIndex||0);
    }
    
/** There might be cases where the bind method hasn't already been defined.
 *  This should mimic the Prototype library's bind method as closely as possible.
 */
if (!Function.prototype.bind)
    Function.prototype.bind= function(obj)
    {
        var self= this;
        if (!arguments.length)
            return self;
            
        if (1==arguments.length)
            return function()
            {
                return self.apply(obj, arguments);
            };

        var args= Array.from(arguments, 1);

        return function()
        {
            return self.apply(obj, args.concat(Array.from(arguments)));
        };
    }

if (!Function.prototype.bindAsEventListener)
    Function.prototype.bindAsEventListener = function(object)
    {
        var self = this;

        if (1==arguments.length)
            return function(event)
            {
                return self.call(object, event||window.event);
            };
            
        var args = Array.from(arguments);
        args.shift();

        return function(event) {
            return self.apply(object, [event || window.event].concat(args));
        };
    }

    
if (!Function.prototype.delay)
    Function.prototype.delay= function(delay)
    {
        var self = this;
        
        delay= delay||10;
        
        if (arguments.length<2)
        {
            /*  By default, the handler for setTimeout receives the timer
                event object. I've never seen any good use for this handler.
             */
            function noargs()
            {
                self();
            }
            return window.setTimeout(noargs, delay);
        }
        
        var args = Array.from(arguments, 1);
        
        function go()
        {
            self.apply(self, args);
        }
        return window.setTimeout(go, delay);
    }

if (!Function.prototype.bindAndDelay)
    Function.prototype.bindAndDelay= function(obj, delay)
    {
        var self = this;
        
        delay= delay||10;
        if (arguments.length<3)
        {
            function noargs()
            {
                self.call(obj||self);
            }
            return window.setTimeout(noargs, delay);
        }
        
        var args = Array.from(arguments, 2);
        
        function go()
        {
            self.apply(self, args);
        }
        return window.setTimeout(go, delay);
    }




/** Provide synchronisation for functions.
 */
Function.prototype.sync= function()
{
    var fn= arguments.length?this.bind.apply(this, arguments):this;
    var points= {};
    var cancelled= false;
    
    fn.stop= function()
    {
        cancelled= true;
    }

    fn.waitFor= function(point)
    {
        points[point]= true;
        
        return function()
        {
            points[point]=false;
            for (var p in points)
                if (points[p])
                    return;

            if (cancelled)
                return;
            //  All join points have been triggered
            fn();
        };
    }
    
    return fn;
}




/** Make title case version of string.
    @returns original string with the first character capitalised.
 **/
String.prototype.titleCase= function()
{
    return this.charAt(0).toUpperCase() + this.substr(1);
}

/** Trim the whitespace off either end of a string.
 */
String.prototype.trim= function()
{
    var str= this.replace(/^\s+/, '');
	for (var i = str.length - 1; i > 0; --i)
		if (/\S/.test(str.charAt(i)))
		{
			str = str.substring(0, i + 1);
			break;
		}
	return str;
}


/** Safari 2 doesn't define the localeCompare. This probably will be slow.
 **/
if (!String.prototype.localeCompare)
    String.prototype.localeCompare = function(other)
    {
        if (this < other)
            return -1;
        else if (this > other)
            return 1;
        else
            return 0;
    }




/** A function to escape strings for creating regular expressions.
 */
RegExp.escape = function(text)
{
  return text.replace(RegExp._escapeRegex, '\\$1');
}
RegExp.specialCharacters= ['/', '.', '*', '+', '?', '|',
                           '(', ')', '[', ']', '{', '}', '\\'];
RegExp._escapeRegex= new RegExp('(\\'+ RegExp.specialCharacters.join("|\\") +
                                ')', 'g');




/** Make a shallow-copy clone of an object. Modifications are copy-on-write.
    Note, because this is a shallow copy, only properties actually on the cloned
    object will be copy-on-write. For example, if you clone foo into bar and
    then change bar.baz.foo, the change will propagate to the original, foo.
    
    @param obj  the object to clone.
    @returns    a new object with all the same properties as obj.
 **/
Object.clone= function(obj)
{
    var fn = (function(){});
    fn.prototype = obj;
    return new fn();
}

/** Apply default values to an object.
 *  
 *  @param obj  the object to receive default values
 *  @param defaults the object from which to retrieve defaults
 *  @returns obj
 */
Object.applyDefaults = function(obj, defaults)
{
    obj= obj||{};
    
    if (!defaults)
        return obj;

    for (var p in defaults)
    {
        if (p in obj)
            continue;
        obj[p]= defaults[p];
    }
    return obj;
}

Object.extend= function(obj, extensions)
{
    obj= obj||{};
    
    for (var p in extensions)
        obj[p]= extensions[p];

    return obj;
}
    
Object.merge = function(obj1, obj2)
{
    var o= {};
    var prop;

    for (prop in obj1)
        o[prop]= obj1[prop];

    for (prop in obj2)
    {
        if (prop in o)
            continue;
        o[prop]= obj2[prop];
    }
    
    return o;
}

/** Create a query string from an object.
 */
Object.toQueryString = function(obj) {
    var p;
    var v;
    var o= {};
    var args= [];
    
    function addPair(key, value) {
        key= encodeURIComponent(key);
        if (null!==value && undefined!==value)
            value= encodeURIComponent(value);
        args.push(key+'='+value);
    }
    
    for (p in obj) {
        v= obj[p];
        //  skip properties defined on Object
        if (obj[p]===o[p])
            continue;
        if (v instanceof Array)
            v.forEach(function(value) { addPair(p, value); });
        else
            addPair(p, v);
    }
    
    return args.join("&");
}

/** Create an object from a query string.
 */
Object.fromQueryString = function(query) {
    if ("?"==query.charAt(0))
        query= query.slice(1);
        
    query= query.split(/\s*&\s*/);
    
    var params= {};
    var v;
    
    function splitParam(param) {
        param= param.split("=");
        var key= decodeURIComponent(param[0].trim());
        var value= decodeURIComponent(param[1].trim())||undefined;
        
        if (key in params)
        {
            v= params[key];
            if (v instanceof Array)
                v.push(value);
            else
                params[key]= [v, value];
        }
        else
            params[key]= value;
    }

    query.forEach(splitParam);
    return params;
}



/** The base typeof operator doesn't handle dates, regular expressions, boolean
    values, arrays, and strings very well. This function takes care of these
    problems.
    
    @param o    the object for which the type is requested
    @returns    a string with the type of the object.
 **/
coherent.typeOf=function( o )
{
    if (null===o)
        return "object";

    var t= typeof(o);
    if ("object"!==t && "function"!==t)
        return t;
    switch (o.constructor)
    {
        case Array:
            return "array";
        case Boolean:
            return "boolean";
        case Date:
            return "date";
        case Function:
            return "function";
        case Object:
            return "object";
        case RegExp:
            return "regex";
        case String:
            return "string";
        default:
            //  try to determine the name of the constructor
            var m = o.constructor.toString().match(/function\s*([^( ]+)\(/);
            if (m)
                return m[1];
            else
                return "object";
    }
}

/** Compare two values. This handles pretty much every type possible. When the
    types don't match, the values are first converted to strings and then
    compared with a locale sensitive method.
    
    @param v1   first value
    @param v2   second value
    @returns -1 if v1 < v2, 0 if v1==v2, and 1 if v1>v2
 **/
coherent.compareValues= function( v1, v2 )
{
    var v1_type= coherent.typeOf(v1);
    
    //  If the types aren't the same, compare these objects lexigraphically.
    if (v1_type!==coherent.typeOf(v2))
    {
        var s_v1= String(v1);
        var s_v2= String(v2);
        return s_v1.localeCompare( s_v2 );
    }
    switch (v1_type)
    {
        case "boolean":
        case "number":
            var v= (v1-v2);
            if (0===v)
                return v;
            return (v<0?-1:1);

        case "regex":
        case "function":
            //  use default (lexigraphical) comparison
            break;

        case "string":
        case "array":
        case "object":
            if (v1.localeCompare)
                return v1.localeCompare(v2);
            if (v1.compare)
                return v1.compare(v2);
            //  Otherwise use default (lexigraphical) comparison
            break;
        
        case 'undefined':
            return true;
            
        default:
            throw new TypeError( "Unknown type for comparison: " + v1_type );
    }
    //  Default comparison is lexigraphical of string values.
    return String(v1).localeCompare(String(v2));
}



/** Fix Prototype's habit of stomping on native Array methods **/
if ('undefined'!==typeof(window.Prototype))
{
    (function()
    {
        var methods= ['indexOf', 'lastIndexOf', 'forEach', 'filter', 'map', 'some',
                      'every', 'reduce', 'reduceRight'];

        for (var i=0; i<methods.length; ++i)
            delete Array.prototype[methods[i]];
    })();
}

/** Return an array containing the distinct elements from this array.
 **/
Array.prototype.distinct= function()
{
    var len= this.length;
    var result= new Array(len);
    var i;
    var e;
    var count= 0;
    
    for (i=0; i<len; ++i)
    {
        e= this[i];
        if (-1==result.indexOf(e))
            result[count++]= e;
    }
    //  trim to correct size
    result.length= count;
    return result;
}

/** Compare an array with another array.

    @param a    the other array
    @returns -1 if this array precedes a, 0 if the two arrays are equal, and 1
             if this array follows a.
 **/
Array.prototype.compare= function(a)
{
    var lengthDifference= this.length - a.length;
    if (0!==lengthDifference)
        return lengthDifference;
    var i;
    var len;
    var v;
    
    for (i=0, len=this.length; i<len; ++i)
    {
        v= coherent.compareValues(this[i], a[i]);
        if (0!==v)
            return v;
    }
    
    return 0;
}


/** @class
 *  An initialiser for a set-like object. The arguments passed to the
 *  initialiser function determine the values in the set. A Set may only have
 *  string members.
 *  
 *  You may invoke `Set` with either a single argument that is an array or with
 *  any number of arguments. If the only argument is an array, then the array
 *  will be turned into a set and returned. Otherwise, the set will be created
 *  with the individual arguments.
 *  
 *      var s1= Set(['a', 'b', 'c']);
 *      var s2= Set('a', 'b', 'c');
 *  
 *  In the previous example, the two constructors yield the same value.
 **/
function Set()
{
    var s= this;
    if (s.constructor!==Set)
        s= new Set();
        
    var args= arguments;
    if (1==args.length && args[0] instanceof Array)
        args= args[0];
    var i;
    var len= args.length;
    for (i=0; i<len; ++i)
        s[args[i]]= true;
    return s;
}

/** Union two sets. This is not placed as a method on individual sets because
    then it would show up as a member of the set. Note: this function will work
    on regular objects with somewhat unpredictable results.
    
    @param s1   first set
    @param s2   second set
    @returns a new Set object that contains all the elements from s1 & s2
 **/
Set.union= function( s1, s2 )
{
    var s3= Object.clone(s1);
    if (!s2)
        return s3;
    var p;
    for (p in s2)
        s3[p]= true;
    return s3;
}

/** Intersect two sets.
 *  
 *  @param s1   first set
 *  @param s2   second set
 *  @returns the intersection of sets 1 and 2.
 */
Set.intersect= function(s1, s2) {
    var s3= new Set();
    var p;
    for (p in s1) {
        if (p in s2)
            s3[p]= true;
    }
    return s3;
}

/** Add an entry to a set. This is implemented as a non-member method because
    otherwise the method name would appear as a member of the set.

    @param set  the set to modify
    @param key  the key to add to the set.
    @returns the original set.
 **/
Set.add= function( set, key )
{
    set[key]= true;
    return set;
}

/** Remove an entry from a set. Like add, this is implemented as a non-member
    method to prevent it from appearing in the set itself.

    @param set  the set to modify
    @param key  the key to remove from the set.
    @returns the original set.
 **/
Set.remove= function( set, key )
{
    delete set[key];
    return set;
}

/** Convert a set to an array. See add & remove for why this is implemented as
    a non-member method.
    
    @param set  the set to convert to an array
    @returns an array containing the elements in the set
 **/
Set.toArray= function( set )
{
    var e;
    var a= [];
    for (e in set)
        a.push(e);
    return a;
}

/** Iterate over the contents of the set.
 *
 *  @param set      the set to iterate
 *  @param fn       the function to call for each value in the set
 *  @param scope    (optional) an object to pass as the scope for fn
 */
Set.forEach= function(set, fn, scope)
{
    var e;
    var i=0;
    for (e in set)
        fn.call(scope, e, i++);
}

/** Create a helpful alias for making a Set.
 **/
var $S= Set;




/** Function that will create an error constructor. This takes care of
 *  differences between browsers, except of course that MSIE simply doesn't
 *  support custom error types very well. This function allows you to have a
 *  custom initialiser for error types simply by defining a function with the
 *  same name as the error type.
 *  
 *  The return value of this function is the constructor for the new error type.
 *  If there's no custom constructor, this return value should be assigned to a
 *  global variable with the same name as the error type. That way new instances
 *  of the error can be created.
 *
 *  @param errorName    the name of the error subclass -- also the name of the
 *                      initialiser function
 *  @returns a function that is the constructor for the new error type.
 **/
coherent.defineError= function( errorName )
{
    function error(message)
    {
        this.message= message;
    }
    error.prototype= new Error;
    error.prototype.constructor= error;
    error.prototype.name= errorName;
    return error;
}

var InvalidArgumentError= coherent.defineError( "InvalidArgumentError" );


/** Add console & console.log for browsers that don't support it. **/
if ("undefined"==typeof(window.console))
    window.console= {};
if ('undefined'==typeof(window.console.log))
    window.console.log= function(){};

// Mozilla 1.8 & Safari 420+ has support for indexOf, lastIndexOf, forEach, filter, map, some, every
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, fromIndex) {
		if ('undefined'===typeof(fromIndex)) {
			fromIndex = 0;
		} else if (fromIndex < 0) {
			fromIndex = Math.max(0, this.length + fromIndex);
		}
		for (var i = fromIndex; i < this.length; i++) {
			if (this[i] === obj)
				return i;
		}
		return -1;
	};
}
if (!Array.indexOf)
    Array.indexOf= function(array, obj, fromIndex) {
        return Array.prototype.indexOf.call(array, obj, fromIndex);
    }

// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
if (!Array.prototype.lastIndexOf) {
	Array.prototype.lastIndexOf = function(obj, fromIndex) {
		if ('undefined'===typeof(fromIndex)) {
			fromIndex = this.length - 1;
		} else if (fromIndex < 0) {
			fromIndex = Math.max(0, this.length + fromIndex);
		}
		for (var i = fromIndex; i >= 0; i--) {
			if (this[i] === obj)
				return i;
		}
		return -1;
	};
}
if (!Array.lastIndexOf)
    Array.lastIndexOf= function(array, obj, fromIndex) {
        return Array.prototype.lastIndexOf.call(array, obj, fromIndex);
    }

// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:forEach
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(f, obj) {
		var l = this.length;	// must be fixed during loop... see docs
		for (var i = 0; i < l; i++) {
			f.call(obj, this[i], i, this);
		}
	};
}
if (!Array.forEach)
    Array.forEach = function(array, f, obj) {
        return Array.prototype.forEach.call(array, f, obj);
    }
    
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:filter
if (!Array.prototype.filter) {
	Array.prototype.filter = function(f, obj) {
		var l = this.length;	// must be fixed during loop... see docs
		var res = [];
		for (var i = 0; i < l; i++) {
			if (f.call(obj, this[i], i, this)) {
				res.push(this[i]);
			}
		}
		return res;
	};
}
if (!Array.filter)
    Array.filter= function(array, f, obj) {
        return Array.prototype.filter.call(array, f, obj);
    }
    
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:map
if (!Array.prototype.map) {
	Array.prototype.map = function(f, obj) {
		var l = this.length;	// must be fixed during loop... see docs
		var res = [];
		for (var i = 0; i < l; i++) {
			res.push(f.call(obj, this[i], i, this));
		}
		return res;
	};
}
if (!Array.map)
    Array.map= function(array, f, obj) {
        return Array.prototype.map.call(array, f, obj);
    }
    
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:some
if (!Array.prototype.some) {
	Array.prototype.some = function(f, obj) {
		var l = this.length;	// must be fixed during loop... see docs
		for (var i = 0; i < l; i++) {
			if (f.call(obj, this[i], i, this)) {
				return true;
			}
		}
		return false;
	};
}
if (!Array.some)
    Array.some= function(array, f, obj) {
        return Array.prototype.some.call(array, f, obj);
    }
    
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:every
if (!Array.prototype.every) {
	Array.prototype.every = function(f, obj) {
		var l = this.length;	// must be fixed during loop... see docs
		for (var i = 0; i < l; i++) {
			if (!f.call(obj, this[i], i, this)) {
				return false;
			}
		}
		return true;
	};
}
if (!Array.every)
    Array.every = function(array, f, obj) {
        return Array.prototype.every.call(array, f, obj);
    }

// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduce
if (!Array.prototype.reduce)
    Array.prototype.reduce = function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);

        for (; i < len; i++)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    }
    
if (!Array.reduce)
    Array.reduce= function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduce.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduce.apply(array, fun);
    }
    
// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:reduceRight    
if (!Array.prototype.reduceRight)
    Array.prototype.reduceRight = function(fun /*, initial*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (0===len && 1===arguments.length)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2)
            var rv = arguments[1];
        else
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);

        for (; i >= 0; i--)
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);

        return rv;
    }

if (!Array.reduceRight)
    Array.reduceRight= function(array, fun /*, initial*/)
    {
        if (arguments.length>2)
            return Array.prototype.reduceRight.apply(array, fun, arguments[2]);
        else
            return Array.prototype.reduceRight.apply(array, fun);
    }



/**
 *  @namespace
 */
var Class= (function(){

    /** The names of methods which should be plucked out of the class definition
     *  and promoted to static methods.
     */
    var pseudoStaticMethodNames= ['__subclassCreated__', '__factory__'];
    
    /** Wrap a constructor function so that it may invoke the base constructor.
     *  @param construct    the original constructor function
     *  @param superclass   the superclass' constructor function
     *  @returns a wrapped function which sets up the base method correctly.
     *
     *  @inner
     */
    function wrapConstructorForBase(construct, superclass)
    {
        var wrapped;
        
        if (!construct && !superclass)
            return construct;
            
        if (!construct)
            wrapped= function()
            {
                superclass.apply(this, arguments);
            };
        else
        {
            var callsBase= /this\.base/.test(construct);

            if (!callsBase && !superclass)
                return construct;
                
            if (!callsBase)
                wrapped= function()
                {
                    superclass.call(this);
                    construct.apply(this, arguments);
                };
            else
                wrapped= function()
                {
                    var prev= this.base;
                    this.base= superclass||function(){};
                    try
                    {
                        construct.apply(this, arguments);
                    }
                    finally
                    {
                        this.base= prev;
                    }
                };
        }
        
        wrapped.valueOf= function()
        {
            return construct;
        }
        wrapped.toString= function()
        {
            return String(construct);
        }
        return wrapped;
    }
    
    /** Create a constructor for a class. Depending on whether the constructor
     *  exists, the superclass exists, and whether the constructor calls its
     *  ancestor constructor, this function returns a wrapper function that
     *  is invoked first.
     *  
     *  @inner
     *  @param construct    the actual constructor for the new class
     *  @param [superclass] the constructor for the superclass
     *  @returns a wrapped function which calls the __postConstruct hook if the
     *           class defines one.
     */
    function makeConstructor(construct, superclass)
    {
        if (construct && !(construct instanceof Function))
            throw new Error('Invalid constructor');
        if (superclass && !(superclass instanceof Function))
            throw new Error('Invalid superclass');
        
        //  Remove the postConstruct wrapping around the constructor for the
        //  superclass.
        superclass= superclass?superclass.valueOf():null;
        
        //  If the constructor calls this.base, wrap it with the appropriate
        //  stuff.
        construct= wrapConstructorForBase(construct, superclass);

        var wrapped;
        
        if (construct)
            wrapped= function()
            {
                construct.apply(this, arguments);
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();
            };
        else
            wrapped= function()
            {
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();
            }
            
        //  make wrapped constructor look like the original
        wrapped.valueOf= function()
        {
            return construct;
        }
        wrapped.toString= function()
        {
            return String(construct||wrapped);
        }
        return wrapped;
    }

    /** Create a prototype with the minimum amount of closure baggage.
     *  @param superclass   the constructor of the superclass which should be
     *                      created as the prototype
     *  @returns a new prototype based on the superclass
     *  @inner
     */
    function makePrototype(superclass)
    {
        function silent() {}
        silent.prototype= superclass.prototype;
        return new silent();
    }

    /** Create a method wrapper that has access to the base method. Because
     *  of the wrapping of methods, I define a valueOf member on the wrapped
     *  method to return the original method. That allows the code to determine
     *  whether this method is the same as another.
     *  
     *  @param method   a reference to the method which may call `this.base(...)`
     *  @param ancestorMethod   a reference to the method which should be called
     *                          when the method calls `this.base(...)`.
     *  @returns a new function which sets up the base method
     *  @inner
     */
    function wrapMethodForBase(method, ancestorMethod)
    {
        if (!method || !/this\.base/.test(method))
            return method;
            
        function fn()
        {
            try
            {
                var prev= this.base;
                this.base= ancestorMethod||function(){};
                return method.apply(this, arguments);
            }
            finally
            {
                //  no matter WHAT happens in method, base will be restored
                this.base= prev;
            }
        }
        fn.valueOf= function()
        {
            return method;
        }
        fn.toString= function()
        {
            return String(method);
        }
        return fn;
    }
    
    /** Add a member to the prototype for a new class. If the value is a
     *  function, determine whether it calls 'this.base' to access its ancestor
     *  method and if so, wrap it in a closure which provides access to the
     *  ancestor method.
     *  
     *  @param proto    a reference to the prototype to which the member should
     *                  be added
     *  @param name     the name with which the member should be inserted
     *  @param value    the value of the new member
     *  @returns the value inserted as the new member (which might have been
     *           wrapped if it was a function)
     *  @inner
     */
    function addMember(proto, name, value)
    {
        var ancestorValue= proto[name];

        //  determine whether value is a function that calls this.base()
        if (ancestorValue instanceof Function &&
            value instanceof Function &&
            ancestorValue.valueOf()!=value.valueOf())
        {
            value= wrapMethodForBase(value, ancestorValue);
        }

        proto[name]= value;
        
        return value;
    }

    /** Walk the class hierarchy to call the __subclassCreated__ hooks if
     *  present. Passes a reference to the newClass constructor.
     *  
     *  @param newClass the new class that is being created
     *  @inner
     */
    function postSubclassNotification(newClass)
    {
        var klass;
        for (klass= newClass.superclass; klass; klass=klass.superclass)
            if ('__subclassCreated__' in klass)
                klass.__subclassCreated__(newClass);
    }

    /** @scope Class */
    return {
    
        /** Create a class. This attempts to mimic classical OOP programming
         *  models in JavaScript. The first parameter (superclass) is optional
         *  and if not specified, the new class will have no superclass. The
         *  syntax is a bit awkward (what would you expect of trying to mimic
         *  a programming model that isn't _really_ supported), but it seems
         *  to be prevelant out there on the Internets.
         *  
         *      var Animal= Class.create( {
         *          constructor: function(name)
         *          {
         *              ...
         *          }
         *      });
         *  
         *  The constructor member of the class declaration is the method which
         *  will be invoked when your script executes: `new Animal(...)`. But
         *  there may be some wrapping magic going on to make inheritence work
         *  better. For example:
         *  
         *      var Cat= Class.create(Animal, {
         *          constructor: function(name, breed)
         *          {
         *              this.base(name);
         *              this.breed= breed;
         *          }
         *      });
         *  
         *  There's no _real_ base member, but `Class.create` actually creates
         *  a wrapper function which temporarily stashes the ancestor method
         *  in base and removes it when the method is finished. This works for
         *  any method.
         *  
         *  Additionally, you may define a class method (`__subclassCreated__`)
         *  which will be called each time a new class is created using your
         *  class as a superclass or ancestor class. The following example
         *  defines a subclass hook function for the `Animal` class:
         *  
         *      Animal.__subclassCreated__= function(newClass)
         *      {
         *      ...
         *      }
         *  
         *  Finally, classes may define a `__postConstruct` method which will be
         *  called after all constructors are invoked. In the case of Views,
         *  the `__postConstruct` method invokes their `init` method if the
         *  DOM node is available or schedules the `init` method if the DOM has
         *  not finished loading.
         *  
         *  @param [superclass] a reference to the super class for this class.
         *                      If no superclass is specified, the new class
         *                      will inherit from Object.
         *  @param decl an object literal declaring the instance members for the
         *              class. These members will be created on the prototype
         *              for the class. So be careful about using object literals
         *              within this declaration, because they may not work as
         *              you might be expecting -- they will be shared among all
         *              instances.
         *  
         *  @returns a reference to a constructor function that will be used to
         *           initialise instances of this class.
         */
        create: function(superclass, decl)
        {
            var construct;
            var proto= {};

            switch (arguments.length)
            {
                case 0:
                    throw new TypeError('Missing superclass and declaration arguments');
            
                case 1:
                    decl= superclass;
                    superclass= undefined;
                    break;
                
                default:
                    proto= makePrototype(superclass);
                    break;
            }

            //  Allow decl to be a function that returns an object
            if ('function'==typeof(decl))
            {
                decl= decl();
                if (!decl)
                    throw new Error('Class declaration function did not return a prototype');
            }
            
            if (decl.hasOwnProperty('constructor'))
            {
                construct= decl['constructor'];
                delete decl['constructor'];
            }
            
            construct= makeConstructor(construct, superclass);
            
            construct.prototype= proto;
            construct.prototype.constructor= construct;
            construct.superclass= superclass;
            
            function promotePseudoStaticMethod(methodName)
            {
                var method= decl[methodName];
                if (!method)
                    return;
                construct[methodName]= method;
                delete decl[methodName];
            }
            pseudoStaticMethodNames.forEach(promotePseudoStaticMethod);
            
            this.extend(construct, decl);
        
            postSubclassNotification(construct);
        
            return construct;
        },

        /** Determine the name of the property of an object with the given
         *  value. Because the property value might appear more than once in
         *  a given object, this function might not be definitive. But for
         *  things like methods (which seldom appear more than once), it
         *  should be good enough.
         *  
         *  @returns the name of the property having the given value or null
         *  if the name could not be determined.
         */
        findPropertyName: function(obj, propertyValue)
        {
            for (var p in obj)
                if (obj[p]===propertyValue)
                    return p;
            return null;
        },
        
        /** Extend a class definition with the elements of an object literal.
         *  If the host JavaScript environment supports getters and setters
         *  (Firefox 2.0, Safari 3, SpiderMonkey, and Rhino) then this function
         *  will create appropriate getters and setters rather than copying
         *  the value.
         *  
         *  @function
         *  @param class    a reference to the constructor for the class which
         *                  should be extended
         *  @param decl     an object literal defining the members to add to the
         *                  class prototype
         *  
         *  @returns the original class object.
         */
        extend: (function(){
            if (coherent.Support.Properties)
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            var v;
        
                            for (var p in decl)
                            {
                                var g= decl.__lookupGetter__(p);
                                var s= decl.__lookupSetter__(p);
                                if (g || s)
                                {
                                    g && proto.__defineGetter__(p, g);
                                    s && proto.__defineSetter__(p, s);
                                }
                                else
                                    addMember(proto, p, decl[p]);
                            }

                            return klass;
                        };
            else
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            for (var p in decl)
                                addMember(proto, p, decl[p]);
                        };
        })()
    };
    
})();


coherent.Error= Class.create({

    constructor: function(details)
    {
        Object.applyDefaults(this, details);
    }
    
});






/** Constructor for the data kept for each observable/observed key.
 *  
 *  @property __uid An unique identifier for this key info, used in creating the
 *                  parent link information.
 *  @property reader    A reference to the getter function (if one exists) used
 *                      to retrieve the current value from an object.
 *  @property mutator   A reference to the setter function (if one exists) which
 *                      will be used to update the key for an object.
 *  @property validator A reference to the validation method (usually in the
 *                      form `validate` + key) which _may_ be invoked to
 *                      determine whether a value is valid. This method is
 *                      **never** called by `setValueForKey` and should only be
 *                      called by user interface code.
 *  @property key   The original key name that this KeyInfo object represents.
 *  @property mutable   Is the field with this key name mutable on objects? A
 *                      field is not mutable if a getter function exists but no
 *                      setter function exists.
 *  @property changeCount   The number of times `willChangeValueForKey` has been
 *                          called. This is decremented each time
 *                          `didChangeValueForKey` is called.
 *  
 *  @declare coherent.KeyInfo
 *  @private
 **/
coherent.KeyInfo= Class.create({

    /** Create a new KeyInfo object.
     *  
     *  @param {Object} obj the object on which the key is defined
     *  @param {String} key the name of the key to manage
     */
    constructor: function(obj, key)
    {
        var methods= coherent.KVO.getPropertyMethodsForKeyOnObject(key, obj);

        this.__uid= [key, coherent.generateUid()].join('_');

        //  store accessor & mutator
        this.reader= methods.getter;
        this.mutator= methods.mutator;
        this.validator= methods.validator;
        this.key= key;
        
        //  Obviously, a key is mutable if there's a mutator defined, but
        //  if the key has neither reader or mutator methods, then I
        //  access it via direct property access and the key is mutable
        this.mutable= ((this.mutator||!this.reader)?true:false);

        if (!this.reader && !this.mutator)
            this.mutable= true;

        //  changeCount is the number of times willChangeValueForKey has been
        //  called. This is decremented for each call to didChangeValueForKey.
        //  When this value returns to 0, a change notification is issued. The
        //  previous value is only cached for the first change.
        this.changeCount= 0;
        
        //  Setup initial parent link for value if there is one
        var value= methods.value;
        if (!value)
            return;
            
        var valueType= coherent.typeOf(value);
        if (valueType in coherent.KVO.typesOfKeyValuesToIgnore ||
            !value._addParentLink)
            return;

        value._addParentLink(obj, this);
    },
    
    /** Retrieve the value of this key for a given object. If the value can have
     *  a parent link, this method will create it.
     *  
     *  @param {coherent.KVO} obj   the KVO instance from which to fetch the
     *         value.
     *  @returns the current value of the key for the specified object
     */
    get: function(obj)
    {
        //  This is kind of tortured logic, because undefined is reserved to
        //  mean that there's a missing object in the keyPath chain. So the
        //  result of valueForKey should NEVER be undefined.

        if (this.reader)
            return this.reader.call(obj);
            
        var value;

        if (this.key in obj)
            value= obj[this.key];
        else
            value= null;
        
        if (value && value._addParentLink)
            value._addParentLink(obj, this);
            
        return value;
    },
    
    /** Store a new value for a given object. This method will call a mutator
     *  method if one exists, or otherwise will call `willChangeValueForKey`,
     *  update the field directly, and then call `didChangeValueForKey`.
     *  
     *  @param obj  the object to modify
     *  @param newValue the new value that will replace the old value.
     */
    set: function(obj, newValue)
    {
        if (this.mutator)
            this.mutator.call(obj, newValue);
        else
        {
            //  bracket modification of the value with change notifications.
            //  This should only ever be executed for MSIE or other browsers
            //  that don't support properties.
            obj.willChangeValueForKey(this.key, this);
            obj[this.key]= newValue;
            obj.didChangeValueForKey(this.key, this);
        }
    },
    
    /** Remove the parent link for this KeyInfo object. Child object reference
     *  the parentLink rather than the owner object directly. This gives the
     *  owner a method to disconnect from the child without maintaining a
     *  reference to the child.
     */
    unlinkParentLink: function()
    {
        if (!this.parentLink)
            return;
        this.parentLink.observer= null;
        this.parentLink.callback= null;
        this.parentLink= null;
    }

});




/** Enumerations for the types of changes.
 *  
 *  @property setting       a key's value has changed, the newValue property of
 *                          the change notification will contain the new value.
 *                          If the key represents an array, the newValue is the
 *                          new array.
 *  @property insertion     an element or elements have been inserted into an
 *                          array. The newValue property of the change
 *                          notification will contain the new elements. The
 *                          indexes property of the change notification will
 *                          contain the index at which each element was inserted.
 *                          The oldValue property will be null.
 *  @property deletion      an element or elements have been removed from an
 *                          array. The newValue property of the change
 *                          notification will be null. The oldValue property
 *                          will contain the elements removed from the array.
 *                          And the indexes property will contain the index of
 *                          each element that was removed.
 *  @property replacement   an element or elements have been replace in an array.
 *                          The newValue property of the change notification
 *                          contains the new values for each element.
 *                          The oldValue property contains the previous values
 *                          for each element. And the indexes property will
 *                          contain the index of each element replaced.
 *  
 *  @namespace
 **/
coherent.ChangeType=
{
    setting: 0,
    insertion: 1,
    deletion: 2,
    replacement: 3
};



    
/** Change notifications are the root of all updates.
 *  
 *  @property object    The object for which this update is being sent
 *  @property changeType    one of the values from {@link coherent.ChangeType}.
 *  @property newValue  The new value for the property
 *  @property oldValue  The previous value for the property
 *  @property indexes   If the change is for an array, this is an array of
 *                      modified indexes.
 *
 *  @declare coherent.ChangeNotification
 **/
coherent.ChangeNotification= Class.create({

    /** Initialise a new ChangeNotification instance.
     *  
     *  @param object       a reference to the object that has changed
     *  @param changeType   the type of change (@see coherent.ChangeType)
     *  @param newValue     the new value of the key
     *  @param oldValue     the old value of the key
     */
    constructor: function(object, changeType, newValue, oldValue, indexes)
    {
        this.object= object;
        this.changeType= changeType;
        this.newValue= newValue;
        this.oldValue= oldValue;
        this.indexes= indexes;
        this.objectKeyPath= [];
    },
    
    toString: function()
    {
        var str= "[ChangeNotification changeType: ";
        switch (this.changeType)
        {
            case coherent.ChangeType.setting:
                str+= "setting";
                break;
            
            case coherent.ChangeType.insertion:
                str+= "insertion";
                break;
        
            case coherent.ChangeType.deletion:
                str+= "deletion";
                break;
            
            case coherent.ChangeType.replacement:
                str+= "replacement";
                break;
            
            default:
                str+= "<<unknown>>";
                break;
        }
    
        str+= " newValue=" + this.newValue +
              " oldValue=" + this.oldValue +
              (this.indexes?" indexes=" + this.indexes.join(", "):"") + "]";
    
        return str;
    }
});




/** An ObserverEntry is an internal structure and probably doesn't hold much
 *  general value.
 *  
 *  @declare coherent.ObserverEntry
 *  @private
 *  
 *  @property observer  A reference to the object which will be used to call the
 *                      callback method.
 *  @property callback  A reference to a function which will be invoked when
 *                      changes occur.
 *  @property context   General purpose value which will be passed to the
 *                      observer method as the final parameter (context). This
 *                      is often used to construct the full key path from a
 *                      child notification.
 */
coherent.ObserverEntry=Class.create({

    /** Construct a new ObserverEntry
     */
    constructor: function(observer, callback, context)
    {
        this.observer= observer;
        this.callback= callback;
        this.context= context;
    },
    
    observeChangeForKeyPath: function(changeNotification, keyPath)
    {
        //  check to see whether this observer has already been notified
        if (!this.callback || !this.observer ||
            -1!==changeNotification.objectKeyPath.indexOf(this.observer))
            return;

        this.callback.call(this.observer, changeNotification, keyPath,
                           this.context);
    }
    
});




/** KVO is the base of all key value observing compliant classes. Classes which
 *  intend to participate in binding and change notifications should (probably)
 *  be subclasses of KVO.
 *  
 *  @property [__mutableKeys]   An array of keys which should be assumed to be
 *            the sum total mutable properties on the object or class,
 *            regardless of what introspection might otherwise reveal.
 *  
 *  @declare coherent.KVO
 */
coherent.KVO= Class.create({

    /** Initialiser for the KVO class. This doesn't actually do anything
     *  specific. Most initialisation is defered to exactly when it's needed.
     *  This is a practical decision rather than an optimisation decision,
     *  because objects which are not directly derived from coherent.KVO may be
     *  adapted for key value compliance. Therefore, the KVO constructor would
     *  not have executed for those objects.
     **/
    constructor: function()
    {
    },

    /** Set a value for a particular key path on the given object.

        @param value    the value to assign
        @param keyPath  where to store the value
    
        @throws InvalidArgumentError if the keyPath is null
     **/
    setValueForKeyPath: function(value, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
        {
            this.setValueForKey(value, keyPath[0]);
            return;
        }
        
        if ('@'==keyPath[0].charAt(0))
        {
            //  silently fail, because keyPaths with array operators are immutable.
            return;
        }

        //  Find the key value
        var object= this.valueForKey(keyPath[0]);
    
        if (!object)
            return;
                                    
        //  ask it to set the value based on the remaining key path
        object.setValueForKeyPath(value, keyPath.slice(1));
    },

    /** Set a value for a particular key on the given object. A key is a leaf
        attribute.
    
        @param value    the value to assign
        @param key      the name of the attribute to assign
    
        @throws InvalidArgumentError if a null key is used
     **/
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "key may not be empty" );

        //  can't change value of readonly attributes
        var keyInfo= this.infoForKey(key);
        if (!keyInfo || !keyInfo.mutable)
            return;

        keyInfo.set(this, value);
    },

    /** Retrieve the value for a particular key path on the given object.
     *
     *  @param keyPath  where to find the value
     *
     *  @returns the value of the given key or undefined if an object in the
     *           keypath chain was missing.
     *  
     *  @throws InvalidArgumentError if the keyPath is empty
     */
    valueForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
        
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.valueForKey( keyPath[0] );
        
        if ('@'==keyPath[0].charAt(0))
        {
            var operator= keyPath[0].substr(1);
            var values= this.valueForKeyPath( keyPath.slice(1) );
            return coherent.ArrayOperator[operator]( values );
        }

        //  Find the key value
        var object= this.valueForKey( keyPath[0] );
    
        //  if there is no value for the container, return null for the terminal
        //  value -- this makes bindings work for containers that haven't been
        //  created yet.
        if ('undefined'===typeof(object) || null===object)
            return undefined;
    
        //  ask it to get the value based on the remaining key path
        return object.valueForKeyPath(keyPath.slice(1));
    },

    /** Retrieve the value of a particular key for this object.

        @param key  the name of the attribute to retrieve.
    
        @returns the value of the key
        @throws InvalidArgumentError if the key is null
     **/
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "the key is empty" );
    
        var keyInfo= this.infoForKey(key);
    
        if (!keyInfo)
            return null;

        return keyInfo.get(this);
    },

    /** Determine whether the value may be assigned to the property represented
     *  by keyPath.
     *
     *  @param value    the value to validate
     *  @param keyPath  where to find the value
     *
     *  @returns a valid value or an instance of coherent.Error if the value
     *           could not be coerced into a valid value.
     *  
     *  @throws InvalidArgumentError if the keyPath is empty
     */
    validateValueForKeyPath: function(value, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
        
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.validateValueForKey(value, keyPath[0]);

        //  Find the key value
        var object= this.valueForKey(keyPath[0]);
    
        //  if there is no value for the container, then just return the
        //  value...
        //  TODO: Is this really correct?
        if ('undefined'===typeof(object) || null===object)
            return value;
    
        //  ask it to validate the value based on the remaining key path
        return object.validateValueForKeyPath(value, keyPath.slice(1));
    },


    /** Validate the value to be assigned to a key.
     *  
     *  @param value    the value to check
     *  @param key      the key to check
     *  
     *  @returns A valid value or an instance of coherent.Error to signify
     *           that the value could not be coerced into a valid value.
     *  
     *  @throws InvalidArgumentError if the key is null or empty.
     */
    validateValueForKey: function(value, key)
    {
        if (!key || !key.length)
            throw new InvalidArgumentError("missing key");
            
        var keyInfo= this.infoForKey(key);
        if (!keyInfo.validate)
            return true;
        return keyInfo.validate(value);
    },
    
    /** Change notification handler for property values. This handler receives a
     *  notification for changes to the key values of contained objects.
     *
     *  @private
     *
     *  @param change   a ChangeNotification object
     *  @param keyPath  the key path that has changed
     *  @param context  the context information original specified for this key
     **/
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        //  Pass this along up the change
        if (coherent.KVO.kAllPropertiesKey!=keyPath)
            keyPath= context + "." + keyPath;
        else
            keyPath= context;

        var changeClone= Object.clone(change);
        changeClone.object= this;
        this.notifyObserversOfChangeForKeyPath( changeClone, keyPath );
    },

    /** Discover information about the specified key.
     *
     *  @param keyPath  path to the attribute
     *
     *  @returns an instance of KeyInfo for the specified keyPath
     *
     *  @throws InvalidArgumentError if the keyPath is null
     **/
    infoForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.infoForKey(keyPath[0]);
        else if ('@'==keyPath[0].charAt(0))
        {
            //  Array operators make a keyPath immutable.
            var keyInfo= new coherent.KeyInfo(null, null);
            keyInfo.mutable= false;
            return keyInfo;
        }
        else
        {
            //  Find the key value
            var object= this.valueForKey(keyPath[0]);

            //  If an object along the way is null, then return that the key in
            //  question can't be read and can't be written.
            if (!object)
                return undefined;

            if (!object.infoForKeyPath)
                return undefined;
            //  ask it to set the value based on the remaining key path
            return object.infoForKeyPath(keyPath.slice(1));
        }
    },

    /** Discover information about the specified key.
     *
     *  @param keyPath  path to the attribute
     *
     *  @returns an instance of KeyInfo for the specified key
     *
     *  @throws InvalidArgumentError if the keyPath is null
     **/
    infoForKey: function(key)
    {
        var keyInfo;
    
        if (!this.__keys)
            this.__keys= {};
            
        if (coherent.KVO.kAllPropertiesKey==key)
            return null;
            
        keyInfo= this.__keys[key];
    
        if (keyInfo)
            return keyInfo;
        
        keyInfo= new coherent.KeyInfo(this, key);
    
        this.__keys[key]= keyInfo;
        return keyInfo;
    },
    
    /** Register dependent key for a set of keys. When any one of the set of
     *  keys changes, observers of the dependent key will be notified of a
     *  change to the dependent key. This is useful for a (read-only) composite
     *  value or similar.
     *  
     *  Consider declaring key dependencies via the keyDependencies prototype
     *  member instead of calling this method directly.
     *
     *  @param keys         an array of keys which will trigger a change
     *                      notification to the dependent key.
     *  
     *  @param dependentKey the name of a dependent key
     *  
     *  @throws InvalidArgumentError if either the keys or dependentKey is null.
     **/
    setKeysTriggerChangeNotificationsForDependentKey: function(keys, dependentKey)
    {
        if (!keys || !keys.length)
            throw new InvalidArgumentError("keys array is not valid");
    
        if (!dependentKey)
            throw new InvalidArgumentError("dependentKey can not be null");
        
        if (-1!==dependentKey.indexOf('.'))
            throw new InvalidArgumentError('dependentKey may not be a key path');
            
        var key;
        var keyInfo;
        var keyIndex;
        var dependentKeys;

        if (!this.__dependentKeys)
            this.__dependentKeys= {};

        for (keyIndex=0; keyIndex<keys.length; ++keyIndex)
        {
            key= keys[keyIndex];
            if (!key)
                throw new InvalidArgumentError("key at index " + keyIndex +
                                               " was null");

            if (!(key in this.__dependentKeys))
                this.__dependentKeys[key]= [];

            //  swizzle the getter/mutator methods if necessary for this key.
            coherent.KVO.getPropertyMethodsForKeyOnObject(key, this);
            
            dependentKeys= this.__dependentKeys[key];

            if (-1==dependentKeys.indexOf(dependentKey))
                dependentKeys.push(dependentKey);
        }
    },

    /** Determine the list of mutable keys.
        @returns an array of the names of the mutable keys.
     **/
    mutableKeys: function()
    {
        var keys=[];
        var k;
        var v;
        var firstChar;
    
        //  If there is a __mutableKeys property, return that instead of calculating
        //  the list of mutable keys.
        if ("__mutableKeys" in this && this.__mutableKeys.concat)
            return this.__mutableKeys;
        
        var keysToIgnore= Set.union(coherent.KVO.keysToIgnore, this.__keysToIgnore);
    
        for (k in this)
        {
            if (k in keysToIgnore || '__'===k.substr(0,2))
                continue;
            
            v= this[k];
            //  If it isn't a function, then it is inherently mutable.
            if ('function'!==typeof(v))
            {
                keys.push(k);
                continue;
            }
        
            //  Setters must have only one argument and begin with 'set',
            //  ignore everything else.
            if (1!==v.length || 'set'!==k.substr(0,3))
                continue;

            //  Setters must have a uppercase letter following the 'set' prefix.
            firstChar= k.charAt(3);
            if (firstChar!==firstChar.toUpperCase())
                continue;

            //  Keys begin with a lowercase letter.
            k= firstChar.toLowerCase() + k.substr(4);
        
            //  Only add the key if I didn't already see a non-function property
            //  with the same name.
            if (-1===keys.indexOf(k))
                keys.push(k);
        }
    
        return keys;
    },

    /** Initialise Key Value Observing for this object.
     **/
    initialiseKeyValueObserving: function()
    {
        //  Setting observers early helps prevent cycles when initialising
        //  key-value observing
        this.__uid= coherent.generateUid();
        this.__observers= {};
    },

    _addParentLink: function(parent, keyInfo, uid)
    {
        if (!this.hasOwnProperty('__observers'))
            this.initialiseKeyValueObserving();

        var parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (!parentObservers)
            parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey]= {};
        
        uid= uid||keyInfo.__uid;
        var parentLink= new coherent.ObserverEntry(parent,
                                    parent.observeChildObjectChangeForKeyPath,
                                    keyInfo?keyInfo.key:'');
                                    
        //  already has parent link
        if (uid in parentObservers)
            return;

        parentObservers[uid]= parentLink;

        if (!keyInfo)
            return;
            
        keyInfo.unlinkParentLink();
        keyInfo.parentLink= parentLink;
    },
    
    _removeParentLink: function(parent, keyInfo, uid)
    {
        if (!this.__observers)
            return;
            
        var parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (!parentObservers)
            parentObservers= this.__observers[coherent.KVO.kAllPropertiesKey]= {};
        
        uid= uid||keyInfo.__uid;

        if (keyInfo && keyInfo.parentLink===parentObservers[uid])
            keyInfo.unlinkParentLink();

        //  remove the parent link
        delete parentObservers[uid];
    },
    
    /** Register for changes to a particular key path.
     *
     *  @param observer     the object interested in changes to the value of key
     *                      path
     *  @param callback     (optional) the function to call when the key changes,
     *                      defaults to "observeChangesForKeyPath"
     *  @param keyPath      the key path of interest
     *  @param context      a value passed back to the callback -- meaningful only
     *                      to the observer
     *  
     *  @throws InvalidArgumentError when the keypath is empty, observer is null,
     *          callback is null.
     **/
    addObserverForKeyPath: function(observer, callback, keyPath, context)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );
                                    
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!callback)
            callback= observer["observeChangeForKeyPath"];
            
        if (!callback)
            throw new InvalidArgumentError( "No callback method specified" );

        if (!this.hasOwnProperty('__observers'))
            this.initialiseKeyValueObserving();

        if (!this.__observers[keyPath])
        {
            //  fetch the keyInfo for this keyPath, to swizzle setter methods
            //  along the path to fire willChange/didChange methods.
            this.infoForKeyPath(keyPath);
            this.__observers[keyPath]= [];
        }
        
        var observerEntry= new coherent.ObserverEntry(observer, callback,
                                                      context);

        this.__observers[keyPath].push(observerEntry);
    },

    /** Remove an observer for a keyPath.
     *
     *  @param keyPath          the key path of interest
     *  @param observer         the object interested in changes to the value of key
     *                          path
     **/
    removeObserverForKeyPath: function(observer, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
                                    
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!this.__observers || !this.__observers[keyPath])
            return;

        var allObservers= this.__observers[keyPath];
        var entryIndex=-1;
        var entry;
        var len= allObservers.length;
    
        //  TODO: This could be faster... It shouldn't be necessary to scan
        //  the entire list of observers.
        for (entryIndex=0; entryIndex<len; ++entryIndex)
        {
            entry= allObservers[entryIndex];
            if (entry.observer==observer)
            {
                allObservers.splice(entryIndex, 1);
                return;
            }
        }
    },

    /** Prepares for a later invocation of didChangeValueForKey by caching the
     *  previous value in the key's KeyInfo structure. Should be called for manual
     *  KVO implementation.
     *
     *  @param key  the key that has changed
     *  @throws InvalidArgumentError if the key is null
     **/
    willChangeValueForKey: function(key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError("key may not be null");

        keyInfo= keyInfo || this.infoForKey(key);
        if (!keyInfo)
            return;

        //  Only remember the previous value the first time
        //  willChangeValueForKey is called.
        if (1!==++keyInfo.changeCount)
            return;
            
        keyInfo.previousValue= keyInfo.get(this);
    },

    /** Invoked to notify observers that the value has changed.
     *
     *  @param key  the key that has changed
     **/
    didChangeValueForKey: function(key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= keyInfo || this.infoForKey(key);
        if (!keyInfo)
            return;

        //  If this isn't the final call to didChangeValueForKey, don't issue
        //  the change notification.
        if (0!==--keyInfo.changeCount)
            return;
        
        var newValue= keyInfo.get(this);
        var previousValue= keyInfo.previousValue;
        keyInfo.previousValue= null;
        
        if (newValue===previousValue)
            return;
            
        var change= new coherent.ChangeNotification(this,
                                                    coherent.ChangeType.setting,
                                                    newValue, previousValue);
        this.notifyObserversOfChangeForKeyPath(change, key);
        
        //  stop observing changes to old value
        if (previousValue && previousValue._removeParentLink)
            previousValue._removeParentLink(this, keyInfo);

        //  observe changes to the new value
        if (newValue && newValue._addParentLink)
            newValue._addParentLink(this, keyInfo);
    },

    /** Change notifications for arrays... Not implemented yet.
     *  @private
     */
    willChangeValuesAtIndexesForKey: function(changeType, indexes, key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError("key may not be null");

        keyInfo= keyInfo || this.infoForKey(key);
        if (!keyInfo)
            return;

        //  Only remember the previous value the first time
        //  willChangeValueForKey is called.
        if (1!==++keyInfo.changeCount)
            return;
        
        var types= coherent.ChangeType;
        var value;
        
        switch (changeType)
        {
            case types.insertion:
                keyInfo.previousValue= [];
                break;

            case types.deletion:
                value= keyInfo.get();
                keyInfo.previousValue= value.objectsAtIndexes(indexes);
                break;
                
            case types.replacement:
                break;
            
            default:
                throw new InvalidArgumentError('invalid change type');
                break;
        }
    },
    
    /** Change notifications for arrays...
     *  @private
     */
    didChangeValuesAtIndexesForKey: function(changeType, indexes, key, keyInfo)
    {
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        keyInfo= keyInfo || this.infoForKey(key);
        if (!keyInfo)
            return;

        //  If this isn't the final call to didChangeValueForKey, don't issue
        //  the change notification.
        if (0!==--keyInfo.changeCount)
            return;
        
    },
    
    /** Notify all observers that the specified keyPath has changed. Not usually
     *  called by external code.
     *
     *  @param change   An instance of {@link coherent.ChangeNotification}
     *  @param change.newValue     new value of the key
     *  @param change.oldValue     original value of the key
     *  @param change.changeType   what kind of change is this
     *  @param keyPath      path to the key that has changed
     **/
    notifyObserversOfChangeForKeyPath: function(change, keyPath)
    {
        if (!keyPath)
            throw new InvalidArgumentError( "keyPath may not be null" );
    
        //  Nothing to do if no-one is observing changes in this object
        if (!this.__observers)
            return;

        var observerIndex;
        var observers;
        var len;
        
        //  First notify containers -- registered as observers for the
        //  KVO.kAllPropertiesKey key
        observers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (observers)
        {
            var changeClone= Object.clone(change);
            var objectKeyPathLength= change.objectKeyPath.length;
            change.objectKeyPath.push(this);

            try
            {
                for (observerIndex in observers)
                {
                    var o= observers[observerIndex];
                    o.observeChangeForKeyPath(changeClone, keyPath);
                }
            }
            finally
            {
                //  restore the length of the objectKeyPath array
                change.objectKeyPath.length= objectKeyPathLength;
            }
        }
    
        //  don't bother with the rest of notifications for whole-object changes
        if (coherent.KVO.kAllPropertiesKey==keyPath)
            return;
        
        //  Next notify actual observers for the specified keyPath
        observers= this.__observers[keyPath];
        if (observers && observers.length)
        {
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
                observers[observerIndex].observeChangeForKeyPath(change, keyPath);
        }
    
        //  Notify observers for a subkey: for example, if someone is observing
        //  foo.bar.baz and foo.bar is changed, a change notification should
        //  be sent out for baz.
        var subkey= keyPath + ".";
        var subkeyLength= subkey.length;
        var restOfKeyPath;
        var observerKeyPath;
        var subkeyChange;
        var oldSubValue;
        var newSubValue;
    
        for (observerKeyPath in this.__observers)
        {
            if (observerKeyPath.substr(0, subkeyLength)!=subkey)
                continue;

            observers= this.__observers[observerKeyPath];
            if (!observers || !observers.length)
                continue;
            
            restOfKeyPath= observerKeyPath.substr(subkeyLength);

            oldSubValue= change.oldValue;
            if (oldSubValue && oldSubValue.valueForKeyPath)
                oldSubValue= oldSubValue.valueForKeyPath(restOfKeyPath);
            else
                oldSubValue= null;
            newSubValue= change.newValue;
            if (newSubValue && newSubValue.valueForKeyPath)
                newSubValue= newSubValue.valueForKeyPath(restOfKeyPath);
            else
                newSubValue= null;
            subkeyChange= new coherent.ChangeNotification(change.object,
                                                      change.changeType,
                                                      newSubValue, oldSubValue,
                                                      change.indexes);
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
            {
                observers[observerIndex].observeChangeForKeyPath(subkeyChange,
                                                               observerKeyPath);
            }
        }

        //  Finally, trigger dependent keys
        if (this.__dependentKeys && (keyPath in this.__dependentKeys))
        {
            var dependentKeys= this.__dependentKeys[keyPath];

            var dependentValue;
            var dependentChange;
            var dependentKey;
            var keyIndex=0;
            var dot;
            var obj= this;

            len= dependentKeys.length;
            for (keyIndex=0; keyIndex<len; ++keyIndex)
            {
                dependentKey= dependentKeys[keyIndex];
                dependentValue= obj.valueForKey(dependentKey);

                dependentChange= new coherent.ChangeNotification(obj,
                                                    coherent.ChangeType.setting,
                                                    dependentValue, null);
                obj.notifyObserversOfChangeForKeyPath(dependentChange,
                                                      dependentKey);
            }
        }
    }
});

//  Internal key used for observing property changes to a KVO-compliant object
coherent.KVO.kAllPropertiesKey= "*";

/** Set of keys which should be ignored when computing the list of mutable keys
 *  and when adapting an existing object.
 */
coherent.KVO.keysToIgnore= $S("__keys","__observers","__keysToIgnore",
                              "__dependentKeys", "__mutableKeys" );

/** Set of value types which will be ignored when adapting an object and when
 *  attempting to observe child object changes.
 */
coherent.KVO.typesOfKeyValuesToIgnore= $S("string", "number", "boolean", "date",
                                          "regex", "function");


/** Private method for getting property methods for an object.
 *  @private
 *  @function
 */
coherent.KVO.getPropertyMethodsForKeyOnObject= (function(){

    /** Create property getter/setter methods for a key. The actual value of the
     *  key will be stored in __kvo_prop_+key. The getter and setter methods
     *  will automatically call willChange & didChange and addParentLink.
     *  
     *  @param key  the name of the key to wrap
     *  @param [privateKey] the name of the private key to use.
     *  
     *  @inner
     */
    function createPropertyMethods(key, privateKey)
    {
        privateKey= privateKey || '__kvo_prop_' + key;
        
        var methods= {
        
            getter: function()
            {
                var value= null;
                if (privateKey in this)
                    value= this[privateKey];
                var keyInfo= this.__keys?this.__keys[key]:null;
                if (!keyInfo)
                    return value;
                    
                if (value && value._addParentLink)
                    value._addParentLink(this, keyInfo);
                else
                    keyInfo.unlinkParentLink();
                return value;
            },
            
            mutator: function(newValue)
            {
                this.willChangeValueForKey(key);
                //  Change undefined values to null, because undefined is used
                //  as a marker that an object in the hierarchy didn't exist.
                if ('undefined'===typeof(newValue))
                    newValue= null;
                this[privateKey]= newValue;
                this.didChangeValueForKey(key);
            }
            
        };
        
        //  Setting the __key property on the mutator to the name of the key
        //  allows us to tell that this function was created by the library.
        methods.mutator.__key= key;
        methods.getter.__key= key;
        
        return methods;
    }
    
    /** Create a wrapper function that will invoke willChange before
     *  calling the original mutator and didChange after calling the
     *  original mutator.
     *  
     *  @param mutator  the original mutator function to wrap
     *  @param key      the name of the key
     *  @returns a wrapped function
     *  
     *  @inner
     */
    function wrapMutatorWithChangeNotificationForKey(mutator, key)
    {
        function wrapped(value)
        {
            this.willChangeValueForKey(key);
            mutator.call(this, value);
            this.didChangeValueForKey(key);
        }
        wrapped.__key= key;
        wrapped.valueOf= function()
        {
            return mutator;
        }
        wrapped.toString= function()
        {
            return String(mutator);
        }
        return wrapped;
    }

    /** Create a wrapped getter function which will ensure that the parent link
     *  is added to all property values.
     *  
     *  @param getter   the original getter function to wrap
     *  @param key      the name of the key
     *  @returns a wrapped function
     *  
     *  @inner
     */
    function wrapGetterWithAddParentLinkForKey(getter, key)
    {
        function wrapped()
        {
            var value= getter.call(this);
            var keyInfo= this.__keys?this.__keys[key]:null;
            if (!keyInfo)
                return value;

            if (value && value._addParentLink)
                value._addParentLink(this, keyInfo);
            else
                keyInfo.unlinkParentLink();
                
            return value;
        }
        wrapped.__key= key;
        wrapped.valueOf= function()
        {
            return getter;
        }
        wrapped.toString= function()
        {
            return String(getter);
        }
        return wrapped;
    }
    
    /** The actual implementation of getPropertyMethodsForKeyOnObject for
     *  browsers that support JavaScript getters and setters.
     *  
     *  @inner
     */
    function getPropertyMethodsForKeyOnObject(key, obj)
    {
        var proto= obj.constructor.prototype;
        var objectIsPrototype= (proto==obj);
        var where= (proto!=Object.prototype &&
                    proto!=coherent.KVO.prototype)?proto:obj;

        var keyAsTitle= key.titleCase();
        var getterName= "get" + keyAsTitle;
        var mutatorName= "set" + keyAsTitle;
        var validatorName= "validate" + keyAsTitle;
        var getter;
        var mutator;
        var value;
        var validator= obj[validatorName];
        
        //  Are the getter & mutator properties?
        var properties= ('undefined'!==typeof(getter=obj.__lookupGetter__(key)) &&
                         'undefined'!==typeof(mutator=obj.__lookupSetter__(key)));

        if (!properties)
        {
            getterName= (getterName in obj)?getterName:key;
            getter= obj[getterName];
            mutator= obj[mutatorName];
        }

        //  If the getter isn't a function, then there can be no mutator
        if ('function'!==typeof(getter))
        {
            var privateKey= '__kvo_prop_' + key;
            var methods= createPropertyMethods(key, privateKey);

            //  determine whether to remember the initial value
            if (key in obj)
            {
                value= obj[privateKey]= ('undefined'==typeof(getter)?null:getter);
                delete obj[key];
            }
            
            getter= methods.getter;
            mutator= methods.mutator;
            properties= true;
        }
        else
        {
            //  reader is a function, so mutator must also be a function,
            //  check to make certain they have the correct number of arguments
            if (0!==getter.length)
                getter= null;
            if (mutator && 1!==mutator.length)
                mutator= null;

            //  determine the initial value of the key, can't be after wrapping
            //  the getter because the KeyInfo might not yet be created...
            if (getter && !objectIsPrototype)
                value= getter.valueOf().call(obj);

            //  If the getter hasn't already been wrapped to call _addParentLink
            //  wrap it now
            if (getter && key!==getter.__key)
                getter= wrapGetterWithAddParentLinkForKey(getter, key);
                
            //  If the mutator hasn't already been wrapped to call willChange &
            //  didChange, wrap it now
            if (mutator && key!==mutator.__key)
                mutator= wrapMutatorWithChangeNotificationForKey(mutator, key);
        }
        
        if (properties)
        {
            where.__defineGetter__(key, getter);
            where.__defineSetter__(key, mutator);
        }
        else
        {
            if (getter)
            {
                if (obj.hasOwnProperty(getterName))
                    obj[getterName]= getter;
                else
                    where[getterName]= getter;
            }
            
            if (mutator)
            {
                if (obj.hasOwnProperty(mutatorName))
                    obj[mutatorName]= mutator;
                else
                    where[mutatorName]= mutator;
            }
        }
        
        //  return the getter & mutator methods
        return {
            getter: getter,
            mutator: mutator,
            validator: validator,
            value: value
        };
    }

    /** The implementation for getPropertyMethodsForKeyOnObject for browsers
     *  that don't support JavaScript getters and setters (MSIE).
     *  
     *  @inner
     */
    function getPropertyMethodsForKeyOnObject_MSIE(key, obj)
    {
        var proto= obj.constructor.prototype;
        var objectIsPrototype= (proto==obj);
        var where= (proto!=Object.prototype &&
                    proto!=coherent.KVO.prototype)?proto:obj;

        var keyAsTitle= key.titleCase();
        var mutatorName= "set" + keyAsTitle;
        var getterName= "get" + keyAsTitle;
        var validatorName= "validate" + keyAsTitle;

        getterName= (getterName in obj)?getterName:key;
        
        var getter= obj[getterName];
        var mutator= obj[mutatorName];
        var validator= obj[validatorName];
        var value;
        
        //  If the getter isn't a function, then there can be no mutator
        if ('function'!==typeof(getter))
        {
            if (key in obj)
                value= getter;
            getter= null;
            mutator= null;
        }
        else
        {
            //  reader is a function, so mutator must also be a function,
            //  check to make certain they have the correct number of arguments
            if (0!==getter.length)
                getter= null;
            if (mutator && 1!==mutator.length)
                mutator= null;
                
            //  determine the initial value of the key, can't be after wrapping
            //  the getter because the KeyInfo might not yet be created...
            if (getter && !objectIsPrototype)
                value= getter.valueOf().call(obj);

            //  If the getter hasn't already been wrapped to call _addParentLink
            //  wrap it now
            if (getter && key!==getter.__key)
                getter= wrapGetterWithAddParentLinkForKey(getter, key);
                
            //  If the mutator hasn't already been wrapped to call willChange &
            //  didChange, wrap it now
            if (mutator && key!==mutator.__key)
                mutator= wrapMutatorWithChangeNotificationForKey(mutator, key);
        }
        
        if (getter)
        {
            if (obj.hasOwnProperty(getterName))
                obj[getterName]= getter;
            else
                where[getterName]= getter;
        }
        
        if (mutator)
        {
            if (obj.hasOwnProperty(mutatorName))
                obj[mutatorName]= mutator;
            else
                where[mutatorName]= mutator;
        }
            
        return {
            getter: getter,
            mutator: mutator,
            validator: validator,
            value: value
        };
    }

    if (coherent.Support.Properties)
        return getPropertyMethodsForKeyOnObject;
    else
        return getPropertyMethodsForKeyOnObject_MSIE;
    
})();


/** Add KVO methods to an object that doesn't already have them.
 *  
 *  @param obj  the object to add the methods to
 **/
coherent.KVO.adapt= function(obj)
{
    //  either there's no object or the object already has the methods
    if (!obj)
        throw new InvalidArgumentError( "Can't adapt a null object" );

    var p;
    
    for (p in coherent.KVO.prototype)
    {
        if (p in obj)
            continue;
        obj[p]= coherent.KVO.prototype[p];
    }

    //  perform magic for key dependencies
    if ('keyDependencies' in obj && !('__dependentKeys' in obj))
    {
        var depends= obj.keyDependencies;
        for (p in depends)
            obj.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
    }
    
    return obj;
}




/** Add KVO methods to all the objects within an object. Allows using object
 *  literals with KVO. It is important that the object not have cycles or this
 *  code will hang your browser.
 *  
 *  @param obj  the object graph to adapt
 **/
coherent.KVO.adaptTree= function(obj)
{
    coherent.KVO.adapt(obj);
    
    var p;
    var value;
    
    for (p in obj)
    {
        if (p in coherent.KVO.keysToIgnore)
            continue;
            
        value= obj[p];
        
        if (!value)
            continue;
            
        if (coherent.typeOf(value) in coherent.KVO.typesOfKeyValuesToIgnore)
            continue;

        coherent.KVO.adaptTree(value);
    }

    return obj;
}


/** Perform magic to automatically create key dependencies when a subclass of
 *  KVO is created.
 *  
 *  This processes the subclass's `keyDependencies` to create dependent keys by
 *  calling `setKeysTriggerChangeNotificationsForDependentKey`.
 */
coherent.KVO.__subclassCreated__= function(subclass)
{
    var baseproto= subclass.superclass.prototype;
    var proto= subclass.prototype;
    
    //  Subclass hasn't changed the key dependencies prototype property...
    if (baseproto.keyDependencies===proto.keyDependencies)
        return;

    var depends= proto.keyDependencies||{};
    for (var p in depends)
        proto.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
}




/** Bindable is a base class that provides a simple mechanism for keeping one
 *  object's properties in sync with the properties of another. Views and
 *  Controllers are subclasses of Bindable.
 *  
 *  @declare coherent.Bindable
 *  @extends coherent.KVO
 *  
 *  @property bindings  a map of the bindings that have been established for
 *            this object.
 */
coherent.Bindable= Class.create(coherent.KVO, {

    /** Construct a new Bindable instance. This initialises the bindings
     *  property to an empty hash.
     */
    constructor: function()
    {
        this.bindings={};
        this.__context= coherent.dataModel;
    },
    
    exposedBindings: [],
    
    automaticallySetupBindings: true,
    
    /** An object to use for relative bindings (*.foo) */
    __relativeSource: null,
    
    /** Bind an exposed binding name to a given key path. The instance must
     *  implement an observer method for the exposed binding. The observer
     *  method must be named `observe<Binding>Change` where <Binding> is the
     *  titlecase version of `name`.
     *  
     *  If `keyPath` begins with an asterix (`*`), then the keypath is assumed
     *  to be in relation to the `relativeSource` object. Otherwise, the keypath
     *  is to an object in the global scope.
     *
     *      var foo1= new coherent.Bindable();
     *      foo1.bindNameToKeyPath('bar', 'zebra.bar', null, false);
     *  
     *  In the example above, `foo1` has a binding for `bar` which will be kept
     *  synchronised with the value in the global context found by following the
     *  key path `zebra.bar`.
     *  
     *      var foo2= new coherent.Bindable();
     *      var zebra= {
     *          bar: "I'm a bar"
     *      };
     *      foo2.bindNameToKeyPath('bar', '*.bar', zebra, false);
     *  
     *  In the second example, `foo2` will keep its `bar` binding in sync with
     *  the `bar` property of the `zebra` variable.
     *  
     *  @param {String} name        the name of the binding exposed via exposedBindings
     *  @param {String} keyPath     the path to the value used for this binding
     *  @param {Object} [relativeSource=null]   the model object to be used for
     *          relative key paths
     *  @param {Boolean} [delayUpdate=false]    postpone calling the observer
     *          method for this binding (allows the Bindable to be fully setup
     *          before sending update notifications)
     */
    bindNameToKeyPath: function(name, keyPath, relativeSource, delayUpdate)
    {
        var fn;
        var binding;

        if (!this.bindings)
            this.bindings={};
        
        fn= this["observe" + name.titleCase() + "Change"];
        //  Silently fail if the object doesn't have an observer function for a
        //  binding with the given name.
        if (!fn)
            return;
    
        //  Unbind the old value
        if (this.bindings[name])
            this.bindings[name].unbind();
    
        //  Create a new Binding using the keyPath parameter, connect up the
        //  observer method, and store the binding in the lookup table. Finally,
        //  get its present value.
        if ("*."==keyPath.substr(0,2))
            binding= coherent.Binding.bindingFromString(keyPath.substr(2),
                                                        relativeSource);
        else
            binding= coherent.Binding.bindingFromString(keyPath, this.__context);

        //  If update should be delayed, call the Binding's update method before
        //  setting the observer method -- this allows the Binding to get the
        //  latest value without sending the update notifications.
        if (delayUpdate)
            binding.update();
        binding.observerFn= fn.bind(this);
        this.bindings[name]= binding;
        if (!delayUpdate)
            binding.update();
    },
    
    __postConstruct: function()
    {
        if (this.automaticallySetupBindings)
            this.setupBindings();
    },
    
    keyPathForBindingName: function(bindingName)
    {
        if (!this.__bindingsMap)
            return null;
        return this.__bindingsMap[bindingName];
    },
    
    /** Establish all the exposed bindings. This is performed in two parts:
     *  
     *  1. Setup each binding with updates deferred.
     *  2. Loop through each binding and call update.
     *  
     *  This allows all bindings to be established before invoking the change
     *  notification handlers for them, because the handlers might require the
     *  values of other bindings to complete properly.
     */
    setupBindings: function()
    {
        //  setup bindings
        var len= this.exposedBindings.length;
        var keyPath;
        var b;
        var i;
        
        this.__initialising= true;
        
        for (i=0; i<len; ++i)
        {
            b= this.exposedBindings[i];
            keyPath= this.keyPathForBindingName(b);
            if (!keyPath)
                continue;
            this.bindNameToKeyPath(b, keyPath, this.__relativeSource, true);
        }
        
        //  Now update all the bindings
        for (b in this.bindings)
            this.bindings[b].update();
            
        delete this.__initialising;
    }

    
});

/** Handler for creation of subclasses of Bindable: this fixes up the exposed
 *  bindings silliness by adding all the base class exposed bindings to the
 *  prototype value.
 *  
 *  @function
 *  @param subclass a reference to the constructor of the new class derived from
 *         Bindable which needs its exposedBindings property fixed up.
 */
coherent.Bindable.__subclassCreated__= function(subclass)
{
    var baseproto= subclass.superclass.prototype;
    var proto= subclass.prototype;
    //  Subclass hasn't changed the exposed bindings prototype property...
    if (baseproto.exposedBindings===proto.exposedBindings)
        return;

    proto.exposedBindings= proto.exposedBindings.concat(baseproto.exposedBindings);
};




/** SortDescriptors are a helper class that is used to sort groups of 
 *  KVO-compliant objects.
 *  
 *  @declare coherent.SortDescriptor
 **/
coherent.SortDescriptor= Class.create({

    /** Initialise a new SortDescriptor.
     *  
     *  @param keyPath      the path to the key to compare on each object
     *  @param ascending    whether this descriptor sorts values in ascending (true)
     *                      or descending (false) order.
     *  @param comparisonFn (optional) either the name of the comparison method,
     *                      which must be defined on the values to compare, or a
     *                      reference to a comparison function. This function must
     *                      take one parameter, the object to compare against, and
     *                      must return -1,0,1 based on whether the this value is
     *                      less than, equal to, or greater than the comparison
     *                      value.
     *  @throws InvalidArgumentError if comparisonFn is neither a string nor a
     *          function.
     */
    constructor: function(keyPath, ascending, comparisonFn)
    {
        this.keyPath= keyPath;
        this.ascending= ascending;
        this.comparisonFn= comparisonFn || this.defaultCompare;

        var comparisonType= typeof(this.comparisonFn);
        if ("string"!=comparisonType && "function"!=comparisonType)
            throw new InvalidArgumentError( "comparisonFn must be either the name of a method or a function reference" );
    },
    
    /** Find the comparison function on o.
     *  
     *  @param o    the object on which comparisonFn should be found
     *  @returns a method reference to a method on o
     *  @throws TypeError if the comparisonFn member doesn't resolve to a function.
     **/
    resolveComparisonFn: function(o)
    {
        var fn= this.comparisonFn;
        if ("string"===typeof(fn))
            fn= o[fn];
        if ("function"!==typeof(fn))
            throw new TypeError( "comparisonFn does not resolve to a function" );
        
        return fn;
    },
    
    /** Compare two objects using the comparison function to determine their
     *  sort order.
     *  
     *  @param object1  first object
     *  @param object2  second object
     *  @returns -1 if object1 preceeds object2, 0 if object1 and object2 are equal,
     *           1 if object1 follows object2.
     **/
    compareObjects: function(object1, object2)
    {
        if (!object1.valueForKeyPath || !object2.valueForKeyPath)
            throw new InvalidArgumentError( "Objects are not Key Value compliant" );
        var v1= object1.valueForKeyPath(this.keyPath);
        var v2= object2.valueForKeyPath(this.keyPath);

        var fn= this.resolveComparisonFn(v1);
    
        return fn.call(v1, v2);
    },
    
    /** Default comparison function which will work for Strings, Numbers, Dates,
     *  and Booleans. This method is meant to be called as a method of one of the
     *  objects to compare (via the call method).
     *  @returns -1,0,1 depending on sort order.
     **/
    defaultCompare: function(o)
    {
        return coherent.compareValues(this, o);
    },
    
    /** Return a SortDescriptor that sorts in the reverse order to this descriptor.
     *  @returns a new SortDescriptor.
     **/
    reversedSortDescriptor: function()
    {
        return new coherent.SortDescriptor(this.keyPath, !this.ascending,
                                           this.comparisonFn);
    }

});





/** Base Controller class used for all other controllers.
 *  
 *  @property __initialising    While establishing its bindings, the controller
 *                              will set this property to `true`. This can be
 *                              used in observer methods to perform
 *                              initialisation â€“Â like pulling data out of the
 *                              DOM if it isn't present in the model.
 *                              
 *  @declare coherent.Controller
 *  @extends coherent.Bindable
 */
coherent.Controller= Class.create(coherent.Bindable, {

    /** Create the base Controller class and registers it with the global
     *  context by the name parameter. After the Controller is fully
     *  constructed, all the bindings will be established (via `__postConstruct`
     *  hook).
     *  
     *  @param {String} name    the name this controller should have in the
     *          global context
     *  @param {Object} [bindingsMap]   A mapping between exposed bindings and
     *          keypaths in the global context
     **/
    constructor: function(name, bindingsMap)
    {
        this.base();
        
        this.__bindingsMap= bindingsMap;
        
        this.name= name;
        if (name)
            coherent.registerModelWithName(this, name);
    }
        
});









/** Placeholders are returned by the selection attribute for controllers when
 *  either there is no selection or there are multiple values selected.
 *  Note: These can't be objects (e.g. {}) because JavaScript tests for pointer
 *  equality when comparing objects and this doesn't work between frames.
 *  
 *  @namespace
 **/
coherent.Markers= {

    MultipleValues: "ThisIsAnUniqueStringThatRepresentsMultipleValues",
    NoSelection: "ThisIsAnUniqueStringThatRepresentsNoSelection"

};



/** A placeholder for the selection in an array controller. This proxy manages
 *  the multiple selection placeholders and such.
 *  
 *  @declare coherent.SelectionProxy
 *  @extends coherent.KVO
 */
coherent.SelectionProxy= Class.create(coherent.KVO, {

    /** Construct a new SelectionProxy. This is only ever called by a Controller
     *  instance, so there's probably no reason to call this method.
     *  
     *  @param {coherent.Controller} controller the controller owning the
     *          selection this proxy is managing.
     */
    constructor: function(controller)
    {
        this.controller= controller;
        this.mutable= true;
    },
    
    infoForKey: function(key)
    {
        var selectedObjects= this.controller.selectedObjects();
        var keyInfo= selectedObjects.infoForKey(key);
        keyInfo.mutable &= this.mutable;
        return keyInfo;
    },
    
    infoForKeyPath: function(keyPath)
    {
        var selectedObjects= this.controller.selectedObjects();
        var keyInfo= selectedObjects.infoForKeyPath(keyPath);
        keyInfo.mutable &= this.mutable;
        return keyInfo;
    },
    
    translateValue: function(value)
    {
        if ("array"!==coherent.typeOf(value))
            return value;
    
        //  handle single element array
        if (1===value.length)
            return value[0];
        
        var i;
        var len;
        var v= value[0];
    
        for (i=1, len=value.length; i<len; ++i)
        {
            if (0!==coherent.compareValues(v, value[i]))
                return coherent.Markers.MultipleValues;
        }
    
        return v;
    },
    
    valueForKey: function(key)
    {
        var selectedObjects= this.controller.selectedObjects();
        if (0===selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= selectedObjects.valueForKey(key);
        return this.translateValue(result);
    },
    
    valueForKeyPath: function(keyPath)
    {
        var selectedObjects= this.controller.selectedObjects();
        //  handle no selection placeholder
        if (0===selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= selectedObjects.valueForKeyPath(keyPath);
        return this.translateValue(result);
    },
    
    setValueForKey: function(value, key)
    {
        if (!this.mutable)
            return;

        var selectedObjects= this.controller.selectedObjects();
        var previousValue= this.valueForKey(key);
        selectedObjects.setValueForKey(value, key);
        var newValue= this.valueForKey(key);
        
        if (previousValue===newValue)
            return;

        var change= new coherent.ChangeNotification(this, coherent.ChangeType.setting,
                                                    newValue, previousValue);
        this.notifyObserversOfChangeForKeyPath(change, key);
    },
    
    setValueForKeyPath: function(value, keyPath)
    {
        if (!this.mutable)
            return;
            
        var selectedObjects= this.controller.selectedObjects();
        var previousValue= this.valueForKeyPath(keyPath);
        selectedObjects.setValueForKeyPath(value, keyPath);
        var newValue= this.valueForKeyPath(keyPath);
        
        if (previousValue===newValue)
            return;

        var change= new coherent.ChangeNotification(this, coherent.ChangeType.setting,
                                                    newValue, previousValue);
        this.notifyObserversOfChangeForKeyPath(change, keyPath);
    }
});






/** An ObjectController manages a single object and reflects its selection and
 *  editable status.
 *  
 *  @property objectClass   A reference to the constructor which should be used
 *                          if the controller needs to create a new instance of
 *                          the class it is managing.
 *  
 *  @declare coherent.ObjectController
 *  @extends coherent.Controller
 **/
coherent.ObjectController= Class.create(coherent.Controller, {

    /** Create an instance of an ObjectController.
     *  
     *  @param {String} name    the name the controller should expose in the
     *          global context.
     *  @param {Object} [bindingsMap=null]  a mapping between the controller's
     *          exposed bindings and the global context.
     */
    constructor: function(name, bindingsMap)
    {
        this.base(name, bindingsMap);

        this.objectClass= coherent.KVO;
        this.__selectedObjects= [];
        this.__selection= new coherent.SelectionProxy(this);
    },
    
    /** Perform magic to correctly reflect changes to the selectedObjects as a
     *  change to the selection. This could probably be a bit cleaner...
     *  
     *  @private
     *  
     *  @param {coherent.ChangeNotification} change the property change
     *          notification
     *  @param {String} keyPath the keypath relative to the child object not
     *          this object
     *  @param {String} context the name of the child object that is changing
     */
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        this.base(change, keyPath, context);
        if ('selectedObjects'!==context)
            return;
            
        var selectionKeyPath= 'selection.' + keyPath;
        var newValue= this.valueForKeyPath(selectionKeyPath);
        var selectionChange= new coherent.ChangeNotification(this, coherent.ChangeType.setting,
                                                    newValue, null);
        this.notifyObserversOfChangeForKeyPath(selectionChange, selectionKeyPath);
    },
    
    keyDependencies: {
        selectedObjects: ['content'],
        selection: ['selectedObjects']
    },
    
    exposedBindings: ["editable", "content"],
    
    /** Retrieve whether this content of this controller is editable. The content
     *  is editable if it was set directly (not via a binding) or if the bound
     *  content keyPath is editable.
     *
     *  @returns true if the content of the controller is editable, false if not
     **/
    editable: function()
    {
        var editable;
    
        if (this.bindings.editable)
            editable = this.bindings.editable.value();
        else
            editable = this.__editable || true;
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();
        return editable;
    },

    /** Set the editable flag for this controller. Changes to this value are
     *  ignored if the content is set via a binding. Note, if the content is
     *  bound and isn't mutable, setting editable will have no real effect.
     *  
     *  @param {Boolean} editable   the new value for the editable property
     **/
    setEditable: function(editable)
    {
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();

        if (this.bindings.editable)
            this.bingings.editable.setValue(editable);
        else
            this.__editable= editable;
    },

    /** Observe changes to the editable property. This simply calls setEditable.
     *  
     *  @param change   The change notification data
     **/
    observeEditableChange: function(change)
    {
        this.setEditable(change.newValue);
    },

    /** Retrieve the content for this controller. For ObjectControllers, this is
     *  just a single object. For subclasses, this may be an array or other
     *  data.
     *  
     *  @returns the content this Controller is managing.
     **/
    content: function()
    {
        if (this.bindings.content)
            return this.bindings.content.value();
        else
            return this.__content;
    },

    /** Set the content for this controller.
     *  
     *  @param newContent   the object for this Controller.
     **/
    setContent: function(newContent)
    {
        if (this.bindings.content)
            this.bindings.content.setValue(newContent);
        else
            this.__content= newContent;
            
        if (!newContent)
            this.__selectedObjects= [];
        else
            this.__selectedObjects= [newContent];
    },

    /** Observe changes to the content binding. This just calls setContent.
     *  
     *  @param change   the change data
     **/
    observeContentChange: function(change)
    {
        this.setContent(change.newValue);
    },

    /** Retrieve the selected objects. For an ObjectController, this is always
     *  the single object being managed.
     *  
     *  @returns {Object} the managed object
     **/
    selectedObjects: function()
    {
        return this.__selectedObjects;
    },

    /** Retrieve a proxy for the selection.
     *  
     *  @returns {coherent.SelectionProxy} a proxy to the selection for this
     *           controller.
     **/
    selection: function()
    {
        return this.__selection;
    }

});




/** An object controller that obtains its content via an Ajax call. 
 *  
 *  @requires Presently `AjaxController` requires the Prototype library or a
 *  compatibility layer implementing the Prototype `Ajax.Request` class. For
 *  this reason this controller will either be deprecated or rewritten to
 *  implement the Ajax itself.
 *  
 *  @property queryInProgress   While the controller is communicating with the
 *                              server, it sets this property to `true`. Views
 *                              may bind to this property to display progress
 *                              messages or spinners.
 *  
 *  @property url   The server URL to which requests should be made.
 *  
 *  @property method="GET"  The request method to use for requests. This may be
 *                          either GET or POST, because not all browsers support
 *                          the full compliment of method types.
 *  
 *  @property parameters    A hash containing the Ajax parameters which should
 *                          be sent the server. Typically views will bind
 *                          views to keys within the parameter hash to
 *                          manipulate the query.
 *  
 *  @property queryDelay=500ms  Number of milliseconds after one of the query
 *                              related properties changes that the query should
 *                              be started. Repeated changes to the parameters
 *                              will indefinitely postpone the query.
 *  
 *  @property statusCode    The HTTP status code from the last query.
 *  
 *  @property errorMessage  The HTTP error message from the last query or
 *                          `undefined` if the last query did not fail.
 *  
 *  @declare coherent.AjaxController
 *  @extends coherent.ObjectController
 */
coherent.AjaxController= Class.create(coherent.ObjectController, {

    flushContentBeforeQuery: false,
    
    /** Create a new `AjaxController` instance.
     *
     *  @param name     The name used to register this controller in the global
     *                  context. This shouldn't be null.
     *  @param [bindingsMap]    A hash representing connections between this
     *                          controllers exposed bindings and the global
     *                          context.
     */
    constructor: function(name, bindingsMap)
    {
        this.base(name, bindingsMap);
    
        this.addObserverForKeyPath(this, this.queryUpdated, "url");
        this.addObserverForKeyPath(this, this.queryUpdated, "method");

        this.queryDelay= 500;
        this.url= "";
        this.method= "GET";
        this.setValueForKey(new coherent.KVO(), "parameters");
    },

    /** Validate the request parameters. By default this method simply returns
     *  `true` to indicate that the parameters are OK. Subclasses should override
     *  this method to perform validation and return `false` if the parameters
     *  are not acceptable and the query should be aborted.
     *  
     *  Of course, it's also up to subclasses to alert the visitor that the
     *  current state is not valid...
     */
    validateParameters: function()
    {
        return true;
    },

    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        this.base(change, keyPath, context);
        if ('parameters'===context)
            this.queryUpdated(change, keyPath, context);
    },
    
    /** Observer method called when the query has changed. Either the `url`,
     *  `method` or `parameters` has changed and we need to send the query
     *  back to the server to refresh the content.
     *  
     */
    queryUpdated: function(change, keyPath, context)
    {
        if (!this.parameters || !this.validateParameters())
            return;
        this.setValueForKey(true, "queryInProgress");
        if (this.__queryTimer)
            window.clearTimeout(this.__queryTimer);
        this.__queryTimer= this.performQuery.bindAndDelay(this, this.queryDelay);
    },

    /** Method to create the Ajax query and send it to the server. This is where
     *  code would need to be modified to support libraries other than Prototype
     *  for the Ajax request.
     */
    performQuery: function()
    {
        //  build the Ajax request
        var requestConfig= {
            method: this.method,
            parameters: {},
            onSuccess: this.querySucceeded.bind(this),
            onFailure: this.queryFailed.bind(this),
            onException: this.queryThrew.bind(this),
            onComplete: this.queryComplete.bind(this)
        };

        var keys= this.parameters.mutableKeys();
        var len= keys.length;
        var p;
        
        for (var i=0; i<len; ++i)
        {
            p= keys[i];
            if (this.parameters.hasOwnProperty(p))
                requestConfig.parameters[p]= this.parameters[p];
        }
        this.__request= new Ajax.Request(this.url, requestConfig);
        if (this.flushContentBeforeQuery)
            this.setContent(null);
    },

    /** Extract the interesting content from the JSON response. Many APIs wrap
     *  the useful content in extra layers of messaging information. Subclasses
     *  may override this method to extract only the useful information.
     *  
     *  @param obj  The JSON data object returned by the server.
     *  @returns the same value as `obj`.
     */
    extractContent: function(obj)
    {
        return obj;
    },

    /** Method invoked when the Ajax query has finished for any reason.
     *  Subclasses that override this method should be certain to invoke it to
     *  clean up any state variables maintained by the controller.
     *  
     *  @param xhr  the `Ajax.Request` object
     */
    queryComplete: function(xhr)
    {
        this.setValueForKey(false, "queryInProgress");
    },

    /** Callback method invoked when the query has succeeded. This method takes
     *  the `responseText` and evaluates it to create a JSON packet. This JSON
     *  packet is converted into a KVO-compliant object and then the interesting
     *  content is extracted via {@link extractContent}.
     *  
     *  @param xhr  The `Ajax.Request` object
     */
    querySucceeded: function(xhr)
    {
        var obj= eval('('+xhr.responseText+')');
        if (!obj)
        {
            this.queryFailed(xhr);
            return;
        }
        coherent.KVO.adaptTree(obj);
    
        this.setContent(this.extractContent(obj));
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(undefined, "errorMessage");
    },

    /** Callback method invoked when the query fails for any reason. This method
     *  updates the `statusCode` and `errorMessage` properties before setting
     *  the controller's content to `null`.
     *  
     *  @param xhr  The `Ajax.Request` object
     */
    queryFailed: function(xhr)
    {
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(xhr.statusText, "errorMessage");
        this.setContent(null);
    },

    /** Callback method invoked when the query throws an exception for any
     *  reason.
     *  
     *  @param xhr  The `Ajax.Request` object
     *  @param e    The `Error` object thrown
     */
    queryThrew: function(xhr, e)
    {
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(e.message, "errorMessage");
        this.setContent(null);
    }
    
});





/** Sure would be nice to use a generator here...
 */
function IndexRange(begin, end)
{
    var i;
    var r=[];

    if (1==arguments.length && begin.length)
    {
        end= begin.length-1;
        begin= 0;
    }
    
    for (i=begin; i<=end; ++i)
        r.push(i);
    return r;
}



/** An ArrayController manages the interaction between an array-based model
 *  object and a view or other controller.
 *  
 *  @declare coherent.ArrayController
 *  @extends coherent.ObjectController
 */
coherent.ArrayController= Class.create(coherent.ObjectController, {

    /** Create a new ArrayController instance.
     *  
     *  @param {String} name    the name the controller should expose in the
     *          global context.
     *  @param {Object} [bindingsMap=null]  a mapping between the controller's
     *          exposed bindings and the global context.
     */
    constructor: function(name, bindingsMap)
    {
        this.base(name, bindingsMap);
    },

    keyDependencies: {
        selectedObjects: ['selectionIndexes'],
        selectionIndex: ['selectionIndexes'],
        canRemove: ['editable', 'selectionIndexes'],
        canAdd: ['editable']
    },
    
    exposedBindings: ["content", "selectionIndexes", "sortDescriptors",
                      "filterPredicate", "contentForMultipleSelection"],

    /** Should the array controller clear any filter when new content is
     *  inserted?
     */
    clearsFilterPredicateOnInsertion: true,
    
    /** Observe changes to the content... This method will update the arranged
     *  object collection as appropriate.
     *  
     *  @param change   a change notification specifying whether the content has
     *                  been set or new elements were inserted, deleted or
     *                  replaced.
     */
    observeContentChange: function(change)
    {
        var len;
        var i;
        
        switch (change.changeType)
        {
            case coherent.ChangeType.setting:
                this.setContent(change.newValue);
                this.rearrangeObjects();
                break;
                
            case coherent.ChangeType.insertion:
                this._insertObjectsIntoArrangedObjects(change.newValue);
                break;
                
            case coherent.ChangeType.deletion:
                this.rearrangeObjects();
                //  removed object will automatically be removed from the
                //  selection by rearrangeObjects.
                break;
                
            case coherent.ChangeType.replacement:
                this.rearrangeObjects();
                //  Probably need to select the new objects...
                break;
                
            default:
                break;
        }
    },

    /** Accessor to determine whether new items may be added to the array
     *  managed by this controller. By default, if the controller is
     *  editable, `canAdd` returns true.
     */
    canAdd: function()
    {
        return this.editable();
    },

    /** Add a new instance of the class managed by this controller.
     */
    add: function()
    {
        var newObject= new (this.objectClass)();
        var content= this.content();
        content.addObject(newObject);
    },
    
    /** Can the currently selected elements be removed from the content?
     */
    canRemove: function()
    {
        return this.editable() && this.selectionIndexes().length;
    },
    
    /** Remove the currently selected elements from the content.
     */
    remove: function()
    {
        var selectedObjects= this.selectedObjects();
        var content= this.content();
        content.removeObjects(selectedObjects);
    },
    
    /** Set the array of object managed by this controller. This triggers a
     *  change to the `arrangedObjects` property.
     *      
     *  @param newContent   the array of objects to use for the new content.
     **/
    setContent: function(newContent)
    {
        newContent= newContent||[];
        var selectedObjects= this.selectedObjects();
        if (this.bindings.content)
            this.bindings.content.setValue(newContent);
        else
            this.__content= newContent;
        //  need to update the arrangedContent attribute
        this.rearrangeObjects(newContent);
    },
    
    /** Retrieve the sort descriptors for this ArrayController.
     *  @returns an array of sort descriptors or an empty array if there are no
     *           sort descriptors defined.
     **/
    sortDescriptors: function()
    {
        if (this.bindings.sortDescriptors)
            return this.bindings.sortDescriptors.value() || [];
        else
            return this.__sortDescriptors || [];
    },
    
    /** Set the sort descriptors for this coherent.ArrayController. Setting the
     *  sort descriptors will trigger the content to be rearranged according to
     *  the new sort information.
     *  
     *  @param descriptors  the sort descriptors used for sorting the contents of
     *                      this coherent.ArrayController.
     **/
    setSortDescriptors: function(descriptors)
    {
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue(descriptors);
        else
            this.__sortDescriptors= descriptors;
        this.rearrangeObjects();
    },
    
    /** Observe changes to the bound sort descriptors.
        @param change   the change notification data
     **/
    observeSortDescriptorsChange: function(change)
    {
        this.setSortDescriptors(change.newValue);
    },
    
    /** Retrieve the filter predicate function.
     *  @returns the function used to filter the content or null if no predicate
     *           has been specified.
     **/
    filterPredicate: function()
    {
        if (this.bindings.filterPredicate)
            return this.bindings.filterPredicate.value();
        else
            return this.__filterPredicate;
    },
    
    /** Set the filter predicate for this ArrayController. Calls
     *  rearrangeObjects to update the value of arrangedObjects.
     *  @param  predicate   The filter predicate that should be used to limit the
     *                      content presented via the arrangedObjects property
     **/
    setFilterPredicate: function(predicate)
    {
        if (this.bindings.filterPredicate)
            this.bindings.filterPredicate.setValue(predicate);
        else
            this.__filterPredicate= predicate;
        this.rearrangeObjects();
    },
    
    /** Observe changes to the filter predicate attribute.
     *  @param change   the change notification data
     **/
    observeFilterPredicateChange: function(change)
    {
        this.setFilterPredicate(change.newValue);
    },
    
    /** Filter an array of objects according to the filterPredicate. This
     *  actually operates only on the indexes of the array.
     *
     *  @param content  the content array to filter
     *
     *  @returns the indexes that pass the filter predicate.
     **/
    filterObjects: function(content)
    {
        var filterPredicate= this.filterPredicate();

        if (!filterPredicate)
            return IndexRange(content);
        
        var indexes=[];
    
        //  First filter the content, because it's always quicker to sort fewer
        //  elements than more.
        var i;
        var len;
        var v;
    
        //  Initialise the arranged object array to an empty array
        for (i=0, len=content.length; i<len; ++i)
        {
            v= content[i];
            if (filterPredicate(v))
                indexes.push(i);
        }

        return indexes;
    },
 
    /** Compare two objects according to the specified sort descriptors.
     *  @returns -1 if obj1 appears before obj2, 1 if obj1 appears after obj2,
     *           and 0 if obj1 is equal to obj2. If no sort descriptors have
     *           been set, all objects are equal.
     */
    _compareObjects: function(obj1, obj2)
    {
        var s;
        var result;
        var descriptors= this.sortDescriptors();
        var len= descriptors.length;
        
        for (s=0; s<len; ++s)
        {
            result= descriptors[s].compareObjects(obj1, obj2);
            if (!descriptors[s].ascending)
                result*=-1;
            if (0!==result)
                return result>0?1:-1;
        }
    
        return 0;
    },
    
    /** Sort an array of objects according to the sortDescriptors. This actually
     *  works only on the indexes of the array.
     *
     *  @param content  the content array to sort
     *  @param indexes  the indexes of the array to sort
     *
     *  @returns the indexes array arranged in order based on the
     *           sortDescriptors and the content.
     **/
    sortObjects: function(content, indexes)
    {
        indexes= indexes || IndexRange(content);

        /** A simple sort function that uses all the sort descriptors associated
            with this coherent.ArrayController. The first descriptor that returns a non-zero
            value (AKA not equal) terminates the comparison. Note, this sort
            function receives the indexes from the arranged array and uses those
            indexes to find the objects to compare in the content array.
        
            @param index1   the index in the content array of the first object
            @param index2   the index in the content array of the second object
            @returns -1 if obj1 is less than obj2, 0 if the two objects are equal,
                     1 if obj1 is greater than obj2.
         **/
        var sortDescriptors= this.sortDescriptors();
        var numberOfSortDescriptors= sortDescriptors.length;
        
        function sortFunction(index1, index2)
        {
            var s;
            var result;
            var obj1= content[index1];
            var obj2= content[index2];
            var len= numberOfSortDescriptors;
            var descriptors= sortDescriptors;
            
            for (s=0; s<len; ++s)
            {
                result= descriptors[s].compareObjects(obj1, obj2);
                if (!descriptors[s].ascending)
                    result*=-1;
                if (0!==result)
                    return result;
            }
        
            return 0;
        }
    
        //  Now sort the arranged indexes array -- the actual sort is defined above.
        if (0!==sortDescriptors.length)
            indexes.sort(sortFunction);
    
        //  Determine the actual array of arranged objects by pulling out the object
        //  corresponding to the arranged index.
        return indexes;
    },

    /** Filter and Sort an array of objects according to the filterPredicate and
     *  sortDescriptors.
     *  
     *  @param content  the content array to filter & sort.
     *  @returns a copy of the content array filtered and sorted.
     **/
    arrangeObjects: function(content)
    {
        //  This contains the indexes of the content objects after being arranged
        //  according to the filter predicate and sort descriptors.
        var arranged= this.filterObjects(content);
    
        //  Sort the content objects based on the sortDescriptors
        arranged= this.sortObjects(content, arranged);
        
        //  If arranging the content (rather than an arbitrary collection),
        //  remember the mapping
        if (content===this.content())
        {
            var contentToArrangedMap= [];
            var len= arranged.length;
            for (var i=0; i<len; ++i)
                contentToArrangedMap[arranged[i]]= i;
            
            this.__contentToArrangedMap= contentToArrangedMap;
            this.__arrangedToContentMap= arranged;
        }
        //  corresponding to the arranged index.
        return content.objectsAtIndexes(arranged);
    },
    
    /** Rearrange the content objects according to the filter predicate and sort
     *  descriptors. Signals an KVO notification for arrangedObjects.
     **/
    rearrangeObjects: function(newContent)
    {
        var content= newContent || this.content() || [];
    
        var arrangedObjects= this.arrangeObjects(content);
        
        //  Determine new selection
        var selectedObjects= this.selectedObjects();
        var selectionIndexes= [];
        var len= selectedObjects.length;
        var sel;
        var i;
        
        for (i=0; i<len; ++i)
        {
            sel= arrangedObjects.indexOf(selectedObjects[i]);
            if (-1!==sel)
                selectionIndexes.push(sel);
        }

        this.setValueForKey(arrangedObjects, "arrangedObjects");
        this.setValueForKey(selectionIndexes, "selectionIndexes");
    },
    
    /** Find the correct position within the arranged objects and insert it.
     */
    _insertObjectsIntoArrangedObjects: function(newObjects)
    {
        //  sort and filter the new objects
        var sorted= this.arrangeObjects(newObjects);
        var sortedLen= sorted.length;

        var arranged= this.arrangedObjects;
        var arrangedLen= arranged.length;

        var indexes= [];
        var arrangedPos= 0;
        var newObj;
        var arrangedObj;
        var i;

        //  The indexes array will always be the same length as the sorted
        //  array of objects
        indexes.length= sortedLen;
        
        //  consider each new object
        for (i=0; i<sortedLen; ++i)
        {
            newObj= sorted[i];
            
            while (arrangedPos<arrangedLen)
            {
                arrangedObj= arranged[arrangedPos];
                
                //  newObj appears before arrangedObj
                if (-1===this._compareObjects(newObj, arrangedObj))
                    break;
                
                ++arrangedPos;
            }

            //  record where the arrangedObject will be inserted
            indexes[i]= arrangedPos + i;
        }

        arranged.insertObjectsAtIndexes(sorted, indexes);
    },
    
    /** Retrieve the objects that are selected.
     *  @returns the selected objects.
     **/
    selectedObjects: function()
    {
        return this.__selectedObjects;
    },
    
    /** Set the objects that are selected. This really only works if each object
     *  appears only once in the arrangedObject array, otherwise, only the first
     *  instance will be selected and subsequent instances will be ignored.
     *
     *  @param selectedObjects  the array of objects to select
     *  @returns true if the selection changed
     **/
    setSelectedObjects: function(selectedObjects)
    {
        var selectionIndexes= [];
        var i;
        var index;
        var arrangedObjects= this.arrangedObjects;
    
        for (i=0; i<selectedObjects.length; ++i)
        {
            index= arrangedObjects.indexOf(selectedObjects[i]);
            //  Can't select an object that isn't in the arranged object array.
            if (-1===index)
                continue;
            selectionIndexes.push(index);
        }
    
        //  Set the selected indexes based on the indexes computed above
        return this.setSelectionIndexes(selectionIndexes);
    },
    
    /** Retrieve the selected indexes for this ArrayController. Contrary to
     *  Apple's documentation for selectionIndexes, these are in terms of the
     *  arrangedObjects rather than the content array.
     *
     *  @returns an array of selected indexes, an empty array is returned when
     *           there is nothing selected.
     **/
    selectionIndexes: function()
    {
        if (this.bindings.selectionIndexes)
            return this.bindings.selectionIndexes.value() || [];
        else
            return this.__selectionIndexes || [];
    },
    
    /** Set the selected indexes for this ArrayController. Contrary to Apple's
     *  documentation for selectionIndexes, these are in terms of the
     *  arrangedObjects rather than the content array.
     *
     *  @param selectionIndexes  the new array of selected indexes
     *  @returns true if the selection was modified
     **/
    setSelectionIndexes: function(selectionIndexes)
    {
        //  First I need to sort the selectionIndexes, otherwise I can't compare them
        //  against the current selectionIndexes.
        selectionIndexes= selectionIndexes || [];
        selectionIndexes.sort();
    
        //  If the selected indexes are the same, then don't bother changing them.
        if (0===this.selectionIndexes().compare(selectionIndexes))
            return false;

        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        else
            this.__selectionIndexes= selectionIndexes;

        var arrangedObjects= this.arrangedObjects;
        this.__selectedObjects= arrangedObjects.objectsAtIndexes(selectionIndexes);

        return true;
    },
    
    /** Observe changes to the selectionIndexes binding.
     *  @param change   the change data
     **/
    observeSelectionIndexesChange: function(change)
    {
        this.setSelectionIndexes(change.newValue);
    },
    
    /** Set the single selection index -- for single-select controls.
     *
     *  @param selectedIndex    the index of the object to select.
     *  @returns true if the selection changed
     **/
    setSelectionIndex: function(selectionIndex)
    {
        var result= this.setSelectionIndexes([selectionIndex]);
        return result;
    },
    
    /** Retrieve the selection index -- the first element in the list of selected
     *  indexes.
     *  @returns the first element in the selectionIndexes array.
     **/
    selectionIndex: function()
    {
        var selectionIndexes= this.selectionIndexes();
        if (0===selectionIndexes.length)
            return -1;
        
        return selectionIndexes[0];
    }
    
});




/** The ModelController class is typically used as a base class for an
 *  application or page's data model controller.
 *  
 *  Instances of this class will take on the properties of the object literal
 *  passed as the state parameter. This means you can do the following:
 *  
 *      var state= new coherent.ModelController('state', {
 *                          selectedIndex: 0,
 *                          photos: [
 *                              {
 *                                  ...
 *                              },
 *                              {
 *                                  ...
 *                              },
 *                              ...
 *                          ],
 *                          ...
 *                      });
 *  
 *  The `state` variable will be an instance of coherent.ModelController with
 *  the properties defined in the object literal (e.g. `selectedIndex` and
 *  `photos`).
 *  
 *  @declare coherent.ModelController
 *  @extends coherent.Controller
 */
coherent.ModelController= Class.create(coherent.Controller, {

    /** Create a new ModelController instance. The constructor will call
     *  {@link coherent.KVO.adaptTree} on the `state` parameter if it is not
     *  already a KVO-compliant object. Then each property of `state` will be
     *  copied to the new `ModelController` instance.
     *  
     *  @param name The new controller will be registered in the global scope
     *              under this name.
     *  @param state    An object which will provide the initial state for this
     *                  controller, however, the actual value of the `state`
     *                  parameter will be discarded.
     *  @param [bindingsMap]    An optional hash connecting exposed bindings to
     *                          values in the global context. This isn't very
     *                          useful, because this is usually how the global
     *                          context is initially defined.
     */
    constructor: function(name, state, bindingsMap)
    {
        if (!('addObserverForKeyPath' in state))
            coherent.KVO.adaptTree(state);

        function copyStateValue(key)
        {
            this.setValueForKey(state[key], key);
        }
        
        state.mutableKeys().forEach(copyStateValue, this);

        this.base(name, bindingsMap);
    }
    
});







/** Lookup a ValueTransformer instance by name. If a value transformer
 *  with the specified name has not already been registered, this method
 *  attempts to locate a constructor with the same name -- creating
 *  an instance of the named class.
 *  
 *  @param transformerName  the name of the value transformer
 *  @returns a reference to the specifed value transformer
 *  @throws InvalidArgumentError if the transformerName does not specify either
 *          a pre-registered value transformer or a constructor for a value
 *          transformer.
 **/
coherent.findTransformerWithName= function(transformerName)
{
    if (!this.namedTransformers)
        this.namedTransformers= {};
        
    var valueTransformer= this.namedTransformers[transformerName.toLowerCase()];
    if (valueTransformer)
        return valueTransformer;
    
    //  try to create an instance of the specified type
    try
    {
        valueTransformer= eval( "new " + transformerName + "()" );
        this.namedTransformers[transformerName.toLowerCase()]= valueTransformer;
        return valueTransformer;
    }
    catch (e)
    {
        throw new InvalidArgumentError("The transformerName argument does not specify a valid ValueTransformer instance or constructor: " +
                                       transformerName);
    }
};

/** Register an instance of a ValueTransformer with a specific name.

    @param valueTransformer the value transformer instance or constructor
                            to register
    @param name             the name by which this value transformer is known
    
    @throws InvalidArgumentError if the valueTransformer parameter
            doesn't specify either a constructor or an instance of a valid
            ValueTransformer subclass.
 **/
coherent.registerTransformerWithName= function(valueTransformer, name)
{
    if ("string"==typeof(valueTransformer))
    {
        name= valueTransformer;
        var valueTransformerClassName= valueTransformer;
        try
        {
            valueTransformer= eval(valueTransformerClassName);
        }
        catch (e)
        {
            throw new InvalidArgumentError("The valueTransformer argument does not specify a valid ValueTransformer instance or constructor: " +
                                           valueTransformerClassName);
        }
        //  construct the value transformer if it's a contructor
        if ("function"==typeof(valueTransformer))
            valueTransformer= new valueTransformer();
    }
    
    //  make certain it really is a value transformer
    if (!valueTransformer.transformedValue)
        throw new InvalidArgumentError( "The valueTransformer argument does not support the ValueTransformer method transformedValue" );

    if (!this.namedTransformers)
        this.namedTransformers= {};
    
    name= name.toLowerCase();    
    this.namedTransformers[name]= valueTransformer;
}




/** Simple ValueTransformer that reverses the truth value of a key
 **/
coherent.NotTransformer= {};
coherent.NotTransformer.transformedValue= function(value)
{
    return (value?false:true);
}
coherent.NotTransformer.reverseTransformedValue= function(value)
{
    return !!value;
}
coherent.registerTransformerWithName(coherent.NotTransformer, "Not");



/** Mark string values as HTML.
 **/
coherent.HtmlValidTransformer = {
    transformedValue: function(value)
    {
        if ('string'===typeof(value))
            value.__html= true;
        return value;
    }
};
coherent.registerTransformerWithName(coherent.HtmlValidTransformer, "html");



/** ValueTransformer that returns true only for a particular value.
 **/
coherent.BooleanTransformer= function(trueValue, falseValue)
{
    this.trueValue= trueValue;
    this.falseValue= falseValue;
}
coherent.BooleanTransformer.prototype.transformedValue= function(value)
{
    return (value==this.trueValue);
}
coherent.BooleanTransformer.prototype.reverseTransformedValue= function( value )
{
    return (value?this.trueValue:this.falseValue);
}




/** ValueTransformer that returns true only for values matching a regex
 **/
coherent.RegexTransformer=function(trueRegex)
{
    this.trueRegex= trueRegex;
}
coherent.RegexTransformer.prototype.transformedValue= function(value)
{
    return this.trueRegex.test(value);
}




/** A transformer that maps between two lists of values.
 **/
coherent.GenericTransformer= function(modelValues, displayValues)
{
    this.modelValues= modelValues;
    this.displayValues= displayValues;
}
coherent.GenericTransformer.prototype.transformedValue=function(value)
{
    var index= this.modelValues.indexOf(value);
    if (-1==index)
        return undefined;
    else
        return this.displayValues[index];
}
coherent.GenericTransformer.prototype.reverseTransformedValue=function(value)
{
    var index= this.displayValues.indexOf(value);
    if (-1==index)
        return undefined;
    else
        return this.modelValues[index];
}




coherent.TruncatingTransformer= function(max)
{
    this.max= max || 50;
}
coherent.TruncatingTransformer.prototype.ellipsis= String.fromCharCode(0x2026);
coherent.TruncatingTransformer.prototype.transformedValue= function(value)
{
    if (!value && 0!==value)
        return value;

    value= "" + value;
    var len= value.length;
    if (len<=this.max)
        return value;

    //  Perform the ellipsis trick
    var half= this.max/2-2;
    
    //  Have to use Unicode character rather than entity because otherwise this
    //  won't work as a text binding.
    return [value.substr(0, half), this.ellipsis, value.substr(len-half)].join(' ');
}

coherent.Truncated= new coherent.TruncatingTransformer(50);
coherent.registerTransformerWithName( coherent.Truncated, "Truncated" );






/** Initialiser for a class that manages the value associated with a binding.
 *  Each Bindable will have one Binding for each exposed binding. A
 *  Binding observes changes to the given keyPath on the specified object.
 *  When the value changes, the Binding transforms it (if a transformer
 *  was specified) and calls its observerFn method.
 *  
 *  The correct way to use a Binding is to create it with the object,
 *  keyPath and transformer. Then assign a callback handler to the observerFn
 *  method.
 *  
 *  @declare coherent.Binding
 */
coherent.Binding= Class.create({

    /** Create a new Binding and associate it with a keypath on a specific
     *  object. 
     *  
     *  @param object       the object which this Binding will observe
     *  @param keyPath      the path to the value on object that the Binding
     *                      will observe
     *  @param [transformer]    a ValueTransformer instance that is responsible
     *                          for converting between model and display values
     */
    constructor: function(object, keyPath, transformer)
    {
        if (0===arguments.length)
            return;
        
        this.object= object;
        this.keyPath= keyPath;
        this.transformer= transformer;
        this.cachedValue= this.transformedValue(this.object.valueForKeyPath(this.keyPath));
    },
    
    /** Begin tracking changes to the value for this Binding. This method adds
     *  the binding as an observer on the bound object with the given keypath.
     **/
    bind: function()
    {
        this.object.addObserverForKeyPath(this, this.observeChangeForKeyPath,
                                          this.keyPath);
    },
    
    /** Stop tracking changes to the value for this Binding.
     **/
    unbind: function()
    {
        this.object.removeObserverForKeyPath(this, this.keyPath);
    },
    
    /** Transform the value tracked by this Binding according to the value 
     *  transformer. If there's no value transformer, then the value won't change.
     *  
     *  @param value    the present value
     *  @returns the value transformed according to the value transformer, or
     *           the original value if there is no transformer.
     **/
    transformedValue: function(value)
    {
        if (!this.transformer)
            return value;
        return this.transformer.transformedValue(value);
    },
    
    /** Change the value tracked by this Binding. This method will check to
     *  see whether the new value is actually a change, and if not, it ignores
     *  the request. If the value has changed, it will first be transformed into
     *  a model value, then set on the target object.
     *
     *  @param newValue the new value for this Binding.
     **/
    setValue: function(newValue)
    {
        //  nothing to do if the value hasn't changed.
        if (this.cachedValue===newValue)
            return;
        
        this.cachedValue= newValue;
        if (this.transformer && this.transformer.reverseTransformedValue)
            newValue= this.transformer.reverseTransformedValue(newValue);
        this.object.setValueForKeyPath(newValue, this.keyPath);
    },
    
    /** Is the value tracked by this Binding mutable? A bound value may be
     *  immutable if the target object implements a getter for the specified
     *  key but no setter.
     *  
     *  @returns true if the value of the binding may be changed and false if
     *           if the binding may not be changed.
     **/
    mutable: function()
    {
        var keyInfo= this.object.infoForKeyPath(this.keyPath);
        return keyInfo && keyInfo.mutable;
    },
    
    /** Retrieve the value for this Binding. The value is cached and only
     *  updated when changed. Of course, this is ok, because the Binding is
     *  observing changes to the value...
     *
     *  @returns the cached value of this Binding.
     **/
    value: function()
    {
        return this.cachedValue;
    },
    
    /** Call the observerFn callback to update the View with the latest value.
     **/
    update: function()
    {
        var change= new coherent.ChangeNotification(this.object,
                                                    coherent.ChangeType.setting,
                                                    this.value());
        this.observerFn(change, this.keyPath);
    },
    
    /** A callback function that should be set by clients of the Binding.
     *  This is here simply to prevent failures.
     *
     *  @param change   a {@link coherent.ChangeNotification} with information
     *                  about the change
     *  @param keyPath  the path to the value that has changed
     *  @param context  a client-specified value
     **/
    observerFn: function(change, keyPath, context)
    {},
    
    /** The Binding's change observer method. This method makes a clone of the
     *  change notification before transforming the new value and old value (if
     *  present). This change notification is passed to the observerFn callback
     *  method.
     *
     *  @param change   a {@link coherent.ChangeNotification} with information
     *                  about the change
     *  @param keyPath  the path to the value that has changed
     *  @param context  a client-specified value
     **/    
    observeChangeForKeyPath: function(change, keyPath, context)
    {
        var transformedChange= Object.clone(change);
        transformedChange.newValue= this.transformedValue(change.newValue);
        if (transformedChange.newValue===this.cachedValue)
            return;
        
        //  TODO: Need to do something clever about transforming the inserted
        //  values, and removing transformed values.
        if (coherent.ChangeType.setting===change.changeType)
            this.cachedValue= transformedChange.newValue;
            
        if (change.oldValue)
            transformedChange.oldValue= this.transformedValue(change.oldValue);
        try
        {
            this.updating= true;
            this.observerFn(transformedChange, keyPath, context);
        }
        finally
        {
            this.updating= false;
        }
    }
    
});

coherent.Binding.bindingRegex= /^(.*?)(?:\((.*)\))?$/;
coherent.Binding.compoundRegex= /^\s*([^&|].*?)\s*(\&\&|\|\|)\s*(\S.+)\s*$/;

/** Create a new Binding for a target object based on a string
 *  representation of the binding. This uses the `Binding.bindingRegex`
 *  regular expression to parse the binding string.
 *  
 *  @param bindingString    the string representation of the binding.
 *  @param [object]         the object which the resultant Binding should
 *                          observe for changes to the value specified in the
 *                          binding string. If you don't specify an object, the
 *                          global context will be used to resolve the binding
 *                          keypath.
 *  
 *  @returns a new Binding instance representing the binding string
 **/
coherent.Binding.bindingFromString= function(bindingString, object)
{
    var match;
    var binding;
    
    //  First see if it's a compound binding string, if so, return a new
    //  CompoundBinding object.
    match= bindingString.match(coherent.Binding.compoundRegex);
    if (match && 4==match.length)
    {
        binding= new coherent.CompoundBinding(match[2],
                                coherent.Binding.bindingFromString(match[1], object),
                                coherent.Binding.bindingFromString(match[3], object));
        binding.bind();
        return binding;
    }
                                    
    //  Use the binding regular expression to pull apart the string
    match= bindingString.match(coherent.Binding.bindingRegex);
    if (!match || match.length<3)
        throw new InvalidArgumentError("bindingString isn't in correct format");
    var keyPath= match[1];
    var transformer;

    if (match[2])
        transformer= coherent.findTransformerWithName(match[2]);

    //  If the caller didn't specify a target object, I'll bind to the page's
    //  data model. This is where all the model objects are registered, so
    //  this is probably best.
    binding= new coherent.Binding(object || coherent.dataModel, keyPath, transformer);
    binding.bind();
    
    return binding;
}




/** A binding with two parts joined by a boolean operator (either AND or OR).
 *  Compound bindings are immutable by their basic nature.
 *  
 *  You should probably never create a `CompoundBinding` directly. Rely on the
 *  `coherent.Binding.bindingFromString` method to create them for you.
 *  
 *  @declare coherent.CompoundBinding
 *  @extends coherent.Binding
 *  
 *  @example
 *  var b= coherent.Binding.bindingFromString('foo.bar.enabled && zebra.horse.alive');
 *  
 **/
coherent.CompoundBinding= Class.create(coherent.Binding, {

    /** Create a CompoundBinding instance. This should be invoked from 
     *  {@link coherent.Binding.bindingFromString} rather than directly.
     *  
     *  @param operation    either CompoundBinding.AND or CompoundBinding.OR
     *  @param {coherent.Binding} left  left hand binding
     *  @param {coherent.Binding} right right hand binding
     */
    constructor: function(operation, left, right) 
    {
        this.base();
        
        if (!operation || !left || !right)
            throw new InvalidArgumentError( "No parameters to CompoundBinding initialiser are optional" );
        
        this.operation= operation;
        this.left= left;
        this.right= right;
        this.left.observerFn= this.right.observerFn= this.observeChange.bind(this);

        switch (this.operation)
        {
            case coherent.CompoundBinding.AND:
                this.cachedValue= this.left.value() && this.right.value();
                break;
            case coherent.CompoundBinding.OR:
                this.cachedValue= this.left.value() || this.right.value();
                break;
            default:
                throw new InvalidArgumentError( "Unknown operation value for CompoundBinding" );
                break;
        }
    },
    
    /** Begin observing value change notifications for both the left and right
     *  bindings within the compound binding.
     */
    bind: function()
    {
        this.left.bind();
        this.right.bind();
    },
    
    /** Stop observing value change notifications for both left and right parts
     *  of this binding.
     */
    unbind: function()
    {
        this.left.unbind();
        this.right.unbind();
    },
    
    /** All compound bindings are by default immutable.
     *  @returns false
     */
    mutable: function()
    {
        return false;
    },
    
    /** CompoundBindings are immutable. So calling setValue will throw an
     *  exception.
     *  
     *  @param newValue the new value to set the binding to
     *  @throws {Error} when called.
     */
    setValue: function(newValue)
    {
        throw new Error( "Attempting to set value of CompoundBinding" );
    },
    
    /** Observe changes to either left or right binding. When either binding
     *  changes, the new value of the compound binding is computed and the
     *  new value is broadcast to the bound object.
     *  
     *  @param change   the change notification from either left or right
     *  @param keyPath  The keypath that changed (unused)
     */
    observeChange: function(change, keyPath)
    {
        var oldValue= this.cachedValue;
    
        //  doesn't matter which has changed...
        switch (this.operation)
        {
            case coherent.CompoundBinding.AND:
                this.cachedValue= this.left.value() && this.right.value();
                break;
            case coherent.CompoundBinding.OR:
                this.cachedValue= this.left.value() || this.right.value();
                break;
            default:
                throw new Error( "Unknown operation value for CompoundBinding" );
                break;
        }

        if (oldValue===this.cachedValue)
            return;
    
        this.update();    
    }
});
    
coherent.CompoundBinding.AND= "&&";
coherent.CompoundBinding.OR= "||";




/** Add some methods to the Array prototype to support Key Value functionality.
 *  
 *  @scope Array.prototype
 */
Class.extend(Array, {

    /** Retrieve the "value" of a particular key for an Array object. This will
     *  invoke `valueForKey` on each array element and return an array of the
     *  results.
     *
     *  @param key  the name of the attribute to retrieve.
     *
     *  @returns an array containing the values for the particular key on each
     *           element of the array
     *  @throws `InvalidArgumentError` if the key is not specified
     **/
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError("the key is empty");

        if ('@count'==key)
            return this.length;
        
        //  create an array to hold the results
        var value= new Array(this.length);
        var index;
        var len= this.length;
    
        for (index=0; index<len; ++index)
            value[index]= this[index].valueForKey(key);

        return value;
    },

    /** Set a value for a particular key for all elements of the Array.
     *
     *  @param value    the value to assign
     *  @param key      the name of the attribute to assign
     *
     *  @throws InvalidArgumentError if the key is not specified
     **/
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError("key is empty");

        var index;
        var len= this.length;
        for (index=0; index<len; ++index)
            this[index].setValueForKey(value, key);
    },

    /** Find the indexes of the specified objects. Begins searching from the
     *  beginning of the array. Returns an empty array if none of the objects
     *  appear in this array.
     *
     *  @param objects  the objects to find
     *  
     *  @returns the indexes of the specified objects
     **/
    indexesOfObjects: function(objects)
    {
        var i;
        var len= objects.length;
        var result= [];
    
        var index;
    
        for (i=0; i<len; ++i)
        {
            index= this.indexOf(objects[i]);
            if (-1===index)
                continue;
            result.push(index);
        }
    
        return result;
    },

    /** Append the object to the end of the array. This method begins observing
     *  changes for the new element and notifies its observers of the insertion.
     *
     *  @param object the object to add to the array
     **/
    addObject: function(object)
    {
        var index= this.length;
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                [object], null, [index]);
        this.push(object);
        this.observeElementAtIndex(index);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Add all the objects in the array to this array. This method begins
     *  observing all the new elements and will send a change notification for
     *  the insertion.
     *  
     *  @TODO: Don't use individual calls to addObject, that's too slow.
     *
     *  @param array the source of the new objects
     **/
    addObjects: function(array)
    {
        var index;
        var len= array.length;
        for (index=0; index<len; ++index)
            this.addObject(array[index]);
    },

    /** Insert an object at the specified index. Wrapper for the standard splice
     *  method that observes the new element and fires a change notification for
     *  the array's observers.
     *
     *  @param object   the object to insert into the array
     *  @param index    where in the array to insert the object
     *  
     *  @throws `RangeError` if the index is either less than 0 or greater than
     *          or equal to the length of the array.
     **/
    insertObjectAtIndex: function(object, index)
    {
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );

        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                [object], null, [index]);
        this.splice(index, 0, object);
        this.observeElementAtIndex(index);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Insert a number of objects at the specified indexes. The indexes need
     *  not be contiguous. New elements will be observed for changes and a
     *  single change notification will be sent for the entire insertion.
     *  
     *  @param objects  an array of objects to insert
     *  @param indexes  an array of indexes for where the objects should be
     *                  inserted.
     *  
     *  @throws `InvalidArgumentError` if the length of `objects` does not equal
     *          the length of `indexes`.
     */
    insertObjectsAtIndexes: function(objects, indexes)
    {
        if (objects.length!==indexes.length)
            throw new InvalidArgumentError('length of objects and indexes parameters must be equal');
        
        var len= objects.length;
        var i;
        var index;
        
        for (i=0; i<len; ++i)
        {
            index= indexes[i];
            this.splice(index, 0, objects[i]);
            this.observeElementAtIndex(index);
        }
        
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.insertion,
                                                objects, null, indexes);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },
        
    /** Remove an object from the array. This will automatically stop observing
     *  changes to the element.
     *  
     *  @param object   the object to remove
     */
    removeObject: function(object)
    {
        var index= this.indexOf(object);
        if (-1===index)
            return;
        this.removeObjectAtIndex(index);
    },
    
    /** Remove each of the given objects from the array. Changes to the removed
     *  objects will no longer trigger change notifications.
     *  
     *  @param objects  an array of objects to remove
     */
    removeObjects: function(objects)
    {
        var len= objects.length;
        var index;
        
        for (var i=0; i<len; ++i)
        {
            index= this.indexOf(objects[i]);
            if (-1===index)
                continue;
            this.removeObjectAtIndex(index);
        }
    },
    
    /** Remove all the objects with the given indexes. Removed elements will no
     *  longer trigger change notifications (unless they appear more than once).
     *  
     *  @param indexes  the indexes of the objects to remove
     */
    removeObjectsAtIndexes: function(indexes)
    {
        var len=indexes.length;
        for (var i=0; i<len; ++i)
            this.removeObjectAtIndex(indexes[i]);
    },
    
    /** Remove an object from the array at the specified index.
     *
     *  @param index    the location of the object to remove
     **/
    removeObjectAtIndex: function(index)
    {
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );
        this.stopObservingElementAtIndex(index);
        var oldValue= this.splice(index, 1);
        var change= new coherent.ChangeNotification(this,
                                                coherent.ChangeType.deletion,
                                                null, oldValue, [index]);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Remove all objects from the array.
     **/
    removeAllObjects: function()
    {
        var index;
        var indexArray= [];
        var len= this.length;
    
        indexArray.length= len;
        for (index=0; index<len; ++index)
        {
            this.stopObservingElementAtIndex(index);
            indexArray[index]= index;
        }

        var oldValue= this.splice(0, len);
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.deletion,
                                                null, oldValue, indexArray);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Retrieve a sub-set of this array containing the objects at the specified
     *  array indexes.
     *
     *  @param indexes  the indexes of the retrieved objects
     *  
     *  @returns a new array containing only those objects at the specified indexes.
     **/
    objectsAtIndexes: function(indexes)
    {
        var i;
        var result= [];
        var len= indexes.length;
        result.length= indexes.length;
    
        for (i=0; i<len; ++i)
            result[i]= this[indexes[i]];
        return result;
    },

    /** Change notification handler for array elements. This handler receives a
     *  notification for changes to the key values of array elements.
     *
     *  @param change   a ChangeNotification object
     *  @param keyPath  the key path that has changed
     *  @param context  the context information original specified for this key
     **/
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        //  Determine the index of the object generating the change
        //  notification, but since elements can move around, I need to look
        //  up the index.
        var obj= change.object;
        var elementIndex= this.indexOf(obj);
        
        if (-1===elementIndex)
        {
            //  no longer actually in the array
            obj._removeParentLink(this, null, this.__uid);
            return;
        }
        
        //  Pass this along up the change
        var elementChange= new coherent.ChangeNotification(obj,
                                                   coherent.ChangeType.replacement,
                                                   [change.newValue],
                                                   [change.previousValue],
                                                   [elementIndex]);
        this.notifyObserversOfChangeForKeyPath(elementChange, keyPath);
    },

    /** Setup the observer structure for an array element. This allows the array to
     *  propagate change notifications for its elements.
     *
     *  @private
     *  
     *  @param index    the index of the element to observe
     **/
    observeElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value || !value._addParentLink)
            return;
            
        value._addParentLink(this, null, this.__uid);
    },

    /** Cancel observing change notifications for the specified element.
     *  
     *  @private
     *  
     *  @param index    the index of the element to ignore
     */
    stopObservingElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value._removeParentLink)
            return;

        value._removeParentLink(this, null, this.__uid);
    },

    /** Initialise Key Value Observing for this array.
     *  
     *  @private
     **/
    initialiseKeyValueObserving: function()
    {
        /*  This array has never had an observer. I'll probe it to make certain
            the container relationships are established correctly.
         */
        var index;
        var len= this.length;
    
        this.__observers= {};
        this.__uid= coherent.generateUid();
        
        for (index=0; index<len; ++index)
            this.observeElementAtIndex(index);
    }
    
});

//  Add all KVO methods to Arrays
coherent.KVO.adapt(Array.prototype);





/** Implementations of the Array Operators for Key Value Coding.
 *  
 *  @namespace
 **/
coherent.ArrayOperator= {

    avg: function(values)
    {
        return this.sum(values) / values.length;
    },
    
    count: function(values)
    {
        throw new InvalidArgumentError( "@count operator must end the keyPath" );
    },
    
    distinctUnionOfArrays: function(values)
    {
        //  Return the distinct elements from the big flat array.
        return this.unionOfArrays(values).distinct();
    },
    
    distinctUnionOfObjects: function(values)
    {
        return values.distinct();
    },
    
    max: function(values)
    {
        var max= null;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (null===max || v>max)
                max= v;
        }
        return max;
    },
    
    min: function(values)
    {
        var min= null;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (null===min || v<min)
                min= v;
        }
        return min;
    },
    
    sum: function(values)
    {
        var sum= 0;
        var len= values.length;
        var i;
        for (i=0; i<len; ++i)
            sum+= values[i];
        return sum;
    },
    
    unionOfArrays: function(values)
    {
        //  TODO: Can't I just use: Array.prototype.concat.apply([], values)?
        var flattened= [];
        var len;
        var i;
        //  Flatten all arrays into a single BIG array
        for (i=0, len=values.length; i<len; ++i)
            flattened= flattened.concat( values[i] );
        return flattened;
    },
    
    unionOfObjects: function(values)
    {
        //  This seems to be a noop...
        return values;
    }
    
};



/** A KVO-compliant leaf object where it's keys may contain dots. This can be
 *  used to implement a resource lookup where the keys resemble Java resource
 *  keys (foo.bar.baz).
 *  
 *  @declare coherent.KVOTable
 *  @extends coherent.KVO
 */
coherent.KVOTable= Class.create(coherent.KVO, {

    valueForKeyPath: function(keyPath)
    {
        if ('array'===coherent.typeOf(keyPath))
            keyPath= keyPath.join('.');
        return this.valueForKey(keyPath);
    },
    
    setValueForKeyPath: function(value, keyPath)
    {
        if ('array'===coherent.typeOf(keyPath))
            keyPath= keyPath.join('.');
        return this.setValueForKey(value, keyPath);
    },
    
    infoForKeyPath: function(keyPath)
    {
        if ('array'===coherent.typeOf(keyPath))
            keyPath= keyPath.join('.');
        return this.infoForKey(keyPath);
    }

});

/** Localised marker strings used by various views
 *  @namespace
 */
coherent.strings= {

    //  Marker strings for InputView
    'marker.input.multipleValues': 'Multiple Values',
    'marker.input.placeholder': '',
    'marker.input.noSelection': 'No Selection',

    //  Marker values for ImageView (used to specify the src)
    'marker.image.multipleValues': '',
    'marker.image.placeholder': '',
    'marker.image.noSelection': '',
    
    //  Marker strings for TextView
    'marker.text.multipleValues': 'Multiple Values',
    'marker.text.placeholder': '',
    'marker.text.noSelection': 'No Selection'
    
};

/** Return the localised string for the given key. If the key is not present in
 *  the {@link coherent.strings} namespace, this function will just return the
 *  key itself.
 */
coherent.localisedString= function(key)
{
    if (key in coherent.strings)
        return coherent.strings[key];
        
    console.log('Localisation missing string for key: ' + key);
    return key;
}
/** An alias of {@link coherent.localisedString} which is rather shorter to
 *  type. This mimics a faily common localisation function pattern.
 *  
 *  @function
 *  @public
 */
var _= coherent.localisedString;





/** @scope coherent
 */
Object.extend(coherent, {

    dataModel: new coherent.KVO(),
    
    /** Register a model object in the binding context for the given name. If a
        previous model object was registered with the provided name, it will no
        longer be available.
        @param model    the model object that should be available for binding
        @param name     the name by which the object should be made available
     **/
    registerModelWithName: function(model, name)
    {
        coherent.dataModel.setValueForKey(model, name);
    },

    /** Unregister a named model object from the binding context.
        @param name     the name of the model object to remove from the context.
     **/
    unregisterModelWithName: function(name)
    {
        delete coherent.dataModel[name];
    },
    
    DataModel: function(name, data)
    {
        data= coherent.KVO.adaptTree(data);
        coherent.registerModelWithName(data, name);
        return data;
    }

});





if ('undefined'===typeof(Element))
    Element= {};

/**
 *  @scope Element
 */
Object.extend(Element, {

    uniqueId: function()
    {
        return 'coherent_id_' + Element.assignId.uniqueId++;
    },
    
    assignId: function(element)
    {
        var fn= arguments.callee;
        if (!fn.uniqueId)
            fn.uniqueId= 1;
            
        var id= element.id || ('coherent_id_' + fn.uniqueId++);
        return element.id= id;
    },

    hasClassName: function(element, className)
    {
        var elementClassName = element.className;
        if (!elementClassName)
            return false;
        if (elementClassName==className)
            return true;
        
        var classNameRegex= new RegExp("(^|\\s)" + className + "(\\s|$)");
        return classNameRegex.test(elementClassName);
    },

    addClassName: function(element, className)
    {
        if (!className)
            return;
            
        if (Element.hasClassName(element, className))
            return;
        element.className += ' ' + className;
    },

    removeClassName: function(element, className)
    {
        if (!className)
            return;
            
        var classNameRegex= new RegExp("(^|\\s)" + className + "(\\s|$)");

        element.className= element.className.replace(classNameRegex, ' ').trim();
    },
    
    /** Add and remove classes to/from an element. This preserves existing classes
        and only adds the class if it doesn't already exist and only removes classes
        that do exist.
    
        @param addClasses       either a single class name or an array of classes to
                                add to the element
        @param removeClasses    either a single class name or an array of classes to
                                remove from the element
        @param element          the element to modify
     **/
    updateClass: function(element, classesToAdd, classesToRemove)
    {
        var classes= $S(element.className.split(' '));
        var add= Set.add;
        var remove= Set.remove;
        
        var i;
        var len;
        
        if ('string'===typeof(classesToAdd))
            add(classes, classesToAdd);
        else
            for (i=0, len=classesToAdd.length; i<len; ++i)
                add(classes, classesToAdd[i]);
                
        if ('string'===typeof(classesToRemove))
            remove(classes, classesToRemove);
        else
            for (i=0, len=classesToRemove.length; i<len; ++i)
                remove(classes, classesToRemove[i]);
                
        element.className= Set.toArray(classes).join(' ');
    },
    
    /** IE has problems with cloneNode, so a wrapper is necessary.
     */
    clone: function(e)
    {
        return e.cloneNode(true);
    },
    
    depthFirstTraversal: function(e, visitor, scope)
    {
        if (!e || !visitor)
            return;
        var root= e;
        
        scope= scope||visitor;

        if (1==e.nodeType)
            visitor.call(scope, e);
            
        e= e.firstChild;
        
        while (e)
        {
            if (1===e.nodeType)
                visitor.call(scope, e);
                
            if (e.firstChild)
            {
                e= e.firstChild;
                continue;
            }
            
            if (e.nextSibling)
            {
                e= e.nextSibling;
                continue;
            }

            do
            {
                e= e.parentNode;
                if (e==root)
                    return;
            } while (!e.nextSibling);
            
            e= e.nextSibling;
        }
    }
    
});



if (coherent.Browser.IE)
{
    Element.clone= function(element)
    {
        var node= element.cloneNode(false);
        
        if ('TR'!=element.tagName)
        {
            node.innerHTML= element.innerHTML;
            return node;
        }

        // special handling for TRs
        var cellIndex;
        var originalCell;
        var newCell;

        for (cellIndex=0; cellIndex<element.children.length; ++cellIndex)
        {
            originalCell= element.children[cellIndex];
            newCell= originalCell.cloneNode(false);
            newCell.id= '';
            newCell.innerHTML= originalCell.innerHTML;
            node.appendChild(newCell);
        }
        return node;
    };
}




if ('undefined'===typeof(Event))
    Event= {};

Event._domHasFinishedLoading= function()
{
    if (arguments.callee.done)
        return;
    arguments.callee.done= true;

    if (this._domLoadedTimer)
        window.clearInterval(this._domLoadedTimer);
    
    var callbacks= Event._readyCallbacks;
    var len= callbacks.length;
    var i;
    
    for (i=0; i<len; ++i)
        callbacks[i]();

    Event._readyCallbacks = null;
}
    
    
if (!coherent.Browser.IE)
{

    Object.extend(Event, {

        observe: function(node, eventName, handlerMethod)
        {
            if ('on'==eventName.slice(0,2))
                eventName= eventName.slice(2);
            node.addEventListener(eventName, handlerMethod, false);
        },

        stopObserving: function(node, eventName, handlerMethod)
        {
            if ('on'==eventName.slice(0,2))
                eventName= eventName.slice(2);
            node.removeEventListener(eventName, handlerMethod, false);
        },

    	stop: function(event)
    	{
    		event.preventDefault();
    		event.stopPropagation();
    	},
    	
    	onDomReady: function(f)
        {
            //  If the DOM has already loaded, fire off the callback as soon as
            //  possible after returning from this method.
            if (Event._domHasFinishedLoading.done)
            {
                window.setTimeout(f, 0);
                return;
            }
        
            if (!Event._readyCallbacks)
            {
                document.addEventListener("DOMContentLoaded",
                                          Event._domHasFinishedLoading,
                                          false);
                
                function checkReadyState()
                {
                    if ((/loaded|complete/).test(document.readyState))
                        Event._domHasFinishedLoading();
                }
            
                if (coherent.Browser.Safari)
                    Event._domLoadedTimer = window.setInterval(checkReadyState, 10);
            
                Event.observe(window, 'load', Event._domHasFinishedLoading);
                Event._readyCallbacks= [];
            }
        
            Event._readyCallbacks.push(f);
        }


    });
    
}
else /** MSIE uses different methods for event capture. **/
{

    Object.extend(Event, {
    
        observe: function(node, eventName, handlerMethod)
        {
            if ('on'!=eventName.slice(0,2))
                eventName= 'on'+eventName;
            node.attachEvent(eventName, handlerMethod);
        },
    
        stopObserving: function(node, eventName, handlerMethod)
        {
            if ('on'!=eventName.slice(0,2))
                eventName= 'on'+eventName;
            node.detachEvent(eventName, handlerMethod);
        },

    	stop: function(event)
    	{
    		event= event||window.event;
    		event.returnValue = false;
    		event.cancelBubble = true;
    	},
    	
    	onDomReady: function(f)
        {
            //  If the DOM has already loaded, fire off the callback as soon as
            //  possible after returning from this method.
            if (Event._domHasFinishedLoading.done)
            {
                window.setTimeout(f, 0);
                return;
            }
        
            if (!Event._readyCallbacks)
            {
                document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
                var script= document.getElementById("__ie_onload");
                script.onreadystatechange = function()
                {
                    if ("complete"===this.readyState)
                        Event._domHasFinishedLoading(); 
                };
                script= null;
            
                Event.observe(window, 'load', Event._domHasFinishedLoading);
                Event._readyCallbacks= [];
            }
        
            Event._readyCallbacks.push(f);
        }
    	
    	
    });
}


/*
 *
 * Copyright (C) 2007-2008 Diego Perini
 * All rights reserved.
 *
 * nwmatcher.js - A fast selector engine not using XPath
 *
 * Author: Diego Perini <diego.perini at gmail com>
 * Version: 0.99.3
 * Created: 20070722
 * Release: 20080316
 *
 * License:
 *	http://javascript.nwbox.com/NWMatcher/MIT-LICENSE
 *
 * Download:
 *	http://javascript.nwbox.com/NWMatcher/nwmatcher.js
 *
 */

window.NW=window.NW||{};
var NW = window.NW;

NW.Dom=function(){

	// version string
	var version='0.99.3',

	// the selecting functions
	// used to test a collection
	compiledSelectors={},

	// the matching functions
	// used to test an element
	compiledMatchers={},

	// selection matched elements
	cachedResults={},

	// selection starting element
	from=null,

	// caching levels
	// DOM frequently modified (caching comlpetely disabled)
	DYNAMIC=0,
	// DOM may be modified but we catch it (moderate caching)
	RELAXED=1,
	// DOM will not be modified from now on (aggressive caching)
	STATIC=2,

	// attribute names may be passed case insensitive
	// accepts chopped attributes like "class" and "for"
	// but I don't know if this is good for every token
	camelProps=[
		'htmlFor','className','tabIndex','accessKey','maxLength',
		'readOnly','longDesc','frameBorder','isMap','useMap','noHref','noWrap',
		'colSpan','rowSpan','cellPadding','cellSpacing','marginWidth','marginHeight'
	],

	// nth pseudo selector (CSS3)
	nth_pseudo=/\:(nth)\-/,
	// child pseudo selector (CSS3)
	child_pseudo=/\:(nth|first|last|only)\-/,
	// of-type pseudo selectors (CSS3)
	oftype_pseudo=/\-(of-type)/,

	// trim leading whitespaces
	TR=/^\s+|\s+$/g,

	// precompiled Regular Expressions
	E={
		// nth child pseudos
		npseudos:/^\:(nth-)?(child|first|last|only)?-?(child)?-?(of-type)?(\((?:even|odd|[^\)]*)\))?(.*)/,
		// simple pseudos
		spseudos:/^\:([\w]+)?(\(.*\))?(?:\s+|$)(.*)/,
		// E > F
		children:/^\s*\>\s*(.*)/,
		// E + F
		adjacent:/^\s*\+\s*(.*)/,
		// E ~ F
		relative:/^\s*\~\s*(.*)/,
		// E F
		ancestor:/^(\s+)(.*)/,
		// attribute
		A:/^\[([\w-]+)(\~|\^|\*|\$|\!|\|)?(\=)?"?([^\"\]]+)?"?\](.*)/,
		// class
		C:/^\.([\w-]+)(.*)/,
		// id
		I:/^\#([\w-]+)(.*)/,
		// tag
		T:/^([\w-]+)(.*)/,
		// all
		X:/^\*(.*)/
	},

	// initial optimizations
	// by single/multi tokens
	// only for select method
	O={
		// all with whitespaces
		// maybe the worst case
		// being "\r\n\t * \r\n"
		'X':/(^\s*\*\s*)$/,
		// single class, id, tag
		'C':/^\.([\w-]+)$/,
		'I':/^\#([\w-]+)$/,
		'T':/^([\w]+)$/,
		// starts with a tag name
		'N':/^([\w]+)(\#|\.|\[)?/
	},

	// convert nodeList to array
	toArray=
		function(a){
			var i=-1,n,r=[];
			while((n=a[++i])){
				r[r.length]=n;
			}
			return r;
		},

	// compile a selector
	compileSelector=
		function(s,j,q){
			var a,b,i,m,t;
			while(s){
				// * match all
				if((m=s.match(E.X))){
					// always matching
					j='if(e){'+j+'}';
				}
				// #Foo Id case sensitive
				else if((m=s.match(E.I))){
					j='if(e&&e.id=="'+m[1]+'"){'+j+'}';
				}
				// Foo Tag case insensitive (?)
				else if((m=s.match(E.T))){
					j='if(e&&e.nodeName.toLowerCase()=="'+m[1].toLowerCase()+'"){'+j+'}';
				}
				// .Foo Class case sensitive
				else if((m=s.match(E.C))){
					j='if(e&&(" "+e.className+" ").indexOf(" '+m[1]+' ")>-1){'+j+'}';
					//j='if(((" "+e.className).replace(/\\s+/g," ")+" ").indexOf(" '+m[1]+' ")>-1){'+j+'}';
				}
				// [attr] [attr=value] [attr="value"] and !=, *=, ~=, |=, ^=, $=
				else if((m=s.match(E.A))){
					// fix common misCased attribute names
					for(i=0;i<camelProps.length;++i){
						if(camelProps[i].toLowerCase().indexOf(m[1])===0){
							m[1]=camelProps[i];
							break;
						}
					}
					j='if(e&&'+
						// change behavior for [class!=madeup]
						//(m[2]=='!'?'e.'+m[1]+'&&':'')+
						// match attributes or property
						(m[2]&&m[3]&&m[4]&&m[2]!='!'?
							(m[2]=='~'?'(" "+':(m[2]=='|'?'("-"+':''))+'e.'+m[1]+
								(m[2]=='|'||m[2]=='~'?'.replace(/\s+/g," ")':'')+
							(m[2]=='~'?'+" ")':(m[2]=='|'?'+"-")':''))+
							 	(m[2]=='!'||m[2]=='|'||m[2]=='~'?'.indexOf("':'.match(/')+
							(m[2]=='^'?'^':m[2]=='~'?' ':m[2]=='|'?'-':'')+m[4]+
							(m[2]=='$'?'$':m[2]=='~'?' ':m[2]=='|'?'-':'')+
								(m[2]=='|'||m[2]=='~'?'")>-1':'/)'):
							(m[3]&&m[4]?'e.'+m[1]+(m[2]=='!'?'!':'=')+'="'+m[4]+'"':'e.'+m[1]))+
					'){'+j+'}';
				}
				// E + F (F adiacent sibling of E)
				else if((m=s.match(E.adjacent))){
					j='if(e){while((e=e.previousSibling)&&e.nodeType!=1);if(e){'+j+'}}';
				}
				// E ~ F (F relative sibling of E)
				else if((m=s.match(E.relative))){
					j='if(e){while((e=e.previousSibling))if(e.nodeType==1){'+j+';break;}}';
				}
				// E > F (F children of E)
				else if((m=s.match(E.children))){
					j='if(e&&(e=e.parentNode)){'+j+'}';
				}
				// E F (E ancestor of F)
				else if((m=s.match(E.ancestor))){
					j='if(e){while((e=e.parentNode)){'+j+';break;}}';
				}
				// CSS3 :root, :empty, :enabled, :disabled, :checked, :target
				// CSS2 :active, :focus, :hover (no way yet)
				// CSS1 :link, :visited
				else if((m=s.match(E.spseudos))){
					switch(m[1]){
						// CSS3 part of structural pseudo-classes
						case 'not':
							j=compileGroup(m[2].replace(/\((.*)\)/,'$1'),'',q)+'else{'+j+'}';
							break;
						case 'root':
							j='if(e&&e==(e.ownerDocument||e.document||e).documentElement){'+j+'}';
							break;
						case 'empty':
							j='if(e&&e.getElementsByTagName("*").length===0&&(e.childNodes.length===0||e.childNodes[0].nodeValue.replace(/\\s+/g,"").length===0)){'+j+'}';
							break;
						case 'contains':
							j='if(e&&(e.textContent||e.innerText||"").indexOf("'+m[2].replace(/\(|\)/g,'')+'")!=-1){'+j+'}';
							break;
						// CSS3 part of UI element states
						case 'enabled':
							j='if(e&&!e.disable){'+j+'}';
							break;
						case 'disabled':
							j='if(e&&e.disable){'+j+'}';
							break;
						case 'checked':
							j='if(e&&e.checked){'+j+'}';
							break;
						// CSS3 target element
						case 'target':
							j='if(e&&e.id==location.href.match(/#([_-\w]+)$/)[1]){'+j+'}';
							break;
						// CSS1 & CSS2 link
						case 'link':
							j='if(e&&e.nodeName.toUpperCase()=="A"&&e.href){'+j+'}';
							break;
						case 'visited':
							j='if(e&&e.visited){'+j+'}';
							break;
						// CSS1 & CSS2 user action
						case 'active':
							// Internet Explorer, Firefox 3
							j='if(e&&(e.ownerDocument||e.document||e).activeElement&&e==(e.ownerDocument||e.document||e).activeElement){'+j+'}';
							break;
						case 'focus':
							// Internet Explorer, Firefox 3
							j='if(e&&e.hasFocus&&e.hasFocus()){'+j+'}';
							break;
						case 'hover':
							// not implemented (TODO)
							// track mousemove events
							// check event for mouse x,y
							// and match element boundaries (!?!)
							break;
						default:
							break;
					}
				}
				// :first-child, :last-child, :only-child,
				// :first-child-of-type, :last-child-of-type, :only-child-of-type,
				// :nth-child(), :nth-last-child(), :nth-of-type(), :nth-last-of-type()
				else if((m=s.match(E.npseudos))){
					if(m[5]){
						// remove the ( ) grabbed above
						m[5]=m[5].replace(/\(|\)/g,'');
						if(m[5]=='even'){a=2;b=0;}
						else if(m[5]=='odd'){a=2;b=1;}
						else{
							// assumes correct "an+b" format
							a=m[5].match(/^-/)?-1:m[5].match(/^n/)?1:0;
							a=a||((t=m[5].match(/(-?\d{1,})n/))?parseInt(t[1],10):0);
							b=b||((t=m[5].match(/(-?\d{1,})$/))?parseInt(t[1],10):0);
						}
						// handle 4 cases: 1 (nth) x 4 (child, of-type, last-child, last-of-type)
						t=(m[5]=='even'||m[5]=='odd'||a>b?b>=0?'%'+a+'==='+b:'==='+(a+b):a<0?'<='+b:'==='+b);
						// boolean indicating select (true) or match (false) method
						if(q){
							// add function for select method (q=true)
							// requires prebuilt arrays get[Childs|Twins]
							j='if(e&&s.'+(m[4]?'Twin':'Child')+'Indexes[k+1]'+t+'){'+j+'}';
						}else{
							// add function for "match" method (q=false)
							// this will not be in a loop, this is faster
							// for "match" but slower for "select" and it
							// also doesn't require prebuilt node arrays
							j='if((n=e)){'+
								'u=1'+(m[4]?',t=e.nodeName;':';')+
								'while((n=n.'+(m[2]=='last'?'next':'previous')+'Sibling)){'+
									'if(n.node'+(m[4]?'Name==t':'Type==1')+'){++u;}'+
								'}'+
								'if(u'+t+'){'+j+'}'+
							'}';

						}
					}else{
						// handle 6 cases: 3 (first, last, only) x 1 (child) x 2 (-of-type)
						if(q){
							// add function for select method (q=true)
							t=(m[4]?'Twin':'Child');
							j='if(e&&'+
								(m[2]=='first'?
									's.'+t+'Indexes[k+1]===1':
									m[2]=='only'?
										's.'+t+'Lengths[s.'+t+'Parents[k+1]]'+(m[4]?'[e.nodeName]':'')+'===1':
										m[2]=='last'?
											's.'+t+'Indexes[k+1]===s.'+t+'Lengths[s.'+t+'Parents[k+1]]'+(m[4]?'[e.nodeName]':''):'')+
							'){'+j+'}';
						}else{
							// add function for match method (q=false)
							j='if(n=e){'+
								(m[4]?'t=e.nodeName;':'')+
								'while((n=n.'+(m[2]=='first'?'previous':'next')+'Sibling)&&'+
									'n.node'+(m[4]?'Name!=t':'Type!=1')+');'+
								'if(!n&&(n=e)){'+
									(m[2]=='first'||m[2]=='last'?
										'{'+j+'}':
										'while((n=n.'+(m[2]=='first'?'next':'previous')+'Sibling)&&'+
												'n.node'+(m[4]?'Name!=t':'Type!=1')+');'+
										'if(!n){'+j+'}')+
								'}'+
							'}';
						}
					}
				}
				else{
					throw new Error('NW.Dom.compileSelector: syntax error, unknown selector rule "'+s+'"');
				}
				s=m[m.length-1];
			}
			return j;
		},

	// compile a comma separated group of selector
	compileGroup=
		// @s css selector to match (string)
		// @q query method to be used (boolean)
		function(s,q){
			var i=0,j='',k,d={},m,n='',p=s.split(',');
			// for each selector
			for(;i<p.length;++i){
				k=p[i].replace(TR,'');
				// avoid empty results
				if((m=k.match(E.T))){
					if(m[1]&&from){
						// if we have a selector tag but none exists
						if(from.getElementsByTagName(m[1]).length===0){
							continue;
						}
					}
				}
				// avoid repeating the same functions
				if(!d[k]){
					d[k]=k;
					// insert corresponding mode function
					if(q){
						j=compileSelector(k,'{r[r.length]=c[k];',q)+'}'+j;
					}else{
						j=compileSelector(k,'{return true;',q)+'}'+j.replace('break;','');
					}
				}
			}

			if(s.match(nth_pseudo)){
				n=',j,u,t,a';
			}else if(s.match(child_pseudo)){
				n=',t';
			}

			if(q){
				// for select method
				return new Function('c,s','var k=-1,e,r=[],n'+n+';while((e=c[++k])){'+j+'}return r;');
			}else{
				// for match method
				return new Function('e','var n,u;'+j.replace('break;','')+'return false;');
			}
		},

	IE=typeof document.fileSize!='undefined',

	// snapshot of elements contained in rootElement
	// also contains maps to make nth lookups faster
	// updated by each select/match if DOM changes
	Snapshot={
		Elements:[],
		ChildIndexes:[],
		ChildLengths:[],
		ChildParents:[],
		TwinIndexes:[],
		TwinLengths:[],
		TwinParents:[],
		isValid:false,
		HtmlSrc:''
	},

	// DYNAMIC | RELAXED | STATIC
	cachingLevel=RELAXED,

	// get element index in a node array
	getIndex=
		function(a,e,i){
			// ie only (too slow in opera)
			if(IE){
				getIndex=function(a,e){
					return e.sourceIndex||-1;
				};
			// gecko, webkit have native array indexOf
			}else if(a.indexOf){
				getIndex=function(a,e){
					return a.indexOf(e);
				};
			// other browsers will use this replacement
			}else{
				getIndex=function(a,e,i){
					i=a.length;
					while(--i>=0){
						if(e==a[i]){
							break;
						}
					}
					return i;
				};
			}
			// we overwrite the function first time
			// to avoid browser sniffing in loops
			return getIndex(a,e);
		},

	// build a twin index map
	// indexes by child position
	// (f)rom (t)ag
	getTwins=
		function(f,c){
			var k=0,e,r,p,s,x,
				h=[f],b=[0],i=[0],l=[0];
			while((e=c[k++])){
				h[k]=e;
				l[k]=0;
				p=e.parentNode;
				r=e.nodeName;
				if(s!=p){
					x=getIndex(h,s=p);
				}
				b[k]=x;
				l[x]=l[x]||{};
				l[x][r]=l[x][r]||0;
				i[k]=++l[x][r];
			}
			Snapshot.TwinParents=b;
			Snapshot.TwinIndexes=i;
			Snapshot.TwinLengths=l;
		},

	// build a child index map
	// indexes by tag position
	// (f)rom (t)ag
	getChilds=
		function(f,c){
			var	k=0,e,p,s,x,
				h=[f],b=[0],i=[0],l=[0];
			while((e=c[k++])){
				h[k]=e;
				l[k]=0;
				p=e.parentNode;
				if(s!=p){
					x=getIndex(h,s=p);
				}
				b[k]=x;
				i[k]=++l[x];
			}
			Snapshot.ChildParents=b;
			Snapshot.ChildIndexes=i;
			Snapshot.ChildLengths=l;
		},

	// check if cached snapshot has changed
	getCache=
		function(f){
			var d,s=Snapshot,c=s.Elements;
			if(c.length>0){
				d=c[0].ownerDocument||c[0].document;
				// DOM is say not to change but
				// will do a simple check anyway
				if(cachingLevel==STATIC&&
					(c.length==s.ChildIndexes.length||
					 c.length==s.TwinIndexes.length)){
					s.isValid=true;
				// DOM is say not to change, but may be
				}else if(cachingLevel==RELAXED&&
					s.HtmlSrc==d.body.innerHTML){
					s.isValid=true;
				}else{
					if(cachingLevel==RELAXED){
						s.HtmlSrc=d.body.innerHTML;
					}
					cachedResults={};
					s.isValid=false;
				}
			}else{
				cachedResults={};
				s.isValid=false;
			}
			Snapshot=s;
		};

	// ********** begin public methods **********
	return {

		// set required caching level
		// also invalidate current map
		setCache:
			function(l){
				cachingLevel=(l&3)||RELAXED;
				this.expireCache();
			},

		// expose the private method
		expireCache:
			function(){
				Snapshot.isValid=false;
			},

		// (e)lement match (s)elector return boolean true/false
		match:
			function(e,s){
				// make sure an element node was passed
				if(!(e&&e.nodeType&&e.nodeType==1)){
					return false;
				}
				// set starting element
				from=e;
				if(typeof s=='string'&&s.length>0){
					// cache compiled matchers
					if(!compiledMatchers[s]){
						compiledMatchers[s]=compileGroup(s,false);
					}
					// result of compiled matcher
					return compiledMatchers[s](e);
				}else{
					throw new Error('NW.Dom.match: "'+s+'" is not a valid CSS selector.');
				}
				return false;
			},

		// elements matching (s)elector optionally starting (f)rom node
		select:
			function(s,f){
				var i,c=[],m;
				if(!(f&&f.nodeType&&(f.nodeType==1||f.nodeType==9))){
					f=document;
				}
				// set starting element
				from=f;
				if(typeof s=='string'&&s.length>0){

					// BEGIN REDUCE/OPTIMIZE
					// * (all elements selector)
					if((m=s.match(O.X))){
						// fix IE comments as element
						c=f.getElementsByTagName('*');
						i=0;while(c[i].nodeType!=1){++i;}
						return toArray(c).slice(i);
					}
					// #Foo Id (single id selector)
					else if((m=s.match(O.I))){
						return [f.getElementById(m[1])];
					}
					// Foo Tag (single tag selector)
					else if((m=s.match(O.T))){
						return toArray(f.getElementsByTagName(m[1]));
					}
					// slice collection by tag if not caching
					else if((m=s.match(O.N))&&cachingLevel==DYNAMIC){
						if(m[1]){
							if(f.getElementsByTagName(m[1]).length==1){
								f=f.getElementsByTagName(m[1])[0];
								s=s.replace(m[1],'');
							}else if(m[2]){
								c=toArray(f.getElementsByTagName(m[1]));
								s=s.replace(m[1],'');
							}
							s=s.replace(TR,'');
						}
					}
					// END REDUCE/OPTIMIZE

					// collection of all nodes
					if(c.length<1){
						c=toArray(f.getElementsByTagName('*'));
					}

					// save current collection
					Snapshot.Elements=c;

					if(s.match(child_pseudo)){
						// check requested caching level
						if(cachingLevel==DYNAMIC){
							Snapshot.isValid=false;
						}else{
							getCache(c);
						}
						// check if storage synchronized
						if(Snapshot.isValid===false){
							if(s.match(oftype_pseudo)){
								// special of-type pseudo selectors
								getTwins(f,c);
							}else{
								// normal nth/child pseudo selectors
								getChilds(f,c);
							}
						}
					}
					// cache compiled selectors
					if(!compiledSelectors[s]){
						compiledSelectors[s]=compileGroup(s,true);
					}

					if(cachingLevel==DYNAMIC){
						// caching of results disabled
						return compiledSelectors[s](c,Snapshot);
					}else{
						// caching of results enabled
						if(!cachedResults[s]){
							cachedResults[s]=compiledSelectors[s](c,Snapshot);
						}
						return cachedResults[s];
					}
				}
				else{
					throw new Error('NW.Dom.select: "'+s+'" is not a valid CSS selector.');
				}
				return [];
			}

	};
	// *********** end public methods ***********
}();

coherent.easing= (function(){

    var halfPI= Math.PI/2;
    var PI= Math.PI;

    return {
        linear: function(t)
        {
        	return t;
        },

        // sinusoidal easing in - accelerating from zero velocity
        // t: current time (0..1)
        inSine: function(t)
        {
        	return 1 - Math.cos(t * halfPI);
        },

        // sinusoidal easing out - decelerating to zero velocity
        // t: current time (0..1)
        outSine: function(t)
        {
        	return Math.sin(t * halfPI);
        },

        // sinusoidal easing in/out - accelerating until halfway, then decelerating
        // t: current time (0..1)
        inOutSine: function(t)
        {
            return (1-Math.cos(t*PI))/2;
        },

        inBack: function(t, s)
        {
        	if (s == undefined) s = 1.70158;
        	return t*t*((s+1)*t - s);
        },

        // back easing out - moving towards target, overshooting it slightly, then reversing and coming back to target
        outBack: function(t, s)
        {
        	if (s == undefined) s = 1.70158;
        	t= t-1;
        	return (t*t*((s+1)*t + s) + 1);
        },

        outBackStrong: function(t, s)
        {
        	if (s == undefined) s = 1.70158*1.5;
        	t= t-1;
        	return (t*t*((s+1)*t + s) + 1);
        }

    };
    
})();




coherent.Animator = function() {
    // implicitly supported properties are: margin, padding, borderWidth, borderColor (see: normalizeProperties)
    var PROPERTIES = [ 'backgroundColor', 'borderTopColor', 'borderRightColor',
                       'borderBottomColor', 'borderLeftColor', 'borderTopWidth',
                       'borderRightWidth', 'borderBottomWidth',
                       'borderLeftWidth', 'color', 'display', 'fontSize',
                       'letterSpacing', 'lineHeight', 'opacity', 'width',
                       'height', 'top', 'bottom', 'left', 'right', 'marginTop',
                       'marginRight', 'marginBottom', 'marginLeft',
                       'paddingTop', 'paddingRight', 'paddingBottom',
                       'paddingLeft'];

    var DEFAULTS = {
        duration: 500,
        actions: {}
    };
    
    var timer      = null;
    var actors     = {};
    var actorCount = 0;
    var lastStep   = 0;
    
    var getStyles;
    
    if (navigator.userAgent.indexOf('MSIE')!=-1)
        getStyles= function(element, propsToGet)
        {
            var styles = {};

            propsToGet= propsToGet||PROPERTIES;

            var value;
            var p;
            var len= propsToGet.length;
            
            for (var i=0; i<len; ++i)
            {
                p= propsToGet[i];
                if ('opacity'===p)
                {
                    var opacity = element.currentStyle.filter.match(/opacity=(\d+)/i);
                    value = (null===opacity ? 1 : parseInt(opacity[1],10)/100);
                }
                else
                {
                    value = element.currentStyle[p];
                }
                if ('undefined'!==typeof(value))
                    styles[p]= parseCssValue(p, value);
            }
        
            return styles;
        };
    else
        getStyles= function(element, propsToGet) {
            var styles = {};
            var computedStyle= window.getComputedStyle(element, null);

            propsToGet= propsToGet||PROPERTIES;
        
            var value;
            var p;
            var len= propsToGet.length;

            for (var i=0; i<len; ++i)
            {
                p= propsToGet[i];
                value= element.style[p]||computedStyle[p]||null;
                if (null!==typeof(value))
                    styles[p]= parseCssValue(p, value);
            }
        
            return styles;
        };
    
    function getStylesForTree(node, info, propsToGet)
    {
        var id = Element.assignId(node);
        info[id] = getStyles(node, propsToGet);

        var len= node.childNodes.length;
        for (var i=0; i<len; ++i) {
            if (1!==node.childNodes[i].nodeType)
                continue;
            getStylesForTree(node.childNodes[i], info, propsToGet);
        }
        
        return info;
    }
    
    function parseCssValue(property, value)
    {
        switch(property) {
            case 'display':
                return value;
                
            case 'backgroundColor':
            case 'color':
            case 'borderColor':
            case 'borderTopColor':
            case 'borderRightColor':
            case 'borderBottomColor':
            case 'borderLeftColor':
                return stringToColor(value);

            case 'opacity':
                return parseFloat(value);

            default:
                if ('number'!==typeof(value))
                    value = parseInt(value, 10);

                if (isNaN(value))
                    // turn non-numeric values (auto, normal, etc) to 0
                    value = 0;
                return value;
        }
    }
    
    function stringToColor(color)
    {
        if (typeof(color) != "string")
            return color;
        
        var r,g,b, rgb;
        if ((rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i))) {
            r = parseInt(rgb[1], 10);
            g = parseInt(rgb[2], 10);
            b = parseInt(rgb[3], 10);
        } else if (color.length==4) {
            r = parseInt(color.charAt(1)+color.charAt(1), 16);
            g = parseInt(color.charAt(2)+color.charAt(2), 16);
            b = parseInt(color.charAt(3)+color.charAt(3), 16);
        } else {
            r = parseInt(color.substr(1,2), 16);
            g = parseInt(color.substr(3,2), 16);
            b = parseInt(color.substr(5,2), 16);
        }
        return [r,g,b];
    }
    
    function normaliseProperties(props)
    {
        if ('margin' in props)
        {
            props.marginLeft= props.marginRight= props.marginTop= props.marginBottom= props.margin;
            delete props.margin;
        }
        if ('padding' in props)
        {
            props.paddingLeft= props.paddingRight= props.paddingTop= props.paddingBottom= props.padding;
            delete props.padding;
        }
        if ('borderColor' in props)
        {
            props.borderLeftColor= props.borderRightColor= props.borderTopColor=
                                   props.borderBottomColor= props.borderColor;
            delete props.borderColor;
        }
        if ('borderWidth' in props)
        {
            props.borderLeftWidth= props.borderRightWidth= props.borderTopWidth=
                                   props.borderBottomWidth= props.borderWidth;
            delete props.borderWidth;
        }
        return props;
    }

    function animate()
    {
        if (timer)
            return;
        
        lastStep = (new Date()).getTime();
        timer = window.setInterval(step, 10);
    }
    
    function step()
    {
        var element, t, data;
        var now = (new Date()).getTime();
        
        for (var a in actors) {
            for (var p in actors[a]) {
                if ("_node" == p || "_callback" == p) 
                    continue;

                data = actors[a][p][0];
                if (now >= data.endTime) {
                    data.step(1);
                    onAnimationComplete(a, p);
                } else if (data.startTime <= now) {
                    t = (now-data.startTime)/data.totalTime;
                    data.step(t);
                } else {
                    continue;
                }
            }
        }
        
        lastStep = now;
    }
    
    function ColourStepper(property, element, start, end, shouldCleanup)
    {
        this.property= property;
        this.element= element;
        this.start= start;
        this.end= end;
        this.delta= [end[0]-start[0],
                     end[1]-start[1],
                     end[2]-start[2]];
        this.shouldCleanup= !!shouldCleanup;                    
    }
    ColourStepper.prototype.step= function(t)
    {
        if (this.curve)
            t= this.curve(t);
        var c= (Math.round(t * this.delta[0] + this.start[0]) << 16) +
               (Math.round(t * this.delta[1] + this.start[1]) << 8) +
               Math.round(t * this.delta[2] + this.start[2]);
        c= c.toString(16);
        while (c.length < 6) {
            c= "0" + c;
        }
        this.element.style[this.property]= "#"+c;
    }
    ColourStepper.prototype.cleanup= function()
    {
        this.element.style[this.property]= '';
    }
    
    function NumericStepper(property, element, start, end, shouldCleanup)
    {
        this.property= property;
        this.element= element;
        this.start= start;
        this.end= end;
        this.delta= end-start;
        this.shouldCleanup = !!shouldCleanup;
    }
    NumericStepper.prototype.step= function(t)
    {
        if (this.curve)
            t= this.curve(t);
        this.element.style[this.property]= Math.round(t*this.delta + this.start) + 'px';
    }
    NumericStepper.prototype.cleanup= function() {
        this.element.style[this.property]= '';
    }

    function OpacityStepper(element, start, end, shouldCleanup)
    {
        this.element= element;
        this.start= start;
        this.end= end;
        this.delta= end-start;
        this.shouldCleanup = !!shouldCleanup;
    }
    if (navigator.userAgent.indexOf('MSIE')!=-1) {
        OpacityStepper.prototype.step= function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var opacity = t * this.delta + this.start;
            this.element.style.filter = (opacity>=1) ? '' : 'Alpha(Opacity='+opacity*100+')';
        }
        OpacityStepper.prototype.cleanup= function()
        {
            this.element.style.filter = '';
        }
    } else {
        OpacityStepper.prototype.step= function(t)
        {
            if (this.curve)
                t= this.curve(t);
            var opacity= t*this.delta + this.start;
            this.element.style.opacity= (opacity>=1)?'':opacity;
        }
        OpacityStepper.prototype.cleanup= function() 
        {
            this.element.style.opacity= '';
        }
    }
        
    function DisplayStepper(element, start, end)
    {
        this.element= element;
        this.start= start;
        this.end= end;
    }
    DisplayStepper.prototype.step= function(t)
    {
        this.element.style.display = (t==1) ? this.end : this.start;
    }
    
    function ClassNameStepper(element, start, end)
    {
        this.element= element;
        this.start= start;
        this.end= end;
    }
    ClassNameStepper.prototype.step= function(t)
    {
        if (t>=0.5) {
            this.element.className = this.end;
            this.step = function(t){};
        }
    }

    function getStepper(property, element, start, end, cleanup)
    {
        switch(property)
        {
            case '_className':
                return new ClassNameStepper(element, start, end);
            case 'display':
                return new DisplayStepper(element, start, end);
            case 'backgroundColor':
            case 'color':
            case 'borderColor':
            case 'borderTopColor':
            case 'borderRightColor':
            case 'borderBottomColor':
            case 'borderLeftColor':
                return new ColourStepper(property, element, start, end, cleanup);
            
            case 'opacity':
                return new OpacityStepper(element, start, end, cleanup);
            
            default:
                return new NumericStepper(property, element, start, end, cleanup);
        }
    }
    
    function onAnimationComplete(elementID, property)
    {
        var callbacks = [];
        var stepper = actors[elementID][property].shift();
        
        if (stepper.shouldCleanup && "function"==typeof(stepper.cleanup))
            stepper.cleanup();
        
        if ("function" == typeof(stepper.callback)) {
            callbacks.push(stepper.callback);
        }
        
        if (actors[elementID][property].length===0) {
            delete actors[elementID][property];
        }

        var propCount = 0;
        for (var p in actors[elementID]) {
            if (p != "_node" && p != "_callback")
                propCount++;
        }
        
        if (0 === propCount) {
            if ("function" == typeof(actors[elementID]._callback)) {
                callbacks.push(actors[elementID]._callback);
            }
            delete(actors[elementID]);
            actorCount--;
        }
        
        if (0 === actorCount) {
            window.clearInterval(timer);
            timer = null;
        }
        
        // execute callbacks
        for (var c=0; c<callbacks.length; c++) {
            callbacks[c](elementID, property);
        }
    }
    
    function animateProperties(element, hash, options)
    {
        options = Object.applyDefaults(options, DEFAULTS);
        
        if (options.delay)
        {
            arguments.callee.delay(options.delay, element, hash, options);
            delete options.delay;
            return;
        }
        
        var elementId = Element.assignId(element);

        if (!(elementId in actors)) {
            actorCount++;
            actors[elementId] = {_node: element};            
        }
        if ("function" == typeof(options.callback)) {
            actors[elementId]._callback = options.callback;
        }
        
        var actor       = actors[elementId];
        var groupStart  = coherent.EventLoop.start;
        var groupEnd    = groupStart + options.duration;
        var startStyles = options.startStyles || getStyles(element,
                                                           Set.toArray(hash));

        normaliseProperties(hash);
        
        // assemble animation data structure
        for (var p in hash) {
            if (-1===PROPERTIES.indexOf(p) && p!="_className")
                continue;
                
            var value = ("object" == typeof(hash[p]) && 
                !(hash[p] instanceof Array)) ? hash[p].value : hash[p];
            var delay = hash[p].delay || 0;
            var start = groupStart + delay;
            var end   = (hash[p].duration ? groupStart+hash[p].duration : groupEnd) + delay;
            var curve = hash[p].curve || options.curve;
                        
            // resolve collisions
            if (actor[p]) {
                function testCollision(returnValue, item, index)
                {
                    var endCollision = item.startTime < end && item.endTime > end;
                    var startCollision = item.startTime < start && item.endTime > start;
                    if (!startCollision && !endCollision)
                        returnValue.push(item);
                    return returnValue;
                }
                
                actor[p]= actor[p].reduce(testCollision, []);
            } else {
                actor[p] = [];
            }
            
            var stepper= getStepper(p, element, startStyles[p], value);
            stepper.startTime = start;
            stepper.endTime   = end;
            stepper.totalTime = end-start;
            stepper.curve     = curve;
            
            if ("object" == typeof(hash[p]) && ('callback' in hash[p])) {
                stepper.callback = hash[p].callback;
            }
            if (options.stepBackToZero) {
                stepper.step(0);
            }

            actor[p].push(stepper);
        }
        
        animate();        
    }
    
    function animateClassName(element, className, options)
    {
        options = Object.applyDefaults(options, DEFAULTS);
        
        if (options.delay) {
            arguments.callee.delay(options.delay, element, className, options);
            delete options.delay;
            return;
        }
        
        var propsToGet = options.only;
        // get old styles
        var startStyles = getStylesForTree(element, {}, propsToGet);
        
        // set className and clear any styles that we're currently animating on
        // to remove any conflicts with the new className
        var oldClassName = element.className;
        element.className = className;
        for (var id in startStyles) {
           if (actors[id]) {
               for (var p in actors[id]) {
                   if (p != "_node" && p != "_callback")
                       actors[id]._node.style[p] = '';
               }
           }
        }
        
        // get destination styles
        var endStyles = getStylesForTree(element, {}, propsToGet);
        element.className = oldClassName;
        
        var thingsToAnimate = {};
        var nodesToCleanup = [];
        
        options.stepBackToZero = true;
        options.cleanup= true;

        thingsToAnimate[element.id] = {_className: {
            value: className,
            duration: options.duration
        }};
        
        var optionsCallback = options.callback;
        var finalCallback = function(callback){
            cleanupNodes();
            if (callback) 
                callback();            
        }.sync(this, optionsCallback);
        
        function animateNode(node) {
            var nodeAction = options.actions[node.id];
            
            if (!nodeAction) {
                var fromDisplay = startStyles[node.id].display;
                var toDisplay   = endStyles[node.id].display;
                
                if (fromDisplay=='none' && toDisplay=='none')
                    nodeAction = null;
        
                if (fromDisplay=='none' && toDisplay!=='none')
                    nodeAction = coherent.Animator.FADE_IN_NODE;
    
                if (fromDisplay!=='none' && toDisplay=='none')
                    nodeAction = coherent.Animator.FADE_OUT_NODE;
            }
                        
            switch (nodeAction) {
            case null:
            case coherent.Animator.IGNORE_NODE:
                return;
            case coherent.Animator.FADE_NODE:
                // do animations
                thingsToAnimate[node.id] = thingsToAnimate[node.id] || {};
                thingsToAnimate[node.id].opacity = {
                    value: 0, 
                    duration: options.duration/2, 
                    callback: function(){
                        Element.setOpacity(node, 0);
                        animateProperties(node, {opacity: 1}, {duration: options.duration/2});
                    }
                };
                nodesToCleanup.push(node);
                
                return;
            case coherent.Animator.FADE_OUT_NODE:
                // don't need to consider child nodes, because they won't be
                // visible after self node fades out
                node.style.display = startStyles[node.id].display;
                thingsToAnimate[node.id] = thingsToAnimate[node.id] || {};
                thingsToAnimate[node.id].opacity = {
                    value: 0, 
                    duration: options.duration/2, 
                    callback: function(){ node.style.display=''; }
                };
                nodesToCleanup.push(node);
                
                return;
            case coherent.Animator.FADE_IN_NODE:
                // don't need to consider child nodes, because they'll have their
                // new style when fading in.
                startStyles[node.id].opacity = 0;
                thingsToAnimate[node.id] = thingsToAnimate[node.id] || {};
                thingsToAnimate[node.id].opacity = {
                    value: 1, 
                    duration: options.duration/2, 
                    delay: options.duration/2
                };
                nodesToCleanup.push(node);
                
                return;
            case coherent.Animator.MORPH_NODE:
            default:
                // calculate differences
                var from = startStyles[node.id];
                var to = endStyles[node.id];

                for (var p in from) {
                    // only animate over properties that don't match, or are to be overwritten
                    if ((actors[node.id] && p in actors[node.id]) || 
                        startStyles[node.id][p].toString() != endStyles[node.id][p].toString()) {
                        thingsToAnimate[node.id] = thingsToAnimate[node.id] || {};
                        thingsToAnimate[node.id][p] = endStyles[node.id][p];
                    }
                }
                nodesToCleanup.push(node);
                break;
            }
            
            var i, len;
            var children = node.childNodes;
    
            for (i=0, len=children.length; i<len; ++i) {
                if (1!==children[i].nodeType)
                    continue;
                animateNode(children[i]);
            }
        }
        function cleanupNodes() {
            nodesToCleanup.forEach(function(node){
                node.style.display='';
                node.style.overflow='';
                node.style.top='';
                node.style.left='';
                node.style.width='';
                node.style.height='';
                Element.setOpacity(node, 1);
            });
        }
        
        animateNode(element);
        
        for (var node in thingsToAnimate) {
            options.callback = finalCallback.waitFor(node);
            options.startStyles = startStyles[node];
            animateProperties(document.getElementById(node), thingsToAnimate[node], options);
        }
    }
    
    // Return Object
    return {
        addClassName: function(element, className, options)
        {
            if (!className)
                return;
                
            var regex= new RegExp("(^|\\s)" + className + "(\\s|$)");

            var elementClassName = element.className;
            if (regex.test(elementClassName))
                return;

            if (elementClassName)
                elementClassName += ' ' + className;
            else
                elementClassName= className;
            animateClassName(element, elementClassName, options);
        },
        removeClassName: function(element, className, options)
        {
            var elementClassName= element.className;
            if (elementClassName===className)
            {
                animateClassName(element, '', options);
                return;
            }
            
            var regex= new RegExp("(^|\\s)" + className + "(\\s|$)");
            if (!regex.test(elementClassName))
                return;

            elementClassName= elementClassName.replace(regex, ' ');
            
            animateClassName(element, elementClassName, options);
        },
        setClassName: function(element, className, options)
        {
            var elementClassName= element.className;
            //if (elementClassName===className)
            //    return;
                
            animateClassName(element, className, options);
        },
        replaceClassName: function(element, oldClassName, newClassName, options) 
        {
            //if (oldClassName===newClassName)
            //    return;
            
            if (oldClassName) {
                var regex = new RegExp("(^|\\s)" + oldClassName + "(\\s|$)");
                newClassName= element.className.replace(regex, "$1"+newClassName+"$2");
            } else {
                newClassName = element.className + ' ' + newClassName;
            }
            animateClassName(element, newClassName, options);
        },
        setStyles: function(element, styles, options)
        {
            animateProperties(element, styles, options);
        },
        abort: function()
        {
            actors = {};
            if (!timer)
                return;

            window.clearTimeout(timer);
            timer = null;
        }
    };
}();

coherent.Animator.FADE_NODE     = "fade";
coherent.Animator.FADE_IN_NODE  = "fade_in";
coherent.Animator.FADE_OUT_NODE = "fade_out";
coherent.Animator.IGNORE_NODE   = "ignore";
coherent.Animator.MORPH_NODE    = "morph";

/* Special Animations */
coherent.Animator.innerHTML = function(element, html, duration/*optional*/)
{
    duration = duration || 0.5;
    
    function stepOne()
    {
        var oldHTML = element.innerHTML;
        var oldHeight = element.offsetHeight;
        element.innerHTML = html;
        
        var newHeight = element.offsetHeight;
        element.innerHTML = oldHTML;
        
        element.style.height = element.offsetHeight+"px";
        element.style.overflow = 'hidden';
        
        coherent.Animator.setStyles(element, {
            opacity: {value:0, callback:stepTwo}
        }, {
            duration: duration/2
        });
        coherent.Animator.setStyles(element, {
            height: {
                value: newHeight,
                curve: coherent.easing.inOutSine
            }
        }, {
            duration: duration
        });
    }

    function stepTwo()
    {
        element.innerHTML = html;
        coherent.Animator.setStyles(element, { opacity: 1 }, {
            duration: duration/2,
            callback: stepThree
        });
    }
    function stepThree()
    {
        element.style.overflow = '';
    }
    
    if (element.style.display != 'none')
        stepOne();
    else
        element.innerHTML = html;
};
        
coherent.Animator.innerText = function(element, text, duration/*optional*/)
{
    duration = duration || 1.0;

    function setText(text)
    {
        var textNode = document.createTextNode(text);
        element.innerHTML = '';
        element.appendChild(textNode);
    }
    function stepTwo()
    {
        setText(text);
        coherent.Animator.perform(element, {opacity: 1}, duration/2);
    }

    if (element.style.display != 'none')
        coherent.Animator.perform(element, {opacity: 0}, duration/2, stepTwo);
    else
        setText(text);
};



/** A declarative part of a View. This is used to declare a method on a
 *  View which will return an array of elements matching the part specifier.
 *  Part specifiers use a limited CSS query style: [tag name].[class name]
 *  
 *  @namespace
 **/
coherent.PartFinder= (function(){

    function makePartFinder(partIds, nodes)
    {
        var len= partIds.length;
        var cache= Array.from(nodes);
        
        function removeAll()
        {
            partIds= [];
            cache= null;
            len= 0;
        }
        function removePartAtIndex(index)
        {
            partIds.splice(index, 1);
            if (cache)
                cache.splice(index, 1);
            len= partIds.length;
        }
        function removePart(part)
        {
            var id= Element.assignId(part);
            var partIndex= partIds.indexOf(id);
            if (-1==partIndex)
                return;
            partIds.splice(partIndex, 1);
            if (cache)
                cache.splice(partIndex, 1);
            len= partIds.length;
        }
        function insertPartAtIndex(part, index)
        {
            var newId= Element.assignId(part);
            partIds.splice(index, 0, newId);
            if (cache)
                cache.splice(index, 0, part);
            len= partIds.length;
        }
        function add(part)
        {
            partIds.push(Element.assignId(part));
            len= partIds.length;
            if (cache)
                cache.push(part);
        }
        function clearCache()
        {
            cache= null;
        }
        
        function partFinder(partIndex)
        {
            if (cache)
            {
                if (1==arguments.length)
                    return cache[partIndex];
                return cache;
            }
            
            if (1==arguments.length)
                return document.getElementById(partIds[partIndex]);
                
            var result=[];
            for (var i=0; i<len; ++i)
                result[i]= document.getElementById(partIds[i]);
            
            //  setup the cache and the timeout to clear the cache    
            cache= result;
            window.setTimeout(clearCache, 250);
            
            return result;
        }
        
        if (nodes)
            window.setTimeout(clearCache, 250);
            
        partFinder.removePartAtIndex= removePartAtIndex;
        partFinder.removePart= removePart;
        partFinder.insertPartAtIndex= insertPartAtIndex;
        partFinder.add= add;
        partFinder.removeAll= removeAll;
        return partFinder;
    }
    
    function makeSinglePartFinder(partId, node)
    {
        var cache= node;
        
        function clearCache()
        {
            cache= null;
        }
        
        function singlePartFinder()
        {
            if (cache)
                return cache;
            
            cache= document.getElementById(partId);
            window.setTimeout(clearCache, 250);
            return cache;    
        }
        return singlePartFinder;
    }
    
    function findNodesMatchingSpec(view, partSpec)
    {
        var ids= [];
        var nodes= [];

        if (coherent.Support.QuerySelector)
        {
            nodes= view.querySelectorAll(partSpec);
            ids= Array.map(nodes, Element.assignId);
        }
        else
        {
            nodes= NW.Dom.select(partSpec, view);
            ids= Array.map(nodes, Element.assignId);
        }

        //  Now nodes contains all the elements that match the part spec and
        //  ids contains all the matching elements IDs.
        return {
            nodes: nodes,
            ids: ids
        };
    }
    
    /** @scope coherent.PartFinder **/
    return {
        //  A function that resolves into a query function the first time it's
        //  called.
        singlePart: function(partSpec, view)
        {
            function one()
            {
                var viewType= typeof(view);
                if ('function'===viewType)
                    view= view();
                else if ('string'===viewType)
                    view= document.getElementById(view);
                else if (!view)
                    view= this.viewElement();
                    
                var match= findNodesMatchingSpec(view, partSpec);
                var finder= makeSinglePartFinder(match.ids[0], match.nodes[0]);

                var propName= Class.findPropertyName(this, arguments.callee);
                if (propName)
                    this[propName]= finder;
                return match.nodes[0];
            }
            return one;
        },
        
        multipleParts: function(partSpec, view)
        {
            function many(index)
            {
                var viewType= typeof(view);
                if ('function'===viewType)
                    view= view();
                else if ('string'===viewType)
                    view= document.getElementById(view);
                else if (!view)
                    view= this.viewElement();

                var match= findNodesMatchingSpec(view, partSpec);
                var finder= makePartFinder(match.ids, match.nodes);
                
                var propName= Class.findPropertyName(this, arguments.callee);
                if (propName)
                    this[propName]= finder;

                if (arguments.length)
                    return match.nodes[index];
                else
                    return Array.from(match.nodes);
            }
            return many;
        }
    };
    
})();

/** @class
 *  Create a function which will retrieve a single DOM node within a view that
 *  matches a simplified CSS query. This is used as a declarative element in a
 *  new class definition:
 *  
 *      MyClass= Class.create(coherent.View, {
 *          openButton: Part('button.open'),
 *          closeButton: Part('button.close'),
 *          ...
 *      });
 *  
 *  The previous example defines a view with two parts: `openButton` and
 *  `closeButton`. These parts might be used in the `init` method as follows:
 *  
 *          init: function()
 *          {
 *              this.openButton().disabled= false;
 *              this.closeButton().disabled= true;
 *          }
 *  
 *  To retrieve a reference to the DOM node associated with the part, you must
 *  invoke the part as if it were a function (which it is).
 *  
 *  @param partSpec The simplified CSS reference which specifies the part.
 **/
var Part= coherent.PartFinder.singlePart;

/** @class
 *  Create a function which will retrieve an array of DOM nodes within a view
 *  matching a simplified CSS query. This is typically used as a declarative
 *  element in a class definition:
 *  
 *      MyClass= Class.create(coherent.View, {
 *          links: PartList('a.link'),
 *          ...
 *      });
 *  
 *  In the previous example, the view declares a PartList that matches any
 *  anchor with the class `link`. Your code may invoke the PartList with no
 *  arguments to retrieve all DOM nodes or with a single index to retrieve a
 *  single DOM node.
 *  
 *      init: function()
 *      {
 *          this.links().forEach(function(e) { e.style.display='none'; });
 *          this.links(0).style.display='block';
 *      }
 *  
 *  This example first retrieves the array of all link nodes and sets their
 *  display attribute to `none`. Then it retrieves the first link node and sets
 *  its display attribute to `block`. This is a contrived example of course.
 *  
 *      init: function()
 *      {
 *          var view= this.viewElement();
 *          this.links.add(view.appendChild(document.createElement('a')));
 *      }
 *  
 *  The example above creates a new anchor element and appends it to the view
 *  and also adds it to the links PartList.
 *  
 *  @param partSpec The simplified CSS reference specifying the matching parts
 */
var PartList= coherent.PartFinder.multipleParts;

/** Remove a node from the PartList. This does not remove the node from the DOM.
 *  @name PartList.prototype.removePartAtIndex
 *  @function
 *  @param index    the index of the node to remove from the PartList
 */

/** Remove all nodes from the PartList. This does not remove any nodes from the
 *  DOM.
 *  @name PartList.prototype.removeAll
 *  @function
 */

/** Insert a new node into the PartList at a specific index. This does not
 *  modify the DOM at all.
 *  @name PartList.prototype.insertPartAtIndex
 *  @function
 *  @param part a reference to the DOM node to insert into the PartList.
 *  @param index    the index at which to insert the new node
 */

/** Remove a specific node from the PartList. This does not remove the node from
 *  the DOM.
 *  @name PartList.prototype.removePart
 *  @function
 *  @param part a reference to the DOM node to remove from the PartList.
 */

/** Add a new node to the end of the PartList. This does not modify the DOM.
 *  @name PartList.prototype.add
 *  @function
 *  @param part a reference to the new DOM node to add to the PartList.
 */










/** Styles used by various views. These may be redefined if you have other
 *  preferences.
 *  
 *  @namespace
 */
coherent.Style= {
    kSelectedClass: "selected",
    kDisabledClass: "disabled",
    kMarkerClass: "nullValue",
    kFocusClass: "focussed",
    kHoverClass: "hover",
    kAscendingClass: "asc",
    kDescendingClass: "desc"
};





/** Setup bindings using CSS queries.
 *  
 *  @param container    the HTML node in which the 
 */
coherent.setupSelectors=function(container, bindings, relativeSource)
{
    var containerPrefix= (container ? '#' + Element.assignId(container) + ' ' : '');
    
    container= container||document.body;
    
    var selector;
    var nodes;
    var bindingMap;
    
    var findNodes;
    
    if (coherent.Support.QuerySelector)
        findNodes= function(selector)
        {
            return container.querySelectorAll(selector);
        }
    else
        findNodes= function(selector)
        {
            return NW.Dom.select(selector, container);
        }

    function setBindingMap(node)
    {
        for (var b in bindingMap)
            node.setAttribute(b, bindingMap[b]);
    }
    
    //  stash the binding map on each node
    for (selector in bindings)
    {
        nodes= findNodes(containerPrefix + selector);
        bindingMap= bindings[selector];
        Array.forEach(nodes, setBindingMap);
    }
    
    coherent.View.createViewsForNodeTree(container, relativeSource);
}



coherent.Responder= Class.create(coherent.Bindable, {

    /** Perform a command by bubbling up the responder chain.
        @param command      the name of the command to execute
        @param arguments    an array of arguments to pass to the command
        
        @returns the responder that ultimately handled the command or null if 
                 the command was never handled.
     */
    _performCommand: function(command, arguments)
    {
        var target= this;
        while (target)
        {
            if (command in target &&
                !target[command].apply(target, arguments))
            {
                return target;
            }
            
            target= target.nextResponder();
        }

        return null;
    },
    
    /** Does this object want to be the first responder?
     */
    acceptsFirstResponder: function()
    {
        return false;
    },
    
    /** Called when attempting to make the object a first responder.
     *  @returns true if the object accepts first responder status, false if
     *           the view doesn't want to be first responder.
     */
    becomeFirstResponder: function()
    {
        return true;
    },
    
    /** Called when the view should stop being the first responder.
     *  @return true if the the view accepts the loss and false if it is
     *          unable to give up first responder status.
     */
    resignFirstResponder: function()
    {
        return true;
    },

    nextResponder: function()
    {
        return this.__nextResponder||null;
    },
    
    setNextResponder: function(newNextResponder)
    {
        this.__nextResponder= newNextResponder;
    },
    
    onmousedown: function(event)
    {
        if (this.acceptsFirstResponder())
            coherent.page.makeFirstResponder(this);
        else
        {
            var target= this.nextResponder();
            if (target)
                target.onmousedown(event);
        }
    },
    
    onmouseup: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.onmouseup(event);
    },

    onclick: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.onclick(event);
    },

    ondblclick: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.ondblclick(event);
    },

    onkeydown: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.onkeydown(event);
    },
    
    onkeyup: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.onkeyup(event);
    },
    
    onkeypress: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.onkeypress(event);
    },
    
    ontouchstart: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.ontouchstart(event);
    },

    ontouchmove: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.ontouchmove(event);
    },

    ontouchend: function(event)
    {
        var target= this.nextResponder();
        if (target)
            target.ontouchend(event);
    }

});






/** A View is a Bindable object.
 *    
 *  Note: Views can define a container element (`this.container`) which is the
 *  _real_ container of its child nodes. For example, when using a View with
 *  a TABLE element, the container is usually set to the first TBODY. This
 *  allows you to specify something clever in the THEAD that doesn't get stomped
 *  on by the body content.
 *
 *  @declare coherent.View
 *  @extends coherent.Bindable
 **/
coherent.View= Class.create(coherent.Responder, {

    __viewClassName__: "View",
    __tagSpec__: ['input[type=button]', 'input[type=submit]',
                  'input[type=reset]', 'button'],
    
    /** The bindings exposed by the Base view type. Each view should have its
        own list of exposed bindings and may choose to hide bindings from its
        parent.
     **/
    exposedBindings: ['visible', 'class', 'enabled'],
    
    /** Don't automatically setup the bindings, because Views need to exist
        first and be fully initialised.
     */
    automaticallySetupBindings: false,
    
    /** Default bindings that all views inherit. This is empty, but can be
     *  defined by sub-classes to automatically bind to their relative source.
     */
    defaultBindings: {},
    
    /** The target of the action defined for this view. In Cocoa this appears on
        the NSControl class, but NSControl and NSView are somewhat blended here.
     **/
    target: null,
    
    /** The action this view should send. In Cocoa this appears on the NSControl
        class, but NSControl and NSView are somewhat blended here. This should
        be a function/method reference. This function will be invoked and passed
        a reference 
     **/
    action: null,
    
    /** Construct a new View. Most view subclasses actually inherit this
     *  constructor.
     *  
     *  @param view   either a string representing the ID of the view's node
     *                  or a reference to the DOM node itself
     *  @param [relativeSource] If the view uses relative key paths (*.foo),
     *                          this is the object those key paths will bind to.
     *  @param [bindingsMap]    An optional hash assigning key paths to the
     *                          view's exposed bindings.
     */
    constructor: function(view, relativeSource, bindingMap)
    {
        this.base();
        
        if ('string'===typeof(view))
        {
            this.id= view;
            this.__view= document.getElementById(view);
        }
        else
        {
            this.id= Element.assignId(view);
            this.__view= view;
        }
        
        if (relativeSource && !('addObserverForKeyPath' in relativeSource))
            coherent.KVO.adaptTree(relativeSource);
            
        this.__relativeSource= relativeSource;
        if (bindingMap)
            this.__bindingMap= bindingMap;
        
        if (this.id in coherent.View.viewLookup)
        {
            throw new Error('Two views share the same ID: ' + this.id);
        }
        
        coherent.View.viewLookup[this.id]= this;
    },

    __postConstruct: function()
    {
        var self= this;
        
        function clearViewCache()
        {
            delete self.__view;
            delete self.__container;
        }
        window.setTimeout(clearViewCache, 250);
        
        var view= this.viewElement();
        if (view)
            this._initView();
        else
            Event.onDomReady(this._initView.bind(this));
    },

    _initView: function()
    {
        this.__initialising= true;
        this.init();
        this.setupBindings();
        delete this.__initialising;
    },
    
    init: function()
    {
    },
    
    /** Return the view element
     */
    viewElement: function()
    {
        return this.__view || document.getElementById(this.id);
    },

    /** Return the container element, which may be different from the view
     *  itself in lists or tables.
     */
    container: function()
    {
        return this.__container || this.__view ||
               document.getElementById(this.__containerId||this.id);
    },
    
    /** Set the container for the view.
     *  @param newContainer a reference to the new container node for the view
     */
    setContainer: function(newContainer)
    {
        if (this.__view)
            this.__container= newContainer;
        this.__containerId= Element.assignId(newContainer);
        return newContainer;
    },

    /** Find the parent view in the DOM heirarchy...
     */
    superview: function()
    {
        var node= this.viewElement();

        do
        {
            node= node.parentNode;
            if (document==node)
                return null;
        }
        while (node && !node.__viewclass__);

        return coherent.View.fromNode(node);
    },

    /** The default value for nextResponder for a View is the super view.
     */
    nextResponder: function()
    {
        return this.__nextResponder||this.superview();
    },
    
    /** Set the focus to the view.
     */
    focus: function()
    {
        var view= this.viewElement();
        view.focus();
    },
    
    /** Remove the focus from the view.
     */
    blur: function()
    {
        var view= this.viewElement();
        view.blur();
    },
    
    /** Send the action message to the target.
     */
    sendAction: function()
    {
        var me= this;
        
        function sender()
        {
            me.action.call(me.target||me.action, me);
        }
        
        if (!me.action)
            return;
        
        //  send the message as soon as possible, just not right now.
        sender.delay(0);
    },
    
    /** Callback method for updating the View in response to changes in the value
     *  observed by the visible binding.
     *
     *  @param change   a ChangeNotification with information about the change
     *  @param keyPath  the path to the value that has changed
     *  @param context  a client-specified value
     **/
    observeVisibleChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        if (change.newValue)
            view.style.display= "";
        else
            view.style.display= "none";
    },
    
    /** Update the views's enabled/disabled state based on changes to the data
     *  model. When initialising (`this.__initialising===true`) and
     *  `change.newValue` is either `null` or `undefined`, the view will set
     *  the data model value to the inverse value of the view's disabled
     *  property.
     *  
     *  When disabled, the view adds the `coherent.Style.kDisabledClass` to
     *  the nodes's class name. When enabled, this class is removed. Of course,
     *  the view also updates the nodes's disabled property.
     *  
     *  @param change   the change notification
     */
    observeEnabledChange: function(change)
    {
        var view= this.viewElement();
        
        if (this.__initialising && (null===change.newValue ||
            'undefined'===change.newValue))
        {
            this.bindings.enabled.setValue(!view.disabled);
            return;
        }
        
        view.disabled= !change.newValue;
        if (view.disabled)
            Element.addClassName(view, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(view, coherent.Style.kDisabledClass);
    },
    
    /** Callback method for updating the View's class based on changes to the
     *  value observed by the class binding. This method makes a special effort to
     *  preserve any of the special classes which the View library adds to some
     *  elements (disabled, null value, selected, focussed, and hover).
     *
     *  @param change   a ChangeNotification with information about the change
     *  @param keyPath  the path to the value that has changed
     *  @param context  a client-specified value
     **/
    observeClassChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        var oldClasses= $S(view.className.split(" "));
        var newClasses= $S((change.newValue||"").split(" "));
    
        //  reset any state classes
        if (coherent.Style.kDisabledClass in oldClasses)
            Set.add(newClasses, coherent.Style.kDisabledClass);
        if (coherent.Style.kMarkerClass in oldClasses)
            Set.add(newClasses, coherent.Style.kMarkerClass);
        if (coherent.Style.kSelectedClass in oldClasses)
            Set.add(newClasses, coherent.Style.kSelectedClass);
        if (coherent.Style.kFocusClass in oldClasses)
            Set.add(newClasses, coherent.Style.kFocusClass);
        if (coherent.Style.kHoverClass in oldClasses)
            Set.add(newClasses, coherent.Style.kHoverClass);
    
        view.className= Set.toArray(newClasses).join(" ");
    },
    
    /** Use this method rather than calling the DOM removeChild method directly,
     *  because this will automatically teardown the outgoing node and give the
     *  view a chance to remove any event handlers.
     *  
     *  @parameter node     the node to remove from this view.
     *  @returns the node that was removed or null if the node is null.
     */
    removeChild: function(node)
    {
        if (!node)
            return null;
        coherent.View.teardownViewsForNodeTree(node);
        if (this.beforeRemoveElement)
            this.beforeRemoveElement(node);
        return node.parentNode.removeChild(node);
    },
    
    /** Return either an attribute defined on the view's node or a property
     *  defined on the view's object. This allows developers to override
     *  in HTML the default values which might be assigned in the class
     *  definition.
     *  
     *  @function
     *  @param name the name of the attribute or property to return
     *  @returns the value of the attribute or property
     **/
    attributeOrProperty: (function(){
        if (coherent.Browser.IE)
            return function(name)
            {
                var view= this.viewElement();
                var value= view[name];
                if (value || ""===value)
                    return value;
                return this[name];
            };
        else
            return function(name)
            {
                var view= this.viewElement();
                var value= view.getAttribute(name);
                if (value || ""===value)
                    return value;

                value= view[name];
                if (value || ""===value)
                    return value;

                return this[name];
            };
    })(),

    /** Configure the bindings for a View. The key path for each binding is
     *  expressed as an attribute on the element with "KeyPath" appended.
     *
     *  @param relativeSource   the model object that should be used for relative
     *                          key paths (e.g. key paths of the form *.xxx.yyy)
     **/
    setupBindings: function()
    {
        var b;
        var binding;
        var keyPath;
        var i;
        var len;
        var view= this.viewElement();
        var bindingMap= this.__bindingMap||this.defaultBindings;
        
        //  Now setup each one of the exposed bindings
        for (i=0, len=this.exposedBindings.length; i<len; ++i)
        {
            b= this.exposedBindings[i];
            keyPath= view.getAttribute(b + "KeyPath")||bindingMap[b];
            if (!keyPath)
                continue;
            this.bindNameToKeyPath(b, keyPath, this.__relativeSource, true);
        }
    
        //  Now update all the bindings
        for (b in this.bindings)
            this.bindings[b].update();
    },
    
    /** Remove all observers for the bound attributes. Called when this View is
     *  destroyed, however, because Javascript hasn't got a destructor or finalise
     *  method, this must be called manually -- in the case of Web pages, on the
     *  unload event.
     **/
    teardown: function()
    {
        for (var b in this.bindings)
            this.bindings[b].unbind();
        delete coherent.View.viewLookup[this.id];
    }

});

/** Lookup table matching node IDs to view instances **/
coherent.View.viewLookup= {};

/** Mapping from DOM ID to View instance. **/
coherent.View.registry= {};

/** Lookup table for translating between element specifications (ala CSS
 *  selectors minus the class & ID stuff) and View types. Of course, an
 *  element may have a view attribute which bypasses this table entirely.
 *  
 *  @private
 **/
coherent.View.tagToViewLookup= {};

/** Regular expression used for matching element specs similar to CSS. **/
coherent.View.tagSpecRegex= /^(\w+)\s*(?:\[(\w*)\s*=\s*(\w*)\s*\])?$/;

coherent.View.__updateTagSpecTable= function(viewClass)
{
    var proto= viewClass.prototype;
    
    function setViewTagSpec(spec)
    {
        var match= spec.match(coherent.View.tagSpecRegex);
        if (!match)
            throw new Error('Invalid view spec: ' + spec);
        
        //  Find info for tag
        var tagName= match[1].toUpperCase();
        var attributeName= match[2];
        var attributeValue= match[3];
        
        var tagInfo = coherent.View.tagToViewLookup[tagName]||{};
        
        if (!(tagName in coherent.View.tagToViewLookup))
            coherent.View.tagToViewLookup[tagName]= tagInfo;
        
        //  Simply specified a tag name...
        if (!attributeName)
        {
            //  Check whether a view is already registered for that type
            if (tagInfo.viewClass)
            {
                console.log((proto.__viewClassName__+': '||'') +
                            'Redefining view spec: ' + spec +
                            ': previously registered to ' +
                            (tagInfo.viewClass.prototype.__viewClassName__||'unknown'));
                throw new Error('Redefining view spec: ' + spec);
            }
            tagInfo.viewClass= viewClass;
            return;
        }

        //  Otherwise index the view by the attribute & value
        if (!tagInfo.attr)
            tagInfo.attr= {};
            
        if (!(attributeName in tagInfo.attr))
            tagInfo.attr[attributeName]= {};

        if (attributeValue in tagInfo.attr[attributeName])
        {
            console.log((proto.__viewClassName__+': '||'') +
                        'Redefining view spec: ' + spec +
                        ': previously registered to ' +
                        (tagInfo.viewClass.prototype.__viewClassName__||'unknown'));
            throw new Error('Redefining view spec: ' + spec);
        }
        
        tagInfo.attr[attributeName][attributeValue]= viewClass;
    }
    
    if (proto.hasOwnProperty('__tagSpec__'))
    {
        var viewTagSpec= proto.__tagSpec__;
        if ('string'==typeof(viewTagSpec))
            setViewTagSpec(viewTagSpec);
        else if ('forEach' in viewTagSpec)
            viewTagSpec.forEach(setViewTagSpec);
        else
            console.log('Invalid type for __tagSpec__');
    }

    if (proto.hasOwnProperty('__viewClassName__'))
        coherent.View.registry[proto.__viewClassName__]= viewClass;
}

/** Handle special processing for subclasses of the View class. This method
 *  registers the view by name (via __viewClassName__ key) and sets up matching
 *  tag specifications (via __tagSpec__ key). Also combines any default
 *  bindings specified for the subclass with default bindings from the super
 *  class.
 */
coherent.View.__subclassCreated__= function(subclass)
{
    if (!coherent.View.registry)
        coherent.View.registry={};
        
    var proto= subclass.prototype;
    
    //  Process the new view's __tagSpec__ property.
    coherent.View.__updateTagSpecTable(subclass);

    //  Handle defaultBindings for the View:
    //  Need to blend a view's default bindings with its superclass'. Don't
    //  overwrite any that may have changed.
    var baseproto= subclass.superclass.prototype;
    if (baseproto.defaultBindings!==proto.defaultBindings)
        proto.defaultBindings= Object.applyDefaults(proto.defaultBindings,
                                                    baseproto.defaultBindings);
}

/** Determine the correct view class for a particular node.
 **/
coherent.View.viewClassForNode= function(node)
{
    function cssClassIntersection(className)
    {
        var result= [];
        var classes= className.split(' ');
        var classIndex;
        var registry= coherent.View.registry;
        
        for (classIndex=0; classIndex<classes.length; ++classIndex)
            if (classes[classIndex] in registry)
                result[result.length]= registry[classes[classIndex]];
                
        return result;
    }
    
    var viewAttr= node.getAttribute("view");
    var viewClass;
    
    if (viewAttr)
    {
        viewClass= coherent.View.registry[viewAttr];
        if (!viewClass)
            throw new InvalidArgumentError( "Invalid view type: " + viewAttr );
        return viewClass;
    }
    
    var viewCssClasses= cssClassIntersection(node.className);
    if (1==viewCssClasses.length)
        return viewCssClasses[0];
        
    if (viewCssClasses.length>1)
        throw new InvalidArgumentError("CSS class matches multiple view types: " + node.className);

    //  find view mapping
    var tagInfo= coherent.View.tagToViewLookup[node.tagName];
    if (!tagInfo)
        return null;
    
    var fallback;
    var value;
    var attrs= tagInfo.attr||{};
    var attributeValues;
    
    for (var attribute in attrs)
    {
        attributeValues= attrs[attribute];
        
        value= node.getAttribute(attribute);

        if (value in attributeValues)
        {
            viewClass= attributeValues[value];
            break;
        }
        
        value= node[attribute];
        if (value in attributeValues)
            fallback= attributeValues[value];
    }

    viewClass= viewClass || fallback || tagInfo.viewClass;
    
    if (!viewClass)
        return null;

    /** Determine whether the element has any bindings
     */
    function nodeHasBindings(node)
    {
        var bindings= viewClass.prototype.exposedBindings||[];
        var len= bindings.length;
        var bindingName;
        var i;
    
        for (i=0; i<len; ++i)
        {
            bindingName= bindings[i]+"KeyPath";
            if (node.getAttribute(bindingName))
                return true;
        }
    
        return false;
    }

    if (!nodeHasBindings(node))
        return null;

    return viewClass;
}

coherent.View.createViewForNode= function(node, relativeObject, bindingsMap)
{
    if (node.__viewclass__)
        return coherent.View.fromNode(node);
        
    var viewClass= coherent.View.viewClassForNode(node);
    if (!viewClass)
        return null;
    var view= new (viewClass)(node, relativeObject, bindingsMap);
    node.__viewclass__= viewClass;
    return view;
}

/** Lookup the View instance for a particular node.
 *  @param element  the node which may be associated with a view
 *  @returns {coherent.View} the view associated with the node or null if
 *           the node isn't associated with any views.
 */
coherent.View.fromNode= function(element)
{
    var lookup= coherent.View.viewLookup;
    if (!lookup || !lookup[element.id])
        return null;
    
    return lookup[element.id];
}



/** Setup all the views within a container. All views are bound to the
 *  current context, however, the relativeSource is available for relative
 *  key paths (e.g. *.xxx.yyy.zzz).
 *  
 *  @param [node]           the DOM node in which the elements to be bound are
 *                          located, defaults to the document object.
 *  @param [relativeSource] a model object used for relative key path bindings
 **/
coherent.View.createViewsForNodeTree= function(node, relativeSource, context)
{
    function setup(node)
    {
        if (node.__viewclass__)
            return;
        coherent.View.createViewForNode(node, relativeSource);
    }
    
    try
    {
        var oldDataModel= coherent.dataModel;
        if (context)
            coherent.dataModel= context;
        Element.depthFirstTraversal(node||document.body, setup);
    }
    finally
    {
        if (context)
            coherent.dataModel= oldDataModel;
    }    
}

coherent.View.teardownViewsForNodeTree= function(node)
{
    function teardownNode(node)
    {
        if (!node.__viewclass__)
            return;
        var view= coherent.View.fromNode(node);
        if (view)
            view.teardown();
    }

    Element.depthFirstTraversal(node||document.body, teardownNode);
}

//  Process the base View __tagSpec__...
coherent.View.__updateTagSpecTable(coherent.View);



coherent.NavigationBar= Class.create(coherent.View, {

    __viewClassName__: 'NavigationBar',

    backButton: Part('button.back'),
    editButton: Part('button.edit'),
    title: Part('h1'),
    
    __controller: null,
    navigationItems: null,
    
    init: function()
    {
        this.backButton().style.display='none';
        this.navigationItems= [];
    },
    
    pushNavigationItem: function(newNavigationItem)
    {
        var len= this.navigationItems.length;
        var old= this.navigationItems[len-1];
        this.navigationItems.push(newNavigationItem);
        
        var backButton= this.backButton();
        if (len)
        {
            backButton.style.display='';
            backButton.textContent= old;
        }
        else
            backButton.style.display='none';
            
        this.title().textContent= newNavigationItem;
    },
    
    popNavigationItem: function()
    {
        var popped= this.navigationItems.pop();
        
        var len= this.navigationItems.length;
        var title= this.navigationItems[len-1];
        var back= this.navigationItems[len-2];
        
        var backButton= this.backButton();
        if (len>1)
        {
            backButton.style.display='';
            backButton.textContent= back;
        }
        else
            backButton.style.display='none';

        this.title().textContent= title;
    },
    
    onclick: function(event)
    {
        var view= this.viewElement();
        var e= event.target||event.srcElement;
        
        while (e!=view && 'BUTTON'!==e.tagName)
            e= e.parentNode;
        
        if (e==view)
            return;
        
        if (e==this.backButton() && this.__controller)
            this.__controller.popViewController(true);
            
        Event.stop(event);
    }
    
});



coherent.ViewController= Class.create(coherent.Responder, {

    /** What view is associated with this controller? */
    view: null,
    
    /** When displaying the name of this view, what value should be used? */
    title: "",
    
    /** Don't automatically setup the bindings, because Views need to exist
        first and be fully initialised.
     */
    automaticallySetupBindings: false,
    
    /** Construct a ViewController.
        @param name     the name with which to register the view controller
        @param view     either the ID of a node, a node, or a reference to a
                        view object. This is the view this controller will
                        manage.
        @param [bindingsMap]    a dictionary with initial bindings for the
                        controller.
     */
    constructor: function(name, view, bindingsMap)
    {
        this.name= name;
        if (name)
            coherent.registerModelWithName(this, name);
        
        if ('string'===typeof(view))
            this.__viewId= view;
        else if (view && 1===view.nodeType)
            this.__viewId= Element.assignId(view);
        else
            this.__viewId= view.id;
    },
    
    /** Helper function that makes Parts & PartLists work correctly with
        ViewControllers. This proxies over to the view to return the node
        associated with the controlled view.
     */
    viewElement: function()
    {
        return this.view.viewElement();
    },
    
    __postConstruct: function()
    {
        var viewNode= document.getElementById(this.__viewId);
        
        if (viewNode)
            this._init();
        else
            Event.onDomReady(this._init.bind(this));
    },

    _init: function()
    {
        this.__initialising= true;
        
        var viewNode= document.getElementById(this.__viewId);
        
        var view= coherent.View.fromNode(viewNode);
        
        if (!view)
        {
            //  create the view tree for this view
            var context= new coherent.KVO();
            context.owner= this;
            coherent.View.createViewsForNodeTree(viewNode, null, context);
            view= coherent.View.createViewForNode(viewNode);
        }
        this.view= view;
        
        this.init();
        this.setupBindings();
        delete this.__initialising;
    },
    
    init: function()
    {
    }
    
});




coherent.NavigationController= Class.create(coherent.ViewController, {

    constructor: function(name, bindingsMap)
    {
        this.base(name, bindingsMap);
        
        this.viewControllers= [];
        this.visibleIndex= -1;
    },
    
    viewControllers: null,
    
    container: Part('.nav-container'),
    
    navigationBar: function()
    {
        return this.__navigationBar;
    },
    
    setNavigationBar: function(newNavigationBar)
    {
        if (this.__navigationBar)
            this.__navigationBar.__controller=null;
        this.__navigationBar= newNavigationBar;
        if (this.__navigationBar)
            this.__navigationBar.__controller=this;
    },
    
    topViewController: function()
    {
        var controllers= this.viewControllers;
        return controllers[controllers.length-1];
    },
    
    visibleViewController: function()
    {
        if (-1==this.visibleIndex)
            return null;
        return this.viewControllers[this.visibleIndex];
    },
    
    pushViewController: function(newViewController, animated)
    {
        if (!newViewController)
            return;
        
        newViewController.parentController= this;
        
        var controllers= this.viewControllers;
        var top= controllers[controllers.length-1];
        
        this.visibleIndex= controllers.length;
        controllers[controllers.length]= newViewController;

        window.scrollTo(0,0);
        
        var options= {
            duration: 500
        };
        var newView= newViewController.view;
        
        var viewElement= newView.viewElement();
        var container= this.container();
        
        container.style.position='relative';
        viewElement.style.opacity= 0;
        viewElement.style.position='absolute';
        viewElement.style.display="block";
        viewElement.style.top=0;
        viewElement.style.left=0;
        viewElement.style.width="100%";
        
        container.appendChild(viewElement);
        
        coherent.page.makeFirstResponder(null);
        
        if (top)
            coherent.Animator.setStyles(top.viewElement(), {
                                            opacity: 0,
                                            display: 'none'
                                        },
                                        options);
        coherent.Animator.setStyles(newView.viewElement(), {
                                        opacity: 1
                                    },
                                    options);
        if (this.__navigationBar)
            this.__navigationBar.pushNavigationItem(newViewController.title);
    },
    
    popViewController: function(animated)
    {
        var controllers= this.viewControllers;
        var top= controllers.pop();
        this.visibleIndex--;
        
        var newTop= controllers[controllers.length-1];

        window.scrollTo(0,0);

        var options= {
            duration: 500
        };

        coherent.page.makeFirstResponder(null);

        coherent.Animator.setStyles(top.viewElement(), {
                                        opacity: 0,
                                        display: 'none'
                                    },
                                    options);
        if (newTop)
        {
            newTop.viewElement().style.display='block';
            coherent.Animator.setStyles(newTop.viewElement(), {
                                            opacity: 1
                                        },
                                        options);
        }
        if (this.__navigationBar)
            this.__navigationBar.popNavigationItem();
            
        return top;
    },
    
    popToRootViewController: function(animated)
    {
    },
    
    popToViewController: function(animated)
    {
    }
    
});





/** A coherent.TextView is an element that displays text (surprised?) either as plain
 *  text or HTML. In addition to the bindings exposed by Views, these
 *  Views have bindings for html and text.
 *  
 *  Note: It _probably_ doesn't make sense to bind both html & text. That would
 *  be silly.
 *  
 *  @declare coherent.TextView
 *  @extends coherent.View
 *  
 */
coherent.TextView= Class.create(coherent.View, {

    __viewClassName__: "Text",
    __tagSpec__: ['div', 'b', 'strong', 'em', 'i', 'q', 'p', 'span',
                  'li', 'h1', 'h2', 'h3', 'h4', 'td', 'label'],

    exposedBindings: ['html', 'text'],
    
    /** The default placeholder image used when the value of View is the multiple
        values marker (coherent.Markers.MultipleValues). You can override this
        value either on derived Views or by setting an attribute on the image tag.
     **/
    multipleValuesPlaceholder: _("marker.text.multipleValues"),
    
    /** The default placeholder image used when the value of the View is a null
        value (null or the empty string).
     **/
    nullPlaceholder: _('marker.text.placeholder'),
    
    /** The default placeholder image used when the value of the View is the no
        selection marker (coherent.Markers.NoSelection).
     **/
    noSelectionPlaceholder: _('marker.text.noSelection'),
    
    /** Translate a value received in a change notification. As a side effect, this
        method will add or remove the marker CSS class to/from the element.

        @param newValue the new value to be displayed.
        @returns the correct placeholder value if the value isn't valid, or the
                 original value.
     **/
    translateValue: function(newValue)
    {
        var view= this.viewElement();
        var setMarker= true;
    
        switch (newValue)
        {
            case "":
            case null:
            case undefined:
                newValue= this.attributeOrProperty("nullPlaceholder");
                break;
            case coherent.Markers.NoSelection:
                newValue= this.attributeOrProperty("noSelectionPlaceholder");
                break;
            case coherent.Markers.MultipleValues:
                newValue= this.attributeOrProperty("multipleValuesPlaceholder");
                break;
            default:
                setMarker= false;
                break;
        }
        if (setMarker)
            Element.addClassName(view, coherent.Style.kMarkerClass);
        else
            Element.removeClassName(view, coherent.Style.kMarkerClass);
        
        return newValue;
    },
    
    /** Track changes to the text binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeTextChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        var value= this.translateValue(change.newValue);

        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            var viewValue= (view.textContent||view.innerText||"").trim();
            
            if (value!==viewValue)
                this.bindings.text.setValue(viewValue);
            return;
        }
        
        var textNode = document.createTextNode(value);
        view.innerHTML = "";
        view.appendChild(textNode);
    },
    
    /** Track changes to the html binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeHtmlChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        var value= this.translateValue(change.newValue);

        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            var viewValue= (view.innerHTML||"").trim();
            if (value!==viewValue)
                this.bindings.html.setValue(viewValue);
            return;
        }

        //  if the value was altered (set to a placeholder), it must be escaped,
        //  because the placeholders are expected to be plain text, not HTML.
        if (value!==change.newValue)
        {
            var textNode = document.createTextNode(value);
            view.innerHTML = "";
            view.appendChild(textNode);
            return;
        }

        view.innerHTML = value;
    }
    
});



/** A view to provide access to standard anchor elements.
 *  
 *  In addition to the bindings offered by {@link coherent.TextView},
 *  AnchorViews offer an href and title binding.
 *  
 *  AnchorViews will automatically bind to A tags in HTML as part of a call
 *  to {@link coherent.View.createViewsForNodeTree}.
 *  
 *  @declare coherent.AnchorView
 *  @extends coherent.LabelView
 *  
 *  @param view either the ID of the node or the node itself
 *  @param [relativeSource=null]    an object for relative keypath bindings
 *  @param [bindingMap=null]    a hash containing as keys   
 */
coherent.AnchorView= Class.create(coherent.TextView, {

    __viewClassName__: 'Anchor',
    __tagSpec__: 'a',
    
    exposedBindings: ['href', 'title'],
    
    /** Change the HREF of the view based on the change notification. When
     *  initialising (`this.__initialising===true`), the href from the view
     *  will be read out if `change.newValue` is `null` or `undefined`.
     *  
     *  @param change   the change notification
     */
    observeHrefChange: function(change)
    {
        var view= this.viewElement();
        
        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            this.bindings.href.setValue(view.href||'');
            return;
        }
        view.href= change.newValue;
    },
    
    /** Update the title of the anchor based on changes to the data model. When
     *  initialising (`this.__initialising===true`), the view will use the
     *  DOM value if `change.newValue` is `null` or `undefined`.
     *  
     *  @param change   the change notification
     */
    observeTitleChange: function(change)
    {
        var view= this.viewElement();

        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            this.bindings.title.setValue(view.title||'');
            return;
        }
        view.title= change.newValue;
    }

});

/** The Event Loop for the page...
 *  
 *  
 */

coherent.EventLoop = {

    start: null,
    currentEvent: null,
    
    begin: function(event)
    {
        this.start= new Date().getTime();
        this.currentEvent= event;
    },
    
    end: function()
    {
        // this.start= null;
        this.currentEvent= null;
    }
    
};



/** A View that manages a set of tabs and their associated panels. Each tab is
 *  expected to be a label element where the for attribute specifies the ID of
 *  the panel to display. To enable styling, the tabs may be enclosed in an
 *  element marked with the tabContainer class (coherent.Style.kTabContainerClass).
 *  
 *  @declare coherent.TabView
 *  @extends coherent.View
 *  
 */
coherent.TabView= Class.create(coherent.View, {

    __viewClassName__: 'Tab',
    
    tabs: PartList('label.tab'),
    
    exposedBindings: [],
    
    useTransitions: false,
    
    init: function()
    {
        this.base();
        
        var tabs= this.tabs();
        var selectedClass= coherent.Style.kSelectedClass;
        var selectedTab= null;
        
        function visitTab(t, index)
        {
            var contentNode= this.contentElementForTab(t);
            
            if (!selectedTab && Element.hasClassName(t, selectedClass))
                selectedTab= t;
            else if (contentNode)
                contentNode.style.display='none';
        }

        tabs.forEach(visitTab, this);
        
        selectedTab= selectedTab || tabs[0];
        if (selectedTab)
        {
            this.displayContentForTab(selectedTab);
            Element.addClassName(selectedTab, selectedClass);
        }
    },
    
    currentTab: function()
    {
        return document.getElementById(this.__currentTabId);
    },
    
    /** Retrieve the content element for the given tab. Assuming that tabs are label
        elements, this looks up the content element by the for attribute. Good,
        semantic markup.
    
        @param tab  the tab
        @returns the associated content element for this tab or undefined if none.
     **/
    contentElementForTab: function(tab)
    {
        if (!tab)
            return null;
        return document.getElementById(tab.htmlFor);
    },

    /** Display the content for a particular ID.

        @param id   the id of the content element to display.
     **/
    displayContentForTab: function(tab)
    {
        var oldContent= this.contentElementForTab(this.currentTab());
        var newContent= this.contentElementForTab(tab);
    
        this.__currentTabId= tab.id;
    
        if (!this.useTransitions)
        {
            oldContent.style.display='none';
            newContent.style.display='';
            return;
        }

        throw new Error('Transitions not implemented');
    },

    /** Handle a mouse click on an individual tab. This activates the selected tab.

        @param event    the mouse click event
     **/
    onclick: function(event)
    {
        var tab= event.target||event.srcElement;
        var body= document.body;
        
        while (tab!=body && 'LABEL'!==tab.tagName)
            tab= tab.parentNode;
        
        if ('LABEL'!==tab.tagName)
            return;
            
        //  TODO: This will fail if the click occurs on a child node of the label
        if (tab.id == this.__currentTabId)
            return;

        Element.removeClassName(this.currentTab(), coherent.Style.kSelectedClass);
        Element.addClassName(tab, coherent.Style.kSelectedClass);
        this.displayContentForTab(tab);
    }

});




/** A View that manages a set of tabs associated with URLs that should be
 *  displayed in an iframe. Each tab is expected to be a label element where the
 *  for attribute specifies the key in the srcTable of the URL to display. The
 *  tab panel uses an iframe. If there isn't an iframe already in the tab panel,
 *  one will be created automatically.
 *  
 *  To enable styling, the tabs may be enclosed in an element marked with the
 *  tabContainer class (coherent.Style.kTabContainerClass).
 *  
 *  @declare coherent.ExternalTabView
 *  @extends coherent.TabView
 *  
 *  @TODO: This should probably use a frame view to represent the internal
 *         content element.
 **/
coherent.ExternalTabView= Class.create(coherent.TabView, {

    __viewClassName__: 'ExternalTab',
    
    exposedBindings: ['srcTable'],
    
    wait: Part('.wait'),

    waitTimeout: 125,
    
    frame: function()
    {
        return document.getElementById(this.frameId);
    },
    
    /** Load a url into the content frame. This sets up the wait timer and more.

        @param url  the url to load into the frame.
     **/
    loadUrl: function(url)
    {
        if (this.loading===url)
            return;
    
        var view= this.viewElement();
        this.loading= url;
        var frame= this.frame() || this.createFrame(url);
        
        if (coherent.Browser.IE)
            frame.onreadystatechange= this.readyStateChanged.bindAsEventListener(this);
        else
            frame.onload= this.frameLoaded.bindAsEventListener(this);
        
        this.loading= url;
        frame.src= url;
        this.waitTimeout= window.setTimeout(this.showWait.bind(this),
                                            this.waitTimeout);
    },

    /** Show the wait message if the load is taking a long time.
     **/
    showWait: function()
    {
        var wait= this.wait();
        if (wait)
            wait.style.display="";
        window.clearTimeout(this.waitTimeout);
        this.waitTimeout= false;
    },

    /** Create a frame for the content.

        @param url  the url to display in the frame
     **/
    createFrame: function(url)
    {
        var view= this.viewElement();
        var frame;
        
        if (coherent.Browser.Safari2)
        {
            /*  I need a container for the frame, because on Safari 2.0.4 setting
                the innerHTML of this element will wipe out any event handlers
                assigned to child elements.
             */
            var frameContainer= document.createElement("div");
            view.appendChild(frameContainer);

            /*  Safari won't fire onload events for an iframe created via
                createElement. However, it will work if I append an iframe to the
                innerHTML. But the src attribute must have a valid value or the
                onload handler still won't be called. This is fixed in the nightly
                Safari build (7/20/2006).
             */
            frameContainer.innerHTML+= '<iframe src="' + url + '"></iframe>';
            frame= view.getElementsByTagName( "iframe" )[0];
            frame.style.width="0";
            frame.style.height="0";
        }
        else
        {
            frame= document.createElement( "iframe" );
            frame.src= url;
            view.appendChild(frame);
        }
        
        this.frameId= Element.assignId(frame);
        return frame;
    },

    /** Observe a change to the srcTable binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeSrcTableChange: function(change, keyPath, context)
    {
        var currentTab= this.currentTab();
        if (!currentTab)
            return;
        this.displayContentForTab(currentTab);
    },

    /** Retrieve the content element for the given tab. This overridden version of
        the TabView method always returns the frame.
    
        @param tab  the tab
        @returns the associated content element for this tab or undefined if none.
     **/
    contentElementForTab: function(tab)
    {
        return null;
    },

    /** Display the content for a particular ID.

        @param id   the id of the content element to display.
     **/
    displayContentForTab: function(tab)
    {
        this.__currentTabId= tab.id;
        if (!this.bindings.srcTable)
            return;
            
        var srcTable= this.bindings.srcTable.value();
        if (!srcTable)
            return;
        var url= srcTable.valueForKey(tab.htmlFor);
        this.loadUrl(url);
    },

    /** Internet Explorer uses readystatechange to signal that the frame has
        finished loading.

        @param event    the readyState change event
     **/
    readyStateChanged: function(event)
    {
        if ("complete"===this.frame().readyState)
            this.frameLoaded(event);
    },

    /** Display the frame after it's fully loaded.

        @param event    the load event
     **/
    frameLoaded: function(event)
    {
        if (!this.loading)
            return;
        if (this.waitTimeout)
            window.clearTimeout(this.waitTimeout);
        this.waitTimeout= false;
        this.loading= false;
        var wait= this.wait();
        if (wait)
            wait.style.display='none';
    }

});




/** A View for images. In addition to the bindings exposed by Views,
 *  coherent.ImageViews have a src binding that represents the URL of the
 *  image to display. ImageViews also have a width and height binding to
 *  reflect those properties as well.
 *  
 *  Like InputViews, coherent.ImageViews have placeholder values for invalid
 *  values. These placeholders should be URLs to the appropriate image to
 *  display under those circumstances. The default values are empty, so no image
 *  will be displayed.
 *  
 *  During calls to {@link coherent.View.createViewsForNodeTree}, ImageViews will be created for
 *  any node that matches either `img` or `input[type=image]` nodes.
 *  
 *  @declare coherent.ImageView
 *  @extends coherent.View
 **/
coherent.ImageView= Class.create(coherent.View, {

    __viewClassName__:"Image",
    __tagSpec__: ['img', 'input[type=image]'],
    
    exposedBindings: ['src', 'width', 'height'],
    
    /** The default placeholder image used when the value of View is the multiple
     *  values marker (coherent.Markers.MultipleValues). You can override this
     *  value either on derived Views or by setting an attribute on the image tag.
     **/
    multipleValuesPlaceholder: _('marker.image.multipleValues'),
    
    /** The default placeholder image used when the value of the View is a null
     *  value (null or the empty string).
     **/
    nullPlaceholder: _('marker.image.placeholder'),
    
    /** The default placeholder image used when the value of the View is the no
     *  selection marker (coherent.Markers.NoSelection).
     **/
    noSelectionPlaceholder: _('marker.image.noSelection'),
    
    observeSrcChange: function(change)
    {
        var view= this.viewElement();
        var newValue= change.newValue;
        var setMarker= true;

        if (this.__initialising &&
            (null===newValue || 'undefined'===typeof(newValue)))
        {
            this.bindings.src.setValue(view.src);
            return;
        }
    
        switch (newValue)
        {
            case "":
            case null:
            case undefined:
                newValue= this.attributeOrProperty("nullPlaceholder");
                break;
            case coherent.Markers.NoSelection:
                newValue= this.attributeOrProperty("noSelectionPlaceholder");
                break;
            case coherent.Markers.MultipleValues:
                newValue= this.attributeOrProperty("multipleValuesPlaceholder");
                break;
            default:
                setMarker= false;
                break;
        }
        if (setMarker)
            Element.addClassName(view, coherent.Style.kMarkerClass);
        else
            Element.removeClassName(view, coherent.Style.kMarkerClass);
        view.src= newValue;
    },
    
    /** Set the width of the image based on an external value. When initialising
     *  (`this.__initialising===true`) and `change.newValue` is either `null` or
     *  `undefined`, an ImageView will use the width set on the image node to
     *  populate the data model.
     *  
     *  @param change   the change notification containing the new width of the
     *                  image
     */
    observeWidthChange: function(change)
    {
        var view= this.viewElement();
        var width= parseInt(change.newValue,10);

        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            this.bindings.width.setValue(view.width);
            return;
        }

        if (isNaN(width))
            view.width='';
        else
            view.width= width;
    },
    
    /** Set the height of the image based on an external value. When
     *  initialising (`this.__initialising===true`) and `change.newValue` is
     *  either `null` or `undefined`, the ImageView will popuplate the data
     *  model using the height property of the image node.
     *  
     *  @param change   the change notification containing the new height of the
     *                  image
     */
    observeHeightChange: function(change)
    {
        var view= this.viewElement();
        var height= parseInt(change.newValue,10);

        if (this.__initialising &&
            (null===change.newValue || 'undefined'===typeof(change.newValue)))
        {
            this.bindings.height.setValue(view.height);
            return;
        }

        if (isNaN(height))
            view.height='';
        else
            view.height= height;
    }

});



/** A View that represents basic input controls -- text, password, and search
 *  fields, textareas, checkboxes, and radio buttons. An InputView can be
 *  enabled or disabled based on a binding (or automatically if the value is
 *  undefined). Additionally, an InputView is set to readonly if the value
 *  binding is not mutable.
 *  
 *  In addition to the base bindings exposed by View, InputViews have
 *  bindings for `value` and `enabled`. The `value` binding represents the
 *  value of the View. The `enabled` binding determines whether the control
 *  is enabled or not.
 *  
 *  As part of {@link coherent.View.createViewsForNodeTree} processing, InputViews will be
 *  created for any node that matches one of:
 *  
 *   - `input[type=text]`
 *   - `input[type=password]`
 *   - `textarea`
 *  
 *  @declare coherent.InputView
 *  @extends coherent.View
 **/
coherent.InputView= Class.create(coherent.View, {

    exposedBindings: ["value"],
    
    __viewClassName__: 'Input',
    __tagSpec__: ['input[type=text]', 'input[type=password]',
                  'input[type=hidden]', 'textarea'],

    init: function()
    {
        //  chain to parent init.
        this.base();

        var view= this.viewElement();
        
        Event.observe(view, "change",
                   this.valueChanged.bindAsEventListener(this));
        Event.observe(view, "drop",
                   this.fieldReceivedDropEvent.bindAsEventListener(this));

        this.editing= false;
    },
    
    /** The default placeholder text used when the value of View is the
     *  multiple values marker. You can override this value either on derived
     *  Views or by setting an attribute on the input tag.
     **/
    multipleValuesPlaceholder: _("marker.input.multipleValues"),

    /** The default placeholder text used when the value of the View is a null
     *  value (null or the empty string).
     **/
    nullPlaceholder: _("marker.input.placeholder"),
    
    /** The default placeholder text used when the value of the View is the no
     *  selection marker.
     **/
    noSelectionPlaceholder: _("marker.input.noSelection"),
    
    /** Number of milliseconds before sending value change notification for a
     *  series of key presses.
     **/
    keypressUpdateTimeout: 100,
    
    /** Does the input field update its value continuously or wait until typing
     *  has stopped?
     */
    continuallyUpdatesValue: true,
    
    /** Method called when the input field has received the focus. Derived Views
     *  can override this method to perform specific operations when editing begins.
     **/
    beginEditing: function()
    {
        this.editing= true;
    },
    
    /** Method called when the input field has lost the focus or editing has ended
     *  for any other reason. Derived Views may override this method to perform
     *  special cleanup operations.
     **/
    endEditing: function()
    {
        this.editing= false;
    },

    /** Input fields want to be first responders...
     */
    acceptsFirstResponder: function()
    {
        var view= this.viewElement();

        if (view.disabled || view.readOnly)
            return false;
        return true;
    },
    
    /** Focus handler for text input fields. If the present value of the field
     *  matches any of the placeholder values, the field is cleared before
     *  editing begins. This method will call {@link #beginEditing} to allow
     *  derived views to perform something clever when editing begins.
     **/
    becomeFirstResponder: function()
    {
        var view= this.viewElement();

        if (view.disabled || view.readOnly)
            return false;
    
        var value=null;

        if (this.bindings.value)
            value= this.bindings.value.value();
    
        //  clear out any marker text
        if (null===value || 'undefined'===typeof(value) || ""===value ||
            coherent.Markers.NoSelection===value ||
            coherent.Markers.MultipleValues===value)
        {
            this.clearMarkerValue();
        }
        this.hasFocus= true;
        this.beginEditing();
        return true;
    },
    
    /** Blur handler for text input fields. If the value of the view is empty,
     *  the `nullPlaceholder` text will be set in the field. This handler also
     *  triggers a call to {@link #endEditing}.
     **/
    resignFirstResponder: function(event)
    {
        var view= this.viewElement();
        this.hasFocus= false;
        if (""===view.value)
            this.setMarkerValue("nullPlaceholder");
        this.endEditing();
        return true;
    },
    
    /** Display a marker value. The actual value of the marker is pulled from
     *  either an attribute on the node or a property on the view. In addition
     *  to updating the value of the view, `setMarkerValue` stores the text of
     *  the marker in the `markerValue` property and adds the marker class to
     *  the view's node.
     *  
     *  @param marker   which marker value to display
     **/
    setMarkerValue: function(marker)
    {
        var view= this.viewElement();

        var value= this.attributeOrProperty(marker);
        this.markerValue= marker;
        view.value= value;
        Element.addClassName(view, coherent.Style.kMarkerClass);
    },

    /** Remove a marker value. In addition to clearing the value of the field,
     *  this method resets the `markerValue` property to `false` and removes the
     *  marker class from the view's node.
     **/
    clearMarkerValue: function()
    {
        var view= this.viewElement();
        this.markerValue= false;
        view.value= "";
        Element.removeClassName(view, coherent.Style.kMarkerClass);
    },

    /** Value change handler for edit fields. It this handler was triggered via
     *  a timer event (or if a timer event is pending), the timer is cleared.
     *  If the new value isn't one of the marker values, then pass it along to
     *  the value binding.
     **/
    valueChanged: function(event)
    {
        var view= this.viewElement();
        var value= view.value;
        if (this.markerValue)
            return;

        if (this.updateTimer)
        {
            window.clearTimeout(this.updateTmer);
            this.updateTimer= null;
        }
    
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    /** Clear the field when text is dropped on it.
     **/
    fieldReceivedDropEvent: function(event)
    {
        var view= this.viewElement();
        view.value= "";
    },
    
    /** Handler for keypress events. Because we don't want to flood the browser
     *  with update notifications, this event handler delays calling the
     *  `valueChanged` method until some time has passed ({@link #updateTimer}).
     *  How this delay works is dependent on the value of
     *  {@link #continuallyUpdatesValue}. If `continuallyUpdatesValue` is `true`,
     *  the update will occur some number of milliseconds after the first
     *  keystroke. However, if `continuallyUpdatesValue` is `false`, the update
     *  will wait until typing has paused for a number of milliseconds.
     **/
    onkeypress: function(event)
    {
        var view= this.viewElement();

        if (this.updateTimer && !this.continuallyUpdatesValue)
        {
            window.clearTimeout(this.updateTimer);
            this.updateTimer= null;
        }
        
        if (this.updateTimer || view.readOnly || view.disabled)
            return;
        this.updateTimer= window.setTimeout(this.valueChanged.bind(this),
                                            this.keypressUpdateTimeout);
    },
    
    /** Callback for tracking changes to the value binding. This method will
     *  disable the control if the value is undefined (meaning one of the
     *  objects along the key path doesn't exist). Additionally, the control
     *  will be set to readonly if the value binding isn't mutable or if the new
     *  value is one of the marker values (MultipleValuesMarker or
     *  NoSelectionMarker).
     *
     *  When initialising (`this.__initialising===true`) and `change.newValue`
     *  is either `null` or `undefined`, the InputView will pull the value out
     *  of the field and push it into the data model.
     *  
     *  @param change   a ChangeNotification with the new value for the field
     **/
    observeValueChange: function(change)
    {
        var view= this.viewElement();
        var newValue= change.newValue;
        
        if (this.__initialising &&
            (null===newValue || 'undefined'===typeof(newValue)))
        {
            this.bindings.value.setValue(view.value);
            return;
        }
        
        if ('undefined'===typeof(newValue))
            view.disabled= true;
        else if (!this.bindings.enabled)
            view.disabled= false;
    
        view.readOnly= !this.bindings.value.mutable() ||
                         coherent.Markers.MultipleValues===newValue ||
                         coherent.Markers.NoSelection===newValue;

        if (view.disabled)
            Element.addClassName(view, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(view, coherent.Style.kDisabledClass);

        //  don't change the value if the field has the focus
        if (this.hasFocus)
            return;
        
        switch (view.type)
        {
            case 'text':
            case 'password':
            case 'textarea':
                if (null===newValue || 'undefined'===typeof(newValue) || ""===newValue)
                    this.setMarkerValue("nullPlaceholder");
                else if (coherent.Markers.NoSelection===newValue)
                    this.setMarkerValue("noSelectionPlaceholder");
                else if (coherent.Markers.MultipleValues===newValue)
                    this.setMarkerValue("multipleValuesPlaceholder");
                else
                {
                    this.clearMarkerValue();
                    view.value= newValue;
                }
                break;

            default:
                view.value= newValue;
                break;
        }
    }
    
});



/** An inline input view. Only displays an input box when the user clicks on
 *  the text. This may not be terribly useful as most modern browsers support
 *  styling input fields to simulate this experience.
 *  
 *  @declare coherent.InlineInputView
 *  @extends coherent.InputView
 **/
coherent.InlineInputView= Class.create(coherent.InputView, {

    __viewClassName__: 'InlineInput',
    
    init: function()
    {
        this.base();

        var view= this.viewElement();

        var type= view.type;
        if ('text'!==type && 'password'!==type && 'textarea'!==type)
        {
            console.log("Invalid type (" + type + ") for InlineInputView.");
            return;
        }
    
        var container= this.setContainer(document.createElement("span"));
        container.className= "inlineEditor";
    
        view.parentNode.replaceChild(container, view);
    
        //  create the span element used to display this view when not editing
        //  TODO: This seems like a memory leak
        this.span= document.createElement("span");
        this.span.className= this.className;
        this.span.style.display="";
        this.span.onclick= this.beginEditing.bindAsEventListener(this);
        this.span.title= "Click to edit";

    //  This seems to crash Safari    
    //  this.container.onmouseover= this.mouseEntered.bindAsEventListener(this);
    //  this.container.onmouseout= this.mouseExited.bindAsEventListener(this);
        container.appendChild(view);
        container.appendChild(this.span);

        view.style.display="none";
    
        this.updateValue();
    },
    
    /** Synchronise the text displayed in the span with the value contained in the
        input field.
     **/
    updateValue: function()
    {
        var view= this.viewElement();
        if (!this.span)
            return;
        var textNode = document.createTextNode(view.value);
        this.span.innerHTML = "";
        this.span.appendChild( textNode );
    },
    
    /** Overridden version of InputView's beginEditing method. This version hides
        the span and displays the input field. Additionally, it automatically
        focusses & selects the input field.
     **/
    beginEditing: function()
    {
        this.base();

        var view= this.viewElement();
        view.style.display = "";
        this.span.style.display = "none";
        view.focus();
        view.select();
        return false;
    },
    
    /** Overridden version of InputView's endEditing method. This version shows
        the span and hides the input field. It also updates the text in the span.
     **/
    endEditing: function()
    {
        this.base();
        var view= this.viewElement();
        this.updateValue();
        this.span.style.display="";
        view.style.display="none";
        return false;
    },
    
    /** Add a hover style to the container when the mouse enters. Disabled at the
        moment because this causes Safari to crash.
     **/
    mouseEntered: function()
    {
        Element.addClassName(this.span, "hover");
    },
    
    /** Remove the hover style to the container when the mouse exits. Disabled at
        the moment because this causes Safari to crash.
     **/
    mouseExited: function()
    {
        Element.removeClassName(this.span, "hover");
    },
    
    /** Overridden version of InputView's observeValueChange method. This version
        synchronises the span.
     **/
    observeValueChange: function(change, keyPath, context)
    {
        this.base(change, keyPath, context);
        this.updateValue();
    },
    
    /** Overridden version of Views's observeVisibleChange method. This
        version makes the visibility change to the container rather than the input
        field or span.
     **/
    observeVisibleChange: function(change, keyPath, context)
    {
        if (change.newValue)
            this.container.style.display= "";
        else
            this.container.style.display= "none";
    },
    
    /** Overridden version of View's observeClassChange method. This version
        keeps the class of the span synchronised with the input field.
     **/
    observeClassChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        coherent.View.observeClassChange.apply( this, arguments );
        this.span.className= view.className;
    }

});




/** A view that will iterate over a collection of objects. This view exposes
 *  the following bindings:
 *  
 *   - `content`: The view's content is an array of objects which should be
 *     displayed.
 *   - `selectionIndexes`: This binding is for an array representing the indexes
 *     of the selected elements in the view.
 *   - `selectedIndex`: This binding is the single selection equivalent of
 *     `selectionIndexes`. Note: binding `selectedIndex` does not restrict
 *     the view to single selection. To enable multiple selection in a
 *     ListView, refer to the {@link #multiple} property.
 *   - `selectedObject`: This binding presents the single selected object in a
 *     ListView.
 *  
 *  The first child node within the view's node is considered the template
 *  node and will be used to generate nodes for each element in the view's
 *  content array. Consider the following example:
 *  
 *      <ul contentKeyPath="state.content">
 *        <li textKeyPath="*.name">Nothing To See Here</li>
 *      </ul>
 *  
 *  This defines an unordered list with a single child item. The nodes bind to
 *  state data using custom attributes (`contentKeyPath` and `textKeyPath`). The
 *  `LI` node binds to the elements of the ListView's `content` by starting
 *  its keypath with `*`. Now, if the value of `state.content` is the array:
 *  
 *      [{name: 'Madeline'}, {name: 'Augustus'}, {name: 'Tim'}, {name: 'Magic'}]
 *  
 *  The ListView will generate the following:
 *  
 *      <ul contentKeyPath="state.content">
 *        <li textKeyPath="*.name">Madeline</li>
 *        <li textKeyPath="*.name">Augustus</li>
 *        <li textKeyPath="*.name">Tim</li>
 *        <li textKeyPath="*.name">Magic</li>
 *      </ul>
 *  
 *  @property multiple  This property controls whether the ListView supports
 *                      multiple selection or not. You may set this property
 *                      directly on the view's node (e.g.
 *                      `<ul multiple="true" ...>`).
 *  @property anchorTop The top index of a multiple selection (not necessarily
 *                      the lower value).
 *  @property anchorBottom  The bottom index of a multiple selection (not always
 *                          the highest value).
 *  @property selectionIndexes  An array containing the index of each selected
 *                              element in the ListView.
 *  @property selectedIndex An analogue for the SELECT node's `selectedIndex`
 *                          property. This will probably go away in the next
 *                          version.
 *  
 *  @declare coherent.ListView
 *  @extends coherent.View
 */
coherent.ListView= Class.create(coherent.View, {

    __viewClassName__: 'List',
    __tagSpec__: ['table', 'ul'],
    
    exposedBindings: ['content', 'selectionIndexes', 'selectedIndex',
                      'selectedObject'],
    
    /** Keycode for the up arrow key. */
    KEY_UP: 38,
    /** Keycode for the down array key. */
    KEY_DOWN: 40,
    
    /** This will be a PartList for all the items in the list. The PartList is
     *  created as part of `init` because this view class services many
     *  different tags.
     */
    _items: null,
    
    _activeItem: -1,
    
    /** Initialise the ListView. Based on the type of node the view has been
     *  attached to, the `_items` PartList is constructed with the appropriate
     *  child elements. Care must be taken with UL & OL nodes, because we don't
     *  want to capture nested lists.
     *  
     *  For nodes other than SELECTs, the view establishes `click` and
     *  `keydown` event handlers.
     *  
     *  Finally, it initialises its selection to an empty list.
     */
    init: function()
    {
        //  Call base init
        this.base();
    
        var view= this.viewElement();
        var container;

        if ('SELECT'===view.tagName)
        {
            this._items= PartList('option');
            this.templateElement= document.createElement("option");
            Event.observe(view, "change",
                          this.selectedIndexChanged.bindAsEventListener(this));
        }
        else
        {
            if ('TABLE'===view.tagName)
            {
                container= this.setContainer(view.tBodies[0]);
                this._items= PartList('tr');
                this.templateElement= Element.clone(this._items(0));
            }
            else
            {
                container= this.container();
                
                var node= view.firstChild;
                while (node)
                {
                    if (1===node.nodeType)
                        break;
                    node= node.nextSibling;
                }
                //  list view is empty?
                if (!node)
                    return;

                this._items= PartList(node.tagName);
                this.templateElement= Element.clone(node);
            }
            
            this.templateElement.id= "";
        }
        
        //  Start off with nothing selected. If a binding for the selection is
        //  established, then the selection will be set appropriately,
        //  otherwise, nothing should be selected.
        var selectionIndexes= this.computeSelectionIndexes();
        this.selectionIndexes= selectionIndexes;
        this.selectedIndex= selectionIndexes.length?selectionIndexes[0]:-1;
        this.anchorTop= this.anchorBottom= this.selectedIndex;
    },
    
    /** Input fields want to be first responders...
     */
    acceptsFirstResponder: function()
    {
        var view= this.viewElement();

        if (view.disabled || view.readOnly)
            return false;
        return true;
    },
    
    /** Handle a keydown notification to update selection. If the view doesn't
     *  have the focus, then the view ignores key events. This event handler
     *  only processes KEY_UP (cursor up) and KEY_DOWN (cursor down) events.
     *  
     *  Keyboard selection without the shift key works according to the Mac
     *  standard (up selects the previous element or the last element in the
     *  collection if none are presently selected, down selects the next element
     *  or the first element in the collection if no elements are selected).
     *
     *  @TODO: Keyboard selection with the shift key works like Tiger but should
     *  be converted to work like Leopard.
     *  
     *  @param event    the HTML event object
     *  @returns false to indicate that this event has been handled
     **/
    onkeydown: function(event)
    {
        var view= this.viewElement();

        //  Only need to trap up & down arrows
        if (this.KEY_UP != event.keyCode && this.KEY_DOWN != event.keyCode)
            return false;

        Event.stop(event);
        
        var selectionIndexes= this.selectionIndexes;
        var maxIndex= this.bindings.content.value().length-1;

        //  Handle extending the selection by holding down the shift key...
        //  @TODO swap this to the new Mac way of doing selection...
        if (event.shiftKey && this.selectionIndexes.length)
        {
            this.anchorTop= selectionIndexes[0];
            this.anchorBottom= selectionIndexes[selectionIndexes.length-1];
        
            //  Determine how to extend the selection (Up or down)
            if (this.KEY_UP==event.keyCode && 0<this.anchorTop)
                this.anchorTop--;
            else if (this.KEY_DOWN==event.keyCode && this.anchorBottom<maxIndex)
                this.anchorBottom++;
            selectionIndexes= IndexRange(this.anchorTop, this.anchorBottom);
        }
        else if (!this.selectionIndexes.length)
        {
            //  no current selection
            if (this.KEY_UP==event.keyCode)
                this.anchorTop= this.anchorBottom= maxIndex;
            else if (this.KEY_DOWN==event.keyCode)
                this.anchorTop= this.anchorBottom= 0;
            selectionIndexes= [this.anchorTop];
        }
        else
        {
            if (this.KEY_UP==event.keyCode && this.anchorTop>0)
                this.anchorBottom= --this.anchorTop;
            else if (this.KEY_DOWN==event.keyCode && this.anchorBottom<maxIndex)
                this.anchorTop= ++this.anchorBottom;
            selectionIndexes= [this.anchorTop];
        }
    
        this.setSelection(selectionIndexes);
    
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
        return true;
    },
    
    /** Handle the change notification from SELECT elements. Update the data
     *  model with the selected index, object, and value as appropriate.
     *
     *  @param event    (ignored) the event object for this change.
     **/
    selectedIndexChanged: function(event)
    {
        //  If there's no selectionIndexes or selectionIndex binding, then there's
        //  no point in processing the selection change.
        if (!this.bindings.selectionIndexes && !this.bindings.selectedIndex &&
            !this.bindings.selectedObject && !this.bindings.selectedValue)
            return;

        var view= this.viewElement();
    
        var selectionIndexes;
        
        //  If the SELECT supports multiple selection, the only way to
        //  determine what is selected is to enumerate all the items and
        //  check their .selected property.
        if (this.attributeOrProperty("multiple"))
            selectionIndexes= this.computeSelectionIndexes();
        else
            selectionIndexes= [this.selectedIndex=view.selectedIndex];

        //  Update the bindings if they exist.
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
        if (this.bindings.selectedValue)
        {
            var option= this._items(view.selectedIndex);
            if (option)
                this.bindings.selectedValue.setValue(option.value);
            else
                this.bindings.selectedValue.setValue(null);
        }
    },

    /** Compute the indexes of selected elements. This method visits each node
     *  within the `_items` PartList to determine whether it's selected (as
     *  indicated by the value of its `selected` property).
     *
     *  @returns an array of indexes of the selected elements.
     **/
    computeSelectionIndexes: function()
    {
        var selectionIndexes= [];
        var items= this._items();
        
        function visitNode(e, index)
        {
            if (e.selected)
                selectionIndexes.push(index);
        }
    
        items.forEach(visitNode);
        
        //  return the array of selected indexes.
        return selectionIndexes;
    },
    
    /** Highlight the selected elements. Does not update bound selection. Nodes
     *  that are selected have their `selected` property set to `true` and
     *  receive the class {@link coherent.Style}.kSelectedClass.
     *
     *  @param selectionIndexes the indexes of the selected elements.
     **/
    setSelection: function(selectionIndexes)
    {
        //  It's faster to clear the selection if the new array is empty
        if (!selectionIndexes || !selectionIndexes.length)
        {
            this.clearSelection();
            return;
        }
    
        var view= this.viewElement();
        
        //  SELECT elements do their own highlighting, so there's no need to
        //  add classes to the selected items.
        var highlight= ('SELECT'!==view.tagName);

        //  create a copy of the selected indexes
        this.selectionIndexes= selectionIndexes.concat();
        this.selectionIndexes.sort();
        view.selectedIndex= this.selectedIndex= this.selectionIndexes[0];
    
        var i=0;
        var len= this.selectionIndexes.length;
        selectionIndexes= this.selectionIndexes;
    
        var addClass= Element.addClassName;
        var removeClass= Element.removeClassName;
        
        function setSelectionFlag(e, index)
        {
            if (i<len && index===selectionIndexes[i])
            {
                e.selected= true;
                i++;
            }
            else
                e.selected= false;
        
            //  If I'm not highlighting the elements manually, I'm done.
            if (!highlight)
                return;

            if (e.selected)
                addClass(e, coherent.Style.kSelectedClass);
            else
                removeClass(e, coherent.Style.kSelectedClass);
        }
    
        var items= this._items();
        items.forEach(setSelectionFlag);
    },
    
    /** Remove the selection highlight from all elements. Does not update bound
     *  selection.
     **/
    clearSelection: function()
    {
        var view= this.viewElement();
        
        //  should we do the class select thing
        var clearHighlight= ('SELECT'!==view.tagName);
    
        function clearSelectedFlag(e)
        {
            if (e.selected)
                e.selected= false;
            if (clearHighlight)
                Element.removeClassName(e, coherent.Style.kSelectedClass);
        }
    
        var items= this._items();
        items.forEach(clearSelectedFlag);

        view.selectedIndex= this.selectedIndex=-1;
        this.selectionIndexes= [];
    },
    
    /** Highlight an element to indicate selection. Does not update bound
     *  selection. Selected elements have their `selected` property set to
     *  `true` and receive the class {@link coherent.Style}.kSelectedClass.
     *
     *  @param index    the index of the element to select.
     **/
    selectElementAtIndex: function(index)
    {
        var view= this.viewElement();
        var highlight= ('SELECT'!==view.tagName);
        var e= this._items(index);
        if (!e)
            return;
        e.selected= true;
        if (highlight)
            Element.addClassName(e, coherent.Style.kSelectedClass);
    },
    
    /** Remove the selection highlight from an element. Does not update bound
     *  selection. Clears the node's `selected` property and removes the 
     *  selected class.
     *
     *  @param index    the index of the element to deselect
     **/
    deselectElementAtIndex: function(index)
    {
        var view= this.viewElement();
        var highlight= ('SELECT'!==view.tagName);
        var e= this._items(index);
        if (!e)
            return;
        e.selected= false;
        if (highlight)
            Element.removeClassName(e, coherent.Style.kSelectedClass);
    },
    
    /** Observe changes to the `selectedIndex` binding. This just calls
     *  {@link #setSelection} with the new value.
     *  
     *  @param change   the new value for the `selectedIndex` property
     */
    observeSelectedIndexChange: function(change)
    {
        var newSelection= change.newValue?[change.newValue]:[];
        this.setSelection(newSelection);
    },
    
    /** Observe changes to the `selectedObject` binding. This method needs to
     *  determine the index of the object in the `content` array. If the new
     *  object doesn't exist in the content array, the selection is cleared.
     *
     *  @param change   the new value for the `selectedObject` property
     */
    observeSelectedObjectChange: function(change)
    {
        var newValue= change.newValue;
        if (null===newValue || 'undefined'===typeof(newValue))
        {
            this.setSelection([]);
            return;
        }
        
        var content= this.bindings.content.value();
        var index= content.indexOf(newValue);
        var selection= (-1===index?[]:[index]);
        this.setSelection(selection);
    },
    
    /** Observe changes to the `selectionIndexes` binding. This method merely
     *  passes along the value to the {@link #setSelection} method.
     *  
     *  @param change   the new value for the `selectionIndexes` property.
     */
    observeSelectionIndexesChange: function(change)
    {
        var newSelection= change.newValue || [];

        //  update highlighting
        this.setSelection(newSelection);
    },
    
    /** Observe changes for the ListView's `content`. This method is smart
     *  enough to handle insertion, deletion and replacement as well as simple
     *  setting of the content. The view attempts to keep the selection static
     *  by mapping the originally selected objects onto the new content. As a
     *  result, this method often updates the selection bindings.
     *  
     *  @TODO: this is one of the few places where a view does not initialise
     *  the data model based on the DOM.
     *  
     *  @param change   The change notification containing updates to the
     *                  content.
     */
    observeContentChange: function(change)
    {
        var container= this.container();
        var view= this.viewElement();
            
        var index;
        var changeIndex;
        var beforeNode;
        var e;
        var content;
        
        // if (this.__initialising &&
        //     coherent.ChangeType.setting===change.changeType)
        // {
        //     content= this.bindings.content.value();
        //     var len= items.length;
        //     
        //     for (var i=0; i<len; ++i)
        //     {
        //     }
        //     
        // }
    
        switch (change.changeType)
        {
            case coherent.ChangeType.setting:
                content= this.bindings.content.value()||[];
                var selectedObjects= [];
                
                if (this.bindings.selectionIndexes)
                {
                    var selectionIndexes= this.bindings.selectionIndexes.value();
                    selectedObjects= content.objectsAtIndexes(selectionIndexes||[]);
                }
                else if (this.bindings.selectedIndex)
                {
                    var selectedIndex= this.bindings.selectedIndex.value();
                    if (-1!==selectedIndex && content[selectedIndex])
                        selectedObjects= [content[selectedIndex]];
                }
                else if (this.bindings.selectedObject)
                {
                    var selectedObject= this.bindings.selectedObject.value();
                    if (selectedObject)
                        selectedObjects= [selectedObject];
                }
                
                //  Remove all the old nodes, because I'm going to replace
                //  them with shiny new nodes.
                //  TODO: This seems like it might be inefficient. Would it
                //  be better to overwrite existing nodes and add new?
                this._items().forEach(this.removeChild, this);
                this._items.removeAll();
                
                this.clearSelection();
                if (!change.newValue)
                    break;

                //  create one option for each element in the Array
                var frag= document.createDocumentFragment();
                for (index=0; index<change.newValue.length; ++index)
                {
                    if (-1!==selectedObjects.indexOf(change.newValue[index]))
                        this.selectionIndexes.push(index);
                    e= this.createElement(change.newValue[index], null, frag);
                    this._items.add(e);
                }
                container.appendChild(frag);
                this.setSelection(this.selectionIndexes);
                break;

            case coherent.ChangeType.insertion:
                //  add the specific indexes.
                for (index=0; index<change.indexes.length; ++index)
                {
                    beforeNode= this._items(change.indexes[index]);
                    e= this.createElement(change.newValue[index], beforeNode);
                    this._items.insertPartAtIndex(e, change.indexes[index]);
                }
                this.setSelection(change.indexes);
                break;
            
            case coherent.ChangeType.replacement:
                //  set the specific indexes.
                for (index=0; index<change.indexes.length; ++index)
                {
                    e= this._items(change.indexes[index]);
                    e.objectValue= change.newValue[index];
                    coherent.setup(e, this.keyPath, e.objectValue);
                }
                break;
        
            case coherent.ChangeType.deletion:
                //  Remove entries.
                selectionIndexes= this.selectionIndexes;

                for (index= change.indexes.length-1; index>=0; --index)
                {
                    var nodeIndex= change.indexes[index];
                    selectionIndexes.removeObject(nodeIndex);
                    e= this._items(nodeIndex);
                    this._items.removePartAtIndex(nodeIndex);
                    this.removeChild(e);
                }
            
                this.setSelection(selectionIndexes);
                break;
            
            default:
                console.log( "Unknown change type: " + change.changeType );
                break;
        }

        //  Update the selection bindings based on changed content
        if (this.bindings.selectionIndex)
            this.bindings.selectedIndex.setValue(this.selectedIndex);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(this.selectionIndexes);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            selectedIndex= this.selectionIndexes[0];
            selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
    
        //  Given the changed content, the displayValues binding should probably
        //  requery for the correct values.
        if (this.bindings && this.bindings.displayValues)
            this.bindings.displayValues.update();
    },

    /** Helper method to create a new template element. This will clone the
     *  template and insert it in the correct location. It also sets up the
     *  objectValue and calls setupNode to bind the node to the relativeSource.
     *  
     *  @param relativeSource   an object which should be used when resolving
     *                          keypaths that begin with *.
     *  @param beforeNode       the new node will be inserted before this node
     *  @param container        [optional] if specified, the new node will be
     *                          inserted in this container rather than the
     *                          view's container. This is used to add new
     *                          nodes to a document fragment to speed up DOM
     *                          manipulation.
     *  @returns the new node
     */
    createElement: function(relativeSource, beforeNode, container)
    {
        var view= this.viewElement();
        container= container || this.container();

        var node= Element.clone(this.templateElement);
        var e= container.insertBefore(node, beforeNode || null);
        
        e.objectValue= relativeSource;
        coherent.View.createViewsForNodeTree(e, relativeSource, this.__context);
        return e;
    },
    
    onmousedown: function(event)
    {
        var view= this.viewElement();
        if ('SELECT'===view.tagName)
        {
            this.base(event);
            return;
        }
        
        var e= event.target||event.srcElement;
        var container= this.container();
        var items= this._items();
        
        while (e && e.parentNode!=container)
            e= e.parentNode;

        if (e==container)
            return;
        
        this._activeItem= items.indexOf(e);    
        Element.addClassName(e, 'active');
    },

    onmouseup: function(event)
    {
        if (-1!==this._activeItem)
            Element.removeClassName(this._items(this._activeItem), 'active');
        this._activeItem= -1;
    },
    
    /** Handle click events for items within the view. This supports multiple
     *  and discontiguous selection.
     */
    onclick: function(event)
    {
        var view= this.viewElement();
        if ('SELECT'===view.tagName)
        {
            this.base(event);
            return;
        }
        
        var e= event.target||event.srcElement;
        var selectedIndex=-1;
        var selectedObject=null;
        var container= this.container();
        var items= this._items();
        
        while (e && e.parentNode!=container)
            e= e.parentNode;

        if (e)
        {
            selectedIndex= items.indexOf(e);
            selectedObject= e.objectValue;
        }
    
        var selectionIndexes;
    
        if (!this.attributeOrProperty("multiple"))
            this.setSelection( selectionIndexes= [selectedIndex] );
        else
        {
            selectionIndexes= this.selectionIndexes.concat();

            if (event.shiftKey)
            {
                var range;
            
                if (selectedIndex<this.anchorTop)
                {
                    this.anchorTop= selectedIndex;
                    range= IndexRange(this.anchorTop, this.anchorBottom);
                }
                else if (selectedIndex>this.anchorBottom)
                {
                    this.anchorBottom= selectedIndex;
                    range= IndexRange(this.anchorTop, this.anchorBottom);
                }
            
                function addSelection( sel )
                {
                    if (-1===selectionIndexes.indexOf( sel ))
                        selectionIndexes.push( sel );
                }
            
                if (range)
                {
                    range.each( addSelection );
                    this.setSelection( selectionIndexes );
                }
            }
            else if (event.ctrlKey || event.metaKey)
            {
                var index= selectionIndexes.indexOf( selectedIndex );
                //  do discontiguous selection
                if (-1===index)
                {
                    this.anchorTop= this.anchorBottom= selectedIndex;
                    selectionIndexes.addObject( selectedIndex );
                }
                else
                    selectionIndexes.removeObjectAtIndex( index );
        
                this.setSelection( selectionIndexes );
            }
            else
            {
                this.anchorTop= this.anchorBottom= selectedIndex;
                this.setSelection( selectionIndexes=[selectedIndex] );
            }
        }

        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue( selectionIndexes );
        if (this.bindings.selectedObject && this.bindings.content)
        {
            selectedIndex= selectionIndexes[0];
            selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
            
        //  don't let anchors display the wacky dotted border (MSIE only?)
        if (e && 'A'==e.tagName)
            e.blur();
            
        //  Send the action to let the target know a selection was made
        this.sendAction();
        Event.stop(event);
    }

});





coherent.Page= Class.create(coherent.Responder, {
    
    firstResponder: null,
    
    targetViewForEvent: function(event)
    {
        var element= event.target||event.srcElement;
        while (element && element!=document && !element.__viewclass__)
            element= element.parentNode;
        
        if (!element || element==document)
            return null;
        return coherent.View.fromNode(element);
    },
    
    makeFirstResponder: function(view)
    {
        if (this.firstResponder==view)
            return true;
        
        //  Ask previous first responder to resign
        if (this.firstResponder &&
            !this.firstResponder.resignFirstResponder())
            return false;

        //  Remove focus class from old firstResponder
        if (this.firstResponder)
            Element.removeClassName(this.firstResponder.viewElement(),
                                    coherent.Style.kFocusClass);
        
        if (view && !view.becomeFirstResponder())
            return false;
        
        this.firstResponder= view;
        if (view)
        {
            view.focus();
            Element.addClassName(this.firstResponder.viewElement(),
                                 coherent.Style.kFocusClass);
        }

        return true;
    },
    
    _findFirstResponder: function(view)
    {
        while (view && !view.acceptsFirstResponder())
            view= view.superview();
        if (!view)
            return;
        this.makeFirstResponder(view);
    },
    
    _onmousedown: function(event)
    {
        coherent.EventLoop.begin(event);
        
        var view= this.targetViewForEvent(event);
        if (view)
        {
            this._findFirstResponder(view);
            view.onmousedown(event);
        }
        this._mousedownView= view;
        
        coherent.EventLoop.end(event);
    },

    _onclick: function(event)
    {
        coherent.EventLoop.begin(event);
        
        if (this._mousedownView)
            this._mousedownView.onclick(event);
        
        coherent.EventLoop.end(event);
    },

    _ondblclick: function(event)
    {
        coherent.EventLoop.begin(event);
        
        if (this._mousedownView)
            this._mousedownView.ondblclick(event);
        
        coherent.EventLoop.end(event);
    },
    
    _onmouseup: function(event)
    {
        coherent.EventLoop.begin(event);
        
        if (this._mousedownView)
            this._mousedownView.onmouseup(event);
        
        coherent.EventLoop.end(event);
    },
    
    _onkeydown: function(event)
    {
        coherent.EventLoop.begin(event);

        var target= this.firstResponder;
        if (target)
            target.onkeydown(event);
            
        coherent.EventLoop.end(event);
    },
    
    _onkeyup: function(event)
    {
        coherent.EventLoop.begin(event);

        var target= this.firstResponder;
        if (target)
            target.onkeyup(event);
            
        coherent.EventLoop.end(event);
    },
    
    _onkeypress: function(event)
    {
        coherent.EventLoop.begin(event);

        var target= this.firstResponder;
        if (target)
            target.onkeypress(event);
            
        coherent.EventLoop.end(event);
    },
    
    _onfocus: function(event)
    {
        coherent.EventLoop.begin(event);
        var view= this.targetViewForEvent(event);
        
        if (view && view.acceptsFirstResponder())
            this.makeFirstResponder(view);
        else
            this.makeFirstResponder(null);
        coherent.EventLoop.end(event);
    },
    
    _onblur: function(event)
    {
        coherent.EventLoop.begin(event);

        var view= this.targetViewForEvent(event);
        if (view===this.firstResponder)
            this.makeFirstResponder(null);
        
        coherent.EventLoop.end(event);
    },
    
    _ontouchstart: function(event)
    {
        coherent.EventLoop.begin(event);

        var view= this.targetViewForEvent(event);
        if (view)
        {
            view.ontouchstart(event);
            view.onmousedown(event);
        }
        this._touchstartView= view;
        var touch= event.touches[0];
        this._touchPosition= { left: touch.clientX, top: touch.clientY };
        this._touchmoved= false;
        
        coherent.EventLoop.end(event);
    },
    
    _ontouchmove: function(event)
    {
        coherent.EventLoop.begin(event);
        
        if (this._touchstartView)
            this._touchstartView.ontouchmove(event);
        this._touchmoved= true;
        
        coherent.EventLoop.end(event);
    },
    
    _ontouchend: function(event)
    {
        coherent.EventLoop.begin(event);
        
        if (this._touchstartView)
        {
            this._touchstartView.ontouchend(event);
            this._touchstartView.onmouseup(event);
            if (!this._touchmoved)
                this._touchstartView.onclick(event);
        }
        coherent.EventLoop.end(event);
    },
    
    _onunload: function()
    {
        var id;
        var viewLookup= coherent.View.viewLookup;
        for (id in viewLookup)
        {
            viewLookup[id].teardown();
            delete viewLookup[id];
        }
    }
    
});


(function(){

    coherent.page= new coherent.Page();
    
    function unloadHandler()
    {
        coherent.page._onunload();
    }

    if (coherent.Browser.IE)
    {
        document.attachEvent('onmousedown', function() { coherent.page._onmousedown(window.event); });
        document.attachEvent('onmouseup', function() { coherent.page._onmouseup(window.event); });
        document.attachEvent('onclick', function() { coherent.page._onclick(window.event); });
        document.attachEvent('ondblclick', function() { coherent.page._ondblclick(window.event); });
        document.attachEvent('onkeydown', function() { coherent.page._onkeydown(window.event); });
        document.attachEvent('onkeyup', function() { coherent.page._onkeyup(window.event); });
        document.attachEvent('onkeypress', function() { coherent.page._onkeypress(window.event); });
        document.attachEvent('onfocusin', function() { coherent.page._onfocus(window.event); });
        document.attachEvent('onfocusout', function() { coherent.page._onblur(window.event); });
        window.attachEvent('focus', function() { coherent.page._onfocus(window.event); });
        window.attachEvent('blur', function() { coherent.page._onblur(window.event); });
        window.attachEvent('onunload', unloadHandler);
    }
    else
    {
        document.addEventListener('mousedown', function(event) { coherent.page._onmousedown(event); }, false);
        document.addEventListener('mouseup', function(event) { coherent.page._onmouseup(event); }, false);
        document.addEventListener('click', function(event) { coherent.page._onclick(event); }, false);
        document.addEventListener('dblclick', function(event) { coherent.page._ondblclick(event); }, false);
        document.addEventListener('keydown', function(event) { coherent.page._onkeydown(event); }, false);
        document.addEventListener('keyup', function(event) { coherent.page._onkeyup(event); }, false);
        document.addEventListener('keypress', function(event) { coherent.page._onkeypress(event); }, false);
        document.addEventListener('focus', function(event) { coherent.page._onfocus(event); }, true);
        document.addEventListener('blur', function(event) { coherent.page._onblur(event); }, true);
        window.addEventListener('focus', function(event) { coherent.page._onfocus(event); }, false);
        window.addEventListener('blur', function(event) { coherent.page._onblur(event); }, false);
        window.addEventListener('unload', unloadHandler, false);
        document.addEventListener('touchstart', function(event) { coherent.page._ontouchstart(event); }, true);
        document.addEventListener('touchmove', function(event) { coherent.page._ontouchmove(event); }, true);
        document.addEventListener('touchend', function(event) { coherent.page._ontouchend(event); }, true);
    }

})();


/** A specialisation of the InputView used for searching/filtering an
 *  ArrayController. In addition to the bindings exposed by InputViews, the
 *  SearchView exposes the `predicate` binding. The value of the predicate
 *  binding is a filter  function.
 *  
 *  In addition to specifying a predicateKeyPath on the HTML tag, you _must_
 *  specify a `predicate` attribute that is the key path to use in comparisons.
 *  
 *  A SearchView will be created for any `input` element with `type=="search"`
 *  regardless of whether the browser supports native search input elements.
 *  
 *  @declare coherent.SearchView
 *  @extends coherent.InputView
 *  
 *  @TODO: The predicate attribute _really_ ought to be a full predicate def.
 **/
coherent.SearchView= Class.create(coherent.InputView, {

    __viewClassName__: "Search",
    __tagSpec__: 'input[type=search]',

    exposedBindings: ['predicate'],
    
    init: function()
    {
        //  chain to parent init.
        this.base();
        
        var view= this.viewElement();
        if ('search'===view.type)
            Event.observe(view, 'search',
                          this.valueChanged.bindAsEventListener(this));
    },
    
    /** Search views should send updates sooner than regular input views.
     **/
    keypressUpdateTimeout: 25,
    
    /** Overridden valueChanged method from InputView, in addition to
     *  performing the base InputView tasks, this method creates a new filter
     *  predicate and updates any observers of the predicate binding.
     **/
    valueChanged: function(event)
    {
        //  chain to parent handler
        this.base(event);
        if (this.bindings.predicate)
            this.bindings.predicate.setValue(this.createFilterPredicate());
    },
    
    /** Create a filter predicate function that will determine whether the value
     *  specified by the predicate key path contains the text in the search field.
     *  
     *  @returns a function which will match a keypath on KVO compliant objects
     *           with the value in this field.
     **/
    createFilterPredicate: function()
    {
        var view= this.viewElement();
        var keyPath= this.attributeOrProperty("predicate");
        var value= view.value.toLowerCase();
    
        function fn(obj)
        {
            var v= obj.valueForKeyPath(keyPath);
            if (!v)
                return !!value;
            if (v.toLocaleString)
                v= v.toLocaleString();
            else
                v= v.toString();
            v= v.toLowerCase();
            return (-1!==v.indexOf(value));
        }

        return fn;
    },
    
    /** Callback for observing changes to the bound predicate. This is empty because
     *  the search view really doesn't update itself based on the predicate.
     *
     *  @TODO: what should _really_ be done here?
     **/
    observePredicateChange: function(change)
    {
    }

});




/** A view for popup select lists.
 *  
 *  @declare coherent.SelectView
 *  @extends coherent.ListView
 *  
 */
coherent.SelectView= Class.create(coherent.ListView, {

    __viewClassName__: 'Select',
    __tagSpec__: 'select',
    
    exposedBindings: ['displayValues', 'selectedValue'],
    
    observeDisplayValuesChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        //  assumes that the content collection has already been set
        var optionIndex;
        var option;
        var allOptions= view.options;
        var optionsLength= allOptions.length;
    
        switch (change.changeType)
        {
            case coherent.ChangeType.setting:
                if (!change.newValue)
                    break;

                for (optionIndex=0; optionIndex<optionsLength; ++optionIndex)
                {
                    if (coherent.Browser.IE)
                        allOptions[optionIndex].innerText= change.newValue[optionIndex];
                    else
                        allOptions[optionIndex].text= change.newValue[optionIndex];
                }
                break;
            
            case coherent.ChangeType.insertion:
            case coherent.ChangeType.replacement:
                var index;
                for (index=0; index<change.indexes.length; ++index)
                {
                    optionIndex= change.indexes[index];
                    option= allOptions[optionIndex];
                    option.text= change.newValue[index];
                }
                break;
            
            default:
                console.log('Unknown change type: ' + change.changeType);
                break;
        }
    },
    
    observeSelectedValueChange: function(change, keyPath, context)
    {
        var view= this.viewElement();
        var options= view.options;
        var len= options.length;
        var newValue= change.newValue;
        var foundIndex= -1;

        if (this.__initialising &&
            (null===newValue || 'undefined'===typeof(newValue)))
        {
            if (-1==view.selectedIndex)
                return;
                
            newValue= options[view.selectedIndex].value;
            
            this.bindings.selectedValue.setValue(view.value);
            return;
        }
        
        view.disabled= 'undefined'===typeof(newValue) ||
                         coherent.Markers.MultipleValues===newValue ||
                         coherent.Markers.NoSelection===newValue;
            
        var selectionIndexes= [];
        
        for (var index= 0; index<len; ++index)
            if (options[index].value==newValue)
            {
                selectionIndexes.push(foundIndex=index);
                break;
            }

        view.selectedIndex= foundIndex;
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
    }

});




/** A view for managing the header for a tabular list.
 *  
 *  @declare coherent.TableHeaderView
 *  @extends coherent.View
 *  
 */
coherent.TableHeaderView= Class.create(coherent.View, {

    __viewClassName__: 'TableHeader',
    
    exposedBindings: ['sortDescriptors'],

    init: function()
    {
        this.base();
        
        var view= this.viewElement();
        if (!view.rows.length)
            return;
        
        //  process columns
        var headerRow= view.rows[0];
        var cells= headerRow.cells;
        var cellCount= cells.length;
        var sortKey;
        
        this.__selectedColumn= -1;
        this.__sortKeyIndex= {};
        
        for (var cellIndex=0; cellIndex<cellCount; ++cellIndex)
        {
            sortKey=cells[cellIndex].getAttribute("sortKey");
            if (!sortKey)
                continue;
            this.__sortKeyIndex[sortKey]= cellIndex;
        }
    },
    
    selectedColumn: function()
    {
        return this.__selectedColumn;
    },
    
    setSelectedColumn: function(newSelectedColumn)
    {
        var view= this.viewElement();
        if (!view.rows.length)
            return;

        if (this.__selectedColumn===newSelectedColumn)
            return;
        
        var column;
        var headerRow= view.rows[0];
    
        //  clear previously selected column
        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            var sortClass= column.__ascending?coherent.Style.kAscendingClass:
                                              coherent.Style.kDescendingClass;
            Element.updateClass(column, [],
                                [coherent.Style.kSelectedClass, sortClass]);
        }
    
        this.__selectedColumn= newSelectedColumn;

        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            var addClass= column.__ascending?coherent.Style.kAscendingClass:
                                            coherent.Style.kDescendingClass;
            var removeClass= column.__ascending?coherent.Style.kDescendingClass:
                                                coherent.Style.kAscendingClass;
            Element.updateClass(column, [coherent.Style.kSelectedClass, addClass],
                                removeClass);
        }
    },
    
    onclick: function(event)
    {
        var view= this.viewElement();
        var sortKey;
        var target= event.target || event.srcElement;
        while (target && !(sortKey=target.getAttribute("sortKey")))
        {
            if (target.parentNode==view)
                return;
            target= target.parentNode;
        }
        if (!target)
            return;

        //  target now references either a TD or TH with a sortKey attribute
        var columnIndex= this.__sortKeyIndex[sortKey];
        //  check for click that changes sort order
        if (this.__selectedColumn==columnIndex)
        {
            target.__ascending = target.__ascending?false:true;
            var ascending= coherent.Style.kAscendingClass;
            var descending= coherent.Style.kDescendingClass;
            if (target.__ascending)
                Element.updateClass(target, ascending, descending);
            else
                Element.updateClass(target, descending, ascending);
        }
        else
            this.setSelectedColumn(columnIndex);
        
        //  update the sort descriptor
        var newSortDescriptor= new coherent.SortDescriptor(sortKey, target.__ascending?true:false);
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue([newSortDescriptor]);
    },
    
    observeSortDescriptorsChange: function(change)
    {
        var sortDescriptors= change.newValue;
        if (!sortDescriptors || !sortDescriptors.length ||
            sortDescriptors.length>1)
        {
            this.setSelectedColumn(-1);
            return;
        }
    
        var columnIndex= this.__sortKeyIndex[sortDescriptors[0].keyPath];
        if ('undefined'===typeof(columnIndex) || null===columnIndex)
            columnIndex=-1;
        this.setSelectedColumn(columnIndex);
    }

});



/** Specialisation of View that handles radio buttons and checkboxes.
 *  
 *  @declare coherent.ToggleButton
 *  @extends coherent.View
 *  
 */
coherent.ToggleButton= Class.create(coherent.View, {

    exposedBindings: ['checked', 'selection'],
    
    __viewClassName__: 'ToggleButton',
    __tagSpec__: ['input[type=checkbox]', 'input[type=radio]'],

    init: function()
    {
        var view= this.viewElement();
        //  fix for bug where clicking on label doesn't update radio button
        Event.observe(view, 'click', this.onclick.bindAsEventListener(this));
    },
    
    onclick: function(event)
    {
        var view= this.viewElement();
        var checked= view.checked;
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
        if (this.bindings.selection)
            this.bindings.selection.setValue(view.value);
    },
    
    observeCheckedChange: function(change, keyPath, context)
    {
        var view= this.viewElement();

        if (this.__initialising && null===change.newValue)
        {
            this.bindings.checked.setValue(view.checked);
            return;
        }

        var newValue= !!change.newValue;
        view.checked= newValue;
        if (this.bindings.selection)
            this.bindings.selection.setValue(view.value);
    },
    
    observeSelectionChange: function(change, keyPath, context)
    {
        var view= this.viewElement();

        if (this.__initialising && null===change.newValue)
        {
            if (view.checked)
                this.bindings.selection.setValue(view.value);
            return;
        }

        var value= view.value || (this.bindings.value?this.bindings.value.value():null);
        
        var checked= (change.newValue===view.value);
        view.checked= checked;
        
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
    }
    
});
