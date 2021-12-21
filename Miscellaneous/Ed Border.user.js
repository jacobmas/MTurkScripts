// ==UserScript==
// @name         Ed Border
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  IMDB urls for shows
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1I5RIGPFUW2RM",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name, name, p_caption, i)
    {
        if(!MTurkScript.prototype.is_bad_name(b_name.replace(/[\"\(].*$/,"").trim(), name, p_caption, i)) return false;
        if(!MTurkScript.prototype.is_bad_name(b_name.replace(/[\"\(].*$/,"").replace(/\s\-\s/,": ").trim(), name, p_caption, i)) return false;

        console.log("p_caption=",p_caption,", name=",name);
        console.log(p_caption.toLowerCase().indexOf(name.toLowerCase()));
        if(p_caption.toLowerCase().indexOf(name.toLowerCase())===0) return false;
        return true;
    }

    function parse_movie(the_div) {
        var result={};
        let title;
        if((title=the_div.querySelector(".b_entityTitle"))) result.title=title.innerText.trim();
        return result;
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
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            let temp="";

            let movie=b_context.querySelector("[data-feedbk-ids='Movie']");
            let tv;
            if(movie) {
               let result=parse_movie(movie);
                console.log("result=",result);
            }

            if(b_context && ((temp=b_context.querySelector("a[href*='//www.imdb.com/title']")))

               && /imdb\.com/.test(temp.href)) {
                console.log("temp.href=",temp.href);
               //resolve(temp.href);
               //return;

            }
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.imdb && (!my_query.year || !parsed_context['Release date'] ||
                                       (parsed_context['Release date'] && new RegExp(my_query.year).test(parsed_context['Release date'])))) {
                resolve(parsed_context.imdb);
                return;
            }
            else if(parsed_context.people && parsed_context.people[0].url && my_query.try_count[type]===0) {
                my_query.try_count[type]++;
                GM_xmlhttpRequest({method: 'GET', url:  parsed_context.people[0].url,
                           onload: function(response) { query_response(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
                return;
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length && i < 1; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
               b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(b_url.match(/https:\/\/www\.imdb\.com\/title\/[^\/]+\/?/) &&
                   (matches_year(b_name)||matches_year(p_caption)) &&

                   !is_bad_name(b_name,my_query.short_name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(my_query.short_name +" "+(my_query.year?my_query.year:"")+" site:imdb.com/title", resolve, reject, query_response,"query");
            return;
        }
        reject("Nothing found");
    }

    function matches_year(b_caption) {
        var i;
        if(my_query.year==="") return true;
        for(i=-10; i<=10; i++) {
            let r=new RegExp("\("+(my_query.year+i)+"\)");
            //console.log("r=",r);
            if(b_caption.match(r)) return true;
        }
        return false;
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
        my_query.fields.imdb_id=result.match(/https?:\/\/www\.imdb\.com\/title\/([^\/]+)/)[1];
        submit_if_done();
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var div=document.querySelector("crowd-form div div div");
        var node;
        var name=document.querySelector("crowd-form a").innerText.trim().replace(/â€“/,"-").trim();
        var short_name=name.replace(/\s*-\s.*$/,"").trim();
        var x;
        for(x of div.childNodes) {
            //console.log("x=",x,", textContent=",x.textContent);
        }
        var addl=div.childNodes[6].textContent.trim();
        var year="",cast="",cast_list=[];
        try {
            year=addl.match(/Year:\s*(\d+)/)[1];

        }
        catch(error) { }
        try {
            cast=addl.match(/Cast:\s*(.*)$/)[1];
            cast_list=cast.split(/,\s*/);
        }
        catch(error) { }
        console.log("name=",name);

        my_query={name:name,short_name:short_name,year:parseInt(year),cast_list:cast_list, fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};

        if(/^NOT N /.test(my_query.name)) {
            my_query.fields.imdb_id="EMPTY";
            setTimeout(submit_if_done,1200);
            return;
        }

	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name +" ";
        if(cast_list.length>0) {
            let x;
            for(x of cast_list) search_str+=x+" ";
        }
        else {
            search_str+=(my_query.year?my_query.year:"")
        }

        search_str=search_str+" site:imdb.com/title";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();