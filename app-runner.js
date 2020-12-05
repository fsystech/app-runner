// @ts-check
/* eslint no-unused-vars: "error" */
//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 5:31 PM 12/5/2020
/**
 * @typedef {{appName:string;cwd:string;procName:string; argv:string[]}} IAppConfig
 * @typedef {{author:string;apps:{win:IAppConfig[]; linux:IAppConfig[]}}} IConfig
 * @typedef {{code:number,data:string, err:string, isError:boolean}} IChildProcStatus
 */
const { exec } = require('child_process');
const fs = require('fs').promises;
const fs_stat = require('fs').stat;
const _platform = require('os').platform();
const isWin = /win/gi.test(_platform);
/**
 * 
 * @param {string} fpath
 * @returns {Promise<boolean>}
 */
function fsExists(fpath) {
    return new Promise(async (resolve, reject) => {
        try {
            return fs_stat(fpath, (err, stats) => {
                return resolve(err === null);
            });
        } catch (e) {
            return reject(e);
        }
    });
}
/**
 * Read File async as json
 * @param {string} absPath
 * @returns {Promise<any>}
 */
function readJsonSync(absPath) {
    return new Promise(async (resolve, reject) => {
        let data;
        try {
            const buff = await fs.readFile(absPath);
            data = JSON.parse(buff.toString().replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, ""));
        } catch (e) {
            return reject(e);
        }
        return resolve(data);
    });
}
/**
 * Open Child Process
 * @param {IAppConfig} appConfig
 * @returns {Promise<IChildProcStatus>}
 */
function openProc(appConfig) {
    return new Promise((resolve, reject) => {
        const proc = exec(appConfig.procName + " " + appConfig.argv.join(" "), { cwd: appConfig.cwd });
        let msg = ""; let err = "";
        proc.stdout.on('data', function (data) {
            msg += (data.toString());
        });
        proc.stderr.on('data', function (data) {
            err += (data.toString());
        });
        proc.on('exit', function (icode) {
            resolve({
                code: icode,
                data: msg, err,
                isError: err.length > 0
            });
            msg = err = undefined;
        });
    })
}
/**
 * Starting application
 * @param {string|undefined} pPath
 */
async function startApp(pPath = "config.json") {
    console.log(`My working directory is ${__dirname}`);
    if (await fsExists(pPath) === false)
        throw new Error(`No configuration file found in ${__dirname}`);
    /** @type {IConfig} */
    const config = await readJsonSync(pPath);
    if (!config) throw new Error("Invalid configuration json.");
    if (config.author !== "Safe Online World Ltd.")
        throw new Error("Not allowed...");
    if (!config.apps)
        throw new Error("Invalid configuration json");
    if (isWin) {
        if (!Array.isArray(config.apps.win))
            throw new Error(`No configuration found for ${_platform}`);
        for (let appConfig of config.apps.win) {
            console.log(`Starting ${appConfig.appName}`);
            const status = await openProc(appConfig);
            if (status.isError === true) {
                console.log(`Error occured in ${appConfig.appName}\r\n${status.err}`);
            } else {
                console.log(`${status.data}\r\nSuccessfully run ${appConfig.appName}`);
            }
            /*const childProcess = spawn(appConfig.procName, appConfig.argv, {
                detached: true,
                stdio: 'ignore',
                cwd: appConfig.cwd
            });
            childProcess.unref();*/
        }
    } else {
        if (!Array.isArray(config.apps.linux))
            throw new Error(`No configuration found for ${_platform}`);
        for (let appConfig of config.apps.linux) {
            console.log(`Starting ${appConfig.appName}`);
            const status = await openProc(appConfig);
            if (status.isError === true) {
                console.log(`Error occured in ${appConfig.appName}\r\n${status.err}`);
            } else {
                console.log(`${status.data}\r\nSuccessfully run ${appConfig.appName}`);
            }
            /*const childProcess = spawn(appConfig.procName, appConfig.argv, {
                detached: true,
                stdio: 'ignore',
                cwd: appConfig.cwd
            });
            childProcess.unref();*/
        }
    }
}
startApp();