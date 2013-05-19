var video_wdt = 350;
var video_hgt = 196.875;
var config_data = {};
var channels = {};
var queue = [];
var queue_pointer = 0;
var video_params = {allowScriptAccess: "always"};

var isObject = function(targetID){
   var isFound = false;
   var el = document.getElementById(targetID);
   if(el && (el.nodeName === "OBJECT" || el.nodeName === "EMBED")){
      isFound = true;
   }
   return isFound;
};

var replaceSwfWithEmptyDiv = function(targetID){
   var el = document.getElementById(targetID);
   if(el){
      var div = document.createElement("div");
      el.parentNode.insertBefore(div, el);

      swfobject.removeSWF(targetID);

      div.setAttribute("id", targetID);
   }
};

var yt_get_videos = function(id, url, limit) {
  if(!limit) {
    limit = 10;
  }

  jQuery.ajax({
    url: "http://gdata.youtube.com/feeds/api/" + url,
    data: {"alt": "json", "fields": "entry(id,title,media:group/media:content)", "max-results": limit},
    dataType: "jsonp",
    error: function () {
      console.log("FAILED request for: " + url);
      channels[id] = [];
    },
    success: function (obj) {
      var videos = [];
      for (var x = 0; x < obj.feed.entry.length; x++) {
        if(obj.feed.entry[x]["media$group"]["media$content"]) {
          for(var n in obj.feed.entry[x]["media$group"]["media$content"]) {
            if (obj.feed.entry[x]["media$group"]["media$content"][n].type == "application/x-shockwave-flash") {
              videos.push(obj.feed.entry[x]["media$group"]["media$content"][n].url);
            }
          }
        }
      }
      channels[id] = videos;

      check_ready();
    }
  });
};

var queue_next = function () {
  if(queue_pointer > queue.length) {
    queue_pointer = 0;
  }

  var this_pointer = queue_pointer;
  queue_pointer++;

  return queue[this_pointer];
};

var update = function(elid) {
  var url = queue_next() + "&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playerapiid=" + elid;

  //console.log("Updating " + elid + " with " + url);

  if(isObject(elid)){
    //console.log(elid + " is an object!");
    replaceSwfWithEmptyDiv(elid);
  }

  swfobject.embedSWF(url, elid, String(350), String(196.875), "8", null, null, video_params, { id: elid});
};

var draw_grid = function() {
  var target = jQuery('div#target');
  for(var y = 0; y < config_data["y"]; y++) {
    var parent = jQuery('<div class="row"></div>').appendTo(target);
    for(var x = 0; x < config_data["x"]; x++) {
      var element_id = 'vid_' + x + '_' + y;
      var element = '<div id="' + element_id + '" class="video unit one-of-three"></div>';
      jQuery(element).appendTo(parent);
      update(element_id);
    }
  }
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
var shuffle = function(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var check_ready = function () {
  if(Object.keys(channels).length === config_data["channels"].length) {
    for(var i in channels) {
      for(var x = 0; x < channels[i].length; x++) {
        queue.push(channels[i][x]);
      }
    }

    queue = shuffle(queue);

    draw_grid();

    return true;
   }

  return false;
};

var fetch_videos = function() {
  var channel_length = config_data["channels"].length;

  if(channel_length == 0) {
    console.log("No channels to pull!");
    return;
  }

  var max_results = Math.ceil(100 / channel_length);

  for (var i = 0; i < channel_length; i++) {
    var feed = false;
    var channel = config_data["channels"][i].trim();
    switch(channel) {
      case "trending":
        feed = "standardfeeds/on_the_web";
        break;
      case "popular":
        feed ="standardfeeds/most_popular";
        break;
      default:
        feed = "users/" + channel + "/uploads";
    }

    yt_get_videos(channel, feed, max_results);
  }
};

var onYouTubePlayerReady = function(playerid) {
  //console.log(playerid + " is ready!");
  ytplayer = document.getElementById(playerid);
  ytplayer.mute();
  ytplayer.playVideo();

  window["onStateChange" + playerid] = function(state) {
    if(state === 0) {
      //console.log(playerid + " is done!");

      var parts = playerid.split('_');

      update(playerid);
    }
  };

  ytplayer.addEventListener("onStateChange", "onStateChange" + playerid);
};

var set_grid = function() {
  var wdt = jQuery(window).width();
  var hgt = jQuery(window).height();

  var x = Math.ceil(wdt / video_wdt);
  var y = Math.ceil(hgt / video_hgt);

  return {"x": x, "y": y};
};

jQuery(document).ready(function(){
  jQuery.getJSON("/config", {}, function(data) {
      if(data) {
        config_data = data;

        if(config_data["message"]) {
          jQuery("h1").text(config_data["message"]);
        }

        var xy = set_grid();
        config_data["x"] = xy["x"];
        config_data["y"] = xy["y"];
        //console.log(data);

        fetch_videos();
      } else {
        console.log("Couldn't pull config data from server.");
      }
  });
});
