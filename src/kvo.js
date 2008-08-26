/*jsl:import base.js*/
/*jsl:import transformers.js*/
/*jsl:import oop.js*/


/**
    @TODO: Review code to see where try/finally might make library more bullet-
           proof.
 **/




/** Constructor for the data kept for each observable/observed key.
 **/
coherent.KeyInfo= Class.create({

    constructor: (function(){

        /** Create a wrapper function that will invoke willChange before
         *  calling the original mutator and didChange after calling the
         *  original mutator.
         */
        function wrapMutatorWithChangeNotificationForKey(mutator, key)
        {
            function wrapped(value)
            {
                this.willChangeValueForKey(key);
                mutator.call(this, value);
                this.didChangeValueForKey(key);
            }
            wrapped.__key= key;
            wrapped.valueOf= function()
            {
                return mutator;
            }
            wrapped.toString= function()
            {
                return String(mutator);
            }
            return wrapped;
        }
    
        /** Construct a KeyInfo object for environments that support
         *  properties (Rhino, SpiderMonkey, Firefox 2.0 and Safari 3.0)
         */
        function constructWithProperties(obj, key)
        {
            var keyAsTitle= key.titleCase();
            var mutatorName= "set" + keyAsTitle;

            var asProperties= false;
            var reader;
            var mutator;
            
            if ('undefined'!==typeof(reader=obj.__lookupGetter__(key)) ||
                'undefined'!==typeof(mutator=obj.__lookupSetter__(key)))
            {
                asProperties= true;
            }
            else
            {
                reader= obj[key];
                mutator= obj[mutatorName];
                if ("function"!=typeof(reader) || 0!==reader.length)
                    reader= null;
                if ("function"!=typeof(mutator) || 1!==mutator.length)
                    mutator= null;
            }

            //  swizzle mutator to automatically invoke willChange/didChange
            if (mutator instanceof Function && key!==mutator.__key)
            {
                var proto= obj.constructor.prototype;
                var originalWriter= mutator.valueOf();
                mutator= wrapMutatorWithChangeNotificationForKey(originalWriter, key);
                if (asProperties)
                {
                    //  determine whether the property exists on the object or
                    //  its prototype...
                    if (proto.__lookupSetter__(key))
                        proto.__defineSetter__(key, mutator);
                    else
                        obj.__defineSetter__(key, mutator);
                }
                else if (obj.hasOwnProperty(mutatorName))
                    obj[mutatorName]= mutator;
                else
                    proto[mutatorName]= mutator;
            }

            //  store accessor & mutator
            this.reader= reader;
            this.mutator= mutator;
            //  Obviously, a key is mutable if there's a mutator defined, but
            //  if the key has neither reader or mutator methods, then I
            //  access it via direct property access and the key is mutable
            this.mutable= ((mutator||!reader)?true:false);

            if (!this.reader && !this.mutator)
                this.mutable= true;
        
            //  changeCount is the number of times willChangeValueForKey has been
            //  called. This is decremented for each call to didChangeValueForKey.
            //  When this value returns to 0, a change notification is issued. The
            //  previous value is only cached for the first change.
            this.changeCount= 0;
        }
        
        /** Construct a KeyInfo object for legacy browsers that don't support
         *  properties (Firefox 1.5, Safari 2.0, and of course IE).
         */
        function constructForLegacy(obj, key)
        {
            var keyAsTitle= key.titleCase();
            var mutatorName= "set" + keyAsTitle;

            var reader= obj[key];
            var mutator= obj[mutatorName];

            if ("function"!=typeof(reader) || 0!==reader.length)
                reader= null;
            if ("function"!=typeof(mutator) || 1!==mutator.length)
                mutator= null;

            //  swizzle mutator to automatically invoke willChange/didChange
            if (mutator instanceof Function && key!==mutator.__key)
            {
                var proto= obj.constructor.prototype;
                var originalWriter= mutator.valueOf();
                mutator= wrapMutatorWithChangeNotificationForKey(originalWriter, key);
                
                if (obj.hasOwnProperty(mutatorName))
                    obj[mutatorName]= mutator;
                else
                    proto[mutatorName]= mutator;
            }

            //  store accessor & mutator
            this.reader= reader;
            this.mutator= mutator;
            //  Obviously, a key is mutable if there's a mutator defined, but
            //  if the key has neither reader or mutator methods, then I
            //  access it via direct property access and the key is mutable
            this.mutable= ((mutator||!reader)?true:false);

            if (!this.reader && !this.mutator)
                this.mutable= true;
        
            //  changeCount is the number of times willChangeValueForKey has been
            //  called. This is decremented for each call to didChangeValueForKey.
            //  When this value returns to 0, a change notification is issued. The
            //  previous value is only cached for the first change.
            this.changeCount= 0;
        }
        
        //  Return the correct constructor based on whether the JS environment
        //  supports properties or not.
        if ('__lookupGetter__' in Object.prototype)
            return constructWithProperties;
        else
            return constructForLegacy;
    })()
    
});




/** Enumerations for the types of changes.
    setting     a key's value has changed, the newValue property of the change
                notification will contain the new value. If the key represents
                an array, the newValue is the new array.
    insertion   an element or elements have been inserted into an array. The
                newValue property of the change notification will contain the
                new elements. The indexes property of the change notification
                will contain the index at which each element was inserted. The
                oldValue property will be null.
    deletion    an element or elements have been removed from an array. The
                newValue property of the change notification will be null. The
                oldValue property will contain the elements removed from the
                array. And the indexes property will contain the index of each
                element that was removed.
    replacement an element or elements have been replace in an array. The
                newValue property of the change notification will contain the
                new values for each element. The oldValue property will contain
                the previous values for each element. And the indexes property
                will contain the index of each element replaced.
 **/
coherent.ChangeType=
{
    setting: 0,
    insertion: 1,
    deletion: 2,
    replacement: 3
};



    
/** Constructor for a ChangeNotification.

    @param object       a reference to the object that has changed
    @param changeType   the type of change (@see coherent.ChangeType)
    @param newValue     the new value of the key
    @param oldValue     the old value of the key
 **/
