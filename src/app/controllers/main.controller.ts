// Google Analytics
declare function gtag(a: any, b: any, c: any, d: any, e?: any, f?: any): any

class MainController
{
    private static INF_SCROLL_THRESHOLD = 20;

    subreddit: string = '';
    sortOption: string = '_';
    postCount: number = 100;
    mainLoading: boolean = false;
    images: Array<IRedditImage> = [];
    next: string = '';
    count: number = 0;
    color: string = RedditData.FALLBACK_COLOR;
    isMenuOpen: boolean = false;
    seenCount: number = 0;
    subredditInfo: ISubredditInfo = null;
    showExtDesc: boolean = false;
    lastLoadedOn: Date = new Date(1);
    favorites: IFavorite[];
    selectedFavorite: string;
    isCurrentFavorite: boolean;
    notOnTop: boolean = false;

    // Options
    showImages: boolean = true;
    showGifs: boolean = false;
    showTitles: boolean = false;
    showDates: boolean = false;
    showPostNum: boolean = false;
    cardsPerRow: number = 6;
    showSeenFilter: boolean = false;
    showUpvotes: boolean = false;
    imageDelay: number = 500;

    imageResolverThread: number = -1;

    static $inject = ['RedditData', 'DataPersistence', 'FavoriteService', '$rootScope', '$scope', '$window'];

    constructor(private redditData: RedditData,
                private dataStore: DataPersistence,
                private favoriteService: FavoriteService,
                $rootScope: ng.IRootScopeService,
                private $scope: ng.IScope,
                $window: ng.IWindowService)
    {
        angular.element($window).bind('scroll', this.backToTopScrollHandler);
        $(document).on('scroll', () => this.infScrollHandler());
        this.loadSettings();
        this.loadFavorites();
        this.loadFromUrl();

        // Subscribe to hash changed event
        $rootScope.$on('hashchange', () => this.loadFromUrl());

        // Start the image resolver loop
        this.startImageResolver();
    }

    startImageResolver(): void
    {
        this.imageResolverThread = window.setInterval(this.resolveNextImage, this.imageDelay);
    }

    stopImageResolver(): void
    {
        if (this.imageResolverThread > 0)
        {
            window.clearInterval(this.imageResolverThread);
            this.imageResolverThread = -1;
        }
    }

    resolveNextImage(): void
    {
        let ele = $('#results .image img:not([src])').first();
        if (ele)
        {
            let url = ele.data('sourceurl');
            if (url)
            {
                ele.removeAttr('data-sourceurl');
                ele.attr('src', url);
            }
        }

        // Find and remove "removed.png"
        $('#results img').each((i, e) => {
            if ($(e).attr('src') && $(e).attr('src').endsWith('removed.png'))
            {
                $(e).parent('.card').remove();
            }
        });
    }

