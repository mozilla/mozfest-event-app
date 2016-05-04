This project was derived from the [SRCCON app](https://github.com/OpenNews/srccon-schedule). Hardcoded and event specific bits have been removed from the codebase. We have also made a few things [configuarable](https://github.com/mozilla/schedule-app-core#custom-configs)!

:large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: 

**Repo under heavy construction.**

**Do NOT use this in production yet as everything here is being actively updated every day.**

:large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: :large_orange_diamond: 

# How to create your own schedule app #

1. grab a copy of the sample `index.html` file [here](https://github.com/mozilla/schedule-app-core/blob/gh-pages/demo/index.html)
2. modify event related meta in `<head>` (e.g., `title`, `description`, favicon, Google Analytics tracking ID etc)
3. in `<body>`
  - drop your logo in `<div class="logo">`
  - do NOT modify the following sections
    - the main app container `div`
    ```html
      <div class="container">
        <div class="main-heading"></div>
        <div id="schedule-controls"></div>
        <article id="schedule"></article>
      </div>
    ```
    - templates: this is everything that's marked with script type "text/template", i.e., `<script type="text/template">`
4. modify custom config values before your initiate the `Schedule()` instance. For detailed configs doc see [here](https://github.com/mozilla/schedule-app-core#custom-configs). 
5. make sure the `.json` files you pass in to the app are in the correct format. For detailed data format doc see [here](https://github.com/mozilla/schedule-app-core#json-structures).
6. :tada: open `index.html` on a browser to see your schedule app in action! 



# Custom Configs #

These are the supported configs that you can pass when you initiate the `Schedule()` instance.

| Key                      | Link to doc                                                                  |
|--------------------------|------------------------------------------------------------------------------|
| `mainHeaderText`         | https://github.com/mozilla/schedule-app-core#mainheadertext-optional         |
| `subHeaderText`          | https://github.com/mozilla/schedule-app-core#subheadertext-optional          |
| `displayNameForCategory` | https://github.com/mozilla/schedule-app-core#displaynameforcategory-required |
| `displayNameForTag`      | https://github.com/mozilla/schedule-app-core#displaynamefortag-required      |
| `pathToSessionsJson`     | https://github.com/mozilla/schedule-app-core#pathtosessionsjson-required     |
| `pathToCategoriesJson`   | https://github.com/mozilla/schedule-app-core#pathtocategoriesjson-required   |
| `pathToTagsJson`         | https://github.com/mozilla/schedule-app-core#pathtotagsjson-required         |
| `localStoragePrefix`     | https://github.com/mozilla/schedule-app-core#localstorageprefix-required     |
| `tabList`                | https://github.com/mozilla/schedule-app-core#tablist-required                |
| `additionalNavItems`     | https://github.com/mozilla/schedule-app-core#additionalnavitems-optional     |


### `mainHeaderText` (*optional*)

**Format**: `string`

**Notes**: This the text of the big header on the app.

**Example Value**: `"Iron Chef Training Program"`

-----

### `subHeaderText` (*optional*)

**Format**: `string`

**Required**: No, optional.

**Notes**: This the text of the sub header on the app.

**Example Value**: `"June 21-22 · Hawaii"`



-----

### `displayNameForCategory` (*required*)

**Format**: `object` contains 2 keys: `singular` and `plural`
```js
{
  singular: 'value', // this can only be one word. letters only.
  plural: 'value' // this can only be one word. letters only.
}

```

**Notes**: A session can only belong to ONE category. Each event has its own terminology for category so we're making this configuarble. These values will be seen on the app nav links as well as used in URLs to the [category] pages (e.g., http://mozilla.github.io/schedule-app-core/demo/#_themes and http://mozilla.github.io/schedule-app-core/demo/#_theme-italian).

**Example Value**: 
```js
{
  singular: 'theme',
  plural: 'themes'
}
```


-----

### `displayNameForTag` (*required*)

**Format**: `object` contains 2 keys: `singular` and `plural`
```js
{
  singular: 'value', // this can only be one word. letters only.
  plural: 'value' // this can only be one word. letters only.
}

```

**Notes**: A session can only belong to MULTIPLE tags. Each event has its own terminology for tag so we're making this configuarble. These values will be seen on the app nav links as well as used in URLs to the [tag] pages (e.g., http://mozilla.github.io/schedule-app-core/demo/#_tags and http://mozilla.github.io/schedule-app-core/demo/#_tag-easy).

**Example Value**:
```js
{
  singular: 'tag',
  plural: 'tags'
}
```



-----

### `pathToSessionsJson` (*required*)

**Format**: `string`

**Notes**: path or url to the file that contains the sessions data. For data schema see [here](https://github.com/mozilla/schedule-app-core#json-for-sessions)
  
**Example Value**: 
`"iron-chef-sessions.json"`
`"http://mozilla.github.io/schedule-app-core/demo/iron-chef-sessions.json"`


-----

### `pathToCategoriesJson` (*required*)

**Format**: `string`

**Notes**: path or url to the file that contains the categories data. For data schema see [here](https://github.com/mozilla/schedule-app-core#json-for-categories)

**Example Value**: 
`"categories.json"`
`"http://mozilla.github.io/schedule-app-core/demo/categories.json"`


-----

### `pathToTagsJson` (*required*)

**Format**: `string`

**Notes**: path or url to the file that contains the tags data. For data schema see [here](https://github.com/mozilla/schedule-app-core#json-for-tags)

**Example Value**: 
`"tags.json"`
`"http://mozilla.github.io/schedule-app-core/demo/tags.json"`


-----

### `localStoragePrefix` (*required*)

**Format**: `string`, letters and hyphens only

**Notes**: This schedule app supports session favouriting (using browser localstorage) to allow attendees bookmark/favourite sessions. `localStoragePrefix` is used in the key that we grab bookmarked sessions from. (e.g., `mozfest2015_saved_sessions`, `srccon_saved_sessions`). So make sure you pass in an **unique** prefix for *every* app instance.

**Example Value**: `"iron-chef"`


-----

### `tabList` (*required*)

**Format**: `array`, contains a list of tab objects.
a tab object has the following keys

```js
{ 
  name: 'Saturday', // letters only. Value has to be one of the `day` value of the session object
  displayName: 'Sat', // label to display on the tab list on the app. Can be in `html`.
  tabDate: new Date(2016,5,21) // notice that month started from index `0`. i.e., beginning with 0 for January 
}
```

**Notes**:

**Example Value**: 
```js
[
  { name: 'Saturday', displayName: 'Sat', tabDate: new Date(2016,5,21) },
  { name: 'Sunday', displayName: 'Sun', tabDate: new Date(2016,5,22) },
  { name: 'All', displayName: '<i class="fa fa-search"></i>' }
]
```


-----

### `additionalNavItems` (*optional*)

**Format**: `array`, contains a list of nav item objects.
a nav item object has the following keys

```js
{ 
  label: "nameOfLink",
  link: "url",
  id: "id" // used for id attribute of the <a>
}
```

**Notes**:

**Example Value**:
```js
[
    { 
      label: "link 1",
      link: "url",
      id: "id-1"
    },
    { 
      label: "link 2",
      link: "url",
      id: "id-2"
    }
  ]
}
```

# JSON structures #

## json for sessions ##

A `sessions.json` file (or you can give it another file name) should contains the following keys: `sessions` and `timeblocks`. Both are required.


#### `sessions` (*required*)

**Format**: `array`, contains a list of `session` objects.


```js
[
  {
    "category": "For All Participants", // required
    "day": "Saturday", // required
    "description": "", // required
    "facilitator_array": [
      "facilitator #1",
      "facilitator #2"
      ...
    ], 
    "facilitators": "facilitator #1, facilitator #2, ...", // a string of facilitators, separated by commas
    "id": "1", // required, each session MUST has an unique id
    "location": "Main ballroom", 
    "start": "09:00 AM", 
    "tags": "tag 1, tag 2, tag 3", // a string of tags, separated by commas
    "timeblock": "saturday-morning-block-1", // a "slugified" string, value match key of a `timeblock` object.
    "title": "Registration" // session title
  }, 
  { 
    // another session object
  }
  ...
]
```

#### `timeblocks` (*required*)

**Format**: `array`, contains a list of `timeblock` objects.

```js
[
  {
    "day": "Saturday", 
    "key": "reserved-saturday-registration", // a "slugified" string, has to be unique
    "order": "1", // the order this timeblock section should appear on the day tab. For example, on the app this "reserved-saturday-registration" block will appear as the 2nd block on the Saturday tab.
    // "reserved for everyone": "yes", 
    "start time": "09:00 ", // in 24-hr format
    "timeblock name": "Saturday Registration" // label to show on the app
  },
  { 
    // another timeblock object
  }
  ...
]
```

## json for categories ##

A `categories.json` file (or you can give it another file name) should a list of `category` objects.

**Format**: `array`, contains a list of `category` objects.

```js
[
  {
    "name": "name of category",
    "description": [
      "paragraph 1",
      "paragraph 2",
      ...
    ],
    "iconSrc": "url-to-icon"
  },
  { 
    // another category object
  }
  ...
]
```

## json for tags ##

A `tags.json` file (or you can give it another file name) should a list of `tag` objects.

**Format**: `array`, contains a list of `tag` objects.

```js
[
  {
    "name": "name of tag",
    "description": [
      "paragraph 1",
      "paragraph 2",
      ...
    ],
  },
  { 
    // another tag object
  }
  ...
]
```

# Demo app #

Check out the example app [here](http://mozilla.github.io/schedule-app-core/demo/). :shipit: 
