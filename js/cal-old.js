// google javascript client library 안 쓰고 하려고 했는데, 캘린더에 이벤트 추가하려고 하면 (addEvent) 계속 401 에러가 남
var update = function() {
  source = $('#event').val();

  var phrases = [];
  var prepositions = ['with', 'at', 'on'];

  for (var i in prepositions) {
    var name = prepositions[i];
    var matched = source.match(new RegExp('\\b' + name));
    if (matched) {
      phrases.push({name: name, index: matched.index});
    }
  }

  phrases = _.sortBy(phrases, function(item) { return item.index; });

  if (phrases[0]) {
    $('#what').text(source.substr(0, phrases[0].index).trim());
    for (var i = 0; i < phrases.length; i++) {
      var name = phrases[i].name;
      var index = phrases[i].index;
      if (i + 1 < phrases.length) {
        var next_index = phrases[i + 1].index;
        start_pos = index + name.length;
        size = next_index - start_pos;
        phrase = source.substr(start_pos, size).trim();
      } else {
        phrase = source.substr(index + name.length).trim();
      }
      $('#' + name).text(phrase);
    }
  } else {
    $('#what').text(source.trim());
  }
}

var access_token;
var api_key="AIzaSyC3f_Io4vNbeirOuZVqHKk7YE92Z7XF--M";

var addEvent = function(calendar_id) {
  var what = $('#what').text();
  var start = $('#on').text();
  var email = $('#with').text();
  var where = $('#at').text();

  var data = {
    summary: what,
    'location': where,
    end: {
      dateTime: start
    },
    start: {
      dateTime: start
    },
    attendees: [{
      email: email
    }]
  };

  var test = {
    "end": 
    {
      "dateTime": "2012-08-30T12:25:00.000-07:00"
    },
    "start": 
    {
      "dateTime": "2012-08-30T10:25:00.000-07:00"
    },
    "summary": "success!!!"
  }

  calendar_id = encodeURIComponent(calendar_id);
  authenticate(function() {
    $.ajax('https://www.googleapis.com/calendar/v3/calendars/' + calendar_id + '/events?sendNotifications=false&key=' + api_key,
      {
        datatype: 'json',
        type: 'post',
        headers: {
          Authorization: 'Bearer ' + access_token
        },
        data: JSON.stringify(test),
        success: function(data) {
          console.log('success');
        },
        error: function(jqXHR, textStatus, error) {
          console.log(access_token);
          console.log('error:', textStatus);
        }
      }
    );
  });
}

var getTheFirstCalendar = function(callback) {
  $.ajax('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1&minAccessRole=writer&key=' + api_key,
    {
      datatype: 'json',
      headers: {
        Authorization: 'Bearer ' + access_token
      },
      success: function(data) {
        addEvent(data.items[0].id);
      },
      error: function(jqXHR, textStatus, error) {
        console.log('error:', textStatus);
      }
    }
  );
  /*
  $.get('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1&minAccessRole=writer&key=' + api_key + 'access_token=' + access_token, function(data) {
    alert(data);
  }).error(function() { alert('error2'); });
  */
}

var authenticate = function(callback) {
  // First, parse the query string
  var params = {}, queryString = location.hash.substring(1),
      regex = /([^&=]+)=([^&]*)/g, m;
  while (m = regex.exec(queryString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }

  access_token = params.access_token;

  if (access_token) {
    $.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + access_token, function(data) {
      callback();
    }).error(function() { alert('error1'); });
  }
}

$(function() {
  authenticate(function() { console.log('authenticate success'); });
  $('#redirect_uri').val('http://' + window.location.host);
  $('#event').keyup(update);
  $('#new_event').submit(function() {
    getTheFirstCalendar(addEvent);
    return false;
  });
});

// vim:tabstop=2
// vim:softtabstop=2
// vim:shiftwidth=2
