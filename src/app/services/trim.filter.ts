class TrimFilter
{
    static filter()
    {
        return (input: string, len: number) => typeof input !== 'undefined' ? input && input.length < len ? input : input.slice(0, len) + "..." : '';
    }
}
app.filter('trim', TrimFilter.filter);