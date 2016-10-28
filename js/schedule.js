function Schedule(CUSTOM_CONFIG) {
  var schedule = {};
  var LOCALSTORGE_KEY_SAVED_SESSIONS = CUSTOM_CONFIG.localStoragePrefix+'_saved_sessions';
  var SCHEDULE_NAV_LINK_ID = "schedule-page-link";
  var CATEGORY_NAV_LINK_ID = "categories-page-link";
  var TAG_NAV_LINK_ID = "tags-page-link";
  var DISPLAY_NAME_FOR_CATEGORY = {
    singular: CUSTOM_CONFIG.displayNameForCategory.singular.toLowerCase(),
    plural: CUSTOM_CONFIG.displayNameForCategory.plural.toLowerCase(),
  }
  var DISPLAY_NAME_FOR_TAG = {
    singular: CUSTOM_CONFIG.displayNameForTag.singular.toLowerCase(),
    plural: CUSTOM_CONFIG.displayNameForTag.plural.toLowerCase(),
  }

  schedule.init = function(options) {
    schedule.currentSearchTerm = "";

    // Build shared UI components
    schedule.buildNavbar();
    schedule.buildMainHeading();

    // TODO: make these configurable, passed in as options
    // when you create a Schedule() instance on the page
    schedule.pathToSessionsJson = options.pathToSessionsJson;
    schedule.pathToCategoriesJson = options.pathToCategoriesJson;
    schedule.pathToTagsJson = options.pathToTagsJson;
    schedule.$container = $('#schedule');
    schedule.$toggles = $('<ul>').appendTo('#schedule-controls');
    schedule.$pageLinks = $('#page-links');
    schedule.$loadingNotice = $('<div class="loading"><div></div><div></div><div></div></div>');
    
    // if true, avoids using history.back(), which doesn't work offline
    schedule.offlineMode = false;
    
    // this will tell us whether app is loaded at the event or outside of the event timeframe (pre- and post-)
    schedule.eventIsCurrentlyOngoing = false;

    // 
    schedule.chosenTab = null;
    schedule.favoredDayTab = null;

    // TODO: determine list of unique tab names and dates
    // after loadSessions() gets actual session data
    schedule.tabList = options.tabList;
    schedule.sessionList = [];
    schedule.categoryMetaList = [];
    schedule.tagMetaList = [];
    // check for saved sessions in localStorage. Because localStorage only
    // takes strings, split on commas so we get an array of session IDs
    if (Modernizr.localstorage) {
      localStorage[LOCALSTORGE_KEY_SAVED_SESSIONS] = localStorage[LOCALSTORGE_KEY_SAVED_SESSIONS] || '';
      schedule.savedSessionIDs = _.compact(localStorage[LOCALSTORGE_KEY_SAVED_SESSIONS].split(',')) || [];
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
      // if no hash, just load the default view
      schedule.loadDefaultView();
    } else {
      // otherwise determine relevant detail page and call route()
      var hashArray = window.location.hash.substring(1).split(/-(.+)?/);
      schedule.route(hashArray[0], hashArray[1]);
    }
  }

  schedule.loadDefaultView = function() {
    if (schedule.eventIsCurrentlyOngoing) {
      schedule.loadChosenTab({
        loadFavoredDayTab: true
      });
    } else {
      schedule.displayCategoriesList();
    }
  }

  // this is a single page app, and route() functions like a URL router
  schedule.route = function(pageType, pageID) {
    // currently this app supports two types of detail pages:
    // 1) _session (which gets a detail page for a given session)
    // 2) _show (which gets a session list for a specific tab)
    switch(decodeURIComponent(pageType)) {
      case "_search":
        schedule.trackEvent("Search", "Direct link or browser history");
        schedule.toggleSearchMode(true);
        break;
      case "_session":
        // get session details based on ID value from the URL
        schedule.trackEvent("Session Detail", "Direct link or browser history", pageID);
        schedule.getSessionDetail(pageID);
        break;
      case "_show":
        // set chosenTab to ID value from URL, then get session list
        schedule.trackEvent("Tab View", "Direct link or browser history", pageID);
        schedule.chosenTab = pageID;
        schedule.loadChosenTab();
        break;
      case "_"+DISPLAY_NAME_FOR_CATEGORY.plural:
        // shows list of Categories and their description
        schedule.trackEvent("Spaces Overview", "Direct link or browser history");
        schedule.displayCategoriesList();
        break;
       case "_"+DISPLAY_NAME_FOR_CATEGORY.singular:
        // show sessions in a Category based on the Category (or the equivalent custom label) slug in URL
        schedule.trackEvent("Individual Space Detail", "Direct link or browser history", pageID);
        schedule.displaySessionsOfCategory(pageID);
        break;
      case "_"+DISPLAY_NAME_FOR_TAG.plural:
        // shows list of all Tags
        schedule.trackEvent("Pathways Overview", "Direct link or browser history");
        schedule.displayTagsList();
        break;
      case "_"+DISPLAY_NAME_FOR_TAG.singular:
        // show sessions in a Tag based on the Tag(or the equivalent custom label) slug in URL
        schedule.trackEvent("Individual Pathway Detail", "Direct link or browser history", pageID);
        schedule.displaySessionsOfTag(pageID);
        break;
      default:
        schedule.loadDefaultView();
    }
  }

  // loadSessions() gets session data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to pathToSessionsJson file.
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
      $.ajax({
        url: schedule.pathToSessionsJson,
        dataType: "json",
        beforeSend: function(){
          schedule.$container.append(schedule.$loadingNotice);
        },
        success: function(results) {
          schedule.$loadingNotice.remove();

          $('.open-block').text('OPEN');
          schedule.formatTimeblocks(results.timeblocks);
          schedule.sortSessionGroups(results.sessions);
          // update savedSessionList with any new data
          schedule.updateSavedSessionList();
          if (callback) {
            callback();
          }
        }
      });
    }
  }

  // loadCategories() gets Category meta data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to pathToCategoriesJson file.
  // An optional callback function can be passed in.
  schedule.loadCategories = function(callback) {
    if (schedule.categoryMetaList.length) {
      // if the app already has collected Categories meta data, fire the callback
      if (callback) {
        callback();
      }
    } else {
      // if there's no Categoreis meta data yet, fetch from JSON
      $.ajax({
        url: schedule.pathToCategoriesJson,
        dataType: "json",
        beforeSend: function(){
          schedule.$container.append(schedule.$loadingNotice);
        },
        success: function(results) {
          schedule.$loadingNotice.remove();
          schedule.categoryMetaList = results;
          if (callback) {
            callback();
          }
        }
      });
    }
  }

  // loadTags() gets Tags meta data and sorts it for display. Checks
  // for local data first, then falls back to ajax call to loadTags file.
  // An optional callback function can be passed in.
  schedule.loadTags = function(callback) {
    if (schedule.tagMetaList.length) {
      // if the app already has collected Tags meta data, fire the callback
      if (callback) {
        callback();
      }
    } else {
      // if there's no Tags meta data yet, fetch from JSON
      $.ajax({
        url: schedule.pathToTagsJson,
        dataType: "json",
        beforeSend: function(){
          schedule.$container.append(schedule.$loadingNotice);
        },
        success: function(results) {
          schedule.$loadingNotice.remove();
          schedule.tagMetaList = results;
          if (callback) {
            callback();
          }
        }
      });
    }
  }

  schedule.formatTimeblocks = function(data) {
    schedule.timeblocks = _.sortBy(data, function(i) {
      return parseInt(i.order);
    });
  }


  // sortSessionGroups() performs basic sorting so session lists
  // are rendered in proper order
  // TODO: pass in a sorting function rather than hard-code it here
  schedule.sortSessionGroups = function(data) {
    schedule.sessionList = _.sortBy(data, function(i) {
      // simple way to divide sessions into groups by length
      return i.length != '1 hour';
    });
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

  // insert schedule block container into DOM
  schedule.generateListOfTimeblocks = function(timeblocks) {
    _.each(timeblocks,function(timeblock,i) {
      // TODO: can probably use template for this
      // schedule block header
      var header = $("<h3 class='timeblock-header'><span>"+timeblock['timeblock name']+"</span></h3>");
      var toggleIcon = $("<i class='fa fa-chevron-circle-left'></i>");
      // container
      var timeblockContainer = $("<div></div>")
                                .attr("id", timeblock.key)
                                .attr("class", "timeblock");
      var sessionsContainer = $("<div></div>").attr("class", "sessions-container slider")
                                              .html("<div class='open-block'>OPEN</div>")
                                              .css('display', 'none');

      if(schedule.shouldTimeblockBeOpen(timeblock.key)){
        timeblockContainer.addClass('expanded');
        sessionsContainer.css('display','block');
        toggleIcon.removeClass('fa-chevron-circle-left').addClass('fa-chevron-circle-down');
      }

      timeblockContainer.append(header.append(toggleIcon))
                        .append(sessionsContainer);

      schedule.$container.find(".schedule-tab").append(timeblockContainer);
    });
  }

  // prepares session data to be rendered into a template fragment
  schedule.makeSessionItemTemplateData = function(sessionItem, expanded) {
    var templatedata = {
      session: sessionItem,
      sessionID: sessionItem.id,
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
    schedule.generateListOfTimeblocks(schedule.timeblocks);

    _.each(sessionList, function(v, k) {
      // find the correct schedule block on the page for this session
      var targetBlock = $('#'+v.timeblock).find(".sessions-container");
      // prep the session data for the template
      var templateData = schedule.makeSessionItemTemplateData(v);
      // render it in
      schedule.writeSession(targetBlock, templateData);
    });

    // add "fav" star controls to all session items on the page
    schedule.addStars('.session-card');
    schedule.loadScrollState(window.location.hash);
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
        smartypants: schedule.smartypants, // context function for nice typography
        customCategoryLabel: DISPLAY_NAME_FOR_CATEGORY.singular,
        customTagLabel: DISPLAY_NAME_FOR_TAG.singular
      }

      // clear currently highlighted tab/page link
      schedule.clearHighlightedPage();

      schedule.$container.html(schedule.sessionDetailTemplate(templateData));
      // allowing faving from detail page too
      schedule.addStars('.session-detail');

      $("#"+SCHEDULE_NAV_LINK_ID).addClass("active");
    } else {
      // if no matching ID found, just make a full session list
      schedule.loadChosenTab({
        hashToUpdateTo: 'show-' + schedule.favoredDayTab
      });
    }
  }

  // utility function to clean up element that held session detail
  schedule.clearSessionDetail = function() {
    $('#session-detail-wrapper').remove();
  }

  schedule.saveScrollState = function(page, scrollY) {
    if(Modernizr.localstorage){
      var scrollStates = JSON.parse(localStorage.getItem('scrollStates')) || {};
      scrollStates[page] = scrollY;
      localStorage.scrollStates = JSON.stringify(scrollStates);
    }
  }

  schedule.loadScrollState = function(page) {
    if(schedule.previous === window.location.hash && Modernizr.localstorage){
      var scrollStates = JSON.parse(localStorage.getItem('scrollStates')) || {};
      if(scrollStates[page]){
        window.scroll(0,scrollStates[page]);
      }
    }
  }

  // call getSessionDetail() when you have a sessionID value, but you
  // can't be sure that the app has loaded session data. E.g. initial
  // pageload goes directly to a session detail view
  schedule.getSessionDetail = function(sessionID,updateHash) {
    schedule.saveScrollState(window.location.hash, window.scrollY);
    // store sessionID in case we need it later
    schedule.sessionID = sessionID;
    schedule.setBodyClass("detail-view");

    if (updateHash) {
      schedule.updateHash('session-'+sessionID);
    }

    if (schedule.sessionList.length) {
      // if the data's loaded, render the detail page
      schedule.showSessionDetail();
    } else {
      // otherwise fetch data and pass showSessionDetail() as callback
      schedule.loadSessions(schedule.showSessionDetail);
    }
    window.scroll(0,0);
  }

  // this is a single-page app, and updateHash() helps track state
  schedule.updateHash = function(value) {
    var baseURL = window.location.href.replace(window.location.hash, '');
    var newURL = (!!value) ? baseURL + "#_" + value : baseURL;
    schedule.previous = window.location.hash;
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
      $(containerClass).append('<span class="favorite"><i class="fa fa-heart-o"></i></span>');
      // if any sessions have been faved, make sure their star is lit
      _.each(schedule.savedSessionIDs, function(i) {
        $('[data-session="' + i + '"]').find('.favorite').addClass('favorite-active');
      })
    }
  }

  // add a set of tabs across the top of page as toggles that change display
  schedule.addToggles = function() {
    if (Modernizr.localstorage) {
      // only add "Favorites" tab if browser supports localStorage
      schedule.tabList.splice(schedule.tabList.length, 0, { name: 'Favorites', displayName: '<i class="fa fa-heart"></i>' });
    }

    // set toggle width as percentage based on total number of tabs
    var toggleWidth = (1 / schedule.tabList.length) * 100;

    // add the toggle links
    _.each(schedule.tabList, function(tab) {
      var tabName = tab.name.toLowerCase();
      schedule.$toggles.append(
        $('<li>').css('width', toggleWidth+'%').append(
          $('<a>').html(tab.displayName)
                  .attr('href', '#show-'+tabName)
                  .attr('id', 'show-'+tabName)
                  .attr("data-tab",tabName)
        )
      );
    });
  }

  // getChosenTab() sets value of chosenTab if none exists, likely because
  // the app is just being loaded. Show "today's" tab if possible
  schedule.getChosenTab = function() {
    var favoredDayTabName;

    if (!schedule.chosenTab) {
      var today = new Date().toDateString();
      var matchedDayTab = _.find(schedule.tabList, function(i) {
        return (!i.tabDate) ? false : i.tabDate.toDateString() == today
      });

      if (matchedDayTab) {
        // if we can match today's date, show it by default
        favoredDayTabName = matchedDayTab.name.toLowerCase();
        schedule.eventIsCurrentlyOngoing = true;
      } else {
        // otherwise show contents of first tab in the list
        favoredDayTabName = schedule.tabList[0].name.toLowerCase();
        schedule.eventIsCurrentlyOngoing = false;
      }
      schedule.favoredDayTab = favoredDayTabName;
      schedule.chosenTab = favoredDayTabName;
    }
  }

  // given a JSON key name `filterKey`, find session objects with values
  // that contain the string `filterValue`. This is a substring comparison
  // based on slugified versions of key and value, e.g. "my-great-tag"
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
    if ( schedule.filterKey !== "day" ) {
      schedule.clearHighlightedPage();
    }

    if (!!schedule.filterKey) {
      schedule.filteredList = _.filter(schedule.sessionList, function(v, k) {
        // TODO:FIXME: figure out how to clean up this singular and plural terms confusion
        var filterKey = (schedule.filterKey === "tag") ? "tags" : schedule.filterKey;
        return (schedule.slugify(v[filterKey]).indexOf(schedule.slugify(schedule.filterValue)) >= 0);
      });
    }

    schedule.$container.html(schedule.sessionListTemplate);


    if ( schedule.filterKey === 'day' ) {
      schedule.addSessionsToSchedule(schedule.filteredList);
      schedule.clearOpenBlocks();
    } else {
      var label = schedule.filterKey;
      var description = "";
      // TODO:FIXME: we can clean up 'displaySingleTagView' and 'displaySingleTagView' since they are basically the same code
      if ( schedule.filterKey === 'category' ) {
        schedule.displaySingleCategoryView();
      } else if ( schedule.filterKey === 'tag' ) {
        schedule.displaySingleTagView();
      }
    }
  }

  schedule.toggleSearchMode = function(turnItOn) {
    if ( turnItOn ) {
      schedule.$pageLinks.find("a").removeClass("active");
      schedule.$container.removeClass().addClass('all-sessions');
      schedule.updateHash("search");
      schedule.loadSessions(schedule.showFullSessionList);
      schedule.setBodyClass("search-mode");
      // if user came back from detail view of a matching session,
      // this triggers the list of search result again
      $('#list-filter').attr("value",schedule.currentSearchTerm).keyup();
    } else {
      schedule.currentSearchTerm = "";
    }
  }

  // render the proper tab based on the options
  schedule.loadChosenTab = function(options) {
    var tabName = schedule.chosenTab;
    var options = options || {};
    options = {
      loadFavoredDayTab: options.loadFavoredDayTab || false,
      hashToUpdateTo: options.hashToUpdateTo || null
    };

    if (options.loadFavoredDayTab) {
      tabName = schedule.favoredDayTab;
    }

    if (options.hashToUpdateTo) {
      schedule.updateHash(options.hashToUpdateTo);
    }

    // clear currently highlighted tab/page link
    // and make sure the selected tab is lit
    schedule.clearHighlightedPage();
    $('#show-'+tabName).addClass('active');
    schedule.setBodyClass("day-view");

    if (tabName == 'favorites') {
      // "favorites" class changes display of session items
      schedule.$container.removeClass().addClass('favorites');
      if (schedule.savedSessionList) {
        // if the app has session data, render the favorites list
        schedule.showFavorites();
      } else {
        // otherwise load session data and pass showFavorites() as callback
        schedule.loadSessions(schedule.showFavorites);
      }
    } else {
      // handle standard tabs like "Thursday" or "Friday"
      schedule.$container.html(schedule.sessionListTemplate);
      $('#'+tabName).show();
      schedule.addCaptionOverline();
      // TODO (for the data processor service): make sure "day" in sessions.json are all lowercase
      var capitalizedDayValue = tabName.charAt(0).toUpperCase() + tabName.slice(1);
      schedule.getFilteredSessions("day", capitalizedDayValue);
      $('#show-'+tabName).addClass('active');
    }
  }

  // the list view is treated differently than normal tabs that have "cards"
  // to tap on. This shows expanded data, and includes search/filtering
  schedule.showFullSessionList = function() {
    schedule.$container.empty();
    schedule.addListControls();

    var fullList = schedule.sessionList;

    var timeblocksMap = {};
    schedule.timeblocks.forEach(function(timeblock) {
      timeblocksMap[timeblock.key] = timeblock.order;
    });

    // sort the data by session start time
    fullList = _.sortBy(fullList, function(i) {
      return timeblocksMap[i.timeblock];
    });

    // render the list
    _.each(fullList, function(v, k) {
      var templateData = schedule.makeSessionItemTemplateData(v, true);
      schedule.writeSession(schedule.$container, templateData, schedule.searchModeSessionCardTemplate);
    });

    // add fav stars
    schedule.addStars('.session-card');

    // do not show any cards until user starts typing/searching
    $(".session-card").hide();
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
        <input class="filter" type="text" id="list-filter" />\
      </div>';
    $(filterForm).appendTo(schedule.$container);
    $('#list-filter').attr("placeholder", "Search names, facilitators, " + DISPLAY_NAME_FOR_CATEGORY.plural + ", " + DISPLAY_NAME_FOR_TAG.plural +", and descriptions...");
    $('#list-filter').focus();

    // watch search input for changes, and filter the session list accordingly
    $('#list-filter').change(function() {
      var filterVal = $(this).val();
      schedule.currentSearchTerm = filterVal;
      $('.session-card').hide();

      if (filterVal) {
        // compare current value of search input across session data,
        // matching against titles, session leader names, descriptions,
        // [Categories] and [Tags]
        var filteredSessions = _.filter(schedule.sessionList, function(v, k) {
          return (v.title.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.facilitators_names.join(" ").toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.tags.join(",").toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.category.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v["additional language"].toUpperCase().indexOf(filterVal.toUpperCase()) >= 0)
               || (v.description.toUpperCase().indexOf(filterVal.toUpperCase()) >= 0);
        });
        // get the IDs of the matching sessions ...
        var filteredIDs = _.pluck(filteredSessions, 'id');
        // ... and then show matching sessions
        _.each(filteredIDs, function(i) {
          $('#session-'+i).show();
        })
      }

      // show "no results" if search input value matches zero items
      if ($('.session-card:visible').length == 0 && filterVal.length !== 0) {
        $('#no-results').remove();
        $('#filter-form input').after('<p id="no-results">Nothing found, please try another search.</p>');
      } else {
        $('#no-results').remove();
      }
      return false;
    }).keyup(function() {
      $(this).change();
    });

    $('#list-filter').blur(function() {
      schedule.trackEvent("Search Term", "typed", $(this).val());
    });
  }

  // showFavorites() handles display when someone chooses the "Favorites" tab
  schedule.showFavorites = function() {
    // provide some user instructions at top of page
    schedule.$container.empty().append('<p>Tap the hearts to add favorites to your list here.</p>').append(schedule.sessionListTemplate);
    // use savedSessionList IDs to render favorited sessions to page
    schedule.addSessionsToSchedule(schedule.savedSessionList);
    schedule.clearOpenBlocks();
  }

  // uses savedSessionIDs list to compile data for favorited sessions
  schedule.updateSavedSessionList = function() {
    schedule.savedSessionList = _.filter(schedule.sessionList, function(v, k) {
      return _.contains(schedule.savedSessionIDs, v.id);
    });
  }

  // display the list of Categories and their descriptions
  schedule.displayCategoriesList = function(updateHash) {
    schedule.setBodyClass();
    schedule.updateHash(DISPLAY_NAME_FOR_CATEGORY.plural);
    schedule.clearHighlightedPage();
    schedule.$pageLinks.find('#categories-page-link').addClass('active');
    schedule.$container.html("");

    schedule.loadCategories(function() {
      var templateData = {
        customCategoryLabel: DISPLAY_NAME_FOR_CATEGORY.singular,
        categories: [],
        slugify: schedule.slugify
      };
      _.each(schedule.categoryMetaList, function(v, k) {
        // prep the Category data for the template
        var category = {
          name: v.name,
          iconSrc: v.iconSrc,
          iconWidth: v.iconWidth
        };
        templateData.categories.push(category);
      });
      schedule.$container.append(schedule.categoriesListTemplate(templateData));
    });
  }

  // display the single [Category] view
  schedule.displaySingleCategoryView = function() {
    // TODO:FIXME: use underscore template for this?
    var header = "";
    var description = "";
    var icon = "";
    var categoryName = "";
    schedule.loadCategories(function() {
      var theCategory = schedule.categoryMetaList.filter(function(category){
        return schedule.slugify(category.name) === schedule.filterValue;
      });
      if (theCategory.length > 0) {
        theCategory = theCategory[0];
        categoryName = theCategory.name;
        description = theCategory.description.map(function(paragraph) {
          return "<p>" + paragraph + "</p>";
        }).join("");
        if (theCategory.iconSrc) {
          icon = "<img src='" + theCategory.iconSrc + "' width='" + theCategory.iconWidth + "' class='category-icon'>";
          icon = "<div class=icon-container>" + icon + "</div>";
        }
      }
      schedule.$pageLinks.find('#categories-page-link').addClass('active');
      schedule.addCaptionOverline(
        "<div class='category-header'>" +
          icon +
          "<h2>" + categoryName + "</h2>" +
        "</div>" +
        "<div class='category-description'>" + description + "</div>"
      );

      schedule.addSessionsToSchedule(schedule.filteredList);
      schedule.clearOpenBlocks();
    });
  }

  // display all sessions of a particular Category
  schedule.displaySessionsOfCategory = function(category_slug,updateHash) {
    schedule.setBodyClass();
    if (updateHash) {
      schedule.updateHash(DISPLAY_NAME_FOR_CATEGORY.singular+'-'+category_slug);
    }
    schedule.getFilteredSessions("category", category_slug);
  }

  // display the list of Tags and their descriptions
  schedule.displayTagsList = function(updateHash) {
    schedule.setBodyClass();
    if (updateHash) {
      schedule.updateHash(DISPLAY_NAME_FOR_TAG.plural);
    }

    if (!schedule.sessionList.length) {
      schedule.loadSessions(schedule.appendTagListItems);
    } else {
      schedule.appendTagListItems();
    }
  }

  schedule.appendTagListItems = function() {
    schedule.clearHighlightedPage();
    schedule.$pageLinks.find('#tags-page-link').addClass('active');
    schedule.$container.html("");

    schedule.loadTags(function() {
      var templateData = {
        customTagLabel: DISPLAY_NAME_FOR_TAG.singular,
        slugify: schedule.slugify,
        tags: []
      };
      _.each(schedule.tagMetaList, function(v, k) {
        // prep the Tag data for the template
        var tag = {
          name: v.name
        };
        templateData.tags.push(tag);
      });
      schedule.$container.append(schedule.tagListTemplate(templateData));
    });
  }

  // display the single [Tag] view
  schedule.displaySingleTagView = function() {
    var description = "";
    var tagName = "";
    schedule.loadTags(function() {
      var theTag = schedule.tagMetaList.filter(function(tag) {
        return schedule.slugify(tag.name) === schedule.filterValue;
      });
      if (theTag.length > 0) {
        theTag = theTag[0];
        tagName = theTag.name;
        description = theTag.description.map(function(paragraph) {
          return "<p>" + paragraph + "</p>";
        }).join("");
      }
      schedule.$pageLinks.find('#tags-page-link').addClass('active');
      schedule.addCaptionOverline(
        "<h2>" + tagName + "</h2>" +
        "<div class='tag-description'>" + description + "</div>"
      );

      schedule.addSessionsToSchedule(schedule.filteredList);
      schedule.clearOpenBlocks();
    });
  }

  // display all sessions of a particular [Tag]
  schedule.displaySessionsOfTag = function(tag_slug,updateHash) {
    schedule.setBodyClass();
    if (updateHash) {
      schedule.updateHash(DISPLAY_NAME_FOR_TAG.singular+'-'+tag_slug);
    }
    schedule.getFilteredSessions("tag", tag_slug);
  }

  schedule.setBodyClass = function(className) {
    $("body").removeClass().addClass(className || "");
  }

  schedule.tabControlClickHandler = function(e) {
    if (e) e.preventDefault();

    var id, tab;

    if ( !$(this).data("tab") ) { 
      // when elem clicked isn't a tab control, e.g., the schedule link on top nav
      // we bring users to the "favored" day tab view instead
      tab = schedule.favoredDayTab;
      id = "show-" + tab;

      schedule.trackEvent("Default App Screen", "clicked");
    } else {
      tab = $(this).data("tab");
      id = $(this).attr('id');

      schedule.trackEvent("Tab Control", "clicked", tab);
    }

    schedule.toggleSearchMode(false);
    schedule.chosenTab = tab;
    schedule.loadChosenTab({
      hashToUpdateTo: id
    });
  };

  schedule.logoClickHandler = function(e) {
    if (e) e.preventDefault();

    schedule.toggleSearchMode(false);
    schedule.updateHash("show-" + schedule.favoredDayTab);
    schedule.loadDefaultView();
  }

  schedule.categoryItemClickHandler = function(e) {
    e.preventDefault();

    var category_slug = $(this).data("category");
    schedule.trackEvent("Individual Space Detail", "clicked", category_slug);
    schedule.displaySessionsOfCategory(category_slug,true);
    window.scrollTo(0,0);
  }

  schedule.tagItemClickHandler = function(e) {
    e.preventDefault();

    var tag_slug = $(this).data("tag");
    schedule.trackEvent("Individual Pathway Detail", "clicked", tag_slug);
    schedule.displaySessionsOfTag(tag_slug,true);
    window.scrollTo(0, 0);
  }

  //Manages state of timeblocks and stores that in localStorage
  schedule.toggleTimeblock = function(timeblockContainer) {
    timeblockContainer.toggleClass('expanded')
                      .find(".timeblock-header")
                      .find('.fa').toggleClass('fa-chevron-circle-left fa-chevron-circle-down');
    timeblockContainer.find('.sessions-container').slideToggle();

    var timeblockIsOpen = timeblockContainer.hasClass('expanded');
    var openTimeblocks = Modernizr.localstorage ? JSON.parse(localStorage.getItem('timeblock-states')) || [] : [];
    var timeblockID = timeblockContainer['0'].id;
    var index = openTimeblocks.indexOf(timeblockID);
    if(timeblockIsOpen && index === -1){
      openTimeblocks.push(timeblockID);
    } else if (!timeblockIsOpen && index > -1) {
        openTimeblocks.splice(index, 1);
    }
    if(Modernizr.localstorage){
      localStorage['timeblock-states'] = JSON.stringify(openTimeblocks);
    }
  }

  schedule.shouldTimeblockBeOpen = function(timeblockContainerId) {
    var defaultTimeblocks = [schedule.timeblocks[0].key]
    var openTimeblocks;
    
    openTimeblocks = Modernizr.localstorage ? JSON.parse(localStorage.getItem('timeblock-states')) || defaultTimeblocks : defaultTimeblocks;

    if(openTimeblocks.indexOf(timeblockContainerId) > -1){
      return true;
    }
    return false;
  }

  // add the standard listeners for various user interactions
  schedule.addListeners = function() {

    // tap a schedule tab to toggle to a different view
    schedule.$toggles.on('click', 'a', schedule.tabControlClickHandler);

    $("#search").on('click', function(e) {
      e.preventDefault();

      schedule.trackEvent("Search", "clicked", "nav item");
      schedule.toggleSearchMode(true);
    });

    // clicking on the logo displays the default view
    $(".logo").on('click', schedule.logoClickHandler);

    // clicking on the Schedule link on the nav bar displays the first Day tab
    schedule.$pageLinks.on('click', '#'+SCHEDULE_NAV_LINK_ID, schedule.tabControlClickHandler);

    // clicking on the [Categories] link on the nav bar displays the list of Categories
    schedule.$pageLinks.on('click', '#'+CATEGORY_NAV_LINK_ID, function(e) {
      e.preventDefault();

      schedule.trackEvent("Spaces Overview", "clicked", "nav item");
      schedule.displayCategoriesList(true);
    });

    // clicking on the [Tags] link on the nav bar displays the list of Tags
    schedule.$pageLinks.on('click', '#'+TAG_NAV_LINK_ID, function(e) {
      e.preventDefault();

      schedule.trackEvent("Pathways Overview", "clicked", "nav item");
      schedule.displayTagsList(true);
    });

    // clicking on [Category] shows all sessions within that particular [Category]
    schedule.$container.on('click', '.category-list-item', schedule.categoryItemClickHandler);
    schedule.$container.on('click', '.meta .category', schedule.categoryItemClickHandler);

    // clicking on [Tag] shows all Sessions within that particular [Tag]
    schedule.$container.on('click', '.tag-list-item', schedule.tagItemClickHandler);
    schedule.$container.on('click', '.meta .tag', schedule.tagItemClickHandler);

    // clicking on the header in a session "card" opens session detail view
    schedule.$container.on('click', '.session-card h4 a', function(e) {
      e.preventDefault();

      // track interaction in Google Analytics
      var clicked = $(this).parents('.session-card').data('session');
      schedule.trackEvent("Session Detail", "clicked", clicked);
      // update the hash for proper routing
      schedule.getSessionDetail(clicked,true);
    });

    // return to full schedule from session detail view
    schedule.$container.on('click', '#show-full-schedule', function(e) {
      e.preventDefault();

      schedule.setBodyClass();

      if (window.history.ready && !schedule.offlineMode) {
        // use history.back() if possible to keep state in sync
        window.history.back();
      } else {
        // otherwise update hash and clear view manually
        schedule.clearSessionDetail();
        schedule.loadChosenTab({
          hashToUpdateTo: 'show-'+schedule.chosenTab
        });
      }
    });

    // scroll down to transcription inside session detail view
    schedule.$container.on('click', '#show-transcription', function(e) {
      e.preventDefault();

      var targetPos = schedule.$container.offset().top + $("#transcription").offset().top;
      $("#session-detail-wrapper").scrollTop(targetPos);
    });

    // toggle individual schedule blocks on header tap
    schedule.$container.on('click', '.timeblock-header', function(e) {
      var $timeblockContainer = $(this).parents(".timeblock");
      schedule.toggleTimeblock($timeblockContainer);
    });

    // tap stars to favorite/unfavorite via localstorage
    schedule.$container.on('click', '.favorite', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var clicked = $(this);
      var sessionID = clicked.parent().data('session').toString();
      var targets = $('[data-session="' + sessionID + '"]').find('.favorite');

      // first toggle the star class so favorited sessions are lit
      targets
        .animate({
          fontSize: "-=5px"
        }, 100)
        .animate({
          fontSize: "+=5px",
        }, 200, function() {
          clicked.toggleClass('favorite-active');
          if (clicked.hasClass('favorite-active')) {
            // if favorited, add the session ID to savedSessionIDs
            schedule.savedSessionIDs.push(sessionID);
            schedule.trackEvent("Session Faved", "clicked", sessionID);
          } else {
            // otherwise, we have unfavorited, so remove the saved ID
            schedule.savedSessionIDs = _.without(schedule.savedSessionIDs, sessionID);
            schedule.trackEvent("Session Unfaved", "clicked", sessionID);
            // if we're actually *on* the "Favorites" tab,
            // we need to remove this element from the page
            if (schedule.chosenTab == 'favorites') {
              targets.parent('.session-card').fadeOut('fast', function() {
                var target = $(this);
                var targetBlock = target.parents('.timeblock');
                target.remove();
                if (!targetBlock.find('.session-card').length) {
                  targetBlock.prev('h3').remove();
                  targetBlock.fadeOut('fast');
                }
              });
            }
          }
          // stash the list as a string in localStorage
          localStorage[LOCALSTORGE_KEY_SAVED_SESSIONS] = schedule.savedSessionIDs.join();
          // update the data associated with this user's favorites
          schedule.updateSavedSessionList();
        });
    });

    schedule.$container.on("click", ".session-notes-url a", function(e) {
      var sessionNumber = $(this).parents(".session-detail").data("session");

      try { // ga doesn't exist if users have Do Not Track turned on
        // don't use schedule.trackEvent() as it's not designed for tracking outbound links
        ga('send', {
          hitType: 'event',
          eventCategory: "Notes Button",
          eventAction: "clicked",
          eventLabel: sessionNumber,
          transport: "beacon"
        });
      } catch (e) {}
    });

    // this is a single-page app, but we need to support the back button
    window.onpopstate = function(event) {
      // if window.history isn't available, bail out
      if (!window.history.ready) return;
      schedule.load();
    };
  }

  // utility function to track events in Google Analytics
  schedule.trackEvent = function(eventCategory, eventAction, eventLabel) {
    // see https://developers.google.com/analytics/devguides/collection/analyticsjs/events
    try { // ga doesn't exist if users have Do Not Track turned on
      ga('send', {
        hitType: 'event',
        eventCategory: eventCategory,
        eventAction: eventAction,
        eventLabel: eventLabel
      });
    } catch (e) {}
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
  // e.g. "My Great Tag" -> "my-great-tag"
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
    $("script#schedule-tab-template").html()
  );

  schedule.sessionCardTemplate = _.template(
    $("script#session-card-template").html()
  );

  schedule.searchModeSessionCardTemplate = _.template(
    $("script#search-mode-session-card-template").html()
  );

  schedule.sessionDetailTemplate = _.template(
    $("script#session-detail-template").html()
  );

  schedule.categoriesListTemplate = _.template(
    $("script#categories-list-template").html()
  );

  schedule.tagListTemplate = _.template(
    $("script#tags-list-template").html()
  );

  schedule.buildNavbar = function() {
    var navItems = [
      {
        label: DISPLAY_NAME_FOR_CATEGORY.plural,
        link: "#_"+DISPLAY_NAME_FOR_CATEGORY.plural,
        id: CATEGORY_NAV_LINK_ID
      },
      {
        label: DISPLAY_NAME_FOR_TAG.plural,
        link: "#_"+DISPLAY_NAME_FOR_TAG.plural,
        id: TAG_NAV_LINK_ID
      },
    ];
    var $pageLinksContainer = $("#page-links");
    navItems.concat(CUSTOM_CONFIG.additionalNavItems || []).forEach(function(navItem){
      $("<a>"+navItem.label+"</a>")
        .attr("href",navItem.link)
        .attr("id", navItem.id || '')
        .appendTo($pageLinksContainer);
    });
  };

  schedule.buildMainHeading = function() {
    var $mainHeadingContainer = $(".main-heading");
    $("<h1></h1>")
      .html(CUSTOM_CONFIG.mainHeaderText)
      .appendTo($mainHeadingContainer);
    $("<h2 class='subhead'></h2>")
      .html(CUSTOM_CONFIG.subHeaderText)
      .appendTo($mainHeadingContainer);
  }

  // fight me
  schedule.init(CUSTOM_CONFIG);
}

// settings for marked library, to allow markdown formatting in session details
marked.setOptions({
  tables: false,
  smartypants: true,
  sanitize: true
});
