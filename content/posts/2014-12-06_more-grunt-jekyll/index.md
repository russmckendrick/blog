---
title: "More Grunt & Jekyll"
description: "Streamlined my Grunt configuration by combining tasks, now I can concatenate JS files, compress them with Uglify, and minify CSS files in one go!"
author: "Russ Mckendrick"
date: "2014-12-06T12:00:00+01:00"
tags:
  - "Code"
  - "Tools"
cover:
  image: "/img/2014-12-06_more-grunt-jekyll_0.png"
  alt: "Streamlined my Grunt configuration by combining tasks, now I can concatenate JS files, compress them with Uglify, and minify CSS files in one go!"
lastmod: "2021-07-31T12:32:28+01:00"
aliases:
  - "/more-grunt-jekyll-1b0ab0e47e"
---

At the end of my [last post about Grunt](/2014/12/02/grunt-jekyll-less/) I mentioned that I will be adding code to concatenate the javascript, compress the images and also tidy the code up abit. I have now done this ….

#### Javascript

I moved all of the javascript to a folder called _js and then set up the following ….

{{< terminal title="More Grunt & Jekyll 1/7" >}}
```
js: {
 src: [
 ‘_js/jquery.min.js’, ‘_js/jquery.plugin.min.js’, ‘js/bootstrap.min.js’, ‘_js/jquery.flexslider-min.js’, ‘_js/smooth-scroll.min.js’,’ _js/skrollr.min.js’, ‘_js/twitterFetcher_v10_min.js’, ‘_js/spectragram.min.js’, ‘_js/scrollReveal.min.js’, ‘_js/isotope.min.js’, ‘_js/lightbox.min.js’, ‘_js/jquery.countdown.min.js’, ‘_js/scripts.js’
 ],
 dest: ‘js/main.js’
 }
```
{{< /terminal >}}

