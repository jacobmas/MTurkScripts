// ==UserScript==
// @name         KyleKirst
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.allstays.com/*
// @include https://allstays.com/*
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
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
    var bad_urls=["rvparkreviews.com","allstays.com","www.trails.com","www.singletracks.com","//rv52.com","facebook.com","beachcalifornia.com",
                 "www.campendium.com","www.roverpass.com","www.californiasbestcamping.com","roadtrippers.com",
                  "www.campscout.com","camping-usa.com","www.tripadvisor.com","www.mhvillage.com","www.countyoffice.org","www.yelp.com",
                  "www.twitter.com","/mapcarta.com","www.topozone.com","www.roadsidethoughts.com","www.placekeeper.com","/freecampsites.net/",
                 "www.geocaching.com","www.go-california.com","www.roverpass.com","//cacamper.com","www.campgroundviews.com/","go-oregon.com",
                 "www.campgroundsoregon.com","oregoncoast.craigslist.org",".hub.biz","s3.amazonaws.com","en.wikipedia.org/","local.yahoo.com",
                 "aaa.com","rvparking.com","www.youtube.com","roadsideamerica.com","ca-camping-review.com","trailsource.com","publiclands.org",
                 "idahocampgroundreview.com","cybo.com","recreation.gov","tripcarta.com","www.go-","ndtourism.com","govoffice.com",
                 "www.campingandcampgrounds.com","hotelmotels.info","campsd.org"];

    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }

    function is_right_state(b_algo)
    {
        var state_regexp=new RegExp("›."+my_query.state+".›");
        var b_attribution=b_algo.getElementsByClassName("b_attribution");
        if(b_attribution.length>0)
        {
            if(state_regexp.test(b_attribution[0].innerText)) return true;
        }
        console.log("is_right_state failed");
        return false;
    }
    function is_bad_query(b_name,b_url)
    {
        var split=b_url.replace(/\/$/,"").split("/");
        console.log(JSON.stringify(split));

        if(b_url.indexOf("koa.com")!==-1 && my_query.name.indexOf("KOA")===-1) return true;
        if(b_url.indexOf(".com/")!==-1 && b_url.indexOf("ocparks.com")===-1 && b_url.indexOf("koa.com") ===-1 && split.length>4) { return true; }
        if(b_url.indexOf(".com/")!==-1 && b_url.indexOf("ocparks.com")===-1 && b_url.indexOf("koa.com") ===-1 && split.length>3 &&
           split[3].split("-").length>=3) return true;
        else if(split.length>3) console.log("split[4].split('=')="+JSON.stringify(split[3].split("-")));
        if(my_query.name.indexOf("BLM")!==-1 && b_url.indexOf("blm.gov")===-1) return true;
        //else { console.log("length="+b_url.split("/").length); }
        return false;
    }

     function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a, search_str;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption, b_context;
         var lgb_info, b_entityTitle;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(lgb_info!==null)
            {
                b_url=lgb_info.getElementsByTagName("a")[0].href;
                b_name=lgb_info.getElementsByTagName("a")[0].textContent;

                if(b_url.indexOf("mturkcontent.com")===-1 &&
                  ((response.finalUrl.indexOf("allstays.com")!==-1 &&
                   b_url.indexOf("/Campgrounds-details/")!==-1 && b_url.indexOf("allstays.com")!==-1
                   ) || (!is_bad_url(b_url, bad_urls,-1) && !is_bad_query(b_name,b_url)))

                  )
                {

                    console.log("resolving on b_url="+b_url);
                    resolve(b_url);
                    return;

                }
            }
            if(b_context!==null)
            {
                b_url="";
                b_entityTitle=b_context.getElementsByClassName("b_entityTitle");
                if(b_entityTitle.length>0)
                {
                    console.log("b_entityTitle[0]="+b_entityTitle[0].innerText);
                    var cbtn=b_context.getElementsByClassName("cbtn")
                    for(i=0; i < cbtn.length; i++) {
                        if(cbtn[i].innerText==="Website")
                        {
                            console.log("Found button");
                            b_url=cbtn[i].href; break;
                        }
                    }
                    if(b_url.length>0 &&
                        ((response.finalUrl.indexOf("allstays.com")!==-1  &&
                          b_url.indexOf("/Campgrounds-details/")!==-1 && b_url.indexOf("allstays.com")!==-1
                         ) || (!is_bad_url(b_url, bad_urls,-1) && !is_bad_query(b_name,b_url)))

                    )
                    {

                        console.log("resolving on b_url="+b_url);
                        resolve(b_url);
                        return;

                    }
                }



            }
            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");

            }

            for(i=0; i < b_algo.length && i < 7; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("("+i+"), b_name="+b_name+", my_query.first="+my_query.first+"\nb_url="+b_url);
                if((b_name.toLowerCase().indexOf(my_query.first)!==-1 ||

                    (my_query.name.indexOf("BLM")!==-1  && b_url.indexOf("blm.gov")!==-1   )) &&
                  ((response.finalUrl.indexOf("allstays.com")!==-1 && b_url.indexOf("allstays.com")!==-1 && is_right_state(b_algo[i]) &&
                    b_url.indexOf("/Campgrounds-details/")!==-1)
                   || (!is_bad_url(b_url, bad_urls,-1) && !is_bad_query(b_name,b_url)))

                  )
                {
                    if(i < 3 )
                    {
                        console.log("resolving on b_url="+b_url);
                        resolve(b_url);
                        return;
                    }
                    else {
                        console.log("Cannot determine if "+b_url+" is good, returning");
                        GM_setValue("returnHit",true);
                        return;
                    }


                }

            }

           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
	    console.log("Error "+error);
	    GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
         if(my_query.webCount < 2)
         {

             if(my_query.webCount===0) search_str=my_query.short_name+" "+my_query.city+" "+my_query.state;
             else if(my_query.webCount===1) search_str=my_query.short_name+" "+my_query.city+" "+my_query.state+" campground";

             my_query.webCount++;
             const webPromise = new Promise((resolve, reject) => {
                 console.log("Beginning URL search");
                 query_search(search_str, resolve, reject, query_response);
             });
             webPromise.then(web_promise_then
                            )
                 .catch(function(val) {
                 console.log("Failed at this webPromise " + val); GM_setValue("returnHit",true); });
             return;
         }

        console.log("None found");
        //document.getElementById("web_url").value="https://www.NA.com";
         //check_and_submit(check_function,automate);
        GM_setValue("returnHit",true);
        return;

    }

    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        if(url.indexOf("allstays.com")===-1)
        {
            console.log("Setting non-allstays");
            document.getElementById("web_url").value=url;
              check_and_submit(check_function,automate);
        }
        GM_setValue("result","");
        GM_addValueChangeListener("result",function() {
            var result=arguments[2];
            if(result.url.length===0 || result.url.indexOf("web.archive.org/")!==-1 ||
              is_bad_url(result.url,bad_urls,-1))
            {
                var search_str=my_query.name+" "+my_query.city+" "+my_query.state;
                const webPromise = new Promise((resolve, reject) => {
                    console.log("Beginning URL search");
                    query_search(search_str, resolve, reject, query_response);
                });
                webPromise.then(web_promise_then
                               )
                    .catch(function(val) {
                    console.log("Failed at this webPromise " + val); GM_setValue("returnHit",true); });
                return;

            }

            document.getElementById("web_url").value=result.url;
              check_and_submit(check_function,automate);
        });
        GM_setValue("url",url);



    }

    function web_promise_then(url)
    {
        console.log("Setting url");
         document.getElementById("web_url").value=url;
              check_and_submit(check_function,automate);
    }

    function do_allstays()
    {

        var url=document.querySelector('[itemprop="url"]');
        var result={url: url.href};
        GM_setValue("result",result);
    }




    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var first=wT.rows[0].cells[1].innerText.replace(/\-/g," ").split(" ")[0];
        my_query={name:wT.rows[0].cells[1].innerText, address: wT.rows[1].cells[1].innerText, city: wT.rows[2].cells[1].innerText,
                 state: wT.rows[3].cells[1].innerText, first: first.toLowerCase(), secondSearch: false, webCount: 0};
        my_query.short_name=my_query.name.replace(/ Mobile Home /i," ");
	var search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:allstays.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("allstays.com")!==-1)
    {
        GM_setValue("url","");
        GM_addValueChangeListener("url",function() {
            if(GM_getValue("url").indexOf("allstays.com")!==-1) {
                window.location.href=GM_getValue("url");
            }
        });
        setTimeout(do_allstays,500);
    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
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