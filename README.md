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
T
**directory**: String .Path to directory.

**options**: Obj

--*noHidden* : Boolean .Whether to list hidden directories , ie those that start with '.'. Default : false , hidden folders will be shown 

--*asObj*    : Boolean .Returns an object literal instead of array.

--*onlyFiles*: Boolean .Returns file names instead of directory names

--*includeFiles*: Boolean .Returns file and directory names without distinction

**callback**: Function . Callback function that adheres to the format function(err,out).Out is an array  of strings

###flatSync(directory,[options])
Synchronous version of **flat**

```js

var allFolders=getdirs.flat("/etc/");
//['something']

var allFoldersObj=getdirs.flat("/etc/",{asObj:true});
//{'something':true}

var allFiles=getdirs.flat("/etc/",{onlyFiles:true});
//['something.else']

var all=getdirs.flat("/etc/",{includeFiles:true});
//['something','something.else']

```

###nested(directory,[options],callback)

Retrieves a nested listing of all the folders within a directory.The *default* returned object will adhere to the structure 

```js
{
    //name: Name of the folder
    //dir: Object. Keys are folder names , values are these object
    //dirnames:Array of strings.Names of the immediate child folders
    //filenames:Array of filenames in directory.
    //filenames ONLY exists if includeFiles==true for the below options 
    //fileStats:Object with stat objects of file with filename as object key
    //filenames ONLY exists if includeFiles==true AND includeFileStats==true for the below options 
}
```
This can be changed by altering the **options** newFile and newFolder argument.

**directory**: String .Path to directory.

**options**: Object

--*noHidden*: Boolean .Whether to list hidden directories , ie those that start with '.'. Default : false , hidden folders will be shown 

--*includeFiles*:Boolean.Whether to add file listing to the returned object. Default false.

--*includeFiles*:Boolean.Whether to include file Stat objects. Default false

--*filter* : function. A function that adheres to the format(dirname).Return false if you do not desire the file passed to you

--*newFile*: function to execute on encountering a file in the filepath when includeFiles is true . function(parent,filename,absolutefilepath,stats)

--*newFolder*: function to execute on encountering a folder.function(parent,filename,absolutefilepath). Be aware that the first call will have an undefined parent as it will be the root folder object

**callback**: Function . Callback function that adheres to the format: function(err,out)

Example of projection mapping
```js
//example 
var path = require('path');

var newFolder=function(parent,name,abspath)
{
    var newFolder= new LocalFolder(name,abspath);
    parent&&parent.link(newFolder);
    return newFolder;
};

getdir.nested(path.resolve('./'),{noHidden:true,newFolder:newFolder},function(err,out)
{
    //etc
});

```
###nestedSync(directory,[options])
Synchronous version of **nested**

###list(root,relpath)

Retrieves the correct folder object from the tree relative to the root path of the folder directory

**root**: Object. The **standard** output object from the **nested** function.This only works if you have not modified the newFolder and newFile arguments in the options object 

**relpath**: String. A relative path to the root object.

Returns undefined if no structure exists within the root object that follows that path else returns the relative root that adheres to the path.It will have the same structure as the output from **nested**

```js
var path = require('path');

getdir.nested(path.resolve('./'),function(err,out)
{
    var relroot=gedir.list(out,"some/relative/path");
});

```