As you can see I am having to merge the javascript in a certain order, I tried using src: [‘_js/*’] but this broke a lot of the site.

Now I have all of the javascript in a single file which works I can compress it using [Uglify](https://github.com/gruntjs/grunt-contrib-uglify) ….

{{< terminal title="More Grunt & Jekyll 2/7" >}}
```
uglify: {
 options: {
 banner: ‘/*! <%= pkg.name %> <%= grunt.template.today(“dd-mm-yyyy”) %> */\n’
 },
 my_target: {
 files: {
 ‘js/main.min.js’: [‘js/main.js’]
 }
 }
},
```
{{< /terminal >}}

I then created a task to put it all together ….

{{< terminal title="More Grunt & Jekyll 3/7" >}}
```
grunt.registerTask(‘js’, [‘concat:js’, ‘uglify’]);
```
{{< /terminal >}}

as well as adding the _js and tasks to the watch section of my Gruntfile.js.

#### Images

I use the [TinyPNG](https://tinypng.com) Photoshop plug-in to export the headers and other images so most of the graphics on the site are already quite compressed, however to ensure that everything is as optimised as possible I added the following ….

{{< terminal title="More Grunt & Jekyll 4/7" >}}
```
imgcompress: {
 dist: {
 options: {
 optimizationLevel: 7,
 progressive: true
 },
 files: [{
 expand: true,
 cwd: ‘img/’,
 src: ‘{,*/}*.{png,jpg,jpeg}’,
 dest: ‘img/’
 }]
 }
},
svgmin: {
 dist: {
 files: [{
 expand: true,
 cwd: ‘img/’,
 src: ‘{,*/}*.svg’,
 dest: ‘img/’
 }]
}
},
```
{{< /terminal >}}

as the site has a lot of image files [Newer](https://www.npmjs.org/package/grunt-newer) was used to files are only processed if they have been changed or haven’t been processed. I added the following task ….

{{< terminal title="More Grunt & Jekyll 5/7" >}}
```
grunt.registerTask(‘images’, [‘newer:imgcompress’, ‘newer:svgmin’]);
```
{{< /terminal >}}

However, for the moment I have left it out of the watch list as it can take a little while to execute.

#### Full files

This now means my Gruntfile.js looks like ….

{{< terminal title="More Grunt & Jekyll 6/7" >}}
```
module.exports = function(grunt) {
 grunt.initConfig({
 pkg: grunt.file.readJSON(‘package.json’),

less: {
 development: {
 options: {
 compress: true,
 yuicompress: true,
 optimization: 2
 },
 files: {
 “_css/main.css”: “_less/main.less”
 }
 }
 }, 
 concat: {
 css: {
 src: [
 ‘_css/*’
 ],
 dest: ‘css/main.css’
 },
 js: {
 src: [
 ‘_js/jquery.min.js’, ‘_js/jquery.plugin.min.js’, ‘js/bootstrap.min.js’, ‘_js/jquery.flexslider-min.js’, ‘_js/smooth-scroll.min.js’,’ _js/skrollr.min.js’, ‘_js/twitterFetcher_v10_min.js’, ‘_js/spectragram.min.js’, ‘_js/scrollReveal.min.js’, ‘_js/isotope.min.js’, ‘_js/lightbox.min.js’, ‘_js/jquery.countdown.min.js’, ‘_js/scripts.js’
 ],
 dest: ‘js/main.js’
 }
 },
 cssmin: {
 css: {
 src: ‘css/main.css’,
 dest: ‘css/main.min.css’
 }
 },
 uglify: {
 options: {
 banner: ‘/*! <%= pkg.name %> <%= grunt.template.today(“dd-mm-yyyy”) %> */\n’
 },
 my_target: {
 files: {
 ‘js/main.min.js’: [‘js/main.js’]
 }
 }
 },
 jekyll: {
 options: { 
 src: ‘.’
 },
 dist: {
 options: {
 dest: ‘./_site’,
 config: ‘_config-dev.yml’
 }
 }
 },
 imgcompress: {
 dist: {
 options: {
 optimizationLevel: 7,
 progressive: true
 },
 files: [{
 expand: true,
 cwd: ‘img/’,
 src: ‘{,*/}*.{png,jpg,jpeg}’,
 dest: ‘img/’
 }]
 }
},
svgmin: {
 dist: {
 files: [{
 expand: true,
 cwd: ‘img/’,
 src: ‘{,*/}*.svg’,
 dest: ‘img/’
 }]
}
},
watch: {
 options: {
 livereload: true,
 },
 css: {
 files: [‘_css/*’, ‘_less/*’],
 tasks: [‘less’, ‘concat:css’, ‘cssmin:css’, ‘jekyll’]
 },
 js: {
 files: [‘_js/*’],
 tasks: [‘concat:js’, ‘uglify’, ‘jekyll’]
 },
 html: {
 files: [‘*.html’, ‘_includes/*.html’, ‘_layouts/*.html’, ‘_posts/*’, ‘*.yml’, ‘img/*’],
 tasks: [‘jekyll’],
 options: {
 spawn: false,
 }
 }
},
connect: {
 server: {
 options: {
 port: 8000,
 base: ‘./_site’
 }
 }
},

});
require(‘load-grunt-tasks’)(grunt);
grunt.registerTask(‘default’, [‘concat:js’, ‘uglify’, ‘less’, ‘concat:css’, ‘cssmin:css’, ‘jekyll’, ‘connect’, ‘watch’]);
grunt.registerTask(‘css’, [‘less’, ‘concat:css’, ‘cssmin:css’]);
grunt.registerTask(‘js’, [‘concat:js’, ‘uglify’]);
grunt.registerTask(‘server’, [‘connect’, ‘watch’]);
grunt.registerTask(‘images’, [‘newer:imgcompress’, ‘newer:svgmin’]);
};
```
{{< /terminal >}}

And the `package.json` file ….

{{< terminal title="More Grunt & Jekyll 7/7" >}}
```
{
 “name”: “mediaglasses”,
 “version”: “0.0.1”,
 “description”: “The Media Glasses Jekyll site”,
 “author”: “Russ McKendrick <russ@mckendrick.io>”,
 “homepage”: “http://media-glass.es/",
 “license”: “”,
 “devDependencies”: {
 “grunt”: “~0.4.5”,
 “grunt-contrib-concat”: “*”,
 “grunt-contrib-cssmin” : “*”,
 “grunt-contrib-watch” : “*”,
 “grunt-contrib-less”: “*”,
 “grunt-jekyll”: “*”,
 “grunt-contrib-connect”: “*”,
 “grunt-contrib-uglify”: “*”,
 “grunt-contrib-imagemin”: “*”,
 “grunt-svgmin”: “*”,
 “grunt-imgcompress”: “*”,
 “grunt-newer”: “*”,
 “load-grunt-tasks”: “*”
 }
}
```
{{< /terminal >}}