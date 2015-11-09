/*
 * requirejs-i18-duplications-checker
 * https://github.com/jsruvi/requirejs-i18-duplications-checker
 *
 * Copyright (c) 2015 Rumyancev Vitalik
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

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

    grunt.registerMultiTask('requirejs_i18_duplications_checker', 'plugin for checking duplicated values in i18 resources files using require.js', function() {

        var config        = grunt.config(this.name),
            groups        = config.groups,
            log           = {
                sameValuesInFile: [],
                sameValuesInSeparateFiles: []
            };

        fillErrorLog(log, groups);

        if(log.sameValuesInFile.length){
            logDuplicatedValuesInFile(log.sameValuesInFile);
        }

        if(log.sameValuesInSeparateFiles.length){
            logDuplicatedValuesInSeparateFiles(log.sameValuesInSeparateFiles);
        }

        if (!log.sameValuesInFile.length && !log.sameValuesInSeparateFilesFile.length) {
            grunt.log.ok("all done")
        } else {
            grunt.fail.fatal("fail: exist same values")
        }





        function fillErrorLog(log, groups) {

            var groupsResults = getGroupsResults(groups);

            groupsResults.forEach(function(groupResult) {

                var checkValuesOption  = groupResult.checkValues,
                    groupFilesData = [].concat(groupResult.groupFilesData);

                if (checkValuesOption) {
                    iterateGroupFilesResults(groupFilesData, checkValuesOption, log);
                }
            });
        }

        function iterateGroupFilesResults(groupFilesData, checkValuesOption, log) {

            var count = 0;
            var valueDuplicatedInOtherFiles = [];

            groupFilesData.forEach(function(fileData) {

                if (!grunt.file.exists(fileData.fileName)) { return; }

                var originFileResult = fileData.originResult;

                var iteratedKeys = [];
                var keysHaveSameValue = [];

                for (var mainIteratedKey in  originFileResult) {

                    if (!originFileResult.hasOwnProperty(mainIteratedKey)) { continue; }

                    var isMainKeyAlreadyChecked = keysHaveSameValue.indexOf(mainIteratedKey) > -1;
                    if (isMainKeyAlreadyChecked) { continue; }

                    iteratedKeys.push(mainIteratedKey);

                    var error = {
                            currentKey: mainIteratedKey,
                            filePath: fileData.fileName,
                            sameValue:  originFileResult[mainIteratedKey],
                            keyThatContainSameValue: []
                        },
                        errorsCount = 0;

                    for (var secondaryIteratedKey in originFileResult) {

                        if (!originFileResult.hasOwnProperty(secondaryIteratedKey)) { continue; }

                        var isSecondaryKeyAlreadyChecked = iteratedKeys.indexOf(secondaryIteratedKey) > -1;
                        if (isSecondaryKeyAlreadyChecked) { continue; }

                        var isSecondaryKeyHasSameValueAsMainKey = originFileResult[mainIteratedKey] === originFileResult[secondaryIteratedKey];

                        if (isSecondaryKeyHasSameValueAsMainKey) {
                            error.keyThatContainSameValue.push(secondaryIteratedKey);
                            keysHaveSameValue.push(secondaryIteratedKey);
                            ++errorsCount;
                        }
                    }

                    if (errorsCount) {
                        log.sameValuesInFile.push(error);
                    }

                    var isAlreadyCheckedOnDuplicateValue = valueDuplicatedInOtherFiles.indexOf(originFileResult[mainIteratedKey]) > -1;

                    if (checkValuesOption === "all" && !isAlreadyCheckedOnDuplicateValue) {

                        valueDuplicatedInOtherFiles.push(originFileResult[mainIteratedKey]);

                        var sameValuesInSeparateFiles = getSameValueFromSeparateFiles(groupFilesData, fileData, mainIteratedKey, count);

                        if (sameValuesInSeparateFiles) {
                            log.sameValuesInSeparateFiles.push(sameValuesInSeparateFiles);
                        }
                    }
                }

                count++;
            });
        }

        function getGroupsResults(groups) {
            var results = [];

            groups.forEach(function(group) {
                var paths        = [].concat(group.paths);
                var groupFilesData = [];

                grunt.file.expand({}, paths).forEach(function(path) {
                    var define = function(val) { return val; };

                    var fileContent = grunt.file.read(path);
                    var fileResult  = eval(fileContent);

                    if (isObject(fileResult) && !isEmptyObject(fileResult)) {
                        groupFilesData.push({
                            fileName: path,
                            originResult: fileResult,
                            invertedResult: invertObject(fileResult)
                        });
                    }
                });

                results.push({
                    checkValues: group.checkValues,
                    groupFilesData: groupFilesData
                });
            });

            return results;
        }

        function getSameValueFromSeparateFiles(groupFilesData, fileData, mainIteratedKey, count) {

            var foundValue = fileData.originResult[mainIteratedKey],
                error = {
                    filePath: fileData.fileName,
                    sameValue: foundValue,
                    currentKey: mainIteratedKey,
                    filesThatContainSameValue: []
                };

            for (var i = count + 1, l = groupFilesData.length; i < l; i++) {
                var subsequentFileData = groupFilesData[i],
                    otherFileInvertedResult = subsequentFileData.invertedResult,
                    isDefaultResourceKey = mainIteratedKey === "root";

                if (otherFileInvertedResult[foundValue] && !isDefaultResourceKey) {

                    error.filesThatContainSameValue.push({
                        path: subsequentFileData.fileName,
                        key: otherFileInvertedResult[foundValue]
                    });
                }
            }

            return error.filesThatContainSameValue.length && error;
        }

        function logDuplicatedValuesInFile(errors) {
            if (!errors.length) { return; }

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
            if (!errors.length) { return; }

            grunt.log.warn("matches with other files");
            grunt.log.warn("-----------------------");
            errors.forEach(function(error) {
                grunt.log.writeln("file contain same value: " + "'" + error.sameValue + "'");
                grunt.log.writeln("--------------------");
                grunt.log.writeln("in file: " + error.filePath);
                grunt.log.writeln("key: " + "'" + error.currentKey + "'");
                grunt.log.writeln("contain same value: " + "'" + error.sameValue + "'");

                for (var i = 0, l = error.filesThatContainSameValue.length; i < l; i++) {
                    var fileWithSameValue = error.filesThatContainSameValue[i];
                    grunt.log.writeln("-----");
                    grunt.log.writeln("found in file: '" + fileWithSameValue.path + "'");
                    grunt.log.writeln("in key: '" + fileWithSameValue.key + "'");
                }

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
