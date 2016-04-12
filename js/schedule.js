function Schedule(options) {
  var schedule = {};

  schedule.init = function(options) {
    // TODO: make these configurable, passed in as options
    // when you create a Schedule() instance on the page
    schedule.sourceJSON = 'sessions.json';
    schedule.spacesJSON = 'spaces.json';
    schedule.pathwaysJSON = 'pathways.json';
    schedule.$container = $('#schedule');
    schedule.$toggles = $('<ul>').appendTo('#schedule-controls');
    schedule.$pageLinks = $('#page-links');
    // if true, avoids using history.back(), which doesn't work offline
    schedule.offlineMode = false;

    // TODO: determine list of unique tab names and dates
    // after loadSessions() gets actual session data
    schedule.tabList = [
      { name: 'Friday', displayName: 'Fri', tabDate: new Date(2015,10,6) },
      { name: 'Saturday', displayName: 'Sat', tabDate: new Date(2015,10,7) },
      { name: 'Sunday', displayName: 'Sun', tabDate: new Date(2015,10,8) },
      { name: 'All', displayName: 'All' }
    ];
    schedule.sessionList = [];
    schedule.spaceMetaList = [];
    schedule.pathwayMetaList = [];
    schedule.pathwayMap = [];
    // check for saved sessions in localStorage. Because localStorage only
    // takes strings, split on commas so we get an array of session IDs
    if (Modernizr.localstorage) {
      localStorage['mozfest2015_saved_sessions'] = localStorage['mozfest2015_saved_sessions'] || '';
      schedule.savedSessionIDs = _.compact(localStorage['mozfest2015_saved_sessions'].split(',')) || [];
    }

    // add UI elements
    schedule.addListeners();
    schedule.addToggles();

    // set chosenTab to tab matching today's date if possible
    schedule.getChosenTab();

    // fetch data and display it
    schedule.load();
  }

  // determine what data to show on initial pageload
  schedule.load = function() {
    // if there's a hash, someone is loading a specific session or tab
    if (!window.location.hash) {
      // if no hash, just load the base schedule
      schedule.makeSchedule();
    } else {
      // otherwise determine relevant detail page and call route()
      var hashArray = window.location.hash.substring(1).split(/-(.+)?/);
      schedule.route(hashArray[0], hashArray[1]);
    }
  }

  // this is a single page app, and route() functions like a URL router
  schedule.route = function(pageType, pageID) {
    // currently this app supports two types of detail pages:
    // 1) _session (which gets a detail page for a given session)
    // 2) _show (which gets a session list for a specific tab)
    switch(pageType) {
      case "_session":
        // get session details based on ID value from the URL
        schedule.getSessionDetail(pageID);
        break;
      case "_show":
        // set chosenTab to ID value from URL, then get session list
        schedule.chosenTab = pageID;
        schedule.makeSchedule();
        break;
      case "_spaces":
        // shows list of Spaces and their description
        schedule.displaySpacesList();
        break;
      case "_space":
        // show sessions in a space based on space slug in URL
        schedule.displaySessionsOfSpace(pageID);
        break;
      case "_pathways": 
        // shows list of all pathways
        schedule.displayPathwaysList();
        break;
      case "_pathway":
        // show sessions in a pathway based on pathway slug in URL
        schedule.getFilteredSessions("pathways", pageID);
        break;
    }
  }

  // call makeSchedule() to display the selected list of sessions
  schedule.makeSchedule = function() {
    schedule.loadChosenTab();
  }

  // loadSessions() gets session data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to sourceJSON file.
  // An optional callback function can be passed in.
  schedule.loadSessions = function(callback) {
    if (schedule.sessionList.length) {
      // if the app already has collected session data,
      // make sure it's sorted, then fire the callback
      schedule.sortSessionGroups(schedule.sessionList);
      if (callback) {
        callback();
      }
    } else {
      // if there's no session data yet, fetch from JSON
      $.getJSON(schedule.sourceJSON, function() {
          // temporarily show loading text
          $('.open-block').html('<span class="loading">LOADING SCHEDULE DATA <span>.</span><span>.</span><span>.</span></span>');
        })
        .done(function(results) {
          $('.open-block').text('OPEN');
          schedule.sortSessionGroups(results);
          // update savedSessionList with any new data
          schedule.updateSavedSessionList();
          if (callback) {
            callback();
          }
        });
    }
  }

  // loadSpaces() gets Spaces meta data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to spacesJSON file.
  // An optional callback function can be passed in.
  schedule.loadSpaces = function(callback) {
    if (schedule.spaceMetaList.length) {
      // if the app already has collected Spaces meta data, fire the callback
      if (callback) {
        callback();
      }
    } else {
      // if there's no Spaces meta data yet, fetch from JSON
      $.getJSON(schedule.spacesJSON)
        .done(function(results) {
          schedule.spaceMetaList = results;
          if (callback) {
            callback();
          }
        });
    }
  }

  // loadPathways() gets Pathways meta data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to loadPathways file.
  // An optional callback function can be passed in.
  schedule.loadPathways = function(callback) {
    if (schedule.pathwayMetaList.length) {
      // if the app already has collected Pathways meta data, fire the callback
      if (callback) {
        callback();
      }
    } else {
      // if there's no Pathways meta data yet, fetch from JSON
      $.getJSON(schedule.pathwaysJSON)
        .done(function(results) {
          schedule.pathwayMetaList = results;
          if (callback) {
            callback();
          }
        });
    }
  }


  // sortSessionGroups() performs basic sorting so session lists
  // are rendered in proper order
  // TODO: pass in a sorting function rather than hard-code it here
  schedule.sortSessionGroups = function(data) {
    schedule.sessionList = _.sortBy(data, function(i) {
      // simple way to divide sessions into groups by length
      return i.length != '1 hour';
    });
    schedule.getPathwaysCountMap();
  }

  // writeSession() renders session data into a template fragment.
  // Can be called during loops to render out an entire list
  schedule.writeSession = function(targetBlock, templateData, template) {
    if (!template) {
      // default to "card" display for tappable list items
      var template = schedule.sessionCardTemplate
    }
    // remove any placeholder blocks (in the "Favorites" tab)
    targetBlock.find('.open-block').remove();
    // add session information to the page
    targetBlock.append(template(templateData));
  }
  
  // remove all placeholder "Open" blocks on page
  schedule.clearOpenBlocks = function() {
    var openBlocks = schedule.$container.find('.open-block').parent();
    openBlocks.prev('h3').remove();
    openBlocks.remove();
  }

  // prepares session data to be rendered into a template fragment
  schedule.makeSessionItemTemplateData = function(sessionItem, expanded) {
    var templatedata = {
      session: sessionItem,
      sessionID: sessionItem.id,
      sessionClass: sessionItem.everyone ? 'everyone' : sessionItem.length == '1 hour' ? 'length-short' : 'length-long',
      showDay: false,
      showFacilitators: true,
      smartypants: schedule.smartypants
    }
    // some templates need to show expanded data
    if (expanded) {
      templatedata.showDay = true;
      templatedata.showFacilitators = true;
    }

    return templatedata;
  }

  // addSessionsToSchedule() will take a list of session objects
  // and write them all onto the page
  schedule.addSessionsToSchedule = function(sessionList) {
    // pass in a subset of sessions manually,
    // or fall back to schedule.sessionList
    var sessionList = sessionList || schedule.sessionList;

    var visibleIDs = $('.page-block:visible').map(function() {
      return this.id;
    })
    var visibleSessionList = _.filter(sessionList, function(s) {
      return _.contains(visibleIDs, s.scheduleblock)
    })

    _.each(visibleSessionList, function(v, k) {
      // find the correct schedule block on the page for this session
      var targetBlock = $('#'+v.scheduleblock);
      // prep the session data for the template
      var templateData = schedule.makeSessionItemTemplateData(v);
      // render it in
      schedule.writeSession(targetBlock, templateData);

      // for long sessions, which span both halves of a schedule block,
      // add "ghost" version to the second half of the block
      if (v.length == '2.5 hours') {
        templateData.sessionID += '-ghost';
        templateData.sessionClass += ' session-ghost';

        var targetBlock = $('#'+v.scheduleblock.replace('-1','-2'));
        schedule.writeSession(targetBlock, templateData);
      }
    });

    // add "fav" star controls to all session items on the page
    schedule.addStars('.session-list-item');

    // run the callback after adding all available sessions.
    schedule.addBlockToggles();
  }

  // showSessionDetail() renders session data into the detail template,
  // including full session description, etc.
  schedule.showSessionDetail = function() {
    // when user taps a session to see details, the ID is stored
    // in the sessionID variable. Use that to fetch data from sessionList
    var session = _.find(schedule.sessionList, function(i) {
      return i.id == schedule.sessionID;
    })

    if (session) {
      // if sessionList has a session matching chosen ID, render it
      var templateData = {
        session: session,
        slugify: schedule.slugify, // context function for string-matching
        smartypants: schedule.smartypants // context function for nice typography
      }

      // turn facilitator_array into array of individual facilitator objects
      templateData.session.facilitator_array = _.map(session.facilitator_array, function(facilitator) {
        var metaArray = facilitator.split(",");
        var meta = {
          name: metaArray.splice(0,1),
          description: ""
        };
        var otherMeta = _.each(metaArray, function(value) {
          if (value.indexOf("@") > -1) {
            meta.twitter = schedule.trim(value);
          } else {
            meta.description += schedule.trim(value);
          }
        });
        return meta;
      })

      // add pathway array for individual links
      templateData.session.pathwayArray = _.each(session.pathways.split(','), function(i) {
        schedule.trim(i);
      })

      // clear currently highlighted tab/page link
      schedule.clearHighlightedPage();

      schedule.$container.html(schedule.sessionDetailTemplate(templateData));
      // allowing faving from detail page too
      schedule.addStars('.session-detail');
    } else {
      // if no matching ID found, just make a full session list
      schedule.makeSchedule();
    }
  }

  // utility function to clean up element that held session detail
  schedule.clearSessionDetail = function() {
    $('#session-detail-wrapper').remove();
  }

  // call getSessionDetail() when you have a sessionID value, but you
  // can't be sure that the app has loaded session data. E.g. initial
  // pageload goes directly to a session detail view
  schedule.getSessionDetail = function(sessionID) {
    // store sessionID in case we need it later
    schedule.sessionID = sessionID;

    if (schedule.sessionList.length) {
      // if the data's loaded, render the detail page
      schedule.showSessionDetail();
    } else {
      // otherwise fetch data and pass showSessionDetail() as callback
      schedule.loadSessions(schedule.showSessionDetail);
    }
  }

  // this is a single-page app, and updateHash() helps track state
  schedule.updateHash = function(value) {
    var baseURL = window.location.href.replace(window.location.hash, '');
    var newURL = (!!value) ? baseURL + "#_" + value : baseURL;

    window.history.pushState(value, "", newURL);
    // make sure we *have* a window.history before we try to manipulate it
    window.history.ready = true;
  }

  // utility function to make sure transitions are the same across functions
  schedule.transitionElementIn = function(element, callback) {
    element.fadeIn(50, function() {
      if (callback) {
        callback();
      }
    });
  }

  // add fav stars that tap to store session ID values in localStorage
  schedule.addStars = function(containerClass) {
    if (Modernizr.localstorage) {
      $(containerClass+':not(.session-everyone)').append('<span class="favorite"><i class="fa fa-heart-o"></i></span>');
      // if any sessions have been faved, make sure their star is lit
      _.each(schedule.savedSessionIDs, function(i) {
        $('[data-session="' + i + '"]').find('.favorite').addClass('favorite-active');
      })
    }
  }
  
  // add icons for collapsible scheduleblocks
  schedule.addBlockToggles = function() {
    var blocks = schedule.$container.find('.page-block:visible');
    blocks.prev('h3').addClass('slider-control').append('<i class="fa fa-chevron-circle-down"></i>');
    blocks.addClass('slider');
    schedule.calculateBlockHeights(blocks);
    schedule.$container.find('.page-caption').append('<a href="#" id="slider-collapse-all" class="page-control" data-action="collapse">Hide all sessions</a>');
  }

  // calculate and store block heights for animations
  schedule.calculateBlockHeights = function(blocks) {
    var blocks = blocks || schedule.$container.find('.page-block');
    _.each(blocks, function(b) {
      var block = $(b);
      var blockHeight = block.height()+'px';
      block.attr('data-max-height', blockHeight).css('max-height', blockHeight);
    });
  }
  
  // add a set of tabs across the top of page as toggles that change display
  schedule.addToggles = function() {
    if (Modernizr.localstorage) {
      // only add "Favorites" tab if browser supports localStorage
      schedule.tabList.splice(schedule.tabList.length-1, 0, { name: 'Favorites', displayName: '<i class="fa fa-heart"></i>' });
    }

    // set toggle width as percentage based on total number of tabs
    var toggleWidth = (1 / schedule.tabList.length) * 100;

    // add the toggle links
    _.each(schedule.tabList, function(tab) {
      schedule.$toggles.append(
        $('<li>').css('width', toggleWidth+'%').append(
          $('<a>').html(tab.displayName).attr('href', '#').attr('id', 'show-'+tab.name.toLowerCase())
        )
      );
    });
  }

  // getChosenTab() sets value of chosenTab if none exists, likely because
  // the app is just being loaded. Show "today's" tab if possible
  schedule.getChosenTab = function() {
    if (!schedule.chosenTab) {
      var today = new Date().toDateString();
      var favoredTab = _.find(schedule.tabList, function(i) {
        return (!i.tabDate) ? false : i.tabDate.toDateString() == today
      })

      if (favoredTab) {
        // if we can match today's date, show it by default
        schedule.chosenTab = favoredTab.name.toLowerCase();
      } else {
        // otherwise show contents of first tab in the list
        schedule.chosenTab = schedule.tabList[0].name.toLowerCase();
      }
    }
  }

  // given a JSON key name `filterKey`, find session objects with values
  // that contain the string `filterValue`. This is a substring comparison
  // based on slugified versions of key and value, e.g. "my-great-pathway"
  schedule.getFilteredSessions = function(filterKey, filterValue) {
    schedule.filterKey = filterKey || schedule.filterKey;
    schedule.filterValue = filterValue || schedule.filterValue;

    if (!schedule.sessionList.length) {
      // this is first page load so fetch session data
      schedule.loadSessions(schedule.showFilteredSessions);
    } else {
      schedule.showFilteredSessions();
    }
  }
  schedule.showFilteredSessions = function() {
    schedule.clearHighlightedPage();

    if (!!schedule.filterKey) {
      schedule.filteredList = _.filter(schedule.sessionList, function(v, k) {
        return (schedule.slugify(v[schedule.filterKey]).indexOf(schedule.slugify(schedule.filterValue)) >= 0);
      });
    }

    schedule.$container.html(schedule.sessionListTemplate);
    schedule.addCaptionOverline("<h2>" + schedule.filterKey + ": " + schedule.filterValue.replace(/-/g," ") + "</h2>");
    schedule.addSessionsToSchedule(schedule.filteredList);
    schedule.clearOpenBlocks();
  }

  // based on the value of chosenTab, render the proper session list
  schedule.loadChosenTab = function() {
    // clear currently highlighted tab/page link
    // and make sure the selected tab is lit
    schedule.clearHighlightedPage();
    $('#show-'+schedule.chosenTab).addClass('active');

    if (schedule.chosenTab == 'favorites') {
      // "favorites" class changes display of session items
      schedule.$container.removeClass().addClass('favorites');
      if (schedule.savedSessionList) {
        // if the app has session data, render the favorites list
        schedule.showFavorites();
      } else {
        // otherwise load session data and pass showFavorites() as callback
        schedule.loadSessions(schedule.showFavorites);
      }
    } else if (schedule.chosenTab == 'all') {
      schedule.$container.removeClass().addClass('all-sessions');
      // loadSessions() is safe to call no matter what because it knows
      // to look for local session data before calling for json
      schedule.loadSessions(schedule.showFullSessionList);
    } else {
      // handle standard tabs like "Thursday" or "Friday"
      schedule.$container.html(schedule.sessionListTemplate);
      schedule.$container.find('.schedule-tab').hide();
      $('#'+schedule.chosenTab).show();
      schedule.addCaptionOverline();
      schedule.loadSessions(schedule.addSessionsToSchedule);
    }
  }

  // the list view is treated differently than normal tabs that have "cards"
  // to tap on. This shows expanded data, and includes search/filtering
  schedule.showFullSessionList = function() {
    schedule.$container.empty();
    schedule.addListControls();

    // exclude "everyone" sessions like lunch, dinner, etc.
    var fullList = _.reject(schedule.sessionList, function(i) {
      return i.everyone;
    });
    // sort the data by session name, not by schedule time
    fullList = _.sortBy(fullList, function(i) {
      return i.title;
    });

    // render the list
    _.each(fullList, function(v, k) {
      var templateData = schedule.makeSessionItemTemplateData(v, true);
      schedule.writeSession(schedule.$container, templateData, schedule.sessionListItemTemplate);
    });

    // add fav stars
    schedule.addStars('.session-list-item');
  }

  // provide some user instructions at top of page
  schedule.addCaptionOverline = function(captionHTML) {
    schedule.$container.prepend("<div class='page-caption'></div>");
    schedule.$container.find('.page-caption').html(captionHTML);
  }

  schedule.clearHighlightedPage = function() {
    // clear currently highlighted tab (if any) from "schedule-controls"
    schedule.$toggles.find('a').removeClass('active');
    // clear highlighted page link (if any) from "page-links" on the nav bar
    schedule.$pageLinks.find('a').removeClass('active');
  }

  // adds search filter and expanded data toggle to top of "All" sessions list
  schedule.addListControls = function() {
    schedule.addCaptionOverline();

    var filterForm = '<div id="filter-form">\
        <label for="list-filter">Search names, facilitators, spaces, pathways, and descriptions:</label>\
        <input class="filter" type="text" id="list-filter" />\
      </div>';
    $(filterForm).appendTo(schedule.$container);

    var expand = $('<a id="show-descriptions" class="page-control" data-action="show" href="#"><i class="fa fa-plus-circle"></i> Show descriptions</a>').appendTo(schedule.$container);

    var filteredList = $('#schedule');
    // watch search input for changes, and filter the session list accordingly
    $('#list-filter').change(function() {
      var filterVal = $(this).val();
      if (filterVal) {
        // compare current value of search input across session data,
        // matching against titles, session leader names, descriptions,
        // pathways and spaces
        var filteredSessions = _.filter(schedule.sessionList, function(v, k) {
          return (v.title.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.facilitators.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.pathways.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.space.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.description.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0);
        });
        // get the IDs of the matching sessions ...
        var filteredIDs = _.pluck(filteredSessions, 'id');

        // ... temporarily hide all the sessions on the page ...
        $('.session-list-item').hide()
        $('.session-description').hide();
        // ... and then show matching sessions, including description
        _.each(filteredIDs, function(i) {
          $('#session-'+i).show().find('.session-description').show();
        })
        // because we're showing descriptions, hide the "expand" toggle
        expand.hide();
      } else {
        // no value in search input, so make sure all items are visible
        $('.session-description').hide();
        filteredList.find('.session-list-item').css('display','block');
        // show the "expand" toggle
        expand.show();
      }

      // show "no results" if search input value matches zero items
      if ($('.session-list-item:visible').length == 0) {
        $('#no-results').remove();
        $('#filter-form label').after('<p id="no-results">No matching results found.</p>');
      } else {
        $('#no-results').remove();
      }
      return false;
    }).keyup(function() {
      $(this).change();
    });
  }

  // showFavorites() handles display when someone chooses the "Favorites" tab
  schedule.showFavorites = function() {
    // provide some user instructions at top of page
    schedule.$container.empty().append('<p class="overline">Favorite sessions to store a list on this device</p>').append(schedule.sessionListTemplate);
    // use savedSessionList IDs to render favorited sessions to page
    schedule.addSessionsToSchedule(schedule.savedSessionList);
    schedule.clearOpenBlocks();
  }

  // uses savedSessionIDs list to compile data for favorited sessions
  schedule.updateSavedSessionList = function() {
    schedule.savedSessionList = _.filter(schedule.sessionList, function(v, k) {
      // by default include "everyone" sessions on favorites list
      // just to make temporal wayfinding easier
      return (v.space == 'Everyone') || _.contains(schedule.savedSessionIDs, v.id);
    });
  }

  // display the list of Spaces and their descriptions
  schedule.displaySpacesList = function() {
    schedule.clearHighlightedPage();
    schedule.$pageLinks.find('#spaces-page-link').addClass('active');
    schedule.$container.html("");
    schedule.addCaptionOverline("<h3><span>Spaces</span></h3>");

    schedule.loadSpaces(function() {
      _.each(schedule.spaceMetaList, function(v, k) {
        // prep the Space data for the template
        var templateData = {
          space: {
            name: v.name,
            description: v.description,
            iconSrc: v.iconSrc,
            slugify: schedule.slugify
          }
        };
        schedule.$container.append(schedule.spacesListTemplate(templateData));
      });
    });
  }

  // display all sessions of a particular Space
  schedule.displaySessionsOfSpace = function(space_slug) {
    schedule.getFilteredSessions("space", space_slug);
  }

  // display the list of Pathways and their descriptions
  schedule.displayPathwaysList = function() {
    if (!schedule.sessionList.length) {
      schedule.loadSessions(schedule.appendPathwayListItems);
    } else {
      schedule.appendPathwayListItems();
    }
  }

  schedule.appendPathwayListItems = function() {
    schedule.clearHighlightedPage();
    schedule.$pageLinks.find('#pathways-page-link').addClass('active');
    schedule.$container.html("");
    schedule.addCaptionOverline("<h3><span>Pathways</span></h3>");

    schedule.loadPathways(function() {
      var pathwaysListKeys = _.map(schedule.pathwayMetaList, function(pathway) {
        return pathway.name;
      });

      _.each(_.sortBy(_.keys(schedule.pathwayMap)), function(v, k) {
        // index in pathwaysListKeys 
        var index = pathwaysListKeys.indexOf(v);
        // prep the Pathway data for the template
        var templateData = {
          name: v,
          numSessions: schedule.pathwayMap[v],
          description: [],
          slugify: schedule.slugify
        };

        if (index > -1) {
          templateData.description = schedule.pathwayMetaList[index].description;
        }
        schedule.$container.append(schedule.pathwayMapTemplate(templateData));
      });
    });
  }

  schedule.getPathwaysCountMap = function() {
    if ( schedule.pathwayMap.length == 0 ) {
      var pathwaysArray = [];
      _.each(schedule.sessionList, function(session) {
        _.each(session.pathways.split(","), function(p) {
          pathwaysArray.push(p.trim());
        });
      });
      schedule.pathwayMap = _.countBy(_.flatten(pathwaysArray));
    }
  }


  // add the standard listeners for various user interactions
  schedule.addListeners = function() {
    // clicking on the "Spaces" link on the nav bar displays the list of Spaces
    schedule.$pageLinks.on('click', '#spaces-page-link', function(e) {
      schedule.updateHash('spaces');
      schedule.displaySpacesList();
    });

    // clicking on the "Spaces" link on the nav bar displays the list of Spaces
    schedule.$pageLinks.on('click', '#pathways-page-link', function(e) {
      schedule.updateHash('pathways');
      schedule.displayPathwaysList();
    });

    // clicking on "See all events in this Space" shows all sessions within that particular Space
    schedule.$container.on('click', '.see-all-events-in-this-space', function(e) {
      e.preventDefault();

      var space_slug = $(this).parents(".space-list-item").data("space");
      schedule.updateHash('space-'+space_slug);
      schedule.displaySessionsOfSpace(space_slug);
    });

    // clicking on "Pathway card" shows all sessions that tagged with that pathway
    schedule.$container.on('click', '.pathway-list-item', function(e) {
      e.preventDefault();

      var pathway_slug = $(this).data("pathway");
      schedule.updateHash('pathway-'+pathway_slug);
      schedule.getFilteredSessions("pathways", pathway_slug);
    });

    // clicking on session "card" in a list opens session detail view
    schedule.$container.on('click', '.session-list-item', function(e) {
      e.preventDefault();
      var clicked = $(this).data('session');

      // track interaction in Google Analytics
      schedule.trackEvent('Session Detail Opened', clicked);
      // update the hash for proper routing
      schedule.updateHash('session-'+clicked);
      schedule.getSessionDetail(clicked);
    });

    // return to full schedule from session detail view
    schedule.$container.on('click', '#show-full-schedule', function(e) {
      e.preventDefault();

      if (window.history.ready && !schedule.offlineMode) {
        // use history.back() if possible to keep state in sync
        window.history.back();
      } else {
        // otherwise update hash and clear view manually
        schedule.updateHash('');
        schedule.clearSessionDetail();
        schedule.makeSchedule();
      }
    });

    // scroll down to transcription inside session detail view
    schedule.$container.on('click', '#show-transcription', function(e) {
      e.preventDefault();

      var targetPos = schedule.$container.offset().top + $("#transcription").offset().top;
      $("#session-detail-wrapper").scrollTop(targetPos);
    });

    // toggle session descriptions on "All" sessions tab
    schedule.$container.on('click', '#show-descriptions', function(e) {
      e.preventDefault();
      var clicked = $(this);
      var action = clicked.data('action');

      if (action == 'show') {
        $('.session-list-item').find('.session-description').show();
        clicked.html('<i class="fa fa-minus-circle"></i> Hide descriptions').data('action', 'hide');
      } else {
        $('.session-list-item').find('.session-description').hide();
        clicked.html('<i class="fa fa-plus-circle"></i> Show descriptions').data('action', 'show');
      }
    });

    // toggle individual schedule blocks on header tap
    schedule.$container.on('click', '.slider-control', function(e) {
      var clicked = $(this);
      var targetBlock = clicked.next('.page-block');
      schedule.animateBlockToggle(targetBlock);
      clicked.find('.fa').toggleClass('fa-chevron-circle-left fa-chevron-circle-down')
    });
    
    // toggle all schedule blocks at once
    schedule.$container.on('click', '#slider-collapse-all', function(e) {
      e.preventDefault();
      var clicked = $(this);
      var action = clicked.data('action');
      var targetBlocks = schedule.$container.find('.page-block');

      _.each(targetBlocks, function(b) {
        targetBlock = $(b);
        schedule.animateBlockToggle(targetBlock);
      });
      schedule.$container.find('h3 .fa').toggleClass('fa-chevron-circle-left fa-chevron-circle-down');
      
      if (action == 'collapse') {
        clicked.html('Show all sessions').data('action', 'expand');
      } else {
        clicked.html('Hide all sessions').data('action', 'collapse');
      }
    });

    // helper function for "toggle block" and "toggle all" controls
    schedule.animateBlockToggle = function(targetBlock) {
      targetBlock.toggleClass('closed');
      
      if (targetBlock.hasClass('closed')) {
        targetBlock.css('max-height', 0)
      } else {
        targetBlock.css('max-height', targetBlock.data('max-height'))
      }
    }
    
    // tap stars to favorite/unfavorite via localstorage
    schedule.$container.on('click', '.favorite', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var clicked = $(this);
      var sessionID = clicked.parent().data('session').toString();
      var targets = $('[data-session="' + sessionID + '"]').find('.favorite');

      // first toggle the star class so favorited sessions are lit
      targets.toggleClass('favorite-active');
      if (clicked.hasClass('favorite-active')) {
        // if favorited, add the session ID to savedSessionIDs
        schedule.savedSessionIDs.push(sessionID);
        schedule.trackEvent('Session Faved', sessionID);
      } else {
        // otherwise, we have unfavorited, so remove the saved ID
        schedule.savedSessionIDs = _.without(schedule.savedSessionIDs, sessionID);
        schedule.trackEvent('Session Unfaved', sessionID);
        // if we're actually *on* the "Favorites" tab,
        // we need to remove this element from the page
        if (schedule.chosenTab == 'favorites') {
          targets.parent('.session-list-item').fadeOut('fast', function() {
            var target = $(this);
            var targetBlock = target.parents('.page-block');
            target.remove();
            if (!targetBlock.find('.session-list-item').length) {
              //targetBlock.append('<div class="open-block">OPEN</div>');
              targetBlock.prev('h3').remove();
              targetBlock.fadeOut('fast');
            }
          });
        }
      }
      // stash the list as a string in localStorage
      localStorage['mozfest2015_saved_sessions'] = schedule.savedSessionIDs.join();
      // update the data associated with this user's favorites
      schedule.updateSavedSessionList();
    });

    // tap a schedule tab to toggle to a different view
    schedule.$toggles.on('click', 'a', function(e) {
      e.preventDefault();

      var clicked = $(this).attr('id');
      schedule.updateHash(clicked);

      schedule.chosenTab = clicked.replace('show-','');
      schedule.trackEvent('Tab change', schedule.chosenTab);
      schedule.loadChosenTab();
    });

    // this is a single-page app, but we need to support the back button
    window.onpopstate = function(event) {
      // if window.history isn't available, bail out
      if (!window.history.ready) return;
      schedule.clearSessionDetail();
      schedule.load();
    };
  }

  // utility function to track events in Google Analytics
  schedule.trackEvent = function(action, label) {
    ga('send', 'event', 'Schedule App', action, label);
  }

  // utility function to pass into templates for nice typography
  schedule.smartypants = function(str) {
    if (!str) { return }
    return str
      // em dashes
      .replace(/--/g, '\u2014')
      // opening single quotes
      .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
      // closing single quotes & apostrophes
      .replace(/'/g, '\u2019')
      // opening double quotes
      .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
      // closing double quotes
      .replace(/"/g, '\u201d')
      // ellipses
      .replace(/\.{3}/g, '\u2026');
  }

  // underscore.string formatters
  schedule.escapeRegExp = function(str) {
    if (str == null) return '';
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  }
  schedule.defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + escapeRegExp(characters) + ']';
  }
  schedule.nativeTrim = String.prototype.trim;
  schedule.trim = function(str, characters) {
    if (str == null) return '';
    if (!characters && schedule.nativeTrim) return schedule.nativeTrim.call(str);
    characters = schedule.defaultToWhiteSpace(characters);
    return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
  }
  schedule.defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + schedule.escapeRegExp(characters) + ']';
  }
  schedule.dasherize = function(str) {
    return schedule.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
  }

  // utility function to turn strings into "slugs" for easier matching
  // e.g. "My Great Pathway" -> "my-great-pathway"
  schedule.slugify = function(str) {
    if (!str) { return '' }
    var from = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
      to = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
      regex = new RegExp(schedule.defaultToWhiteSpace(from), 'g');

    str = String(str).toLowerCase().replace(regex, function(c){
      var index = from.indexOf(c);
      return to.charAt(index) || '-';
    });

    return schedule.dasherize(str.replace(/[^\w\s-]/g, ''));
  }

  // compile the Underscore templates
  schedule.sessionListTemplate = _.template(
    $("script#session-list-template").html()
  );

  schedule.sessionCardTemplate = _.template(
    $("script#session-card-template").html()
  );

  schedule.sessionListItemTemplate = _.template(
    $("script#session-list-item-template").html()
  );

  schedule.sessionDetailTemplate = _.template(
    $("script#session-detail-template").html()
  );

  schedule.spacesListTemplate = _.template(
    $("script#spaces-list-template").html()
  );

  schedule.pathwayMapTemplate = _.template(
    $("script#pathways-list-template").html()
  );

  // fight me
  schedule.init();
}

// settings for marked library, to allow markdown formatting in session details
marked.setOptions({
  tables: false,
  smartypants: true
});

// instantiate the app
new Schedule();
