/*jsl:import ../build/Test.js*/

Test.create('foo', {

    require: ['../src/base.js', '../src/kvo.js'],
    
    setup: function()
    {
    },
    
    teardown: function()
    {
    },
    
    testSomething: function(t)
    {
        t.assert(1==1);
        t.assertTrue(1==1);
        t.assertFalse(1==2);
    },
    
    testAsyncPass: function(t)
    {
        function later()
        {
            t.passed('hooray!');
        }
        
        window.setTimeout(later, 1000);
        return t.async(2000);
    },

    testAsyncFailure: function(t)
    {
        function later()
        {
            t.fail('hooray!');
        }
        
        window.setTimeout(later, 1000);
        return t.async(2000);
    },
    
    testAsyncNoFinish: function(t)
    {
        return t.async(2000);
    },

    testFailure: function(t)
    {
        t.assert(false);
    },
    
    testUncaughtException: function(t)
    {
        throw new Error('abc');
    }
});
