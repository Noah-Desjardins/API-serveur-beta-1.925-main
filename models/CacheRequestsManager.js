import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let RequestCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");
global.RequestCaches = [];
global.cachedRepositoriesCleanerStarted = false;
export default class CachedRequestsManager{
    static startCachedRequestsCleaner(){
        setInterval(CachedRequestsManager.flushExpired, RequestCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories content caches cleaning process started...]");
    }
    static add(url, content, ETag = ""){
        if (!cachedRepositoriesCleanerStarted) {
            cachedRepositoriesCleanerStarted = true;
            CachedRequestsManager.startCachedRepositoriesCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            RequestCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + RequestCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[The content of ${url} has been added with succes]`);
        }
    }
    static find(url){
        try {
            if (url != "") {
                for (let cache of RequestCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + RequestCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[The content of ${cache.url} has been found with succes]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[repository cache error!]", error);
        }
        return null;
    }
    static clear(url){
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of RequestCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(RequestCaches, indexToDelete);
        }
    }
    static flushExpired(){
        let now = utilities.nowInSeconds();
        for (let cache of RequestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "The content of " + cache.url + " has been expired");
            }
        }
        RequestCaches = RequestCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        let cache = CachedRequestsManager.find(HttpContext.req.url);
        if(cache != null){
            HttpContext.response.JSON( cache.content, cache.ETag, true)
            return true;
        }
        else
            return false;
    }
}