    load(): void
    {
        if (this.subreddit && this.subreddit.length > 0)
        {
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

    loadKeyPressed($event: JQueryKeyEventObject): void
    {
        if ($event.keyCode === 13)
        {
            this.load();
        }
    }

    updateClassName(num: number): void
    {
        // Angular does not preserve the order, which is important in SemanticUI. It must read "six column", not "column six".
        // So we have to hack it and use jQuery instead. :/
        $('#results').removeClass('column three four five six seven eight nine ten eleven twelve');
        var className = '';
        switch(num)
        {
            case 3:  className = 'three'; break;
            case 4:  className = 'four'; break;
            case 5:  className = 'five'; break;
            case 6:  className = 'six'; break;
            case 7:  className = 'seven'; break;
            case 8:  className = 'eight'; break;
            case 9:  className = 'nine'; break;
            case 10: className = 'ten'; break;
            case 11: className = 'eleven'; break;
            case 12: className = 'twelve'; break;
            default: className = ''; break;
        }
        $('#results').addClass(className + ' column');

        this.saveSettings();

        // Re-flowing cards could cause the page to not be able to scroll, so re-check if we're at the "bottom".
        this.infScrollHandler();
    }

    toTop(): void
    {
        window.scrollTo(0, 0);
    }

    backToTopScrollHandler(): void
    {
        var me = <MainController>angular.element($('#app')).controller();

        // Update the top handler
        me.notOnTop = window.scrollY > 100;
        me.$scope.$apply();
    }

    infScrollHandler(): void
    {
        // Hack because the event handler replaces "this"...
        var me = <MainController>angular.element($('#app')).controller();

        $.debounce(4000, true, () =>
        {
            if (window.scrollY + window.innerHeight >= document.body.scrollHeight - MainController.INF_SCROLL_THRESHOLD && !me.mainLoading && me.next)
            {
                this.loadSubreddit(true);
                gtag('send', 'event', 'itd', 'loadMore')
            }
        })();
    }

    basicChangedHandler(): void
    {
        this.saveSettings();
    }
    
    showClass(className: string): boolean
    {
        switch(className)
        {
            case "image": return this.showImages;
            case "gif": return this.showGifs;
            default: return false;
        }
    }

    resetSeen(): void
    {
        if (confirm('Are you sure you want to clear your "Seen" list?\r\nThis cannot be undone.'))
        {
            this.dataStore.SaveSeenList([]);
            this.images = this.images.map(i => {
                i.seen = false;
                return i;
            });
            this.updateSeenCount();
        }
    }

    menuToggle($event: Event): void
    {
        this.isMenuOpen = !this.isMenuOpen;
        this.noBubble($event);
    }

    closeMenu($event: Event): void 
    {
        if ($($event.target).parents('.ui.main.menu').length > 0)
        {
            return;
        }
        this.isMenuOpen = false;
    }

    showMoreDesc($event: Event): void
    {
        this.showExtDesc = true;
        this.noBubble($event);
    }

    showLessDesc($event: Event): void
    {
        this.showExtDesc = false;
        this.noBubble($event);
    }

    loadFavorites(): void
    {
        this.favorites = this.favoriteService.loadFavorites().sort((a, b) => a.name[0].toLowerCase() > b.name[0].toLowerCase() ? 1 : -1);
        this.isCurrentFavorite = this.subredditInfo !== null && this.subredditInfo.name !== null && this.favorites.some(e => e.name.toLowerCase() === this.subredditInfo.name.toLowerCase());
    }

    favoriteChanged(): boolean
    {
        this.subreddit = this.selectedFavorite;
        this.load();
        return false;
    }

    addFavorite(): void
    {
        this.favoriteService.addFavorite({name: this.subredditInfo.name, desc: this.subredditInfo.title});
        this.loadFavorites();
    }

    removeFavorite(): void
    {
        this.favoriteService.removeFavorite(this.subredditInfo.name);
        this.loadFavorites();
    }    

    private loadFromUrl()
    {
        var hash = window.location.hash.slice(1);
        if (hash.length > 0 && /^\/r\/[a-z0-9_]+$/i.test(hash))
        {
            this.subreddit = hash.slice(3);
            this.load();
        }
    }

    private loadSubredditInfo(): void
    {
        this.redditData.GetSubredditInfo(this.subreddit).then(i => {
            this.subredditInfo = i;
            this.color = i.color;
            this.loadFavorites();
        });
    }

    private loadSubreddit(append: boolean)
    {
        this.mainLoading = true;

        this.redditData.GetImagesFromSubreddit(this.subreddit, this.next, this.sortOption, parseInt(this.postCount.toString()), this.count)
        .then(data =>
        {
            var dupeFilteredImgs = data.images.filter(di => this.images.findIndex(ii => ii.postNum == di.postNum) === -1)

            if (append)
            {
                this.images = this.images.concat(dupeFilteredImgs);
            }
            else
            {
                this.images = dupeFilteredImgs;
            }
        
            this.count = data.count;
            this.next = data.after;
            this.mainLoading = false;

            // In case we get too few results, start loading the next ones
            this.infScrollHandler();

            // Update 'seen'
            this.updateSeenCount();
        })        
    }

    private loadSettings(): void
    {
        var settings = this.dataStore.LoadSettings();
        if (!settings)
        {
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
        this.showUpvotes = settings.showUpvotes;
        this.imageDelay = settings.imageDelay;
        // Execute the card layout updater
        this.updateClassName(settings.cardsPerRow);
    }

    private saveSettings(): void
    {
        this.dataStore.SaveSettings({
            cardsPerRow: this.cardsPerRow,
            showDates: this.showDates,
            showPostNum: this.showPostNum,
            showTitles: this.showTitles,
            showImages: this.showImages,
            showGifs: this.showGifs,
            postCount: this.postCount,
            sortOption: this.sortOption,
            showSeenFilter: this.showSeenFilter,
            showUpvotes: this.showUpvotes,
            imageDelay: this.imageDelay
        });

        this.stopImageResolver();
        this.startImageResolver();
    }

    private updateSeenCount(): void
    {
        this.seenCount = this.dataStore.GetSeenList().length;
    }

    private noBubble($event: Event)
    {
        $event.stopPropagation();
        $event.preventDefault();
        $event.cancelBubble = true;
        $event.returnValue = false;
    }

    private sleep(milliseconds)
    {
        const date = Date.now();
        let currentDate = null;
        do
        {
            currentDate = Date.now();
        }
        while (currentDate - date < milliseconds);
    }
}
app.controller('MainController', MainController);