coherent.ChangeNotification= Class.create({

    constructor: function(object, changeType, newValue, oldValue, indexes)
    {
        this.object= object;
        this.changeType= changeType;
        this.newValue= newValue;
        this.oldValue= oldValue;
        this.indexes= indexes;
        this.objectKeyPath= [];
    },
    
    toString: function()
    {
        var str= "[ChangeNotification changeType: ";
        switch (this.changeType)
        {
            case coherent.ChangeType.setting:
                str+= "setting";
                break;
            
            case coherent.ChangeType.insertion:
                str+= "insertion";
                break;
        
            case coherent.ChangeType.deletion:
                str+= "deletion";
                break;
            
            case coherent.ChangeType.replacement:
                str+= "replacement";
                break;
            
            default:
                str+= "<<unknown>>";
                break;
        }
    
        str+= " newValue=" + this.newValue +
              " oldValue=" + this.oldValue +
              (this.indexes?" indexes=" + this.indexes.join(", "):"") + "]";
    
        return str;
    }
});




/** Constructor for an observer registration.
 **/
coherent.ObserverEntry=Class.create({

    constructor: function(observer, callback, context, object, keyPath)
    {
        this.observer= observer;
        this.callback= callback;
        this.context= context;
        this.object= object;
        this.keyPath= keyPath;
        if (this.callback._bindingsContext &&
            this.callback._bindingsContext.registerObserver)
            this.callback._bindingsContext.registerObserver( this );
    },
    
    observeChangeForKeyPath: function(changeNotification, keyPath)
    {
        //  check to see whether this observer has already been notified
        if (-1!==changeNotification.objectKeyPath.indexOf(this.observer))
            return;

        this.callback.call(this.observer, changeNotification, keyPath,
                           this.context);
    },
    
    teardown: function()
    {
        this.object.removeObserverForKeyPath(this.observer, this.keyPath);
    }
});




