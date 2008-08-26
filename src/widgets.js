/*jsl:import base.js*/
/*jsl:import local.js*/
/*jsl:import model.js*/
/*jsl:import kvo.js*/
/*jsl:import transformers.js*/
/*jsl:import controllers.js*/






coherent.Style= {
    kSelectedClass: "selected",
    kDisabledClass: "disabled",
    kMarkerClass: "nullValue",
    kFocusClass: "focussed",
    kHoverClass: "hover",
    kTabContainerClass: "tabContainer",
    kAscendingClass: "asc",
    kDescendingClass: "desc"
};

coherent.Browser= {
    IE: !!(window.attachEvent && !window.opera),
    Safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Mozilla:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
};


if ('undefined'===typeof(Element))
    Element= {};

Object.extend(Element, {

    assignId: function(element)
    {
        var fn= arguments.callee;
        if (!fn.uniqueId)
            fn.uniqueId= 1;
            
        var id= element.id || ('coherent_id_' + fn.uniqueId++);
        return element.id= id;
    },
    
    /** Add and remove classes to/from an element. This preserves existing classes
        and only adds the class if it doesn't already exist and only removes classes
        that do exist.
    
        @param addClasses       either a single class name or an array of classes to
                                add to the element
        @param removeClasses    either a single class name or an array of classes to
                                remove from the element
        @param element          the element to modify
     **/
    updateClass: function(element, classesToAdd, classesToRemove)
    {
        var classes= $S(element.className.split(' '));
        var add= Set.add;
        var remove= Set.remove;
        
        var i;
        var len;
        
        if ('string'===typeof(classesToAdd))
            add(classes, classesToAdd);
        else
            for (i=0, len=classesToAdd.length; i<len; ++i)
                add(classes, classesToAdd[i]);
                
        if ('string'===typeof(classesToRemove))
            remove(classes, classesToRemove);
        else
            for (i=0, len=classesToRemove.length; i<len; ++i)
                remove(classes, classesToRemove[i]);
                
        element.className= Set.toArray(classes).join(' ');
    }
    
});


    
/** Define helper functions for sending synthetic DOM events. Of course, MSIE
    does this differently than _every_ other browser, so I define two functions
    and alias the appropriate one to `sendEvent`.
 **/
coherent.sendEvent= (function(){
    function sendEventInternetExplorer( e, eventGroup, eventName, bubbles, cancels )
    {
        var event= document.createEventObject( eventGroup );
        e.fireEvent( "on" + eventName, event );
    }

    function sendEventDom( e, eventGroup, eventName, bubbles, cancels )
    {
        var event= document.createEvent( eventGroup );
        event.initEvent( eventName, bubbles, cancels );
        e.dispatchEvent( event );
    }

    if (coherent.Browser.IE)
        return sendEventInternetExplorer;
    else
        return sendEventDom;
})();




/** Clone an element. This function works around bugs in MSIE (surprise) where
    cloning a table row doesn't work as expected.
    
    @param element  the element that should be cloned (duh)
    @returns a new element that should be exactly the same as the original
 **/
coherent.cloneElement=(function(){
    if (!coherent.Browser.IE)
        return function(e)
        {
            return e.cloneNode(true);
        };
    else
        return function(element)
        {
            var node= element.cloneNode(false);
    
            if ('TR'!=element.tagName)
            {
                node.innerHTML= element.innerHTML;
                return node;
            }

            // special handling for TRs
            var cellIndex;
            var originalCell;
            var newCell;
    
            for (cellIndex=0; cellIndex<element.children.length; ++cellIndex)
            {
                originalCell= element.children[cellIndex];
                newCell= originalCell.cloneNode(false);
                newCell.innerHTML= originalCell.innerHTML;
                node.appendChild(newCell);
            }
            return node;
        };
})();


//  Reference to the element that currently has the focus
coherent.elementWithFocus= null;

/** Event handler function for document-wide focus events. This keeps track of
    which element currently has the focus. As a result, elements which normally
    don't fully participate in focus can appear to have normal focus behaviour.
 **/
coherent.trackElementReceivingFocus= function(event)
{
    //  BUG: This next line seems to be necessary to allow Firefox to reload
    //  the page.
    if (!document.body)
        return;
        
    event= event || window.event;
    var element= event.toElement || event.target;

    var elementWithFocus= coherent.elementWithFocus;
    
    /*  Receiving element is a fake control and will not blur the control that
        previously had the focus. Therefore, I have to do it manually.
     */
    if (element && element.needsFocusHelp && elementWithFocus)
        elementWithFocus.blur();

    /*  The element losing the focus isn't a real control and therefore won't
        actually receive a blur event when another control receives the focus.
     */
    if (elementWithFocus && elementWithFocus.needsFocusHelp)
    {
        //  create a fake blur event for non-controls.
        coherent.sendEvent(elementWithFocus, "HTMLEvents", "blur", false,
                           false);
        /*
        var blurEvent= document.createEvent( "HTMLEvents" );
        blurEvent.initEvent( "blur", false, false );
        coherent.elementWithFocus.dispatchEvent( blurEvent );
        */
    }

    if (document===element)
        element= null;
    coherent.elementWithFocus= element;
}

/** Turn on global focus-tracking behaviour. This is called by all
    FocusTrackingWidgets when they are created.
 **/
coherent.enableFocusTracking= function()
{
    if (coherent.__focusTrackingEnabled)
        return;
    coherent.__focusTrackingEnabled= true;

    /*  Setup global focus tracking -- of course, MSIE uses a different event
        name than _every_ other browser...
     */
    Event.observe(document, coherent.Browser.IE?"focusin":"focus",
                  coherent.trackElementReceivingFocus, true);
}

coherent.disableFocusTracking= function()
{
    if (!coherent.__focusTrackingEnabled)
        return;
    Event.stopObserving(document, coherent.Browser.IE?"focusin":"focus",
                        coherent.trackElementReceivingFocus);
}

/** Lookup table for translating between element specifications (ala CSS
    selectors minus the class & ID stuff) and Widget types. Of course, an
    element may have a widget attribute which bypasses this table entirely.
 **/
coherent.tagToWidgetTable=
{
    'input[type=text]': 'Input',
    'input[type=password]': 'Input',
    'input[type=checkbox]': 'ToggleButton',
    'input[type=radio]': 'ToggleButton',
    'input[type=search]': 'Search',
    'textarea': 'Input',
    'input[type=button]': 'Button',
    'input[type=submit]': 'Button',
    'label': 'Label',
    'div': 'Text',
    'b': 'Text',
    'strong': 'Text',
    'em': 'Text',
    'i': 'Text',
    'q': 'Text',
    'p': 'Text',
    'span': 'Text',
    'li': 'Text',
    'h1': 'Text',
    'h2': 'Text',
    'h3': 'Text',
    'h4': 'Text',
    'td': 'Text',
    'a': 'Anchor',
    'img': 'Image',
    'input[type=image]': 'Image',
    'select': 'Select',
    'ul': 'List',
    'table': 'List'
};
/** Regular expression used for matching element specs similar to CSS. **/
coherent.specRegex= /^(\w+)\s*(?:\[(\w*)\s*=\s*(\w*)\s*\])?$/;
/** Determine whether the spec matches the element.

    @param element  the element to compare to the specification
    @param spec     the string element specification to check against this
                    element
    @returns true if the element matches the criteria in the specification
 **/
coherent.elementMatchesSpec= function( element, spec )
{
    var match= spec.match( coherent.specRegex );
    if (!match)
        return false;
    //  first check the tag
    if (element.tagName.toLowerCase()!=match[1])
        return false;
    //  IE seems to report empty match[2] & match[3] rather than length==1
    return (1==match.length) || !match[2] || (element[match[2]]==match[3]);
}
/** Determine whether the element has any bindings
 */
coherent.elementHasBindings= function(element, bindings)
{
    var i;
    var len= (bindings||[]).length;
    
    for (i=0; i<len; ++i)
        if (element.getAttribute(bindings[i] + 'KeyPath'))
            return true;
    
    return false;
}

/** Associate an element with a Widget
 **/
coherent.bindElement= function(element, relativeSource)
{
    var binding;
    var widgetClass;
    var widgetName;
    var widget;
    
    if (!coherent.dataModel)
        coherent.dataModel= new coherent.KVO();

    widgetName= element.getAttribute("widget");
    if (widgetName)
    {
        widgetClass= coherent.widgetRegistry[widgetName];
        if (!widgetClass)
            throw new InvalidArgumentError( "Invalid Widget type: " + widgetName );
    }
    else
    {
        for (binding in coherent.tagToWidgetTable)
        {
            //  skip specs that don't match
            if (!coherent.elementMatchesSpec(element, binding))
                continue;
            //  spec matches, attach to it and set it up
            widgetName= coherent.tagToWidgetTable[binding];
            widgetClass= coherent.widgetRegistry[widgetName];
            
            //  check the element to see whether it has any exposed bindings
            var bindings= widgetClass.prototype.exposedBindings;
            if (!coherent.elementHasBindings(element, bindings))
            {
                widgetClass= null;
                continue;
            }
            
            break;
        }
    }
    
    if (!widgetClass)
        return;
    
    widget= new widgetClass(element, relativeSource);
    element.__widget__= widgetClass;
}

/** Setup all the widgets within a container. All widgets are bound to the
    current context, however, the relativeSource is available for relative
    key paths (e.g. *.xxx.yyy.zzz).
    
    @param container        (optional) the HTML container in which the elements
                            to be bound are located, defaults to the document
                            object.
    @param relativeSource   a model object used for relative key path bindings
 **/
