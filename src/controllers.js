/*jsl:import base.js*/
/*jsl:import kvo.js*/


/** Sure would be nice to use a generator here...
 */
function IndexRange(begin, end)
{
    var i;
    var r=[];
    
    for (i=begin; i<=end; ++i)
        r.push(i);
    return r;
}

/** Initialise a new SortDescriptor.
    @param keyPath      the path to the key to compare on each object
    @param ascending    whether this descriptor sorts values in ascending (true)
                        or descending (false) order.
    @param comparisonFn (optional) either the name of the comparison method,
                        which must be defined on the values to compare, or a
                        reference to a comparison function. This function must
                        take one parameter, the object to compare against, and
                        must return -1,0,1 based on whether the this value is
                        less than, equal to, or greater than the comparison
                        value.
    @throws InvalidArgumentError if comparisonFn is neither a string nor a
            function.
 **/
coherent.SortDescriptor= Class.create({

    constructor: function(keyPath, ascending, comparisonFn)
    {
        this.keyPath= keyPath;
        this.ascending= ascending;
        this.comparisonFn= comparisonFn || this.defaultCompare;

        var comparisonType= typeof(this.comparisonFn);
        if ("string"!=comparisonType && "function"!=comparisonType)
            throw new InvalidArgumentError( "comparisonFn must be either the name of a method or a function reference" );
    },
    
    /** Find the comparison function on o.
        @param o    the object on which comparisonFn should be found
        @returns a method reference to a method on o
        @throws TypeError if the comparisonFn member doesn't resolve to a function.
     **/
    resolveComparisonFn: function( o )
    {
        var fn= this.comparisonFn;
        if ("string"===typeof(fn))
            fn= o[fn];
        if ("function"!==typeof(fn))
            throw new TypeError( "comparisonFn does not resolve to a function" );
        
        return fn;
    },
    
    /** Compare two objects using the comparison function to determine their
        sort order.
        @param object1  first object
        @param object2  second object
        @returns -1 if object1 preceeds object2, 0 if object1 and object2 are equal,
                 1 if object1 follows object2.
     **/
    compareObjects: function( object1, object2 )
    {
        if (!object1.valueForKeyPath || !object2.valueForKeyPath)
            throw new InvalidArgumentError( "Objects are not Key Value compliant" );
        var v1= object1.valueForKeyPath( this.keyPath );
        var v2= object2.valueForKeyPath( this.keyPath );

        var fn= this.resolveComparisonFn( v1 );
    
        return fn.call( v1, v2 );
    },
    
    /** Default comparison function which will work for Strings, Numbers, Dates,
        and Booleans. This method is meant to be called as a method of one of the
        objects to compare (via the call method).
        @returns -1,0,1 depending on sort order.
     **/
    defaultCompare: function( o )
    {
        return coherent.compareValues( this, o );
    },
    
    /** Return a SortDescriptor that sorts in the reverse order to this descriptor.
        @returns a new SortDescriptor.
     **/
    reversedSortDescriptor: function()
    {
        return new coherent.SortDescriptor( this.keyPath, !this.ascending,
                                        this.comparisonFn );
    }

});




/** Placeholders are returned by the selection attribute for controllers when
    either there is no selection or there are multiple values selected.
    Note: These can't be objects (e.g. {}) because JavaScript tests for pointer
    equality when comparing objects and this doesn't work between frames.
 **/
coherent.Markers= {

    MultipleValues: "ThisIsAnUniqueStringThatRepresentsMultipleValues",
    NoSelection: "ThisIsAnUniqueStringThatRepresentsNoSelection"

};



/** Base Controller class used for all other controllers.
 */
