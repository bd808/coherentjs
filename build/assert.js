function __src(v)
{
    if (v instanceof Array || 'object'!==typeof(v))
        return uneval(v).replace(/\(void 0\)/g, 'undefined');
    var s= [];
    var p;
    for (p in v)
        s.push(p + '=' + uneval(v[p]).replace(/\(void 0\)/g, 'undefined'));
    return s.length ? ("{ " + s.join(", ") + " }") : "{}";
}

function AssertionError(msg)
{
    var e= new Error(msg||"");
    e.name= 'AssertionError';
    var parts= parseStack(e);
    var assert= findAssert(e, parts);
    if (assert)
    {
        e.assertLineNumber= assert.lineNumber;
        e.assertFileName= assert.file;
    }
    return e;
}

function parseStack(e)
{
    var parts= [];
    
    function parseLine(line)
    {
        var match= line.match(/([^@]*)@([^:]*):(.*)$/);
        if (!match)
            return;
            
        parts.push( {
            fn: match[1],
            file: match[2],
            lineNumber: match[3]
        } );
    }
    
    e.stack.replace(/\(void 0\)/g, 'undefined').split('\n').forEach(parseLine);
    return parts;
}

function findAssert(e, parts)
{
    var target= 'AssertionError(' + uneval(e.message) + ')';
    var i;
    var len= parts.length;
    
    for (i=0; i<len; ++i)
        if (parts[i].fn==target)
            return parts[i+2];
    return null;
}

function compareObjects(o1, o2)
{
    var k;
    var v;
    
    function sorter(l, r)
    {
        if (l[0]<r[0])
            return -1;
        else if (l[0]>r[0])
            return 1;
        else
            return 0;
    }
    
    var o1keys= [[k,o1[k]] for (k in o1)].sort(sorter);
    var o2keys= [[k,o2[k]] for (k in o2)].sort(sorter);
    
    if (o1keys.length!=o2keys.length)
        return false;
    
    var i;
    for (i=0; i<o1keys.length; ++i)
        if (o1keys[i][0]!==o2keys[i][0] ||
            o1keys[i][1]!==o2keys[i][1])
            return false;
    return true;
}
    
function compareArrays(a1, a2)
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
}

function assertEqual(value, expected, msg)
{
    if (value instanceof Array && expected instanceof Array)
    {
        if (compareArrays(value, expected))
            return;
    }
    else if (value===expected)
        return;

    throw new AssertionError(msg||('failed: ' + __src(value) + '===' +
                                   __src(expected)));
}

function assertNotEqual(value, expected, msg)
{
    if (value!==expected)
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '!==' +
                                   __src(expected)));
}

function assertTrue(value, msg)
{
    if (true===value)
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '===' +
                                   __src(true)));
}

function assertFalse(value, msg)
{
    if (false===value)
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '===' +
                                   __src(false)));
}

function assertNull(value, msg)
{
    if (null===value)
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '===' +
                                   __src(null)));
}

function assertNotNull(value, msg)
{
    if (null!==value)
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '!==' +
                                   __src(null)));
}

function assertUndefined(value, msg)
{
    if ('undefined'===typeof(value))
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '===' +
                                   'undefined'));
}

function assertNotUndefined(value, msg)
{
    if ('undefined'!==typeof(value))
        return;
    throw new AssertionError(msg||('failed: ' + __src(value) + '!==' +
                                   'undefined'));
}

function fail(msg)
{
    throw new AssertionError(msg||"failed");
}

