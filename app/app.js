var app = angular.module('imagetilefun', []);
$(function () {
    $('.ui.select').dropdown();
});
class MainController {
    constructor(redditData, dataStore, globalEvent, $q, $rootScope) {
        this.redditData = redditData;
        this.dataStore = dataStore;
        this.globalEvent = globalEvent;
        this.$q = $q;
        this.$rootScope = $rootScope;
        this.subreddit = '';
        this.sortOption = '_';
        this.postCount = 100;
        this.mainLoading = false;
        this.images = [];
        this.next = '';
        this.count = 0;
        this.color = RedditData.FALLBACK_COLOR;
        this.isMenuOpen = false;
        this.seenCount = 0;
        this.subredditInfo = null;
        this.showExtDesc = false;
        this.lastLoadedOn = new Date(1);
        // Options
        this.showImages = true;
        this.showGifs = false;
        this.showTitles = false;
        this.showDates = false;
        this.showPostNum = false;
        this.cardsPerRow = 6;
        this.showSeenFilter = false;
        $(document).on('scroll', () => this.infScrollHandler());
        this.loadSettings();
        this.loadFromUrl();
        // Subscribe to hash changed event
        $rootScope.$on('hashchange', () => this.loadFromUrl());
    }
    load() {
        if (this.subreddit && this.subreddit.length > 0) {
            this.images = [];
            this.count = 0;
            this.next = null;
            this.loadSubreddit(false);
            this.loadSubredditInfo();
            gtag('send', 'event', 'itf', 'initialLoad');
            gtag('send', 'event', 'subreddit', this.subreddit);
            window.location.hash = "/r/" + this.subreddit;
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
                gtag('send', 'event', 'itd', 'loadMore');
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
    resetSeen() {
        if (confirm('Are you sure you want to clear your "Seen" list?\r\nThis cannot be undone.')) {
            this.dataStore.SaveSeenList([]);
            this.images = this.images.map(i => {
                i.seen = false;
                return i;
            });
            this.updateSeenCount();
        }
    }
    menuToggle($event) {
        this.isMenuOpen = !this.isMenuOpen;
        this.noBubble($event);
    }
    closeMenu($event) {
        if ($($event.target).parents('.ui.main.menu').length > 0) {
            return;
        }
        this.isMenuOpen = false;
    }
    showMoreDesc($event) {
        this.showExtDesc = true;
        this.noBubble($event);
    }
    showLessDesc($event) {
        this.showExtDesc = false;
        this.noBubble($event);
    }
    loadFromUrl() {
        var hash = window.location.hash.slice(1);
        if (hash.length > 0 && /^\/r\/[a-z0-9_]+$/i.test(hash)) {
            this.subreddit = hash.slice(3);
            this.load();
        }
    }
    loadSubredditInfo() {
        this.redditData.GetSubredditInfo(this.subreddit).then(i => {
            this.subredditInfo = i;
            this.color = i.color;
        });
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
            // Update 'seen'
            this.updateSeenCount();
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
        this.showSeenFilter = settings.showSeenFilter;
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
            sortOption: this.sortOption,
            showSeenFilter: this.showSeenFilter
        });
    }
    updateSeenCount() {
        this.seenCount = this.dataStore.GetSeenList().length;
    }
    noBubble($event) {
        $event.stopPropagation();
        $event.preventDefault();
        $event.cancelBubble = true;
        $event.returnValue = false;
    }
}
MainController.INF_SCROLL_THRESHOLD = 500;
MainController.$inject = ['RedditData', 'DataPersistence', 'GlobalEvent', '$q', '$rootScope'];
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
    SaveSeenList(seen) {
        // de-dupe first
        var uniqueSeen = seen.filter(function (item, i) {
            return seen.indexOf(item) == i;
        });
        localStorage.setItem(DataPersistence.seenKey, JSON.stringify(uniqueSeen));
    }
    GetSeenList() {
        var data = localStorage.getItem(DataPersistence.seenKey);
        if (data && data.length) {
            try {
                return JSON.parse(data);
            }
            catch (_a) {
                return [];
            }
        }
        return [];
    }
}
DataPersistence.settingsKey = "persistedSettings";
DataPersistence.seenKey = "seenThings";
app.service('DataPersistence', DataPersistence);
class GlobalEvent {
    constructor($window, $rootScope) {
        $window.addEventListener("hashchange", () => $rootScope.$broadcast('hashchange'), false);
    }
}
GlobalEvent.$inject = ['$window', '$rootScope'];
app.service('GlobalEvent', GlobalEvent);
class MarkdownFilter {
    static filter($sce) {
        return (input) => $sce.trustAsHtml(markdownit().render(input).replace(/href=\"\/r\//gi, 'href="#/r/'));
    }
}
MarkdownFilter.$inject = ['$sce'];
app.filter('markdown', MarkdownFilter.filter);
class RedditData {
    constructor($http, dataPersistence) {
        this.$http = $http;
        this.dataPersistence = dataPersistence;
        this.thisSession = [];
    }
    GetSubredditInfo(subreddit) {
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/about.json`)
            .then(d => {
            var info = d.data.data;
            return {
                color: info.primary_color || info.key_color || RedditData.FALLBACK_COLOR,
                title: info.title,
                description: info.description,
                name: info.display_name,
                subscribers: info.subscribers,
                icon: info.icon_img
            };
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
        // Clear "this" list if count is 0.
        if (count === 0) {
            console.info("Clearing current session cached IDs.");
            this.thisSession = [];
        }
        count += postCount;
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/${sort}.json?limit=${postCount}&count=${count - postCount}&${qs}`)
            .then(d => {
            var seen = this.dataPersistence.GetSeenList();
            return {
                before: d.data.data.before,
                after: d.data.data.after,
                count: count,
                images: d.data.data.children
                    .map((post, i) => {
                    // Store what just came back in a cache so the new stuff isn't dimmed
                    if (seen.indexOf(post.data.id) === -1) {
                        this.thisSession.push(post.data.id);
                    }
                    post.data.postNum = ((count + i) - (postCount - 1)).toString(); /* +100, -1 */
                    post.data.seen = seen.indexOf(post.data.id) > -1 && this.thisSession.indexOf(post.data.id) === -1;
                    post.data._metadata = this.getPostMetadata(post.data);
                    return post;
                })
                    .filter(post => {
                    return post.data._metadata.class && post.data._metadata.class.length;
                }).map((post, i) => {
                    var p = post.data;
                    return {
                        id: p.name,
                        shortId: p.id,
                        postNum: p.postNum,
                        permalink: `https://www.reddit.com${p.permalink}`,
                        metadata: p._metadata,
                        comments: p.num_comments,
                        title: p.title,
                        imageUrl: p.url,
                        datestamp: p.created.toString(),
                        datePostedFriendly: moment.unix(p.created_utc).local().format("(YYYY) MMM Do @ h:mm a"),
                        datePostedAgo: moment.unix(p.created_utc).local().fromNow(),
                        seen: p.seen
                    };
                })
            };
        })
            .then(resp => {
            var list = this.dataPersistence.GetSeenList();
            var seenList = resp.images.map(i => i.shortId);
            this.dataPersistence.SaveSeenList(list.concat(seenList));
            return resp;
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
        if (RedditData.WHITELISTS.images.some(pattern => new RegExp(pattern).test(url.pathname))) {
            m.class = 'image';
        }
        else if (RedditData.WHITELISTS.gifs.some(pattern => new RegExp(pattern).test(url.pathname))) {
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
    'i\\.redd\\.it',
    'i\\.imgur\\.com',
    '.+\\.media\\.tumblr\\.com',
    '.+\\.deviantart\\.net'
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
RedditData.$inject = ['$http', 'DataPersistence'];
app.service('RedditData', RedditData);
class TrimFilter {
    static filter() {
        return (input, len) => typeof input !== 'undefined' && input && input.length < len ? input : input.slice(0, len) + "...";
    }
}
app.filter('trim', TrimFilter.filter);
