// ==UserScript==
// @name         Sathya Krishnamurthy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Searches for urls on many different sites
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://www.bing.com/maps*
// @include https://www.bing.com/translator*
// @include https://www.cvent.com/venues*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect citysearch.com
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/pixeldesu/moduleRaid/master/moduleraid.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';
    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;
    var country_map={"TR":"Turkey","RU":"Russia","PL":"Poland",};
    var has_yelp={"AE":false,"US":true,"AR":true,"SK":false,"ID":false,"CN":false,"CR":false};

    function check_function()
    {
        return true;
    }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
        }
    }
    function do_finish(page,url)
    {
        if(url==="not-found") { my_query.not_found_count++; }
        console.log("Finishing "+page+", Total not found:"+my_query.not_found_count);

        console.log(my_query.doneCitySearch+","+ my_query.doneBing+","+ my_query.doneBingMaps+","+my_query.doneCVent+","+
                    my_query.doneGoogleMaps
          +","+my_query.doneFB+","+my_query.doneFoursquare+","+my_query.doneHospitality+","+my_query.doneKayak
          +","+my_query.doneLocaleze+","+my_query.doneManta+","+my_query.doneMapquest+","+my_query.doneMeetings
          +","+my_query.doneSuperpages+","+my_query.doneTravel+","+my_query.doneTripAdvisor+","+my_query.doneTrivago
          +","+my_query.doneYahoo+","+my_query.doneYellowPages+","+my_query.doneYelp+","+my_query.doneYellowBook);
        if(my_query.doneCitySearch && my_query.doneBing && my_query.doneBingMaps && my_query.doneCVent && my_query.doneGoogleMaps
           && my_query.doneFB && my_query.doneFoursquare && my_query.doneHospitality && my_query.doneKayak
           && my_query.doneLocaleze && my_query.doneManta && my_query.doneMapquest && my_query.doneMeetings
           && my_query.doneSuperpages && my_query.doneTravel && my_query.doneTripAdvisor && my_query.doneTrivago
           && my_query.doneYahoo && my_query.doneYellowPages && my_query.doneYelp && my_query.doneYellowBook
           && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function,automate);
        }
    }

    function is_bad_name(b_name)
    {
	return false;
    }

    function matches_name(name,i)
    {
        my_query.temp_name=removeDiacritics(my_query.name.replace(/,.*$/,"").replace(/^The\s+([^\s]+)/,"$1").replace(/\s-\s[^\-]*$/).
                                            replace(/\s-.*$/,"").trim());
        name=removeDiacritics(name.replace(/^The\s+([^\s]+)/,"$1").replace(/\s-\s[^\-]*$/).replace(/\s-.*$/,"").trim());
        console.log("name.trim().toLowerCase()="+name.trim().toLowerCase()+"\tmy_query.temp_name.trim.toLowerCase()="+
                    my_query.temp_name.trim().toLowerCase());
        if(name.trim().toLowerCase().indexOf(my_query.temp_name.trim().toLowerCase())!==-1 ||
           my_query.temp_name.trim().toLowerCase().indexOf(name.trim().toLowerCase())!==-1) return true;
        else if(i!==undefined && i===0
                && name.split(" ")[0].trim().toLowerCase()===my_query.name.split(" ")[0].trim().toLowerCase()) return true;
        return false;
    }
    function matches_query(name,address)
    {
        console.log("in matches_query, name="+name+"\taddress="+address);
        var parsedAdd=parseAddress.parseLocation(address);
        if(name.toLowerCase().replace(/\s*\-\s*/g,"-").trim()===my_query.name.toLowerCase().replace(/\s*\-\s*/g,"-").trim()) return true;
        else if(parsedAdd!==null && my_query.parsedAdd!==null && parsedAdd!==undefined && my_query.parsedAdd!==undefined &&
                my_query.parsedAdd.street!==undefined && parsedAdd.street!==undefined &&
                my_query.parsedAdd.number!==undefined && parsedAdd.number!==undefined &&
                my_query.parsedAdd.street===parsedAdd.street &&
                 my_query.parsedAdd.number===parsedAdd.number)
        {
            return true;
        }

        console.log("original name: "+my_query.name+"\tfound name: "+name);
        console.log("original address: "+JSON.stringify(my_query.parsedAdd)+"\tfound address: "+JSON.stringify(parsedAdd));
        return false;
    }

    function city_search_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        document.getElementById("CitySearch.com_url").type="text";
        var naturalResult=doc.getElementsByClassName("naturalResult");
        var i,j,name,address,url;
        var city_success=false;
        console.log("city_search: "+response.finalUrl);
        for(i=0; i < naturalResult.length; i++)
        {
            name=naturalResult[i].querySelector("[itemprop='name']");
            address=naturalResult[i].querySelector("[itemprop='address']");
            url=naturalResult[i].querySelector("[itemprop='url']");
            console.log("name="+name+"\taddress="+address+"\turl="+url);
            if(name!==undefined && name!==null && address!==undefined && address!==null && url!==undefined &&
               url!==null && matches_name(name.innerText,1))
            {
                city_success=true;
                break;
            }
        }
        if(city_success)
        {
            resolve(url.href.replace(/^https?:\/\/[^\/]+\//,"http://www.citysearch.com/").replace(/\?.*$/,""));
            return;
        }
        resolve("not-found");
        return;

    }

    function city_search_promise_then(result) {
        document.getElementById("CitySearch.com_url").value=result;
        my_query.doneCitySearch=true;
        do_finish("citysearch",result);

    }

    function google_maps_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
         var scripts=doc.scripts,i,inner,cid_match;
          console.log("google_maps: "+response.finalUrl);
         var cid="",success=false;

         for(i=0; i < scripts.length; i++)
         {
             /*if(scripts[i].innerText.indexOf("ludocid\\\\u003d")!==-1)
             {
             //    console.log("Found ludocid, i="+i+"\n"+scripts[i].innerText.substr(scripts[i].innerText.indexOf("ludocid")));
             }*/
             inner=scripts[i].innerText;
             cid_match=inner.match(/ludocid\\\\u003d([\d]*)/);
             if(cid_match!==null)
             {

                 cid=cid_match[1];
                 console.log("Matched cid at "+i+", cid="+cid);
                 success=true;
                 break;
             }
             else
             {
                 console.log("cid null at "+i);
             }



         }
         if(success)
         {
             console.log("Had success");

             document.getElementById("Google_url").type="text";
        document.getElementById("Google_url").value="https://www.google.com/maps?cid="+cid;
        my_query.doneGoogleMaps=true;
        do_finish("Google maps",document.getElementById("Google_url").value);
             resolve(cid);
             return;
         }
         else
         {
             console.log("Google_maps: FAILED\n\n");
         }
     }

    function google_maps_promise_then(result) {
        console.log("Google_maps: promise_then");
        document.getElementById("Google_url").type="text";
        document.getElementById("Google_url").value="https://www.google.com/maps?cid="+result;
        my_query.doneGoogleMaps=true;
        do_finish("Google maps",document.getElementById("Google_url").value);
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Query_response: "+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,lgb_info,bm_details_overlay;
        var b1_success=false, b_header_search, lid_match,lid_val,cp_match;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            if(lgb_info!==null)
            {
                bm_details_overlay=lgb_info.getElementsByClassName("bm_details_overlay");
                if(bm_details_overlay.length>0&&bm_details_overlay[0].getElementsByTagName("a").length>0)
                {
                    inner_a=bm_details_overlay[0].getElementsByTagName("a")[0];
                    lid_match=inner_a.href.match(/local\?lid=([^&]+)&/);
                    if(lid_match!==null)
                    {
                        lid_val=lid_match[1];
                        console.log("inner_a.href="+inner_a.href);
                        document.getElementById("Bing_url").type="text";
                        document.getElementById("Bing_url").value="https://www.bing.com/local/Details.aspx?lid="+lid_val;

                        my_query.doneBing=true;
                        do_finish("Bing",document.getElementById("Bing_url").value);
                        cp_match=inner_a.href.match(/&cp\=([\-\d\.]+)%7e([\-\d\.]+)&/);
                        if(cp_match!==null)
                        {
                            console.log("cp_match="+JSON.stringify(cp_match));
                            resolve({lat: cp_match[1], lon: cp_match[2]});

                        }
                        else {
                            console.log("cp_match=null, new_try="+JSON.stringify(inner_a.href.match(/&cp=([^&]+)&/)));
                        }
                        return;

                    }
                }

            }
            else
            {
                bm_details_overlay=doc.getElementsByClassName("bm_details_overlay");
                if(bm_details_overlay.length>0)
                {
                    var overlay=JSON.parse(bm_details_overlay[0].dataset.detailsoverlay);
                    console.log("overlay="+JSON.stringify(overlay));
                    if(overlay.localDetailsState!==undefined && overlay.localDetailsState.id!==undefined)
                    {
                        lid_val=overlay.localDetailsState.id.replace(/^ypid:\s*/,"");
                        console.log("lid_val="+lid_val);
                        document.getElementById("Bing_url").type="text";
                        document.getElementById("Bing_url").value="https://www.bing.com/local/Details.aspx?lid="+lid_val;
                        my_query.doneBing=true;
                        do_finish("Bing",document.getElementById("Bing_url").value);
                    }
                    if(overlay.centerLatitude!==undefined && overlay.centerLongitude!==undefined)
                    {
                        resolve({lat: overlay.centerLatitude, lon: overlay.centerLongitude});
                    }
                    return;

                }
            }
           

           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("query_result="+JSON.stringify(result));
        var lat=(Math.round(parseFloat(result.lat)*1000)*1.)/1000;
        var lon=(Math.round(parseFloat(result.lon)*1000)*1.)/1000;
        var manta_url="https://www.manta.com/search?search_source=nav&search="+my_query.name.replace(/\s/g,"+")+
            "&search_location="+my_query.parsedAdd.city.replace(/\s/g,"+")+"+"+my_query.parsedAdd.state.replace(/\s/g,"+")+
            "&pt="+lat+"%2C"+lon;
        console.log("manta_url="+manta_url);
        my_query.manta_url=manta_url;
        var search_str=my_query.name+" "+my_query.parsedAdd.state+" site:manta.com";
        const mantaPromise = new Promise((resolve, reject) => {
            console.log("Beginning Manta search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        mantaPromise.then(manta_promise_then)
        .catch(function(val) {
           console.log("Failed at this mantaPromise " + val); GM_setValue("returnHit",true); });


    }

    function should_search_google(site)
    {
        if((site==="superpages.com"||site==="manta.com"||
                        site==="local.yahoo.com"||site==="yellowpages.com"||site==="yellowbook.com" ||
           site==="mapquest.com"||site==="hospitalityonline.com")&&
                       (!/US/.test(my_query.parsedAdd.country)))
        {
            return false;
        }
        else if(site==="yelp.com" && has_yelp[my_query.parsedAdd.country]!==undefined && !has_yelp[my_query.parsedAdd.country])
        {
            return false;
        }
        return true;
    }


    /* Also using for foursquare, hospitality */
    function fb_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("FBETC_response: "+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,lgb_info,bm_details_overlay;
        var b1_success=false, b_header_search, lid_match,lid_val;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].innerText.split("|")[0].split("-")[0].trim();
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("BONK");
                if(b_algo[i].getElementsByClassName("b_caption")[0]!==undefined) {
                    b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText; }
                console.log("b_name="+b_name+", my_query.name="+my_query.name);
                if(matches_name(b_name,i) || (/yellowbook\.com\/s\//.test(b_url) ))
                {
                    b1_success=true;
                    break;
                }
            }
            if(b1_success)
            {
                if(b_url.indexOf("facebook.com")!==-1)
                {
                    b_url=b_url.replace(/\/posts(\/.*)?$/,"").replace(/\/events(\/.*)?$/,"");
                }
                resolve(b_url);
            }
            else
            {
                /* Failed to find on Bing */
                //console.log("Doing google");
                var site_match=response.finalUrl.match(/site%3A([^&]+)&/);
                var search_str=my_query.name+" "+my_query.parsedAdd.state;
                if(site_match)
                {
                    search_str=search_str+" site:"+site_match[1];
                    if(site_match[1].indexOf("manta.com")!==-1 && my_query.parsedAdd.country==="US" && my_query.manta_url.length>0)
                    {
                        GM_xmlhttpRequest({method: 'GET', url: my_query.manta_url,
                                           onload: function(response) { manta_response(response, resolve, reject); },
                                           onerror: function(response) { reject("Fail"); },
                                           ontimeout: function(response) { reject("Fail"); }
                                          });
                        return;
                    }
                    else if(site_match[1].indexOf("mapquest.com")!==-1)
                    {
                        var mapquest_url="https://www.mapquest.com/search/results?query="+
                            encodeURIComponent(my_query.full_name);
                        GM_xmlhttpRequest({method: 'GET', url: mapquest_url,
                                           onload: function(response) { mapquest_response(response, resolve, reject); },
                                           onerror: function(response) { reject("Fail"); },
                                           ontimeout: function(response) { reject("Fail"); }
                                          });
                        return;
                    }
                    else if(!should_search_google(site_match[1]))
                    {
                        resolve("not-found");
                        return;
                    }
                }
                console.log("Doing google with "+search_str);
                query_google_search(search_str,resolve,reject,fb_google_response);
                return;
            }
            
            return;

        }
        catch(error)
        {
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
	

    }

    function manta_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("manta_response: "+response.finalUrl);
    //     var list_group=doc.getElementsByClassName("list-group");
         var list_group=doc.querySelectorAll("[rel='SearchResults']");
         var good_list,i,j,success=false;

         var item,name,address,nameText,addressText;
         console.log("list_group.length="+list_group.length);
        /* for(i=0; i < list_group.length; i++)
         {
             console.log("list_group["+i+"].className="+list_group[i].className);
             if(list_group[i].className.indexOf("mbn")!==-1 || list_group[i].getAttribute("rel")==="SearchResults")
             {
                 good_list=list_group[i];
                 break;
             }
         }
         if(good_list===undefined) {
             resolve("not-found");
             return;  }*/
         for(j=0; j < list_group.length; j++)
         {
             good_list=list_group[j];

             item=good_list.getElementsByClassName("list-group-item");
             for(i=0; i < item.length; i++)
             {
                 name=item[i].querySelector("[itemprop='name']");
                 address=item[i].querySelector("[itemprop='address']");
                 if(name!==null && name!==undefined &&address!==null && address!==undefined)
                 {
                     nameText=name.innerText.trim();
                     addressText=address.innerText.trim().replace(/\n/g,",");
                     console.log("Manta ("+i+"): "+nameText+", "+addressText);
                     if(matches_query(nameText,addressText))
                     {
                         console.log("matched query");
                         resolve(name.href.replace(/https?:\/\/[^\/]+\//,"https://www.manta.com/"));
                         return;
                     }
                 }
             }
         }
         resolve("not-found");

     }

     function mapquest_response(response,resolve,reject) {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
         console.log("In mapquest_response: "+response.finalUrl);
         var i,j;
         var search=doc.getElementsByClassName("search-results");
         console.log("search.length="+search.length);
         var good_search,inner_li,name,inner_a;
         for(i=0; i < search.length; i++)
         {
             console.log("Mapquest: search["+i+"].tagName="+search[i].tagName);
             if(search[i].tagName==="OL")
             {
                 good_search=search[i];
                 break;
             }
         }
         if(good_search===undefined) {
             console.log("good_search=undefined");
             resolve("not-found");
             return;
         }
         inner_li=good_search.getElementsByTagName("li");
         console.log("inner_li.length="+inner_li.length);
         for(i=0; i < inner_li.length; i++)
         {
             console.log("Mapquest: ("+i+")");
             inner_a=inner_li[i].getElementsByTagName("a");
             if(inner_a.length===0) continue;

             name=inner_a[0].innerText.trim();
             console.log("name="+name);
             if(matches_name(name))
             {
                 resolve(inner_a[0].href.replace(/https?:\/\/[^\/]+\//,"https://www.mapquest.com/"));
                 return;
             }
         }
         resolve("not-found");
         return;

     }


    function fb_google_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("FBGOOGLE_response: "+response.finalUrl);
        var search, b_algo, i=0, inner_a, g_stuff;
        var t_url="crunchbase.com", t_header_search="";
        var g1_success=false, b_header_search, lid_match,lid_val;
        try
        {
            search=doc.getElementById("search");
            g_stuff=search.getElementsByClassName("g");

            for(i=0; i < g_stuff.length; i++)
            {
                try
                {
                    t_url=g_stuff[i].getElementsByTagName("a")[0].href; // url of query
                    t_header_search=g_stuff[i].getElementsByClassName("r")[0].innerText.split("|")[0].split("-")[0].trim(); // basic description
                    if(matches_name(t_header_search,i))
                    {
                        g1_success=true;
                        break;
                    }
                }
                catch(error)
                {
                    console.log("ERROR");
                    continue;
                }

                //console.log(temp1);
            }
            if(g1_success)
            {
                if(t_url.indexOf("facebook.com")!==-1)
                {
                    t_url=t_url.replace(/\/posts(\/.*)?$/,"").replace(/\/events(\/.*)?$/,"");
                }
                resolve(t_url);
                return;
            }
            else
            {
                resolve("not-found");
                return;
            }
        }
        catch(error)
        {
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }

    }

    function fb_promise_then(url) {
           document.getElementById("Facebook_url").type="text";
           document.getElementById("Facebook_url").value=url;
           my_query.doneFB=true;
           do_finish("Facebook",url);
    }
    function foursquare_promise_then(url) {
           document.getElementById("Foursquare_url").type="text";
           document.getElementById("Foursquare_url").value=url;
           my_query.doneFoursquare=true;
           do_finish("Foursquare",url);
    }
    function hospitality_promise_then(url) {
           document.getElementById("Hospitality Online_url").type="text";
           document.getElementById("Hospitality Online_url").value=url;
           my_query.doneHospitality=true;
           do_finish("Hospitality",url);
    }
     function cvent_promise_then(url) {
           document.getElementById("Cvent.com_url").type="text";
           document.getElementById("Cvent.com_url").value=url;
           my_query.doneCVent=true;
           do_finish("cvent",url);
    }
    function kayak_promise_then(url) {
           document.getElementById("Kayak_url").type="text";
           document.getElementById("Kayak_url").value=url;
           my_query.doneKayak=true;
           do_finish("Kayak",url);
    }

    function localeze_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Localeze: "+response.finalUrl);
        var index=doc.getElementById("index"),inner_li,i,j,success=false,name;
        if(index===null)
        {
            resolve("not-found");
            return;
        }
        inner_li=index.getElementsByTagName("li");
        for(i=0; i < inner_li.length; i++)
        {
            name=inner_li[i].querySelector("[itemprop='name']");
            if(matches_name(name.innerText))
            {
                success=true;
                resolve(name.href.replace(/^https?:\/\/[^\/]+\//,"https://www.neustarlocaleze.biz/"));
                return;
            }
        }
        resolve("not-found");
        return;
    }

    function localeze_promise_then(url) {
           document.getElementById("LocalEze_url").type="text";
           document.getElementById("LocalEze_url").value=url;
           my_query.doneLocaleze=true;
           do_finish("Localeze",url);
    }

    function manta_promise_then(url) {
           document.getElementById("Manta.com_url").type="text";
           document.getElementById("Manta.com_url").value=url;
           my_query.doneManta=true;
           do_finish("Manta",url);
    }
    function mapquest_promise_then(url) {
           document.getElementById("Mapquest.com_url").type="text";
           document.getElementById("Mapquest.com_url").value=url;
           my_query.doneMapquest=true;
           do_finish("Mapquest",url);
    }
    function meetings_promise_then(url) {
           document.getElementById("Meetings & Conventions_url").type="text";
           document.getElementById("Meetings & Conventions_url").value=url;
           my_query.doneMeetings=true;
           do_finish("Meetings",url);
    }
    function superpages_promise_then(url) {
           document.getElementById("Superpages_url").type="text";
           document.getElementById("Superpages_url").value=url;
           my_query.doneSuperpages=true;
           do_finish("superpages",url);
    }

    function travel_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("Travel response: "+response.finalUrl);
        var results=doc.getElementsByClassName("results"),inner_li,i,j,success=false,name;
        var inner_a;
        if(results.length===0)
        {
            resolve("not-found");
            return;
        }
        inner_li=results[0].getElementsByTagName("li");
        for(i=1; i < inner_li.length; i++)
        {
            console.log("Travel: inner_li["+i+"].innerText="+inner_li[i].innerText);
            inner_a=inner_li[i].getElementsByTagName("a");
            console.log("MOO");
            if(inner_a.length===0) continue;

              console.log("MOO2");
            inner_a=inner_a[0];
              console.log("MOO3");
            name=inner_a.innerText.split("-")[0].trim();
            console.log("Travel: name="+name+", my_query.name="+my_query.name+" matches_name(name)="+matches_name(name));
            if(matches_name(name,0))
            {
                console.log("Travel: had success");
                success=true;
                resolve(inner_a.href.replace(/https?:\/\/[^\/]+\//,"https://www.travelweekly.com/"));
                return;
            }
        }
        resolve("not-found");
        return;
    }

    function travel_promise_then(url) {
           document.getElementById("Travel Weekly_url").type="text";
           document.getElementById("Travel Weekly_url").value=url;
           my_query.doneTravel=true;
           do_finish("Travel Weekly",url);
    }

    function tripAdvisor_promise_then(url) {
           document.getElementById("TripAdvisor_url").type="text";
           document.getElementById("TripAdvisor_url").value=url;
           my_query.doneTripAdvisor=true;
           do_finish("Trip Advisor",url);
    }

    function trivago_response(response,resolve,reject) {
        var parsed=JSON.parse(response);
        var result=parsed.result;
        var i,city;
        console.log("Trivago: in trivago_response "+response);
        var url="https://www.trivago.com/";
        if(result===undefined)
        {
            resolve("not-found");
            return;
        }
        for(i=0; i < result.length; i++)
        {
            try
            {
                city=result[i].pths.cityName.replace(/\s/g,"-").toLowerCase();
                url=url+city+"-"+result[i].app.iPathId+"/hotel/";
                url=url+result[i].tt.toLowerCase().replace(/[\{\}]+/g,"").replace(/\s/g,"-").replace(/\'/g,"-");
                url=url.replace(/,.*$/,"").replace(/&/g,"-");
                if(result[i].app.iGeoDistance!==undefined)
                {
                    url=url+"-"+result[i].app.iGeoDistance;
                }
                else if(result[i].app.iGeoDistanceItem!==undefined)
                {
                    url=url+"-"+result[i].app.iGeoDistanceItem;
                }
                
                console.log("Trivago url="+url);
                resolve(url);
                return;

            }
            catch(error) { console.log("insufficient data "+error); }
        }
        resolve("not-found");
        return;
    }

    function trivago_promise_then(url) {
           document.getElementById("Trivago_url").type="text";
           document.getElementById("Trivago_url").value=url;
           my_query.doneTrivago=true;
           do_finish("Trivago",url);
    }
    function yahoo_promise_then(url) {
           document.getElementById("Yahoo_url").type="text";
           document.getElementById("Yahoo_url").value=url;
           my_query.doneYahoo=true;
           do_finish("Yahoo",url);
    }
    function yellowpages_promise_then(url) {
           document.getElementById("Yellow Pages_url").type="text";
           document.getElementById("Yellow Pages_url").value=url;
           my_query.doneYellowPages=true;
           do_finish("YellowPages",url);
    }

    function yelp_promise_then(url) {
           document.getElementById("Yelp_url").type="text";
           document.getElementById("Yelp_url").value=url;
           my_query.doneYelp=true;
           do_finish("Yelp",ul);
    }

    function yellowbook_response(response, resolve, reject)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j;
        var listinginfo=doc.getElementsByClassName("listing-info"),info,name,addresss,inner_a,url;
        for(i=0; i < listinginfo.length; i++)
        {

            info=listinginfo[i].getElementsByClassName("info");
            if(info.length===0) continue;
            info=info[0];
            inner_a=info.getElementsByTagName("a");
            //console.log("Yellowbook: inner_a="+inner_a.href);
            if(inner_a.length===0) continue;
            inner_a=inner_a[0];
            if(matches_name(inner_a.innerText,i))
            {
                url=inner_a.href.replace(/https?:\/\/([^\/]+)\//,"http://www.yellowbook.com/");
                resolve(url);
                return;
            }
        }
        resolve("not-found");

    }

    function yellowbook_promise_then(url) {
        if(/yellowbook\.com\/s\//.test(url) && !my_query.firstYellow)
        {
            my_query.firstYellow=true;
            var yellowBookPromise=new Promise((resolve,reject) => {
                GM_xmlhttpRequest({method: 'GET', url: url,
                               onload: function(response) { yellowbook_response(response, resolve, reject); },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
            });
            yellowBookPromise.then(yellowbook_promise_then)
            .catch(function(val) { console.log("FAiled "+val); });

            return;
        }

           document.getElementById("YellowBook_url").type="text";
           document.getElementById("YellowBook_url").value=url;
           my_query.doneYellowBook=true;
           do_finish("YellowBook",url);
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_google_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIGoogle='https://www.google.com/search?q='+
	    encodeURIComponent(search_str);
	GM_xmlhttpRequest({method: 'GET', url: search_URIGoogle,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

     function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    



    

   

    function do_bing_maps()
    {
        var shareAction=document.getElementById("shareAction");
        var evt = new MouseEvent("click", {bubbles: true,  cancelable: true,view: unsafeWindow });
        if(shareAction===null && my_query.try_count<15)
        {
            console.log("Failed at try "+my_query.try_count);
            my_query.try_count++;
            setTimeout(do_bing_maps, 1000);
            return;
        }
        else {
            console.log("shareAction="+shareAction);
        }
        shareAction.dispatchEvent(evt);
        setTimeout(do_bing_maps2,2500);
    }
    function do_bing_maps2()
    {
        console.log("Doing bing maps 2");
        var evt2 = new MouseEvent("click", {bubbles: true,  cancelable: true,view: unsafeWindow
                                          }),evt3 = new MouseEvent("click", {bubbles: true,  cancelable: true,view: unsafeWindow
                                          });;
        var linkStyleButton=document.getElementById("linkStyleButton");
        linkStyleButton.dispatchEvent(evt2);
        setTimeout(function() {
            var urlBox=document.getElementsByClassName("urlBox")[0];
            console.log("urlBox.value="+urlBox.value);
            GM_setValue("bing_maps_result",urlBox.value.replace(/&.*$/,""));
        },1500);
        //linkStyleButton.dispatchEvent(evt3);


    }

    function list_elements(name,elem,depth)
    {
        var x,y,val;
        console.log("list_elements: "+name+","+depth);
       // console.log("/^unsafeWindow[s]/.test(name)="+/^unsafeWindow\[s\]/.test(name));
        if((depth>2 )

          ) return;
        else { }
        for(val in elem)
        {

            if(depth===0&&!/^s_i_cventmasterglobal/.test(val)) continue;
          //  if(depth===2&&/^(_il|w)$/.test(val)) continue;
            if(typeof(elem[val])==='function')
            {
              //  console.log(name+"["+val+"]="+elem[val]);
            }
            else if(typeof(elem[val])==='object')
            {
                console.log(name+"["+val+"]=object");
                try
                {
                    JSON.stringify(elem[val]);
                    console.log("\t"+JSON.stringify(elem[val]));
                }
                catch(error) { console.log("error="+error+", val="+val); }
                list_elements(name+"["+val+"]",elem[val],depth+1);

            }
        }

    }

    function do_cvent()
    {
        var x,y,z;
        var searchString=document.getElementById("searchString");
        var Podium = {};

        Podium.keypress = function(k) {
            var oEvent = document.createEvent('KeyboardEvent');

            // Chromium Hack
            Object.defineProperty(oEvent, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
            });
            Object.defineProperty(oEvent, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
            });

            if (oEvent.initKeyboardEvent) {
                oEvent.initKeyboardEvent("keypress", true, true, document.defaultView, k, k, "", "", false, "");
            } else {
                oEvent.initKeyEvent("keypress", true, true, document.defaultView, false, false, false, false, k, 0);
            }

            oEvent.keyCodeVal = k;

            if (oEvent.keyCode !== k) {
                alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
            }

           searchString.dispatchEvent(oEvent);
        }

        Podium.keypress(65); // for arrow-down, arrow-up is 38

     /*   for(x in searchString)
        {
            if(/reactInternal/i.test(x))
            {
                console.log("x="+x);
                for(y in searchString[x])
                {
                    console.log("react["+y+"]="+searchString[x][y]);
                }
                var evt = new KeyboardEvent("keydown", {key:"x",bubbles: true, cancelable: true,view: unsafeWindow });
                searchString[x].updateTextContent(evt);
            }
            //else { console.log("not: x="+x); }
        }*/

       // window.mR = moduleRaid();
        var re=window.mR.modules["./node_modules/react-dom/lib/ReactEventListener.js"];
        for(x in window.mR.modules['145o8'])
        {
            console.log("x="+x);
            try
            {
                console.log("window.mR.modules['145o8'][x]="+window.mR.modules['145o8'][x]);
            }
            catch(e) { console.log("err:"+e); }
        }
        //console.log("window.mR="+JSON.stringify(window.mR));
        var inputEvent = new InputEvent("syntheticInput", {inputType:"insertText",data: my_query.name});

        searchString.dispatchEvent(inputEvent);
        console.log("Done dispatch");
       // list_elements("unsafeWindow",unsafeWindow,0);
        //searchString.value=my_query.name;
      //  var d=unsafeWindow["_"]();
        /*var dispatchKeyboardEvent = function(target, initKeyboradEvent_args) {
            var e = document.createEvent("KeyboardEvents");
            e.initKeyboardEvent.apply(e, Array.prototype.slice.call(arguments, 1));
            target.dispatchEvent(e);
        };
        var i;*/

        //var evt=new KeyboardEvent('keydown', {key:'x',char:'x'}), my_button=null,i;
        //searchString.focus();
        /*setTimeout(function() {
            Podium.keypress(65);
            dispatchKeyboardEvent(
    searchString, 'keypress', true, true, null, 'h', 0, '');

                               var buttons=document.getElementsByTagName("button");
                               for(i=0; i < buttons.length; i++)
                               {
                                   if(/solidCallToAction/.test(buttons[i].className))
                                   {
                                       my_button=buttons[i];
                                   }
                               }
                               if(my_button===null)
                               {
                                   console.log("NO BUTTON");
                                   return;
                               }
                               setTimeout(my_button.click(), 500);

                              }, 500);*/
      /*  searchString.addEventListener("keydown",function()
                                      {
            setTimeout(function() {
                var x,y,z;
                for(z in unsafeWindow)
                {
                    if(/jquery[\d]+/i.test(z)) { y=z; }
                    if(typeof(unsafeWindow[z])==="function")
                    {
                      console.log("unsafeWindow["+z+"]="+unsafeWindow[z]);
                    }
                    else
                    {
                        try {
                            // console.log("typeof(unsafeWindow[z])="+typeof(unsafeWindow[z]));
                            console.log("unsafeWindow["+z+"]="+JSON.stringify(unsafeWindow[z])+", "+typeof(unsafeWindow[z]));
                        }
                        catch(e) { console.log("error "+e+"\ton "+z); }
                    }
                }
                y="google";
                console.log("y="+y+"\n\n");
                for(x in unsafeWindow.google.maps)
                {
                    if(typeof(unsafeWindow.google.maps[x])==="function")
                    {
                        console.log("unsafeWindow.google.maps["+x+"]="+unsafeWindow.google.maps[x]);
                    }
                    else if(typeof(unsafeWindow.google.maps[x])==="object")
                    {

                        console.log("unsafeWindow.google.maps["+x+"]=");
                        try
                        {
                            console.log("\t"+JSON.stringify(unsafeWindow.google.maps[x]));
                        }
                        catch(error) { console.log(error+", "+unsafeWindow.google.maps[x]);

                                     }

                    }
                }
                for(x in unsafeWindow.NREUM.o)
                {
                    if(typeof(unsafeWindow.NREUM.o[x])==="function")
                    {
                        console.log("unsafeWindow.NREUM.o["+x+"]="+unsafeWindow.NREUM.o[x]);
                    }
                    else if(typeof(unsafeWindow.NREUM.o[x])==="object")
                    {
                        try
                        {
                            console.log("unsafeWindow.NREUM.o["+x+"]=");
                            console.log("\t"+JSON.stringify(unsafeWindow.NREUM.o[x]));
                        }
                        catch(error) { console.log(error); }
                    }
                }
            },2500);
        });*/
        var settings = JSON.parse(document.getElementById('applicationSettings').innerText);

       // var d=unsafeWindow.NREUM.addPageAction();


        //console.log("d="+JSON.stringify(d));
     

     //   var evt=new KeyboardEvent('keydown', {key:'x',char:'x'}),
        var my_button=null;
        var evt2 = new MouseEvent("click", {bubbles: true,  cancelable: true,view: unsafeWindow });
        

     /*   searchString.value=my_query.address;
        searchString.focus();
        searchString.click();
        searchString.click();
        x=unsafeWindow.newrelic.interaction();
        x=x.get();
        setTimeout(function() {
        console.log("x="+JSON.stringify(x));
        for(z in x)
        {
            console.log("x["+z+"]="+x[z]);
        }
        },1500);*/
        /*setTimeout(function() {
            // unsafeWindow.NREUM.setToken({'stn':1,'err':1,'ins':1,'cap':0,'spa':1})
            // searchString.value=my_query.address;
            var node=searchString;
           // unsafeWindow.dispatchEvent(evt);

        setTimeout(function() { my_button.dispatchEvent(evt2);
                              console.log("Dispatched click");
                              }, 1000);
        }, 1000);*/

    }

    function do_bing_translator()
    {
        var t_sv=unsafeWindow.document.getElementById("t_sv");
        t_sv.value=my_query.translate_query;

        setTimeout(function() { console.log("Done timeout");
                               var msevt = new MouseEvent("click", {
                                   bubbles: true,
                                   cancelable: true,
                                   view: unsafeWindow,
                                   ctrlKey: true
                               });
                               t_sv.dispatchEvent(msevt);
                             var evt=new KeyboardEvent('keydown', {key:'x',char:'x'});
                               t_sv.dispatchEvent(evt);
                               setTimeout(function() {
                               var msevt2 = new MouseEvent("click", {
                                   bubbles: true,
                                   cancelable: true,
                                   view: unsafeWindow,
                                   ctrlKey: true
                               });
                               t_sv.dispatchEvent(msevt2);
                               }, 500);


                               setTimeout(function() {
                                   var t_tv=unsafeWindow.document.getElementById("t_tv");
                                   console.log("t_tv.value="+t_tv.value);
                                   GM_setValue("bing_translator_result",t_tv.value);
                                  setTimeout(function() { window.location.reload() }, 500);
                               },2500);


                              }, 500);
    }





    function init_Query()
    {
       // var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var country;
        var x;
        var ctrl=document.getElementsByClassName("form-control");
        for(x=0; x<ctrl.length; x++)
        {
            if(ctrl[x].type!==undefined && ctrl[x].type==="url") ctrl[x].type="text";
        }

        my_query={name: wT.rows[0].cells[1].innerText, address: wT.rows[1].cells[1].innerText.replace(/;/g,","),
                  phone: wT.rows[2].cells[1].innerText,
                 doneCitySearch: false, doneBingMaps: false, doneBing: false, doneCVent: true, doneFB: false, submitted: false,
                 doneGoogleMaps: false, doneFoursquare: false, doneHospitality: false, doneKayak: false,
                 doneLocaleze: false, doneManta: false, doneMapquest: false, doneMeetings: false, doneSuperpages: false,
                 doneTravel: false, doneTripAdvisor: false, doneTrivago: false, doneYahoo: false, doneYellowPages: false,
                 doneYelp: false, doneYellowBook: false, firstYellow:false, not_found_count:0,manta_url:""};
        country=my_query.address.match(/,([^,]+)$/)[1];

        my_query.full_name=my_query.name.trim();
        my_query.name=my_query.name.replace(/&.*$/,"").replace(/\s*Hotel$/,"").trim().replace(/,.*$/,"").trim();
        my_query.address=my_query.address.replace(/,([^,]+)$/,"");
        my_query.parsedAdd=parseAddress.parseLocation(my_query.address);
        if(my_query.parsedAdd===null)
        {
            my_query.parsedAdd={};
        }
        my_query.parsedAdd.country=country;
        if(my_query.parsedAdd.city===undefined && (my_query.parsedAdd.country==="CA" || my_query.parsedAdd.country==="US"))
        {
            var split_add=my_query.address.split(",");
            my_query.parsedAdd.city=split_add[split_add.length-3];
            my_query.parsedAdd.state=split_add[split_add.length-2];
             my_query.parsedAdd.zip=split_add[split_add.length-1];
        }
        else if(my_query.parsedAdd.city===undefined) my_query.parsedAdd.city="";
        if(my_query.parsedAdd.state===undefined) my_query.parsedAdd.state="";
         if(my_query.parsedAdd.zip===undefined) my_query.parsedAdd.zip="";

        GM_setValue("my_query",my_query);

        if(my_query.parsedAdd.country==="CN")
        {
            //init_full_query();
           GM_setValue("bing_translator_result","");
            GM_addValueChangeListener("bing_translator_result",function()
                                      {
                var result=arguments[2];
                console.log("result="+result);
                my_query.name=result;
                my_query.full_name=result;
                init_full_query();
            });
            GM_setValue("bing_translator_query",my_query.name);
        }
        else
        {
            init_full_query();
        }
    }
    function init_full_query()
    {
        document.getElementById("Manta.com_url").type="text";

        console.log("my_query="+JSON.stringify(my_query));
        var city_url="http://www.citysearch.com/search?what="+encodeURIComponent(
            my_query.name.replace(/,([^,]+)$/,"").replace(/Hotel$/i,"").replace(/\s-\s.*$/,"").replace(/\sat\s.*$/,""))
        +"&where="+
            encodeURIComponent(my_query.parsedAdd.city+", "+my_query.parsedAdd.state);
        var search_str=my_query.name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state;
        var uri_name_city_state= encodeURIComponent(my_query.name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state);
        var bing_maps_url="https://www.bing.com/maps?q="+encodeURIComponent(my_query.full_name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state)+"&FORM=HDRSC4";
        var google_maps_url="https://www.google.com/maps?q="+uri_name_city_state;
        var localezeurl="https://www.neustarlocaleze.biz/directory/us?Name="+encodeURIComponent(my_query.name)+"&location="+
            encodeURIComponent(my_query.parsedAdd.zip);
        var travel_url="https://www.travelweekly.com/Hotels/Search?pst="
        +encodeURIComponent(removeDiacritics(my_query.name.replace(/,([^,]+)$/,"").replace(/\s*-.*$/,""))+" "+my_query.parsedAdd.state)+"&typ=HOT";
        var trivago_url="https://www.trivago.com/search/com-US-US/18498_cache/suggest_concepts?flags=27&q="+
            encodeURIComponent(my_query.name.replace(/\sat\s.*$/,"")+" "+my_query.parsedAdd.state);

        console.log("city_url="+city_url);
        const citySearchPromise = new Promise((resolve, reject) => {
            console.log("Beginning city search");
            GM_xmlhttpRequest({method: 'GET', url: city_url,
            onload: function(response) { city_search_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        citySearchPromise.then(city_search_promise_then)
        .catch(function(val) {
           console.log("Failed at this citysearchPromise " + val); GM_setValue("returnHit",true); });

        /* Bing promise */
                search_str=my_query.full_name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state;

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning Query search with "+search_str);
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        const bingMapsPromise = new Promise((resolve, reject) => {
            console.log("Beginning Bing Maps search");
            GM_setValue("bing_maps_result","");
            GM_addValueChangeListener("bing_maps_result",function() {
                var result=arguments[2];
                document.getElementById("Bing Maps_url").type="text";
                document.getElementById("Bing Maps_url").value=result;
                my_query.doneBingMaps=true;
                do_finish("Bing maps",result);
            });
            GM_setValue("bing_maps_url",bing_maps_url);
        });
        bingMapsPromise.then(function() { }).catch(function(val) {
            console.log("Failed at this bingMapsPromise " + val); GM_setValue("returnHit",true); });
        const googleMapsPromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest({method: 'GET', url: google_maps_url,
            onload: function(response) { google_maps_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        googleMapsPromise.then(google_maps_promise_then)
        .catch(function(val) {
           console.log("Failed at this googleMapsPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:cvent.com";
        const cVentPromise = new Promise((resolve, reject) => {
            console.log("Beginning cvent search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        cVentPromise.then(cvent_promise_then).catch(function(val) {
            console.log("Failed at this cventPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning Facebook search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        fbPromise.then(fb_promise_then)
        .catch(function(val) {
           console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:foursquare.com";
        const foursquarePromise = new Promise((resolve, reject) => {
            console.log("Beginning Foursquare search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        foursquarePromise.then(foursquare_promise_then)
        .catch(function(val) {
           console.log("Failed at this foursquarePromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:hospitalityonline.com";
        const hospitalityPromise = new Promise((resolve, reject) => {
            console.log("Beginning Foursquare search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        hospitalityPromise.then(hospitality_promise_then)
        .catch(function(val) {
           console.log("Failed at this hospitalityPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:kayak.com";
        const kayakPromise = new Promise((resolve, reject) => {
            console.log("Beginning Kayak search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        kayakPromise.then(kayak_promise_then)
        .catch(function(val) {
           console.log("Failed at this kayakPromise " + val); GM_setValue("returnHit",true); });
        const localezePromise = new Promise((resolve, reject) => {
            console.log("Beginning localeze search");
            GM_xmlhttpRequest({method: 'GET', url: localezeurl,
            onload: function(response) { localeze_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        localezePromise.then(localeze_promise_then)
        .catch(function(val) {
           console.log("Failed at this localezePromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:manta.com";
      /*  const mantaPromise = new Promise((resolve, reject) => {
            console.log("Beginning Manta search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        mantaPromise.then(manta_promise_then)
        .catch(function(val) {
           console.log("Failed at this mantaPromise " + val); GM_setValue("returnHit",true); });*/

        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:mapquest.com";
        const mapquestPromise = new Promise((resolve, reject) => {
            console.log("Beginning Mapquest search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        mapquestPromise.then(mapquest_promise_then)
        .catch(function(val) {
           console.log("Failed at this mapquestPromise " + val); GM_setValue("returnHit",true); });
         search_str=my_query.name+" "+my_query.parsedAdd.state+" site:meetings-conventions.com";
        const meetingsPromise = new Promise((resolve, reject) => {
            console.log("Beginning Meetings search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        meetingsPromise.then(meetings_promise_then)
        .catch(function(val) {
           console.log("Failed at this meetings " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:superpages.com";
        const superpagesPromise = new Promise((resolve, reject) => {
            console.log("Beginning Superpages search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        superpagesPromise.then(superpages_promise_then)
        .catch(function(val) {
           console.log("Failed at this superpagesPromise " + val); GM_setValue("returnHit",true); });

        const travelPromise = new Promise((resolve, reject) => {
            console.log("Beginning travel weekly search");
            GM_xmlhttpRequest({method: 'GET', url: travel_url,
            onload: function(response) { travel_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
        });
        travelPromise.then(travel_promise_then)
        .catch(function(val) {
           console.log("Failed at this localezePromise " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:tripadvisor.com";
        const tripAdvisorPromise = new Promise((resolve, reject) => {
            console.log("Beginning TripAdvisor search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        tripAdvisorPromise.then(tripAdvisor_promise_then)
        .catch(function(val) {
           console.log("Failed at this tripAdvisorPromise " + val); GM_setValue("returnHit",true); });

        const trivagoPromise = new Promise((resolve, reject) => {
            console.log("Beginning trivago search with "+trivago_url);
            GM_xmlhttpRequest({method: 'GET', url: trivago_url, timeout: 5000,
            onload: function(response) {
                console.log("Glunk ");
                console.log(response.responseText);
                trivago_response(response.responseText, resolve, reject); },
            onerror: function(response) { reject("Trivago: Fail"); },
            ontimeout: function(response) { reject("Trivago: Fail"); }
            });
            console.log("Blunk");
        });
        trivagoPromise.then(trivago_promise_then)
        .catch(function(val) {
           console.log("Failed at this trivagoPromise " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:local.yahoo.com";
        const yahooPromise = new Promise((resolve, reject) => {
            console.log("Beginning Yahoo search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        yahooPromise.then(yahoo_promise_then)
        .catch(function(val) {
           console.log("Failed at this yahooPromise " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" "+my_query.parsedAdd.state+" site:yellowpages.com";
        const yellowpagesPromise = new Promise((resolve, reject) => {
            if(my_query.parsedAdd.country==="US")
            {
                console.log("Beginning YellowPages search with "+search_str);
                query_search(search_str, resolve, reject, fb_response);
            }
            else
            {
                resolve("not-found");
            }
        });
        yellowpagesPromise.then(yellowpages_promise_then)
        .catch(function(val) {
           console.log("Failed at this yellowpages " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" "+my_query.parsedAdd.city+" "+my_query.parsedAdd.state+" site:yelp.com";
        const yelpPromise = new Promise((resolve, reject) => {
            if(has_yelp[my_query.parsedAdd.country]===undefined||has_yelp[my_query.parsedAdd.country])
            {
                console.log("Beginning Yelp search with "+search_str);
                query_search(search_str, resolve, reject, fb_response);
            }
            else
            {
                yelp_promise_then("not-found");
            }
        });
        yelpPromise.then(yelp_promise_then)
        .catch(function(val) {
           console.log("Failed at this yelp " + val); GM_setValue("returnHit",true); });

        search_str=my_query.name+" site:yellowbook.com";
        var yellowbook_url="http://www.yellowbook.com/s/"+my_query.name.replace(/,([^,]+)$/,"").replace(/\s/g,"-")+"/"+
            my_query.parsedAdd.zip;
            //my_query.parsedAdd.city.replace(/\s/g,"-")+"-"+my_query.parsedAdd.state;
        console.log("Yellowbook URL: "+yellowbook_url);
        const yellowBookPromise=new Promise((resolve,reject) => {
                GM_xmlhttpRequest({method: 'GET', url: yellowbook_url,
                               onload: function(response) { yellowbook_response(response, resolve, reject); },
                               onerror: function(response) { reject("Fail"); },
                               ontimeout: function(response) { reject("Fail"); }
                              });
            });
            yellowBookPromise.then(yellowbook_promise_then)
            .catch(function(val) { console.log("FAiled "+val); });

            return;
      /*  const yellowBookPromise = new Promise((resolve, reject) => {
            console.log("Beginning YellowBook search with "+search_str);
            query_search(search_str, resolve, reject, fb_response);
        });
        yellowBookPromise.then(yellowbook_promise_then)
        .catch(function(val) {
           console.log("Failed at this YellowBook " + val); GM_setValue("returnHit",true); });*/


    }

    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled ) init_Query();
    }
     else if(window.location.href.indexOf("bing.com/maps")!==-1)
    {
        my_query.try_count=0;
        GM_setValue("bing_maps_url","");
        GM_addValueChangeListener("bing_maps_url",function() {
            var url=GM_getValue("bing_maps_url");
            window.location.href=url;
        });
        setTimeout(do_bing_maps,3000);
    }
     else if(window.location.href.indexOf("bing.com/translator")!==-1)
    {
        my_query=GM_getValue("my_query",{name:"北京金融街威斯汀大酒店"});
        my_query.try_count=0;
        if(!GM_getValue("done_shit",false)) {
                        console.log("Done shit is false");

            GM_setValue("bing_translator_query","");
            GM_addValueChangeListener("bing_translator_query",function() {

                GM_setValue("done_shit",true);
                window.location.reload();
                //my_query.translate_query=arguments[2];
                //setTimeout(do_bing_translator,100);

            });
        }
        else
        {
            console.log("Done shit is true");
            GM_setValue("done_shit",false);
            my_query.translate_query=GM_getValue("bing_translator_query");
            setTimeout(do_bing_translator,100);
        }

    }
    else if(window.location.href.indexOf("cvent.com/venues")!==-1)
    {
        my_query=GM_getValue("my_query",{address:"9703 Collins Avenue;Bal Harbour - Miami Beach;FL;33154;US".replace(/;/g,",")});
        console.log("my_query="+JSON.stringify(my_query));
        GM_setValue("cvent_url","");
        GM_addValueChangeListener("cvent_url",function() {
            var url=GM_getValue("cvent_url");
            window.location.href=url;
        });
        var d=unsafeWindow.startCSNSearchApp(settings);
        setTimeout(do_cvent,3000);
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();
