/* @flow */

import invariant from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import q from 'q';
import xmldoc from 'xmldoc';

const ITL_FILE = 'iTunes Library.itl';

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
  if (os.platform() === 'win32') {
    const appdata = process.env.APPDATA;
    invariant(appdata);
    const file = fs.readFileSync(
      appdata + '\\Apple Computer\\iTunes\\iTunesPrefs.xml',
      'utf8',
    );
    const obj = new xmldoc.XmlDocument(file.toString());
    // plist -> dict
    const prefs = findDictValue(obj.firstChild, 'User Preferences');
    invariant(prefs, 'could not find user prefs');
    const loc = findDictValue(prefs, 'iTunes Library XML Location:1');
    invariant(loc, 'could not get library location');
    const path = new Buffer(loc.val.replace(/\s/, ''), 'base64')
      .toString('ucs2');

    const data = fs.readFileSync(path, 'utf8');
    return {path, data: new xmldoc.XmlDocument(data.toString())};
  }
  throw new Error('todo: other platforms');
}

export async function saveITunesLibrary(
  xmlPath: string,
  library: Object,
): Promise<void> {
  fs.writeFileSync(xmlPath, HEADER + library.toString());
  const itlFile = path.join(path.dirname(xmlPath), ITL_FILE);
  const bak = itlFile + '.bak';
  console.log(`Backing up your old itl file to ${bak}`);
  fs.createReadStream(itlFile).pipe(fs.createWriteStream(bak));

  // Corrupt the ITL file to force iTunes to create a new one.
  fs.writeFileSync(itlFile, '');
}
