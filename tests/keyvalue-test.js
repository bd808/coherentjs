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
/*jsl:import ../src/model.js*/

require("../src/base.js");
require("../src/oop.js");
require("../src/kvo.js");
require("../src/model.js");
require("../sample/debugging.js");

var kvo;

function setup()
{
    kvo= new coherent.KVO();
    kvo.foo= "bar";
    kvo.__name= "zebra";
    coherent.registerModelWithName( kvo, "kvo" );
    
    kvo.name= function()
    {
        return this.__name;
    }
    kvo.setName= function( name )
    {
        // this.willChangeValueForKey( "name" );
        this.__name= name;
        // this.didChangeValueForKey( "name" );
    }
    kvo.immutable= function()
    {
        return this.__immutable;
    }
}

function testValueForKey()
{
    assertEqual( "bar", kvo.valueForKey('foo') );
    assertEqual( "zebra", kvo.valueForKey('name') );
    assertNull( kvo.valueForKey('zebra') );
}

function testSetValueForKey()
{
    kvo.setValueForKey( 5, "foo" );
    assertEqual( 5, kvo.foo );
}

function testObserveChange()
{
    var observer= {};
    var called= false;
    
    function observeChange(change, keyPath, context)
    {
        called= true;
    }
    
    kvo.addObserverForKeyPath(observer, observeChange, 'name');
    kvo.setName('bob');
    assertTrue(called);
}

function testObserveSubKeyTypeChange()
{
    var name= {
        first: 'john',
        last: 'doe'
    };
    
    var observer= {};
    var called= false;
    
    function observeChange(change, keyPath, context)
    {
        called= true;
    }
    
    kvo.addObserverForKeyPath(observer, observeChange, 'name.first');
    kvo.setName(coherent.KVO.adapt(name));
    
    name.setValueForKey('jane', 'first');
    assertTrue(called);
}

function testObserveSubKeyChangePriorToSwizzle()
{
    var name= {
        first: 'john',
        last: 'doe'
    };
    
    var observer= {};
    var called= false;
    
    function observeChange(change, keyPath, context)
    {
        called= true;
    }
    
    kvo.setName(coherent.KVO.adapt(name));
    kvo.addObserverForKeyPath(observer, observeChange, 'name.first');
    
    name.setValueForKey('jane', 'first');
    assertTrue(called);
}

function testInitBug()
{
    var observeCalled= false;
    var observeValue= undefined;
    var observer= {};
    
    function observe( change, keyPath, context )
    {
        observeCalled= true;
        observeValue= change.newValue;
    }

    kvo.willChangeValueForKey( "immutable" );
    kvo.__immutable= { foo: "zebra", bar: "baz" };
    coherent.KVO.adapt(kvo.__immutable);
    kvo.didChangeValueForKey( "immutable" );
    
    kvo.addObserverForKeyPath( observer, observe, "immutable.foo" );
    kvo.setValueForKeyPath( "horse", "immutable.foo" );

    assertTrue( observeCalled );
    assertEqual( observeValue, 'horse' );
}

function testBindingFromString()
{
    var binding= coherent.Binding.bindingFromString( "kvo.foo" );
    assertNotNull( binding );
    assertEqual( kvo.foo, binding.value() );
    binding.setValue( "goober" );
    assertEqual( kvo.foo, "goober" );
    assertEqual( binding.value(), "goober" );
    
    var observeCalled= false;
    var observeValue= undefined;
    
    function observe( change, keyPath, context )
    {
        observeCalled= true;
        observeValue= change.newValue;
    }
    
    binding.observerFn= observe;
    kvo.setValueForKey( "zebra", "foo" );
    assertTrue( observeCalled );
    assertEqual( observeValue, 'zebra' );
    
    //  reset observe
    observeCalled= false;
    kvo.setValueForKey( "zebra", "foo" );
    assertFalse( observeCalled );
}

function testAndBindingFromString()
{
    kvo.left= true;
    kvo.right= false;
    
    var binding= coherent.Binding.bindingFromString( "kvo.left && kvo.right" );
    assertNotNull( binding );
    assertEqual( kvo.left, binding.left.value() );
    assertEqual( kvo.right, binding.right.value() );

    assertEqual( (kvo.left && kvo.right), binding.value() );
    try
    {
        binding.setValue( "goober" );
        fail("setting value on compound binding should fail");
    }
    catch (e)
    {
    }
    
    var observeCalled= false;
    var observeValue= undefined;
    
    function observe( change, keyPath, context )
    {
        observeCalled= true;
        observeValue= change.newValue;
    }
    
    binding.observerFn= observe;
    kvo.setValueForKey( true, "right" );
    assertTrue( observeCalled );
    assertEqual( observeValue, true );
    
    //  reset observe
    observeCalled= false;
    kvo.setValueForKey( true, "left" );
    assertFalse(observeCalled);
}

function testOrBindingFromString()
{
    kvo.left= true;
    kvo.right= false;
    
    var binding= coherent.Binding.bindingFromString( "kvo.left || kvo.right" );
    assertNotNull( binding );
    assertEqual( kvo.left, binding.left.value() );
    assertEqual( kvo.right, binding.right.value() );

    assertEqual((kvo.left || kvo.right), binding.value());
    try
    {
        binding.setValue( "goober" );
        fail( "setting value on compound binding should fail" );
    }
    catch (e)
    {
    }
    
    var observeCalled= false;
    var observeValue= undefined;
    
    function observe( change, keyPath, context )
    {
        observeCalled= true;
        observeValue= change.newValue;
    }
    
    binding.observerFn= observe;
    kvo.setValueForKey( false, "left" );
    assertTrue( observeCalled );
    assertEqual( observeValue, false );
    
    //  reset observe
    observeCalled= false;
    kvo.setValueForKey( false, "right" );
    assertFalse(observeCalled);
}
