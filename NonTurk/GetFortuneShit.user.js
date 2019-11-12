// ==UserScript==
// @name         GetFortuneShit
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*trystuff.com*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect fortune.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var query_list=[];
    var done_queries=0;
    begin_script();
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTP!==undefined) { callback(); }
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }



    function parse_fortune(response,resolve,reject,first,num) {
        var text=response.responseText;
        var parsed=JSON.parse(text);
        var items=parsed["list-items"];
        var x,y,str,str2;
        for(x in items) {
            console.log(items[x]['title']+","+items[x]['rank']+","+items[x]['prev_rank']);

        }
        resolve(first);
    }
    function parse_then(first) {
       // console.log("first="+first);
         var year_map={2017:"2013055",2018:"2358051"};
        var year=2017;

        if(first>900) return;
        first=first+100;
        var num=100+first;
        var url="http://fortune.com/api/v2/list/"+year_map[year]+"/expand/item/ranking/asc/"+first+"/"+(num).toString();
        var headers={"host":"fortune.com","referer":"http://fortune.com/fortune500/list/"};
        var promise=new Promise((resolve,reject) => {
            GM_xmlhttpRequest({method: 'GET', url: url,headers:headers,
                               onload: function(response) { parse_fortune(response,resolve,reject,first,num); },
                               onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                              });
        }).then(parse_then);
    }
    // title,name,filter,tables,id,description,videos,links,stories,social,thumbnail,people,companies,tags,seo,rank,order,permalink,prev_rank,shortlink,uri,sort,swot,meta,highlights,mobile_thumbnail,footnotes,other_lists_ranking,related,grid_image,lists

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var first=0,num=100;
        var year_map={2017:"2013055",2018:"2358051"};
        var year=2017;
      //  http://fortune.com/api/v2/list/2013055/expand/item/ranking/asc/150/50
        var url="http://fortune.com/api/v2/list/"+year_map[year]+"/expand/item/ranking/asc/"+first.toString()+"/"+num.toString();
        var headers={"host":"fortune.com","referer":"http://fortune.com/fortune500/list/"};
        var promise=new Promise((resolve,reject) => {
            GM_xmlhttpRequest({method: 'GET', url: url,headers:headers,
                               onload: function(response) { parse_fortune(response,resolve,reject,first,num); },
                               onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                              });
        }).then(parse_then);


    }

})();