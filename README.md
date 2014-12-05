#getdirs
==================
###To install :
```bash
npm install getdirs
```

###To use
```js
var getdirs=require('getdirs');

getdirs.flat(path.resolve("./"),{},function(err,out)
{
    if (!err)
        console.log(out);
   //[ 'Have Better', 'I Should' ]
});

getdirs.nested(path.resolve("./"),{},function(err,out)
{
    if (!err)
        console.log(out);
    /*
    { 
        name: 'test',
        dir:[ 
                { name: 'Have Better', dir: [Object] },
                { name: 'I Should', dir: [] } 
            ] 
    }
     */
});
```

##API

###flat(directory,[options],callback)

Retrieves a flat listing of all the folders within a directory,ie if there are nested folders, these are not listed.Flat listing is included for optimization.

**directory**: String .Path to directory.

**options**: Object

Possible options:
```
    noHidden : Boolean .Whether to list hidden directories , ie those that start with '.'. Default : false , hidden folders will be shown 
```

**callback**: Function . Callback function that adheres to the format function(err,out)

###nested(directory,[options],callback)

Retrieves a nested listing of all the folders within a directory.The returned object will adhere to the structure 

```
{
    name: Name of the folder
    dir: Array of objects with the same structure as this that represent the nested folders
}
```

**directory**: String .Path to directory.

**options**: Object

Possible options:
```none
    noHidden : Boolean .Whether to list hidden directories , ie those that start with '.'. Default : false , hidden folders will be shown 
```

**callback**: Function . Callback function that adheres to the format function(err,out)