coherent.setupNode= function(container, relativeSource)
{
    if (!container)
        container= document.body;
    else
        coherent.bindElement(container, relativeSource);

    var nodes= container.childNodes;
    var len= nodes ? nodes.length : 0;
    var nodeIndex;
    var setupNode= coherent.setupNode;
    var node;
    
    for (nodeIndex=0; nodeIndex<len; ++nodeIndex)
    {
        node= nodes[nodeIndex];
        //  only recurse into element nodes that haven't already be set up
        if (1!=node.nodeType || node.__widget__)
            continue;
        setupNode(node, relativeSource);
    }
}

coherent.widgetFromElement= function(element)
{
    var lookup= coherent.WidgetLookup;
    if (!lookup || !lookup[element.id])
        return null;
    
    return lookup[element.id];
}
var $W= coherent.widgetFromElement;

coherent.unbindElement=function(element)
{
    if (!element.__widget__)
        return;
    var widget= $W(element);
    if (widget)
        widget.teardown();
}

coherent.teardownNode=function(container)
{
    if (!container)
        container= document.body;
    else
        coherent.unbindElement(container);
    
    var nodes= container.childNodes;
    var len= nodes ? nodes.length : 0;
    var nodeIndex;
    
    for (nodeIndex=0; nodeIndex<len; ++nodeIndex)
    {
        //  only recurse into element nodes
        if (1!==nodes[nodeIndex].nodeType)
            continue;
            
        coherent.teardownNode(nodes[nodeIndex]);
    }
}

coherent.teardownAll= function()
{
    coherent.disableFocusTracking();
    
    var callbacks= coherent.__unloadCallbacks;
    var len= callbacks.length;
    
    coherent.__unloadCallbacks= [];
    
    for (var i=0; i<len; ++i)
        if (callbacks[i])
            callbacks[i]();

    //  unbind everything else
    coherent.teardownNode();
}

coherent.registerUnloadCallback= function(unloadCallback)
{
    if (!('__unloadCallbacks' in this))
    {
        Event.observe(window, "unload", coherent.teardownAll);
        this.__unloadCallbacks=[];
    }
    
    this.__unloadCallbacks.push(unloadCallback);
}

coherent.unregisterUnloadCallback= function(unloadCallback)
{
    var index= (this.__unloadCallbacks||[]).indexOf(unloadCallback);
    if (-1==index)
        return;
    delete this.__unloadCallbacks[index];
}




/** A declarative part of a Widget. This is used to declare a method on a
 *  Widget which will return an array of elements matching the part specifier.
 *  Part specifiers use a limited CSS query style: [tag name].[class name]
 **/
coherent.PartFinder= (function(){

    function makePartFinder(partIds)
    {
        var len= partIds.length;
        if (1==len)
        {
            var id= partIds[0];
            
            function singlePartFinder(partIndex)
            {
                return [document.getElementById(id)];
            }
            return singlePartFinder;
        }
        
        function partFinder(partIndex)
        {
            if (1==arguments.length)
                return document.getElementById(partIds[partIndex]);
                
            var result=[];
            for (var i=0; i<len; ++i)
                result[i]= document.getElementById(partIds[i]);
            return result;
        }
        return partFinder;
    }
    
    function makeSinglePartFinder(partId)
    {
        function singlePartFinder()
        {
            return document.getElementById(partId);
        }
        return singlePartFinder;
    }
    
    function findNodesMatchingSpec(widget, partSpec)
    {
        var parts= partSpec.split('.');
        var ids= [];
        var len;
        var i;

        //  only specified a node name
        if (1==parts.length)
        {
            var nodes= widget.getElementsByTagName(parts[0]);
            len= ids.length= nodes.length;
            for (i=0; i<len; ++i)
                ids[i]= Element.assignId(nodes[i]);
        }
        else
        {
            var matchingNodes= [];
            var count= 0;
            var partRegex= new RegExp('(?:^|\\s+)'+parts[1]+'(?:\\s+|$)');
        
            nodes= widget.getElementsByTagName(parts[0]||'*');
            len= matchingNodes.length= ids.length= nodes.length;
        
            for (i=0; i<len; ++i)
            {
                var n= nodes[i];
                if (!partRegex.test(n.className))
                    continue;
            
                ids[count]= Element.assignId(n);
                matchingNodes[count]= n;
                ++count;
            }
        
            //  trim arrays
            matchingNodes.length= ids.length= count;
            nodes= matchingNodes;
        }
        
        //  Now nodes contains all the elements that match the part spec and
        //  ids contains all the matching elements IDs.
        return {
            nodes: nodes,
            ids: ids
        };
    }
    
    return {
        //  A function that resolves into a query function the first time it's
        //  called.
        singlePart: function(partSpec)
        {
            function one()
            {
                var propName= Class.findPropertyName(this, arguments.callee);
                var widget= this.widget();
                var match= findNodesMatchingSpec(widget, partSpec);
                var finder= makeSinglePartFinder(match.ids[0]);
                this[propName]= finder;
                return match.nodes[0];
            }
            return one;
        },
        
        multipleParts: function(partSpec)
        {
            function many(index)
            {
                var propName= Class.findPropertyName(this, arguments.callee);
                var widget= this.widget();
                var match= findNodesMatchingSpec(widget, partSpec);
                var finder= makePartFinder(match.ids);
                this[propName]= finder;
                if (arguments.length)
                    return match.nodes[index];
                else
                    return Array.prototype.slice.call(match.nodes, 0);
            }
            return many;
        }
    };
    
})();

/** Global part finder things...
 **/
var Part= coherent.PartFinder.singlePart;
var Parts= coherent.PartFinder.multipleParts;




/** A BaseWidget is a Bindable object.
    
    Note: Widgets can define a container element (this.container) which is the
    _real_ container of its child nodes. For example, when using a Widget with
    a TABLE element, the container is usually set to the first TBODY. This
    allows you to specify something clever in the THEAD that doesn't get stomped
    on by the body content.
 **/
