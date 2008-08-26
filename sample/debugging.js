/**
    Copyright © 2005, 2006, 2007 Jeff Watkins <http://metrocat.org/>
    
    Except where otherwise noted, This software is licensed under the
    Creative Commons Attribution-NonCommercial-ShareAlike 2.5 License.
    To view a copy of this license, visit:
    
        http://creativecommons.org/licenses/by-nc-sa/2.5/
        
    or send a letter to:
    
        Creative Commons
        543 Howard Street, 5th Floor
        San Francisco, California, 94105, USA.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-
    INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 **/

/**	generate a JavaScript literal version of an object.

	@param value	the thing that should be converted to a literal value
	@returns a string representation of the value which is valid JavaScript
 **/
function toLiteral( value, json )
{
	if (null===value)
		return "null";
	
	if (undefined===value)
		return "undefined";
 	
 	if (value instanceof Function)
	{
		var info= functionInfo( value );
		var args= info.argumentNames.join(", ");
		if (args)
			args= " " + args + " ";
		var str= "function " + info.name + "(" + args + ") {...}";
		return str;
	}
	
	var type= typeof(value);
	
	if ('string' == type)
	{
		return '"' + value + '"';
	}
	
	if ('number' == type ||
		'boolean' == type)
	{
		return value.toString();
	}

	if (value instanceof Array)
	{
		return dumpArray( value, json );
	}
	
	if (value instanceof Object)
	{
		return dumpObject( value, json );
	}
	
	return value;
}
toLiteral.propertiesToIgnore= /^__.*/;

/**	Create a string version of an object.
	@param obj	the object to translate into a string
	@returns a JavaScript literal representation of the object
 **/
function dumpObject( obj, json )
{
	var p;
	var s= "";
	var value;
	
	for (p in obj)
	{
		if (toLiteral.propertiesToIgnore.test(p))
			continue;
			
		value= obj[p];

		if ('function' == typeof(value))
			continue;
			
		if (s)
			s+= ", ";
		if (json)
			p='"' + p + '"';
			
		s+= p + ": " + toLiteral(value);
	}
	
	if (s)
		return "{ " + s + " }";
	else
		return "{}";
}

/** Format an object as a JSON literal.
    @param obj the object to format
 **/
function toJsonLiteral( obj )
{
    return dumpObject( obj, true );
}

/**	Create a literal string version of an array.
	@param array	the array object to translate into a string
	@returns a JavaScript literal representation of the array
 **/
function dumpArray( array, json )
{
	var s= "";
	var value;
	var index;
	
	for (index=0; index<array.length; ++index)
	{
		if (s)
			s+= ", ";
		
		value= array[index];
		s+= toLiteral(value, json);
	}
	
	if (s)
		return "[ " + s + " ]";
	else
		return "[]";
}

/**	Declare a regular expression that will match the name and arguments of a
	function declaration.
 **/
var functionInfoRegex= /function\s*(\w*)?\s*\(([^\)]*)\)/;
var nativeFunctionRegex= /(native code)|(Internal Function)/i;

/**	Pull out the name and arguments of a function.
	@param fn	the function
	@returns an object containing the name and argument names of the function
 **/
function functionInfo( fn )
{
	var callingFnText= fn.toString();

	var matches= callingFnText.match( functionInfoRegex );
	if (!matches)
		return { name: "<<internal function>>", argumentNames: [] };
	
	return	{
				name: matches[1]||"anonymous",
				argumentNames: matches[2].replace( /\s*/g,"").split(",")
			};
}

/** Trace helper
 **/
function trace( string, callingFn )
{
    callingFn= callingFn || trace.caller;
    var callingFnName;
	var node;
	
	if (undefined===string || null===string || ""===string)
	{
		println();
		return;
	}
	
    if (callingFn)
    	callingFnName= functionInfo( callingFn ).name;
    else
    	callingFnName= "global";

    var indent= "\n";
    if (callingFnName)
        indent+= " ".repeat( callingFnName.length + 2 );
	var str= string.toString().replace( /\n/g, indent );

	println( callingFnName + ": " + str );	
}

function traceExpr( string )
{
    var val= eval(string);
    trace( string + "=" + val, traceExpr.caller );
}

if ('undefined'==typeof(println))
    println= function(string)
    {
        string= string || "";
        if (window.console)
            window.console.log( string );
    	var traceElement= document.getElementById( "trace" );
    	if (!traceElement)
    		return;
        var node= document.createTextNode( string + "\n" );
        traceElement.appendChild( node );
    }

String.prototype.repeat= function( count )
{
	var result="";
	var str= this.toString();
	
	while (count--)
		result+= str;
	return result;
}

/**	Display all arguments for a function.
 **/
function traceArgs( args )
{
	if (!args)
		args= arguments.caller.arguments;
	
	var callerInfo= functionInfo( args.callee );
	var str= callerInfo.name + "( ";
	var indent= " ".repeat( str.length );
	var index;
	var argCount= callerInfo.argumentNames.length;
	
	if (argCount < args.length)
		argCount= args.length;

	for (index=0; index<argCount; ++index)
	{
		if (index)
			str+= ",\n" + indent;
		if (callerInfo.argumentNames.length>index)
			str+= callerInfo.argumentNames[index] + " = ";
		str+= toLiteral(args[index]);
	}
	
	trace( str + " )" );
}
