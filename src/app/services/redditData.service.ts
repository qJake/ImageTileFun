// This typing refused to work.
// Typings with CDN links suck.
declare var moment: any;

interface ISubredditInfo
{
    name: string;
    subscribers: number;
    title: string;
    description: string;
    color: string;
    icon: string;
}

interface IRedditResponse
{
    before: string;
    after: string;
    images: Array<IRedditImage>;
    count: number;
}

interface IRedditImage
{
    id: string;
    shortId: string;
    postNum: string;
    metadata: IPostMetadata;
    permalink: string;
    comments: number;
    title: string;
    imageUrl: string;
    datestamp: string;
    datePostedAgo: string;
    datePostedFriendly: string;
    seen: boolean;
    upvotes: string;
}

interface IPostMetadata
{
    class: string;
    displayAs: string;
    updatedImageUrl: string;
}

class RedditData
{
    static BASE_URL = 'https://www.reddit.com/r/';
    static FALLBACK_COLOR = '#05427a';
    static DOMAIN_WHITELIST = [
        'i\\.redd\\.it',
        'i\\.imgur\\.com',
        '.+\\.media\\.tumblr\\.com',
        '.+\\.deviantart\\.net'
    ];
    static WHITELISTS = {
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

    static $inject = ['$http', 'DataPersistence'];

    constructor(private $http: ng.IHttpService,
                private dataPersistence: DataPersistence) { }

    private thisSession: Array<string> = [];

    GetSubredditInfo(subreddit: string): ng.IPromise<ISubredditInfo>
    {
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/about.json`)
        .then(d => {
            var info = (d.data as any).data;
            return <ISubredditInfo>{
                color: info.primary_color || info.key_color || RedditData.FALLBACK_COLOR,
                title: info.title,
                description: info.description,
                name: info.display_name,
                subscribers: info.subscribers,
                icon: info.icon_img
            };
        });
    }

    GetImagesFromSubreddit(subreddit: string, after: string, sort: string, postCount: number, count?: number): ng.IPromise<IRedditResponse>
    {
        let qs = ""; // TODO: Add querystring for continuation
        if(after && after.length > 0)
        {
            qs += 'after=' + after;
        }
        sort = sort.replace('_', '');
        if (sort && sort.length)
        {
            qs += "&t=all";
        }

        // Clear "this" list if count is 0.
        if(count === 0)
        {
            console.info("Clearing current session cached IDs.");
            this.thisSession = [];
        }

        count += postCount;
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/${sort}.json?limit=${postCount}&count=${count - postCount}&${qs}`)
                         .then(d => {
                             var seen = this.dataPersistence.GetSeenList();

                             return <IRedditResponse> {
                                before: (d.data as any).data.before,
                                after: (d.data as any).data.after,
                                count: count,
                                images: (d.data as any).data.children
                                    .map((post, i) => {
                                        // Store what just came back in a cache so the new stuff isn't dimmed
                                        if (seen.indexOf(post.data.id) === -1)
                                        {
                                            this.thisSession.push(post.data.id);
                                        }

                                        post.data.postNum = ((count + i) - (postCount - 1)).toString(); /* +100, -1 */
                                        post.data.seen = seen.indexOf(post.data.id) > -1 && this.thisSession.indexOf(post.data.id) === -1;
                                        post.data._metadata = this.getPostMetadata(post.data);
                                        return post;
                                    })
                                    .filter(post =>
                                    {
                                        return post.data._metadata.class && post.data._metadata.class.length;
                                    }).map((post, i) => {
                                        var p: any = post.data;
                                        
                                        return <IRedditImage>{
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
                                            seen: p.seen,
                                            upvotes: this.toCommaSeparated(p.score)
                                        };
                                    })
                            };
                         })
                         .then(resp =>
                        {                           
                            var list = this.dataPersistence.GetSeenList();
                            var seenList = resp.images.map(i => i.shortId);
                            this.dataPersistence.SaveSeenList(list.concat(seenList));
                            return resp;
                        });
    }

    private getPostMetadata(post: any): IPostMetadata
    {
        var m = <IPostMetadata>{
            class: null,
            displayAs: 'image',
            updatedImageUrl: null
        };

        var url = document.createElement('a');
        url.href = post.url;
        if (RedditData.WHITELISTS.images.some(pattern => new RegExp(pattern).test(url.pathname)))
        {
            m.class = 'image';
        }
        else if (RedditData.WHITELISTS.gifs.some(pattern => new RegExp(pattern).test(url.pathname)))
        {
            m.class = 'gif';
            
            if (url.href.endsWith('.gifv'))
            {
                m.displayAs = 'image';
                m.updatedImageUrl = post.url.replace('.gifv', '.gif');
            }
            else
            {
                m.displayAs = 'image';
            }
        }
        
        return m;
    }

    private toCommaSeparated(x: number): string
    {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
app.service('RedditData', RedditData);