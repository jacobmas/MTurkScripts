// ==UserScript==
// @name         Brett Hollenbeck
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  query dor.wa.gov
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
// @connect dor.wa.gov
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1BIFB8JMRECJC",true);
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
     function parse_dorwa3(response) {
         var parsed=JSON.parse(response.responseText);
        var doc = new DOMParser()

        .parseFromString(parsed.html, "text/html");

     console.log("parse_dorwa3");
        var url=response.finalUrl;
         var table,i;

        console.log("in parse_dorwa\n"+response.finalUrl);
        console.log(response);
        console.log("response="+JSON.stringify(response));
         console.log("doc.body.innerHTML="+doc.body.innerHTML);
         my_query.fields.name=doc.querySelector("#caption2_c-a").innerText;
          my_query.fields.legalname=doc.querySelector("#caption2_c-d").innerText;
         my_query.fields.type=doc.querySelector("#cl_c-f").innerText;
         table=doc.querySelector("#c-12");
         console.log("table.rows.length="+table.rows.length);
         for(i=2;i<table.rows.length&&i<12;i++) {
             my_query.fields["people"+(i-1)]=table.rows[i].cells[0].innerText.trim(); }
         submit_if_done();
     }
    function parse_dorwa2(response) {
  var parsed=JSON.parse(response.responseText);
        var doc = new DOMParser()

        .parseFromString(response.responseText, "text/html");
        console.log("At parse_dorwa2 !!!!");

        var url=response.finalUrl;
         var table,i,x;
        var resp_headers=response.responseHeaders.split("\r\n");
        var key_map={"fast-ver-last":"FAST_VERLAST__","fast-ver-source":"FAST_VERLAST_SOURCE__"};
        var resp_map={"c-81":my_query.id};
        var match,regex=/^([^:]*):\s*(.*)$/,key,val;
        for(i=0;i<resp_headers.length;i++) {
            if((match=resp_headers[i].match(regex))) {
                console.log("dorwa2: Matched "+match);
                key=match[1];
                if(key_map[key]) resp_map[key_map[key]]=match[2].trim();
            }
        }
       var headers={"Origin":"https://secure.dor.wa.gov","Referer":"https://secure.dor.wa.gov/gteunauth/_/",
                    "Host":"secure.dor.wa.gov","Content-Type":"application/x-www-form-urlencoded"};
       var data={"c-f":"true",
"c-i":"false","c-l":"false","c-o":"false","c-r":"false","c-21":"",
"c-81":"6032861710010001",
"c-e1":"","c-m1":"","c-p1":"","c-s1":"","c-v1":"","c-32":"",
"c-d2":"","c-j2":"","c-r2":"","c-x2":"","c-y2":"","c-33":"","c-b3":"","c-h3":"",
"LASTFOCUSFIELD__":"c-81",
"DOC_MODAL_ID__":"0",
"EVENT__":"c-44-1",
"TYPE__":"0",
"CLOSECONFIRMED__":"false",
"FAST_SCRIPT_VER__":"1",
"FAST_VERLAST__":"16._._.QsGa6h09LZqXVxm1InR6XsJMl6I1",
"FAST_VERLAST_SOURCE__":"_:EventOccurred:292338546 @ 2019-03-08 10:02:51.3922",
"FAST_CLIENT_WHEN__":"1552068191278",
"FAST_CLIENT_WINDOW__":"FWDC.WND-6427-b330-a4eb",
"FAST_CLIENT_AJAX_ID__":"4",
"FAST_CLIENT_TRIGGER__":"Events.Field.keydown:ENTER",
"FAST_CLIENT_SOURCE_ID__":"c-81"
                };
        for(x in data) {
            if(resp_map[x]) data[x]=resp_map[x]; }
        var data_str=MTurkScript.prototype.json_to_post(data).replace(/%20/g,"+");
        console.log("data_str="+data_str);
        var event_url="https://secure.dor.wa.gov/gteunauth/_/EventOccurred";
        GM_xmlhttpRequest({method: 'POST', url: event_url,headers:headers,data:data_str,
                           onload: function(response) {
                               parse_dorwa3(response);

                           },
                           onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                          });
     }

    function parse_dorwa(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var url=response.finalUrl;
        console.log("IN parse_dorwa\n"+response.finalUrl);
        var resp_headers=response.responseHeaders.split("\r\n");
        var key_map={"fast-ver-last":"FAST_VERLAST__","fast-ver-source":"FAST_VERLAST_SOURCE__"};
        var resp_map={"c-81":my_query.id};
        var i,x,match,regex=/^([^:]*):\s*(.*)$/,key,val;
        for(i=0;i<resp_headers.length;i++) {
            if((match=resp_headers[i].match(regex))) {
              //  console.log("Matched "+match);
                key=match[1];
                if(key_map[key]) resp_map[key_map[key]]=match[2].trim();
            }
        }

        console.log("resp_map="+JSON.stringify(resp_map));
        console.log("response="+JSON.stringify(response));
        console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var headers={"Origin":"https://secure.dor.wa.gov","Referer":"https://secure.dor.wa.gov/gteunauth/_/",
                    "Host":"secure.dor.wa.gov","Content-Type":"application/x-www-form-urlencoded"};
       var data={"c-f":"true",
"c-i":"false","c-l":"false","c-o":"false","c-r":"false","c-21":"",
"c-81":"6032861710010001",
"c-e1":"","c-m1":"","c-p1":"","c-s1":"","c-v1":"","c-32":"",
"c-d2":"","c-j2":"","c-r2":"","c-x2":"","c-y2":"","c-33":"","c-b3":"","c-h3":"",
"LASTFOCUSFIELD__":"c-81",
"DOC_MODAL_ID__":"0",
"EVENT__":"c-81",
"TYPE__":"1",
"CLOSECONFIRMED__":"false",
"FAST_SCRIPT_VER__":"1",
"FAST_VERLAST__":"16._._.QsGa6h09LZqXVxm1InR6XsJMl6I1",
"FAST_VERLAST_SOURCE__":"_:EventOccurred:292338546 @ 2019-03-08 10:02:51.3922",
"FAST_CLIENT_WHEN__":"1552068191278",
"FAST_CLIENT_WINDOW__":"FWDC.WND-6427-b330-a4eb",
"FAST_CLIENT_AJAX_ID__":"4",
"FAST_CLIENT_TRIGGER__":"Events.Field.keydown:ENTER",
"FAST_CLIENT_SOURCE_ID__":"c-81"
                };
        for(x in data) {
            if(resp_map[x]) data[x]=resp_map[x]; }
        var data_str=MTurkScript.prototype.json_to_post(data).replace(/%20/g,"+");
        console.log("data_str="+data_str);
        var event_url="https://secure.dor.wa.gov/gteunauth/_/EventOccurred";
        GM_xmlhttpRequest({method: 'POST', url: event_url,headers:headers,data:data_str,
                           onload: function(response) {
                               parse_dorwa2(response);

                           },
                           onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                          });
    }
