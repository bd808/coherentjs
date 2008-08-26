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

require("../src/base.js");

function testTitleCase()
{
    assertEqual( 'fooBar'.titleCase(), "FooBar" );
    
    //  passing anything but a string to titleCase should throw some sort of
    //  exception, which exception depends on your JavaScript engine.
    //  @TODO: 0 seems to work OK. I'm not certain whether this should be fixed.
    try
    {
        (50).titleCase();
        fail( "Shouldn't have been able to complete titleCase with non-string values" );
    }
    catch (e)
    {
        //  I was expecting an exception.
    }
}

function testClone()
{
    var obj= { foo: 1, bar: "baz" };
    var c= Object.clone(obj);
    
    assertNotEqual( obj, c );
    assertEqual( obj.foo, c.foo );
    assertEqual( obj.bar, c.bar );
}

function testRealTypeOf()
{
    function FooBar()
    {
    }

    assertEqual( "number", coherent.typeOf(5) );
    assertEqual( "string", coherent.typeOf("foo") );
    assertEqual( "regex", coherent.typeOf(/foo/) );
    assertEqual( "string", coherent.typeOf(new String("foo")) );
    assertEqual( "date", coherent.typeOf(new Date()) );
    assertEqual( "function", coherent.typeOf(FooBar) );
    assertEqual( "array", coherent.typeOf([]) );
    assertEqual( "undefined", coherent.typeOf(undefined) );
    assertEqual( "object", coherent.typeOf(null) );
    assertEqual( "boolean", coherent.typeOf(true) );
    assertEqual( "boolean", coherent.typeOf(false) );
    assertEqual( "object", coherent.typeOf({}) );
    assertEqual( "FooBar", coherent.typeOf(new FooBar()) );
}

function testCompareValues()
{
    assertEqual( -1, coherent.compareValues(1,2) );
    assertEqual( 1, coherent.compareValues(2,1) );
    assertEqual( 0, coherent.compareValues( "foo", "foo" ) );
    assertNotEqual( 0, coherent.compareValues( "foo", "bar" ) );
    assertEqual( 0, coherent.compareValues( "1", 1 ) );
    assertNotEqual( 0, coherent.compareValues( true, false ) );
    assertEqual( 0, coherent.compareValues( [1,2,3], [1,2,3] ) );
    assertEqual( -1, coherent.compareValues( [1,2], [1,2,3] ) );
    assertEqual( 1, coherent.compareValues( [1,2,3], [1,2] ) );
    assertEqual( -1, coherent.compareValues( [1,2], [1,4] ) );
}

function testArrayDistinct()
{
    assertEqual( [1,2], [1,2].distinct() );
    assertEqual( [1,2], [1,2,1].distinct() );
    assertEqual( [1], [1,1,1].distinct() );
}

function testSet()
{
    var s= new Set( "abc", "foo", "bar", 1 );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function testSetArray()
{
    var s= new Set( ["abc", "foo", "bar", 1] );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function testSetFn()
{
    var s= Set( "abc", "foo", "bar", 1 );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function testSetFnArray()
{
    var s= Set( ["abc", "foo", "bar", 1] );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function test$S()
{
    var s= $S( "abc", "foo", "bar", 1 );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function test$SArray()
{
    var s= $S( ["abc", "foo", "bar", 1] );
    assertTrue( 'abc' in s );
    assertFalse( 'zebra' in s );
    assertTrue( 'foo' in s );
    assertTrue( 'bar' in s );
    assertTrue( 1 in s );
    assertFalse( 2 in s );
}

function testSetUnion()
{
    var s1= $S( "abc", "123" );
    var s2= $S( "xyz", "234" );
    
    var s3= Set.union( s1, s2 );
    assertTrue( "abc" in s3 );
    assertTrue( "123" in s3 );
    assertTrue( "xyz" in s3 );
    assertTrue( "234" in s3 );
    assertFalse( "qwe" in s3 );
}

function testSetAdd()
{
    var s= $S( "abc", "123" );
    assertFalse( "xyz" in s );
    Set.add( s, "xyz" );
    assertTrue( "xyz" in s );
}

function testSetToArray()
{
    var s= $S( "abc", "123", "xyz" );
    var a= Set.toArray(s);

    //  I don't want to compare the array against a constant array, because
    //  there's no assertion that the array will be in any order.
    assertTrue( -1!=a.indexOf('abc') );
    assertTrue( -1!=a.indexOf('123') );
    assertTrue( -1!=a.indexOf('xyz') );
}
