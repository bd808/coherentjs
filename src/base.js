if ("undefined"!==typeof(coherent))
    throw new Error("Library module (coherent) already defined");

var coherent= {};




/** There might be cases where the bind method hasn't already been defined.
 *  This should mimic the Prototype library's bind method as closely as possible.
 */
if (!Function.prototype.bind)
    Function.prototype.bind= function( obj )
    {
        var self= this;
        if (1==arguments.length)
            return function() { return self.apply( obj, arguments ); };

        function toArray(a) {
            var array=new Array(a.length);
            for (var i=0, l=a.length; i<l; ++i)
                array[i]= a[i];
            return array;
        }
        
        var args= toArray(arguments);
        args.shift();

        return function() { return self.apply( obj, args.concat(toArray(arguments)) ); };
    }
    
    
    
    
/** Make title case version of string.
    @param name original string value
    @returns original string with the first character capitalised.
 **/
String.prototype.titleCase= function()
{
    return this.charAt(0).toUpperCase() + this.substr(1);
}

/** Safari doesn't define the localeCompare. This probably will be slow.
 **/
if (!String.prototype.localeCompare)
    String.prototype.localeCompare = function( other )
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
RegExp.escape = function(text) {
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
Object.applyDefaults = function(obj, defaults) {
    obj= obj||{};
    
    if (!defaults)
        return obj;

    for (var p in defaults) {
        if (p in obj)
            continue;
        obj[p]= defaults[p];
    }
    return obj;
}
if (!Object.extend)
    Object.extend= Object.applyDefaults;



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
            
        default:
            throw new InvalidArgumentError( "Unknown type for comparison" );
    }
    //  Default comparison is lexigraphical of string values.
    return String(v1).localeCompare(String(v2));
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
        if (-1==result.indexOf(e)) {
            result[count]= e;
            ++count;
        }
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
Array.prototype.compare= function( a )
{
    var lengthDifference= this.length - a.length;
    if (0!==lengthDifference)
        return lengthDifference;
    var i;
    var len;
    var v;
    
    for (i=0, len=this.length; i<len; ++i)
    {
        v= coherent.compareValues( this[i], a[i] );
        if (0!==v)
            return v;
    }
    
    return 0;
}

// Mozilla 1.8 & Safari 420+ has support for indexOf, lastIndexOf, forEach, filter, map, some, every
// http://developer-test.mozilla.org/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, fromIndex) {
	    console.log("correct");
		if (undefined===fromIndex) {
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
		if (undefined===fromIndex) {
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




/** An initialiser for a set-like object. The arguments passed to the
    initialiser function determine the values in the set.
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
    differences between browsers, except of course that MSIE simply doesn't
    support custom error types very well. This function allows you to have a
    custom initialiser for error types simply by defining a function with the
    same name as the error type.
    
    The return value of this function is the constructor for the new error type.
    If there's no custom constructor, this return value should be assigned to a
    global variable with the same name as the error type. That way new instances
    of the error can be created.

    @param errorName    the name of the error subclass -- also the name of the
                        initialiser function
    @returns a function that is the constructor for the new error type.
 **/
coherent.defineError= function( errorName )
{
    constructor= function( message )
    {
        this.message= message;
    }
    
    constructor.prototype= new Error;
    constructor.prototype.constructor= constructor;
    constructor.prototype.name= errorName;
    return constructor;
}

var InvalidArgumentError= coherent.defineError( "InvalidArgumentError" );
