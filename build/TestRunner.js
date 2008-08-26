/*jsl:import Test.js*/
/*jsl:import TestReporter.js*/

var TestRunner = {
    
    _queue: [],
    _timer: 0,
    
    run: function(testGroup, reporter)
    {
        var test= Test._tests[testGroup];
        reporter= reporter || TestReporter;
        
        for (var testName in test)
        {
            if (!/^test[A-Z]/.test(testName))
                continue;
            this._queue.push([testGroup, testName, reporter]);
        }
        
        this.next();
    },

    runAll: function(reporter)
    {
        reporter= reporter || TestReporter;
        for (var testGroup in Test._tests)
            this.run(testGroup, reporter);
        this.next();
    },
    
    next: function()
    {
        if (!this._queue.length)
        {
            TestReporter.complete();
            return;
        }
        
        if (this._timer)
            return;
            
        var args= this._queue.shift();
        var runner= this;
        
        function go()
        {
            runner._timer= 0;
            runner._run.apply(runner, args);
        }
        this._timer= window.setTimeout(go, 10);
    },
    
    _run: function(testGroup, testName, reporter)
    {
        var runner= this;
        var test= Test._tests[testGroup];
        if (!test)
        {
            reporter.failed(testGroup, null, 'could not find test group: "' + testGroup + '"');
            return;
        }
        
        var setup= test['setup'];
        var teardown= test['teardown'];
        
        if (!test[testName])
        {
            reporter.failed(testGroup, testName, 'could not find test function: "' + testName + '"');
            return;
        }
        
        function Scope()
        {
        }
        Scope.prototype= test;
        
        reporter.beginTest(testGroup, testName);
    
        var scope= new Scope();
        var helper= new TestHelper(scope, reporter, testGroup, testName);
        helper.ontestcomplete= function()
        {
            runner.next();
        }
        
        try
        {
            if (setup)
                setup.call(scope);
        }
        catch (e)
        {
            reporter.exceptionInSetup(testGroup, testName, e);
            return;
        }
        
        try
        {
            var result= scope[testName](helper);
            
            if (result===helper.__ASYNC_MARKER__)
            {
                helper.teardown= teardown;
                return;
            }
            
            reporter.passed(testGroup, testName);
        }
        catch (e)
        {
            if ('AssertionError'!=e.name)
                reporter.uncaughtException(testGroup, testName, e);
        }
        
        try
        {
            if (teardown)
                teardown.call(scope);
        }
        catch (e)
        {
            reporter.exceptionInTeardown(testGroup, testName, e);
        }
        
        reporter.endTest(testGroup, testName);
        this.next();
    }

};
