/*jsl:import base.js*/

var Class= (function(){

    function wrapConstructorForBase(construct, superclass)
    {
        var wrapped;
        
        if (!construct && !superclass)
            return construct;
            
        if (!construct)
            wrapped= function()
            {
                superclass.apply(this, arguments);
            };
        else
        {
            var callsBase= /this\.base/.test(construct);

            if (!callsBase && !superclass)
                return construct;
                
            if (!callsBase)
                wrapped= function()
                {
                    superclass.call(this);
                    construct.apply(this, arguments);
                };
            else
                wrapped= function()
                {
                    var prev= this.base;
                    this.base= superclass||function(){};
                    try
                    {
                        construct.apply(this, arguments);
                    }
                    finally
                    {
                        this.base= prev;
                    }
                };
        }
        
        wrapped.valueOf= function()
        {
            return construct;
        }
        wrapped.toString= function()
        {
            return String(construct);
        }
        return wrapped;
    }
    
    /** Create a constructor for a class. Depending on whether the constructor
     *  exists, the superclass exists, and whether the constructor calls its
     *  ancestor constructor, this function returns a wrapper function that
     *  is invoked first.
     */
    function makeConstructor(construct, superclass)
    {
        if (construct && !(construct instanceof Function))
            throw new Error('Invalid constructor');
        if (superclass && !(superclass instanceof Function))
            throw new Error('Invalid superclass');
        
        //  Remove the postConstruct wrapping around the constructor for the
        //  superclass.
        superclass= superclass?superclass.valueOf():null;
        
        //  If the constructor calls this.base, wrap it with the appropriate
        //  stuff.
        construct= wrapConstructorForBase(construct, superclass);

        var wrapped;
        
        if (construct)
            wrapped= function()
            {
                construct.apply(this, arguments);
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();
            };
        else
            wrapped= function()
            {
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();
            }
            
        //  make wrapped constructor look like the original
        wrapped.valueOf= function()
        {
            return construct;
        }
        wrapped.toString= function()
        {
            return String(construct||wrapped);
        }
        return wrapped;
    }

    /** Create a prototype with the minimum amount of closure baggage.
     */
    function makePrototype(superclass)
    {
        function silent() {}
        silent.prototype= superclass.prototype;
        return new silent();
    }

    /** Create a method wrapper that has access to the base method. Because
     *  of the wrapping of methods, I define a valueOf member on the wrapped
     *  method to return the original method. That allows the code to determine
     *  whether this method is the same as another.
     */
    function wrapMethodForBase(method, ancestorMethod)
    {
        if (!method || !/this\.base/.test(method))
            return method;
            
        function fn()
        {
            try
            {
                var prev= this.base;
                this.base= ancestorMethod||function(){};
                return method.apply(this, arguments);
            }
            finally
            {
                //  no matter WHAT happens in method, base will be restored
                this.base= prev;
            }
        }
        fn.valueOf= function()
        {
            return method;
        }
        fn.toString= function()
        {
            return String(method);
        }
        return fn;
    }
    
    /** Add a member to the prototype for a new class. If the value is a
     *  function, determine whether it calls 'this.base' to access its ancestor
     *  method and if so, wrap it in a closure which provides access to the
     *  ancestor method.
     */
    function addMember(proto, name, value)
    {
        var ancestorValue= proto[name];

        //  determine whether value is a function that calls this.base()
        if (ancestorValue instanceof Function &&
            value instanceof Function &&
            ancestorValue.valueOf()!=value.valueOf())
        {
            value= wrapMethodForBase(value, ancestorValue);
        }

        proto[name]= value;
        
        if (value instanceof Function && proto.markPropertyNonEnumerable)
            proto.markPropertyNonEnumerable(name);
        
        return value;
    }

    /** Walk the class hierarchy to call the __subclassCreated hooks if
     *  present. Passes a reference to the newClass constructor.
     */
    function postSubclassNotification(newClass)
    {
        var klass;
        for (klass= newClass.superclass; klass; klass=klass.superclass)
            if ('__subclassCreated' in klass)
                klass.__subclassCreated(newClass);
    }


    return {
    
        /** Internet Explorer does not support properties. How unfortunate.
         */
        createProperties: function(klass, klassName)
        {
            if (!('__lookupGetter__' in Object.prototype))
                return;
            
            var prop;
            var propName;
            var p;
            var fn;
            var properties= {};
    
            //  collect the getter/setter pairs
            for (p in klass) {
                //  skip properties that are getter/setter pairs
                if (klass.__lookupGetter__(p) ||
                    klass.__lookupSetter__(p))
                    continue;
                fn= klass[p];    
                //  ignore non-function properties
                if ('function'!=typeof(fn))
                    continue;
                //  ignore methods that don't begin with get or set followed by an
                //  uppercase letter
                if (!/^[s|g]et[A-Z]/.test(p))
                    continue;
                //  Skip set functions that accept more than one arg and get functions
                //  that accept any args
                switch (p.charAt(0)) {
                    case 's':
                        if (1!=fn.length)
                            continue;
                        break;
                    case 'g':
                        if (fn.length)
                            continue;
                        break;
                
                    default:
                        continue;
                        break;
                }
        
                propName= p.charAt(3).toLowerCase() + p.slice(4);
                prop= properties[propName] || {};
                prop[p.slice(0,3)]= fn;
                properties[propName]= prop;
            }
    
            //  create properties for getters & setters
            for (p in properties) {
                prop= properties[p];
                //  No sense defining a write-only property
                if (!prop.get)
                    continue;
                klass.__defineGetter__(p, prop.get);
                if (prop.set)
                    klass.__defineSetter__(p, prop.set);
            }
    
            //  Handle prototype for the class
            if (klass.prototype)
                this.createProperties(klass.prototype, klass.name + ".prototype");
        },
        
        /** Create a class. This attempts to mimic classical OOP programming
         *  models in JavaScript. The first parameter (superclass) is optional
         *  and if not specified, the new class will have no superclass. The
         *  syntax is a bit awkward (what would you expect of trying to mimic
         *  a programming model that isn't _really_ supported), but it seems
         *  to be prevelant out there on the Internets.
         *  
         *  var Animal= Class.create( {
         *      constructor: function(name)
         *      {
         *          ...
         *      }
         *  });
         *  
         *  The constructor member of the class declaration is the metho which
         *  will be invoked when your script executes: new Animal(...). But
         *  there may be some wrapping magic going on to make inheritence work
         *  better. For example:
         *  
         *  var Cat= Class.create(Animal, {
         *      constructor: function(name, breed)
         *      {
         *          this.base(name);
         *          this.breed= breed;
         *      }
         *  });
         *  
         *  There's no _real_ base member, but Class.create actually creates
         *  a wrapper function which temporarily stashes the ancestor method
         *  in base and removes it when the method is finished. This works for
         *  any method.
         *  
         *  Additionally, you may define a class method (__subclassCreated)
         *  which will be called each time a new class is created using your
         *  class as a superclass or ancestor class. The following example
         *  defines a subclass hook function for the Animal class:
         *  
         *  Animal.__subclassCreated= function(newClass)
         *  {
         *  ...
         *  }
         *  
         *  Finally, classes may define a __postConstruct method which will be
         *  called after all constructors are invoked. In the case of Widgets,
         *  the __postConstruct method invokes their init method if the widget
         *  is available or schedules the init method if the DOM has not
         *  finished loading.
         */
        create: function(superclass, decl)
        {
            var construct;
            var proto= {};

            switch (arguments.length)
            {
                case 0:
                    throw new TypeError('Missing superclass and declaration arguments');
            
                case 1:
                    decl= superclass;
                    superclass= undefined;
                    break;
                
                default:
                    proto= makePrototype(superclass);
                    break;
            }
        
            if (decl.hasOwnProperty('constructor'))
            {
                construct= decl['constructor'];
                delete decl['constructor'];
            }
            
            construct= makeConstructor(construct, superclass);
            
            construct.prototype= proto;
            construct.prototype.constructor= construct;
            construct.superclass= superclass;
            
            this.extend(construct, decl);
        
            postSubclassNotification(construct);
        
            return construct;
        },

        /** Determine the name of the property of an object with the given
         *  value. Because the property value might appear more than once in
         *  a given object, this function might not be definitive. But for
         *  things like methods (which seldom appear more than once), it
         *  should be good enough.
         *  @returns the name of the property having the given value or null
         *  if the name could not be determined.
         */
        findPropertyName: function(obj, propertyValue)
        {
            for (var p in obj)
                if (obj[p]===propertyValue)
                    return p;
            return null;
        },
        
        /** Extend a class definition with the elements of an object literal.
         *  If the host JavaScript environment supports getters and setters
         *  (Firefox 2.0, Safari 3, SpiderMonkey, and Rhino) then this function
         *  will create appropriate getters and setters rather than copying
         *  the value.
         *  @returns the original class object.
         */
        extend: (function(){
            if ('__lookupGetter' in Object.prototype)
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            var v;
        
                            for (var p in decl)
                            {
                                var g= decl.__lookupGetter__(p);
                                var s= decl.__lookupSetter__(p);
                                if (g || s)
                                {
                                    g && proto.__defineGetter__(p, g);
                                    s && proto.__defineSetter__(p, s);
                                }
                                else
                                    addMember(proto, p, decl[p]);
                            }

                            this.createProperties(klass);
                            return klass;
                        };
            else
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            for (var p in decl)
                                addMember(proto, p, decl[p]);
                        };
        })()
    };
    
})();