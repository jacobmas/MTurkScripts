// ==UserScript==
// @name         Victor Martin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse Music stuff
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
    var MTurk=new MTurkScript(30000,3000+Math.random()*2000,[],begin_script,"A1TFY6EKJJG1C4",true);
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
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    // #_concert_time, #_concert_place, #_concert_performers
    function insert_data(currnum,currplace,currhr,currmin,currperformers) {
        console.log("Adding "+currnum+" to sheet");
        my_query.fields[currnum+"_concert_time"]=currhr+":"+currmin;
        my_query.fields[currnum+"_concert_place"]=currplace;
        my_query.fields[currnum+"_concert_performers"]=currperformers;
        add_to_sheet();
    }
    function parse_text(text) {
        var i,curr;
        var currnum=0,currplace="",temp_place,extract_as_place=false,currhr,currmin;
        var currperformers="";
        var linessincehr=0;
        var hr_regex=/^\s*([\d]{2})[h:]{1}([\d]{0,2})([^\-]+|$)/,hr_match;
        var hr_regex_replace=/^\s*[\d]{2}[h:]{1}[\d]{0,2}[\-\s:]*/;
        var perf_type_regex=/(\s+[a-zâêîôûàèùéëïü0-9]{1}[^\s]*)*$/,perf_match,name_match;
        for(i=0;i<text.length;i++) {
            linessincehr++;
            console.log("text["+i+"]="+text[i]);
            text[i]=text[i].replace(/( a)? remplac(e|é) .*$/,"").replace(/[\s\.;:\?\+]*$/,"");
            if(extract_as_place) {
                currplace=text[i];
                continue;
            }
            if(hr_match=text[i].match(hr_regex)) {
                console.log("Matched hr");

                if(currnum>=1 && currnum<=5) {
                    currhr=currhr.toString();
                    if(currhr.length===1) currhr="0"+currhr;
                    currmin=currmin.toString();
                    if(currmin.length===1) currmin="0"+currmin;
                    if(currperformers.length>0) {
                        insert_data(currnum.toString(),currplace,currhr,currmin,currperformers);
                    }
                    else {
                        currnum--;
                        if(linessincehr>2) {
                            setTimeout(function() { GM_setValue("returnHit"+MTurk.assignment_id,true); }, 2000);
                            return;
                        }

                    }
                    currhr="";
                    currmin="";
                    currperformers="";
                }
                currnum++;
                currhr=hr_match[1];
                currmin=hr_match[2];
                if(currmin.length===0) currmin="00";
                temp_place=text[i].replace(/^.*[\d]{2}[h:]{1}[\d]{0,2}[\-\s:]*/,"").replace(/^\s*([\d]{2})[h:]{1}([\d]{0,2})/,"").trim();
                linessincehr=0;
                if(temp_place.length>2) currplace=temp_place.replace(/Programme modifié .*$/,"");
                else if(currplace==="") {
                    extract_as_place=true;
                    continue;
                }
            }
            else if(!/[:>]{1}/.test(text[i]) && !/^\s*(Musique|Concert)/.test(text[i]) &&
                    /(^[A-Z][^\s]*\s+[A-Z][^\s]*)/.test(text[i]) &&

                (perf_match=text[i].match(perf_type_regex)) && perf_match.length>0 && perf_match[0]&&perf_match[0].trim().length>3) {
                console.log("Matched performance");

                name_match=text[i].replace(perf_type_regex,"").trim();

                currperformers=currperformers+(currperformers.length>0?";":"")+name_match+","+perf_match[0];
                currperformers=currperformers.replace(/,,/g,",");
            }

        }
        if(currnum>=1 && currnum<=5) {
            currhr=currhr.toString();
            if(currhr.length===1) currhr="0"+currhr;
            currmin=currmin.toString();
            if(currmin.length===1) currmin="0"+currmin;

            if(currperformers.length>0) {
                insert_data(currnum.toString(),currplace,currhr,currmin,currperformers);
            }
            else {

                currnum--;
                if(linessincehr>2) {
                    setTimeout(function() { GM_setValue("returnHit"+MTurk.assignment_id,true); }, 2000);

                    return;
                }
            }
            currhr="";
            currmin="";
            currperformers="";
        }

        console.log("currnum="+currnum);
        if(currnum>0) {
            submit_if_done();
        }
        else {
            console.log("currnum=0, returning");
            setTimeout(function() { GM_setValue("returnHit"+MTurk.assignment_id,true); }, 2000);

        }
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
     //   var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
       // var dont=document.getElementsByClassName("dont-break-out");
        var card=document.querySelector("crowd-card");
        // #_concert_time, #_concert_place, #_concert_performers
        my_query={text:card.innerText.split("\n"),fields:{},done:{},submitted:false};
        parse_text(my_query.text);
	
    }

})();