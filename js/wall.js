var ytWall = (function(){
  var video_wdt = 350;
  var video_hgt = 196.875;
  var config_data = {};
  var channels = {};
  var queue = [];
  var queue_pointer = 0;
  var video_params = {allowScriptAccess: "always"};

  // Helper functions

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

  var shuffle = function(o) {
      for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  };

  var play_video = function(elid, next) {
    var url = next.video + "&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playerapiid=" + elid;

    if(isObject(elid+'_content')){
      replaceSwfWithEmptyDiv(elid+'_content');
    }

    swfobject.embedSWF(url, elid+'_content', String(video_wdt), String(video_hgt), "8", null, null, video_params, { id: elid+'_content'});
  };

  var set_thumbnail = function(elid, next) {
    if(isObject(elid+'_content')){
      replaceSwfWithEmptyDiv(elid+'_content');
    }

    jQuery('#' + elid).css({
      'background': 'url("'+next.thumb+'") center center no-repeat',
      'width': video_wdt + 'px',
      'height': video_hgt + 'px'
    }).attr('rel', next.id);
  };

  var random_video = function() {
    var videos = jQuery('div.video');
    return videos[Math.floor(Math.random() * videos.length)];
  };

  var video_lookup = function(id) {
    for(var x in channels) {
      if(channels[x][id]) return channels[x][id];
    }

    return false;
  };

  // #1 -- Set window

  var set_grid = function() {
    var wdt = jQuery(window).width();
    var hgt = jQuery(window).height();

    var x = Math.ceil(wdt / video_wdt);
    var y = Math.ceil(hgt / video_hgt);

    return {"x": x, "y": y};
  };

  // #2 -- Load the queue

  var flip_square = function() {
    var video_el = random_video();
    var first_video = video_lookup(jQuery(video_el).attr('rel'));
    play_video(jQuery(video_el).attr('id'), first_video);
  };

  var check_ready = function () {
    if(Object.keys(channels).length === config_data["channels"].length) {
      for(var i in channels) {
        for(var x in channels[i]) {
          queue.push(channels[i][x]);
        }
      }

      queue = shuffle(queue);

      draw_grid();

      flip_square();

      return true;
     }

    return false;
  };

  var yt_get_videos = function(id, url, limit) {
    if(!limit) {
      limit = 10;
    }

    jQuery.ajax({
      url: "http://gdata.youtube.com/feeds/api/" + url,
      data: {"alt": "json", "fields": "entry(id,title,media:group/media:content,media:group/media:thumbnail)", "max-results": limit},
      dataType: "jsonp",
      error: function () {
        console.log("FAILED request for: " + url);
        channels[id] = [];
      },
      success: function (obj) {
        var videos = [];
        for (var x = 0; x < obj.feed.entry.length; x++) {
          var vid = {video: false, thumb: false, id: false};

          if(obj.feed.entry[x]["media$group"]["media$content"]) {
            for(var n in obj.feed.entry[x]["media$group"]["media$content"]) {
              if (obj.feed.entry[x]["media$group"]["media$content"][n].type == "application/x-shockwave-flash") {
                vid.video = obj.feed.entry[x]["media$group"]["media$content"][n].url;
              }
            }
          }

          if(obj.feed.entry[x]["id"]["$t"]) {
            var url = obj.feed.entry[x]["id"]["$t"].split('/');
            vid.id = url[url.length - 1];
          }

          if(obj.feed.entry[x]["media$group"]["media$thumbnail"]) {
            if(obj.feed.entry[x]["media$group"]["media$thumbnail"][0]) {
              vid.thumb = obj.feed.entry[x]["media$group"]["media$thumbnail"][0].url;
            }
          }

          videos[vid.id] = vid;
        }

        channels[id] = videos;

        check_ready();
      }
    });
  };

  var fetch_videos = function() {
    var channel_length = config_data["channels"].length;

    if(channel_length == 0) {
      console.log("No channels to pull!");
      return;
    }

    var max_results = Math.ceil(100 / channel_length);

    if(max_results > 50) {
      max_results = 50;
    }

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

  var queue_next = function () {
    if(queue_pointer > queue.length) {
      queue_pointer = 0;
    }

    var this_pointer = queue_pointer;
    queue_pointer++;

    return queue[this_pointer];
  };

  // #3 -- Draw initial grid

  var draw_grid = function() {
    var target = jQuery('div#target');
    for(var y = 0; y < config_data["y"]; y++) {
      var parent = jQuery('<div class="grid"></div>').appendTo(target);
      for(var x = 0; x < config_data["x"]; x++) {
        var element_id = 'vid_' + x + '_' + y;
        var element = '<div id="' + element_id + '" class="video unit col-1-' + x + '"><div id="'+element_id+'_content"></div></div>';
        jQuery(element).appendTo(parent);
        set_thumbnail(element_id, queue_next());
      }
    }
  };

  var onYouTubePlayerReady = function(playerid) {
    ytplayer = document.getElementById(playerid+'_content');
    ytplayer.mute();
    ytplayer.playVideo();

    window["onStateChange" + playerid] = function(state) {
      if(state === 0) {
        set_thumbnail(playerid, queue_next());
        flip_square();
      }
    };

    ytplayer.addEventListener("onStateChange", "onStateChange" + playerid);
  };

  return {
    start: function() {
      // #0 - Set defaults
      jQuery.getJSON("/config", {}, function(data) {
        if(data) {
          config_data = data;

          if(config_data["message"]) {
            jQuery("h1").text(config_data["message"]);
          }

          var xy = set_grid();
          config_data["x"] = xy["x"];
          config_data["y"] = xy["y"];

          fetch_videos();
        } else {
          console.log("Couldn't pull config data from server.");
        }
      });

      window.onYouTubePlayerReady = onYouTubePlayerReady;
    }
  };
})();

jQuery(document).ready(function(){
  ytWall.start();
});
