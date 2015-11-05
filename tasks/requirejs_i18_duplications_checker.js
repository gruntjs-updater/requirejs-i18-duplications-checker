/*
 * requirejs-i18-duplications-checker
 * https://github.com/jsruvi/requirejs-i18-duplications-checker
 *
 * Copyright (c) 2015 Rumyancev Vitalik
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    /**
     * options in gruntfile should have such view
     * onlyUnique: {
     *       groups: [
     *           {
     *               checkValues: "all",// true, "all", false
     *               paths: ["Scripts/app-resx.js"]
     *           }
     *       ]
     *  }
     */

    grunt.registerMultiTask('requirejs_i18_duplications_checker', 'plugin for checking on duplicated values in i18 resources files using require.js', function() {

        var config        = grunt.config(this.name),
            groups        = config.groups,
            groupsResults = getGroupsResults(groups),
            log           = {
                sameValuesInFile: [],
                sameValuesInSeparateFiles: []
            };

        groupsResults.forEach(function(groupResult) {
            var checkValues  = groupResult.checkValues,
                filesResults = [].concat(groupResult.filesResults);

            if (checkValues) {
                var count = 0;

                filesResults.forEach(function(fileResult) {
                    if (!grunt.file.exists(fileResult.fileName)) {
                        return;
                    }

                    var result      = fileResult.result;
                    var usedKeys    = [];
                    var checkedKeys = [];

                    for (var i in result) {
                        if (checkedKeys.indexOf(i) !== -1) {
                            continue;
                        }

                        var error       = {
                                currentKey: i,
                                filePath: fileResult.fileName,
                                sameValue: result[i],
                                keyThatContainSameValue: []
                            },
                            errorsCount = 0;

                        usedKeys.push(i);

                        for (var j in result) {
                            if ((usedKeys.indexOf(j) === -1) && (result[i] === result[j])) {
                                error.keyThatContainSameValue.push(j);
                                checkedKeys.push(j);
                                ++errorsCount;
                            }
                        }

                        if (errorsCount) {
                            log.sameValuesInFile.push(error);
                        }

                        if (checkValues === "all") {
                            var sameValuesInSeparateFiles = getSameValueFromSeparateFiles(filesResults, fileResult, result, i, count);

                            if (sameValuesInSeparateFiles) {
                                log.sameValuesInSeparateFiles.push(sameValuesInSeparateFiles);
                            }
                        }
                    }

                    count++;
                });
            }
        });

        logDuplicatedValuesInFile(log.sameValuesInFile);
        logDuplicatedValuesInSeparateFiles(log.sameValuesInSeparateFiles);

        if (!log.sameValuesInFile.length && !log.sameValuesInSeparateFilesFile.length) {
            grunt.log.ok("all done")
        } else {
            grunt.fail.fatal("fail: exist same values")
        }


        function getGroupsResults(groups) {
            var results = [];

            groups.forEach(function(group) {
                var paths        = [].concat(group.paths);
                var filesResults = [];

                grunt.file.expand({}, paths).forEach(function(path) {
                    var define      = function(val) {
                        return val;
                    };
                    var fileContent = grunt.file.read(path);
                    var fileResult  = eval(fileContent);

                    if (isObject(fileResult) && !isEmptyObject(fileResult)) {
                        filesResults.push({
                            fileName: path,
                            result: fileResult,
                            invertedResult: invertObject(fileResult)
                        });
                    }
                });

                results.push({
                    checkValues: group.checkValues,
                    filesResults: filesResults
                });
            });

            return results;
        }

        function getSameValueFromSeparateFiles(filesResults, fileResult, currentResult, currentResultKey, count) {
            var error                      = {
                    filePath: fileResult.fileName,
                    sameValue: currentResult[currentResultKey],
                    currentKey: currentResultKey,
                    filesThatContainSameValue: []
                },
                sameValuesInSeparateFiles  = [],
                errorsInSeparateFilesCount = 0;

            for (var k = count + 1, l = filesResults.length; k < l; k++) {
                var otherInvertedResult = filesResults[k].invertedResult;

                if (otherInvertedResult[currentResult[currentResultKey]] && currentResultKey !== "root") {
                    errorsInSeparateFilesCount++;

                    error.filesThatContainSameValue.push({
                        path: filesResults[k].fileName,
                        key: otherInvertedResult[currentResult[currentResultKey]]
                    });
                }
            }

            if (errorsInSeparateFilesCount) {
                return error;
            } else {
                return false;
            }
        }

        function logDuplicatedValuesInFile(errors) {
            if (!errors.length) {
                return;
            }

            grunt.log.warn("matches in each files");
            grunt.log.warn("--------------------------");
            errors.forEach(function(error) {
                grunt.log.writeln("file contain same value: " + "'" + error.sameValue + "'");
                grunt.log.writeln("--------------------");
                grunt.log.writeln("in file: " + error.filePath);
                grunt.log.writeln("key: " + "'" + error.currentKey + "'");
                grunt.log.writeln("contain same value: " + "'" + error.sameValue + "'");
                grunt.log.writeln("as in key(s): '" + error.keyThatContainSameValue.join("', '") + "'");
                grunt.log.writeln("--------------------");
                grunt.log.writeln("");
                grunt.log.writeln("");
            });
            grunt.log.error("resources contain " + log.sameValuesInFile.length + " same values");
        }

        function logDuplicatedValuesInSeparateFiles(errors) {
            if (!errors.length) {
                return;
            }

            grunt.log.warn("matches with other files");
            grunt.log.warn("-----------------------");
            errors.forEach(function(error) {
                grunt.log.writeln("file contain same value: " + "'" + error.sameValue + "'");
                grunt.log.writeln("--------------------");
                grunt.log.writeln("in file: " + error.filePath);
                grunt.log.writeln("key: " + "'" + error.currentKey + "'");
                grunt.log.writeln("contain same value: " + "'" + error.sameValue + "'");
                error.filesThatContainSameValue.forEach(function(error) {
                    grunt.log.writeln("found in file: '" + error.path + "'");
                    grunt.log.writeln("in key: '" + error.key + "'");
                });
                grunt.log.writeln("--------------------");
                grunt.log.writeln("");
                grunt.log.writeln("");
            });

            grunt.log.error("resources contain " + log.sameValuesInSeparateFiles.length + " common values");
        }

        function isEmptyObject(object) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    return false;
                }
            }
            return true;
        }

        function isObject(object) {
            return !!object.hasOwnProperty;
        }

        function invertObject(object) {
            var invertedObject = {};

            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    invertedObject[object[key]] = key;
                }
            }

            return invertedObject;
        }
    });

};
