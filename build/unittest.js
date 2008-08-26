load('../build/assert.js');

var testFnRegex= /^test[A-Z]\w*$/;
var inputFolder;

function absoluteFilePath(filename)
{
    var file= new File(filename);
    return String(file);
}

function findTests(inputFileSpec)
{
    var input= new File(inputFileSpec);

    if (input.isFile)
        return [input.toString()];
    else
        return input.list(/\.js$/i);
}

function loadTestScript(fileSpec)
{
    var scope= {
        require: function(modulespec)
        {
            load.call(this, modulespec);
        }
    };
    
    load.call(scope, fileSpec);
    load.call(scope, '../build/assert.js');
    return scope;
}

function runTests(fileSpec, count)
{
    var test;

    count= count || {
        passed: 0,
        run: 0,
        failed: 0
    };
    
    try
    {
        test= loadTestScript(fileSpec);
    }
    catch (e)
    {
        print(absoluteFilePath(e.fileName) + ':' + e.lineNumber +
              ': uncaught exception: ' + e.name +
              (e.message?(': '+e.message):'') );
              
        var stack= parseStack(e);
        var stacklen= stack.length;
        for (var i=1; i<stacklen; ++i)
            print('  ' + absoluteFilePath(stack[i].file) +
                  ':' + stack[i].lineNumber + 
                  ': ' + stack[i].fn);
            
        count.failed++;
        return count;
    }
    
    for (var t in test)
    {
        if ('function'==typeof(test[t]) && t.match(testFnRegex))
        {
            try
            {
                count.run++;
                if ('setup' in test)
                    test.setup();
                test[t]();
                if ('teardown' in test)
                    test.teardown();
                count.passed++;
            }
            catch (e if 'AssertionError'==e.name)
            {
                count.failed++;
                print(absoluteFilePath(e.assertFileName) +
                      ':' + e.assertLineNumber + ': ' + e.message);
            }
            catch (e)
            {
                count.failed++;
                print(absoluteFilePath(e.fileName) + ':' + e.lineNumber +
                      ': uncaught exception: ' + e.name +
                      (e.message?(': '+e.message):'') );
            }
        }
    }
    
    return count;
}

function runAllTests(inputSpec)
{
    var testFiles= findTests(inputSpec);
    var count= undefined;
    
    var i;
    var len= testFiles.length;
    
    for (i=0; i<len; ++i)
        count= runTests(testFiles[i], count);
        
    print(count.run + ' tests  ' + count.passed + ' passed  ' + count.failed + ' failed');
    
    return count.failed ? true : false;
}

var failed= runAllTests(arguments[0]);
