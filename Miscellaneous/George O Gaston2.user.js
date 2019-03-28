// ==UserScript==
// @name         George O Gaston2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  One off part scrape
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.rockauto.com*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1IHW34XTHH3VD");
    var MTP=MTurkScript.prototype;

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

    function setCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
    function eraseCookie(name) {
        document.cookie = name+'=; Max-Age=-99999999;';
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
    function parse_result(doc,url,resolve,reject,response) {
        var parsed=JSON.parse(response.responseText),text="",i;
        console.log(response.responseText);
        var field=document.getElementsByName("Part Number")[0];
        var part_list=[];
        for(i=0;i<parsed.length;i++) {
            console.log("parsed["+i+"].mfG_part="+parsed[i].mfG_Part+", base_part="+parsed[i].basePart+", mfg="+parsed[i].mfg);
            if(parsed[i].mfG_Part===my_query.part && /Wells/i.test(parsed[i].mfg) && !part_list.includes(parsed[i].basePart)) part_list.push(parsed[i].basePart);
        }
        for(i=0;i<part_list.length;i++) text=text+(text.length>0?",":"")+part_list[i];
        if(part_list.length===0) text="0";
        field.value=text;
        MTurk.check_and_submit();

    }
    function parse_rockauto(doc,url,resolve,reject,response) {
        if(!/catalogapi\.php/.test(url)) return;
        var str="";
        console.log("In parse_rockauto, "+url);
        console.log(doc.body.innerHTML);
        var parsed=JSON.parse(response.responseText);
        var my_div=document.createElement("div");
        my_div.innerHTML=parsed.searchnoderesults;
        document.body.appendChild(my_div);
        console.log("my_div.innerHTML="+my_div.innerHTML);
        var number_lst=my_div.querySelectorAll(".listing-final-partnumber");
        var man_lst=my_div.querySelectorAll(".listing-final-manufacturer");
        if(man_lst.length===0) { GM_setValue("returnHit",true); return; }
        var i;
        for(i=0;i<number_lst.length;i++) {
            if(/WVE\/AIRTEX\/WELLS/.test(man_lst[i].innerText)) {
                str=str+(str.length>0?",":"")+number_lst[i].innerText; }
        }
        if(str.length===0) { GM_setValue("returnHit",true); return; }
        else resolve(str);
        var number=number_lst[number_lst.length-1],man=man_lst[man_lst.length-1];
        console.log("man="+man.innerText+", number="+number.innerText);
        /*if(/WVE\/AIRTEX\/WELLS/.test(man.innerText)) {
            resolve(number.innerText); }*/

    }

    function make_query(doc,url,resolve,reject) {
         var headers={"Content-Type":"application/x-www-form-urlencoded","Host":"www.rockauto.com",
                      "Origin":"https://www.rockauto.com","Referer":"https://www.rockauto.com/en/partsearch/"};

        var new_url="https://www.rockauto.com/catalog/catalogapi.php";
        var data={"dopartsearch": "1",
                  "prevurl": "/en/partsearch/",
                  "partsearch[partnum][partsearch_007]":my_query.part,
                  "partsearch[manufacturer][partsearch_007]":"",
                  "partsearch[partgroup][partsearch_007]":"",
                  "partsearch[parttype][partsearch_007]":"",
                  "partsearch[partname][partsearch_007]":"",
                  "partsearch[do][partsearch_007]": "1",
                  "func":"sendparttabsearch",
                  "payload": "{}",
                  "api_json_request": "1"};
        var data_str=MTP.json_to_post(data).replace(/\s/g,"+");
        console.log("data_str="+data_str);
        GM_xmlhttpRequest({method: 'POST', url: new_url,data:data_str,headers:headers,
                           onload: function(response) { var doc = new DOMParser()
                           .parseFromString(response.responseText, "text/html");

                                                       parse_rockauto(doc,response.finalUrl, resolve, reject,response); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });

        var promise=MTP.create_promise(new_url,parse_rockauto,resolve);

    }

    function parse_result_then(result) {
        document.getElementsByName("Part Number")[0].value=result;
        var inp=document.querySelector("input[type='text']"),i;
        var is_done=true;
        for(i=0;i<inp.length;i++) {
            if(inp.value.length===0) is_done=false; }
        if(is_done) MTurk.check_and_submit();
        else { GM_setValue("automate",false);
             GM_setValue("returnHit",true);
             }


    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var wT=document.querySelector("#mturk_form table");

        my_query={part:wT.rows[0].cells[1].innerText,fields:{},done:{},submitted:false};

        var promise=MTP.create_promise("https://www.rockauto.com/en/partsearch/",make_query,parse_result_then);

    }

    if(window.location.href.indexOf("rockauto.com")!==-1) {
        console.log("document.cookie="+document.cookie);
    }

})();