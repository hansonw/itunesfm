// Hack to get the JSON object
// http://stackoverflow.com/questions/19445189/cscript-jscript-json
var htmlfile = WSH.CreateObject('htmlfile'), JSON;
htmlfile.write('<meta http-equiv="x-ua-compatible" content="IE=9" />');
htmlfile.close(JSON = htmlfile.parentWindow.JSON);

var fso = new ActiveXObject("Scripting.FileSystemObject");
var stdin = fso.GetStandardStream(0);
var stdout = fso.GetStandardStream(1);

var data = JSON.parse(decodeURIComponent(stdin.readline()));
var iTunesApp = new ActiveXObject('iTunes.Application');
var tracks = iTunesApp.LibraryPlaylist.Tracks;

var updated = 0;
for (var i = 1; i <= tracks.Count; i++) {
  var track = tracks.Item(i);
  var low = iTunesApp.ITObjectPersistentIDLow(track);
  var high = iTunesApp.ITObjectPersistentIDHigh(track);
  var key = low + ':' + high;
  if (data[key]) {
    track.PlayedCount = data[key];
    updated++;
  }
}

stdout.writeline('Updated ' + updated + ' tracks.');
