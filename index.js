var fs=require('fs');
var path=require('path');

exports.flat=function (dir,opt,cb)
{
    if (arguments.length==2)
        cb=opt;

    opt||(opt={});

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
            if (opt.noHidden&&inQuestion[0]=='.'||(opt.ignore&&opt.ignore.indexOf(inQuestion)!=-1))
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

                    if (ev.isDirectory())
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

    var accumulator={name:path.basename(dir),dir:[]};

    var inError=false;
    var callbacksFinished=0;
    var callbacksAwaited=1;

    function DirectoryCheckDone()
    {
        if (++callbacksFinished==callbacksAwaited)
            cb(null,accumulator);
    }

    function getDirectories(dir,outDir,outFiles)
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
                if (opt.noHidden&&inQuestion[0]=='.')
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
                            var newOutputObj={name:theFile,dir:[]};
                            outDir.push(newOutputObj);
                            getDirectories(fileDir,newOutputObj.dir,opt.includeFiles&&(newOutputObj.files=[]));
                        }
                        else if (opt.includeFiles)
                            outFiles.push(theFile);

                        if (++counter==c)
                            DirectoryCheckDone();
                    }
                })(fileDir,inQuestion));
            }
        });
    }
    getDirectories(dir,accumulator.dir,opt.includeFiles&&(accumulator.files=[]));
};