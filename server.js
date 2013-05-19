var static = require('node-static');
var http = require('http');
var file = new(static.Server)();

function get_param(val, def) {
  if(val) {
    return val;
  }
  return def;
}

var config_data = {
  "x": 4,
  "y": 3,
  "channels": get_param(process.argv[2], 'trending').split(','),
  "message": get_param(process.argv[3], '')
};

//console.log(config_data);

var app = http.createServer(function (req, res) {
  if(req.url == "/config") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"});
    res.end(JSON.stringify(config_data));
  } else {
    file.serve(req, res);
  }
}).listen(1981);
