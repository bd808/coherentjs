/*jsl:import base.js*/
/*jsl:import kvo.js*/
/*jsl:import controllers.js*/

/** An object controller that obtains its content via an Ajax call.
 */
coherent.AjaxController= Class.create(coherent.Controller, {

    constructor: function(name)
    {
        this.base(name);
    
        this.addObserverForKeyPath(this, this.queryUpdated, "url");
        this.addObserverForKeyPath(this, this.queryUpdated, "method");
        this.addObserverForKeyPath(this, this.parametersUpdated, "parameters");
    
        this.queryDelay= 500;
        this.url= "";
        this.method= "GET";
        this.setValueForKey(new coherent.KVO(), "parameters");
    },

    parametersUpdated: function(change)
    {
        var oldValue= change.oldValue;
        if (oldValue)
            oldValue.removeObserverForKeyPath(this, "*");
        var newValue= change.newValue;
        if (newValue)
            newValue.addObserverForKeyPath(this, this.queryUpdated, "*");
    },

    validateParameters: function()
    {
        return true;
    },

    queryUpdated: function(change)
    {
        if (!this.validateParameters())
            return;
        this.setValueForKey(true, "queryInProgress");
        if (this.__queryTimer)
            window.clearTimeout(this.__queryTimer);
        this.__queryTimer= window.setTimeout(this.performQuery.bind(this), this.queryDelay);
    },

    performQuery: function()
    {
        //  build the Ajax request
        var requestConfig= {
            method: this.method,
            parameters: {},
            onSuccess: this.querySucceeded.bind(this),
            onFailure: this.queryFailed.bind(this),
            onException: this.queryThrew.bind(this),
            onComplete: this.queryComplete.bind(this)
        };

        for (var p in this.parameters)
            if (this.parameters.hasOwnProperty(p))
                requestConfig.parameters[p]= this.parameters[p];
            
        this.__request= new Ajax.Request(this.url,  requestConfig);
    },

    extractContent: function(obj)
    {
        return obj;
    },

    queryComplete: function(xhr)
    {
        this.setValueForKey(false, "queryInProgress");
    },

    querySucceeded: function(xhr)
    {
        var obj= eval('('+xhr.responseText+')');
        if (!obj)
        {
            this.queryFailed(xhr);
            return;
        }
        coherent.KVO.adaptTree(obj);
    
        this.setContent(this.extractContent(obj));
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(undefined, "errorMessage");
    },

    queryFailed: function(xhr)
    {
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(xhr.statusText, "errorMessage");
        this.setContent(null);
    },

    queryThrew: function(xhr, e)
    {
        this.setValueForKey(xhr.status, "statusCode");
        this.setValueForKey(e.message, "errorMessage");
        this.setContent(null);
    }
    
});
