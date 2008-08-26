(function() {
    var baseUrl= findScriptBaseUrl();

    function findScriptBaseUrl()
    {
        var regex= /@BOOTSTRAP@$/i;
        var scripts= document.getElementsByTagName("head")[0].getElementsByTagName("script");
        var i;
        var path;
        var s;
        var len= scripts.length;
    
        for (i=0; i<len; ++i)
        {
            s= scripts[i];
            if (s.src && s.src.match(regex))
            {
                path= s.src.replace(regex, '');
                break;
            }
        }
        
        return path;
    }
    
    function loadScript(script)
    {
        document.write( ['<script type="text/javascript" src="',
                         baseUrl, script, '"></script>'].join("") );
    }
    
    @BOOTSTRAP-FILES@
    
})();
