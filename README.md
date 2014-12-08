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
    filter:function .A function that adheres to function(dirname) which returns true if the directory must be included
```

**callback**: Function . Callback function that adheres to the format function(err,out)

###nested(directory,[options],callback)

Retrieves a nested listing of all the folders within a directory.The *default* returned object will adhere to the structure 

```
{
    name: Name of the folder
    dir: Object. Keys are folder names , values are objects with the same structure as this that represent the nested folders
    dirnames:Array of strings,containg the names of the immediate child folders
    filenames:Array of filenames in directory.This property ONLY exists if includeFiles==true for the below options
}
```
This can be changed by altering the **options** newFile and newFolder argument.

**directory**: String .Path to directory.

**options**: Object

Possible options:
``` none
    noHidden : Boolean .Whether to list hidden directories , ie those that start with '.'. Default : false , hidden folders will be shown 
    includeFiles:Boolean.Whether to add file listing to the returned object. Default false.
    filter : function. A function that adheres to the format(dirname).Return false if you do not desire the file passed to you
    newFile: function to execute on encountering a file in the filepath when includeFiles is true . function(parent,filename,absolutefilepath)
    newFolder: function to execute on encountering a folder.function(parent,filename,absolutefilepath). Be aware that the first call will have an undefined parent as 
    it will be the root folder object
```

**callback**: Function . Callback function that adheres to the format: function(err,out)

Example of projection mapping
```js
//example 
var path = require('path');
var getdir=require('../');

var newFolder=function(parent,name,abspath)
{
    var newFolder= new LocalFolder(name,abspath);
    parent&&parent.link(newFolder);
    return newFolder;
};

getdir.nested(path.resolve('./'),{noHidden:true},function(err,out)
{
    //etc
});

```

###list(root,relpath)

Retrieves the correct folder object from the tree relative to the root path of the folder directory

**root**: Object. The **standard** output object from the **nested** function.This only works if you have not modified the newFolder and newFile arguments in the options object 

**relpath**: String. A relative path to the root object.

Returns undefined if no structure exists within the root object that follows that path else returns the relative root that adheres to the path.It will have the same structure as the output from **nested**

```js
var path = require('path');
var getdir=require('../');

getdir.nested(path.resolve('./'),function(err,out)
{
    var relroot=gedir.list(out,"some/relative/path");
});

```