coherent.BaseWidget= Class.create(coherent.Bindable, {

    constructor: function(widget, relativeSource, bindingMap)
    {
        if ('string'===typeof(widget))
            this.id= widget;
        else
        {
            this.id= Element.assignId(widget);
            this.__widget= widget;
        }
        
        if (!coherent.WidgetLookup)
            coherent.WidgetLookup= {};
        
        this.__relativeSource= relativeSource;
        if (bindingMap)
            this.__bindingMap= bindingMap;
        
        if (this.id in coherent.WidgetLookup)
        {
            throw new Error('Two widgets share the same ID: ' + this.id);
        }
        
        coherent.WidgetLookup[this.id]= this;
    },

    __postConstruct: function()
    {
        var self= this;
        
        function clearWidgetCache()
        {
            delete self.__widget;
            delete self.__container;
        }
        window.setTimeout(clearWidgetCache, 0);
        
        var widget= this.widget();
        if (widget)
        {
            this.init();
            return;
        }
    },
    
    init: function()
    {
        this.__initialising= true;
        this.setup(this.__relativeSource);
        delete this.__initialising;
    },
    
    /** Return the widget element
     */
    widget: function()
    {
        return this.__widget || document.getElementById(this.id);
    },

    /** Return the container element, which may be different from the widget
     *  itself in lists or tables.
     */
    container: function()
    {
        return this.__container || this.__widget ||
               document.getElementById(this.__containerId||this.id);
    },
    
    setContainer: function(newContainer)
    {
        if (this.__widget)
            this.__container= newContainer;
        this.__containerId= Element.assignId(newContainer);
        return newContainer;
    },
    
    /** The bindings exposed by the Base widget type. Each widget should have its
        own list of exposed bindings and may choose to hide bindings from its
        parent.
     **/
    exposedBindings: ['visible', 'class'],
    
    /** Callback method for updating the Widget in response to changes in the value
        observed by the visible binding.

        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeVisibleChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        if (change.newValue)
            widget.style.display= "";
        else
            widget.style.display= "none";
    },
    
    /** Callback method for updating the Widget's class based on changes to the
        value observed by the class binding. This method makes a special effort to
        preserve any of the special classes which the Widget library adds to some
        elements (disabled, null value, selected, focussed, and hover).

        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeClassChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        var oldClasses= $S(widget.className.split(" "));
        var newClasses= $S((change.newValue||"").split(" "));
    
        //  reset any state classes
        if (coherent.Style.kDisabledClass in oldClasses)
            Set.add(newClasses, coherent.Style.kDisabledClass);
        if (coherent.Style.kMarkerClass in oldClasses)
            Set.add(newClasses, coherent.Style.kMarkerClass);
        if (coherent.Style.kSelectedClass in oldClasses)
            Set.add(newClasses, coherent.Style.kSelectedClass);
        if (coherent.Style.kFocusClass in oldClasses)
            Set.add(newClasses, coherent.Style.kFocusClass);
        if (coherent.Style.kHoverClass in oldClasses)
            Set.add(newClasses, coherent.Style.kHoverClass);
    
        widget.className= Set.toArray(newClasses).join(" ");
    },
    
    /** A helpful method to find the child element at a particular index. This
        method uses the DOM childNodes collection and skips any non-element nodes.
        This method will return the child element from the container (if one is
        defined) or the element itself.
    
        @param index    the index of the element to return
        @returns the element at the specified index or null if there's no such
                 element (either the index was invalid or it was greater than the
                 number of elements)
     **/
    childElementAtIndex: function(index)
    {
        var container= this.container();
        if (0>index || 'undefined'==typeof(index) || null===index)
            return null;
        
        var nodes= container.childNodes;
        var nodeIndex;
    
        for (nodeIndex=0; nodeIndex<nodes.length; ++nodeIndex)
            if (1===nodes[nodeIndex].nodeType && 0===index--)
                return nodes[nodeIndex];
    
        return null;
    },
    
    /** Helper method that will remove all child elements.
        @TODO: check if setting innerHTML to "" speeds this up.
     **/
    removeAllChildElements: function()
    {
        var container= this.container();
        
        var nodes= container.childNodes;
        var len= nodes.length;

        while (len--)
        {
            if (1===nodes[0].nodeType)
                coherent.teardownNode( nodes[0] );
            container.removeChild( nodes[0] );
        }
    },
    
    /** Remove an element at the specified index. This method will remove a child
        node from the container (if one has been specified) or the element itself.
        In addition to removing the element, any Widgets in the element are first
        torn down. Additionally, if the Widget has defined a `beforeRemoveElement`
        callback method, I'll call it with the element that I'm about to remove.

        @param index    the index of the element to remove.
        @returns the element that was removed or null if the index was invalid.
     **/
    removeChildElementAtIndex: function(index)
    {
        var container= this.container();
        var e= this.childElementAtIndex( index );
        if (!e)
            return null;
        coherent.teardownNode(e);
        if (this.beforeRemoveElement)
            this.beforeRemoveElement( e );
        return container.removeChild( e );
    },
    
    /** Given a specific element, determine its index within the Widget or container
        (if one is specified). Note: This method will _only_ find direct descendants
        of the Widget (or its container). It will not make a deep scan of all
        elements.
    
        @param childElement the element to search for
        @returns the index of the specified child element or -1 if the element was
                 not found.
     **/
    indexOfChildElement: function(childElement)
    {
        var container= this.container();
        var nodes= container.childNodes;
        var nodeIndex;
    
        for (nodeIndex=0; nodeIndex<nodes.length; ++nodeIndex)
            if (1==nodes[nodeIndex].nodeType)
                if (nodes[nodeIndex]==childElement)
                    return nodeIndex;
        return -1;
    },
    
    /** Execute the given function once for each child element within this Widget.
        Note: This is a shallow pass over the elements. If you want a deep traversal
        you'll need to recursively invoke this method (or write your own method).

        @param enumFn       the function to call for each child element. If this
                            function returns the special $break token, then the
                            enumeration stops.
        @param container    (optional) the container element to enumerate, defaults
                            to either this.container or this (if this.container is
                            null).
     **/    
    enumerateChildElements: function(enumFn, container)
    {
        if (!enumFn)
            return undefined;

        container= container || this.container();
        var nodes= container.childNodes;
        var nodeIndex;
        var result;
    
        for (nodeIndex=0; nodeIndex<nodes.length; ++nodeIndex)
            if (1==nodes[nodeIndex].nodeType &&
                undefined!==(result=enumFn(nodes[nodeIndex], nodeIndex)))
            {
                return result;
            }
        
        return undefined;
    },
    
    /** Conditionally provide support for differences among browsers...
     **/
    attributeOrProperty: (function(){
        if (coherent.Browser.IE)
            return function(name)
            {
                var widget= this.widget();
                var value= widget[name];
                if (value || ""===value)
                    return value;
                return this[name];
            };
        else
            return function(name)
            {
                var widget= this.widget();
                var value= widget.getAttribute(name);
                if (value || ""===value)
                    return value;
                    
                value= widget[name];
                if (value || ""===value)
                    return value;

                return this[name];
            };
    })(),

    /** Configure the bindings for a Widget. The key path for each binding is
        expressed as an attribute on the element with "KeyPath" appended.
    
        @param relativeSource   the model object that should be used for relative
                                key paths (e.g. key paths of the form *.xxx.yyy)
     **/
    setupBindings: function(relativeSource)
    {
        var b;
        var binding;
        var keyPath;
        var fn;
        var i;
        var len;
        var widget= this.widget();
        var bindingMap= this.__bindingMap||{};
        
        //  TODO: need to remove observer if explicitly torn down
        this.__unloadCallback= this.teardown.bind(this);
        coherent.registerUnloadCallback(this.__unloadCallback);
    
        //  Now setup each one of the exposed bindings
        for (i=0, len=this.exposedBindings.length; i<len; ++i)
        {
            b= this.exposedBindings[i];
            keyPath= widget.getAttribute(b + "KeyPath")||bindingMap[b];
            if (!keyPath)
                continue;
            this.bindNameToKeyPath(b, keyPath, relativeSource, true);
        }
    
        //  Now update all the bindings
        for (b in this.bindings)
        {
            this.bindings[b].update();
        }
    },
    
    /** Remove all observers for the bound attributes. Called when this Widget is
        destroyed, however, because Javascript hasn't got a destructor or finalise
        method, this must be called manually -- in the case of Web pages, on the
        unload event.
     **/
    teardown: function()
    {
        for (var b in this.bindings)
            this.bindings[b].unbind();
        delete coherent.WidgetLookup[this.id];
        coherent.unregisterUnloadCallback(this.__unloadCallback);
    },
    
    /** Setup the bindings for this Widget including a relative source if necessary.

        @param relativeSource   (optional) a source for relative key paths (*.key)
    **/
    setup: function(relativeSource)
    {
        this.setupBindings(relativeSource);
    }
});

coherent.BaseWidget.__subclassCreated= function(subclass)
{
    if (!coherent.widgetRegistry)
        coherent.widgetRegistry={};
        
    var proto= subclass.prototype;
    if (proto.hasOwnProperty('__widget__'))
        coherent.widgetRegistry[proto.__widget__]= subclass;
}



    








/** A Widget that enables non-controls to participate in the focus system. When
    the mouse button is depressed in a FocusTrackingWidget, I simulate the focus
    and blur events necessary to make this Widget seem like it has the focus.
    
    When a FocusTrackingWidget receives the focus, the focus CSS class is added
    to the element. And when it loses the focus, the focus class is removed.
    
    @TODO: fix Firefox focus problems with child nodes.
 **/
coherent.FocusTrackingWidget= Class.create(coherent.BaseWidget, {

    setup: function(relativeSource)
    {
        var widget= this.widget();
        widget.needsFocusHelp= true;
        
        //  need to enable focus tracking or these widgets won't work.
        coherent.enableFocusTracking();
    
        //  chain to parent setup.
        this.base(relativeSource);
        
        //  SELECT elements are often used with Widgets that derived from
        //  FocusTrackingWidget, but SELECTs work correctly without the tricks, so
        //  I can skip the mousedown handler and I don't need to mark the element as
        //  needing focus help.
        if ('SELECT'!==widget.tagName)
        {
            var eventHandler= this.mouseDownSetFocus.bindAsEventListener(this);
            Event.observe(widget, "mousedown", eventHandler, false);
            this.needsFocusHelp= true;
        }
        Event.observe( widget, coherent.Browser.IE?"focusin":"focus", this.receivingFocus.bindAsEventListener(this) );
        Event.observe( widget, "blur", this.losingFocus.bindAsEventListener(this) );
    },
    
    /** Handle mouse down in the element by setting the focus to this Widget. This
        event handler stops the event from propagating (which prevents the text
        selection when the shift key is down).
     **/
    mouseDownSetFocus: function(event)
    {
        var widget= this.widget();
        Event.stop(event);
        if (coherent.elementWithFocus===widget)
            return false;
        widget.focus();
        //  Trigger fake focus event
        coherent.sendEvent(widget, "HTMLEvents", coherent.Browser.IE?"focusin":"focus", false, false);
        return false;
    },
    
    /** Called when the element has received the focus. This method adds the focus
        CSS class to this element.
     **/
    receivingFocus: function()
    {
        var widget= this.widget();
        Element.addClassName(widget, coherent.Style.kFocusClass);
    },
    
    /** Called when the element has lost the focus. This method removes the focus
        CSS class from this element.
     **/
    losingFocus: function()
    {
        var widget= this.widget();
        Element.removeClassName(widget, coherent.Style.kFocusClass);
    }

});



/** A Widget that represents basic input controls -- text, password, and search
    fields, textareas, checkboxes, and radio buttons. An InputWidget can be
    enabled or disabled based on a binding (or automatically if the value is
    undefined). Additionally, an InputWidget is set to readonly if the value
    binding is not mutable.
 **/
