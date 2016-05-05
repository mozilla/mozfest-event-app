This project was derived from the [SRCCON app](https://github.com/OpenNews/srccon-schedule). Hardcoded and event specific bits have been removed from the codebase. We have also made a few things [configuarable](https://github.com/mozilla/schedule-app-core#configs)!

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
4. modify config values before your initiate the `Schedule()` instance. For detailed configs doc see [here](https://github.com/mozilla/schedule-app-core#configs). 
5. make sure the `.json` files you pass in to the app are in the correct format. For detailed data format doc see [here](https://github.com/mozilla/schedule-app-core#json-format).
6. :tada: open `index.html` on a browser to see your schedule app in action! 


# Configs #

See [Configs Doc](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/CONFIGS.md).


# JSON Format #

See [JSON Format](https://github.com/mozilla/schedule-app-core/blob/gh-pages/docs/JSON_FORMAT.md).


# Demo app #

Check out the example app [here](http://mozilla.github.io/schedule-app-core/demo/). :shipit: 
