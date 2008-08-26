
var UpgradeClassTransformer= new coherent.GenericTransformer([true, false],
                                                             ['upgrade', '']);
coherent.registerTransformerWithName(UpgradeClassTransformer,
                                     'Upgrade');

                                     
var PriceDeltaTransformer= {
    transformedValue: function(value)
    {
        value= parseInt(value, 10);
        if (0===value || isNaN(value))
            return "";
            
        if (value>0)
            return "(Add $" + value + ")";
        else
            return "(Subtract $" + (-value) + ")";
    }
};
coherent.registerTransformerWithName(PriceDeltaTransformer,
                                     "PriceDelta");


var State= Class.create(coherent.KVO, {

    constructor: function(name, properties)
    {
        var v;
        var p;
        
        for (p in properties.options)
        {
            v= properties.options[p];
            if (!(v instanceof Array))
                continue;
            properties.config[p]= v[0];
        }
        coherent.KVO.adaptTree(properties);
        
        for (p in properties)
        {
            if (p in this)
                continue;
            this.setValueForKey(properties[p], p);
        }

        this.config.addObserverForKeyPath(this, this.observeConfigChange, '*');
        coherent.registerModelWithName(this, name);
    },

    url: 'index.php',
    
    performQuery: function()
    {
        var query= {};
        
        this.__queryTimer= null;
        
        var config= this.config;
        var options= this.options;
        var keys= (options.mutableKeys()||[]).sort();
        for (var i=0; i<keys.length; ++i)
        {
            var key= keys[i];
            var value= options[key];
            if (value instanceof Function)
                continue;
            query[key]= config.valueForKeyPath(key+'.key')||"";
        }
        
        this.setValueForKey(Hash.toQueryString(query), 'query');

        var requestConfig= {
            method: 'GET',
            parameters: query,
            onSuccess: this.querySucceeded.bind(this),
            onFailure: this.queryFailed.bind(this),
            onException: this.queryThrew.bind(this),
            onComplete: this.queryComplete.bind(this)
        };

        this.__request= new Ajax.Request(this.url,  requestConfig);
    },

    queryFailed: function(xhr)
    {
    },
    
    queryComplete: function(xhr)
    {
        this.setValueForKey(false, "queryInProgress");
    },

    queryThrew: function(xhr)
    {
    },
    
    querySucceeded: function(xhr)
    {
        var responseText= xhr.responseText.replace(/\s+$/,'');
        var json= eval('('+String(responseText)+')');
        if (!json)
        {
            this.queryFailed(xhr);
            return;
        }
        this.updateConfig(json);
    },
    
    observeConfigChange: function(change, keyPath, context)
    {
        if (this.__updatingConfig)
            return;
            
        if (this.__queryTimer)
            window.clearTimeout(this.__queryTimer);
        this.setValueForKey(true, 'queryInProgress');
        this.__queryTimer= window.setTimeout(this.performQuery.bind(this), 500);
    },
    
    updateConfig: function(json)
    {
        try
        {
            this.__updatingConfig= true;
            for (var p in json)
            {
                var value= json[p];
                if (value instanceof Function)
                    continue;
                
                var option= this.options[p];
                if (!option)
                {
                    this.config.setValueForKey(value, p);
                    continue;
                }
                    
                var keys= option.valueForKey('key');
                var index= keys.indexOf(value);
                
                if (-1===index)
                    this.config.setValueForKey(null, p);
                else
                    this.config.setValueForKey(option[index], p);
            }
        }
        finally
        {
            this.__updatingConfig= false;
        }
    }
    
});

var OptionValue= Class.create(coherent.KVO, {

    constructor: function(option, properties)
    {
        this.option= option;
        this.__observingSelection=false;
        Object.extend(this, properties);
    },
    
    upgrade: function()
    {
        return (this.price!=0);
    },
    
    beginObservingSelection: function()
    {
        var config= state.config;
        this.__observingSelection= true;
        config.addObserverForKeyPath(this, this.observeSelectionChange,
                                     this.option);
        var selection= config.valueForKey(this.option);
        this.__priceDelta= this.price-(selection?selection.price:0);
        this.__checked= !!(this===selection);
    },
    
    checked: function()
    {
        if (!this.__observingSelection)
            this.beginObservingSelection();
        return this.__checked||false;
    },
    
    setChecked: function(newChecked)
    {
        this.__checked= newChecked;
    },
    
    priceDelta: function()
    {
        if (!this.__observingSelection)
            this.beginObservingSelection();
        return this.__priceDelta||"";
    },

    setPriceDelta: function(newPriceDelta)
    {
        this.__priceDelta= newPriceDelta;
    },
    
    observeSelectionChange: function(change)
    {
        var newValue=change.newValue;
        
        this.setPriceDelta(this.price-(newValue?newValue.price:0));
        this.setChecked(!!(this===newValue));
    }
});
