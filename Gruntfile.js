var toml = require("toml");
var yaml = require("yaml")
var S = require("string");

var CONTENT_PATH_PREFIX = "content";

module.exports = function(grunt) {

    grunt.registerTask("lunr-index", function() {

        grunt.log.writeln("Build pages index");

        var indexPages = function() {
            var pagesIndex = [];
            grunt.file.recurse(CONTENT_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                grunt.verbose.writeln("Parse file:",abspath);
                pagesIndex.push(processFile(abspath, filename));
            });

            return pagesIndex;
        };

        var processFile = function(abspath, filename) {
            var pageIndex;

            if (S(filename).endsWith(".html")) {
                pageIndex = processHTMLFile(abspath, filename);
            } else if (S(filename).endsWith(".md")) {
                pageIndex = processMDFile(abspath, filename);
            }

            return pageIndex;
        };

        var processHTMLFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var pageName = S(filename).chompRight(".html").s;
            var href = S(abspath)
                .chompLeft(CONTENT_PATH_PREFIX).s;
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().stripPunctuation().s
            };
        };

        var processMDFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var pageIndex;
            // First separate the Front Matter from the content and parse it
            // console.log(content);
            var content_tmp = content.split("+++");

            var frontMatter;
            if(content_tmp.length == 3){ // if +++ toml format.
                try {
                    frontMatter = toml.parse(content_tmp[1].trim());
                } catch (e) {
                    console.log(e.message);
                }
            }
            else{
                content_tmp = content.split("---");
                try {
                    frontMatter = yaml.parse(content_tmp[1].trim());
                } catch (e) {
                    console.log(e.message);
                }
            }

            var href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(".md").s;
            // href for index.md files stops at the folder name
            if (filename === "index.md") {
                href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(filename).s;
            }

            // Build Lunr index for this page
            // console.log(frontMatter.title);
            // frontMatter.title = "jjjjjjjjjjjjjj";//frontMatter.title == undefined? "jjjjjjjjjjjjjj" : frontMatter.title;
            try {
              // console.log(frontMatter.title);
              pageIndex = {
                  title: frontMatter.title,
                  tags: frontMatter.tags,
                  href: href,
                  content: S(content[2]).trim().stripTags().stripPunctuation().s
              };
            } catch(e){
              // console.log(frontMatter);
              console.log(e.message);
            }

            return pageIndex;
        };

        grunt.file.write("site/static/js/lunr/PagesIndex.json", JSON.stringify(indexPages()));
        grunt.log.ok("Index built");
    });
};
