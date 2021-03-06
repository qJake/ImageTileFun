# Image Tile Fun

A fun, purely client-based image browser for Reddit! &mdash; [http://imagetile.fun/](http://imagetile.fun/)

## Features

* 100% pure client-side application (hosted on GitHub!)
* Images are linked and loaded from the source (no thumbnails)
    * Save as, drag + drop to a folder, or click to open in a new window
    * Supported image hosts:
        * Imgur
        * Reddit
        * (more to come)
    * Supported file types:
        * Images
        * GIF/GIFV (displayed as GIF)
* Slider for number of cards per row (3-12)
* Infinite scrolling (up to subreddit maximum of 1,000 posts)
* Show or hide Reddit post number, title, date, # comments, and Google Image / Yandex links
* Select number of posts to load per fetch ("per page")
* Select sort (Top, Hot, Controversial, etc)
* Settings are saved in local browser storage for future visits
* Remembers images you have "seen" already and dims them (optional)
* Shows subreddit info in the menu

## Built With

TypeScript (2.7) and Angular 1.x.

The repo should open cleanly in VS Code. I have not tested other IDEs.

### Running Locally

I recommend using [`live-server`](https://www.npmjs.com/package/live-server) installed globally, e.g.:

* (`npm install -g live-server`)
* `cd src`
* `live-server`

Handles automatic CSS and file change reloading.

## Wishlist

* [x] Save recent subreddit list
* [x] Update styling for mobile
* [x] Add URL hash / routing for links to subreddits (e.g. `imagetile.fun#/r/wallpaper`)
* [x] Ability to clear / reset saved setting (right now, you can just clear your local storage)
* [x] Subreddit info panel
* [x] Reorganize options into collapsible menu
* [ ] Offer "Pinterest-style" vertical card flow / layout (minimizes whitespace)
* [ ] Somehow detect and remove "removed" Reddit/Imgur images
* [x] Update styling for mobile
* [x] Add URL hash / routing for links to subreddits (e.g. `imagetile.fun#/r/wallpaper`)
* [x] Subreddit info panel
* [x] Reorganize options into collapsible menu

## Credits

Proudly developed with [**Semantic UI**](https://semantic-ui.com/) and [**AngularJS**](https://angularjs.org/).

Also includes:

* [jQuery Debounce plugin by Ben Alman](http://benalman.com/projects/jquery-throttle-debounce-plugin/)
* [Moment.js](https://momentjs.com/)
* [Markdown-It](https://github.com/markdown-it/markdown-it)
