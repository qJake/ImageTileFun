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
}

class DataPersistence
{
    private static settingsKey = "persistedSettings";

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
}
app.service('DataPersistence', DataPersistence);