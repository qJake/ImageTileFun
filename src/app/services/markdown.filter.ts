interface IMarkdownIt
{
    render(input: string): string;
}

declare function markdownit(): IMarkdownIt;

class MarkdownFilter
{
    static $inject = ['$sce'];

    static filter($sce: ng.ISCEService)
    {
        return (input: string) => $sce.trustAsHtml(markdownit().render(input).replace(/href=\"\/r\//gi, 'href="#/r/'));
    }
}
app.filter('markdown', MarkdownFilter.filter);