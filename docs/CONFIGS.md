# Custom Configs #

These are the supported configs that you can pass when you initiate the `Schedule()` instance.

| Key                                                                                             |
|--------------------------|------------------------------------------------------------------------------|
| [`mainHeaderText`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#mainheadertext-optional) |
| [`subHeaderText`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#subheadertext-optional) |
| [`displayNameForCategory`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#displaynameforcategory-required) |
| [`displayNameForTag`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#displaynamefortag-required) |
| [`pathToSessionsJson`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#pathtosessionsjson-required) |
| [`pathToCategoriesJson`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#pathtocategoriesjson-required) |
| [`pathToTagsJson`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#pathtotagsjson-required) |
| [`localStoragePrefix`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#localstorageprefix-required) |
| [`tabList`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#tablist-required) |
| [`additionalNavItems`](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md#additionalnavitems-optional) |

-----

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
  { name: 'Sunday', displayName: 'Sun', tabDate: new Date(2016,5,22) }
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