coherent.InputWidget= Class.create(coherent.BaseWidget, {

    /** In addition to the base bindings exposed by BaseWidget, InputWidgets have
        bindings for `value` and `enabled`. The value binding represents the value
        of the Widget -- for text fields it is the text, for checkboxes it is a
        true or false value that indicates whether the box is checked.
        The enabled binding determines whether the control is enabled or not.
     **/
    exposedBindings: ["value","enabled"],
    
    __widget__: 'Input',
    
    setup: function(relativeSource)
    {
        //  chain to parent setup.
        this.base(relativeSource);

        var widget= this.widget();
        switch (widget.type)
        {
            case 'text':
            case 'password':
            case 'textarea':
            case 'search':
                Event.observe(widget, "change",
                           this.valueChanged.bindAsEventListener(this));
                Event.observe(widget, "focus",
                           this.fieldReceivedFocus.bindAsEventListener(this));
                Event.observe(widget, "blur",
                           this.fieldLostFocus.bindAsEventListener(this));
                Event.observe(widget, "keypress",
                           this.keyPressed.bindAsEventListener(this));
                Event.observe(widget, "drop",
                           this.fieldReceivedDropEvent.bindAsEventListener(this));
                break;

            case 'checkbox':
            case 'radio':
                break;
                
            default:
                console.log('unknown InputWidget type: ' + widget.type);
                break;
        }
    
        this.editing= false;
    },
    
    /** The default placeholder text used when the value of Widget is the multiple
        values marker (coherent.Markers.MultipleValues). You can override this
        value either on derived Widgets or by setting an attribute on the input tag.
     **/
    multipleValuesPlaceholder: _("marker.input.multipleValues"),

    /** The default placeholder text used when the value of the Widget is a null
        value (null or the empty string).
     **/
    nullPlaceholder: _("marker.input.placeholder"),
    
    /** The default placeholder text used when the value of the Widget is the no
        selection marker (coherent.Markers.NoSelection).
     **/
    noSelectionPlaceholder: _("marker.input.noSelection"),
    
    /** Number of milliseconds before sending value change notification for a
        series of key presses.
     **/
    keypressUpdateTimeout: 100,
    
    /** Method called when the input field has received the focus. Derived Widgets
        can override this method to perform specific operations when editing begins.
     **/
    beginEditing: function()
    {
        this.editing= true;
    },
    
    /** Method called when the input field has lost the focus or editing has ended
        for any other reason. Derived Widgets may override this method to perform
        special cleanup operations.
     **/
    endEditing: function()
    {
        this.editing= false;
    },

    /** Display a marker value.
        @param marker   which marker value to display
     **/
    setMarkerValue: function(marker)
    {
        var widget= this.widget();

        var value= this.attributeOrProperty(marker);
        this.markerValue= marker;
        widget.value= value;
        Element.addClassName(widget, coherent.Style.kMarkerClass);
    },

    /** Remove a marker value.
     **/
    clearMarkerValue: function()
    {
        var widget= this.widget();
        this.markerValue= false;
        widget.value= "";
        Element.removeClassName(widget, coherent.Style.kMarkerClass);
    },

    /** Value change handler for edit fields.
     **/
    valueChanged: function(event)
    {
        var widget= this.widget();
        var value= widget.value;
        if (this.markerValue)
            return;

        if (this.updateTimer)
        {
            window.clearTimeout(this.updateTmer);
            this.updateTimer= null;
        }
    
        if (this.bindings.value)
            this.bindings.value.setValue(value);
    },
    
    /** Focus handler for text input fields.
     **/
    fieldReceivedFocus: function(event)
    {
        var widget= this.widget();

        if (widget.disabled || widget.readOnly)
            return;
    
        var value=null;

        if (this.bindings.value)
            value= this.bindings.value.value();
    
        //  clear out any marker text
        if (null===value || 'undefined'===typeof(value) || ""===value ||
            coherent.Markers.NoSelection===value ||
            coherent.Markers.MultipleValues===value)
        {
            this.clearMarkerValue();
        }
        this.hasFocus= true;
    },
    
    /** Blur handler for text input fields.
     **/
    fieldLostFocus: function(event)
    {
        var widget= this.widget();
        this.hasFocus= false;
        if (""===widget.value)
            this.setMarkerValue("nullPlaceholder");
        this.endEditing();
    },
    
    /** Clear the field when text is dropped on it.
     **/
    fieldReceivedDropEvent: function(event)
    {
        var widget= this.widget();
        widget.value= "";
    },
    
    /** Handler for keypress events. Installs a timeout to signal the change
        after 0.1 seconds. This is better than firing immediately, because I
        don't want to swamp the system with change notifications.
     **/
    keyPressed: function(event)
    {
        var widget= this.widget();
        if (this.updateTimer || widget.readOnly || widget.disabled)
            return;
        this.updateTimer= window.setTimeout( this.valueChanged.bind(this),
                                             this.keypressUpdateTimeout );
    },
    
    /** Callback for tracking changes to the value binding. This method will disable
        the control if the value is undefined (meaning one of the objects along the
        key path doesn't exist). Additionally, the control will be set to readonly
        if the value binding isn't mutable or if the new value is one of the marker
        values (MultipleValuesMarker or NoSelectionMarker).
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeValueChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        var newValue= change.newValue;
        
        if (this.__initialising && null===newValue)
        {
            this.bindings.value.setValue(widget.value);
            return;
        }
        
        if ('undefined'===typeof(newValue))
            widget.disabled= true;
        else if (!this.bindings.enabled)
            widget.disabled= false;
    
        widget.readOnly= !this.bindings.value.mutable() ||
                         coherent.Markers.MultipleValues===newValue ||
                         coherent.Markers.NoSelection===newValue;

        if (widget.disabled)
            Element.addClassName(widget, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(widget, coherent.Style.kDisabledClass);

        //  don't change the value if the field has the focus
        if (this.hasFocus)
            return;
        
        switch (widget.type)
        {
            case 'text':
            case 'password':
            case 'textarea':
                if (null===newValue || 'undefined'===typeof(newValue) || ""===newValue)
                    this.setMarkerValue("nullPlaceholder");
                else if (coherent.Markers.NoSelection===newValue)
                    this.setMarkerValue("noSelectionPlaceholder");
                else if (coherent.Markers.MultipleValues===newValue)
                    this.setMarkerValue("multipleValuesPlaceholder");
                else
                {
                    this.clearMarkerValue();
                    widget.value= newValue;
                }
                break;

            default:
                widget.value= newValue;
                break;
        }
    },
    
    /** Track changes to the enabled binding. This will enable or disable a control
        based on the boolean value of the binding. If
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeEnabledChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        
        if (this.__initialising && null===change.newValue)
        {
            this.bindings.enabled.setValue(!widget.disabled);
            return;
        }
        
        widget.disabled= !change.newValue;
        if (widget.disabled)
            Element.addClassName(widget, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(widget, coherent.Style.kDisabledClass);
    }

});




/** Specialisation of InputWidget that handles radio buttons and checkboxes.
 */
coherent.ToggleButtonWidget= Class.create(coherent.InputWidget, {

    exposedBindings: ['checked', 'selection'],
    
    __widget__: 'ToggleButton',
    
    setup: function(relativeSource)
    {
        this.base(relativeSource);
        
        var widget= this.widget();
        Event.observe(widget, "click",
                      this.elementClicked.bindAsEventListener(this));
    },

    elementClicked: function(event)
    {
        var widget= this.widget();
        var checked= widget.checked;
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
        if (this.bindings.selection)
            this.bindings.selection.setValue(widget.value);
    },
    
    observeValueChange: function(change, keyPath, context)
    {
        //  do standard processing for InputWidget
        this.base(change, keyPath, context);
        
        //  update selection based on new value
        var widget= this.widget();
    },
    
    observeCheckedChange: function(change, keyPath, context)
    {
        var widget= this.widget();

        if (this.__initialising && null===change.newValue)
        {
            this.bindings.checked.setValue(widget.checked);
            return;
        }

        var newValue= !!change.newValue;
        widget.checked= newValue;
        if (this.bindings.selection)
            this.bindings.selection.setValue(null);
    },
    
    observeSelectionChange: function(change, keyPath, context)
    {
        var widget= this.widget();

        if (this.__initialising && null===change.newValue)
        {
            if (widget.checked)
                this.bindings.selection.setValue(widget.value);
            return;
        }

        var value= widget.value || (this.bindings.value?this.bindings.value.value():null);
        
        var checked= (change.newValue==widget.value);
        widget.checked= checked;
        
        if (this.bindings.checked)
            this.bindings.checked.setValue(checked);
    }
    
});




/** An inline input widget. Only displays an input box when the user clicks on
    the text.
 **/
coherent.InlineInputWidget= Class.create(coherent.InputWidget, {

    __widget__: 'InlineInput',
    
    setup: function(relativeSource)
    {
        this.base(relativeSource);

        var widget= this.widget();

        var type= widget.type;
        if ('text'!==type && 'password'!==type && 'textarea'!==type)
        {
            console.log("Invalid type (" + type + ") for InlineInputWidget.");
            return;
        }
    
        var container= this.setContainer(document.createElement("span"));
        container.className= "inlineEditor";
    
        widget.parentNode.replaceChild(container, widget);
    
        //  create the span element used to display this widget when not editing
        //  TODO: This seems like a memory leak
        this.span= document.createElement("span");
        this.span.className= this.className;
        this.span.style.display="";
        this.span.onclick= this.beginEditing.bindAsEventListener(this);
        this.span.title= "Click to edit";

    //  This seems to crash Safari    
    //  this.container.onmouseover= this.mouseEntered.bindAsEventListener(this);
    //  this.container.onmouseout= this.mouseExited.bindAsEventListener(this);
        container.appendChild(widget);
        container.appendChild(this.span);

        widget.style.display="none";
    
        this.updateValue();
    },
    
    /** Synchronise the text displayed in the span with the value contained in the
        input field.
     **/
    updateValue: function()
    {
        var widget= this.widget();
        if (!this.span)
            return;
        var textNode = document.createTextNode(widget.value);
        this.span.innerHTML = "";
        this.span.appendChild( textNode );
    },
    
    /** Overridden version of InputWidget's beginEditing method. This version hides
        the span and displays the input field. Additionally, it automatically
        focusses & selects the input field.
     **/
    beginEditing: function()
    {
        this.base();

        var widget= this.widget();
        widget.style.display = "";
        this.span.style.display = "none";
        widget.focus();
        widget.select();
        return false;
    },
    
    /** Overridden version of InputWidget's endEditing method. This version shows
        the span and hides the input field. It also updates the text in the span.
     **/
    endEditing: function()
    {
        this.base();
        var widget= this.widget();
        this.updateValue();
        this.span.style.display="";
        widget.style.display="none";
        return false;
    },
    
    /** Add a hover style to the container when the mouse enters. Disabled at the
        moment because this causes Safari to crash.
     **/
    mouseEntered: function()
    {
        Element.addClassName(this.span, "hover");
    },
    
    /** Remove the hover style to the container when the mouse exits. Disabled at
        the moment because this causes Safari to crash.
     **/
    mouseExited: function()
    {
        Element.removeClassName(this.span, "hover");
    },
    
    /** Overridden version of InputWidget's observeValueChange method. This version
        synchronises the span.
     **/
    observeValueChange: function(change, keyPath, context)
    {
        this.base(change, keyPath, context);
        this.updateValue();
    },
    
    /** Overridden version of BaseWidgets's observeVisibleChange method. This
        version makes the visibility change to the container rather than the input
        field or span.
     **/
    observeVisibleChange: function(change, keyPath, context)
    {
        if (change.newValue)
            this.container.style.display= "";
        else
            this.container.style.display= "none";
    },
    
    /** Overridden version of BaseWidget's observeClassChange method. This version
        keeps the class of the span synchronised with the input field.
     **/
    observeClassChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        coherent.BaseWidget.observeClassChange.apply( this, arguments );
        this.span.className= widget.className;
    }

});





/** A specialisation of the InputWidget that is used for searching/filtering of
    an ArrayController. In addition to the bindings exposed by InputWidgets,
    the coherent.SearchWidget exposes the `predicate` binding. The value of the predicate
    binding is a FilterPredicate function.
    
    In addition to specifying a predicateKeyPath on the HTML tag, you _must_
    specify a `predicate` attribute that is the key path to use in comparisons.
    
    @TODO: The predicate attribute _really_ ought to be a full predicate def.
 **/
coherent.SearchWidget= Class.create(coherent.InputWidget, {

    __widget__: "Search",
    
    exposedBindings: ['predicate'],
    
    setup: function(relativeSource)
    {
        //  chain to parent setup.
        this.base(relativeSource);
    },
    
    /** Search widgets should send updates sooner.
     **/
    keypressUpdateTimeout: 25,
    
    /** Overridden valueChanged method from InputWidget, in addition to performing
        the base InputWidget tasks, this method creates a new filter predicate and
        updates any observers of the predicate binding.
     **/
    valueChanged: function(event)
    {
        //  chain to parent handler
        this.base(event);
        if (this.bindings.predicate)
            this.bindings.predicate.setValue( this.createFilterPredicate() );
    },
    
    /** Create a filter predicate function that will determine whether the value
        specified by the predicate key path contains the text in the search field.
     **/
    createFilterPredicate: function()
    {
        var widget= this.widget();
        var keyPath= this.attributeOrProperty("predicate");
        var value= widget.value;
    
        function fn(obj)
        {
            var v= obj.valueForKeyPath( keyPath );
            if (v.toLocaleString)
                v= v.toLocaleString();
            else
                v= v.toString();
            return (-1!==v.indexOf(value));
        }
    
        return fn.bind( this );
    },
    
    /** Callback for observing changes to the bound predicate. This is empty because
        the search widget really doesn't update itself based on the predicate.
    
        @TODO: what should _really_ be done here?
     **/
    observePredicateChange: function(change)
    {
    }

});





/** A Widget for images. In addition to the bindings exposed by BaseWidgets,
    coherent.ImageWidgets have a src binding that represents the URL of the image to
    display.

    Like InputWidgets, coherent.ImageWidgets have placeholder values for invalid values.
    These placeholders should be URLs to the appropriate image to display under
    those circumstances. The default values are empty, so no image will be
    displayed.
 **/
coherent.ImageWidget= Class.create(coherent.BaseWidget, {

    __widget__:"Image",
    
    exposedBindings: ['src'],
    
    /** The default placeholder image used when the value of Widget is the multiple
        values marker (coherent.Markers.MultipleValues). You can override this
        value either on derived Widgets or by setting an attribute on the image tag.
     **/
    multipleValuesPlaceholder: _('marker.image.multipleValues'),
    
    /** The default placeholder image used when the value of the Widget is a null
        value (null or the empty string).
     **/
    nullPlaceholder: _('marker.image.placeholder'),
    
    /** The default placeholder image used when the value of the Widget is the no
        selection marker (coherent.Markers.NoSelection).
     **/
    noSelectionPlaceholder: _('marker.image.noSelection'),
    
    /** Method called when the input field has received the focus. Derived Widgets
        can override this method to perform specific operations when editing begins.
     **/
    observeSrcChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        var newValue= change.newValue;
        var setMarker= true;
    
        switch (newValue)
        {
            case "":
            case null:
            case undefined:
                newValue= this.attributeOrProperty("nullPlaceholder");
                break;
            case coherent.Markers.NoSelection:
                newValue= this.attributeOrProperty("noSelectionPlaceholder");
                break;
            case coherent.Markers.MultipleValues:
                newValue= this.attributeOrProperty("multipleValuesPlaceholder");
                break;
            default:
                setMarker= false;
                break;
        }
        if (setMarker)
            Element.addClassName(widget, coherent.Style.kMarkerClass);
        else
            Element.removeClassName(widget, coherent.Style.kMarkerClass);
        widget.src= newValue;
    }

});




