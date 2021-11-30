// ==UserScript==
// @name         Aetius Rossa
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse bing maps
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2B6LCT6JZZREC",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function parse_maps(response,resolve,reject) {
            var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_maps\n"+response.finalUrl);
        //console.log("doc=",doc);
        //console.log("doc=",doc.body.innerHTML);
        try {
                    var entity=doc.querySelector(".overlay-taskpane").dataset.entity;

            var parsed=JSON.parse(entity);
            var name=decodeURIComponent(response.finalUrl.replace(/^.*\?q\=/,"").replace(/&.*$/,""));
            console.log("parsed=",parsed);
            let curr_lat=parseFloat(parsed.routablePoint.latitude),curr_lon=parseFloat(parsed.routablePoint.longitude);
            let curr_dist=Math.sqrt((curr_lat-my_query.lat)*(curr_lat-my_query.lat)+(curr_lon-my_query.lon)*(curr_lon-my_query.lon));
            my_query.items.push({name:name,curr_lat:curr_lat,curr_dist:curr_dist});
        }
        catch(error) { }
        resolve("");
    }

    function create_promise(url) {
         url=url.replace(/\/maps/,"/maps/overlaybfpr").replace(/\&ss\=/,"&filters=local_").replace(/\&cp.*$/,"").replace(/ypid\./,"ypid%3A\"")+"\"";
        console.log("new url=",url);
        return new Promise((resolve,reject) => {
              GM_xmlhttpRequest({method: 'GET', url: url,
                           onload: function(response) { parse_maps(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
        });
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            var bizlist2=doc.querySelectorAll(".mt_bizList .bm_details_overlay");
            var bizlist=doc.querySelectorAll(".mt_biz_link");
            //console.log(bizlist2);
            var min_dist=100000000,curr_min_dist;
            var curr_best="";
            var promise_list=[];
            if(bizlist.length>0) {
                for(i=0;i<bizlist.length;i++) {
                    bizlist[i].href=MTP.fix_remote_url(bizlist[i].href,response.finalUrl);
                                        console.log("bizlist[i].href=",bizlist[i].href);

                    promise_list.push(create_promise(bizlist[i].href));
                }
                Promise.all(promise_list).then(function() { resolve(""); })
                .catch(function(response) { console.log("Failed "+response); GM_setValue("returnHit",true); });
                return;
            }

            /*    //console.log(bizlist2[i].outerHTML);
                let overlayTemp=bizlist2[i].dataset.detailsoverlay;
                //console.log(overlayTemp);
                let overlay=JSON.parse(overlayTemp);
                let curr_lat=parseFloat(overlay.centerLatitude),curr_lon=parseFloat(overlay.centerLongitude);
                let curr_dist=Math.sqrt((curr_lat-my_query.lat)*(curr_lat-my_query.lat)+(curr_lon-my_query.lon)*(curr_lon-my_query.lon));
                console.log("* "+bizlist2[i].innerText.trim()+", curr_dist="+curr_dist);

                if(curr_dist < min_dist) {
                    curr_best=bizlist2[i].innerText.trim();
                    console.log("\tbest is "+curr_best+" , "+curr_dist);
                    min_dist=curr_dist;
                }

                  }
            if(bizlist.length>=1&&curr_best&&min_dist<.000005) {
                resolve(curr_best);
                return;
            }*/
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("my_query.items=",my_query.items);
        var min_dist=1000000, name="";
        var i;
        for(i=0;i<my_query.items.length;i++) {
            if(my_query.items[i].curr_dist<min_dist) {
                min_dist=my_query.items[i].curr_dist;
                name=my_query.items[i].name;
            }
        }
        if(min_dist<.005) {
            my_query.fields.companyName=name;
            submit_if_done();
        }
        else {
            GM_setValue("returnHit",true);
        }
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
      var query=decodeURIComponent(document.querySelector("crowd-form a").href.replace(/.*?q\=/,""));
        var split=query.split(",");

        my_query={name:"",query:query,lat:parseFloat(split[0]),lon:parseFloat(split[1]),fields:{},done:{},
		  try_count:{"query":0},items:[],
		  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=query;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();