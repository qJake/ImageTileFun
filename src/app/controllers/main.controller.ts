// Google Analytics
declare function gtag(a: any, b: any, c: any, d: any, e?: any, f?: any): any

class MainController
{
    private static INF_SCROLL_THRESHOLD = 500;

    subreddit: string = '';
    sortOption: string = '_';
    postCount: number = 100;
    mainLoading: boolean = false;
    images: Array<IRedditImage> = [];
    next: string = '';
    count: number = 0;
    color: string = RedditData.FALLBACK_COLOR;

    // Options
    showImages: boolean = true;
    showGifs: boolean = false;
    showTitles: boolean = false;
    showDates: boolean = false;
    showPostNum: boolean = false;
    cardsPerRow: number = 6;
    showSeenFilter: boolean = false;

    static $inject = ['RedditData', 'DataPersistence', '$q'];

    constructor(private redditData: RedditData,
                private dataStore: DataPersistence,
                private $q: ng.IQService)
    { 
        $(document).on('scroll', () => this.infScrollHandler());
        this.loadSettings();
    }

    load(): void
    {
        if (this.subreddit && this.subreddit.length > 0)
        {
            this.images = [];
            this.count = 0;
            this.next = null;
            this.loadSubreddit(false);
            this.loadColor();
            gtag('send', 'event', 'itf', 'initialLoad')
            gtag('send', 'event', 'subreddit', this.subreddit)
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

    infScrollHandler(): void
    {
        // Hack because the event handler replaces "this"...
        var me = angular.element($('#app')).controller();

        $.debounce(2000, true, () =>
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
        this.dataStore.SaveSeenList([]);
        alert('Reset "seen" list!');
    }

    private loadColor(): void
    {
        this.redditData.GetSubredditColor(this.subreddit).then(c => this.color = c);
    }

    private loadSubreddit(append: boolean)
    {
        this.mainLoading = true;

        this.redditData.GetImagesFromSubreddit(this.subreddit, this.next, this.sortOption, parseInt(this.postCount.toString()), this.count)
        .then(data =>
        {
            if (append)
            {
                this.images = this.images.concat(data.images);
            }
            else
            {
                this.images = data.images;
            }

            this.count = data.count;
            this.next = data.after;
            this.mainLoading = false;

            // In case we get too few results, start loading the next ones
            this.infScrollHandler();

            // Find and remove "removed.png"
            $('#results img').each((i, e) => {
                if ($(e).attr('src').endsWith('removed.png'))
                {
                    $(e).parent('.card').remove();
                }
            });
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
            showSeenFilter: this.showSeenFilter
        });
    }
}
app.controller('MainController', MainController);