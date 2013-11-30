/*
 * grunt-scriptlinker
 * https://github.com/scott-laursen/grunt-scriptlinker
 *
 * Copyright (c) 2013 scott-laursen
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util'),
  _ = require('lodash'),
  path = require('path');

function isUrl(url) {
  return (/^http[s]?:\/\/./).test(url);
}


module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
  
	grunt.registerMultiTask('particles-linker', 'Your task description goes here.', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			startTag: '<!--SCRIPTS-->',
			endTag: '<!--SCRIPTS END-->',
			fileTmpl: '<script src="%s"></script>',
			appRoot: '',
      publicUrlRoot: '',
      isRelative: false
		});


		// Iterate over all specified file groups.
		this.files.forEach(function (f) {
			var scripts = [],
				page = '',
				newPage = '',
				start = -1,
				end = -1;
    
      f.orig.src.forEach(function (filepath) {   
        grunt.log.writeln("Analyzing " + filepath);
        if(isUrl(filepath)) {
          scripts.push(filepath);
        } else {
          var expandedFiles = grunt.file.expand({}, filepath);
          Array.prototype.push.apply(scripts, expandedFiles);
          scripts = _.unique(scripts);
        }
			});
      
      if(!options.isRelative) {
        //pre-apply the template only if it's not relative
        
        scripts = scripts.map(function (filepath) {
          var ret;
          if(isUrl(filepath)) {
            ret = util.format(options.fileTmpl, filepath);
          } else {
            ret = util.format(options.fileTmpl, 
              path.join("/", options.publicUrlRoot, filepath.replace(options.appRoot, '')).replace(/\\/g, '/'));
          }

          grunt.log.writeln('Preparing to inject ' + ret);
          return ret;
        });
      }
      

			grunt.file.expand({}, f.dest).forEach(function(dest){
				page = grunt.file.read(dest);
				start = page.indexOf(options.startTag);

				end = page.indexOf(options.endTag, start);
				if (start === -1 || end === -1 || start >= end) {
					return;
				} else {
          var padding ='';
          var ind = start - 1;
          // TODO: Fix this hack
          while(page.charAt(ind)===' ' || page.charAt(ind)==='  '){
            padding += page.charAt(ind);
            ind -= 1;
          }
          var newScripts = scripts;
          if(options.isRelative) {
            newScripts = scripts.map(function(script) {
              return util.format(options.fileTmpl, path.relative(path.dirname(dest), script).replace(/\\/g, '/'));
            });
          }
          console.log('padding length', padding.length);
					newPage = page.substr(0, start + options.startTag.length)+'\n' + padding + newScripts.join('\n'+padding) + '\n' + padding + page.substr(end);
					// Insert the scripts
					grunt.file.write(dest, newPage);
					grunt.log.writeln('File "' + dest + '" updated.');
				}
			});
		});
	});
};
