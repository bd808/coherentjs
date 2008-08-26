var demo={};
demo.flickr= {};

demo.flickr.API_KEY= "a7acde51e1824568044a89397b742e47";

demo.flickr.FlickrController= Class.create(coherent.AjaxController, {

    constructor: function(name, flickrMethod, contentItem)
    {
        this.base(name);
        this.contentItem= contentItem;
        
        var baseUrl= String(document.location).replace(/\w+\.html$/, '');
        if ('/'!=baseUrl.charAt(baseUrl.length-1))
            baseUrl+= '/';
            
        this.setValueForKey(baseUrl + "flickr-proxy.php", "url");
        this.parameters.setValueForKey(demo.flickr.API_KEY, "api_key");
        this.parameters.setValueForKey("json", "format");
        this.parameters.setValueForKey("1", "nojsoncallback");
        this.parameters.setValueForKey(flickrMethod, "method");
    },
    
    extractContent: function(obj)
    {
        return obj.valueForKeyPath(this.contentItem);
    }
    
});




demo.flickr.FindByUsernameController= Class.create(demo.flickr.FlickrController, {

    constructor: function(name)
    {
        this.base(name, "flickr.people.findByUsername", "user");
    },
    
    validateParameters: function()
    {
        if (!this.parameters.username)
            return false;
        return true;
    }

});




demo.flickr.UserBaseController= Class.create(demo.flickr.FlickrController, {

    exposedBindings: ['userId'],
    
    userId: function()
    {
        if (this.bindings.userId)
            return this.bindings.userId.value();
        return this.parameters.user_id;
    },
    
    setUserId: function(newUserId)
    {
        this.parameters.setValueForKey(newUserId, "user_id");
        if (this.bindings.userId)
            this.bindings.userId.setValue(newUserId);
    },
    
    observeUserIdChange: function(change)
    {
        this.setUserId(change.newValue);
    }

});




demo.flickr.UserInfoController= Class.create(demo.flickr.UserBaseController, {

    constructor: function(name)
    {
        this.base(name, "flickr.people.getInfo", "person");
        this.setKeysTriggerChangeNotificationsForDependentKey(["content"],
                                                             "iconUrl");
    },
    
    iconUrl: function()
    {
        var content= this.content();
        if (!content || !content.iconfarm || !content.iconserver)
            return "http://www.flickr.com/images/buddyicon.jpg";
        return ["http://farm", content.iconfarm, ".static.flickr.com/",
                content.iconserver, "/buddyicons/", content.nsid,
                ".jpg"].join("");
    }

});




demo.flickr.UserTagsController= Class.create(demo.flickr.UserBaseController, {

    constructor: function(name)
    {
        this.base(name, "flickr.tags.getListUser", "who.tags.tag");
    }
    
});




demo.flickr.Photo= Class.create(coherent.KVO, {

    constructor: function(json)
    {
        this.setKeysTriggerChangeNotificationsForDependentKey(
                                ["farm", "server", "id", "secret"],
                                "thumbnailUrl");
        this.setKeysTriggerChangeNotificationsForDependentKey(
                                ["farm", "server", "id", "secret"],
                                "imageUrl");
        var p;
        for (p in json) {
            if (json.hasOwnProperty(p) && !(p in this))
                this.setValueForKey(json[p], p);
        }
    },
    
    thumbnailUrl: function()
    {
        // http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}_[mstb].jpg
        return ["http://farm", this.farm, ".static.flickr.com/", this.server,
                "/", this.id, "_", this.secret, "_t.jpg"].join('');
    },
    
    imageUrl: function()
    {
        // http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}_[mstb].jpg
        return ["http://farm", this.farm, ".static.flickr.com/", this.server,
                "/", this.id, "_", this.secret, ".jpg"].join('');
    }

});    



demo.flickr.UserPhotosController= Class.create(demo.flickr.UserBaseController, {

    exposedBindings: ['tags'],
    
    constructor: function(name)
    {
        this.base(name, "flickr.photos.search", "photos.photo");
    },
    
    observeTagsChange: function(change)
    {
        this.setTags(change.newValue);
    },
    
    tags: function()
    {
        if (this.bindings.tags)
            return this.bindings.tags.value();
        return this.parameters.tags.split(',');
    },
    
    setTags: function(newTags)
    {
        this.parameters.setValueForKey(newTags.join(","), "tags");
        if (this.bindings.tags)
            this.bindings.tags.setValue(newTags);
    },
    
    extractContent: function(obj)
    {
        var content= obj.valueForKeyPath(this.contentItem);
        if (!content)
            return content;
        
        function makePhoto(photo)
        {
            return new demo.flickr.Photo(photo);
        }
    
        return content.map(makePhoto);
    }

});
