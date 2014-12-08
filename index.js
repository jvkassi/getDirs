var fs=require('fs');
var path=require('path');

exports.flat=function (dir,opt,cb)
{
    if (arguments.length==2)
        cb=opt;

    opt||(opt={});

    //Filter that accepts all
    opt.filter||(opt.filter=function(file)
    {
        return true;
    });

    var accumulator=[];
    var inError=false;

    fs.readdir(dir,function(err,files)
    {
        if (err)
        {
            inError=true;
            return cb(err);
        }
        var counter= 0,c=files.length;

        for (var i= 0;i<c;i++)
        {
            var inQuestion=files[i];

            //Skip hidden files or ignored files if enabled
            if (opt.noHidden&&inQuestion[0]=='.')
            {
                counter++;
                continue;
            }

            fs.stat(inQuestion,(function(theFile)
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

                    if (ev.isDirectory()&&opt.filter(theFile))
                        accumulator.push(theFile);

                    if (++counter==c)
                        cb(null,accumulator);
                }
            })(inQuestion));
        }
    });
};

exports.nested=function(dir,opt,cb)
{
    if (arguments.length==2)
        cb=opt;
    opt||(opt={});

    opt.filter||(opt.filter=function(name)
    {
        return true;
    });
    opt.newFile||(opt.newFile=function(parent,filename,path)
    {
        parent.filenames.push(filename);
    });
    opt.newFolder||(opt.newFolder=function(parent,dirname,path)
    {
       var newObj=
       {
           name:dirname,
           dir:{},
           dirnames:[]
       };
       opt.includeFiles&&(newObj.filenames=[]);

       //Link ot parent
        if (parent)
        {
            parent.dirnames.push(dirname);
            parent.dir[dirname]=newObj;
        }
       return newObj;
    });

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