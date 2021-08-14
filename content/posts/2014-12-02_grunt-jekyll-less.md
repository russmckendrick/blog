---
title: "Grunt + Jekyll + LESS"
author: "Russ Mckendrick"
date: 2014-12-02T20:59:38.000Z
lastmod: 2021-07-31T12:32:18+01:00

tags:
 - Tech
 - Blog
 - Grunt
 - Jekyll

cover:
    image: "/img/2014-12-02_grunt-jekyll-less_0.png" 
images:
 - "/img/2014-12-02_grunt-jekyll-less_0.png"


aliases:
- "/grunt-jekyll-less-3c259369fa4f"

---

As you may have noticed, the website looks different to how it was previously. I decided it was time for a refresh and I wanted to make the design a little more interesting.

While [Jekyll](http://jekyllrb.com) & [Github](https://pages.github.com) pages use [SASS](http://sass-lang.com) the Bootstrap theme I settled for uses [LESS](http://lesscss.org). This meant that I needed to compile all of my CSS outside of Jekyll. Most of the articles I found say use either [Gulp](http://gulpjs.com) or [Grunt](http://gruntjs.com), looking at the syntax of the two I preferred Grunt as it didn’t look like code.

Installation was straight forward enough;

```
brew install node
npm install -g grunt-cli
```

So now what? I needed something which would do the following …

1. Compile the LESS files
2. Combine all of the CSS files into one
3. Minify the resulting CSS files
4. Run Jekyll to build the files

After a lot of trial and error I managed to get all of the above plus the ability to have the browser automatically refresh when I change a file, which was nice :smile:

You can see what happens when I run grunt server or grunt css in the following [asciicast](https://asciinema.org/a/14389) ….

[Grunt Example](https://asciinema.org/a/14389 "https://asciinema.org/a/14389")

My configuration currently looks like ….

**packages.json**

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
 “load-grunt-tasks”: “*”
 }
}
```

**Gruntfile.js**

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
 }
 },
 cssmin: {
 css: {
 src: ‘css/main.css’,
 dest: ‘css/main.min.css’
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
 watch: {
 options: {
 livereload: true,
 },
 css: {
 files: [‘_css/*’, ‘_less/*’],
 tasks: [‘less’, ‘concat:css’, ‘cssmin:css’]
 },
 html: {
 files: [‘*.html’, ‘_includes/*.html’, ‘_layouts/*.html’, ‘_posts/*’],
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
grunt.registerTask(‘default’, [‘less’, ‘concat:css’, ‘cssmin:css’, ‘jekyll’]);
grunt.registerTask(‘css’, [‘less’, ‘concat:css’, ‘cssmin:css’]);
grunt.registerTask(‘server’, [‘connect’, ‘watch’]);
};
```

The following posts helped me get to where I am at the moment;

- [Jekyll & Grunt setup](http://thomascys.be/jekyll-grunt-setup/)
- [Using Jekyll with Grunt.js (and much more)](http://blog.seanevd.com/using-jekyll-with-grunt-js/)
- [grunt-contrib-watch with LiveReload not working](http://stackoverflow.com/questions/20120412/grunt-contrib-watch-with-livereload-not-working)

I plan on adding a few more options to optimise the images and also compile the Javascript into something a little more discrete, eventually you can read it here.
