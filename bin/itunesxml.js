/* @flow */

import invariant from 'assert';
import bplist from 'bplist-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';
import q from 'q';
import xmldoc from 'xmldoc';

const ITL_FILE = 'iTunes Library.itl';
const XML_FILE = 'iTunes Music Library.xml';

// at the top of Apple's XML files
const HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';

export function findDictValue(dict: Object, key: string): ?Object {
  const {children} = dict;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.name === 'key' && child.val === key) {
      return children[i + 1];
    }
  }
  return null;
}

export async function loadITunesLibrary(): Promise<{path: string, data: Object}> {
  let xmlpath;
  if (os.platform() === 'win32') {
    const appdata = process.env.APPDATA;
    invariant(appdata, 'where is your %APPDATA% folder?');
    const file = fs.readFileSync(
      appdata + '\\Apple Computer\\iTunes\\iTunesPrefs.xml',
      'utf8',
    );
    const obj = new xmldoc.XmlDocument(file.toString());
    // plist -> dict
    const prefs = findDictValue(obj.firstChild, 'User Preferences');
    invariant(prefs, 'could not find user prefs');
    const loc = findDictValue(prefs, 'iTunes Library XML Location:1');
    invariant(loc, 'you do not have an XML library file');
    xmlpath = new Buffer(loc.val.replace(/\s/, ''), 'base64')
      .toString('ucs2');
  } else if (os.platform() === 'darwin') {
    invariant(process.env.HOME, 'where is your home directory?');
    const plistFile = path.join(process.env.HOME, 'Library/Preferences/com.apple.iTunes.plist');
    const plist = await q.ninvoke(bplist, 'parseFile', plistFile);
    const dbloc = plist[0]['Database Location'].toString();
    const match = /;(\/[^;]*itunes library\.itl)/.exec(dbloc);
    invariant(match, 'could not get library location');
    xmlpath = path.join(path.dirname(match[1]), XML_FILE);
  }
  if (xmlpath != null) {
    const data = fs.readFileSync(xmlpath, 'utf8');
    return {path: xmlpath, data: new xmldoc.XmlDocument(data.toString())};
  }
  throw new Error('platform not supported');
}

export async function saveITunesLibrary(
  xmlPath: string,
  library: Object,
): Promise<void> {
  fs.writeFileSync(xmlPath, HEADER + library.toString());
  const itlFile = path.join(path.dirname(xmlPath), ITL_FILE);
  const bak = itlFile + '.bak';
  console.log(`Backing up your old itl file to ${bak}`);
  fs.writeFileSync(bak, fs.readFileSync(itlFile));

  // Corrupt the ITL file to force iTunes to create a new one.
  fs.writeFileSync(itlFile, '');
}
