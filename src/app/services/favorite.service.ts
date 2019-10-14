interface IFavorite
{
    name: string;
    desc: string;
}

class FavoriteService
{
    private static FavoriteKey: string = "FavoriteList";

    loadFavorites(): IFavorite[]
    {
        const favStr = localStorage.getItem(FavoriteService.FavoriteKey);
        if(typeof favStr !== 'string' || !favStr || !favStr.length)
        {
            return [];
        }

        return JSON.parse(favStr) as IFavorite[];
    }

    saveFavorites(favs: IFavorite[]): void
    {
        localStorage.setItem(FavoriteService.FavoriteKey, JSON.stringify(favs));
    }

    addFavorite(fav: IFavorite): void
    {
        var favs = this.loadFavorites();
        if(this.containsFavorite(favs, fav.name)) return;

        favs.push(fav);
        this.saveFavorites(favs);
    }

    removeFavorite(name): void
    {
        var favs = this.loadFavorites();
        if(!this.containsFavorite(favs, name)) return;

        favs = favs.filter(e => e.name.toLowerCase() !== name.toLowerCase());
        this.saveFavorites(favs);
    }

    containsFavorite(favs: IFavorite[], name: string)
    {
        return favs.some(e => e.name.toLowerCase() === name.toLowerCase());
    }
}
app.service('FavoriteService', FavoriteService);