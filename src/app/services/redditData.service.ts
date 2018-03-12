// This typing refused to work.
// Typings with CDN links suck.
declare var moment: any;

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
    postNum: string;
    metadata: IPostMetadata;
    permalink: string;
    comments: number;
    title: string;
    imageUrl: string;
    datestamp: string;
    datePostedAgo: string;
    datePostedFriendly: string;
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
    static DOMAIN_WHITELIST = [
        'i.redd.it',
        'i.imgur.com'
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

    static $inject = ['$http'];

    constructor(private $http: ng.IHttpService) { }

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
        count += postCount;
        return this.$http.get(`${RedditData.BASE_URL}${subreddit}/${sort}.json?limit=${postCount}&count=${count - postCount}&${qs}`)
                         .then(d => {
                             return <IRedditResponse> {
                                before: (d.data as any).data.before,
                                after: (d.data as any).data.after,
                                count: count,
                                images: (d.data as any).data.children
                             .map((post, i) => {
                                 post.data.postNum = ((count + i) - (postCount - 1)).toString(); /* +100, -1 */
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

    private getPostMetadata(post: any): IPostMetadata
    {
        var m = <IPostMetadata>{
            class: null,
            displayAs: 'image',
            updatedImageUrl: null
        };

        var url = document.createElement('a');
        url.href = post.url;
        if (RedditData.WHITELISTS.images.some(ext => url.pathname.endsWith(ext)))
        {
            m.class = 'image';
        }
        else if (RedditData.WHITELISTS.gifs.some(ext => url.pathname.endsWith(ext)))
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
}
app.service('RedditData', RedditData);