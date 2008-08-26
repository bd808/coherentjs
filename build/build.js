var files= [];
var startFolder= File.currentDir;
var outputFile= File.out;
var bootstrapOutputFile= null;
var bootstrapTemplate= null;

var packageRegex= /dojo\.require\(["'](apple\..*)["']\)/;
var filterRegex;

var probedFiles={};
var orderedFiles= [];

function relativePath(f)
{
    var start= startFolder.toString();
    var startLen= start.length;
    
    f= String(f);
    if (start==f.substr(0, startLen))
    {
        f= f.substring(startLen);
        if ('/'==f.charAt(0))
            f= f.substring(1);
    }

    return f;
}
    
function fileFromDojoPackage(packageName)
{
    packageName= packageName.replace(/\*$/, '__package__');
    return startFolder[(packageName.replace(/\./g, '/') + '.js')];
}

function fileFromFileName(packageName)
{
    return startFolder[packageName];
}

var fileFromPackage= fileFromFileName;



function findFileRequirements(file)
{
    if (file in probedFiles)
        return;

    probedFiles[file]= true;
    try
    {
        file.open('read');
        var lines= file.readAll();
        var match;
        file.close();
    }
    catch (e)
    {
        print('failed to open file: ' + file);
        return;
    }
    
    for each (var l in lines)
    {
        match= l.match(packageRegex);
        if (!match)
            continue;
        findFileRequirements(fileFromPackage(match[1]));
    }
    
    orderedFiles.push(file);
}

function findAllFiles(baseFolder)
{
    var files=[];
    var folders= [new File(String(baseFolder))];
    var folder;
    var i;
    var len;
    
    while (folders.length)
    {
        folder= folders.shift();

        //  collect all the JS files
        files.push.apply(files, folder.list(/\.js$/));

        var contents= folder.list();
        for (i=0, len=contents.length; i<len; ++i)
        {
            if (contents[i].isDirectory)
                folders.push(contents[i]);
        }
    }

    return files;
}

function appendFile(file)
{
    try
    {
        file.open('read');
        outputFile.writeln('\n\n/* file: ' + relativePath(file) + ' */\n');
        var lines= file.readAll().join('\n');
        lines= lines.replace(filterRegex, '');
        outputFile.writeln(lines);
    }
    finally
    {
        file.close();
    }
}

function generateBootstrapFile(files)
{
    var filename= bootstrapOutputFile.name;
    var template= 'loadScript("@");';
    
    var bootstrapFiles= [];
    
    for each (var f in files)
    {
        if (f.name==filename)
            continue;
        bootstrapFiles.push(template.replace('@', relativePath(f)));
    }
    
    var args= {
        BOOTSTRAP: relativePath(filename),
        'BOOTSTRAP-FILES': bootstrapFiles.join('\n')
    };
    
    function replace(original, ws, key)
    {
        if (ws)
            return ws + (args[key]||'').split('\n').join(ws);
        
        return args[key]||'';
    }
    
    var bootstrapText= bootstrapTemplate.replace(/(\n[\t ]*)?@([^@]*)@/g, replace);
    if (bootstrapText)
        bootstrapOutputFile.writeln(bootstrapText);
    bootstrapOutputFile.close();
}

var CommandLineArgs= {
    'o': function(args)
    {
        outputFile= new File(args.shift());
        if (outputFile.exists)
            outputFile.remove();
        outputFile.open('write,create,truncate');
    },

    'jsl': function(args)
    {
        packageRegex= /\/\*jsl:import ([^\*]*)\*\//;
        filterRegex= /\/\*jsl:import ([^\*]*)\*\//g;
    },
    
    'apple': function(args)
    {
        packageRegex= /dojo\.require\(["'](apple\..*)["']\)/;
        filterRegex= /dojo\.require\(["'](apple\..*)["']\)/g;
    },
    
    'bootstrap': function(args)
    {
        bootstrapOutputFile= new File(args.shift());
        if (bootstrapOutputFile.exists)
            bootstrapOutputFile.remove();
        bootstrapOutputFile.open('write,create,truncate');
    },
    
    'bootstrap-template': function(args)
    {
        var a= args.shift();
        var f= new File(a);
        if (!f.exists)
        {
            print("Bootstrap template file not found:" + a);
            return false;
        }
        f.open('read');
        bootstrapTemplate= f.readAll().join('\n');
        f.close();
    }
};

function parseCommandLine(args)
{
    var a;
    
    while (args.length)
    {
        a= args.shift();
        if ('-'===a.charAt(0))
        {
            a= a.slice(1);
            if (a in CommandLineArgs && false===CommandLineArgs[a](args))
                return false;
        }
        else
        {
            var f= new File(a);
            if (!f.exists)
            {
                print('File not found: ' + a);
                return false;
            }
            files.push(new File(a));
        }
    }
    
    return true;
}

function main(args)
{
    if (!parseCommandLine(args))
        return;

    if (!files.length)
    {
        print('No files specified');
        return;
    }
    
    startFolder= files[0].parent;
    files= files.concat(findAllFiles(startFolder));

    for each (var f in files)
        findFileRequirements(f);

    for each (var f in orderedFiles)
        appendFile(f);

    if (bootstrapTemplate && bootstrapOutputFile)
        generateBootstrapFile(orderedFiles);
    
    outputFile.close();    
}

main(arguments);