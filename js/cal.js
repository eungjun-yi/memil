var data = {};

var updatePreview = function(data) {
  if (data['summary']) {
    $('#what').text(data['summary']);
  } else {
    $('#what').text('');
  }

  if (data['date']) {
    $('#when').text(moment(data['date']).calendar());
    $('.when').css('display', '');
  } else {
    $('#when').text('');
    $('.when').css('display', 'none');
  }
  
  if (data['emails']) {
    $('#with').text(data['emails'].join(', '));
    $('.with').css('display', '');
  } else {
    $('#with').text('');
    $('.with').css('display', 'none');
  }

  if (data['location']) {
    $('#where').text(data['location']);
    $('.where').css('display', '');
  } else {
    $('#where').text('');
    $('.where').css('display', 'none');
  }
}

var update = function() {
  source = $('#event').val();

  var phrases = [];
  var prepositions = ['with', 'at', 'on', 'in'];

  for (var i in prepositions) {
    var name = prepositions[i];
    var matched = source.match(new RegExp('\\b' + name + '\\b'));
    if (matched) {
      phrases.push({name: name, index: matched.index});
    }
  }

  phrases = _.sortBy(phrases, function(item) { return item.index; });

  var emails, locate, date;

  if (phrases[0]) {
    data['summary'] = source.substr(0, phrases[0].index).trim();
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
      date = Date.create(phrase, 'ko');
      if (date == 'Invalid Date') {
        date = null;
      }

      if (!date) {
        if (name == 'with') {
          emails = phrase;
        } else {
          locate = phrase;
        }
      }
    }
  } else {
    data['summary'] = source.trim();
  }

  if (date) {
    data['date'] = date;
  } else {
    delete data['date'];
  }
  
  if (emails) {
    var _emails = emails.split(',');
    emails = [];
    for (var i in _emails) {
      emails = emails.concat(_emails[i].split(' and '));
    }
    data['emails'] = emails;
  } else {
    delete data['emails'];
  }

  if (locate) {
    data['location'] = locate;
  } else {
    delete data['location'];
  }

  updatePreview(data);
}

var notifyError = function(message) {
  $('#submit_button').button('reset');
  $('#alert-message').remove();
  $('<div id="alert-message">' + message + '</div>')
    .insertBefore('#new-event')
    .addClass('alert alert-error');
}

var notifySuccess = function(message) {
  $('#submit_button').button('reset');
  $('#alert-message').remove();
  $('<div id="alert-message">' + message + '</div>')
    .insertBefore('#new-event')
    .addClass('alert alert-success');
}

var addEvent = function(calendar_id) {
  if (data.date) {
    data.end = data.start = {
      dateTime: moment(data.date).format()
    }
  } else {
    data.start = data.end = {
      dateTime: moment().format()
    };
  }

  if (data.emails) {
    data.attendees = [];
    for (var i in data.emails) {
      data.attendees.push({
        email: data.emails[i],
        responseStatus: 'needsAction'
      });
    };
  }

  data.reminders = { useDefault: true };

  calendar_id = encodeURIComponent(calendar_id);
  url = 'https://www.googleapis.com/calendar/v3/calendars/' + calendar_id + '/events?sendNotifications=false';
  $.ajax(url,
    {
      contentType: 'application/json; charset=utf8',
      datatype: 'json',
      type: 'post',
      headers: {
        Authorization: 'Bearer ' + access_token
      },
      data: JSON.stringify(data),
      success: function(data) {
        notifySuccess('Created successfully. <a href="' + data.htmlLink +'">Click to go to the event.</a>');
      },
      error: function(jqXHR, textStatus, error) {
        notifyError('Failed to create an event: ' + error + ' from ' + url);
      }
    }
  );
}

var getTheFirstCalendar = function(callback) {
  url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1&minAccessRole=writer';
  $.ajax(url,
    {
      datatype: 'json',
      headers: {
        Authorization: 'Bearer ' + access_token
      },
      success: function(data) {
        if (typeof data === 'string') {
	  data = JSON.parse(data);
	}
        addEvent(data.items[0].id);
      },
      error: function(jqXHR, textStatus, error) {
        notifyError('Failed to get a calendar: ' + error + 'from ' + url);
      }
    }
  );
}

var validateAccessToken = function(callback) {
  var url = 
    'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' +
    access_token;

  $.get(url, function(data) {
    callback();
  }).error(function() {
    console.log('access token is not valid');
  });
}

$(function() {
  try{
    /*
    validateAccessToken(function() { console.log('validateAccessToken success'); });
    */
    $('#event').focus();
    $('#event').keyup(update);
    $('#new-event').submit(function() {
      $('#submit_button').button('loading');
      getTheFirstCalendar(addEvent);
      return false;
    });
  } catch (err) {
    notifyError(err.message);
  }
});

// vim:et:ts=2:sts=2:sw=2