coherent.Controller= Class.create(coherent.Bindable, {

    /** Initialiser for the base Controller class. This performs special
     *  handling for KVO features.
     **/
    constructor: function(name)
    {
        this.base();

        this.name= name;
        this.setKeysTriggerChangeNotificationsForDependentKey( ["content"],
                                                              "selectedObjects" );
        this.setKeysTriggerChangeNotificationsForDependentKey( ["selectedObjects"],
                                                              "selection" );
        this.registerInContextWithName( this.name );
    },
    
    exposedBindings: ["editable", "content"],

    /** Retrieve whether this controller is editable. The content is editable if it
        was set directly (not via a binding) or if the bound content keyPath is
        editable.
    
        @returns true if the content of the controller is editable, false if not
     **/
    editable: function()
    {
        var editable;
    
        if (this.bindings.editable)
            editable = this.bindings.editable.value();
        else
            editable = this.__editable || true;
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();
        return editable;
    },

    /** Set the editable flag for this controller. Changes to this value are ignored
        if the content is set via a binding. Note, if the content is bound and isn't
        mutable, setting editable will have no real effect.
     **/
    setEditable: function(editable)
    {
        this.willChangeValueForKey( "editable" );
        //  Controller can't be editable if the content is not mutable
        if (this.bindings.content)
            editable &= this.bindings.content.mutable();

        if (this.bindings.editable)
            this.bingings.editable.setValue( editable );
        else
            this.__editable= editable;
        this.didChangeValueForKey( "editable" );
    },

    /** Observe changes to the editable property.
        @param change   The change notification data
     **/
    observeEditableChange: function(change)
    {
        this.setEditable( change.newValue );
    },

    /** Retrieve the content for this controller.
        @returns the content this Controller is managing.
     **/
    content: function()
    {
        if (this.bindings.content)
            return this.bindings.content.value();
        else
            return this.__content;
    },

    /** Set the content for this controller.
        @param newContent   the object for this Controller.
     **/
    setContent: function(content)
    {
        this.willChangeValueForKey( "content" );
        if (this.bindings.content)
            this.bindings.content.setValue( content );
        else
            this.__content= content;
        this.didChangeValueForKey( "content" );
    },

    /** Observe changes to the content binding.
        @param change   the change data
     **/
    observeContentChange: function(change)
    {
        this.setContent( change.newValue );
    },

    /** Register this Controller with the bindings context using the given name.
     **/
    registerInContextWithName: function(name)
    {
        coherent.registerModelWithName( this, name );
    },

    /** Retrieve the selected objects.
     **/
    selectedObjects: function()
    {
        return [this.content()];
    },

    /** Retrieve a proxy for the selection.
     **/
    selection: function()
    {
        var mutable= true;
        if (this.bindings.content)
            mutable= this.bindings.content.mutable();
        return new coherent.SelectionProxy( this.selectedObjects(), mutable );
    }
});


