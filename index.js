var fs=require('fs');
var path=require('path');

function allFilter()
{
    return true;
}
function newFile(parent,filename,path)
{
    parent.filenames.push(filename);
}
function newFolder(parent,dirname,path)
{
    var newObj=
    {
        name:dirname,
        dir:{},
        dirnames:[]
    };
    //Link to parent
    if (parent)
    {
        parent.dirnames.push(dirname);
        parent.dir[dirname]=newObj;
    }
    return newObj;
}

exports.flatSync=function(dir,opt)
{
    opt||(opt={});

    dir=path.normalize(dir);

    var accumulator=opt.asObj?{}:[];

    var files=fs.readdirSync(dir);

    var i= 0,c=files.length;
    //Optimizations to avoid stat calls
    if (opt.includeFiles)
    {
        if (!opt.asObj)
            return files;
        //Object iteration
        for (;i<c;i++)
            accumulator[files[i]]=true;
        return accumulator;
    }

    for (;i<c;i++)
    {
        var inQuestion=files[i];

        //Skip hidden files or ignored files if enabled
        if (opt.noHidden&&inQuestion[0]=='.')
            continue;

        var ev=fs.statSync(path.join(dir,inQuestion));
        var isdir=ev.isDirectory();

        if ((isdir&&!opt.onlyFiles)||(!isdir&&opt.onlyFiles))
        {
            if (opt.asObj)
                accumulator[inQuestion]=true;
            else
                accumulator.push(inQuestion);
        }
    }
    return accumulator;
};
exports.flat=function (dir,opt,cb)
{
    if (arguments.length==2)
    {
        cb = opt;
        opt=undefined
    }

    opt||(opt={});
    dir=path.normalize(dir);

    var accumulator=opt.asObj?{}:[];
    var inError=false;

    fs.readdir(dir,function(err,files)
    {
        if (err)
        {
            inError=true;
            return cb(err);
        }
        var counter= 0,c=files.length,i=0;

        //Optimizations to avoid stat calls
        if (opt.includeFiles)
        {
            if (!opt.asObj)
                return files;
            //Object iteration
            for (;i<c;i++)
                accumulator[files[i]]=true;
            return accumulator;
        }

        for (;i<c;i++)
        {
            var inQuestion=files[i];

            //Skip hidden files or ignored files if enabled
            if (opt.noHidden&&inQuestion[0]=='.')
            {
                counter++;
                continue;
            }

            fs.stat(path.join(dir,inQuestion),(function(theFile)
            {
                return function (err, ev)
                {
                    if (inError)
                        return;
                    if (err)
                    {
                        //Ignore subsequent stat results and prevent from calling callback again
                        inError=true;
                        return cb(err);
                    }

                    var isdir=ev.isDirectory();

                    if ((isdir&&!opt.onlyFiles)||(!isdir&&opt.onlyFiles))
                    {
                        if (opt.asObj)
                            accumulator[inQuestion]=true;
                        else
                            accumulator.push(inQuestion);
                    }

                    if (++counter==c)
                        cb(null,accumulator);
                }
            })(inQuestion));
        }
    });
};
exports.nestedSync=function(dir,opt)
{
    opt||(opt={});

    opt.filter||(opt.filter=allFilter);
    opt.newFile||(opt.newFile=newFile);
    opt.newFolder||(opt.newFolder=newFolder);
    dir=path.normalize(dir);

    var accumulator=opt.newFolder(null,path.basename(dir),dir);
    if (opt.includeFile&&opt.newFolder===newFolder)
        accumulator.filenames=[];

    function getDirectories(dir,parent)
    {
        var files=fs.readdirSync(dir);

        for (var i= 0,c=files.length;i<c;i++)
        {
            var inQuestion=files[i];

            //Skip hidden files or ignored files if enabled
            if (opt.noHidden&&inQuestion[0]=='.'||!opt.filter(path.join(dir,inQuestion)))
                continue;

            var fileDir=path.join(dir,inQuestion);
            var ev=fs.statSync(fileDir);

            if (ev.isDirectory())
            {
                var newBranch=opt.newFolder(parent,inQuestion,fileDir);
                if (opt.includeFile&&opt.newFolder===newFolder)
                    newBranch.filenames=[];
                getDirectories(fileDir,newBranch);
            }
            else if (opt.includeFiles)
                opt.newFile(parent,inQuestion,fileDir);
       }
    }
     getDirectories(dir,accumulator);
    return accumulator;
};
exports.nested=function(dir,opt,cb)
{
    if (arguments.length==2)
    {
        cb=opt;
        opt=undefined;
    }

    dir=path.normalize(dir);
    opt||(opt={});
    opt.filter||(opt.filter=allFilter);
    opt.newFile||(opt.newFile=newFile);
    opt.newFolder||(opt.newFolder=newFolder);

    var accumulator=opt.newFolder(null,path.basename(dir),dir);

    var inError=false;
    var callbacksFinished=0;
    var callbacksAwaited=1;

    function DirectoryCheckDone()
    {
        if (++callbacksFinished==callbacksAwaited)
            cb(null,accumulator);
    }

    function getDirectories(dir,parent)
    {
        if (inError)
            return;

        fs.readdir(dir,function(err,files)
        {
            if (err)
            {
                inError=true;
                return cb(err);
            }

            var counter= 0,c=files.length;

            //If no files in directory ie filelength==0
            if (counter==c)
                DirectoryCheckDone();

            for (var i= 0;i<c;i++)
            {
                var inQuestion=files[i];

                //Skip hidden files or ignored files if enabled
                if (opt.noHidden&&inQuestion[0]=='.'||!opt.filter(path.join(dir,inQuestion)))
                {
                    counter++;
                    continue;
                }

                var fileDir=path.join(dir,inQuestion);
                fs.stat(fileDir,(function(fileDir,theFile)
                {
                    return function (err, ev)
                    {
                        if (inError)
                            return;
                        if (err)
                        {
                            //Ignore subsequent stat results and prevent from calling callback again
                            inError=true;
                            return cb(err);
                        }

                        if (ev.isDirectory())
                        {
                            callbacksAwaited++;
                            var newBranch=opt.newFolder(parent,theFile,fileDir);
                            if (opt.includeFile&&opt.newFolder===newFolder)
                                newBranch.filenames=[];

                            getDirectories(fileDir,newBranch);
                        }
                        else if (opt.includeFiles)
                            opt.newFile(parent,theFile,fileDir);

                        if (++counter==c)
                            DirectoryCheckDone();
                    }
                })(fileDir,inQuestion));
            }
        });
    }
    getDirectories(dir,accumulator);
};
exports.list=function(root,relpath)
{
    var chunks=path.normalize(relpath).split(path.sep);
    for (var i= 0,c=chunks.length;i<c;i++)
    {
        var chunk=chunks[i];
        root=root.dir[chunk];
        if (!root)
            return undefined;
    }
    return root;
};