/* FAST_SCRIPT_VER__: 1
FAST_VERLAST__: 15._._.IcDXzFABPK4XjyyITpvTyqEHp8U1
FAST_VERLAST_SOURCE__: _:Page:92494000 @ 2019-03-08 10:02:43.1891
FAST_CLIENT_WHEN__: 1552068170913
FAST_CLIENT_WINDOW__: FWDC.WND-6427-b330-a4eb
FAST_CLIENT_AJAX_ID__: 3
FAST_CLIENT_TRIGGER__: Events.Field.keydown:ENTER
FAST_CLIENT_SOURCE_ID__: c-81 */
    function init_Query()
    {
        var input=document.querySelectorAll("crowd-input");
        input.forEach(function(elem) { input.type="text";
                                      input.required=false; });
        var input2=document.querySelectorAll("input");
        input2.forEach(function(elem) { input.type="text";
                                      input.required=false; });
        console.log("in init_query");
        var a=document.querySelectorAll("form a");
        
        my_query={id:a[1].innerText,fields:{"name":"","legalname":"","type":"","trade1":""},
                  done:{},submitted:false};
        console.log("my_query="+JSON.stringify(my_query));
        var headers={"Origin":"https://secure.dor.wa.gov","Referer":"https://secure.dor.wa.gov/gteunauth/_/",
                    "Host":"secure.dor.wa.gov","Content-Type":"application/x-www-form-urlencoded"};
       var data={
"LASTFOCUSFIELD__":"c-81",
"DOC_MODAL_ID__":"0",
"EVENT": "0",

"TYPE__":"0",
"CLOSECONFIRMED__":"false",
"FAST_SCRIPT_VER__":"1",
"FAST_VERLAST__":"16._._.QsGa6h09LZqXVxm1InR6XsJMl6I1",
"FAST_VERLAST_SOURCE__":"_:EventOccurred:292338546 @ 2019-03-08 10:02:51.3922",
"FAST_CLIENT_WHEN__":"1552068191278",
"FAST_CLIENT_WINDOW__":"FWDC.WND-6427-b330-a4eb",
"FAST_CLIENT_AJAX_ID__":"4",
"FAST_CLIENT_TRIGGER__":"Events.Field.keydown:ENTER",
"FAST_CLIENT_SOURCE_ID__":"c-8"
                };
        var data_str=MTurkScript.prototype.json_to_post(data).replace(/%20/g,"+");
        console.log("data_str="+data_str);
        var event_url="https://secure.dor.wa.gov/gteunauth/_/Navigate";
        GM_xmlhttpRequest({method: 'POST', url: event_url,headers:headers,data:data_str,
                           onload: function(response) {
                               parse_dorwa(response);

                           },
                           onerror: function(response) { console.log("Fail"); },ontimeout: function(response) { console.log("Fail"); }
                          });
    }

})();