coherent.KVO= Class.create({
    /** Initialiser for the KVO class.
     **/
    constructor: function()
    {
    },

    /** Set a value for a particular key path on the given object.

        @param value    the value to assign
        @param keyPath  where to store the value
    
        @throws KeyValueException/KeyNotValid if the keyPath is null
        @throws KeyValueException/KeyNotFound if an intermediate key in the path is
                not found.
     **/
    setValueForKeyPath: function(value, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            this.setValueForKey( value, keyPath[0] );
        else if ('@'==keyPath[0].charAt(0))
        {
            //  silently fail, because keyPaths with array operators are immutable.
            return;
        }
        else
        {
            //  Find the key value
            var object= this.valueForKey( keyPath[0] );
        
            if (!object)
                return;
                                        
            //  ask it to set the value based on the remaining key path
            object.setValueForKeyPath( value, keyPath.slice(1) );
        }
    },

    /** Set a value for a particular key on the given object. A key is a leaf
        attribute.
    
        @param value    the value to assign
        @param key      the name of the attribute to assign
    
        @throws KeyValueException/KeyNotValid if a null key is used
     **/
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "key may not be empty" );

        //  can't change value of readonly attributes
        var keyInfo= this.infoForKey(key);
        if (!keyInfo || !keyInfo.mutable)
            return;

        //  bracket modification of the value with change notifications.
        this.willChangeValueForKey( key );

        //  Ignore "changes" which don't actually change the value
        if (keyInfo.previousValue!==value)
        {
            if (keyInfo.mutator)
                keyInfo.mutator.call( this, value );
            else
                this[key]= value;
        }
    
        this.didChangeValueForKey( key );
    },

    /** Retrieve the value for a particular key path on the given object.
        @param keyPath  where to find the value

        @returns the value of the given key
        @throws KeyValueException/KeyNotValid if the specified keyPath is null
        @throws KeyValueException/KeyNotFound if the specified key doesn't exist
     **/
    valueForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
        
        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.valueForKey( keyPath[0] );
        else if ('@'==keyPath[0].charAt(0))
        {
            var operator= keyPath[0].substr(1);
            var values= this.valueForKeyPath( keyPath.slice(1) );
            return coherent.ArrayOperator[operator]( values );
        }
        else
        {
            //  Find the key value
            var object= this.valueForKey( keyPath[0] );
        
            //  if there is no value for the container, return null for the terminal
            //  value -- this makes bindings work for containers that haven't been
            //  created yet.
            if (undefined===object || null===object)
                return undefined;
        
            //  ask it to get the value based on the remaining key path
            return object.valueForKeyPath( keyPath.slice(1) );
        }
    },

    /** Retrieve the value of a particular key for this object.

        @param key  the name of the attribute to retrieve.
    
        @returns the value of the key
        @throws KeyValueException/KeyNotValid if the key is null
        @throws KeyValueException/KeyNotFound if there is no attribute for the given
                key name. This is different from the attribute having a null value.
     **/
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "the key is empty" );
    
        var keyInfo= this.infoForKey(key);
    
        if (!keyInfo)
            return null;
    
        if (keyInfo.reader)
            return keyInfo.reader.call(this);
        else if (key in this)
            return this[key];
        else
            return null;
    },

    /** Change notification handler for property values. This handler receives a
        notification for changes to the key values of contained objects.
    
        @param change   a ChangeNotification object
        @param keyPath  the key path that has changed
        @param context  the context information original specified for this key
     **/
    observeChildObjectChangeForKeyPath: function(change, keyPath, context)
    {
        //  Pass this along up the change
        if (coherent.KVO.kAllPropertiesKey!=keyPath)
            keyPath= context + "." + keyPath;
        else
            keyPath= context;
        
        var changeClone= Object.clone(change);
        changeClone.object= this;
        this.notifyObserversOfChangeForKeyPath( changeClone, keyPath );
    },
    

    /** Discover information about the specified key.
    
        @param keyPath  path to the attribute
    
        @returns an instance of KeyInfo for the specified keyPath

        @throws KeyValueException/KeyNotValid if the keyPath is null
        @throws KeyValueException/KeyNotFound if an intermediate key in the path is
                not found.
     **/
    infoForKeyPath: function(keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );

        //  if the keyPath is a string, split it into an array on the period
        //  between each key
        if ("string"==typeof(keyPath))
            keyPath= keyPath.split(".");
    
        //  Handle degenerate case where there is only one key
        if (1==keyPath.length)
            return this.infoForKey(keyPath[0]);
        else if ('@'==keyPath[0].charAt(0))
        {
            //  Array operators make a keyPath immutable.
            var keyInfo= new coherent.KeyInfo(null, null);
            keyInfo.mutable= false;
            return keyInfo;
        }
        else
        {
            //  Find the key value
            var object= this.valueForKey(keyPath[0]);

            //  If an object along the way is null, then return that the key in
            //  question can't be read and can't be written.
            if (!object)
                return undefined;

            if (!object.infoForKeyPath)
                return undefined;
            //  ask it to set the value based on the remaining key path
            return object.infoForKeyPath(keyPath.slice(1));
        }
    },

    /** Discover information about the specified key.
    
        @param keyPath  path to the attribute
    
        @returns an instance of KeyInfo for the specified key

        @throws KeyValueException/KeyNotValid if the keyPath is null
        @throws KeyValueException/KeyNotFound if an intermediate key in the path is
                not found.
     **/
    infoForKey: function(key)
    {
        var keyInfo;
    
        if (!this.__keys)
            this.__keys= {};
    
        keyInfo= this.__keys[key];
    
        if (keyInfo)
            return keyInfo;
        
        keyInfo= new coherent.KeyInfo(this, key);
    
        this.__keys[key]= keyInfo;
        return keyInfo;
    },
    
    /** Register dependent key for a set of keys. When any one of the set of keys
        changes, observers of the dependent key will be notified of a change to the
        dependent key. This is useful for a (read-only) composite value or similar.
    
        @param keys         an array of keys which will trigger a change
                            notification to the dependent key.
        @param dependentKey the name of a dependent key
        @throws KeyValueException/KeyNotValid if either the keys or dependentKey is
                null.
     **/
    setKeysTriggerChangeNotificationsForDependentKey: function(keys, dependentKey)
    {
        if (!keys || !keys.length)
            throw new InvalidArgumentError( "keys array is not valid" );
    
        if (!dependentKey)
            throw new InvalidArgumentError( "dependentKey can not be null" );

        var key;
        var keyInfo;
        var keyIndex;
        var dependentKeys;

        if (!this.__dependentKeys)
            this.__dependentKeys= {};

        for (keyIndex=0; keyIndex<keys.length; ++keyIndex)
        {
            key= keys[keyIndex];
            if (!key)
                throw new InvalidArgumentError( "key at index " + keyIndex +
                                                " was null" );

            if (!(key in this.__dependentKeys))
                this.__dependentKeys[key]= [];

            dependentKeys= this.__dependentKeys[key];

            if (-1==dependentKeys.indexOf( dependentKey ))
                dependentKeys.push( dependentKey );
        }
    },

    /** Determine the list of mutable keys.
        @returns an array of the names of the mutable keys.
     **/
    mutableKeys: function()
    {
        var keys=[];
        var k;
        var v;
        var firstChar;
    
        //  If there is a __mutableKeys property, return that instead of calculating
        //  the list of mutable keys.
        if ("__mutableKeys" in this && this.__mutableKeys.concat)
            return this.__mutableKeys;
        
        var keysToIgnore= Set.union(coherent.KVO.keysToIgnore, this.__keysToIgnore);
    
        for (k in this)
        {
            if (k in keysToIgnore || '__'===k.substr(0,2))
                continue;
            
            v= this[k];
            //  If it isn't a function, then it is inherently mutable.
            if ('function'!==typeof(v))
            {
                keys.push(k);
                continue;
            }
        
            //  Setters must have only one argument and begin with 'set',
            //  ignore everything else.
            if (1!==v.length || 'set'!==k.substr(0,3))
                continue;

            //  Setters must have a uppercase letter following the 'set' prefix.
            firstChar= k.charAt(3);
            if (firstChar!==firstChar.toUpperCase())
                continue;

            //  Keys begin with a lowercase letter.
            k= firstChar.toLowerCase() + k.substr(4);
        
            //  Only add the key if I didn't already see a non-function property
            //  with the same name.
            if (-1===keys.indexOf(k))
                keys.push(k);
        }
    
        return keys;
    },

    /** Initialise Key Value Observing for this object.
     **/
    initialiseKeyValueObserving: function()
    {
        /*  This object has never had an observer. I'll probe it to make certain
            the container relationships are established correctly.
         */
        var key;
        var keyValue;
        var keyType;
    
        //  Setting observers early helps prevent cycles when initialising
        //  key-value observing
        this.__observers= {};

        var keysToIgnore= Set.union(coherent.KVO.keysToIgnore, this.__keysToIgnore);

        for (key in this)
        {
            if (key in keysToIgnore)
                continue;

            //  don't use valueForKey here because I want to get the real
            //  object (say an Array) rather than a transformed value
            keyValue= this[key];
            keyType= coherent.typeOf(keyValue);

            if (keyType in coherent.KVO.typesOfKeyValuesToIgnore)
                continue;
            
            if (keyValue && keyValue.addObserverForKeyPath)
            {
                keyValue.addObserverForKeyPath(this, this.observeChildObjectChangeForKeyPath,
                                               coherent.KVO.kAllPropertiesKey,
                                               key);
            }
        }
    },

    /** Teardown Key Value Observing for this object.
     **/
    teardownKeyValueObserving: function()
    {
        var key;
        var keyValue;
        var keyType;
    
        //  REALLY remove the observers & keys properties
        delete this.__observers;
        delete this.__keys;

        var keysToIgnore= Set.union( coherent.KVO.keysToIgnore, this.__keysToIgnore );

        for (key in this)
        {
            if (key in keysToIgnore)
                continue;

            //  don't use valueForKey here because I want to get the real
            //  object (say an Array) rather than a transformed value
            keyValue= this[key];
            keyType= coherent.typeOf(keyValue);
        
            if (keyType in coherent.KVO.typesOfKeyValuesToIgnore)
                continue;

            if (keyValue && keyValue.__observers &&
                keyValue.teardownKeyValueObserving)
            {
                keyValue.teardownKeyValueObserving();
            }
        }
    },

    /** Register for changes to a particular key path.

        @param observer     the object interested in changes to the value of key
                            path
        @param callback     (optional) the function to call when the key changes,
                            defaults to "observeChangesForKeyPath"
        @param keyPath      the key path of interest
        @param context      a value passed back to the callback -- meaningful only
                            to the observer
     **/
    addObserverForKeyPath: function(observer, callback, keyPath, context)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath is empty" );
                                    
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!callback)
            callback= observer["observeChangeForKeyPath"];
            
        if (!callback)
            throw new InvalidArgumentError( "No callback method specified" );

        if (!this.__observers)
            this.initialiseKeyValueObserving();
    
        if (!this.__observers[keyPath])
        {
            //  fetch the keyInfo for this keyPath, to swizzle setter methods
            //  along the path to fire willChange/didChange methods.
            this.infoForKeyPath(keyPath);
            this.__observers[keyPath]= [];
        }
        
        var observerEntry= new coherent.ObserverEntry(observer, callback,
                                                      context, this, keyPath);

        this.__observers[keyPath].push(observerEntry);
    },

    /** Remove an observer for a keyPath.

        @param keyPath          the key path of interest
        @param observer         the object interested in changes to the value of key
                                path
     **/
    removeObserverForKeyPath: function(observer, keyPath)
    {
        if (!keyPath || 0===keyPath.length)
            throw new InvalidArgumentError( "keyPath may not be empty" );
                                    
        if (!observer)
            throw new InvalidArgumentError( "Observer may not be null" );

        if (!this.__observers || !this.__observers[keyPath])
            return;

        var allObservers= this.__observers[keyPath];
        var entryIndex=-1;
        var entry;
        var len= allObservers.length;
    
        //  TODO: This could be faster... It shouldn't be necessary to scan
        //  the entire list of observers.
        for (entryIndex=0; entryIndex<len; ++entryIndex)
        {
            entry= allObservers[entryIndex];
            if (entry.observer==observer)
            {
                if (entry.callback._bindingsContext &&
                    'unregisterObserver' in entry.callback._bindingsContext)
                {
                    entry.callback._bindingsContext.unregisterObserver(entry);
                }
                allObservers.splice(entryIndex, 1);
                return;
            }
        }
    },

    /** Prepares for a later invocation of didChangeValueForKey by caching the
        previous value in the key's KeyInfo structure. Should be called for manual
        KVO implementation.

        @param key  the key that has changed
        @throws KeyValueException/KeyNotValid if the key is null
     **/
    willChangeValueForKey: function(key)
    {
        if (!key)
            throw new InvalidArgumentError("key may not be null");

        var keyInfo= this.infoForKey(key);
        if (!keyInfo)
            return;

        //  Only remember the previous value the first time
        //  willChangeValueForKey is called.
        if (1===++keyInfo.changeCount)
            keyInfo.previousValue= this.valueForKey( key );
    },

    /** Invoked to notify observers that the value has changed.

        @param key  the key that has changed
     **/
    didChangeValueForKey: function(key)
    {
        if (!key)
            throw new InvalidArgumentError( "key may not be null" );

        var keyInfo= this.infoForKey(key);
        if (!keyInfo)
            return;

        //  If this isn't the final call to didChangeValueForKey, don't issue the
        //  change notification.
        if (0!==--keyInfo.changeCount)
            return;
        
        var newValue= this.valueForKey(key);
        var previousValue= keyInfo.previousValue;
        keyInfo.previousValue= null;
        
        if (newValue===previousValue)
            return;
            
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.setting,
                                                    newValue, previousValue);
        this.notifyObserversOfChangeForKeyPath(change, key);
        
        //  observe changes to the new value
        if (newValue && newValue.addObserverForKeyPath)
            newValue.addObserverForKeyPath(this, this.observeChildObjectChangeForKeyPath,
                                           coherent.KVO.kAllPropertiesKey,
                                           key);

        //  stop observing changes to old value
        if (previousValue && previousValue.removeObserverForKeyPath)
            previousValue.removeObserverForKeyPath(this, coherent.KVO.kAllPropertiesKey);
    },
                                     
    /** Notify all observers that the specified keyPath has changed.

        @param keyPath      path to the key that has changed
        @param newValue     new value of the key
        @param oldValue     original value of the key
        @param changeType   what kind of change is this
     **/
    notifyObserversOfChangeForKeyPath: function(change, keyPath)
    {
        if (!keyPath)
            throw new InvalidArgumentError( "keyPath may not be null" );
    
        //  Nothing to do if no-one is observing changes in this object
        if (!this.__observers)
            return;

        var observerIndex;
        var observers;
        var len;
    
        //  First notify containers -- registered as observers for the
        //  KVO.kAllPropertiesKey key
        observers= this.__observers[coherent.KVO.kAllPropertiesKey];
        if (observers && observers.length)
        {
            var changeClone= Object.clone(change);
            var objectKeyPathLength= change.objectKeyPath.length;
            change.objectKeyPath.push(this);

            len= observers.length;

            try
            {
                for (observerIndex=0; observerIndex < len; ++observerIndex)
                {
                    var o= observers[observerIndex];
                    o.observeChangeForKeyPath( changeClone, keyPath );
                }
            }
            finally
            {
                //  restore the length of the objectKeyPath array
                change.objectKeyPath.length= objectKeyPathLength;
            }
        }
    
        //  don't bother with the rest of notifications for whole-object changes
        if (coherent.KVO.kAllPropertiesKey==keyPath)
            return;
        
        //  Next notify actual observers for the specified keyPath
        observers= this.__observers[keyPath];
        if (observers && observers.length)
        {
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
            {
                observers[observerIndex].observeChangeForKeyPath( change, keyPath );
            }
        }
    
        //  Notify observers for a subkey
        var subkey= keyPath + ".";
        var subkeyLength= subkey.length;
        var restOfKeyPath;
        var observerKeyPath;
        var subkeyChange;
        var oldSubValue;
        var newSubValue;
    
        for (observerKeyPath in this.__observers)
        {
            if (observerKeyPath.substr(0, subkeyLength)!=subkey)
                continue;

            observers= this.__observers[observerKeyPath];
            if (!observers || !observers.length)
                continue;
            
            restOfKeyPath= observerKeyPath.substr(subkeyLength);

            oldSubValue= change.oldValue;
            if (oldSubValue && oldSubValue.valueForKeyPath)
                oldSubValue= oldSubValue.valueForKeyPath(restOfKeyPath);
            else
                oldSubValue= null;
            newSubValue= change.newValue;
            if (newSubValue && newSubValue.valueForKeyPath)
                newSubValue= newSubValue.valueForKeyPath(restOfKeyPath);
            else
                newSubValue= null;
            subkeyChange= new coherent.ChangeNotification( change.object,
                                                  change.changeType,
                                                  newSubValue, oldSubValue,
                                                  change.indexes );
            len= observers.length;
            for (observerIndex=0; observerIndex < len; ++observerIndex)
            {
                observers[observerIndex].observeChangeForKeyPath( subkeyChange,
                                                                  observerKeyPath );
            }
        }

        //  Finally, trigger dependent keys
        if (this.__dependentKeys && (keyPath in this.__dependentKeys))
        {
            var dependentKeys= this.__dependentKeys[keyPath];

            var dependentValue;
            var dependentChange;
            var keyIndex=0;
            var dot;
            var obj= this;

            len= dependentKeys.length;
            for (keyIndex=0; keyIndex<len; ++keyIndex)
            {
                var dependentKey= dependentKeys[keyIndex];
                dot= dependentKey.lastIndexOf( "." );
                if (-1!=dot)
                {
                    obj= this.valueForKeyPath( dependentKey.substring( 0, dot ) );
                    dependentKey= dependentKey.substr( dot+1 );
                }

                dependentValue= obj.valueForKeyPath(dependentKey);

                dependentChange= new coherent.ChangeNotification( obj, coherent.ChangeType.setting,
                                                         dependentValue, null );
                obj.notifyObserversOfChangeForKeyPath( dependentChange,
                                                       dependentKey );
            }
        }
    }
});