/** A specific widget for buttons.

    @TODO: What should go in the ButtonWidget?
 **/
coherent.ButtonWidget= Class.create(coherent.BaseWidget, {

    __widget__: "Button",
    
    exposedBindings: []
    
});




/** A coherent.TextWidget is an element that displays text (surprised?) either as plain
    text or HTML. In addition to the bindings exposed by BaseWidgets, these
    Widgets have bindings for html and text.

    Note: It _probably_ doesn't make sense to bind both html & text. That would
    be silly.
 **/
coherent.TextWidget= Class.create(coherent.BaseWidget, {

    __widget__: "Text",
    
    exposedBindings: ['html', 'text'],
    
    /** The default placeholder image used when the value of Widget is the multiple
        values marker (coherent.Markers.MultipleValues). You can override this
        value either on derived Widgets or by setting an attribute on the image tag.
     **/
    multipleValuesPlaceholder: _("marker.text.multipleValues"),
    
    /** The default placeholder image used when the value of the Widget is a null
        value (null or the empty string).
     **/
    nullPlaceholder: _('marker.text.placeholder'),
    
    /** The default placeholder image used when the value of the Widget is the no
        selection marker (coherent.Markers.NoSelection).
     **/
    noSelectionPlaceholder: _('marker.text.noSelection'),
    
    setup: function(relativeSource)
    {
        this.__initialising= true;
        this.base(relativeSource);
        delete this.__initialising;
    },
    
    /** Translate a value received in a change notification. As a side effect, this
        method will add or remove the marker CSS class to/from the element.

        @param newValue the new value to be displayed.
        @returns the correct placeholder value if the value isn't valid, or the
                 original value.
     **/
    translateValue: function(newValue)
    {
        var widget= this.widget();
        var setMarker= true;
    
        switch (newValue)
        {
            case "":
            case null:
            case undefined:
                newValue= this.attributeOrProperty("nullPlaceholder");
                break;
            case coherent.Markers.NoSelection:
                newValue= this.attributeOrProperty("noSelectionPlaceholder");
                break;
            case coherent.Markers.MultipleValues:
                newValue= this.attributeOrProperty("multipleValuesPlaceholder");
                break;
            default:
                setMarker= false;
                break;
        }
        if (setMarker)
            Element.addClassName(widget, coherent.Style.kMarkerClass);
        else
            Element.removeClassName(widget, coherent.Style.kMarkerClass);
        
        return newValue;
    },
    
    /** Track changes to the text binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeTextChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        var value= this.translateValue(change.newValue);

        if (this.__initialising && null===change.newValue)
        {
            value= widget.textContent||widget.innerText;
            this.bindings.text.setValue(value);
            return;
        }
        
        var textNode = document.createTextNode(value);
        widget.innerHTML = "";
        widget.appendChild(textNode);
    },
    
    /** Track changes to the html binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeHtmlChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        var value= this.translateValue(change.newValue);

        if (this.__initialising && null===change.newValue)
        {
            value= widget.innerHTML;
            this.bindings.html.setValue(value);
            return;
        }

        //  if the value was altered (set to a placeholder), I need to escape it,
        //  because the placeholders are expected to be plain text, not HTML.
        if (value!==change.newValue)
        {
            var textNode = document.createTextNode(value);
            widget.innerHTML = "";
            widget.appendChild( textNode );
            return;
        }

        widget.innerHTML = value;
    }
    
});
    




/** A LabelWidget is just a coherent.TextWidget that can be enabled or disabled. Because
    some browsers (Safari) don't change the appearance of disabled labels, I add
    the disabled CSS class.

    @TODO: LabelWidgets should track the enabled/disabled status of their
    associated InputWidgets (via the LABEL tag's for attribute).

    In addition to the bindings exposed by coherent.TextWidgets, LabelWidgets have the
    enabled binding.
 **/
coherent.LabelWidget= Class.create(coherent.TextWidget, {

    __widget__: 'Label',
    
    exposedBindings: ['enabled'],
    
    /** Track changes to the enabled binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeEnabledChange: function(change, keyPath)
    {
        var widget= this.widget();
        widget.disabled= !change.newValue;

        if (widget.disabled)
            Element.addClassName(widget, coherent.Style.kDisabledClass);
        else
            Element.removeClassName(widget, coherent.Style.kDisabledClass);
    }

});




coherent.AnchorWidget= Class.create(coherent.LabelWidget, {

    __widget__: 'Anchor',

    exposedBindings: ['href', 'title'],
    
    observeHrefChange: function(change)
    {
        var widget= this.widget();
        widget.href= change.newValue;
    },
    
    observeTitleChange: function(change)
    {
        var widget= this.widget();
        widget.title= change.newValue;
    }

});




coherent.ListWidget= Class.create(coherent.FocusTrackingWidget, {

    __widget__: 'List',
    
    exposedBindings: ['content', 'selectionIndexes', 'selectedIndex',
                      'selectedObject'],
    KEY_UP: 38,
    KEY_DOWN: 40,
    
    setup: function(relativeSource)
    {
        var widget= this.widget();
        if ('TABLE'===widget.tagName)
            this.setContainer(widget.tBodies[0]);
            
        var container= this.container();
        
        //  get template element
        if ('SELECT'==widget.tagName)
            this.templateElement= document.createElement("option");
        else
            this.templateElement= this.removeChildElementAtIndex(0);
        this.templateElement.id= "";
        
        if ('SELECT'!=widget.tagName)
        {
            this.eventElementWasClicked=this.elementWasClicked.bindAsEventListener(this);
            this.eventKeyPressed=this.keyPressed.bindAsEventListener(this);
            Event.observe(container, "click", this.eventElementWasClicked);
            Event.observe(document, "keydown", this.keyPressed.bindAsEventListener(this));
        }
        else
            Event.observe(widget, "change",
                          this.selectedIndexChanged.bindAsEventListener(this));
    
        this.selectedIndex= widget.selectedIndex=-1;
        this.selectionIndexes= [];
        this.anchorTop= -1;
        this.anchorBottom= -1;
    
        this.sortable= (widget.getAttribute("sortable") && window.Sortable?true:false);

        this.base(relativeSource);
    },
    
    /** Handle a keydown notification.
        @param event    the HTML event object (might be null for MSIE)
        @returns false to indicate that this event has been handled
     **/
    keyPressed: function(event)
    {
        var widget= this.widget();

        //  keypress event is caught on the document, so only handle it when this
        //  widget has the focus.
        if (coherent.elementWithFocus!==widget)
            return true;

        //  Only need to trap up & down arrows
        if (this.KEY_UP != event.keyCode && this.KEY_DOWN != event.keyCode)
            return true;
            
        var selectionIndexes= this.selectionIndexes;
        var maxIndex= this.bindings.content.value().length-1;

        if (event.shiftKey && this.selectionIndexes.length)
        {
            this.anchorTop= selectionIndexes[0];
            this.anchorBottom= selectionIndexes[selectionIndexes.length-1];
        
            //  Need to extend the selection
            if (this.KEY_UP==event.keyCode && 0<this.anchorTop)
                this.anchorTop--;
            else if (this.KEY_DOWN==event.keyCode && this.anchorBottom<maxIndex)
                this.anchorBottom++;
            selectionIndexes= IndexRange(this.anchorTop,this.anchorBottom);
        }
        else if (!this.selectionIndexes.length)
        {
            //  no current selection
            if (this.KEY_UP==event.keyCode)
                this.anchorTop= this.anchorBottom= maxIndex;
            else if (this.KEY_DOWN==event.keyCode)
                this.anchorTop= this.anchorBottom= 0;
            selectionIndexes= [this.anchorTop];
        }
        else
        {
            if (this.KEY_UP==event.keyCode && this.anchorTop>0)
                this.anchorBottom= --this.anchorTop;
            else if (this.KEY_DOWN==event.keyCode && this.anchorBottom<maxIndex)
                this.anchorTop= ++this.anchorBottom;
            selectionIndexes= [this.anchorTop];
        }
    
        this.setSelection(selectionIndexes);
    
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
        Event.stop(event);
        return false;
    },
    
    /** Handle the change notification from SELECT elements.

        @param event    (ignored) the event object for this change.
     **/
    selectedIndexChanged: function(event)
    {
        //  If there's no selectionIndexes or selectionIndex binding, then there's
        //  no point in processing the selection change.
        if (!this.bindings.selectionIndexes && !this.bindings.selectedIndex &&
            !this.bindings.selectedObject)
            return;

        var widget= this.widget();
    
        var selectionIndexes;
    
        if (this.attributeOrProperty("multiple"))
            selectionIndexes= this.computeSelectionIndexes();
        else
            selectionIndexes= [this.selectedIndex=widget.selectedIndex];

        //  Update the bindings if they exist.
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
    },

    /** Compute the indexes of selected elements.

        @returns an array of indexes of the selected elements.
     **/
    computeSelectionIndexes: function()
    {
        var selectionIndexes= [];
    
        function visitNode(e, index)
        {
            if (e.selected)
                selectionIndexes.push(index);
        }
    
        //  inspect each child element to collect the selection
        this.enumerateChildElements(visitNode);
        //  return the array of selected indexes.
        return selectionIndexes;
    },
    
    /** Highlight the selected elements. Does not update bound selection.

        @param selectionIndexes the indexes of the selected elements.
     **/
    setSelection: function(selectionIndexes)
    {
        //  It's faster to clear the selection if the new array is empty
        if (!selectionIndexes || !selectionIndexes.length)
        {
            this.clearSelection();
            return;
        }
    
        var widget= this.widget();
        
        var highlight= ('SELECT'!==widget.tagName);

        //  create a copy of the selected indexes
        this.selectionIndexes= selectionIndexes.concat();
        this.selectionIndexes.sort();
        widget.selectedIndex= this.selectedIndex= this.selectionIndexes[0];
    
        var i=0;
        var len= this.selectionIndexes.length;
        selectionIndexes= this.selectionIndexes;
    
        var addClass= Element.addClassName;
        var removeClass= Element.removeClassName;
        
        function setSelectionFlag( e, index )
        {
            if (i<len && index===selectionIndexes[i])
            {
                e.selected= true;
                i++;
            }
            else
            {
                e.selected= false;
            }
        
            //  If I'm not highlighting the elements manually, I'm done.
            if (!highlight)
                return;
            if (e.selected)
                addClass(e, coherent.Style.kSelectedClass);
            else
                removeClass(e, coherent.Style.kSelectedClass);
        }
    
        this.enumerateChildElements( setSelectionFlag );
    },
    
    /** Remove the selection highlight from all elements. Does not update bound
        selection.
     **/
    clearSelection: function()
    {
        var widget= this.widget();
        
        //  should we do the class select thing
        var clearHighlight= ('SELECT'!==widget.tagName);
    
        function clearSelectedFlag(e)
        {
            if (e.selected)
                e.selected= false;
            if (clearHighlight)
                Element.removeClassName(e, coherent.Style.kSelectedClass);
        }
    
        this.enumerateChildElements( clearSelectedFlag );

        widget.selectedIndex= this.selectedIndex=-1;
        this.selectionIndexes= [];
    },
    
    /** Highlight an element to indicate selection. Does not update bound selection.

        @param index    the index of the element to select.
     **/
    selectElementAtIndex: function(index)
    {
        var widget= this.widget();
        var highlight= ('SELECT'!==widget.tagName);
        var e= this.childElementAtIndex( index );
        if (!e)
            return;
        e.selected= true;
        if (highlight)
            Element.addClassName(e, coherent.Style.kSelectedClass);
    },
    
    /** Remove the selection highlight from an element. Does not update bound
        selection.
    
        @param index    the index of the element to deselect
     **/
    deselectElementAtIndex: function(index)
    {
        var widget= this.widget();
        var highlight= ('SELECT'!==widget.tagName);
        var e= this.childElementAtIndex( index );
        if (!e)
            return;
        e.selected= false;
        if (highlight)
            Element.removeClassName(e, coherent.Style.kSelectedClass);
    },
    
    observeSelectedIndexChange: function(change, keyPath, context)
    {
        var newSelection= change.newValue?[change.newValue]:[];
        this.setSelection(newSelection);
    },
    
    observeSelectedObjectChange: function(change, keyPath, context)
    {
        var newValue= change.newValue;
        if (null===newValue || 'undefined'===typeof(newValue))
        {
            this.setSelection([]);
            return;
        }
        
        var content= this.bindings.content.value();
        var index= content.indexOf(newValue);
        var selection= (-1===index?[]:[index]);
        this.setSelection(selection);
    },
    
    observeSelectionIndexesChange: function(change, keyPath, context)
    {
        var newSelection= change.newValue || [];

        //  update highlighting
        this.setSelection( newSelection );
    },
    
    /** Update the content value based on the sort order change notification.
        @TODO: implement drag & drop for list widgets.
     **/
    sortOrderUpdated: function(e)
    {
        var oldContent;
        var newContent;
        var selectedObjects= oldContent.objectsAtIndexes( this.selectionIndexes );
        var selectedIndexes= newContent.indexesOfObjects( selectedObjects );
    
        this.bindings.content.setValue( newContent );
        this.setSelection( selectedIndexes );

        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(this.selectedIndex);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(this.selectionIndexes);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            var selectedIndex= this.selectionIndexes[0];
            var selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
    },
    
    observeContentChange: function(change, keyPath, context)
    {
        var container= this.container();
        var index;
        var changeIndex;
        var beforeNode;
        var e;
    
        switch (change.changeType)
        {
            case coherent.ChangeType.setting:
                var content= this.bindings.content.value();
                var selectedObjects= [];
                
                if (this.bindings.selectionIndexes)
                {
                    var selectionIndexes= this.bindings.selectionIndexes.value();
                    selectedObjects= content.objectsAtIndexes(selectionIndexes);
                }
                else if (this.bindings.selectedIndex)
                {
                    var selectedIndex= this.bindings.selectedIndex.value();
                    if (-1!==selectedIndex && content[selectedIndex])
                        selectedObjects= [content[selectedIndex]];
                }
                else if (this.bindings.selectedObject)
                {
                    var selectedObject= this.bindings.selectedObject.value();
                    if (selectedObject)
                        selectedObjects= [selectedObject];
                }
                
                this.removeAllChildElements();
                this.clearSelection();
                if (!change.newValue)
                    break;
            
                var frag= document.createDocumentFragment();
                //  create one option for each element in the Array
                for (index=0; index<change.newValue.length; ++index)
                {
                    if (-1!==selectedObjects.indexOf(change.newValue[index]))
                        this.selectionIndexes.push(index);
                    e= this.createElement(change.newValue[index], null, frag);
                }
                container.appendChild(frag);
                break;

            case coherent.ChangeType.insertion:
                //  add the specific indexes.
                for (index=0; index<change.indexes.length; ++index)
                {
                    beforeNode= this.childElementAtIndex(change.indexes[index]);
                    e= this.createElement(change.newValue[index], beforeNode);
                }
                this.setSelection(change.indexes);
                break;
            
            case coherent.ChangeType.replacement:
                //  set the specific indexes.
                for (index=0; index<change.indexes.length; ++index)
                {
                    e= this.childElementAtIndex(change.indexes[index]);
                    e.objectValue= change.newValue[index];
                    coherent.setup(e, this.keyPath, e.objectValue);
                }
                break;
        
            case coherent.ChangeType.deletion:
                //  Remove entries.
                index= change.indexes.length;
                selectionIndexes= this.selectionIndexes;
            
                while (index)
                {
                    selectionIndexes.splice(change.indexes[index], 1);
                    e= this.removeChildElementAtIndex(change.indexes[--index]);
                }
            
                this.setSelection( selectionIndexes );
                break;
            
            default:
                console.log( "Unknown change type: " + change.changeType );
                break;
        }

        //  Update the selection bindings based on changed content
        //  @BUG: setting the value of either of these bindings seems to cause a
        //  crash when the selection original has a value.
        if (this.bindings.selectionIndex)
            this.bindings.selectedIndex.setValue(this.selectedIndex);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(this.selectionIndexes);
        if (this.bindings.selectedObject && this.bindings.content)
        {
            selectedIndex= this.selectionIndexes[0];
            selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
    
        //  Given the changed content, the displayValues binding should probably
        //  requery for the correct values.
        if (this.bindings && this.bindings.displayValues)
            this.bindings.displayValues.update();
    },
    
    beforeRemoveElement: function( e )
    {
        var widget= this.widget();
        if ('SELECT'!=widget.tagName && this.eventElementWasClicked)
            Event.stopObserving(e, "mousedown", this.eventElementWasClicked);
    },
    
    createElement: function(relativeSource, beforeNode, container)
    {
        var widget= this.widget();
        container= container || this.container();

        var node= coherent.cloneElement(this.templateElement);
        var e= container.insertBefore(node, beforeNode || null);
        
        e.objectValue= relativeSource;
        if (this.sortable && 'SELECT'!=widget.tagName && this.eventElementWasClicked)
            Event.observe( e, "mousedown", this.eventElementWasClicked );
        coherent.setupNode(e, relativeSource);
        return e;
    },
    
    elementWasClicked: function(event)
    {
        var widget= this.widget();
        var e= event.target||event.srcElement;
        var selectedIndex=-1;
        var selectedObject=null;
        var container= this.container();
    
        while (e && e.parentNode!=container)
            e= e.parentNode;

        if (e)
        {
            selectedIndex= this.indexOfChildElement( e );
            selectedObject= e.objectValue;
        }
    
        if ('mousedown'==event.type)
        {
            this.selectElementAtIndex(selectedIndex);
            this.mouseDownIndex= selectedIndex;
            return true;
        }
    
        var selectionIndexes;
    
        if (!this.attributeOrProperty("multiple"))
            this.setSelection( selectionIndexes= [selectedIndex] );
        else
        {
            selectionIndexes= this.selectionIndexes.concat();

            if (event.shiftKey)
            {
                var range;
            
                if (selectedIndex<this.anchorTop)
                {
                    this.anchorTop= selectedIndex;
                    range= IndexRange(this.anchorTop, this.anchorBottom);
                }
                else if (selectedIndex>this.anchorBottom)
                {
                    this.anchorBottom= selectedIndex;
                    range= IndexRange(this.anchorTop, this.anchorBottom);
                }
            
                function addSelection( sel )
                {
                    if (-1===selectionIndexes.indexOf( sel ))
                        selectionIndexes.push( sel );
                }
            
                if (range)
                {
                    range.each( addSelection );
                    this.setSelection( selectionIndexes );
                }
            }
            else if (event.ctrlKey || event.metaKey)
            {
                var index= selectionIndexes.indexOf( selectedIndex );
                //  do discontiguous selection
                if (-1===index)
                {
                    this.anchorTop= this.anchorBottom= selectedIndex;
                    selectionIndexes.addObject( selectedIndex );
                }
                else
                    selectionIndexes.removeObjectAtIndex( index );
        
                this.setSelection( selectionIndexes );
            }
            else
            {
                this.anchorTop= this.anchorBottom= selectedIndex;
                this.setSelection( selectionIndexes=[selectedIndex] );
            }
        }

        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectionIndexes[0]);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue( selectionIndexes );
        if (this.bindings.selectedObject && this.bindings.content)
        {
            selectedIndex= selectionIndexes[0];
            selectedObject= (this.bindings.content.value()||[])[selectedIndex];
            this.bindings.selectedObject.setValue(selectedObject);
        }
            
        //  don't let anchors display the wacky dotted border (MSIE only?)
        if (e && 'A'==e.tagName)
            e.blur();
        return true;
    }

});




coherent.TableHeaderWidget= Class.create(coherent.BaseWidget, {

    __widget__: 'TableHeader',
    
    exposedBindings: ['sortDescriptors'],

    setup: function(relativeSource)
    {
        var widget= this.widget();
        if (!widget.rows.length)
            return;
        
        //  process columns
        var headerRow= widget.rows[0];
        var cells= headerRow.cells;
        var cellCount= cells.length;
        var sortKey;
    
        this.__selectedColumn= -1;
        this.__sortKeyIndex= {};
        
        for (var cellIndex=0; cellIndex<cellCount; ++cellIndex)
        {
            sortKey=cells[cellIndex].getAttribute("sortKey");
            if (!sortKey)
                continue;
            this.__sortKeyIndex[sortKey]= cellIndex;
        }
    
        Event.observe(headerRow, "click", this.columnClicked.bindAsEventListener(this));

        this.base(relativeSource);
    },
    
    selectedColumn: function()
    {
        return this.__selectedColumn;
    },
    
    setSelectedColumn: function(newSelectedColumn)
    {
        var widget= this.widget();
        if (!widget.rows.length)
            return;

        if (this.__selectedColumn===newSelectedColumn)
            return;
        
        var column;
        var headerRow= widget.rows[0];
    
        //  clear previously selected column
        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            var sortClass= column.__ascending?coherent.Style.kAscendingClass:
                                              coherent.Style.kDescendingClass;
            Element.updateClass(column, [],
                                [coherent.Style.kSelectedClass, sortClass]);
        }
    
        this.__selectedColumn= newSelectedColumn;

        if (-1!==this.__selectedColumn)
        {
            column= headerRow.cells[this.__selectedColumn];
            var addClass= column.__ascending?coherent.Style.kAscendingClass:
                                            coherent.Style.kDescendingClass;
            var removeClass= column.__ascending?coherent.Style.kDescendingClass:
                                                coherent.Style.kAscendingClass;
            Element.updateClass(column, [coherent.Style.kSelectedClass, addClass],
                                removeClass);
        }
    },
    
    columnClicked: function(event)
    {
        var widget= this.widget();
        var sortKey;
        var target= event.target || event.srcElement;
        while (target && !(sortKey=target.getAttribute("sortKey")))
        {
            if (target.parentNode==widget)
                return;
            target= target.parentNode;
        }
        if (!target)
            return;

        //  target now references either a TD or TH with a sortKey attribute
        var columnIndex= this.__sortKeyIndex[sortKey];
        //  check for click that changes sort order
        if (this.__selectedColumn==columnIndex)
        {
            target.__ascending = target.__ascending?false:true;
            var ascending= coherent.Style.kAscendingClass;
            var descending= coherent.Style.kDescendingClass;
            if (target.__ascending)
                Element.updateClass(target, ascending, descending);
            else
                Element.updateClass(target, descending, ascending);
        }
        else
            this.setSelectedColumn(columnIndex);
        
        //  update the sort descriptor
        var newSortDescriptor= new coherent.SortDescriptor(sortKey, target.__ascending?true:false);
        if (this.bindings.sortDescriptors)
            this.bindings.sortDescriptors.setValue([newSortDescriptor]);
    },
    
    observeSortDescriptorsChange: function(change)
    {
        var sortDescriptors= change.newValue;
        if (!sortDescriptors || !sortDescriptors.length ||
            sortDescriptors.lengt>1)
        {
            this.setSelectedColumn(-1);
            return;
        }
    
        var columnIndex= this.__sortKeyIndex[sortDescriptors[0].keyPath];
        if ('undefined'===typeof(columnIndex) || null===columnIndex)
            columnIndex=-1;
        this.setSelectedColumn(columnIndex);
    }

});




coherent.SelectWidget= Class.create(coherent.ListWidget, {

    __widget__: 'Select',
    
    exposedBindings: ['displayValues'],
    
    observeDisplayValuesChange: function(change, keyPath, context)
    {
        var widget= this.widget();
        //  assumes that the content collection has already been set
        var optionIndex;
        var option;
        var allOptions= widget.options;
        var optionsLength= allOptions.length;
    
        switch (change.changeType)
        {
            case coherent.ChangeType.setting:
                if (!change.newValue)
                    break;

                for (optionIndex=0; optionIndex<optionsLength; ++optionIndex)
                {
                    if (coherent.Browser.IE)
                        allOptions[optionIndex].innerText= change.newValue[optionIndex];
                    else
                        allOptions[optionIndex].text= change.newValue[optionIndex];
                }
                break;
            
            case coherent.ChangeType.insertion:
            case coherent.ChangeType.replacement:
                var index;
                for (index=0; index<change.indexes.length; ++index)
                {
                    optionIndex= change.indexes[index];
                    option= allOptions[optionIndex];
                    option.text= change.newValue[index];
                }
                break;
            
            default:
                console.log('Unknown change type: ' + change.changeType);
                break;
        }
    }

});




/** A Widget that manages a set of tabs and their associated panels. Each tab is
    expected to be a label element where the for attribute specifies the ID of
    the panel to display. To enable styling, the tabs may be enclosed in an
    element marked with the tabContainer class (coherent.Style.kTabContainerClass).
 **/
coherent.TabWidget= Class.create(coherent.BaseWidget, {

    __widget__: 'Tab',
    
    exposedBindings: [],
    
    useTransitions: false,
    
    setup: function(relativeSource)
    {
        this.base(relativeSource);
        this.tabClickedHandler= this.tabClicked.bindAsEventListener(this);
        this.findTabs();
    },
    
    currentTab: function()
    {
        return document.getElementById(this.__currentTabId);
    },
    
    /** Identify the tabs and wire them up.
     **/
    findTabs: function()
    {
        var tabContainerClass= coherent.Style.kTabContainerClass;
        var firstTab;
        var selectedTab;
        
        function findContainer(e)
        {
            if (tabContainerClass in $S(e.className.split(" ")))
                return e;
        }
        
        function visitElement(e)
        {
            if ('label'!=e.tagName.toLowerCase())
                return;

            Element.assignId(e);
            if (!firstTab)
                firstTab= e;
                
            if (Element.hasClassName(e, tabContainerClass))
            {
                selectedTab= e;
                this.__currentTabId= e.id;
            }
            
            Event.observe(e, "click", this.tabClickedHandler);
            var contentElement= this.contentElementForTab(e);
            if (contentElement)
                contentElement.style.display='none';
        }
    
        //  Check whether there's an explicit tab container
        this.setContainer(this.enumerateChildElements(findContainer.bind(this)));
        this.enumerateChildElements(visitElement.bind(this));

        if (!this.__currentTabId && firstTab)
        {
            this.__currentTabId= firstTab.id;
            Element.addClassName(this.currentTab(), coherent.Style.kSelectedClass);
        }
        
        this.displayContentForTab(selectedTab||firstTab);
    },

    /** Retrieve the content element for the given tab. Assuming that tabs are label
        elements, this looks up the content element by the for attribute. Good,
        semantic markup.
    
        @param tab  the tab
        @returns the associated content element for this tab or undefined if none.
     **/
    contentElementForTab: function(tab)
    {
        if (!tab)
            return null;
        return document.getElementById(tab.htmlFor);
    },

    /** Display the content for a particular ID.

        @param id   the id of the content element to display.
     **/
    displayContentForTab: function(tab)
    {
        var oldContent= this.contentElementForTab(this.currentTab());
        var newContent= this.contentElementForTab(tab);
    
        this.__currentTabId= tab.id;
    
        if (!this.useTransitions)
        {
            oldContent.style.display='none';
            newContent.style.display='';
            return;
        }

        throw new Error('Transitions not implemented');
    },

    /** Handle a mouse click on an individual tab. This activates the selected tab.

        @param event    the mouse click event
     **/
    tabClicked: function(event)
    {
        var tab= event.target||event.srcElement;

        //  TODO: This will fail if the click occurs on a child node of the label
        if (tab.id == this.__currentTabId)
            return;

        Element.removeClassName(this.currentTab(), coherent.Style.kSelectedClass);
        Element.addClassName(tab, coherent.Style.kSelectedClass);
        this.displayContentForTab(tab);
    }

});




/** A Widget that manages a set of tabs associated with URLs that should be
    displayed in an iframe. Each tab is expected to be a label element where the
    for attribute specifies the key in the srcTable of the URL to display. The
    tab panel uses an iframe. If there isn't an iframe already in the tab panel,
    one will be created automatically.
    To enable styling, the tabs may be enclosed in an element marked with the
    tabContainer class (coherent.Style.kTabContainerClass).

    @TODO: This should probably use a frame widget to represent the internal
           content element.
 **/
coherent.ExternalTabWidget= Class.create(coherent.TabWidget, {

    __widget__: 'ExternalTab',
    
    exposedBindings: ['srcTable'],
    
    waitContainerClassName: "wait",

    waitTimeout: 125,
    
    setup: function(relativeSource)
    {
        this.base(relativeSource);
        var widget= this.widget();

        /*  Find the wait message container, if there is one. This allows the tab
            panel to display a wait message while loading the content of a frame.
         */
        function findWaitContainer(e)
        {
            if (this.waitContainerClassName in $S(e.className.split(" ")))
            {
                this.waitId= Element.assignId(e);
                e.style.display='none';
                return e;
            }
        }
        this.enumerateChildElements( findWaitContainer.bind(this), widget );
    },

    wait: function()
    {
        return document.getElementById(this.waitId);
    },
    
    frame: function()
    {
        return document.getElementById(this.frameId);
    },
    
    /** Load a url into the content frame. This sets up the wait timer and more.

        @param url  the url to load into the frame.
     **/
    loadUrl: function(url)
    {
        if (this.loading===url)
            return;
    
        var widget= this.widget();
        this.loading= url;
        var frame= (widget.getElementsByTagName( "iframe" )||[])[0] ||
                   this.createFrame(url);
        if (coherent.Browser.IE)
            frame.onreadystatechange= this.readyStateChanged.bindAsEventListener(this);
        else
            frame.onload= this.frameLoaded.bindAsEventListener(this);
        
        this.loading= url;
        frame.src= url;
        this.waitTimeout= window.setTimeout(this.showWait.bind(this),
                                            this.waitTimeout);
    },

    /** Show the wait message if the load is taking a long time.
     **/
    showWait: function()
    {
        var wait= this.wait();
        if (wait)
            wait.style.display="";
        window.clearTimeout(this.waitTimeout);
        this.waitTimeout= false;
    },

    /** Create a frame for the content.

        @param url  the url to display in the frame
     **/
    createFrame: function(url)
    {
        var widget= this.widget();
        var fixIframeBug= false;
    
        if (coherent.Browser.Safari)
        {
            var safariVersionRegex= /AppleWebKit\/(\d+(?:\.\d+)?)/;
            var match= safariVersionRegex.exec(navigator.userAgent);
            if (match && parseInt(match[1],10)<420)
                fixIframeBug= true;
        }
        
        var frame;
        
        if (fixIframeBug)
        {
            /*  I need a container for the frame, because on Safari 2.0.4 setting
                the innerHTML of this element will wipe out any event handlers
                assigned to child elements.
             */
            var frameContainer= document.createElement( "div" );
            widget.appendChild( frameContainer );

            /*  Safari won't fire onload events for an iframe created via
                createElement. However, it will work if I append an iframe to the
                innerHTML. But the src attribute must have a valid value or the
                onload handler still won't be called. This is fixed in the nightly
                Safari build (7/20/2006).
             */
            frameContainer.innerHTML+= '<iframe src="' + url + '"></iframe>';
            frame= widget.getElementsByTagName( "iframe" )[0];
            frame.style.width="0";
            frame.style.height="0";
        }
        else
        {
            frame= document.createElement( "iframe" );
            frame.src= url;
            widget.appendChild(frame);
        }
        
        this.frameId= Element.assignId(frame);
        return frame;
    },

    /** Observe a change to the srcTable binding.
    
        @param change   a ChangeNotification with information about the change
        @param keyPath  the path to the value that has changed
        @param context  a client-specified value
     **/
    observeSrcTableChange: function(change, keyPath, context)
    {
        var currentTab= this.currentTab();
        if (!currentTab)
            return;
        this.displayContentForTab(currentTab);
    },

    /** Retrieve the content element for the given tab. This overridden version of
        the TabWidget method always returns the frame.
    
        @param tab  the tab
        @returns the associated content element for this tab or undefined if none.
     **/
    contentElementForTab: function(tab)
    {
        return null;
    },

    /** Display the content for a particular ID.

        @param id   the id of the content element to display.
     **/
    displayContentForTab: function(tab)
    {
        this.__currentTabId= tab.id;

        var srcTable= this.bindings.srcTable.value();
        if (!srcTable)
            return;
        var url= srcTable.valueForKey(tab.htmlFor);
        this.loadUrl(url);
    },

    /** Internet Explorer uses readystatechange to signal that the frame has
        finished loading.

        @param event    the readyState change event
     **/
    readyStateChanged: function(event)
    {
        if ("complete"===this.frame().readyState)
            this.frameLoaded(event);
    },

    /** Display the frame after it's fully loaded.

        @param event    the load event
     **/
    frameLoaded: function(event)
    {
        if (!this.loading)
            return;
        if (this.waitTimeout)
            window.clearTimeout(this.waitTimeout);
        this.waitTimeout= false;
        this.loading= false;
        var wait= this.wait();
        if (wait)
            wait.style.display='none';
            
        var frame= this.frame();
    }

});




/** A coherent.ListWidget that presents its content via a popup menu.
    This is similar to a SelectWidget, except it allows HTML in the popup values.
  
    TODO: Not finished.
 **/
coherent.PopupListWidget= Class.create(coherent.ListWidget, {

    __widget__: 'PopupList',
    
    setup: function(relativeSource)
    {
        this.base(relativeSource);
    }

});

