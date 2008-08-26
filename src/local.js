coherent.strings= {

    //  Marker strings for InputWidget
    'marker.input.multipleValues': 'Multiple Values',
    'marker.input.placeholder': '',
    'marker.input.noSelection': 'No Selection',

    //  Marker values for ImageWidget (used to specify the src)
    'marker.image.multipleValues': '',
    'marker.image.placeholder': '',
    'marker.image.noSelection': '',
    
    //  Marker strings for TextWidget
    'marker.text.multipleValues': 'Multiple Values',
    'marker.text.placeholder': 'No Value',
    'marker.text.noSelection': 'No Selection'
    
};

coherent.localisedString= function(key)
{
    if (!(key in coherent.strings))
    {
        console.log('Localisation missing string for key: ' + key);
        return key;
    }
    
    return coherent.strings[key];
}
var _= coherent.localisedString;
