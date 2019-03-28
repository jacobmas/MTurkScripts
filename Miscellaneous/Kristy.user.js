// ==UserScript==
// @name         Kristy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do forbes
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var country_map={"China":".cn"};
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A37IEINJWEMFFG");
    var bad_urls=["seekingalpha.com","bloomberg.com/quotes","en.wikipedia.org"];
        function acronym(text) {
        text=text.replace(/([A-Za-z]{1})-([A-Za-z]{1])/,"$1 $2");
        var ret="",t_split=text.split(" ");
        for(var i=0; i < t_split.length; i++)
            if(/[A-Z]+/.test(t_split[i].substr(0,1))) ret=ret+t_split[i].charAt(0);
        return ret;
    }
    function is_bad_name(b_name)
    {
        var short_b_name=b_name.replace(/[\s\-\'\.]+/g,"").toLowerCase();
        var short_company_name=MTurkScript.prototype.shorten_company_name(my_query.fields.companyName)
        .replace(/^([A-Z]{2,}\s).*$/,"$1")
        .replace(/[\s\-\'\.]+/g,"").toLowerCase();
        var first=my_query.fields.companyName.split(" ")[0];
        /*if(short_b_name.indexOf(short_company_name)===-1 &&
           b_name.indexOf(acronym(MTurkScript.prototype.shorten_company_name(my_query.fields.companyName)))===-1
          && b_name.indexOf(first)===-1
          )
        {
            console.log("("+short_company_name+") not found in "+short_b_name);
            return true;
        }*/
        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        var max_depth=4,wiki_url="",wiki_name="",context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_context && (context=MTurkScript.prototype.parse_b_context(b_context)))
            {
                console.log("context="+JSON.stringify(context));
                if(context.Website) { resolve(context.Website); return; }
                if(context["Official site"]) { resolve(context["Official site"]); return; }
            }
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/home\.[a-z]*$/,"")
                .replace(/\/(en|en-us)\/.*$/,"").replace(/\/corporate\/.*$/,"");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,max_depth) && (!is_bad_name(b_name)||my_query.try_count>0)
                   && (b1_success=true)) break;
                if(i===0) max_depth=4;
                if(/en\.wikipedia\.org/.test(b_url)) {
                    wiki_url=b_url;
                    wiki_name=b_name.replace(/\s-\s.*$/,""); }
            }
            if(b1_success)
            {
                resolve(b_url);
                return;
            }
            if(wiki_url.length>0)
            {

                var wiki_query_url="https://en.wikipedia.org/w/api.php?action=query&prop=extlinks&format=json&titles="+encodeURIComponent(wiki_name);
                 console.log("** Doing wikipedia with "+wiki_query_url);
                GM_xmlhttpRequest({method: 'GET', url: wiki_query_url,
                                   onload: function(response) { parse_wiki_query(response,resolve,reject); },
                                   onerror: function(response) { console.log("Fail"); },
                                   ontimeout: function(response) { console.log("Fail"); }
                                  });
                return;
            }



        }
        catch(error)
        {
            reject(error);
            return;
        }
        if(my_query.try_count===0)
        {
            my_query.try_count++;
            if(country_map[my_query.country]) {
                query_search(my_query.companyName+" site:"+country_map[my_query.country],resolve,reject,query_response);
                return;
            }
            else reject("nothing found");
        }
        else
        {
            reject("Nothing found");
        }
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
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

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.web_url=result.replace(/(https?:\/\/[^\/]+).*$/,"$1");
        add_to_sheet();
        MTurk.check_and_submit();
    }

    function parse_wiki_query(response,resolve,reject) {
        var text=JSON.parse(response.responseText),x;
        console.log("response.responseText="+response.responseText);
        console.log("text.query.pages="+JSON.stringify(text.query.pages));
        var pages=text.query.pages,links,i;
        for(x in pages)
        {

            links=text.query.pages[x].extlinks;
            for(i=0; i < links.length; i++) {
                console.log("wiki: links["+i+"]="+links[i]["*"]);
                if(!MTurkScript.prototype.is_bad_url(links[i]["*"],bad_urls)
                  && (/\/\/www/.test(links[i]["*"]) ||
                      links[i]["*"].split(".").length<=2)
                  ) { resolve(links[i]["*"]); }
            }
        }
        reject("Nothing found on wiki");
    }


    function parse_forbes(response) {
        var text=JSON.parse(response.responseText);
        console.log("text.promotedContent="+JSON.stringify(text.promotedContent.contentPositions[0]));
        var data=text.promotedContent.contentPositions[0];
        my_query.fields.companyName=data.organizationName;
        my_query.long_name=data.description.match(/^([A-Z]+[A-Za-z&\.,-]*\s)*/)[0].trim();
        console.log("my_query.long_name="+my_query.long_name);
        my_query.country=data.country;
        add_to_sheet();
        var search_str=my_query.fields.companyName+" "+my_query.country;
        if(country_map[my_query.country]) search_str=search_str+" site:"+country_map[my_query.country];
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for "+search_str);
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    function add_to_sheet()
    {
        for(var x in my_query.fields) document.getElementById(x).value=my_query.fields[x];
    }

    var forbes_link="https://www.forbes.com/forbesapi/source/more.json?filter=&limit=1&listYear=2018&retrievedFields=&sort=&source=list&sourceType=organization"+
    +"&sourceValue=global2000&start=";
    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
	//var dont=document.getElementsByClassName("dont-break-out");
        my_query={rank:wT.rows[0].cells[1].innerText,fields:{},try_count:0};
        console.log("my_query="+JSON.stringify(my_query));

        var forbes_link="https://www.forbes.com/forbesapi/source/more.json?filter=&limit=1&listYear=2018&retrievedFields=&sort=&source=list&sourceType=organization"
    +"&sourceValue=global2000&start="+(my_query.rank-1);
        console.log("forbes_link="+forbes_link);
        GM_xmlhttpRequest({method: 'GET', url: forbes_link,
            onload: function(response) { parse_forbes(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });

       
    }

})();