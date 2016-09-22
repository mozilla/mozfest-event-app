## json for sessions ##

A `sessions.json` file (or you can give it another file name) should contains the following keys: `sessions` and `timeblocks`. Both are required.


#### `sessions` (*required*)

**Format**: `array`, contains a list of `session` objects.


```js
[
  {
    "additional language": "", // name of the language (other than English), if available
    "category": "For All Participants",
    "day": "Saturday",
    "description": "i'm the description. i'm the description. ", // session description in English
    "facilitators": {
      "1": {
          "name": "name of facilitator 1",
          "affiliated org": "afflicated org of facilitator 1", 
          "twitter": "twitter handle of facilitator 1"
      },
      "2": {
          "name": "name of facilitator 2",
          "affiliated org": "afflicated org of facilitator 2", 
          "twitter": "twitter handle of facilitator 2"
      },
      ...
      ...
      ...
    },
    facilitators_names: [
      "name of facilitator 1",
      "name of facilitator 2",
      "name of facilitator 3"
    ],
    "id": "1", // each session MUST has an unique id
    "localized description": "...", // localized session description, if any
    "localized title": "...", // localized session title, if any
    "location": "name of the location",
    "notes url": "https://example.com", // notes url
    "start": "09:00 AM", 
    "tags": "tag 1, tag 2, tag 3", // a string of tags, separated by commas
    "timeblock": "saturday-morning-block-1", // a "slugified" string, value match key of a `timeblock` object.
    "title": "Registration" // session title in English
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
