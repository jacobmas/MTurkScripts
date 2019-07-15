// ==UserScript==
// @name         GovernmentNFC
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrapestar Government
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include *
// @grant GM_deleteValue
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/29de2e818626c6f93498fa003eb6a3141894dedb/Govt/Government.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
     var MTurk=new MTurkScript(40000,200,[],begin_script,"A1TF2W0DUNJVQA",false);
    /* Gov.script_loaded is a map of urls to number loaded there, script total is a map of urls to total number needed there */
   
    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name)
    {
        return false;
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
        my_query.url=result;
        var dept_regex_lst=[/City Manager|City Administrator/i];
        var query={"dept_regex_lst":dept_regex_lst};
        //Gov.init_Gov(my_query.url,query);

    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }


    /**  Gov.identify_site works with the MTurkScript.prototype.create_promise format to
     * identify the "type" of municipal govt website, then resolves and does the callback
     * of govt website */
    Gov.identify_site=function(doc,url,resolve,reject) {
        console.time("id_promise");
        Gov.home=doc;
        Gov.home_url=url;
        Gov.id_resolve=resolve;
        Gov.id_reject=reject;
        Gov.id_from_links(doc,url,resolve,reject,0);
    };

    /**
     * Gov.id_from_links searches to a level/depth of 1 to find links that identify the Content Management System
     * powering the site to enable how to best do scrapes
     *  */
    Gov.id_from_links=function(doc,url,resolve,reject,level) {
        var i;
        var links=doc.links,scripts=doc.scripts;
        var follow_lst=[],promise_lst=[],gov_match;
        console.log("url="+url+", level="+level);
        for(i=0; i < links.length; i++)
        {
            if(Gov.id_promise.done) return;
            if(gov_match=links[i].href.match(Gov.id_regex))
            {
                Gov.id_promise.done=true;
                Gov.id_resolve(gov_match[0].replace(/\.com$/,""));
                return;
            }
            if(/Copyright/.test(links[i].innerText)) follow_lst.push(
                MTurkScript.prototype.fix_remote_url(links[i].href,url));
        }

        if(level===0)
        {
            Gov.follow_done=0;
            Gov.follow_count=follow_lst.length;
            if(follow_lst.length===0)
            {
                Gov.id_promise.done=true;
                Gov.id_resolve("none");
                return;
            }
            for(i=0; i < follow_lst.length; i++)
            {
                console.log("follow_lst["+i+"].href="+follow_lst[i]);
                promise_lst.push(MTurkScript.prototype.create_promise(follow_lst[i],
                                                         Gov.id_from_links,MTurkScript.prototype.my_catch_func,
                                                        MTurkScript.prototype.my_catch_func,level+1));
            }
        }
        else
        {
            Gov.follow_done++;
            if(Gov.follow_done>=Gov.follow_count && !Gov.id_promise.done)
            {
                Gov.id_promise.done=true;
                Gov.id_resolve("none");
                return;
            }
        }
        return;

    };
    /* Gov.gov_id_promise_then following resolving the type of site. It then calls the scraper for that type of site
     * (TODO) lots
    */
    Gov.gov_id_promise_then=function(result) {
        console.timeEnd("id_promise");
        Gov.id_promise.done=true;
        Gov.id=result;
        console.log("id result="+result);
        Gov.scrape_promise=new Promise((resolve,reject) => {
            Gov["scrape_"+Gov.id](Gov.home,Gov.home_url,resolve,reject);
        })
        .then(function(response) { console.log("scrape_response="+JSON.stringify(response)); });


    };

    /** Gov.init_Gov will initialize government search being given a url (string) and a query (object)
     *
     * query:{dept_regex_lst:array,title_regex_lst:array} for now querytype should always be search, dept_regex_lst
     * should be a list of regular expressions that correspond to good either department or title
     */
    Gov.init_Gov=function(url,query)
    {
        let id_regex_str="",x;
        for(x in Gov.scrapers) {
            if(x!=="none")
            {
                if(id_regex_str.length>0) id_regex_str=id_regex_str+"|";
                id_regex_str=id_regex_str+x+"\\.com"; }
        }
        Gov.url=url;
        Gov.query=query;
      //  console.log("Gov.query="+JSON.stringify(query));
        if(Gov.query.dept_regex_lst===undefined) {
            Gov.query.dept_regex_lst=[];
        }
        console.log("Gov.query.dept_regex_lst="+JSON.stringify(Gov.query.dept_regex_lst));
        Gov.dept_links=[];


        Gov.id_regex=new RegExp(id_regex_str);
        console.log("Gov.id_regex="+Gov.id_regex);
        /* Identifies the site type if any, then id_promise_then */

        Gov.id_promise=MTurkScript.prototype.create_promise(url,Gov.identify_site,Gov.gov_id_promise_then);
        Gov.id_promise.done=false;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function cityManager_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var text = ""+e.clipboardData.getData("text/plain");
        console.log("text="+text);
        var parsed=Gov.parse_data_func(text);
        console.log("parsed="+JSON.stringify(parsed));
        if(parsed.name) {
            var fullname=MTurkScript.prototype.parse_name(parsed.name);
            my_query.fields[my_query.prefix+'FirstName']=fullname.fname;
            my_query.fields[my_query.prefix+'LastName']=fullname.lname;
        }
        if(parsed.phone) my_query.fields[my_query.prefix+'Phone']=parsed.phone;
        if(parsed.email) my_query.fields[my_query.prefix+'Email']=parsed.email;
         if(parsed.title) my_query.fields[my_query.prefix+'Title']=parsed.title;
        submit_if_done();



    }


    function init_Query()
    {
        //var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("WebsiteDataCollection").getElementsByTagName("table")[0];
        var input=document.querySelector("input.form-control");


        my_query={search_str:wT.rows[0].cells[1].innerText.replace(/^.*q\=site:\s*/,"").replace(/^.*q\=\s*/,"").replace(/\+/," "),
                  prefix:'parkDirector',
fields:{}};
        my_query.prefix=input.name.replace(/FirstName$/,"");
        GM_setClipboard(my_query.url);
        document.querySelector("input[id$='FirstName']").addEventListener("paste",cityManager_paste);

        console.log("query="+JSON.stringify(my_query));
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.search_str+" parks", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

     /*   var my_promise=new Promise((resolve,reject) => {

            Gov.identify_site(document,window.location.href,resolve,reject);
        });*/
    }


})();