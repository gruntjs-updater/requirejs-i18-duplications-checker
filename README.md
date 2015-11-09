# requirejs-i18-duplications-checker

> grunt plugin for checking on duplicated values in i18 resources files when you use require.js

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install requirejs-i18-duplications-checker --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('requirejs-i18-duplications-checker');
```

## The "requirejs_i18_duplications_checker" task

### Overview
In your project's Gruntfile, add a section named `requirejs_i18_duplications_checker` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  requirejs_i18_duplications_checker: {
    groups: [
      {
        paths: ["**/*first-checked.js"], // array || string
        checkValues: "all" // || true || false
      }
    ]
  }
});
```

### Options

#### options.groups
Type: `Array`
Default value: `[]`

Groups of files that are needed to check on values duplication.

#### options.groups[n].paths
Type: `String || Array`
Default value: `''`

A string or array thar specify path(s) to file(s) that should be checked on duplicate values.

#### options.groups[n].checkValues
Type: `String || Boolean`
Default value: `true`

Taken values:
true - check duplicated values only inside each specified files but not between each other
"all" - check duplicated values inside each specified files and between each other

### Usage Examples

#### Default Options
In this example, the default options are used to check duplicated values inside files that contain in name - "test". But does't check duplicates between each other files.

```js
grunt.initConfig({
  requirejs_i18_duplications_checker: {
    groups: [
      paths: "/**/*test.js"
    ]
  }
});
```

#### Custom Options
In this example, option checkValues="all" are used to check duplicated values inside each specified files and between each other.

```js
grunt.initConfig({
  requirejs_i18_duplications_checker: {
    groups: [
        {
          paths: ["src/checked-file.js"],
          checkValues: "all"
        }
      ]
  },
});
```

## Release History
_(Nothing yet)_
