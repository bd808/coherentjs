/*jsl:import base.js*/





/** Lookup a ValueTransformer instance by name. If a value transformer
    with the specified name has not already been registered, this method
    attempts to locate a constructor with the same name -- creating
    an instance of the named class.
    
    @param transformerName  the name of the value transformer
    @returns a reference to the specifed value transformer
    @throws Exception/InvalidArgument if the transformerName does not
            specify either a pre-registered value transformer or a
            constructor for a value transformer.
 **/
coherent.findTransformerWithName= function(transformerName)
{
    if (!this.namedTransformers)
        this.namedTransformers= {};
        
    var valueTransformer= this.namedTransformers[transformerName];
    if (valueTransformer)
        return valueTransformer;
    
    //  try to create an instance of the specified type
    try
    {
        valueTransformer= eval( "new " + transformerName + "()" );
        this.namedTransformers[transformerName]= valueTransformer;
        return valueTransformer;
    }
    catch (e)
    {
        throw new InvalidArgumentError("The transformerName argument does not specify a valid ValueTransformer instance or constructor: " +
                                       transformerName);
    }
};

/** Register an instance of a ValueTransformer with a specific name.

    @param valueTransformer the value transformer instance or constructor
                            to register
    @param name             the name by which this value transformer is known
    
    @throws Exception/InvalidArgument if the valueTransformer parameter
            doesn't specify either a constructor or an instance of a valid
            ValueTransformer subclass.
 **/
coherent.registerTransformerWithName= function(valueTransformer, name)
{
    if ("string"==typeof(valueTransformer))
    {
        name= valueTransformer;
        var valueTransformerClassName= valueTransformer;
        try
        {
            valueTransformer= eval(valueTransformerClassName);
        }
        catch (e)
        {
            throw new InvalidArgumentError("The valueTransformer argument does not specify a valid ValueTransformer instance or constructor: " +
                                           valueTransformerClassName);
        }
        //  construct the value transformer if it's a contructor
        if ("function"==typeof(valueTransformer))
            valueTransformer= new valueTransformer();
    }
    
    //  make certain it really is a value transformer
    if (!valueTransformer.transformedValue)
        throw new InvalidArgumentError( "The valueTransformer argument does not support the ValueTransformer method transformedValue" );

    if (!this.namedTransformers)
        this.namedTransformers= {};
        
    this.namedTransformers[name]= valueTransformer;
}




/** Simple ValueTransformer that reverses the truth value of a key
 **/
coherent.NotTransformer= {};
coherent.NotTransformer.transformedValue= function(value)
{
    return (value?false:true);
}
coherent.NotTransformer.reverseTransformedValue= function(value)
{
    return !!value;
}
coherent.registerTransformerWithName(coherent.NotTransformer, "Not");




/** ValueTransformer that returns true only for a particular value.
 **/
coherent.BooleanTransformer= function(trueValue, falseValue)
{
    this.trueValue= trueValue;
    this.falseValue= falseValue;
}
coherent.BooleanTransformer.prototype.transformedValue= function(value)
{
    return (value==this.trueValue);
}
coherent.BooleanTransformer.prototype.reverseTransformedValue= function( value )
{
    return (value?this.trueValue:this.falseValue);
}




/** ValueTransformer that returns true only for values matching a regex
 **/
coherent.RegexTransformer=function(trueRegex)
{
    this.trueRegex= trueRegex;
}
coherent.RegexTransformer.prototype.transformedValue= function(value)
{
    return this.trueRegex.test(value);
}




/** A transformer that maps between two lists of values.
 **/
coherent.GenericTransformer= function(modelValues, displayValues)
{
    this.modelValues= modelValues;
    this.displayValues= displayValues;
}
coherent.GenericTransformer.prototype.transformedValue=function(value)
{
    var index= this.modelValues.indexOf(value);
    if (-1==index)
        return undefined;
    else
        return this.displayValues[index];
}
coherent.GenericTransformer.prototype.reverseTransformedValue=function(value)
{
    var index= this.displayValues.indexOf(value);
    if (-1==index)
        return undefined;
    else
        return this.modelValues[index];
}




coherent.TruncatingTransformer= function(max)
{
    this.max= max || 50;
}
coherent.TruncatingTransformer.prototype.ellipsis= String.fromCharCode(0x2026);
coherent.TruncatingTransformer.prototype.transformedValue= function(value)
{
    if (!value && 0!==value)
        return value;

    value= "" + value;
    var len= value.length;
    if (len<=this.max)
        return value;

    //  Perform the ellipsis trick
    var half= this.max/2-2;
    
    //  Have to use Unicode character rather than entity because otherwise this
    //  won't work as a text binding.
    return [value.substr(0, half), this.ellipsis, value.substr(len-half)].join(' ');
}

coherent.Truncated= new coherent.TruncatingTransformer(50);
coherent.registerTransformerWithName( coherent.Truncated, "Truncated" );


