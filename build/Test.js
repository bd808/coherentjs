function TestHelper(scope, report, test, testName)
{
    this.scope= scope;
    this.report= report;
    this.test= test;
    this.testName= testName;
    this._async= false;    
}
TestHelper.prototype= {

    __ASYNC_MARKER__: 'async_marker',
    
    stringFromValue: function(v)
    {
        return String(v);
    },
    
    compareArrays: function(a1, a2)
    {
        if (a1 instanceof Array && a2 instanceof Array &&
            a1.length==a2.length)
        {
            var len=a1.length;
            var i;

            for (i=0; i<len; ++i)
                if (a1[i]!==a2[i])
                    return false;
            return true;
        }

        return false;
    },
    
    passed: function()
    {
        this.report.passed(this.test, this.testName);
        this.finishAsync();
    },
    
    clearTimer: function()
    {
        if (!this._timer)
            return;
        window.clearTimeout(this._timer);
        this._timer= 0;
    },
    
    finishAsync: function()
    {
        if (!this._async)
            return;
            
        this.clearTimer();
        try
        {
            if (this.teardown)
                this.teardown.call(this.scope);
        }
        catch (e)
        {
            this.report.exceptionInTeardown(this.test, this.testName, e);
        }
        
        this.report.endTest(this.test, this.testName);
        if (this.ontestcomplete)
            this.ontestcomplete();
    },
    
    /** Create an asynchronous handler for this method. If the test
     *  doesn't complete before the timeout expires, then the test
     *  fails.
     */
    async: function(timeout)
    {
        var helper= this;
        
        function timeoutFn()
        {
            helper.report.timeoutExpired(helper.test, helper.testName, timeout);
            helper.finishAsync();
        }
        
        this._timer= window.setTimeout(timeoutFn, timeout);
        this._async= true;
        return this.__ASYNC_MARKER__;
    },

    assert: function(value, msg)
    {
        this.assertTrue(value, msg);
    },
    
    assertEqual: function(value, expected, msg)
    {
        if (value instanceof Array && expected instanceof Array)
        {
            if (this.compareArrays(value, expected))
                return;
        }
        else if (value===expected)
            return;

        this.fail(msg||('failed: ' + this.stringFromValue(value) + '===' +
                        this.stringFromValue(expected)));
    },

    assertNotEqual: function(value, expected, msg)
    {
        if (value!==expected)
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '!==' +
                        this.stringFromValue(expected)));
    },

    assertTrue: function(value, msg)
    {
        if (true===value)
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '===' +
                        this.stringFromValue(true)));
    },

    assertFalse: function(value, msg)
    {
        if (false===value)
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '===' +
                        this.stringFromValue(false)));
    },

    assertNull: function(value, msg)
    {
        if (null===value)
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '===' +
                        this.stringFromValue(null)));
    },

    assertNotNull: function(value, msg)
    {
        if (null!==value)
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '!==' +
                        this.stringFromValue(null)));
    },

    assertUndefined: function(value, msg)
    {
        if ('undefined'===typeof(value))
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '===' +
                        'undefined'));
    },

    assertNotUndefined: function(value, msg)
    {
        if ('undefined'!==typeof(value))
            return;
        this.fail(msg||('failed: ' + this.stringFromValue(value) + '!==' +
                        'undefined'));
    },

    fail: function(msg)
    {
        msg= msg||'failed';
        this.report.failed(this.test, this.testName, msg);
        
        this.finishAsync();
        
        var error= new Error(msg);
        error.name= 'AssertionError';
        throw error;
    }

};


var Test= {

    /** Register a group of tests. This might do some clever processing of
     *  each test function.
     */
    create: function(name, decl)
    {
        this._tests[name]= decl;
    },
    
    _tests: {}

};
