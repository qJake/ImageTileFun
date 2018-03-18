declare function markdownit(): any;

class MarkdownFilter
{
    static $inject = ['$sce'];

    static filter($sce: ng.ISCEService)
    {
        return (input: string) => $sce.trustAsHtml(markdownit().render(input));
    }
}
app.filter('markdown', MarkdownFilter.filter);