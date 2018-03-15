var app = angular.module('imagetilefun', []);
$(function () {
    $('.ui.select').dropdown();
});
class MainController {
    constructor(redditData, dataStore, $q) {
        this.redditData = redditData;
        this.dataStore = dataStore;
        this.$q = $q;
        this.subreddit = '';
        this.sortOption = '_';
        this.postCount = 100;
        this.mainLoading = false;
        this.images = [];
        this.next = '';
        this.count = 0;
        this.color = RedditData.FALLBACK_COLOR;
        // Options
        this.showImages = true;
        this.showGifs = false;
        this.showTitles = false;
        this.showDates = false;
        this.showPostNum = false;
        this.cardsPerRow = 6;
        $(document).on('scroll', () => this.infScrollHandler());
        this.loadSettings();
    }
    load() {
        if (this.subreddit && this.subreddit.length > 0) {
            this.images = [];
            this.count = 0;
            this.next = null;
            this.loadSubreddit(false);
            this.loadColor();
        }
    }
    loadKeyPressed($event) {
        if ($event.keyCode === 13) {
            this.load();
        }
    }
    updateClassName(num) {
        // Angular does not preserve the order, which is important in SemanticUI. It must read "six column", not "column six".
        // So we have to hack it and use jQuery instead. :/
        $('#results').removeClass('column three four five six seven eight nine ten eleven twelve');
        var className = '';
        switch (num) {
            case 3:
                className = 'three';
                break;
            case 4:
                className = 'four';
                break;
            case 5:
                className = 'five';
                break;
            case 6:
                className = 'six';
                break;
            case 7:
                className = 'seven';
                break;
            case 8:
                className = 'eight';
                break;
            case 9:
                className = 'nine';
                break;
            case 10:
                className = 'ten';
                break;
            case 11:
                className = 'eleven';
                break;
            case 12:
                className = 'twelve';
                break;
            default:
                className = '';
                break;
        }
        $('#results').addClass(className + ' column');
        this.saveSettings();
        // Re-flowing cards could cause the page to not be able to scroll, so re-check if we're at the "bottom".
        this.infScrollHandler();
    }
    infScrollHandler() {
        // Hack because the event handler replaces "this"...
        var me = angular.element($('#app')).controller();
        $.debounce(2000, true, () => {
            if (window.scrollY + window.innerHeight >= document.body.scrollHeight - MainController.INF_SCROLL_THRESHOLD && !me.mainLoading && me.next) {
                this.loadSubreddit(true);
            }
        })();
    }
    basicChangedHandler() {
        this.saveSettings();
    }
    showClass(className) {
        switch (className) {
            case "image": return this.showImages;
            case "gif": return this.showGifs;
            default: return false;
        }
    }
    loadColor() {
        this.redditData.GetSubredditColor(this.subreddit).then(c => this.color = c);
    }
    loadSubreddit(append) {
        this.mainLoading = true;
        this.redditData.GetImagesFromSubreddit(this.subreddit, this.next, this.sortOption, parseInt(this.postCount.toString()), this.count)
            .then(data => {
            if (append) {
                this.images = this.images.concat(data.images);
            }
            else {
                this.images = data.images;
            }
            this.count = data.count;
            this.next = data.after;
            this.mainLoading = false;
            // In case we get too few results, start loading the next ones
            this.infScrollHandler();
            // Find and remove "removed.png"
            $('#results img').each((i, e) => {
                if ($(e).attr('src').endsWith('removed.png')) {
                    $(e).parent('.card').remove();
                }
            });
        });
    }
    loadSettings() {
        var settings = this.dataStore.LoadSettings();
        if (!settings) {
            return;
        }
        this.cardsPerRow = settings.cardsPerRow;
        this.showDates = settings.showDates;
        this.showPostNum = settings.showPostNum;
        this.showTitles = settings.showTitles;
        this.showGifs = settings.showGifs;
        this.showImages = settings.showImages;
        this.postCount = settings.postCount;
        this.sortOption = settings.sortOption;
        // Execute the card layout updater
        this.updateClassName(settings.cardsPerRow);
    }
    saveSettings() {
        this.dataStore.SaveSettings({
            cardsPerRow: this.cardsPerRow,
            showDates: this.showDates,
            showPostNum: this.showPostNum,
            showTitles: this.showTitles,
            showImages: this.showImages,
            showGifs: this.showGifs,
            postCount: this.postCount,
            sortOption: this.sortOption
        });
    }
}
MainController.INF_SCROLL_THRESHOLD = 500;
MainController.$inject = ['RedditData', 'DataPersistence', '$q'];
app.controller('MainController', MainController);
/*!
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function (window, undefined) {
    '$:nomunge';
    var $ = window.jQuery || window.Cowboy || (window.Cowboy = {}), jq_throttle;
    $.throttle = jq_throttle = function (delay, no_trailing, callback, debounce_mode) {
        var timeout_id, last_exec = 0;
        if (typeof no_trailing !== 'boolean') {
            debounce_mode = callback;
            callback = no_trailing;
            no_trailing = undefined;
        }
        var wrapper = function () {
            var that = this, elapsed = +new Date() - last_exec, args = arguments;
            function exec() {
                last_exec = +new Date();
                callback.apply(that, args);
            }
            ;
            function clear() {
                timeout_id = undefined;
            }
            ;
            if (debounce_mode && !timeout_id) {
                exec();
            }
            timeout_id && clearTimeout(timeout_id);
            if (debounce_mode === undefined && elapsed > delay) {
                exec();
            }
            else if (no_trailing !== true) {
                timeout_id = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay);
            }
        };
        if ($.guid) {
            wrapper.guid = callback.guid = callback.guid || $.guid++;
        }
        return wrapper;
    };
    $.debounce = function (delay, at_begin, callback) {
        return callback === undefined
            ? jq_throttle(delay, at_begin, false)
            : jq_throttle(delay, callback, at_begin !== false);
    };
})(this);
class DataPersistence {
    SaveSettings(settings) {
        var data = JSON.stringify(settings);
        localStorage.setItem(DataPersistence.settingsKey, data);
    }
    LoadSettings() {
        var storedData = localStorage.getItem(DataPersistence.settingsKey);
        if (storedData && storedData.length) {
            try {
                return JSON.parse(storedData);
            }
            catch (_a) {
                return null;
            }
        }
        return null;
    }
}
DataPersistence.settingsKey = "persistedSettings";
app.service('DataPersistence', DataPersistence);
class RedditData {
    constructor($http) {
        this.$http = $http;
    }
    GetSubredditColor(subreddit) {
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/about.json`)
            .then(d => {
            return d.data.data.primary_color || d.data.data.key_color || RedditData.FALLBACK_COLOR;
        });
    }
    GetImagesFromSubreddit(subreddit, after, sort, postCount, count) {
        let qs = ""; // TODO: Add querystring for continuation
        if (after && after.length > 0) {
            qs += 'after=' + after;
        }
        sort = sort.replace('_', '');
        if (sort && sort.length) {
            qs += "&t=all";
        }
        count += postCount;
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/${sort}.json?limit=${postCount}&count=${count - postCount}&${qs}`)
            .then(d => {
            return {
                before: d.data.data.before,
                after: d.data.data.after,
                count: count,
                images: d.data.data.children
                    .map((post, i) => {
                    post.data.postNum = ((count + i) - (postCount - 1)).toString(); /* +100, -1 */
                    post.data._metadata = this.getPostMetadata(post.data);
                    return post;
                })
                    .filter(post => {
                    return post.data._metadata.class && post.data._metadata.class.length;
                }).map((post, i) => {
                    var p = post.data;
                    return {
                        id: p.name,
                        postNum: p.postNum,
                        permalink: `https://www.reddit.com${p.permalink}`,
                        metadata: p._metadata,
                        comments: p.num_comments,
                        title: p.title,
                        imageUrl: p.url,
                        datestamp: p.created.toString(),
                        datePostedFriendly: moment.unix(p.created_utc).local().format("(YYYY) MMM Do @ h:mm a"),
                        datePostedAgo: moment.unix(p.created_utc).local().fromNow(),
                    };
                })
            };
        });
    }
    getPostMetadata(post) {
        var m = {
            class: null,
            displayAs: 'image',
            updatedImageUrl: null
        };
        var url = document.createElement('a');
        url.href = post.url;
        if (RedditData.WHITELISTS.images.some(ext => url.pathname.endsWith(ext))) {
            m.class = 'image';
        }
        else if (RedditData.WHITELISTS.gifs.some(ext => url.pathname.endsWith(ext))) {
            m.class = 'gif';
            if (url.href.endsWith('.gifv')) {
                m.displayAs = 'image';
                m.updatedImageUrl = post.url.replace('.gifv', '.gif');
            }
            else {
                m.displayAs = 'image';
            }
        }
        return m;
    }
}
RedditData.BASE_URL = 'https://www.reddit.com/r/';
RedditData.FALLBACK_COLOR = '#05427a';
RedditData.DOMAIN_WHITELIST = [
    'i.redd.it',
    'i.imgur.com'
];
RedditData.WHITELISTS = {
    'images': [
        'jpg',
        'jpeg',
        'png',
        'bmp'
    ],
    'gifs': [
        'gif',
        'gifv'
    ]
};
RedditData.$inject = ['$http'];
app.service('RedditData', RedditData);