//  Internal key used for observing property changes to a KVO-compliant object
coherent.KVO.kAllPropertiesKey= "*";

coherent.KVO.keysToIgnore= $S("__keys","__observers","__keysToIgnore",
                              "__dependentKeys", "__mutableKeys" );

coherent.KVO.typesOfKeyValuesToIgnore= $S("string", "number", "boolean", "date",
                                          "regex", "function");




/** Add KVO methods to an object that doesn't already have them.
    @param obj  the object to add the methods to
 **/
coherent.KVO.adapt= function(obj)
{
    //  either there's no object or the object already has the methods
    if (!obj)
        throw new InvalidArgumentError( "Can't adapt a null object" );
    var p;
    for (p in coherent.KVO.prototype)
    {
        if (p in obj)
            continue;
        obj[p]= coherent.KVO.prototype[p];
    }

    //  perform magic for key dependencies
    if ('keyDependencies' in obj && !('__dependentKeys' in obj))
    {
        var depends= obj.keyDependencies;
        for (p in depends)
            obj.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
    }
    
    return obj;
}




/** Add KVO methods to all the objects within an object. Allows using object
    literals with KVO.
 **/
coherent.KVO.adaptTree= function( obj )
{
    coherent.KVO.adapt(obj);
    
    var p;
    var value;
    
    for (p in obj)
    {
        if (p in coherent.KVO.keysToIgnore)
            continue;
            
        value= obj[p];
        if (!value || coherent.typeOf(value) in coherent.KVO.typesOfKeyValuesToIgnore)
            continue;

        coherent.KVO.adaptTree(value);
        
        //  observe all changes to the property
        value.addObserverForKeyPath(obj, obj.observeChildObjectChangeForKeyPath,
                                    coherent.KVO.kAllPropertiesKey, p);
    }

    return obj;
}


