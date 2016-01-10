'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveITunesLibrary = exports.loadITunesLibrary = undefined;
exports.findDictValue = findDictValue;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bplistParser = require('bplist-parser');

var _bplistParser2 = _interopRequireDefault(_bplistParser);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _xmldoc = require('xmldoc');

var _xmldoc2 = _interopRequireDefault(_xmldoc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ITL_FILE = 'iTunes Library.itl';
var XML_FILE = 'iTunes Music Library.xml';

// at the top of Apple's XML files
var HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';

function findDictValue(dict, key) {
  var children = dict.children;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.name === 'key' && child.val === key) {
      return children[i + 1];
    }
  }
  return null;
}

var loadITunesLibrary = exports.loadITunesLibrary = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var xmlpath, appdata, file, obj, prefs, loc, plistFile, plist, dbloc, match, _data;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            xmlpath = undefined;

            if (!(_os2.default.platform() === 'win32')) {
              _context.next = 13;
              break;
            }

            appdata = process.env.APPDATA;

            (0, _assert2.default)(appdata, 'where is your %APPDATA% folder?');
            file = _fs2.default.readFileSync(appdata + '\\Apple Computer\\iTunes\\iTunesPrefs.xml', 'utf8');
            obj = new _xmldoc2.default.XmlDocument(file.toString());
            // plist -> dict

            prefs = findDictValue(obj.firstChild, 'User Preferences');

            (0, _assert2.default)(prefs, 'could not find user prefs');
            loc = findDictValue(prefs, 'iTunes Library XML Location:1');

            (0, _assert2.default)(loc, 'you do not have an XML library file');
            xmlpath = new Buffer(loc.val.replace(/\s/, ''), 'base64').toString('ucs2');
            _context.next = 23;
            break;

          case 13:
            if (!(_os2.default.platform() === 'darwin')) {
              _context.next = 23;
              break;
            }

            (0, _assert2.default)(process.env.HOME, 'where is your home directory?');
            plistFile = _path2.default.join(process.env.HOME, 'Library/Preferences/com.apple.iTunes.plist');
            _context.next = 18;
            return _q2.default.ninvoke(_bplistParser2.default, 'parseFile', plistFile);

          case 18:
            plist = _context.sent;
            dbloc = plist[0]['Database Location'].toString();
            match = /;(\/[^;]*itunes library\.itl)/.exec(dbloc);

            (0, _assert2.default)(match, 'could not get library location');
            xmlpath = _path2.default.join(_path2.default.dirname(match[1]), XML_FILE);

          case 23:
            if (!(xmlpath != null)) {
              _context.next = 26;
              break;
            }

            _data = _fs2.default.readFileSync(xmlpath, 'utf8');
            return _context.abrupt('return', { path: xmlpath, data: new _xmldoc2.default.XmlDocument(_data.toString()) });

          case 26:
            throw new Error('platform not supported');

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function loadITunesLibrary() {
    return ref.apply(this, arguments);
  };
}();

var saveITunesLibrary = exports.saveITunesLibrary = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(xmlPath, library) {
    var itlFile, bak;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _fs2.default.writeFileSync(xmlPath, HEADER + library.toString());
            itlFile = _path2.default.join(_path2.default.dirname(xmlPath), ITL_FILE);
            bak = itlFile + '.bak';

            console.log('Backing up your old itl file to ' + bak);
            _fs2.default.writeFileSync(bak, _fs2.default.readFileSync(itlFile));

            // Corrupt the ITL file to force iTunes to create a new one.
            _fs2.default.writeFileSync(itlFile, '');

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function saveITunesLibrary(_x, _x2) {
    return ref.apply(this, arguments);
  };
}();