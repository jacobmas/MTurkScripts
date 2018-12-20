// ==UserScript==
// @name         BrettCharney
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Allstate
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*allstate.com*
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
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"ASK7SBD2R8ZAF");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function is_good_allstate(b_url) {
        if(!/agents\.allstate\.com\/.+/.test(b_url)) return false;
        if(/\/usa\//.test(b_url) && my_query.try_count<2) return false;
        if(/agents\.allstate\.com\/locator\.html/.test(b_url)) return false;
        return true;
    }

    function parse_loc_hy(loc_hy) {
        var ret=[];
        var ent_cnt=loc_hy.querySelectorAll(".ent_cnt");
        console.log("ent_cnt.length="+ent_cnt.length);
        ent_cnt.forEach(function(elem) {
            var add=elem.querySelector("b_factrow");
            add=add?add.innerText:"·";
            var new_val={name:elem.querySelector("h2").innerText,
                        address:add.split("·")[0].trim(),phone:add.split("·")[1].trim(),
                        url:elem.querySelector("[aria-label='Website']").href};
            ret.push(new_val);
        });
        return ret;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var parsed_loc,loc_hy,mt_tleWrp;
        var yellowpages_url="";
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            loc_hy=doc.getElementById("loc_hy");
            mt_tleWrp=doc.getElementById("mt_tleWrp");
            if(type==="zip" && mt_tleWrp) {
                var title=mt_tleWrp.querySelector("h2");
                if(title) { resolve({result:title.innerText.replace(/\s*[\d]+$/,""),type:type}); return; }
                else { console.log("No mt_tleWrp"); GM_setValue("returnHit",true); return; }
            }
            if(loc_hy && (parsed_loc=parse_loc_hy(loc_hy))) { }
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                if(b_algo[i].tagName!=="LI") break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(yellowpages_url.length===0 && /yellowpages\.com/.test(b_url)) {
                    yellowpages_url=b_url; }
                if(/agents\.allstate\.com\/.+/.test(b_url) && is_good_allstate(b_url))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve({result:b_url,type:type});
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        if(parsed_loc) {
            for(i=0;i<parsed_loc.length;i++) {
                console.log("parsed_loc["+i+"]="+JSON.stringify(parsed_loc[i]));
                if(parsed_loc[i].url&&is_good_allstate(parsed_loc[i].url)) {
                    resolve({result:parsed_loc[i].url,type:type});
                    return;
                }
            }
        }
        if(yellowpages_url.length>0) my_query.yp_url=yellowpages_url;
        if(my_query.try_count===0) {
            my_query.try_count++;
            console.log("Trying with place");
            var search_str="allstate agent near "+my_query.place;
            query_search(search_str, resolve, reject, query_response,"query");
        }
        else if(my_query.try_count===1) {
            my_query.try_count++;
            console.log("Trying with state");
            var state=my_query.place.split(", ")[1].trim();
            console.log("### state="+state);
             let search_str="allstate agent near "+reverse_state_map[state];
            query_search(search_str, resolve, reject, query_response,"query");
        }
       /* else if(my_query.try_count<=2 && my_query.yp_url && my_query.yp_url.length>0) {
            console.log("Trying with yp "+my_query.yp_url);

            var promise=MTP.create_promise(my_query.yp_url,parse_yellowpages,parse_yellow_then);
            return;
        }*/
        else
        {
            reject("Nothing found"); }
        //        GM_setValue("returnHit",true);
        return;

    }
    /** TODO: add query conditions */
    function parse_yellowpages(doc,url,resolve,reject) {
        var mdm=doc.querySelectorAll(".search-results .mdm"),i,result={success:true},cats,new_url;
        for(i=0;i<mdm.length;i++) {
            var name=mdm[i].querySelector(".business-name"),addr=mdm[i].querySelector(".adr"),parsed_add,phone;
            phone=mdm[i].querySelector(".phone");
            if(addr&&(result.parsed_add=parseAddress.parseLocation(addr.innerText)) && name && (result.name=name.innerText)) {
                result.phone=phone?phone.innerText:"";
                if(cats=mdm[i].querySelector(".categories")) result.categories=cats.innerText;
                if(new_url=mdm[i].querySelector(".track-visit-website")) result.url=new_url.href;
                resolve(result);
                return;
            }
        }
        console.log("No yellowpages results");
        result.success=false;
        resolve(result);
        return;
    }
    function parse_yellow_then(result) {
        my_query.zip=result;
        console.log("Found zip in yellowpages "+my_query.zip);
        var search_str="allstate agent in "+my_query.zip;
         const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }



    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }
    function zip_promise_then(result) {
        console.log("in zip promise then ");
        my_query.place=result.result;
        var search_str="allstate agent in "+my_query.zip;
         const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }
    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("url="+result.result);
        var promise=MTP.create_promise(result.result,parse_allstate,parse_allstate_then,MTP.my_catch_func,0);
    }

    function parse_allstate(doc,url,resolve,reject,count) {
        console.log("allstate url="+url);
        if(count===undefined) count=0;
        var i;
        var contact=doc.querySelector(".Contact"),term;
        if(/\/usa\//.test(url)) {
            var links=doc.querySelectorAll(".c-directory-list-content-item-link");
            var new_url,promise;
            count++;
            for(i=0;i<links.length;i++) {
                new_url=MTP.fix_remote_url(links[i].href,url);
                if(!/\/usa\//.test(new_url)) {
                    promise=MTP.create_promise(new_url,parse_allstate,parse_allstate_then,MTP.my_catch_func,count);
                    return;
                }
            }
            console.log("FAiled to find new page");
            GM_setValue("returnHit",true);
            return;
        }
        var term_map={".c-address-street-1":"addressLine1",".c-address-street-2":"addressLine2",
                      ".c-address-city":"city",".c-address-state":"stateOrRegion",".c-address-postal-code":"zip",
                     ".c-phone-main-number-span":"phoneNumber",".email-button":"email",
                     ".c-phone-mobile-number-span":"phoneNumberMobile"};
        var x;
        var name=doc.querySelector(".agent-name");
        var email=doc.querySelector(".Contact .email-button");
        if(email) { console.log("email="+email.innerText); }
        if(name) my_query.fields.companyName=name.innerText.trim()
        for(x in term_map) {
            term=contact.querySelector(x);
            if(term) my_query.fields[term_map[x]]=term.innerText; }
        add_to_sheet();
        resolve();
    }

    function parse_allstate_then(result) {
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
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
       // var wT=document.getElementById("WebsiteDataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        var zip=dont[0].innerText.match(/Zip Code ([\d]+)/);
        my_query={zip:zip[1],fields:{},done:{},submitted:false,try_count:0};
        while(my_query.zip.length<5) my_query.zip="0"+my_query.zip;
        var search_str=my_query.zip;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning zip search");
            query_search(search_str, resolve, reject, query_response,"zip");
        });
        queryPromise.then(zip_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }
    function removeCookies() {
        var cookies = document.cookie.split("; ");
        for (var c = 0; c < cookies.length; c++) {
            var d = window.location.hostname.split(".");
            while (d.length > 0) {
                var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                var p = location.pathname.split('/');
                document.cookie = cookieBase + '/';
                while (p.length > 0) {
                    document.cookie = cookieBase + p.join('/');
                    p.pop();
                };
                d.shift();
            }
        }
    }
    if(window.location.href.indexOf("allstate.com")!==-1) {
       // removeCookies();
    }
})();