/** Perform magic to automatically create key dependencies when a subclass of
 *  KVO is created.
 */
coherent.KVO.__subclassCreated= function(subclass)
{
    var baseproto= subclass.superclass.prototype;
    var proto= subclass.prototype;
    
    //  Subclass hasn't changed the key dependencies prototype property...
    if (baseproto.keyDependencies===proto.keyDependencies)
        return;

    var depends= proto.keyDependencies||{};
    for (var p in depends)
        proto.setKeysTriggerChangeNotificationsForDependentKey(depends[p], p);
}




/** Add some methods to the Array prototype to support Key Value functionality.
 */
Class.extend(Array, {

    /** Retrieve the "value" of a particular key for an Array object. This will
        invoke valueForKey on each array element and return an array of the
        results.

        @param key  the name of the attribute to retrieve.
    
        @returns an array containing the values for the particular key on each
                 element of the array
        @throws KeyValueException/KeyNotFound if there is no attribute for the given
                key name. This is different from the attribute having a null value.
     **/
    valueForKey: function(key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "the key is empty" );

        if ('@count'==key)
            return this.length;
        
        //  create an array to hold the results
        var value= new Array(this.length);
        var index;
        var len= this.length;
    
        for (index=0; index<len; ++index)
            value[index]= this[index].valueForKey(key);

        return value;
    },

    /** Set a value for a particular key all elements of the Array.
    
        @param value    the value to assign
        @param key      the name of the attribute to assign
    
        @throws KeyValueException/KeyNotValid if a null key is used
     **/
    setValueForKey: function(value, key)
    {
        if (!key || 0===key.length)
            throw new InvalidArgumentError( "key is empty" );

        var index;
        var len= this.length;
        for (index=0; index<len; ++index)
            this[index].setValueForKey(value, key);
    },

    /** Find the indexes of the specified objects. Begins searching from the
        beginning of the array. Returns an empty array if none of the objects
        appear in this array.
    
        @param objects  the objects to find
        @returns the indexes of the specified objects
     **/
    indexesOfObjects: function(objects)
    {
        var i;
        var len= objects.length;
        var result= [];
    
        var index;
    
        for (i=0; i<len; ++i)
        {
            index= this.indexOf( objects[i] );
            if (-1===index)
                continue;
            result.push(index);
        }
    
        return result;
    },

    /** Return the index of the first object that satisfies the predicate starting
        after the specified index.
    
        @param predicate    a function applied to each entry to determine the first
                            matching entry
        @param afterIndex   the index before the first entry to test
        @returns index of the first match or -1 if no match was found
     **/
    indexOfAfterIndexUsingPredicate: function(predicate, afterIndex)
    {
        if (null===afterIndex || undefined==afterIndex || -1>afterIndex ||
            this.length<=afterIndex)
            throw new RangeError( "afterIndex is null or outside the bounds of Array" );

        var index;
        var len= this.length;
        for (index= afterIndex+1; index<len; ++index)
        {
            if (predicate(this[index]))
                return index;
        }
    
        return -1;
    },

    /** Return the first index that satisfies the predicate.

        @param predicate    a function applied to each entry to determine first
                            matching entry
        @returns index of first match or -1 if no match was found
     **/
    indexOfUsingPredicate: function(predicate)
    {
        return this.indexOfAfterIndexUsingPredicate( predicate, -1 );
    },
    

    /** Append the object to the end of the array.

        @param object the object to add to the array
     **/
    addObject: function(object)
    {
        var index= this.length;
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.insertion,
                                                [object], null, [index]);
        this.push( object );
        this.observeElementAtIndex( index );
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey );
    },

    /** Add all the objects in the array to this array.
        @TODO: Don't use individual calls to addObject, that's too slow.
    
        @param array the source of the new objects
     **/
    addObjects: function(array)
    {
        var index;
        var len= array.length;
        for (index=0; index<len; ++index)
            this.addObject( array[index] );
    },

    /** Insert an object at the specified index.

        @param object   the object to insert into the array
        @param index    where in the array to insert the object
     **/
    insertObjectAtIndex: function(object, index)
    {
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.insertion,
                                                [object], null, [index]);
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );
        this.splice(index, 0, object);
        this.observeElementAtIndex(index);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey );
    },

    /** Remove an object from the array at the specified index.

        @param index    the location of the object to remove
     **/
    removeObjectAtIndex: function(index)
    {
        if (index<0 || index>=this.length)
            throw new RangeError( "index must be within the bounds of the array" );
        this.stopObservingElementAtIndex(index);
        var oldValue= this.splice(index, 1);
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.deletion,
                                                null, oldValue, [index] );
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Remove all objects from the array.
     **/
    removeAllObjects: function()
    {
        var index;
        var indexArray= [];
        var len= this.length;
    
        indexArray.length= len;
        for (index=0; index<len; ++index)
        {
            this.stopObservingElementAtIndex(index);
            indexArray[index]= index;
        }

        var oldValue= this.splice(0, len);
        var change= new coherent.ChangeNotification(this, coherent.ChangeType.deletion,
                                                null, oldValue, indexArray);
        this.notifyObserversOfChangeForKeyPath(change,
                                               coherent.KVO.kAllPropertiesKey);
    },

    /** Retrieve a sub-set of this array containing the objects at the specified
        array indexes.
    
        @param indexes  the indexes of the retrieved objects
        @returns a new array containing only those objects at the specified indexes.
     **/
    objectsAtIndexes: function(indexes)
    {
        var i;
        var result= [];
        var len= indexes.length;
        result.length= indexes.length;
    
        for (i=0; i<len; ++i)
            result[i]= this[indexes[i]];
        return result;
    },

    /** Change notification handler for array elements. This handler receives a
        notification for changes to the key values of array elements.
    
        @param change   a ChangeNotification object
        @param keyPath  the key path that has changed
        @param context  the context information original specified for this key
     **/
    observeArrayElementChangeForKeyPath: function(change, keyPath, context)
    {
        //  Pass this along up the change
        var elementChange= new coherent.ChangeNotification( change.object,
                                                   coherent.ChangeType.replacement,
                                                   [change.newValue],
                                                   [change.previousValue],
                                                   [parseInt(context,10)] );
        this.notifyObserversOfChangeForKeyPath(elementChange, keyPath);
    },

    /** Setup the observer structure for an array element. This allows the array to
        propagate change notifications for its elements.

        @param index    the index of the element to observe
     **/
    observeElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value || !value.addObserverForKeyPath)
            return;
        
        if (coherent.typeOf(value) in coherent.KVO.typesOfKeyValuesToIgnore)
            return;

        value.addObserverForKeyPath(this, this.observeArrayElementChangeForKeyPath,
                                    coherent.KVO.kAllPropertiesKey, index);
    },

    stopObservingElementAtIndex: function(index)
    {
        var value= this[index];

        if (!value.removeObserverForKeyPath)
            return;
        
        if (coherent.typeOf(value) in coherent.KVO.typesOfKeyValuesToIgnore)
            return;

        value.removeObserverForKeyPath(this, coherent.KVO.kAllPropertiesKey);
    },

    /** Initialise Key Value Observing for this array.
     **/
    initialiseKeyValueObserving: function()
    {
        /*  This array has never had an observer. I'll probe it to make certain
            the container relationships are established correctly.
         */
        var index;
        var len= this.length;
    
        this.__observers= {};
    
        for (index=0; index<len; ++index)
            this.observeElementAtIndex(index);
    }
    
});

