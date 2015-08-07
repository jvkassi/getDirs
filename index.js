var fs = require('fs'),
    path = require('path');

function allFilter()
{
    return true;
}

function newFile(parent, filename, path, stats)
{
    parent.filenames.push(filename);
    if (stats) parent.fileStats[filename] = stats;
}

function newFolder(parent, dirname, path)
{
    var newObj = {
        name: dirname,
        dir:
        {},
        dirnames: []
    };
    //Link to parent
    if (parent)
    {
        parent.dirnames.push(dirname);
        parent.dir[dirname] = newObj;
    }
    return newObj;
}
exports.flatSync = function(dir, opt)
{
    if (!path.isAbsolute(dir))
        path.join(process.cwd(),dir);

    opt || (opt = {});
    var accumulator = opt.asObj ?
        {} : [],
        files = fs.readdirSync(dir),
        i = 0,
        c = files.length;
    //Optimizations to avoid stat calls
    if (opt.includeFiles)
    {
        //Just return the flat listing as an array
        if (!opt.asObj) return files;
        //Object iteration
        for (; i < c; i++) accumulator[files[i]] = true;
        return accumulator;
    }
    //Otherwise we need to filter out the directorys
    for (; i < c; i++)
    {
        var inQuestion = files[i];
        //Skip hidden files or ignored files if enabled
        if (opt.noHidden && inQuestion[0] == '.') continue;
        var ev = fs.statSync(path.join(dir, inQuestion)),
            isdir = ev.isDirectory();
        if ((isdir && !opt.onlyFiles) || (!isdir && opt.onlyFiles))
        {
            if (opt.asObj) accumulator[inQuestion] = true;
            else accumulator.push(inQuestion);
        }
    }
    return accumulator;
};
exports.flat = function(dir, opt, cb)
{
    if (!path.isAbsolute(dir))
        path.join(process.cwd(),dir);
    if (arguments.length == 2)
    {
        cb = opt;
        opt = undefined
    }
    opt || (opt = {});
    var accumulator = opt.asObj ?
        {} : [],
        inError = false;
    fs.readdir(dir, function(err, files)
    {
        if (err)
        {
            inError = true;
            return cb(err);
        }
        var counter = 0,
            c = files.length,
            i = 0;
        //Optimizations to avoid stat calls
        if (opt.includeFiles)
        {
            if (!opt.asObj) return cb(null, files);
            //Object iteration
            for (; i < c; i++) accumulator[files[i]] = true;
            return cb(null, accumulator);
        }
        for (; i < c; i++)
        {
            var inQuestion = files[i];
            //Skip hidden files or ignored files if enabled
            if (opt.noHidden && inQuestion[0] == '.')
            {
                counter++;
                continue;
            }
            fs.stat(path.join(dir, inQuestion), (function(theFile)
            {
                return function(err, ev)
                {
                    if (inError) return;
                    if (err)
                    {
                        //Ignore subsequent stat results and prevent from calling callback again
                        inError = true;
                        return cb(err);
                    }
                    var isdir = ev.isDirectory();
                    if ((isdir && !opt.onlyFiles) || (!isdir && opt.onlyFiles))
                    {
                        if (opt.asObj) accumulator[inQuestion] = true;
                        else accumulator.push(inQuestion);
                    }
                    if (++counter == c) cb(null, accumulator);
                }
            })(inQuestion));
        }
    });
};
exports.nestedSync = function(dir, opt)
{
    if (!path.isAbsolute(dir))
        path.join(process.cwd(),dir);

    opt || (opt = {});
    opt.filter || (opt.filter = allFilter);
    opt.newFile || (opt.newFile = newFile);
    opt.newFolder || (opt.newFolder = newFolder);
    var accumulator = opt.newFolder(null, path.basename(dir), dir);
    if (opt.includeFiles && opt.newFolder === newFolder) accumulator.filenames = [];
    if (opt.includeFileStats) accumulator.fileStats = {};

    function getDirectories(dir, parent)
    {
        var files = fs.readdirSync(dir);
        for (var i = 0, c = files.length; i < c; i++)
        {
            var inQuestion = files[i];
            //Skip hidden files or ignored files if enabled
            if (opt.noHidden && inQuestion[0] == '.' || !opt.filter(path.join(dir, inQuestion))) continue;
            var fileDir = path.join(dir, inQuestion),
                ev = fs.statSync(fileDir);
            if (ev.isDirectory())
            {
                var newBranch = opt.newFolder(parent, inQuestion, fileDir);
                if (opt.includeFiles && opt.newFolder === newFolder) newBranch.filenames = [];
                if (opt.includeFileStats) newBranch.fileStats = {};
                getDirectories(fileDir, newBranch);
            }
            else if (opt.includeFiles) opt.newFile(parent, inQuestion, fileDir, opt.includeFileStats ? ev : null);
        }
    }
    getDirectories(dir, accumulator);
    return accumulator;
};
exports.nested = function(dir, opt, cb)
{
    if (!path.isAbsolute(dir))
        path.join(process.cwd(),dir);

    //Assume callback
    if (typeof opt !=='object')
    {
        cb = opt;
        opt = undefined;
    }
    opt || (opt = {});
    opt.filter || (opt.filter = allFilter);
    opt.newFile || (opt.newFile = newFile);
    opt.newFolder || (opt.newFolder = newFolder);
    var accumulator = opt.newFolder(null, path.basename(dir), dir);
    if (opt.includeFiles && opt.newFolder === newFolder) accumulator.filenames = [];
    if (opt.includeFileStats) accumulator.fileStats = {};
    var inError = false,
        callbacksFinished = 0,
        callbacksAwaited = 1;

    function DirectoryCheckDone()
    {
        if (++callbacksFinished == callbacksAwaited) cb(null, accumulator);
    }

    function getDirectories(dir, parent)
    {
        if (inError) return;
        fs.readdir(dir, function(err, files)
        {
            if (err)
            {
                inError = true;
                return cb(err);
            }
            var counter = 0,
                c = files.length;
            //If no files in directory ie filelength==0
            if (counter == c) DirectoryCheckDone();
            for (var i = 0; i < c; i++)
            {
                var inQuestion = files[i];
                //Skip hidden files or ignored files if enabled
                if (opt.noHidden && inQuestion[0] == '.' || !opt.filter(path.join(dir, inQuestion)))
                {
                    counter++;
                    continue;
                }
                var fileDir = path.join(dir, inQuestion);
                fs.stat(fileDir, (function(fileDir, theFile)
                {
                    return function(err, ev)
                    {
                        if (inError) return;
                        if (err)
                        {
                            //Ignore subsequent stat results and prevent from calling callback again
                            inError = true;
                            return cb(err);
                        }
                        if (ev.isDirectory())
                        {
                            callbacksAwaited++;
                            var newBranch = opt.newFolder(parent, theFile, fileDir);
                            if (opt.includeFiles && opt.newFolder === newFolder) newBranch.filenames = [];
                            if (opt.includeFileStats) newBranch.fileStats = {};
                            getDirectories(fileDir, newBranch);
                        }
                        else if (opt.includeFiles) opt.newFile(parent, theFile, fileDir, opt.includeFileStats ? ev : null);
                        if (++counter == c) DirectoryCheckDone();
                    }
                })(fileDir, inQuestion));
            }
        });
    }
    getDirectories(dir, accumulator);
};
exports.list = function(root, relpath)
{
    var chunks = path.normalize(relpath).split(path.sep);
    for (var i = 0, c = chunks.length; i < c; i++)
    {
        var chunk = chunks[i];
        root = root.dir[chunk];
        if (!root) return undefined;
    }
    return root;
};