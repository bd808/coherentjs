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

/*jsl:import ../build/assert.js*/
/*jsl:import ../src/base.js*/
/*jsl:import ../src/kvo.js*/

require("../src/base.js");
require("../src/oop.js");
require("../src/kvo.js");

function findMethod( obj, fn )
{
    var p;
    for (p in obj)
        if (obj[p]===fn)
            return p;
    return undefined;
}

function concatTest( array, depth )
{
    if (!depth)
        return;
    concatTest( array.concat( {} ), depth-1 );
}

function trimTest( array, depth )
{
    if (!depth)
        return;
    var len= array.length;
    array.push( {} );
    trimTest( array, depth-1 );
    array.length= len;
}

function testConcatTiming()
{
    var start= new Date();
    var i;
    for (i=0; i<1000; ++i)
        concatTest( [], 10 );
    var end= new Date();
    print( "concat test: " + (end-start)/1000 + " seconds" );
}

function testTrimTiming()
{
    var start= new Date();
    var i;
    for (i=0; i<1000; ++i)
        trimTest( [], 10 );
    var end= new Date();
    print( "trim test: " + (end-start)/1000 + " seconds" );
}

function testCallee()
{
    print( findMethod( this, arguments.callee ) );
}

function testTrim()
{
    var a= [1,2,3];
    a.length= 2;
    assertUndefined(a[2]);
    a.push(4);
    assertEqual(4, a[2]);
}

function testArrayTiming()
{
    var a= [1,2,3,4,5,6];
    var start= new Date();
    var i;
    for (i=0; i<10000; ++i) {
        a.indexOf(4);
    }
    var end= new Date();
    print( "index of test: " + (end-start)/1000 + " seconds" );
}

function testSetTiming()
{
    var s= new Set(1,2,3,4,5,6);
    var start= new Date();
    var i;
    for (i=0; i<10000; ++i) {
        (4 in s);
    }
    var end= new Date();
    print( "set timing test: " + (end-start)/1000 + " seconds" );
}

function testTypeOfTiming()
{
    var start= new Date();
    var i;
    for (i=0; i<5000; ++i) {
        ("string"==typeof("Foobar"));
    }
    var end= new Date();
    print( "typeof test: " + (end-start)/1000 + " seconds" );
}

function testRealTypeOfTiming()
{
    var start= new Date();
    var i;
    for (i=0; i<5000; ++i) {
        ("string"==coherent.typeOf("Foobar"));
    }
    
    var end= new Date();
    print( "coherent.typeOf test: " + (end-start)/1000 + " seconds" );
}

function testInstanceOfTiming()
{
    var start= new Date();
    var i;
    for (i=0; i<5000; ++i) {
        ("Foobar" instanceof String);
    }
    
    var end= new Date();
    print( "instanceof test: " + (end-start)/1000 + " seconds" );
}

function testPushReassign()
{
    var oldPush= Array.prototype.push;
    var pushed= false;
    Array.prototype.push= function()
    {
        pushed= true;
        oldPush.apply(this, arguments);
    }
    var a= [1,2];
    a.push(4);
    assertTrue(pushed);
}

function testNumberMethod()
{
    Number.prototype.valueForKey= function()
    {
        return null;
    }

    assertEqual(null, (4).valueForKey('bob'));
    
    assertEqual('4', (4).toString());
}
