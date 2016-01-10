// Hack to get the JSON object
// http://stackoverflow.com/questions/19445189/cscript-jscript-json
var htmlfile = WSH.CreateObject('htmlfile'), JSON;
htmlfile.write('<meta http-equiv="x-ua-compatible" content="IE=9" />');
htmlfile.close(JSON = htmlfile.parentWindow.JSON);

var fso = new ActiveXObject("Scripting.FileSystemObject");
var stdout = fso.GetStandardStream(1);

var iTunesApp = new ActiveXObject('iTunes.Application');
var tracks = iTunesApp.LibraryPlaylist.Tracks;

var output = {};
for (var i = 1; i <= tracks.Count; i++) {
  var track = tracks.Item(i);
  if (track.VideoKind) {
    continue;
  }
  var low = iTunesApp.ITObjectPersistentIDLow(track);
  var high = iTunesApp.ITObjectPersistentIDHigh(track);
  output[low + ':' + high] = {
    name: track.Name,
    artist: track.Artist,
    playedCount: track.PlayedCount
  };
}

// utf-8 is not supported by WScript
stdout.writeline(encodeURIComponent(JSON.stringify(output)));
