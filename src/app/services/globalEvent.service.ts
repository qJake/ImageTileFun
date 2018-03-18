class GlobalEvent
{
    static $inject = ['$window', '$rootScope'];

    constructor($window: ng.IWindowService,
                  $rootScope: ng.IRootScopeService)
    {
        $window.addEventListener("hashchange", () => $rootScope.$broadcast('hashchange'), false);
    }
}
app.service('GlobalEvent', GlobalEvent);