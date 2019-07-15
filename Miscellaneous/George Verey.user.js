// ==UserScript==
// @name         George Verey
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @connect google.com
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
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A6FLFTMPMUXR2",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,i)
    {
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        if(p_caption.indexOf(MTP.shorten_company_name(my_query.name))!==-1) return false;
        return true;
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
                if(/10times\.com/.test(b_url) &&
                   !/\/(exhibitors|visitors|speakers|conferences)$/.test(b_url) && !/\/(venues|profile)\//.test(b_url) &&
                   !is_bad_name(b_name.replace(/,.*$/,""),p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" site:10times.com", resolve, reject, query_response,"query");
            return;
        }
        reject("Nothing found");
        return;
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
        console.log("b_url="+result);
        add_to_sheet();
        var promise=MTP.create_promise(result,parse_10times,parse10times_then,function(response) {
            console.log("Failed, response="+response);
            my_query.fields["Event Website"]="None Found";

            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        });
    }
    function parse_10times(doc,url,resolve,reject) {
        console.log("parse_10times,url="+url);
        if(!/\/company\//.test(url)) {
            my_query.fields["Event Website"]=url;
            parse_10timesevent(doc,url,resolve,reject);
            return;
        }

        var month_map={"Jan":"January","Feb":"February","Mar":"March","Apr":"April","May":"May","Jun":"June","Jul":"July","Aug":"August",
                       "Sep":"September","Oct":"October","Nov":"November","Dec":"December"};
        var x,new_url,month_val;
        var evt=doc.querySelector(".event-list .box-link");
        if(evt && evt.tagName==="TR") {
            new_url=evt.querySelector("a").href;
            my_query.fields["Event Website"]=new_url;

            my_query.fields["Name of Event"]=evt.querySelector("a").innerText.trim();
            month_val=evt.cells[0].innerText.match(/^[\d\s\-]+\s([A-Z][a-z]{2})/);
            if(month_val) {
                my_query.fields["Month of Event"]=month_map[month_val[1]]||"";
                add_to_sheet();
            }
            var promise=MTP.create_promise(new_url,parse_10timesevent,resolve,reject);
            return;
        }
        console.log("No events found");
        reject("");

    }
    function parse_10timesevent(doc,url,resolve,reject) {
        console.log("parse_10timesevent,url="+url);
        var month_map={"Jan":"January","Feb":"February","Mar":"March","Apr":"April","May":"May","Jun":"June","Jul":"July","Aug":"August",
                       "Sep":"September","Oct":"October","Nov":"November","Dec":"December"};
        var a=doc.querySelectorAll("table.mng a"),x,match,h1;
        var date_re=/^([\d\s\-]+)\s([A-Z][a-z]{2}).*([\d]{4})$/;
        if(my_query.fields["Name of Event"]===undefined&&(h1=doc.querySelector("h1"))) {
            var span=doc.querySelector(".lead span");
            if(match=span.innerText.match(date_re)) {
                /*if(parseInt(match[3])<2019) {
                    reject("");
                    return;
                }*/
                my_query.fields["Month of Event"]=month_map[match[2]]||"";

            }
            my_query.fields["Name of Event"]=h1.innerText.trim();


        }
        for(x of a) {
//            console.log("x.href="+x.href+",x.innerText="+x.innerText);
            if(/\/visitors$/.test(x.href)) {
               // console.log("Matched visitors");
                my_query.fields["Number of Attendees"]=x.innerText.trim(); }
            if(/\/exhibitors$/.test(x.href)) my_query.fields["Name of Exhibitors"]=x.innerText.trim();
        }
        var mng=doc.querySelector("table.mng");
        if(my_query.fields["Name of Exhibitors"]===undefined&&mng.rows.length>=2 && mng.rows[1].cells.length>=1) {
            match=mng.rows[1].cells[0].innerText.match(/([\d\s\-]+)\sExhibitors/);
            if(match) my_query.fields["Name of Exhibitors"]=match[1].trim();
        }
        if(my_query.fields["Number of Attendees"]===undefined&&mng.rows.length>=2 && mng.rows[1].cells.length>=1) {
            match=mng.rows[1].cells[0].innerText.match(/([\d\s\-]+)\s(Visitors|Delegates)/);
            if(match) my_query.fields["Number of Attendees"]=match[1].trim();
        }
        resolve("");
        return;

    }

    function parse10times_then(result) {
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
        var comp=document.querySelector("form div div div");
        console.log("comp.innerText="+comp.innerText);
        var x;
        my_query={name:comp.childNodes[4].textContent.trim(),
                  fields:{"Event Website":""},try_count:{"query":0},
                  done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=MTP.shorten_company_name(my_query.name);
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" 10times", resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            my_query.fields["Event Website"]="None Found";
            add_to_sheet();
            //submit_if_done();
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true);
        });
    }

})();