coherent.SelectionProxy= Class.create(coherent.KVO, {

    constructor: function(selectedObjects, mutable)
    {
        this.selectedObjects= selectedObjects;
        this.mutable= mutable;
    },
    infoForKey: function(key)
    {
        var keyInfo= this.selectedObjects.infoForKeyPath( key );
        keyInfo.mutable &= this.mutable;
        return keyInfo;
    },
    infoForKeyPath: function(keyPath)
    {
        var keyInfo= this.selectedObjects.infoForKeyPath( keyPath );
        keyInfo.mutable &= this.mutable;
        return keyInfo;
    },
    
    translateValue: function(value)
    {
        if ("array"!==coherent.typeOf(value))
            return value;
    
        //  handle single element array
        if (1===value.length)
            return value;
        
        var i;
        var len;
        var v= value[0];
    
        for (i=1, len=value.length; i<len; ++i)
        {
            if (0!==coherent.compareValues( v, value[i] ))
                return coherent.Markers.MultipleValues;
        }
    
        return v;
    },
    valueForKey: function(key)
    {
        if (0===this.selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= this.selectedObjects.valueForKey( key );
        return this.translateValue( result );
    },
    valueForKeyPath: function(keyPath)
    {
        //  handle no selection placeholder
        if (0===this.selectedObjects.length)
            return coherent.Markers.NoSelection;

        var result= this.selectedObjects.valueForKeyPath( keyPath );
        return this.translateValue( result );
    },
    setValueForKey: function(value, key)
    {
        if (!this.mutable)
            return;
        this.selectedObjects.setValueForKey( value, key );
    },
    setValueForKeyPath: function(value, keyPath)
    {
        if (!this.mutable)
            return;
        this.selectedObjects.setValueForKeyPath( value, keyPath );
    },
    addObserverForKeyPath: function(observer, callback, keyPath, context)
    {
        this.selectedObjects.addObserverForKeyPath( observer, callback, keyPath, context );
    },
    removeObserverForKeyPath: function(observer, keyPath)
    {
        this.selectedObjects.removeObserverForKeyPath( observer, keyPath );
    }
});



/** Constructor for an coherent.ArrayController, which manages the interaction between an
    array-based model object and a view (ContentBinding).
 **/
coherent.ArrayController= Class.create(coherent.Controller, {

    constructor: function(name)
    {
        this.base(name);
        this.clearsFilterPredicateOnInsertion= true;
        this.setKeysTriggerChangeNotificationsForDependentKey( ["selectionIndexes"],
                                                              "selectedObjects" );
        this.setKeysTriggerChangeNotificationsForDependentKey( ["selectionIndexes"],
                                                              "selectionIndex" );
    },
    
    exposedBindings: ["content", "selectionIndexes", "sortDescriptors",
                      "filterPredicate", "contentForMultipleSelection"],
                      
    /** Set the array of object managed by this controller. This triggers a change
        to the arrangedObjects property.
    
        @param newContent   the array of objects to use for the new content.
     **/
    setContent: function(newContent)
    {
        var selectedObjects= this.selectedObjects();
        this.willChangeValueForKey( "content" );
        if (this.bindings.content)
            this.bindings.content.setValue( newContent );
        else
            this.__content= newContent;
        //  need to update the arrangedContent attribute
        this.rearrangeObjects( newContent );
        this.didChangeValueForKey( "content" );
    },
    
    /** Retrieve the sort descriptors for this coherent.ArrayController.
        @returns an array of sort descriptors or an empty array if there are no
                 sort descriptors defined.
     **/
    sortDescriptors: function()
    {
        if (this.bindings.sortDescriptors)
            return this.bindings.sortDescriptors.value() || [];
        else
            return this.__sortDescriptors || [];
    },
    
    /** Set the sort descriptors for this coherent.ArrayController
        @param descriptors  the sort descriptors used for sorting the contents of
                            this coherent.ArrayController.
     **/
    setSortDescriptors: function(descriptors)
    {
        this.willChangeValueForKey( "sortDescriptors" );
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue( descriptors );
        else
            this.__sortDescriptors= descriptors;
        this.didChangeValueForKey( "sortDescriptors" );
        this.rearrangeObjects();
    },
    
    /** Observe changes to the bound sort descriptors.
        @param change   the change notification data
     **/
    observeSortDescriptorsChange: function(change)
    {
        this.setSortDescriptors( change.newValue );
    },
    
    /** Retrieve the filter predicate function.
        @returns the function used to filter the content or null if no predicate
                 has been specified.
     **/
    filterPredicate: function()
    {
        if (this.bindings.filterPredicate)
            return this.bindings.filterPredicate.value();
        else
            return this.__filterPredicate;
    },
    
    /** Set the filter predicate for this coherent.ArrayController. Calls rearrangeObjects to
        update the value of arrangedObjects.
        @param  predicate   The filter predicate that should be used to limit the
                            content presented via the arrangedObjects property
     **/
    setFilterPredicate: function(predicate)
    {
        this.willChangeValueForKey( "filterPredicate" );
        if (this.bindings.filterPredicate)
            this.bindings.filterPredicate.setValue( predicate );
        else
            this.__filterPredicate= predicate;
        this.didChangeValueForKey( "filterPredicate" );
        this.rearrangeObjects();
    },
    
    /** Observe changes to the filter predicate attribute.
        @param change   the change notification data
     **/
    observeFilterPredicateChange: function(change)
    {
        this.setFilterPredicate( change.newValue );
    },
    
    /** Filter an array of objects according to the filterPredicate. This actually
        operates only on the indexes of the array.
    
        @param content  the content array to filter
    
        @returns the indexes that pass the filter predicate.
     **/
    filterObjects: function(content)
    {
        var filterPredicate= this.filterPredicate();

        if (!filterPredicate)
            return IndexRange(0, content.length-1);
        
        var indexes=[];
    
        //  First filter the content, because it's always quicker to sort fewer
        //  elements than more.
        var i;
        var len;
        var v;
    
        //  Initialise the arranged object array to an empty array
        for (i=0, len=content.length; i<len; ++i)
        {
            v= content[i];
            if (filterPredicate(v))
                indexes.push(i);
        }

        return indexes;
    },
 
    /** Sort an array of objects according to the sortDescriptors. This actually
        works only on the indexes of the array.

        @param content  the content array to sort
        @param indexes  the indexes of the array to sort
    
        @returns the indexes array arranged in order based on the sortDescriptors
                 and the content.
     **/
    sortObjects: function(content, indexes)
    {
        indexes= indexes || IndexRange(0, content.length-1);

        /** A simple sort function that uses all the sort descriptors associated
            with this coherent.ArrayController. The first descriptor that returns a non-zero
            value (AKA not equal) terminates the comparison. Note, this sort
            function receives the indexes from the arranged array and uses those
            indexes to find the objects to compare in the content array.
        
            @param index1   the index in the content array of the first object
            @param index2   the index in the content array of the second object
            @returns -1 if obj1 is less than obj2, 0 if the two objects are equal,
                     1 if obj1 is greater than obj2.
         **/
        var sortDescriptors= this.sortDescriptors();
        function sortFunction(index1, index2)
        {
            var s;
            var len;
            var result;
            var obj1= content[index1];
            var obj2= content[index2];

            for (s=0, len=sortDescriptors.length; s<len; ++s)
            {
                result= sortDescriptors[s].compareObjects( obj1, obj2 );
                if (!sortDescriptors[s].ascending)
                    result*=-1;
                if (0!==result)
                    return result;
            }
        
            return 0;
        }
    
        //  Now sort the arranged indexes array -- the actual sort is defined above.
        if (0!==sortDescriptors.length)
            indexes.sort( sortFunction );
    
        //  Determine the actual array of arranged objects by pulling out the object
        //  corresponding to the arranged index.
        return indexes;
    },

    /** Filter and Sort an array of objects according to the filterPredicate and
        sortDescriptors.
        @param content  the content array to filter & sort.
        @returns a copy of the content array filtered and sorted.
     **/
    arrangeObjects: function(content)
    {
        //  This contains the indexes of the content objects after being arranged
        //  according to the filter predicate and sort descriptors.
        var arranged= this.filterObjects( content );
    
        //  Sort the content objects based on the sortDescriptors
        arranged= this.sortObjects( content, arranged );
    
        //  corresponding to the arranged index.
        return content.objectsAtIndexes(arranged);
    },
    
    /** Rearrange the content objects according to the filter predicate and sort
        descriptors. Signals an KVO notification for arrangedObjects.
     **/
    rearrangeObjects: function(newContent)
    {
        var content= newContent || this.content() || [];
    
        var arrangedObjects= this.arrangeObjects( content );

        //  Determine new selection
        var selectionIndexes= [];
        var sel;
        var i;
    
        var selectedObjects= this.selectedObjects();
        for (i=0; i<selectedObjects.length; ++i)
        {
            sel= arrangedObjects.indexOf( selectedObjects[i] );
            if (-1!==sel)
                selectionIndexes.push( sel );
        }

        this.setValueForKey( arrangedObjects, "arrangedObjects" );
        this.setValueForKey( selectionIndexes, "selectionIndexes" );
    },
    
    /** Retrieve the objects that are selected.
        @returns the selected objects.
     **/
    selectedObjects: function()
    {
        var arranged= this.arrangedObjects;
        if (!arranged)
            return [];
        return arranged.objectsAtIndexes(this.selectionIndexes());
    },
    
    /** Set the objects that are selected. This really only works if each object
        appears only once in the arrangedObject array, otherwise, the first instance
        will be selected and subsequent instances will be ignored.
    
        @param selectedObjects  the array of objects to select
        @returns true if the selection changed
     **/
    setSelectedObjects: function(selectedObjects)
    {
        var selectionIndexes= [];
        var i;
        var index;
        var arrangedObjects= this.arrangedObjects;
    
        for (i=0; i<selectedObjects.length; ++i)
        {
            index= arrangedObjects.indexOf( selectedObjects[i] );
            //  Can't select an object that isn't in the arranged object array.
            if (-1===index)
                continue;
            selectionIndexes.push( index );
        }
    
        //  Set the selected indexes based on the indexes computed above
        this.willChangeValueForKey( "selectedObjects" );
        var result= this.setSelectionIndexes( selectionIndexes );
        this.didChangeValueForKey( "selectedObjects" );
    
        return result;
    },
    
    /** Retrieve the selected indexes for this ArrayController. Contrary to Apple's
        documentation for selectionIndexes, these are in terms of the arrangedObjects
        rather than the content array.

        @returns an array of selected indexes, an empty array is returned when there
                 is nothing selected.
     **/
    selectionIndexes: function()
    {
        if (this.bindings.selectionIndexes)
            return this.bindings.selectionIndexes.value() || [];
        else
            return this.__selectionIndexes || [];
    },
    
    /** Set the selected indexes for this ArrayController. Contrary to Apple's
        documentation for selectionIndexes, these are in terms of the arrangedObjects
        rather than the content array.
    
        @param selectionIndexes  the new array of selected indexes
        @returns true if the selection was modified
     **/
    setSelectionIndexes: function(selectionIndexes)
    {
        //  First I need to sort the selectionIndexes, otherwise I can't compare them
        //  against the current selectionIndexes.
        selectionIndexes= selectionIndexes || [];
        selectionIndexes.sort();
    
        //  If the selected indexes are the same, then don't bother changing them.
        if (0===this.selectionIndexes().compare(selectionIndexes))
            return false;

        this.willChangeValueForKey( "selectionIndexes" );
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue( selectionIndexes );
        else
            this.__selectionIndexes= selectionIndexes;
        this.didChangeValueForKey( "selectionIndexes" );
        return true;
    },
    
    /** Observe changes to the selectionIndexes binding.
        @param change   the change data
     **/
    observeSelectionIndexesChange: function(change)
    {
        this.setSelectionIndexes( change.newValue );
    },
    
    /** Set the single selection index -- for single-select controls.

        @param selectedIndex    the index of the object to select.
        @returns true if the selection changed
     **/
    setSelectionIndex: function(selectionIndex)
    {
        this.willChangeValueForKey( "selectionIndex" );
        var result= this.setSelectionIndexes( [selectionIndex] );
        this.didChangeValueForKey( "selectionIndex" );
        return result;
    },
    
    /** Retrieve the selection index -- the first element in the list of selected
        indexes.
        @returns the first element in the selectionIndexes array.
     **/
    selectionIndex: function()
    {
        var selectionIndexes= this.selectionIndexes();
        if (0===selectionIndexes.length)
            return -1;
        
        return selectionIndexes[0];
    }
});