//  Add all KVO methods to Arrays
coherent.KVO.adapt( Array.prototype );




/** Implementations of the Array Operators for Key Value Coding.
 **/
coherent.ArrayOperator= {

    avg: function(values)
    {
        return this.sum( values ) / values.length;
    },
    
    count: function(values)
    {
        throw new InvalidArgumentError( "@count operator must end the keyPath" );
    },
    
    distinctUnionOfArrays: function(values)
    {
        //  Return the distinct elements from the big flat array.
        return this.unionOfArrays(values).distinct();
    },
    
    distinctUnionOfObjects: function(values)
    {
        return values.distinct();
    },
    
    max: function(values)
    {
        var max= undefined;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (undefined===max || v>max)
                max= v;
        }
        return max;
    },
    
    min: function(values)
    {
        var min= undefined;
        var i;
        var len;
        var v;
    
        for (i=0, len=values.length; i<len; ++i)
        {
            v= values[i];
            if (undefined===min || v<min)
                min= v;
        }
        return min;
    },
    
    sum: function(values)
    {
        var sum= 0;
        var len= values.length;
        var i;
        for (i=0; i<len; ++i)
            sum+= values[i];
        return sum;
    },
    
    unionOfArrays: function(values)
    {
        //  TODO: Can't I just use: Array.prototype.concat.apply([], values)?
        var flattened= [];
        var len;
        var i;
        //  Flatten all arrays into a single BIG array
        for (i=0, len=values.length; i<len; ++i)
            flattened= flattened.concat( values[i] );
        return flattened;
    },
    
    unionOfObjects: function(values)
    {
        //  This seems to be a noop...
        return values;
    }
    
};

