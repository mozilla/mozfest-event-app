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
