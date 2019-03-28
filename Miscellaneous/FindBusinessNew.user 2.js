// ==UserScript==
// @name         FindBusinessNew
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hopefully evolves into a good no-email business scraper
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
    var bad_urls=["facebook.com","twitter.com","youtube.com","instagram.com","openfos.com","indeed.com","pinterest.com","amazonaws.com","mturkcontent.com",
                 "ipinfo.io"];
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A2GVX3QWGQ5KN8");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption)
    {
        var b_split=b_name.split(/\s*[\|\-]+\s*/);
        var regex=/[\.\']+/g,regex2=/\s*&\s*/,regex3=/\sgroup$/gi,i,lower_b,lower_my;
        lower_my=MTP.shorten_company_name(my_query.name).replace(/\s*Company.*$/,"").replace(regex2," and ").replace(/-.*/,"")
        .replace(regex,"").toLowerCase().replace(regex3,"").replace(/\s/g,"");
        for(i=0;i<b_split.length;i++) {
            console.log("b_split["+i+"]="+b_split[i]);
            lower_b=MTP.shorten_company_name(b_split[i].replace(/^Home( Page)?\s*((-|\|)\s*)?/i,"").replace(regex,"").replace(regex2," and ").toLowerCase()
                                             .replace(/ (-|\|) (welcome|official).*$/i,"")).replace(/\s+\|.*$/,"").replace(regex3,"").replace(/\s/g,"");
            if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        }
        console.log("lower_b="+lower_b+", lower_my="+lower_my);
        if(p_caption.indexOf(my_query.name)===0) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,hq_match;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(parsed_context=MTP.parse_b_context(b_context)) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.Website && !MTurkScript.prototype.is_bad_url(parsed_context.Website,bad_urls,-1)) my_query.fields.web_url=parsed_context.Website;
                
                if(parsed_context.Headquarters && (hq_match=parsed_context.Headquarters.match(/,\s*([^,]+)$/)) &&
                   (state_map[hq_match[1]] || reverse_state_map[hq_match[1]]))
                {
                   
                }
                else if(parsed_context.Headquarters && (hq_match=parsed_context.Headquarters.match(/,\s*([^,]+)$/))) {
                    my_query.fields.state="NA";
                    my_query.fields.country=hq_match[1]; }
                if(parsed_context.Phone) my_query.fields.phone=parsed_context.Phone;
                if(parsed_context.Address && (my_query.address=parsed_context.Address) &&
                   (my_query.parsed_add=parseAddress.parseLocation(my_query.address))) {
                    if(my_query.parsed_add.state && (state_map[my_query.parsed_add.state] || reverse_state_map[my_query.parsed_add.state])) {
                        my_query.fields.state=reverse_state_map[my_query.parsed_add.state] ? reverse_state_map[my_query.parsed_add.state] : my_query.parsed_add.state;
                        my_query.fields.country="United States";
                    }
                }
            }
            if(lgb_info && (parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) my_query.fields.web_url=parsed_lgb.url;
                if(parsed_lgb.phone) my_query.fields.phone=parsed_lgb.phone;
            }

            if(submit_if_done()) return;
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                if(my_query.try_count>0 && i>1) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                b_factrow=b_algo[i].getElementsByClassName("b_factrow");
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText.trim();
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(i<4 && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,3) && !is_bad_name(b_name,p_caption)
                  && my_query.fields.web_url.length===0) my_query.fields.web_url=b_url;
                if(b_factrow.length>0 && check_fact_row(b_algo[i],b_factrow[0],b_name,b_url) && submit_if_done()) return;
                if(/facebook\.com/.test(b_url) && !is_bad_fb_url(b_url) && !is_bad_name(b_name,p_caption) && my_query.fb_url===undefined) {
                    my_query.fb_url=b_url.replace(/(facebook\.com\/[^\/]+).*$/,"$1");
                     my_query.fb_about_url=my_query.fb_url
            .replace(/facebook\.com\//,"facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
                    var fb_home_promise=MTP.create_promise(my_query.fb_url,MTP.parse_FB_home,parse_fb_home_then);
                    var fb_promise=MTP.create_promise(my_query.fb_about_url,MTP.parse_FB_about,parse_fb_about_then);
                }


            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        //if(my_query.fields.web_url.length===0) my_query.fields.web_url="http://www.notfound.com";
        my_query.done["web"]=true;
        var is_done_stuff=true;
        if(!my_query.fb_about_url && my_query.try_count===0) {
            for(var y in my_query.fields) if(my_query.fields[y].length===0) is_done_stuff=false;
            if(is_done_stuff) my_query.done.fb_home=my_query.done.fb_about=true;
            else
            {
                my_query.try_count++;
                query_search(my_query.name+" "+my_query.industry+" site:facebook.com",resolve,reject,query_response);
                submit_if_done();
                return;
            }
        }
        else if(!my_query.fb_about_url) my_query.done.fb_home=my_query.done.fb_about=true;
        if(submit_if_done()) return;
        console.log("MOO");

       // reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

        function is_bad_fb_url(url) {
        return /\/(pages|groups|events)\//.test(url); }
    function parse_fb_home_then(result) {
        console.log("home: result="+JSON.stringify(result));
        if(result.url &&my_query.fields.web_url.length===0) { my_query.fields.web_url=result.url; }
        if(result.phone) { my_query.fields.phone=result.phone; }
        if(result.address && result.address.state && reverse_state_map[result.address.state] &&
          (my_query.fields.state.length===0 && my_query.fields.country.length===0)) {
            my_query.fields.state=reverse_state_map[result.address.state];
            my_query.fields.country="United States";
        }
        my_query.done.fb_home=true;
        submit_if_done();
    }

    function parse_fb_about_then(result) {
        console.log("about: result="+JSON.stringify(result));
        if(result.url&&my_query.fields.web_url.length===0) { my_query.fields.web_url=result.url; }
        if(result.phone) { my_query.fields.phone=result.phone; }
        my_query.done.fb_about=true;
        submit_if_done();
    }

    function check_fact_row(b_algo,b_factrow,b_name,b_url) {
        var inner_li=b_factrow.getElementsByTagName("li"),i,match,rx=/^([^:]*):\s*(.*)$/;
        for(i=0;i<inner_li.length;i++) {
            if(match=inner_li[i].innerText.match(rx)) {
                if(/Phone/i.test(match[1])) my_query.fields.phone=match[2];
                if(/Location/i.test(match[1]) && (my_query.address=match[2]))
                {
                    my_query.address=my_query.address.replace(/([\d]{5}),\s*([A-Z]{2})$/,"$2 $1");
                    console.log("my_query.address="+my_query.address);
                  if((my_query.parsed_add=parseAddress.parseLocation(my_query.address)) &&
                  my_query.parsed_add.state && (state_map[my_query.parsed_add.state] || reverse_state_map[my_query.parsed_add.state])&&
                     (my_query.fields.state.length===0 && my_query.fields.country.length===0)
                  ) {
                      my_query.fields.state=reverse_state_map[my_query.parsed_add.state] ? reverse_state_map[my_query.parsed_add.state] : my_query.parsed_add.state;
                      my_query.fields.country="United States";
                  }
                }

            }

        }
        return true;
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
        my_query.fields.web_url=result;
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
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
        if(my_query.fields.country==="United States") my_query.fields.phone=my_query.fields.phone.replace(/^\+[\d]+\s*/,"");
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x,field,is_done_dones=true;
        for(x in my_query.done) if(!my_query.done[x]) is_done=is_done_dones=false;
        //if(is_done_dones && my_query.fields.web_url.length===0) my_query.fields.web_url="http://www.notfound.com";
        for(x in my_query.fields) if((field=my_query.fields[x]).length===0) {
            console.log("field["+x+"].length="+field.length);
            is_done=false; }
        add_to_sheet();


        if(is_done && !my_query.submitted && (my_query.submitted=true)) { MTurk.check_and_submit(); return true; }
        else if(!is_done && is_done_dones) { console.log("Returning"); GM_setValue("returnHit",true);}
        return false;
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        
        my_query={name:wT.rows[0].cells[1].innerText,city:wT.rows[1].cells[1].innerText,state:wT.rows[2].cells[1].innerText,
                  fields:{web_url:""},done:{"web":false,"fb_about":false,"fb_home":false},submitted:false,
                 try_count:0};
       

        var search_str=my_query.name+" ";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();