/** Initialiser for a class that manages the value associated with a binding.
    Each Bindable will have one Binding for each exposed binding. A
    Binding observes changes to the given keyPath on the specified object.
    When the value changes, the Binding transforms it (if a transformer
    was specified) and calls its observerFn method.
    
    The correct way to use a Binding is to create it with the object,
    keyPath and transformer. Then assign a callback handler to the observerFn
    method.

    @param object       the object which this Binding will observe
    @param keyPath      the path to the value on object that the Binding
                        will observe
    @param transformer  a ValueTransformer instance that is responsible for
                        converting between model and display values
 **/
coherent.Binding= Class.create({

    constructor: function(object, keyPath, transformer)
    {
        if (0===arguments.length)
            return;
        
        this.object= object;
        this.keyPath= keyPath;
        this.transformer= transformer;
        this.cachedValue= this.transformedValue( this.object.valueForKeyPath( this.keyPath ) );
    },
    
    /** Begin tracking changes to the value for this Binding.
     **/
    bind: function()
    {
        this.object.addObserverForKeyPath(this, this.observeChangeForKeyPath,
                                          this.keyPath );
    },
    
    /** Stop tracking changes to the value for this Binding.
     **/
    unbind: function()
    {
        this.object.removeObserverForKeyPath( this, this.keyPath );
    },
    
    /** Transform the value tracked by this Binding according to the value
        transformer. If there's no value transformer, then the value won't change.
     **/
    transformedValue: function(value)
    {
        if (!this.transformer)
            return value;
        return this.transformer.transformedValue( value );
    },
    
    /** Change the value tracked by this Binding. This method will check to
        see whether the new value is actually a change, and if not, it ignores the
        request. If the value has changed, it will first be transformed into a model
        value, then set on the target object.
    
        @param value    the new value for this Binding.
     **/
    setValue: function(value)
    {
        //  nothing to do if the value hasn't changed.
        if (this.cachedValue===value)
            return;
        
        this.cachedValue= value;
        if (this.transformer && this.transformer.reverseTransformedValue)
            value= this.transformer.reverseTransformedValue( value );
        this.object.setValueForKeyPath( value, this.keyPath );
    },
    
    /** Is the value tracked by this Binding mutable?
     **/
    mutable: function()
    {
        var keyInfo= this.object.infoForKeyPath( this.keyPath );
        return keyInfo && keyInfo.mutable;
    },
    
    /** Retrieve the value for this Binding. The value is cached and only
        updated when changed. Of course, this is ok, because I'm observing changes
        to the value...
    
        @returns the cached value of this Binding.
     **/
    value: function()
    {
        return this.cachedValue;
    },
    
    /** Call the observerFn callback to update the Widget with the latest value.
     **/
    update: function()
    {
        var change= new coherent.ChangeNotification(this.object, coherent.ChangeType.setting,
                                                    this.value());
        this.observerFn( change, this.keyPath );
    },
    
    /** A callback function that should be set by clients of the Binding.
        This is here simply to prevent failures.

        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observerFn: function(change, keyPath, context)
    {},
    
    /** The Binding's change observer method. This method makes a clone of the
        change notification before transforming the new value and old value (if
        present). This change notification is passed to the observerFn callback
        method.

        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/    
    observeChangeForKeyPath: function(change, keyPath, context)
    {
        var transformedChange= Object.clone(change);
        transformedChange.newValue= this.transformedValue( change.newValue );
        if (transformedChange.newValue===this.cachedValue)
            return;
        
        this.cachedValue= transformedChange.newValue;
        if (change.oldValue)
            transformedChange.oldValue= this.transformedValue( change.oldValue );
        this.observerFn( transformedChange, keyPath, context );
    }
    
});

coherent.Binding.bindingRegex= /^(.*?)(?:\((.*)\))?$/;
coherent.Binding.compoundRegex= /^\s*([^&|].*?)\s*(\&\&|\|\|)\s*(\S.+)\s*$/;

/** Create a new Binding for a target object based on a string
    representation of the binding. This uses the Binding.bindingRegex
    regular expression to parse the binding string.
    
    @param bindingString    the string representation of the binding.
    @param object           the object which the resultant Binding should
                            observe for changes to the value specified in the
                            binding string.
    @returns a new Binding instance representing the binding string
 **/
coherent.Binding.bindingFromString= function(bindingString, object)
{
    var match;
    var binding;
    
    //  First see if it's a compound binding string, if so, return a new
    //  CompoundBinding object.
    match= bindingString.match( coherent.Binding.compoundRegex );
    if (match && 4==match.length)
    {
        binding= new coherent.CompoundBinding( match[2],
                                coherent.Binding.bindingFromString(match[1], object),
                                coherent.Binding.bindingFromString(match[3], object) );
        binding.bind();
        return binding;
    }
                                    
    //  Use the binding regular expression to pull apart the string
    match= bindingString.match( coherent.Binding.bindingRegex );
    if (!match || match.length<3)
        throw new InvalidArgumentError( "bindingString isn't in correct format" );
    var keyPath= match[1];
    var transformer= undefined;

    if (match[2])
        transformer= coherent.findTransformerWithName( match[2] );

    //  If the caller didn't specify a target object, I'll bind to the page's
    //  binding context. This is where all the model objects are registered, so
    //  this is probably best.
    binding= new coherent.Binding( object || coherent.dataModel, keyPath, transformer );
    binding.bind();
    
    return binding;
}




/** Initialiser for a class that manages a compound value coherent. Compound
    bindings are immutable by their basic nature. CompoundBindings offer
    either AND (&&) or OR (||) operations to combine their values.
    
    You should probably never create a CompoundBinding directly. Rely on the
    coherent.Binding.bindingFromString method to create them for you.
    
    @param operation    either CompoundBinding.AND or CompoundBinding.OR
    @param left         left hand binding
    @param right        right hand binding
 **/
coherent.CompoundBinding= Class.create(coherent.Binding, {

    constructor: function(operation, left, right) 
    {
        this.base();
        
        if (!operation || !left || !right)
            throw new InvalidArgumentError( "No parameters to CompoundBinding initialiser are optional" );
        
        this.operation= operation;
        this.left= left;
        this.right= right;
        this.left.observerFn= this.right.observerFn= this.observeChange.bind(this);

        switch (this.operation)
        {
            case coherent.CompoundBinding.AND:
                this.cachedValue= this.left.value() && this.right.value();
                break;
            case coherent.CompoundBinding.OR:
                this.cachedValue= this.left.value() || this.right.value();
                break;
            default:
                throw new InvalidArgumentError( "Unknown operation value for CompoundBinding" );
                break;
        }
    },
    
    bind: function()
    {
        this.left.bind();
        this.right.bind();
    },
    
    unbind: function()
    {
        this.left.unbind();
        this.right.unbind();
    },
    
    mutable: function()
    {
        return false;
    },
    
    setValue: function(value)
    {
        throw new Error( "Attempting to set value of CompoundBinding" );
    },
    
    observeChange: function(change, keyPath)
    {
        var oldValue= this.cachedValue;
    
        //  doesn't matter which has changed...
        switch (this.operation)
        {
            case coherent.CompoundBinding.AND:
                this.cachedValue= this.left.value() && this.right.value();
                break;
            case coherent.CompoundBinding.OR:
                this.cachedValue= this.left.value() || this.right.value();
                break;
            default:
                throw new Error( "Unknown operation value for CompoundBinding" );
                break;
        }

        if (oldValue===this.cachedValue)
            return;
    
        this.update();    
    }
});
    
coherent.CompoundBinding.AND= "&&";
coherent.CompoundBinding.OR= "||";




/** Bindable is a base class that provides simple two-way binding between
 *  objects. Widgets are bindable.
 */
coherent.Bindable= Class.create(coherent.KVO, {

    constructor: function()
    {
        this.bindings={};
    },
    
    exposedBindings: [],
    
    /** Bind an exposed binding name to a given key path.

        @param name             the name of the binding exposed via exposedBindings
        @param keyPath          the path to the value used for this binding
        @param relativeSource   the model object to be used for relative key paths
        @param delayUpdate      postpone calling the observer method for this
                                binding (allows the Bindable to be fully setup
                                before sending update notifications)
     **/
    bindNameToKeyPath: function(name, keyPath, relativeSource, delayUpdate)
    {
        var fn;
        var binding;

        if (!this.bindings)
            this.bindings={};
        
        fn= this["observe" + name.titleCase() + "Change"];
        //  Silently fail if the object doesn't have an observer function for a
        //  binding with the given name.
        if (!fn)
            return;
    
        //  Unbind the old value
        if (this.bindings[name])
            this.bindings[name].unbind();
    
        //  Create a new Binding using the keyPath parameter, connect up the
        //  observer method, and store the binding in the lookup table. Finally,
        //  get its present value.
        if ("*."==keyPath.substr(0,2))
            binding= coherent.Binding.bindingFromString(keyPath.substr(2),
                                                        relativeSource );
        else
            binding= coherent.Binding.bindingFromString(keyPath);

        //  If update should be delayed, call the Binding's update method before
        //  setting the observer method -- this allows the Binding to get the
        //  latest value without sending the update notifications.
        if (delayUpdate)
            binding.update();
        binding.observerFn= fn.bind(this);
        this.bindings[name]= binding;
        if (!delayUpdate)
            binding.update();
    }
    
});

/** Handler for creation of subclasses of Bindable: this fixes up the exposed
 *  bindings silliness by adding all the base class exposed bindings to the
 *  prototype value.
 */
coherent.Bindable.__subclassCreated= function(subclass)
{
    var baseproto= subclass.superclass.prototype;
    var proto= subclass.prototype;
    //  Subclass hasn't changed the exposed bindings prototype property...
    if (baseproto.exposedBindings===proto.exposedBindings)
        return;
    proto.exposedBindings= proto.exposedBindings.concat(baseproto.exposedBindings);
}
