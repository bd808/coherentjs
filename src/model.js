/*jsl:import base.js*/
/*jsl:import oop.js*/



Object.extend(coherent, {

    /** Register a model object in the binding context for the given name. If a
        previous model object was registered with the provided name, it will no
        longer be available.
        @param model    the model object that should be available for binding
        @param name     the name by which the object should be made available
     **/
    registerModelWithName: function(model, name)
    {
        if (!coherent.dataModel)
            coherent.dataModel= new coherent.KVO();
        coherent.dataModel.setValueForKey(model, name);
    },

    /** Unregister a named model object from the binding context.
        @param name     the name of the model object to remove from the context.
     **/
    unregisterModelWithName: function(name)
    {
        if (!coherent.dataModel)
        {
            coherent.dataModel= new coherent.KVO();
            return;
        }
        delete coherent.dataModel[name];
    }

});



/** Setup the environment for the browser... this still requires someone to
 *  invoke the setupNode method to actually bind controls to the data model.
 */
(function (){

    if ("undefined"==typeof(window))
        return;


    var ObserverRegistry= {

        /** Collection of all observers registered within this bindings context.
            This allows a browser to unregister any observers that were added as
            part of a page. This prevents dangling pointers.
         **/
        observers: {},
    
        observerIndex: 0,
    
        registerObserver: function(observer)
        {
            observer.index= ++this.observerIndex;
            this.observers[observer.index]= observer;
        },
    
        unregisterObserver: function(observer)
        {
            delete this.observers[observer.index];
        },
    
        /** Tear down any observers that haven't already been unregistered.
         **/
        teardown: function()
        {
            var observers= this.observers;
            var i;
    
            this.observers= {};
            
            for (i in observers)
            {
                if (!observers.hasOwnProperty(i))
                    continue;
                observers[i].teardown();
            }
        }

    };

    /** In order to provide a link to the correct bindings context, I'm adding a
        property to the Function prototype. This is because the only thing I'm
        guaranteed to receive in addObserverForKeyPath is a callback function.
     **/
    Function.prototype._observerRegistry= ObserverRegistry;


    function documentUnloaded()
    {
        ObserverRegistry.teardown();
    }


    if (window.addEventListener)
        window.addEventListener( "unload", documentUnloaded, false );
    else if (window.attachEvent)
        window.attachEvent( "onunload", documentUnloaded );
        
    if (window.parent && window.parent!==window &&
        window.parent.coherent)
    {
        coherent.dataModel= window.parent.coherent.dataModel;
    }
    
})();
