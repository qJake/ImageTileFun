interface ISettings
{
    showTitles: boolean;
    showDates: boolean;
    showPostNum: boolean;
    cardsPerRow: number;
    showGifs: boolean;
    showImages: boolean;
    sortOption: string;
    postCount: number;
    showSeenFilter: boolean;
}

class DataPersistence
{
    private static settingsKey = "persistedSettings";
    private static seenKey = "seenThings";

    SaveSettings(settings: ISettings): void
    {
        var data = JSON.stringify(settings);
        localStorage.setItem(DataPersistence.settingsKey, data);
    }

    LoadSettings(): ISettings
    {
        var storedData = localStorage.getItem(DataPersistence.settingsKey);
        if (storedData && storedData.length)
        {
            try
            {
                return JSON.parse(storedData) as ISettings;
            }
            catch
            {
                return null;
            }
        }
        return null;
    }

    SaveSeenList(seen: Array<string>): void
    {
        // de-dupe first
        var uniqueSeen = seen.filter(function(item, i) {
            return seen.indexOf(item) == i;
        });

        localStorage.setItem(DataPersistence.seenKey, JSON.stringify(uniqueSeen));
    }

    GetSeenList(): Array<string>
    {
        var data = localStorage.getItem(DataPersistence.seenKey);
        if(data && data.length)
        {
            try
            {
                return JSON.parse(data) as Array<string>;
            }
            catch
            {
                return [];
            }
        }
        return [];
    }
}
app.service('DataPersistence', DataPersistence);