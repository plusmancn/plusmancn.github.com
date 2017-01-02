'use strict';
/**
 * <plusmancn@gmail.com> created at 2017.01.02 21:13:58
 *
 * Copyright (c) 2017 Souche.com, all rights
 * reserved.
 *
 * 生成目录文件
 * 替换 {{index}} 标记部分
 */

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const yaml = require('js-yaml');
const ejs = require('ejs');
const debug = require('debug')('generate-index');

debug('Starting......');

let notes = []
    .concat(extractNoteMeta('./2016'))
    .concat(extractNoteMeta('./2017'))
    .reverse();

let html = ejs.render(
    '<ul>\n' +
    '<% notes.forEach(function(note){ %>' +
        '<li><%=note.title %></li>\n'+
    '<% }) %>'+
    '</ul>', {
        notes: notes
    });

replaceIndexMark('./index.html', '{{index}}', html);
replaceIndexMark('./README.md', '{{index}}', html);

/**
 * 替换标识内容
 * @param {String} filename - 文件路径
 * @param {String} marker - 需要替换的模板
 * @param {String} html - 替换内容
 */
function replaceIndexMark (filename, marker, html) {
    let content = fs.readFileSync(filename, {
        encoding: 'utf8'
    });
    fs.writeFileSync(filename, content.replace(marker, html));
    debug(`replace marker in ${filename}`);
}

/**
 * 从文件夹中提取文章元信息
 * @param {String} dir -文件夹路径
 * @return {Array}
 */
function extractNoteMeta (dir) {
    let noteList = fs.readdirSync(dir).filter(item => _.endsWith(item, '.md'));
    let noteMetaList = noteList.map(function (item) {
        let content = fs.readFileSync(path.join(dir, item), {
            encoding: 'utf8'
        });
        let start = content.indexOf('\n');
        let end = content.indexOf('---\n', start);
        return yaml.safeLoad(content.slice(start + 1, end));
    });
    
    debug(`parse ${dir} finished`);
    return noteMetaList;
}
