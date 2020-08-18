// ==UserScript==
// @name         FindLinkedinBoardMember
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Dan Van Meer
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
// @grant GM_deleteValue
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A2SHJ69QV9K7CP",true);
    var MTP=MTurkScript.prototype;
    var name_classes={"Virginia":["Ginny"]};
    function is_bad_name(b_name)
    {

        if(!b_name.match(new RegExp("(^|[^A-Za-z]{1})"+my_query.fname.charAt(0),"i")) || !b_name.match(new RegExp(my_query.lname,"i"))) return true;
        return false;
    }

    function is_good_marketscreen(b_name,b_url,p_caption,i) {
        var person_name=b_name.replace(/\s-\s.*$/,"");
        var fullname=MTP.parse_name(person_name);
        console.log("is_good_marketscreen,fullname="+JSON.stringify(fullname)+", MTP.fullname="+JSON.stringify(my_query.fullname));
        if(MTP.removeDiacritics(fullname.lname).toLowerCase()===MTP.removeDiacritics(my_query.fullname.lname).toLowerCase() &&
           MTP.removeDiacritics(fullname.fname).toLowerCase()[0]===MTP.removeDiacritics(my_query.fullname.fname).toLowerCase()[0]) {
            return true;
        }
        return false;
    }

    function is_bad_linkedin(b_url) {
        if(!/linkedin\.com/.test(b_url)) return true;
        if(/\/directory|pub|pulse\//.test(b_url)) return true;
        return false; }

    function query_response(response,resolve,reject,call_type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        var people_regex=new RegExp("(.{1,50}) at (.*)","i"),people_match;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(call_type==="linkedin" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.Current) my_query.fields.title=parsed_context.Current.replace(/\s+(at|-)\s+.*$/,"");
                else if(parsed_context.people) {
                    for(i=0;i<parsed_context.people.length;i++) {
                        if(parsed_context.people[i]["Job title"]!==undefined &&
                           (people_match=parsed_context.people[i]["Job title"].match(people_regex))) {
                            console.log("people_match="+JSON.stringify(people_match));
                            if(MTP.matches_names(my_query.short_company,people_match[2])) my_query.fields.title=people_match[1].trim();
                        }
                    }
                }
                //
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<2; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(call_type==="marketscreener" && is_good_marketscreen(b_name,b_url,p_caption,i)) {
                    resolve(b_url);
                    return;
                }
                else if(call_type==="linkedin" && !is_bad_name(b_name.replace(/ - .*$/,"")) && !is_bad_linkedin(b_url) && (b1_success=true)) break;
            }
            if(call_type==='linkedin' && b1_success)
            {
                let split,p_regex=new RegExp("[^\\.]+\\.([^\\.]{1,40}) at "+my_query.short_company,"i"),p_match;
                if(my_query.fields.title.length===0) {
                    split=b_name.split(/\s+[\-\|]{1}\s+/);
                    console.log("split="+JSON.stringify(split));
                    if(split.length>2) my_query.fields.title=split[1].trim();
                    else if(p_caption&&(p_match=p_caption.match(p_regex))) my_query.fields.title=p_match[1].trim();
                }
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            console.log("Failed here");
            reject(error);
            return;
        }
        console.log("call_type="+call_type);
         if(call_type==='linkedin' && my_query.try_count===0) {
            my_query.try_count++;
            query_search(my_query.name+" "+my_query.short_company+" linkedin", resolve, reject, query_response,"linkedin");
            return;
        }

        else if(call_type==='marketscreener') {
            console.log("MOO");
            query_search(my_query.fname+" "+my_query.lname+" \""+my_query.short_company+"\" site:linkedin.com", resolve, reject, query_response,"linkedin");
            return;
        }

      
       

        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,call_type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,call_type); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function marketscreen_promise_then(result) {
        console.log("result="+result);
        var promise=MTP.create_promise(result,parse_marketscreen,parse_marketscreen_then,function(result) {
            console.log("Failed marketscreen");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
            );
    }

    function parse_marketscreen(doc,url,resolve,reject) {

        var tabbor=doc.querySelector("#myCENTER .tabElemNoBor .nfvtTab");
        var tr,i,name,title;
        if(!tabbor) { resolve(my_query.short_company); return; }
        for(i=1;i<tabbor.rows.length;i++) {
            tr=tabbor.rows[i];
            name=tr.cells[0].innerText;

            title=tr.cells[1].innerText;
            console.log("name="+name+",title="+title);
            if(/Chief Executive|(^Chief)|CTO|CIO|CEO|CFO|President|Managing (Director|Partner)/.test(title)) {
                console.log("Success on "+name);
                resolve(name);
                return;
            }
        }
        console.log("Found no good company in marketscreen");
        resolve(my_query.company);
    }

    function parse_marketscreen_then(result) {
        my_query.company=result;
        my_query.short_company=MTP.shorten_company_name(result);
        var search_str=my_query.fname+" "+my_query.lname+" \""+my_query.short_company+"\" site:linkedin.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search with "+search_str);
            query_search(search_str, resolve, reject, query_response,"linkedin");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("result="+result);
        my_query.fields.companyName=result;
                console.log("my_query.fields="+JSON.stringify(my_query.fields));

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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else {
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return; }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        //var wT=document.getElementsByTagName("table")[0];
        var target=document.querySelectorAll("form div p");
        var name=target[0].innerText.replace(/^[^:]*:\s*/,"").replace(/^Doctor /,"");
        var company=target[1].innerText.replace(/^[^:]*:\s*/,"");
    //    console.log("target_text="+target_text);
        var reg=/^(.*)\s+at\s+(.*)/,match;
//        match=target_text.match(reg);


        my_query={name:name,
                  company:company,
                  fields:{firstName:"",lastName:"",title:"Blop",companyName:""},done:{},submitted:false,try_count:0};
      //  my_query.short_name=my_query.name.replace(/^Dr\.?\s*/,"").replace(/,.*$/,"").trim();
        my_query.short_company=MTP.shorten_company_name(my_query.company).replace(/\s*LLP$/,"");
        my_query.name=my_query.name.replace(/\([^\)]*\)\s/,"");
        var fullname=MTP.parse_name(my_query.name);
        my_query.fname=fullname.fname;
        my_query.fullname=fullname;
        my_query.lname=fullname.lname;
        my_query.fields.firstName=fullname.fname;
        my_query.fields.lastName=fullname.lname;
        add_to_sheet();
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" site:marketscreener.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search with "+search_str);
            query_search(search_str, resolve, reject, query_response,"marketscreener");
        });
        queryPromise.then(marketscreen_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });


       /* var search_str=my_query.fname+" "+my_query.lname+" \""+my_query.short_company+"\" site:linkedin.com";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search with "+search_str);
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

        */
    }

})();