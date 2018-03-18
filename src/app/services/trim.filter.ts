class TrimFilter
{
    static filter()
    {
        return (input: string, len: number) => input && input.length < len ? input : input.slice(0, len) + "...";
    }
}
app.filter('trim', TrimFilter.filter);